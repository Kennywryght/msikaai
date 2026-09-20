// backend/src/api/interactions.js
import { Router } from 'express';
import dbService from '../services/dbService.js';
import { logger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ============================================================
// ⚠️  ROUTE ORDER MATTERS
//
// Express matches routes in the order they are declared.
// Specific literal paths (/likes/batch, /comments/counts) MUST
// come BEFORE parameterized paths (/likes/:listingId,
// /comments/:listingId), otherwise "batch" gets captured as the
// :listingId param and Postgres throws:
//   "invalid input syntax for type uuid: batch"
// ============================================================

// ============================================
// PUBLIC ROUTES — no auth required
//
// Reading comments should not require a login. Guests and
// signed-out visitors can browse the discussion on any listing.
// ============================================

// ============================================
// POST /api/interactions/comments/counts
// Body: { listingIds: string[] }
// Returns comment counts per listing (public)
// ============================================
router.post('/comments/counts', async (req, res) => {
  try {
    const { listingIds } = req.body;

    if (!Array.isArray(listingIds)) {
      return res.status(400).json({
        success: false,
        error: 'listingIds must be an array',
      });
    }

    const counts = await dbService.getCommentCountsForListings(listingIds);

    res.json({ success: true, counts });
  } catch (error) {
    logger.error('Batch comment counts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/interactions/comments/:listingId
// List comments for a listing (public)
// ============================================
router.get('/comments/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await dbService.getListingComments(listingId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('List comments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PROTECTED ROUTES — auth required
// ============================================

// ============================================
// POST /api/interactions/likes/batch
// Body: { listingIds: string[] }
// Returns like counts + which ones the current user liked
// (auth required because it returns `userLikes`)
// ============================================
router.post('/likes/batch', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingIds } = req.body;

    if (!Array.isArray(listingIds)) {
      return res.status(400).json({
        success: false,
        error: 'listingIds must be an array',
      });
    }

    const result = await dbService.getLikeStatesForListings(listingIds, userId);

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Batch like states error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/interactions/likes/:listingId
// Toggle a like on a listing (auth required)
// ============================================
router.post('/likes/:listingId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.params;

    const result = await dbService.toggleListingLike(listingId, userId);

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Toggle like error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/interactions/comments/:listingId
// Body: { text }
// Create a comment (auth required)
// ============================================
router.post('/comments/:listingId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.params;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required',
      });
    }

    const comment = await dbService.createListingComment(listingId, userId, text);

    res.status(201).json({ success: true, comment });
  } catch (error) {
    logger.error('Create comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DELETE /api/interactions/comments/:commentId
// Delete a comment (only owner, auth required)
// ============================================
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    const result = await dbService.deleteListingComment(commentId, userId);

    res.json(result);
  } catch (error) {
    logger.error('Delete comment error:', error);
    const status = error.message.includes('Not authorized') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

export default router;