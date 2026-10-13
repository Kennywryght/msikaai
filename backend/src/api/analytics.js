import { Router } from 'express';
import analyticsService from '../services/analyticsService.js';
import { checkBusinessAccess } from '../utils/authz.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// TRACK VIEW
// ============================================
router.post('/view', async (req, res) => {
  try {
    const { listingId } = req.body;
    const userId = req.user?.id;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Listing ID is required'
      });
    }

    const result = await analyticsService.trackView(listingId, userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Analytics view error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// TRACK CONTACT
// ============================================
router.post('/contact', async (req, res) => {
  try {
    const { listingId } = req.body;
    const userId = req.user?.id;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Listing ID is required'
      });
    }

    const result = await analyticsService.trackContact(listingId, userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Analytics contact error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET LISTING STATS
// ============================================
router.get('/listing/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await analyticsService.getListingStats(id);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get listing stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET BUSINESS ANALYTICS
// ============================================
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { days = 30 } = req.query;

    const access = await checkBusinessAccess(req.user?.id, businessId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    const result = await analyticsService.getBusinessAnalytics(
      businessId,
      Math.min(Math.max(parseInt(days, 10) || 30, 1), 365)
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get business analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET POPULAR LISTINGS
// ============================================
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await analyticsService.getPopularListings(parseInt(limit));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get popular listings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET USER ACTIVITY
// ============================================
// ============================================
// TRACK USER ACTIVITY
// Body: { action, metadata? } — always recorded for the caller; a userId in
// the body is ignored so users can't write events for each other.
// ============================================
router.post('/user-activity', async (req, res) => {
  try {
    const userId = req.user?.id;
    const action = String(req.body?.action || '').trim().slice(0, 64);
    if (!action) {
      return res.status(400).json({ success: false, error: 'action is required' });
    }
    const metadata =
      req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};

    const result = await analyticsService.trackUserActivity(userId, action, metadata);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Track user activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    if (userId !== req.user?.id) {
      return res.status(403).json({ success: false, error: 'You can only view your own activity' });
    }

    const result = await analyticsService.getUserActivity(
      userId,
      parseInt(limit)
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;