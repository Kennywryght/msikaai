// backend/src/api/listings.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { cacheMiddleware, keyGenerators, invalidateCache } from '../middleware/cache.js';

dotenv.config();

const router = Router();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// GET ALL LISTINGS (with caching)
// ============================================
router.get('/', cacheMiddleware(300, keyGenerators.listings), async (req, res) => {
  try {
    const { limit = 20, offset = 0, status = 'active' } = req.query;

    console.log('📦 Fetching all listings:', { limit, offset, status });

    // Enforce reasonable limits
    const maxLimit = Math.min(parseInt(limit), 50);
    const validOffset = Math.max(parseInt(offset), 0);

    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        businesses:business_id (
          id,
          business_name,
          category,
          phone,
          address,
          rating,
          logo_url
        )
      `)
      .eq('status', status)
      .range(validOffset, validOffset + maxLimit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch listings error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Get total count (cached separately)
    const { count, error: countError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    return res.json({
      success: true,
      listings: data || [],
      total: count || 0,
      limit: maxLimit,
      offset: validOffset
    });
  } catch (error) {
    console.error('❌ Fetch listings error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 1. CREATE LISTING (invalidate cache)
// ============================================
router.post('/create', async (req, res) => {
  try {
    const { 
      businessId, 
      title, 
      description, 
      category, 
      subCategory, 
      price, 
      priceType,
      quantity,
      unit,
      images,
      status,
      locationArea,
      deliveryAvailable,
      deliveryFee,
      contactPhone
    } = req.body;

    console.log('📝 Creating listing:', { businessId, title, category });

    if (!businessId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and title are required'
      });
    }

    // Check if business exists
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id')
      .eq('id', businessId)
      .single();

    if (businessError) {
      console.error('❌ Business check error:', businessError);
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Create listing
    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert({
        business_id: businessId,
        title,
        description: description || '',
        category: category || 'Other',
        sub_category: subCategory || '',
        price: price || null,
        price_type: priceType || 'fixed',
        quantity: quantity || null,
        unit: unit || '',
        images: images || [],
        status: status || 'active',
        location_area: locationArea || '',
        delivery_available: deliveryAvailable || false,
        delivery_fee: deliveryFee || null,
        contact_phone: contactPhone || ''
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Listing creation error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Invalidate cache
    await invalidateCache('listings:');
    await invalidateCache(`business:${businessId}`);

    console.log('✅ Listing created:', data.id);

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing: data
    });
  } catch (error) {
    console.error('❌ Listing creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create listing'
    });
  }
});

// ============================================
// 2. SEARCH LISTINGS (with caching)
// ============================================
router.get('/search', cacheMiddleware(180, keyGenerators.search), async (req, res) => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      limit = 20, 
      offset = 0 
    } = req.query;

    console.log('🔍 Searching listings:', { q, category, minPrice, maxPrice, limit, offset });

    // Enforce limits
    const maxLimit = Math.min(parseInt(limit), 50);
    const validOffset = Math.max(parseInt(offset), 0);

    let query = supabaseAdmin
      .from('listings')
      .select(`
        *,
        businesses:business_id (
          id,
          business_name,
          category,
          rating,
          logo_url
        )
      `)
      .eq('status', 'active');

    if (q) {
      query = query.textSearch('search_vector', q, { config: 'english' });
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const { data, error } = await query
      .range(validOffset, validOffset + maxLimit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Search error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    let countQuery = supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (q) {
      countQuery = countQuery.textSearch('search_vector', q, { config: 'english' });
    }
    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    const { count, error: countError } = await countQuery;

    return res.json({
      success: true,
      listings: data || [],
      total: count || 0,
      limit: maxLimit,
      offset: validOffset
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 3. GET LISTINGS BY BUSINESS (with caching)
// ============================================
router.get('/business/:businessId', cacheMiddleware(300), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status = 'active' } = req.query;

    console.log('🔍 Fetching listings for business:', businessId);

    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch listings error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      listings: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Fetch listings error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4. GET LISTING BY ID (with caching)
// ============================================
router.get('/:id', cacheMiddleware(600), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching listing by ID:', id);

    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        businesses:business_id (
          id,
          business_name,
          category,
          phone,
          address,
          rating,
          logo_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }
      console.error('❌ Fetch listing error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Increment view count (async, don't wait)
    supabaseAdmin
      .from('listings')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)
      .then(() => console.log(`📊 View count updated for listing ${id}`))
      .catch(err => console.error('View count update error:', err));

    return res.json({
      success: true,
      listing: data
    });
  } catch (error) {
    console.error('❌ Fetch listing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 5. UPDATE LISTING (invalidate cache)
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Updating listing:', id);

    delete updates.id;
    delete updates.business_id;
    delete updates.created_at;
    delete updates.view_count;
    delete updates.contact_count;

    const { data, error } = await supabaseAdmin
      .from('listings')
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

    // Invalidate cache
    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);

    console.log('✅ Listing updated:', id);

    return res.json({
      success: true,
      message: 'Listing updated successfully',
      listing: data
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
// 6. DELETE LISTING (invalidate cache)
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting listing:', id);

    const { data, error } = await supabaseAdmin
      .from('listings')
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

    // Invalidate cache
    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);

    console.log('✅ Listing deleted:', id);

    return res.json({
      success: true,
      message: 'Listing deleted successfully',
      listing: data
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