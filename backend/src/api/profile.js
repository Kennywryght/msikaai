import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import multer from 'multer';
import { rejectForeignUserId } from '../utils/authz.js';
import storageService from '../services/storageService.js';
import { invalidateCache } from '../middleware/cache.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const router = Router();

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const clean = (v, max) => String(v ?? '').trim().slice(0, max);
// Malawi numbers (0999…, +265999…) and other international formats
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;
const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test(String(s));

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Please upload a JPG, PNG or WebP image'), { statusCode: 400 })),
});

const findOwnBusiness = async (userId, businessId) => {
  let q = supabaseAdmin.from('businesses').select('id').eq('user_id', userId);
  if (businessId) q = q.eq('id', businessId);
  const { data } = await q.order('created_at', { ascending: true }).limit(1);
  return data?.[0] || null;
};

// ============================================
// PROFILE PHOTO — POST /api/profile/avatar (multipart "avatar")
// ============================================
router.post('/avatar', imageUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Choose a photo to upload' });
    const url = await storageService.uploadAvatar(req.file, req.user.id);
    if (!url) return res.status(502).json({ success: false, error: 'Could not upload the photo. Please try again.' });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .maybeSingle();
    if (error) throw error;

    return res.json({ success: true, avatar_url: url, profile: data });
  } catch (error) {
    logger.error('Avatar upload error', { error: error?.message });
    return res.status(500).json({ success: false, error: 'Could not save the photo' });
  }
});

// ============================================
// BUSINESS LOGO — POST /api/profile/business/logo (multipart "logo")
// ============================================
router.post('/business/logo', imageUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Choose a logo to upload' });
    const business = await findOwnBusiness(req.user.id, req.body.businessId);
    if (!business) return res.status(404).json({ success: false, error: 'You don\'t have a business profile yet' });

    const url = await storageService.uploadLogo(req.file, business.id);
    if (!url) return res.status(502).json({ success: false, error: 'Could not upload the logo. Please try again.' });

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({ logo_url: url, updated_at: new Date().toISOString() })
      .eq('id', business.id)
      .select()
      .single();
    if (error) throw error;

    await invalidateCache(`business:${business.id}`);
    return res.json({ success: true, logo_url: url, business: data });
  } catch (error) {
    logger.error('Logo upload error', { error: error?.message });
    return res.status(500).json({ success: false, error: 'Could not save the logo' });
  }
});

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

    // Your own profile: everything. Someone else's: public fields only
    // (no email/phone/role).
    const isSelf = userId === req.user?.id;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(isSelf ? '*' : 'id, full_name, avatar_url, location_text, created_at')
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
    const { fullName, phone, avatar_url, location_text } = req.body;
    if (rejectForeignUserId(req, res, req.body.userId)) return;
    const userId = req.user.id;

    console.log('🔄 Updating profile for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Build update object with only provided fields (trimmed, validated)
    const updates = {};
    if (fullName !== undefined) {
      updates.full_name = clean(fullName, 100);
      if (!updates.full_name || updates.full_name.length < 2) {
        return res.status(400).json({ success: false, error: 'Please enter your full name' });
      }
    }
    if (phone !== undefined) {
      updates.phone = clean(phone, 20);
      if (updates.phone && !PHONE_RE.test(updates.phone)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid phone number, e.g. 0999123456' });
      }
    }
    if (avatar_url !== undefined) {
      if (avatar_url && !isHttpUrl(avatar_url)) {
        return res.status(400).json({ success: false, error: 'Invalid photo URL' });
      }
      updates.avatar_url = avatar_url || null;
    }
    if (location_text !== undefined) updates.location_text = clean(location_text, 120);
    updates.updated_at = new Date().toISOString();

    let { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    // No profile row yet (sign-up trigger missed it): create it now.
    if (!error && !data) {
      ({ data, error } = await supabaseAdmin
        .from('profiles')
        .insert({ id: userId, email: req.user.email, ...updates })
        .select()
        .single());
    }

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
    const { businessName, category, description, phone, address, logo_url } = req.body;
    if (rejectForeignUserId(req, res, req.body.userId)) return;
    const userId = req.user.id;

    console.log('🔄 Updating business for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Build update object with only provided fields (trimmed, validated)
    const updates = {};
    if (businessName !== undefined) {
      updates.business_name = clean(businessName, 120);
      if (!updates.business_name) {
        return res.status(400).json({ success: false, error: 'Business name is required' });
      }
    }
    if (category !== undefined) updates.category = clean(category, 60);
    if (description !== undefined) updates.description = clean(description, 2000);
    if (phone !== undefined) {
      updates.phone = clean(phone, 20);
      if (updates.phone && !PHONE_RE.test(updates.phone)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid business phone number' });
      }
    }
    if (address !== undefined) updates.address = clean(address, 200);
    if (logo_url !== undefined) {
      if (logo_url && !isHttpUrl(logo_url)) {
        return res.status(400).json({ success: false, error: 'Invalid logo URL' });
      }
      updates.logo_url = logo_url || null;
    }
    updates.updated_at = new Date().toISOString();

    // The caller's business (a specific one if they have several).
    const business = await findOwnBusiness(userId, req.body.businessId);
    if (!business) {
      return res.status(404).json({ success: false, error: 'You don\'t have a business profile yet' });
    }

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', business.id)
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