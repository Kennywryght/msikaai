// backend/src/api/location.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { reverseGeocode } from '../services/geocodingService.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const router = Router();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// 1. FIND NEARBY BUSINESSES
// ============================================
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const { data, error } = await supabaseAdmin.rpc('nearby_businesses', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_km: parseFloat(radius),
    });

    if (error) {
      logger.error('Nearby search error', { error: error.message });
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      businesses: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    logger.error('Nearby search error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 2. REVERSE GEOCODE — lat/lng → place name
// ★ PHASE 1: used by CreateRequest + CreateDelivery
// ============================================
router.post('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.body || {};

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng are required',
      });
    }

    const name = await reverseGeocode(lat, lng);

    return res.json({
      success: true,
      name: name || null,
    });
  } catch (error) {
    logger.error('Reverse geocode route error', { error: error?.message });
    return res.status(500).json({
      success: false,
      error: error?.message || 'Reverse geocode failed',
    });
  }
});

// ============================================
// 3. UPDATE BUSINESS LOCATION
// ★ PHASE 1: resolves name server-side if not supplied
// ============================================
router.post('/update', async (req, res) => {
  try {
    const { businessId, lat, lng, address } = req.body;

    if (!businessId || lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'Business ID, latitude and longitude are required',
      });
    }

    const resolvedName = address || (await reverseGeocode(lat, lng)) || '';

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({
        location: `POINT(${lng} ${lat})`,
        location_text: resolvedName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      logger.error('Location update error', { error: error.message });
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: 'Location updated successfully',
      business: data,
    });
  } catch (error) {
    logger.error('Location update error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;