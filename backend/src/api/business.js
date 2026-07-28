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
// 1. CREATE BUSINESS
// ============================================
router.post('/create', async (req, res) => {
  try {
    const { userId, businessName, category, description, phone, address } = req.body;

    console.log('🏪 Creating business:', { businessName, category, userId });

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!businessName || !category) {
      return res.status(400).json({
        success: false,
        error: 'Business name and category are required'
      });
    }

    // Check if user already has a business
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('businesses')
      .select('id, business_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Check error:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Error checking existing business'
      });
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `You already have a business: "${existing.business_name}"`
      });
    }

    // Create business
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .insert({
        user_id: userId,
        business_name: businessName,
        category: category,
        description: description || '',
        phone: phone || '',
        address: address || '',
        status: 'active',
        verified: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Business creation error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Business created:', data.id);

    return res.status(201).json({
      success: true,
      message: 'Business created successfully!',
      business: data
    });
  } catch (error) {
    console.error('❌ Business creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// ============================================
// 2. GET BUSINESS BY USER ID
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Fetching business for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      console.log('ℹ️ No business found for user');
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    console.log('✅ Business found:', data.id);

    return res.json({
      success: true,
      business: data
    });
  } catch (error) {
    console.error('❌ Get business error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 3. GET BUSINESS BY ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching business by ID:', id);

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Fetch error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    return res.json({
      success: true,
      business: data
    });
  } catch (error) {
    console.error('❌ Get business error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4. UPDATE BUSINESS
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Updating business:', id);

    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    delete updates.updated_at;

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Business updated:', id);

    return res.json({
      success: true,
      message: 'Business updated successfully',
      business: data
    });
  } catch (error) {
    console.error('❌ Update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 5. GET ALL BUSINESSES
// ============================================
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    console.log('🔍 Fetching businesses:', { category, limit, offset });

    let query = supabaseAdmin
      .from('businesses')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Fetch error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      businesses: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 6. DELETE BUSINESS
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting business:', id);

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Delete error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Business deleted:', id);

    return res.json({
      success: true,
      message: 'Business deleted successfully',
      business: data
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;