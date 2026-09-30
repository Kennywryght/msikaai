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
// Create a new delivery job (auth required)
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
// Jobs I posted (as poster). MUST be before /:id
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
// Jobs I accepted (as courier)
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
// Courier earnings summary
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
// Public job board — optional auth
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
      canAccept: viewerId ? d.posterId !== viewerId && d.status === 'open' : false,
    }));

    return res.json({ success: true, ...result, deliveries });
  } catch (error) {
    return handleError(res, error, 'Failed to load deliveries');
  }
});

// ============================================
// GET /api/deliveries/:id
// Detail — optional auth
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

    return res.json({
      success: true,
      delivery: {
        ...delivery,
        isMine: isPoster,
        isMineAsCourier: isCourier,
        canAccept: viewerId
          ? !isPoster && delivery.status === 'open'
          : false,
        canConfirm: isPoster && delivery.status === 'delivered',
        canCancel:
          isPoster &&
          ['open', 'accepted'].includes(delivery.status),
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
// Courier accepts the job
// ============================================
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const delivery = await deliveriesService.acceptDelivery(req.user.id, req.params.id);
    return res.json({ success: true, delivery });
  } catch (error) {
    return handleError(res, error, 'Failed to accept delivery');
  }
});

// ============================================
// POST /api/deliveries/:id/pickup
// Courier marks picked up
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
// Courier marks delivered
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
// Poster confirms delivery
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
// Poster cancels (before pickup)
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