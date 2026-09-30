// backend/src/api/requests.js
import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import requestsService from '../services/requestsService.js';

const router = Router();

// ============================================
// HELPERS
// ============================================
const handleError = (res, error, fallbackMessage = 'Request failed') => {
  const message = error?.message || fallbackMessage;
  const status =
    /not found/i.test(message) ? 404
    : /not your|only the|cannot|already|own/i.test(message) ? 403
    : /required|must|invalid|greater|less/i.test(message) ? 400
    : 500;

  if (status === 500) {
    logger.error('requests route error', { error: message, stack: error?.stack });
  } else {
    logger.warn('requests route client error', { status, error: message });
  }

  return res.status(status).json({ success: false, error: message });
};

// ============================================
// POST /api/requests
// Create a request (auth required)
// ============================================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const created = await requestsService.createRequest(req.user.id, req.body || {});
    return res.status(201).json({ success: true, request: created });
  } catch (error) {
    return handleError(res, error, 'Failed to create request');
  }
});

// ============================================
// GET /api/requests/mine
// Own requests (any status). MUST be declared before /:id
// ============================================
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      category,
      urgency,
      search,
      locationArea,
      sort,
      limit,
      offset,
    } = req.query;

    const result = await requestsService.getMyRequests(req.user.id, {
      status: status || 'all',
      category,
      urgency,
      search,
      locationArea,
      sort,
      limit,
      offset,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to load your requests');
  }
});

// ============================================
// GET /api/requests
// Public feed — optional auth so we know who's viewing
// ============================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      status,
      category,
      urgency,
      search,
      locationArea,
      sort,
      limit,
      offset,
    } = req.query;

    const result = await requestsService.listRequests({
      status: status || 'open',
      category,
      urgency,
      search,
      locationArea,
      sort,
      limit,
      offset,
    });

    // Tag each request with `isMine` for the current viewer, if any
    const viewerId = req.user?.id;
    const requests = result.requests.map((r) => ({
      ...r,
      isMine: viewerId ? r.userId === viewerId : false,
    }));

    return res.json({ success: true, ...result, requests });
  } catch (error) {
    return handleError(res, error, 'Failed to load requests');
  }
});

// ============================================
// GET /api/requests/:id
// Detail + responses — optional auth
// ============================================
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const detail = await requestsService.getRequestById(req.params.id, {
      includeResponses: true,
    });

    if (!detail) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const viewerId = req.user?.id;
    const isOwner = viewerId ? detail.userId === viewerId : false;

    // Annotate responses with `isMine` and hide responder identity in some cases
    const responses = (detail.responses || []).map((r) => ({
      ...r,
      isMine: viewerId ? r.responderId === viewerId : false,
      isAccepted: r.status === 'accepted',
    }));

    return res.json({
      success: true,
      request: {
        ...detail,
        responses,
        isMine: isOwner,
        canRespond: viewerId ? !isOwner : true,
      },
    });
  } catch (error) {
    return handleError(res, error, 'Failed to load request');
  }
});

// ============================================
// POST /api/requests/:id/respond
// ============================================
router.post('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const response = await requestsService.respondToRequest(
      req.user.id,
      req.params.id,
      req.body || {}
    );
    return res.status(201).json({ success: true, response });
  } catch (error) {
    return handleError(res, error, 'Failed to submit response');
  }
});

// ============================================
// DELETE /api/requests/:id/responses/:responseId
// Withdraw own response
// ============================================
router.delete('/:id/responses/:responseId', authenticateToken, async (req, res) => {
  try {
    const result = await requestsService.withdrawResponse(
      req.user.id,
      req.params.responseId
    );
    return res.json({ success: true, response: result });
  } catch (error) {
    return handleError(res, error, 'Failed to withdraw response');
  }
});

// ============================================
// POST /api/requests/:id/responses/:responseId/accept
// ============================================
router.post(
  '/:id/responses/:responseId/accept',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await requestsService.acceptResponse(
        req.user.id,
        req.params.id,
        req.params.responseId
      );
      return res.json({
        success: true,
        response: result.response,
        conversationId: result.conversationId,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to accept response');
    }
  }
);

// ============================================
// POST /api/requests/:id/fulfill
// ============================================
router.post('/:id/fulfill', authenticateToken, async (req, res) => {
  try {
    const updated = await requestsService.markFulfilled(req.user.id, req.params.id);
    return res.json({ success: true, request: updated });
  } catch (error) {
    return handleError(res, error, 'Failed to mark fulfilled');
  }
});

// ============================================
// DELETE /api/requests/:id
// Owner only
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await requestsService.deleteRequest(req.user.id, req.params.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error, 'Failed to delete request');
  }
});

export default router;