// backend/src/api/search.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth.js';
import { cacheMiddleware, keyGenerators } from '../middleware/cache.js';
import searchService from '../services/searchService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ============================================
// PUBLIC SEARCH ENDPOINT
// ============================================

router.get('/', cacheMiddleware(180, keyGenerators.search), async (req, res) => {
  try {
    const {
      q = '',
      category,
      subCategory,
      location,
      minPrice,
      maxPrice,
      deliveryAvailable,
      sortBy = 'relevance',
      limit = 20,
      offset = 0,
      facets = false,
    } = req.query;

    logger.info(`🔍 Search: "${q}"`, { category, location, sortBy });

    const results = await searchService.search(q, {
      category,
      subCategory,
      location,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      deliveryAvailable: deliveryAvailable === 'true',
      sortBy,
      limit: parseInt(limit),
      offset: parseInt(offset),
      facets: facets === 'true',
      showRankingScore: true,
    });

    return res.json({
      success: true,
      query: q,
      results: results.hits,
      total: results.total,
      facets: results.facets || {},
      limit: parseInt(limit),
      offset: parseInt(offset),
      processingTimeMs: results.processingTimeMs,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('❌ Search error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// ============================================
// GET FACETS
// ============================================

router.get('/facets/:facet', cacheMiddleware(600), async (req, res) => {
  try {
    const { facet } = req.params;
    const { q = '' } = req.query;

    const validFacets = ['category', 'subCategory', 'locationArea'];
    if (!validFacets.includes(facet)) {
      return res.status(400).json({
        success: false,
        error: `Invalid facet. Valid facets: ${validFacets.join(', ')}`
      });
    }

    const results = await searchService.getFacets(facet, q);

    return res.json({
      success: true,
      facet,
      values: results,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('❌ Facet error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// ============================================
// AUTOCOMPLETE / SUGGESTIONS
// ============================================

router.get('/suggest', cacheMiddleware(300), async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const results = await searchService.search(q, {
      limit: parseInt(limit),
      attributesToRetrieve: ['id', 'title', 'category', 'businessName'],
    });

    const suggestions = results.hits.map(hit => ({
      id: hit.id,
      title: hit.title,
      category: hit.category,
      businessName: hit.businessName,
      highlight: hit._formatted?.title || hit.title,
    }));

    return res.json({
      success: true,
      query: q,
      suggestions,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('❌ Suggest error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// ============================================
// SEARCH STATS (Admin only)
// ============================================

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await searchService.getStats();

    return res.json({
      success: true,
      stats,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('❌ Search stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      requestId: req.requestId,
    });
  }
});

// ============================================
// REINDEX (Admin only)
// ============================================

router.post('/reindex', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Clear existing index
    await searchService.clearIndex();

    // Fetch all active listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        businesses:businessId (
          businessName
        )
      `)
      .eq('status', 'active');

    if (error) throw error;

    // Reindex
    const indexed = await searchService.indexListings(listings || []);

    return res.json({
      success: true,
      message: `Reindexed ${indexed} listings`,
      indexed,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('❌ Reindex error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      requestId: req.requestId,
    });
  }
});

export default router;