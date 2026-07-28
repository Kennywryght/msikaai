import { Router } from 'express';
import analyticsService from '../services/analyticsService.js';
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

    const result = await analyticsService.getBusinessAnalytics(
      businessId,
      parseInt(days)
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
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

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