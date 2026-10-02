// backend/src/api/deliveries.js
import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import deliveriesService from '../services/deliveriesService.js';

const router = Router();

// ============================================
// HELPERS
// ============================================
const handleError = (res, error, fallbackMessage = 'Request failed') => {
  const message = error?.message || fallbackMessage;
  const status =
    /not found/i.test(message) ? 404
    : /not your|only the|cannot|already|own/i.test(message) ? 403
    : /required|must|invalid|greater|less|limit/i.test(message) ? 400
    : 500;

  if (status === 500) {
    logger.error('deliveries route error', { error: message, stack: error?.stack });
  } else {
    logger.warn('deliveries route client error', { status, error: message });
  }

  return res.status(status).json({ success: false, error: message });
};

// ============================================
// POST /api/deliveries
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const job = await deliveriesService.createDeliveryJob(req.user.id, req.body || {});
    return res.status(201).json({ success: true, delivery: job });
  } catch (error) {
    return handleError(res, error, 'Failed to create delivery job');
  }
});

// ============================================
// GET /api/deliveries/mine
// ============================================
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const result = await deliveriesService.getMyDeliveryJobs(req.user.id, {
      status,
      limit,
      offset,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to load your delivery jobs');
  }
});

// ============================================
// GET /api/deliveries/active
// ============================================
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const result = await deliveriesService.getActiveDeliveries(req.user.id, {
      limit,
      offset,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to load your active deliveries');
  }
});

// ============================================
// GET /api/deliveries/earnings
// ============================================
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    const earnings = await deliveriesService.getCourierEarnings(req.user.id);
    return res.json({ success: true, ...earnings });
  } catch (error) {
    return handleError(res, error, 'Failed to load earnings');
  }
});

// ============================================
// GET /api/deliveries
// ============================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      status,
      packageSize,
      search,
      pickupArea,
      dropoffArea,
      sort,
      limit,
      offset,
    } = req.query;

    const result = await deliveriesService.listDeliveryJobs({
      status: status || 'open',
      packageSize,
      search,
      pickupArea,
      dropoffArea,
      sort,
      limit,
      offset,
    });

    const viewerId = req.user?.id;
    const deliveries = result.deliveries.map((d) => ({
      ...d,
      isMine: viewerId ? d.posterId === viewerId : false,
      isMineAsCourier: viewerId ? d.courierId === viewerId : false,
      canAccept:
        viewerId && d.posterId !== viewerId && d.status === 'open'
          ? true
          : false,
    }));

    return res.json({ success: true, ...result, deliveries });
  } catch (error) {
    return handleError(res, error, 'Failed to load deliveries');
  }
});

// ============================================
// GET /api/deliveries/:id
// ============================================
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const delivery = await deliveriesService.getDeliveryById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    const viewerId = req.user?.id;
    const isPoster = viewerId ? delivery.posterId === viewerId : false;
    const isCourier = viewerId ? delivery.courierId === viewerId : false;
    const isBuyer = viewerId && delivery.buyerId ? delivery.buyerId === viewerId : false;
    const isPendingCourier = viewerId
      ? delivery.pendingCourierId === viewerId
      : false;

    // Has the viewer already got a pending request on this job?
    const myPendingRequest = viewerId
      ? (delivery.courierRequests || []).find(
          (cr) => cr.courierId === viewerId && cr.status === 'pending'
        ) || null
      : null;

    const canApprove = (isPoster || isBuyer) && delivery.status === 'pending_approval';

    return res.json({
      success: true,
      delivery: {
        ...delivery,
        isMine: isPoster,
        isMineAsCourier: isCourier,
        isBuyer,
        isPendingCourier,
        canAccept:
          viewerId && !isPoster && !isBuyer && delivery.status === 'open'
            ? true
            : false,
        canRequestAgain:
          viewerId &&
          !isPoster &&
          !isBuyer &&
          (delivery.status === 'open' || delivery.status === 'pending_approval')
            ? !myPendingRequest
            : false,
        myPendingRequestId: myPendingRequest?.id || null,
        canApprove,
        canConfirm: isPoster && delivery.status === 'delivered',
        canCancel:
          isPoster && ['open', 'pending_approval', 'accepted'].includes(delivery.status),
        canPickup: isCourier && delivery.status === 'accepted',
        canDeliver: isCourier && delivery.status === 'picked_up',
      },
    });
  } catch (error) {
    return handleError(res, error, 'Failed to load delivery');
  }
});

