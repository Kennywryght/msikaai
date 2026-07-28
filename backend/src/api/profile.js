import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// 1. GET PROFILE BY USER ID
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Fetching profile for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      console.log('ℹ️ No profile found for user');
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    console.log('✅ Profile found for user:', userId);

    return res.json({
      success: true,
      profile: data
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 2. UPDATE PROFILE
// ============================================
router.put('/update', async (req, res) => {
  try {
    const { userId, fullName, phone, avatar_url, location_text } = req.body;

    console.log('🔄 Updating profile for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Build update object with only provided fields
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (location_text !== undefined) updates.location_text = location_text;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Profile updated for user:', userId);

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      profile: data
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// ============================================
// 3. UPDATE BUSINESS INFO
// ============================================
router.put('/business/update', async (req, res) => {
  try {
    const { userId, businessName, category, description, phone, address, logo_url } = req.body;

    console.log('🔄 Updating business for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Build update object with only provided fields
    const updates = {};
    if (businessName !== undefined) updates.business_name = businessName;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Business updated for user:', userId);

    return res.json({
      success: true,
      message: 'Business updated successfully!',
      business: data
    });
  } catch (error) {
    console.error('❌ Update business error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;