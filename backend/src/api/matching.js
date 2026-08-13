// backend/src/api/matching.js
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
// 1. POST A NEED - User looking for goods/services
// ============================================
router.post('/needs', async (req, res) => {
  try {
    const { 
      userId,
      title,
      description,
      category,
      location,
      budgetMin,
      budgetMax,
      urgency = 'medium'
    } = req.body;

    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        error: 'User ID and title are required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('needs')
      .insert({
        user_id: userId,
        title,
        description: description || '',
        category: category || 'Other',
        location: location || '',
        budget_min: budgetMin || null,
        budget_max: budgetMax || null,
        urgency: urgency,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Need creation error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Find matching listings for this need
    const matchedListings = await findMatchingListings(data);

    return res.status(201).json({
      success: true,
      message: 'Need posted successfully',
      need: data,
      matches: matchedListings
    });
  } catch (error) {
    console.error('❌ Need creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 2. FIND MATCHING LISTINGS FOR A NEED
// ============================================
async function findMatchingListings(need) {
  try {
    let query = supabaseAdmin
      .from('listings')
      .select(`
        *,
        businesses:business_id (
          id,
          business_name,
          category,
          phone,
          logo_url
        )
      `)
      .eq('status', 'active');

    // Match by category
    if (need.category && need.category !== 'Other') {
      query = query.eq('category', need.category);
    }

    // Match by location
    if (need.location) {
      query = query.ilike('location_area', `%${need.location}%`);
    }

    // Match by budget
    if (need.budget_min && need.budget_max) {
      query = query.gte('price', need.budget_min)
                   .lte('price', need.budget_max);
    } else if (need.budget_min) {
      query = query.gte('price', need.budget_min);
    } else if (need.budget_max) {
      query = query.lte('price', need.budget_max);
    }

    // Text search on title and description
    if (need.title) {
      query = query.textSearch('search_vector', need.title, { config: 'english' });
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Matching error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Matching error:', error);
    return [];
  }
}

// ============================================
// 3. GET NEEDS FOR A BUSINESS - See potential customers
// ============================================
router.get('/business-needs/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit = 10 } = req.query;

    // Get business details
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('category, location_area')
      .eq('id', businessId)
      .single();

    if (bizError) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Find needs matching this business
    let query = supabaseAdmin
      .from('needs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          phone,
          email
        )
      `)
      .eq('status', 'active');

    if (business.category) {
      query = query.eq('category', business.category);
    }

    if (business.location_area) {
      query = query.ilike('location', `%${business.location_area}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Business needs error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      needs: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Business needs error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4. GET ALL NEEDS (Public)
// ============================================
router.get('/needs', async (req, res) => {
  try {
    const { category, location, limit = 20, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('needs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          phone
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (location && location !== 'All Areas') {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Needs fetch error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from('needs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return res.json({
      success: true,
      needs: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Needs fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 5. CLOSE A NEED (Mark as fulfilled)
// ============================================
router.put('/needs/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const { data, error } = await supabaseAdmin
      .from('needs')
      .update({ 
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Close need error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Need marked as fulfilled',
      need: data
    });
  } catch (error) {
    console.error('❌ Close need error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;