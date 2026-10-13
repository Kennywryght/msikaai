// backend/src/api/reviews.js
//
// Rules:
//  - Any signed-in user may review a listing, except the seller themselves.
//  - One review per user per listing; posting again updates it.
//  - Only the reviewer may edit or delete their review.
//  - Every change refreshes businesses.rating/review_count and the seller's
//    trust score (average_rating / total_reviews feed computeScore).
import { Router } from 'express';
import dbService from '../services/dbService.js';
import { recomputeForUser } from '../services/trustScoreService.js';
import { invalidateCache } from '../middleware/cache.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

const MAX_COMMENT = 1000;

const parseRating = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

const cleanComment = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, MAX_COMMENT) : null;
};

const parsePage = (q) => ({
  limit: Math.min(parseInt(q.limit, 10) || 50, 100),
  offset: Math.max(parseInt(q.offset, 10) || 0, 0),
});

const afterChange = async (businessId, listingId) => {
  try {
    const ownerId = await dbService.refreshReviewAggregates(businessId);
    if (ownerId) await recomputeForUser(ownerId);
    if (listingId) await invalidateCache(`listing:${listingId}`);
  } catch (err) {
    // The review itself is saved; aggregates self-heal on the next change.
    logger.warn('Review aggregate refresh failed', { businessId, error: err.message });
  }
};

// ---------- Public reads ----------

router.get('/listing/:listingId', async (req, res) => {
  try {
    const result = await dbService.getReviews({ listingId: req.params.listingId, ...parsePage(req.query) });
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get listing reviews error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/business/:businessId', async (req, res) => {
  try {
    const result = await dbService.getReviews({ businessId: req.params.businessId, ...parsePage(req.query) });
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get business reviews error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- Writes ----------

// POST /api/reviews/create  { listingId, rating, comment? }
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const listingId = req.body.listingId ?? req.body.listing_id;
    const rating = parseRating(req.body.rating);
    const comment = cleanComment(req.body.comment);

    if (!listingId) return res.status(400).json({ success: false, error: 'listingId is required' });
    if (!rating) return res.status(400).json({ success: false, error: 'rating must be a whole number from 1 to 5' });

    const listing = await dbService.getListingWithBusiness(listingId);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });

    const businessId = listing.businessId || listing.businesses?.id;
    if (!businessId) return res.status(400).json({ success: false, error: 'Listing has no business' });
    if (listing.businesses?.userId === req.user.id) {
      return res.status(403).json({ success: false, error: "You can't review your own listing" });
    }

    const { review, created } = await dbService.upsertListingReview({
      listingId, businessId, reviewerId: req.user.id, rating, comment,
    });
    await afterChange(businessId, listingId);

    res.status(created ? 201 : 200).json({ success: true, review, created });
  } catch (error) {
    logger.error('Create review error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/reviews/:id  { rating?, comment? }
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await dbService.getReview(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Review not found' });
    if (existing.reviewerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only edit your own review' });
    }

    const patch = {};
    if (req.body.rating !== undefined) {
      const rating = parseRating(req.body.rating);
      if (!rating) return res.status(400).json({ success: false, error: 'rating must be a whole number from 1 to 5' });
      patch.rating = rating;
    }
    if (req.body.comment !== undefined) patch.comment = cleanComment(req.body.comment);

    const review = await dbService.updateReview(existing.id, patch);
    await afterChange(existing.businessId, existing.listingId);
    res.json({ success: true, review });
  } catch (error) {
    logger.error('Update review error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await dbService.getReview(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Review not found' });
    if (existing.reviewerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only delete your own review' });
    }

    await dbService.deleteReview(existing.id);
    await afterChange(existing.businessId, existing.listingId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete review error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
