// backend/src/api/listings.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import multer from 'multer';
import { cacheMiddleware, keyGenerators, invalidateCache } from '../middleware/cache.js';
import { authenticateToken } from '../middleware/auth.js';
import storageService from '../services/storageService.js';
import dbService from '../services/dbService.js';
import { eq, desc, and } from 'drizzle-orm';
import { listings as listingsTable } from '../db/schema.js';
// ============================================
// PHASE 5: IMPORT SEARCH SERVICE
// ============================================
import searchService from '../services/searchService.js';

dotenv.config();

const router = Router();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// GET ALL LISTINGS - Public using Drizzle
router.get('/', cacheMiddleware(300, keyGenerators.listings), async (req, res) => {
  try {
    const { limit = 20, offset = 0, status = 'active' } = req.query;

    console.log('📦 Fetching all listings:', { limit, offset, status });

    const result = await dbService.getListings({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      success: true,
      listings: result.listings,
      total: result.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Fetch listings error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET LISTINGS BY BUSINESS - Public
router.get('/business/:businessId', cacheMiddleware(300), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status = 'active' } = req.query;

    console.log('🔍 Fetching listings for business:', businessId);

    const result = await dbService.getListingsByBusiness(businessId, {
      status,
      limit: 100,
      offset: 0,
    });

    return res.json({
      success: true,
      listings: result.listings,
      total: result.total,
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
// SEARCH LISTINGS - Public (Database fallback)
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

    const result = await dbService.searchListings(q, {
      category,
      location: req.query.location,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      success: true,
      listings: result.listings,
      total: result.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET LISTING BY ID - Public
router.get('/:id', cacheMiddleware(600), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching listing by ID:', id);

    const listing = await dbService.getListing(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Increment view count
    await dbService.incrementViewCount(id);

    return res.json({
      success: true,
      listing: listing
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
// PROTECTED ROUTES (Authentication required)
// ============================================

// CREATE LISTING - Protected with image upload
router.post('/create', authenticateToken, upload.array('images', 5), async (req, res) => {
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

    // Check business exists
    const business = await dbService.getBusiness(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Upload images using storage service (Cloudinary with Supabase fallback)
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        imageUrls = await storageService.uploadListingImages(req.files, businessId);
        console.log(`✅ Uploaded ${imageUrls.length} images`);
      } catch (uploadError) {
        console.error('⚠️ Image upload warning:', uploadError.message);
      }
    } else {
      console.log('⚠️ No images to upload');
    }

    // Parse numeric values
    const parsedPrice = price !== undefined && price !== '' && price !== null ? parseFloat(price) : null;
    const parsedDeliveryFee = deliveryFee !== undefined && deliveryFee !== '' && deliveryFee !== null ? parseFloat(deliveryFee) : null;
    const parsedQuantity = quantity !== undefined && quantity !== '' && quantity !== null ? parseInt(quantity, 10) : null;

    // Validate price range
    const finalPrice = parsedPrice !== null && parsedPrice <= 99999999.99 ? parsedPrice : null;
    const finalDeliveryFee = parsedDeliveryFee !== null && parsedDeliveryFee <= 99999999.99 ? parsedDeliveryFee : null;

    const listingData = {
      businessId,
      title,
      description: description || '',
      category: category || 'Other',
      subCategory: subCategory || '',
      price: finalPrice,
      priceType: priceType || 'fixed',
      quantity: parsedQuantity,
      unit: unit || '',
      images: imageUrls,
      status: status || 'active',
      locationArea: locationArea || '',
      deliveryAvailable: deliveryAvailable === true || deliveryAvailable === 'true',
      deliveryFee: finalDeliveryFee,
      contactPhone: contactPhone || '',
    };

    const listing = await dbService.createListing(listingData);

    // ============================================
    // PHASE 5: INDEX IN SEARCH
    // ============================================
    try {
      // Fetch full listing with business data for indexing
      const fullListing = await dbService.getListing(listing.id);
      if (fullListing) {
        await searchService.indexListing(fullListing);
        console.log('🔍 Listing indexed in search:', listing.id);
      }
    } catch (searchError) {
      console.warn('⚠️ Search indexing warning:', searchError.message);
      // Don't fail the request if search indexing fails
    }

    await invalidateCache('listings:');
    await invalidateCache(`business:${businessId}`);

    console.log('✅ Listing created:', listing.id, 'Images:', imageUrls.length);

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing: listing
    });
  } catch (error) {
    console.error('❌ Listing creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create listing'
    });
  }
});

// UPDATE LISTING - Protected
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('🔄 Updating listing:', id);

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.businessId;
    delete updates.createdAt;
    delete updates.viewCount;
    delete updates.contactCount;

    // Parse numeric values
    if (updates.price !== undefined) {
      const parsedPrice = updates.price !== '' && updates.price !== null ? parseFloat(updates.price) : null;
      updates.price = parsedPrice !== null && parsedPrice <= 99999999.99 ? parsedPrice : null;
    }
    if (updates.deliveryFee !== undefined) {
      const parsedFee = updates.deliveryFee !== '' && updates.deliveryFee !== null ? parseFloat(updates.deliveryFee) : null;
      updates.deliveryFee = parsedFee !== null && parsedFee <= 99999999.99 ? parsedFee : null;
    }
    if (updates.quantity !== undefined) {
      updates.quantity = updates.quantity !== '' && updates.quantity !== null ? parseInt(updates.quantity, 10) : null;
    }

    const listing = await dbService.updateListing(id, updates);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // ============================================
    // PHASE 5: UPDATE IN SEARCH
    // ============================================
    try {
      // Fetch full listing with business data for indexing
      const fullListing = await dbService.getListing(id);
      if (fullListing) {
        await searchService.indexListing(fullListing);
        console.log('🔍 Listing updated in search:', id);
      }
    } catch (searchError) {
      console.warn('⚠️ Search update warning:', searchError.message);
    }

    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);

    console.log('✅ Listing updated:', id);

    return res.json({
      success: true,
      message: 'Listing updated successfully',
      listing: listing
    });
  } catch (error) {
    console.error('❌ Update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE LISTING - Protected (Soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting listing:', id);

    const listing = await dbService.updateListing(id, { status: 'inactive' });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // ============================================
    // PHASE 5: DELETE FROM SEARCH
    // ============================================
    try {
      await searchService.deleteListing(id);
      console.log('🔍 Listing deleted from search:', id);
    } catch (searchError) {
      console.warn('⚠️ Search delete warning:', searchError.message);
    }

    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);

    console.log('✅ Listing deleted:', id);

    return res.json({
      success: true,
      message: 'Listing deleted successfully',
      listing: listing
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// HARD DELETE LISTING - Protected (Admin only - permanently delete)
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Permanently deleting listing:', id);

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
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

    // Get listing before deleting
    const listing = await dbService.getListing(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Delete from search
    try {
      await searchService.deleteListing(id);
      console.log('🔍 Listing deleted from search:', id);
    } catch (searchError) {
      console.warn('⚠️ Search delete warning:', searchError.message);
    }

    // Hard delete from database
    const deleted = await dbService.deleteListingPermanent(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);
    await invalidateCache(`business:${listing.businessId}`);

    console.log('✅ Listing permanently deleted:', id);

    return res.json({
      success: true,
      message: 'Listing permanently deleted successfully'
    });
  } catch (error) {
    console.error('❌ Permanent delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;