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
import { checkBusinessAccess, checkListingAccess, pick } from '../utils/authz.js';
import { parseQuery, mergeTranslatedTerms } from '../services/bilingualSearch.js';
import aiService from '../services/aiService.js';

// Statuses a seller may set; 'suspended' is admin-only (moderation).
const OWNER_STATUSES = ['active', 'inactive', 'pending'];
const ALL_STATUSES = [...OWNER_STATUSES, 'suspended'];

// Fields a seller may edit. Boost (isPremium/premiumUntil), featured,
// counters and ownership are deliberately absent.
const EDITABLE_LISTING_FIELDS = [
  ['title'], ['description'], ['category'], ['subCategory', 'sub_category'],
  ['price'], ['priceType', 'price_type'], ['quantity'], ['unit'], ['images'],
  ['status'], ['locationArea', 'location_area'], ['locationName', 'location_name'],
  ['locationLat', 'location_lat'], ['locationLng', 'location_lng'],
  ['deliveryAvailable', 'delivery_available'], ['deliveryFee', 'delivery_fee'],
  ['contactPhone', 'contact_phone'],
];

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

// Only persisted, absolute http(s) image URLs are valid. Rejects blob: (client
// previews that were never uploaded), data:, relative paths and empty values.
const isValidImageUrl = (src) => {
  if (typeof src !== 'string') return false;
  const s = src.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname;
  } catch {
    return false;
  }
};

const sanitizeImages = (images) => {
  let list = images;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = [list]; }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((s) => (typeof s === 'string' ? s.trim() : s)).filter(isValidImageUrl))];
};

const MAX_PAGE_SIZE = 50;
const parseLimit = (v, def = 20) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_PAGE_SIZE) : def;
};
const parseOffset = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const sanitizeListing = (row) => {
  if (!row) return row;
  const { locationLat, locationLng, ...rest } = row;

  const cleanedArea = looksLikeCoords(rest.locationArea) ? null : rest.locationArea;
  const cleanedName = looksLikeCoords(rest.locationName) ? null : rest.locationName;

  return {
    ...rest,
    images: sanitizeImages(rest.images),
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
      limit: parseLimit(limit),
      offset: parseOffset(offset),
    });

    return res.json({
      success: true,
      listings: result.listings.map(sanitizeListing),
      total: result.total,
      limit: parseLimit(limit),
      offset: parseOffset(offset),
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
    const num = (v) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

    // Chichewa / English / mixed sentence → concepts + price/delivery/location intent
    let parsed = q ? parseQuery(String(q)) : null;
    if (parsed && parsed.unknown.length && parsed.language !== 'en' && aiService.getAvailableProvider()) {
      // Dictionary missed some words: ask the AI translator, but never let it
      // hold up search for more than ~1.5s (results are cached for 24h).
      try {
        const ai = await Promise.race([
          aiService.translateChichewaQuery(parsed.original),
          new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
        const words = ai ? [ai.translated, ...(ai.keywords || [])].filter(Boolean) : [];
        if (words.length) parsed = mergeTranslatedTerms(parsed, words);
      } catch (err) {
        logger.warn('Search AI translation skipped:', err?.message);
      }
    }

    const result = await dbService.searchListings(null, {
      parsed,
      category,
      location: req.query.location,
      minPrice: num(minPrice),
      maxPrice: num(maxPrice),
      limit: parseLimit(limit),
      offset: parseOffset(offset),
    });

    return res.json({
      success: true,
      listings: result.listings.map(sanitizeListing),
      total: result.total,
      interpretation: result.interpretation,
      limit: parseLimit(limit),
      offset: parseOffset(offset),
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/listings/price-board?days=14&location=Mitundu
// Market price ranges aggregated from active listings (public, cached 5 min).
router.get('/price-board', cacheMiddleware(300), async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 60);
    const location = req.query.location ? String(req.query.location).slice(0, 80) : null;
    const board = await dbService.getPriceBoard({ days, location });
    return res.json({ success: true, ...board });
  } catch (error) {
    console.error('❌ Price board error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Keyed as listing:<id> so invalidateCache(`listing:${id}`) on update/delete/review hits it.
router.get('/:id', cacheMiddleware(600, (req) => `listing:${req.params.id}`), async (req, res) => {
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

    const access = await checkBusinessAccess(req.user.id, businessId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, error: access.error });
    }
    if (String(title).trim().length > 200) {
      return res.status(400).json({ success: false, error: 'Title is too long (max 200 characters)' });
    }
    if (status && !OWNER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of ${OWNER_STATUSES.join(', ')}` });
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

    const access = await checkListingAccess(req.user.id, id);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    const updates = pick(req.body || {}, EDITABLE_LISTING_FIELDS);
    if (access.admin && req.body?.featured !== undefined) updates.featured = !!req.body.featured;

    if (updates.status !== undefined) {
      const allowed = access.admin ? ALL_STATUSES : OWNER_STATUSES;
      if (!allowed.includes(updates.status)) {
        return res.status(400).json({ success: false, error: `status must be one of ${allowed.join(', ')}` });
      }
    }
    // A listing suspended by moderation stays locked for its owner.
    if (!access.admin && access.listing.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'This listing was suspended by an admin' });
    }
    if (updates.deliveryAvailable !== undefined) {
      updates.deliveryAvailable = updates.deliveryAvailable === true || updates.deliveryAvailable === 'true';
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, error: 'No editable fields provided' });
    }

    console.log('🔄 Updating listing:', id);

    // Never persist blob:/empty/invalid image URLs sent by the client
    if (updates.images !== undefined) {
      updates.images = sanitizeImages(updates.images);
    }

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

    const access = await checkListingAccess(req.user.id, id);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

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