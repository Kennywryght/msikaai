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
import searchService from '../services/searchService.js';
import { reverseGeocode } from '../services/geocodingService.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const router = Router();
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ============================================
// HELPERS
// ============================================
const looksLikeCoords = (s) => {
  if (!s || typeof s !== 'string') return false;
  return /^near\s+-?\d+\.\d+,\s*-?\d+\.\d+$/i.test(s.trim());
};

const sanitizeListing = (row) => {
  if (!row) return row;
  const { locationLat, locationLng, ...rest } = row;

  const cleanedArea = looksLikeCoords(rest.locationArea) ? null : rest.locationArea;
  const cleanedName = looksLikeCoords(rest.locationName) ? null : rest.locationName;

  return {
    ...rest,
    locationArea: cleanedArea,
    locationName: cleanedName || cleanedArea || null,
  };
};

// ============================================
// PUBLIC ROUTES
// ============================================

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
      listings: result.listings.map(sanitizeListing),
      total: result.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('❌ Fetch listings error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

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
      listings: result.listings.map(sanitizeListing),
      total: result.total,
    });
  } catch (error) {
    console.error('❌ Fetch listings error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/search', cacheMiddleware(180, keyGenerators.search), async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, limit = 20, offset = 0 } = req.query;

    console.log('🔍 Searching listings:', { q, category, minPrice, maxPrice, limit, offset });

    const result = await dbService.searchListings(q, {
      category,
      location: req.query.location,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      success: true,
      listings: result.listings.map(sanitizeListing),
      total: result.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', cacheMiddleware(600), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching listing by ID:', id);

    const listing = await dbService.getListing(id);

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    await dbService.incrementViewCount(id);

    return res.json({ success: true, listing: sanitizeListing(listing) });
  } catch (error) {
    console.error('❌ Fetch listing error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PROTECTED ROUTES
// ============================================

// CREATE LISTING
// ★ Accepts locationLat / locationLng and reverse-geocodes if no name given
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
      locationLat,
      locationLng,
      deliveryAvailable,
      deliveryFee,
      contactPhone,
    } = req.body;

    console.log('📝 Creating listing:', { businessId, title, category });

    if (!businessId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and title are required',
      });
    }

    const business = await dbService.getBusiness(businessId);
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    // ---- Resolve place name ----
    let resolvedName = (locationArea || '').trim() || null;
    if (looksLikeCoords(resolvedName)) resolvedName = null;

    const latNum = locationLat != null && locationLat !== '' ? Number(locationLat) : null;
    const lngNum = locationLng != null && locationLng !== '' ? Number(locationLng) : null;

    if (
      !resolvedName &&
      latNum != null &&
      lngNum != null &&
      !Number.isNaN(latNum) &&
      !Number.isNaN(lngNum)
    ) {
      try {
        resolvedName = await reverseGeocode(latNum, lngNum);
        if (looksLikeCoords(resolvedName)) resolvedName = null;
      } catch (err) {
        logger.warn('reverseGeocode failed on createListing', {
          error: err?.message || err,
        });
      }
    }

    // ---- Images ----
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

    // ---- Numeric parsing ----
    const parsedPrice =
      price !== undefined && price !== '' && price !== null ? parseFloat(price) : null;
    const parsedDeliveryFee =
      deliveryFee !== undefined && deliveryFee !== '' && deliveryFee !== null
        ? parseFloat(deliveryFee)
        : null;
    const parsedQuantity =
      quantity !== undefined && quantity !== '' && quantity !== null
        ? parseInt(quantity, 10)
        : null;

    const finalPrice =
      parsedPrice !== null && parsedPrice <= 99999999.99 ? parsedPrice : null;
    const finalDeliveryFee =
      parsedDeliveryFee !== null && parsedDeliveryFee <= 99999999.99 ? parsedDeliveryFee : null;

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
      locationName: resolvedName,
      locationArea: locationArea || null,
      locationLat: latNum != null && !Number.isNaN(latNum) ? String(latNum) : null,
      locationLng: lngNum != null && !Number.isNaN(lngNum) ? String(lngNum) : null,
      deliveryAvailable: deliveryAvailable === true || deliveryAvailable === 'true',
      deliveryFee: finalDeliveryFee,
      contactPhone: contactPhone || '',
    };

    const listing = await dbService.createListing(listingData);

    // ---- Search indexing ----
    try {
      const fullListing = await dbService.getListing(listing.id);
      if (fullListing) {
        await searchService.indexListing(fullListing);
        console.log('🔍 Listing indexed in search:', listing.id);
      }
    } catch (searchError) {
      console.warn('⚠️ Search indexing warning:', searchError.message);
    }

    await invalidateCache('listings:');
    await invalidateCache(`business:${businessId}`);

    console.log('✅ Listing created:', listing.id, 'Images:', imageUrls.length);

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing: sanitizeListing(listing),
    });
  } catch (error) {
    console.error('❌ Listing creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create listing',
    });
  }
});

