import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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
        error: 'Latitude and longitude are required'
      });
    }

    const { data, error } = await supabaseAdmin
      .rpc('nearby_businesses', {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_km: parseFloat(radius)
      });

    if (error) {
      console.error('❌ Nearby search error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      businesses: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Nearby search error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 2. UPDATE BUSINESS LOCATION
// ============================================
router.post('/update', async (req, res) => {
  try {
    const { businessId, lat, lng, address } = req.body;

    if (!businessId || !lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Business ID, latitude and longitude are required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({
        location: `POINT(${lng} ${lat})`,
        location_text: address || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('❌ Location update error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Location updated successfully',
      business: data
    });
  } catch (error) {
    console.error('❌ Location update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;