// ============================================
// POST /api/deliveries/:id/accept
// ★ PHASE 3: courier requests to deliver (competitive)
// ============================================
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { note } = req.body || {};
    const result = await deliveriesService.acceptDelivery(req.user.id, req.params.id, {
      note,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to request delivery');
  }
});

// ============================================
// GET /api/deliveries/:id/courier-requests
// ============================================
router.get('/:id/courier-requests', authenticateToken, async (req, res) => {
  try {
    const requests = await deliveriesService.listCourierRequests(req.params.id);
    return res.json({ success: true, courierRequests: requests });
  } catch (error) {
    return handleError(res, error, 'Failed to load courier requests');
  }
});

// ============================================
// ★ PHASE 3: POST /api/deliveries/:id/approve-courier
// Body: { courierRequestId, reason? }
// ============================================
router.post('/:id/approve-courier', authenticateToken, async (req, res) => {
  try {
    const { courierRequestId, reason } = req.body || {};
    if (!courierRequestId) {
      return res.status(400).json({
        success: false,
        error: 'courierRequestId is required',
      });
    }
    const result = await deliveriesService.approveCourier(
      req.user.id,
      req.params.id,
      courierRequestId,
      { reason }
    );
    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to approve courier');
  }
});

// ============================================
// ★ PHASE 3: POST /api/deliveries/:id/reject-courier
// Body: { courierRequestId, reason? }
// ============================================
router.post('/:id/reject-courier', authenticateToken, async (req, res) => {
  try {
    const { courierRequestId, reason } = req.body || {};
    if (!courierRequestId) {
      return res.status(400).json({
        success: false,
        error: 'courierRequestId is required',
      });
    }
    const result = await deliveriesService.rejectCourier(
      req.user.id,
      req.params.id,
      courierRequestId,
      { reason }
    );
    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to reject courier');
  }
});

// ============================================
// ★ PHASE 3: DELETE /api/deliveries/:id/courier-request/:requestId
// Courier withdraws their own request
// ============================================
router.delete(
  '/:id/courier-request/:requestId',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await deliveriesService.withdrawCourierRequest(
        req.user.id,
        req.params.id,
        req.params.requestId
      );
      return res.json({ success: true, ...result });
    } catch (error) {
      return handleError(res, error, 'Failed to withdraw request');
    }
  }
);

// ============================================
// POST /api/deliveries/:id/pickup
// ============================================
router.post('/:id/pickup', authenticateToken, async (req, res) => {
  try {
    const delivery = await deliveriesService.markPickedUp(req.user.id, req.params.id);
    return res.json({ success: true, delivery });
  } catch (error) {
    return handleError(res, error, 'Failed to mark picked up');
  }
});

// ============================================
// POST /api/deliveries/:id/deliver
// ============================================
router.post('/:id/deliver', authenticateToken, async (req, res) => {
  try {
    const delivery = await deliveriesService.markDelivered(req.user.id, req.params.id);
    return res.json({ success: true, delivery });
  } catch (error) {
    return handleError(res, error, 'Failed to mark delivered');
  }
});

// ============================================
// POST /api/deliveries/:id/confirm
// ============================================
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const delivery = await deliveriesService.confirmDelivery(req.user.id, req.params.id);
    return res.json({ success: true, delivery });
  } catch (error) {
    return handleError(res, error, 'Failed to confirm delivery');
  }
});

// ============================================
// DELETE /api/deliveries/:id
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body || {};
    const delivery = await deliveriesService.cancelDelivery(
      req.user.id,
      req.params.id,
      reason
    );
    return res.json({ success: true, delivery });
  } catch (error) {
    return handleError(res, error, 'Failed to cancel delivery');
  }
});

export default router;