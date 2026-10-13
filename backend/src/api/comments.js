// backend/src/api/comments.js
// Comment-level actions. Listing-scoped comment CRUD lives in interactions.js.
import { Router } from 'express';
import dbService from '../services/dbService.js';
import { logger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const likeHandler = (like) => async (req, res) => {
  try {
    const result = await dbService.setCommentLike(req.params.commentId, req.user.id, like);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error(`${like ? 'Like' : 'Unlike'} comment error:`, error);
    const status = error.message === 'Comment not found' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

// POST   /api/comments/:commentId/like  → { liked: true,  count }
// DELETE /api/comments/:commentId/like  → { liked: false, count }
router.post('/:commentId/like', authenticateToken, likeHandler(true));
router.delete('/:commentId/like', authenticateToken, likeHandler(false));

export default router;