// UPDATE LISTING
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    console.log('🔄 Updating listing:', id);

    delete updates.id;
    delete updates.businessId;
    delete updates.createdAt;
    delete updates.viewCount;
    delete updates.contactCount;

    // If coords are being updated and no name is given, geocode
    if (
      (updates.locationLat !== undefined || updates.locationLng !== undefined) &&
      !updates.locationArea &&
      !updates.locationName
    ) {
      const latNum = updates.locationLat != null ? Number(updates.locationLat) : null;
      const lngNum = updates.locationLng != null ? Number(updates.locationLng) : null;
      if (latNum != null && lngNum != null && !Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        try {
          const name = await reverseGeocode(latNum, lngNum);
          if (name && !looksLikeCoords(name)) updates.locationName = name;
        } catch (err) {
          logger.warn('reverseGeocode failed on updateListing', {
            error: err?.message || err,
          });
        }
      }
    }

    if (updates.price !== undefined) {
      const parsedPrice =
        updates.price !== '' && updates.price !== null ? parseFloat(updates.price) : null;
      updates.price = parsedPrice !== null && parsedPrice <= 99999999.99 ? parsedPrice : null;
    }
    if (updates.deliveryFee !== undefined) {
      const parsedFee =
        updates.deliveryFee !== '' && updates.deliveryFee !== null
          ? parseFloat(updates.deliveryFee)
          : null;
      updates.deliveryFee = parsedFee !== null && parsedFee <= 99999999.99 ? parsedFee : null;
    }
    if (updates.quantity !== undefined) {
      updates.quantity =
        updates.quantity !== '' && updates.quantity !== null
          ? parseInt(updates.quantity, 10)
          : null;
    }

    const listing = await dbService.updateListing(id, updates);

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    try {
      const fullListing = await dbService.getListing(id);
      if (fullListing) {
        await searchService.indexListing(fullListing);
      }
    } catch (searchError) {
      console.warn('⚠️ Search update warning:', searchError.message);
    }

    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);

    return res.json({
      success: true,
      message: 'Listing updated successfully',
      listing: sanitizeListing(listing),
    });
  } catch (error) {
    console.error('❌ Update error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE LISTING (soft)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting listing:', id);

    const listing = await dbService.updateListing(id, { status: 'inactive' });

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    try {
      await searchService.deleteListing(id);
    } catch (searchError) {
      console.warn('⚠️ Search delete warning:', searchError.message);
    }

    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);

    return res.json({
      success: true,
      message: 'Listing deleted successfully',
      listing: sanitizeListing(listing),
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// HARD DELETE (admin)
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Permanently deleting listing:', id);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const listing = await dbService.getListing(id);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    try {
      await searchService.deleteListing(id);
    } catch (searchError) {
      console.warn('⚠️ Search delete warning:', searchError.message);
    }

    const deleted = await dbService.deleteListingPermanent(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    await invalidateCache('listings:');
    await invalidateCache(`listing:${id}`);
    await invalidateCache(`business:${listing.businessId}`);

    return res.json({
      success: true,
      message: 'Listing permanently deleted successfully',
    });
  } catch (error) {
    console.error('❌ Permanent delete error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;