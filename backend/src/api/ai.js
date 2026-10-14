// backend/src/api/ai.js
import { Router } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import groqService from '../services/groqService.js';
import geminiService from '../services/geminiService.js';
import aiService, { LISTING_CATEGORIES } from '../services/aiService.js';
import dbService from '../services/dbService.js';
import searchService from '../services/searchService.js';
import { parseQuery, mergeTranslatedTerms, _internals as lexiconInternals } from '../services/bilingualSearch.js';
import visionService from '../services/VisionService.js';
import { invalidateCache } from '../middleware/cache.js';
import { checkBusinessAccess } from '../utils/authz.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const storage = multer.memoryStorage();
const typeFilter = (pattern, label) => (req, file, cb) =>
  pattern.test(file.mimetype)
    ? cb(null, true)
    : cb(Object.assign(new Error(`Please upload ${label}`), { status: 400 }));
const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: typeFilter(/^image\//, 'an image (JPG, PNG or WebP)'),
});
const audioUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: typeFilter(/^(audio|video)\/(webm|ogg|mp4|mpeg|mp3|wav|x-wav|m4a|x-m4a|aac|3gpp)/, 'an audio recording'),
});
// Upload problems (wrong type, too big) are the client's to fix: answer 400
// with the reason instead of falling through to the generic 500 handler.
const handleUpload = (mw) => (req, res, next) =>
  mw(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message || 'Upload failed';
    return res.status(400).json({ success: false, error: message });
  });

// ============================================
// ★ PHASE 7A: TRANSLATE SEARCH QUERY (Chichewa → English)
// ============================================
router.post('/translate-search', async (req, res) => {
  try {
    const rawQuery = req.body?.q ?? req.body?.query ?? '';
    const query = String(rawQuery).trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query (q) is required',
      });
    }

    if (query.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Query is too long (max 200 chars)',
      });
    }

    const result = await aiService.translateChichewaQuery(query);

    return res.json({
      success: true,
      original: query,
      translated: result.translated,
      detectedLanguage: result.detectedLanguage,
      confidence: result.confidence,
      keywords: result.keywords,
    });
  } catch (error) {
    logger.error('❌ /translate-search error:', error?.message || error);
    const fallbackQuery = String(req.body?.q ?? req.body?.query ?? '').trim();
    return res.json({
      success: true,
      original: fallbackQuery,
      translated: fallbackQuery,
      detectedLanguage: 'unknown',
      confidence: 0,
      keywords: fallbackQuery ? [fallbackQuery] : [],
      fallback: true,
    });
  }
});

router.get('/translate-search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'q is required' });
    }
    const result = await aiService.translateChichewaQuery(query);
    return res.json({
      success: true,
      original: query,
      translated: result.translated,
      detectedLanguage: result.detectedLanguage,
      confidence: result.confidence,
      keywords: result.keywords,
    });
  } catch (error) {
    logger.error('❌ GET /translate-search error:', error?.message || error);
    return res.status(500).json({ success: false, error: 'Translation failed' });
  }
});

// ============================================
// ★ PHASE 7B: PRICE SUGGESTION
// ============================================
router.post('/price-suggest', async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const category = String(req.body?.category || '').trim();

    if (!title || title.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Title (min 3 chars) is required',
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Title is too long (max 200 chars)',
      });
    }

    const suggestion = await aiService.suggestPriceForListing({
      title,
      category,
    });

    return res.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    logger.error('❌ /price-suggest error:', error?.message || error);
    return res.json({
      success: true,
      suggestion: {
        hasSuggestion: false,
        reason: 'server_error',
        message: 'Could not analyze pricing right now.',
      },
    });
  }
});

// ============================================
// ★ PHASE 7C: LISTING QUALITY SCORE
// ============================================
/**
 * POST /api/ai/quality-score
 * Body: { listingId } OR { title, description, category, price, images, ... }
 * Returns: { success, quality: { score, grade, breakdown, tips } }
 */
router.post('/quality-score', async (req, res) => {
  try {
    const body = req.body || {};
    const listingId = body.listingId ? String(body.listingId).trim() : '';
    const title = String(body.title || '').trim();

    // Need either a listingId OR at least a title
    if (!listingId && title.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Provide a listingId OR a title (min 3 chars)',
      });
    }

    const quality = await aiService.scoreListingQuality({
      listingId: listingId || undefined,
      title: body.title,
      description: body.description,
      category: body.category,
      subCategory: body.subCategory || body.sub_category,
      price: body.price,
      quantity: body.quantity,
      unit: body.unit,
      images: Array.isArray(body.images) ? body.images : [],
      locationArea: body.locationArea || body.location_area,
      deliveryAvailable: body.deliveryAvailable ?? body.delivery_available,
      contactPhone: body.contactPhone || body.contact_phone,
    });

    return res.json({
      success: true,
      quality,
    });
  } catch (error) {
    logger.error('❌ /quality-score error:', error?.message || error);
    // Graceful — never block the listing form
    return res.json({
      success: true,
      quality: {
        score: 0,
        grade: 'poor',
        breakdown: {},
        tips: [],
        error: 'server_error',
      },
    });
  }
});

// ============================================
// ★ PHASE 7D: SALES ASSISTANT
// ============================================
/**
 * POST /api/ai/sales-assist
 * Body: { buyerMessage, listing?, history?, tone? }
 * Returns: { success, assist: { draft, alternatives, tone } }
 */
router.post('/sales-assist', async (req, res) => {
  try {
    const buyerMessage = String(req.body?.buyerMessage || '').trim();
    if (!buyerMessage) {
      return res.status(400).json({
        success: false,
        error: 'buyerMessage is required',
      });
    }
    if (buyerMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'buyerMessage is too long (max 1000 chars)',
      });
    }

    const listing = req.body?.listing || {};
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const tone = String(req.body?.tone || 'friendly');

    const assist = await aiService.draftSalesReply({
      buyerMessage,
      listing,
      history,
      tone,
    });

    return res.json({
      success: true,
      assist,
    });
  } catch (error) {
    logger.error('❌ /sales-assist error:', error?.message || error);
    return res.json({
      success: true,
      assist: {
        draft: 'Thanks for your message! I will get back to you shortly.',
        alternatives: [],
        tone: 'friendly',
        error: 'server_error',
      },
    });
  }
});

// ============================================
// 1. SMART SEARCH
// ============================================
router.post('/search', async (req, res) => {
  try {
    const { query, category } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const text = String(query).trim().slice(0, 300);
    logger.info('🔍 AI Search:', { query: text, category });

    // Dictionary parse of the full sentence is instant and works offline; the
    // AI (capped at ~3.5s, cached 24h) adds keywords for words it didn't know,
    // plus a reply and related searches.
    let parsed = parseQuery(text);
    const ai = await aiService.understandSearchQuery(text, {
      timeoutMs: 3500,
      unknownWords: parsed.unknown,
    });
    if (ai?.keywords?.length) parsed = mergeTranslatedTerms(parsed, ai.keywords);

    const { listings: rows, interpretation } = await dbService.searchListings(null, {
      parsed,
      category: category && category !== 'All' ? category : undefined,
      limit: 20,
      offset: 0,
    });

    const maxRelevance = Math.max(1, ...rows.map((r) => r.relevance || 0));
    const results = rows.map((r) => toAISearchItem(r, text, maxRelevance));

    res.json({
      success: true,
      results,
      total: results.length,
      query: text,
      ai_processed: !!ai,
      method: ai ? `${ai.provider}+bilingual` : 'bilingual',
      ai_response: ai?.reply || null,
      related_searches: ai?.related || [],
      suggested_category: ai?.category || category || 'All',
      interpretation,
    });
  } catch (error) {
    logger.error('❌ AI Search error:', error);
    res.status(500).json({ success: false, error: 'Search failed. Please try again.' });
  }
});

// dbService row (camelCase) → the snake_case shape AISearch.jsx renders
function toAISearchItem(r, query, maxRelevance) {
  const b = r.businesses;
  const item = {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    price: r.price,
    price_type: r.priceType,
    images: (r.images || []).filter((s) => typeof s === 'string' && /^https?:\/\/\S+$/i.test(s.trim())),
    location_area: r.locationArea,
    location_name: r.locationName,
    delivery_available: r.deliveryAvailable,
    is_premium: r.isPremium,
    created_at: r.createdAt,
    relevance_score: Math.round(((r.relevance || 0) / maxRelevance) * 100) / 100,
    businesses: b
      ? {
          id: b.id,
          user_id: b.userId,
          business_name: b.businessName,
          category: b.category,
          phone: b.phone,
          address: b.address,
          rating: b.rating,
          logo_url: b.logoUrl,
        }
      : null,
  };
  return { ...item, ai_summary: getAISummary(item, query), ai_enhanced: true };
}

// ============================================
// 2. AI SUGGESTIONS
// ============================================
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const text = String(q).trim().slice(0, 100);
    const lower = text.toLowerCase();
    // Suggest on the last word being typed, so "ndikufuna chim" → chimanga
    const lastWord = lower.split(/\s+/).pop();
    const escLike = (s) => s.replace(/[\\%_]/g, '\\$&');

    const [{ data: titles }, { data: cats }] = await Promise.all([
      supabase
        .from('listings')
        .select('title')
        .eq('status', 'active')
        .ilike('title', `%${escLike(lastWord.length >= 2 ? lastWord : lower)}%`)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('listings').select('category').eq('status', 'active').limit(200),
    ]);

    const categories = [...new Set((cats || []).map((r) => r.category).filter(Boolean))]
      .filter((c) => c.toLowerCase().includes(lastWord));

    // Dictionary words (both languages) that start with what's being typed
    const dictionary = lastWord.length >= 2
      ? [...lexiconInternals.KEY_TO_CONCEPT.keys()].filter((k) => k.startsWith(lastWord) && k !== lastWord).slice(0, 4)
      : [];
    const prefix = lower.slice(0, lower.length - lastWord.length);

    const chichewaQueries = [
      'Ndikufuna chimanga cha mtengo wotsika',
      'Ndikufuna plumber pafupi ndi Mitundu',
      'Kodi pali wokonza magetsi?',
      'Ndikufuna ana a nkhuku',
      'Nsapato za akazi pansi pa 5000',
      'Ndikufunafuna nyumba yobwereka',
      'Ndikufuna wina wondimetera tsitsi',
      'Feteleza ndi mbewu za chimanga',
    ].filter((s) => s.toLowerCase().includes(lastWord));

    const seen = new Set();
    const suggestions = [
      ...dictionary.map((w) => `${prefix}${w}`),
      ...(titles || []).map((r) => r.title),
      ...categories,
      ...chichewaQueries,
    ].filter((s) => {
      const k = String(s || '').toLowerCase().trim();
      if (!k || k === lower || seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 8);

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error('❌ AI Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// 3. GENERATE DESCRIPTION
// ============================================
/**
 * POST /api/ai/generate-description
 * Body: { title, category?, features?, price?, unit?, location?, language?: 'en'|'ny'|'both' }
 */
router.post('/generate-description', async (req, res) => {
  const body = req.body || {};
  const title = String(body.title || '').trim();
  if (title.length < 3) {
    return res.status(400).json({ success: false, error: 'Title (min 3 chars) is required' });
  }

  try {
    const { description, provider } = await aiService.writeListingDescription({
      title: title.slice(0, 200),
      category: String(body.category || '').slice(0, 60),
      features: String(body.features || body.description || '').slice(0, 1000),
      price: body.price,
      unit: String(body.unit || '').slice(0, 30),
      location: String(body.location || '').slice(0, 80),
      language: ['en', 'ny', 'both'].includes(body.language) ? body.language : 'en',
    });
    return res.json({ success: true, description, provider });
  } catch (error) {
    logger.error('❌ /generate-description error:', error?.message || error);
    return res.status(503).json({
      success: false,
      error: 'The AI writer is unavailable right now. Please write the description yourself.',
    });
  }
});

// ============================================
// 4. GENERATE AD (optionally from a product photo)
// ============================================
router.post('/ads/generate', handleUpload(imageUpload.single('image')), async (req, res) => {
  let productInfo = {};
  try {
    productInfo = typeof req.body.productInfo === 'string'
      ? JSON.parse(req.body.productInfo)
      : req.body.productInfo || {};
  } catch {
    return res.status(400).json({ success: false, error: 'productInfo must be valid JSON' });
  }

  try {
    const vision = req.file
      ? await visionService.analyzeImage(req.file.buffer, req.file.mimetype)
      : null;

    const info = {
      title: String(productInfo.title || vision?.detectedProduct || '').slice(0, 120),
      description: String(productInfo.description || vision?.description || '').slice(0, 1000),
      category: productInfo.category || vision?.category || 'Other',
      price: productInfo.price || '',
      unit: productInfo.unit || '',
      tone: productInfo.tone || '',
    };
    logger.info('🎨 Generating ad for:', info.title || '(from photo)');

    const generated = await aiService.generateAd(info, vision);
    const ad = generated?.ad || generateAdCopy(info);

    return res.json({
      success: true,
      ad,
      socialPosts: generateSocialPosts(ad, info),
      provider: generated?.provider || 'built-in',
      ai_processed: !!generated,
      vision: vision?.success
        ? {
            detectedProduct: vision.detectedProduct,
            category: vision.category,
            description: vision.description,
            features: vision.features,
            confidence: vision.confidence,
          }
        : null,
    });
  } catch (error) {
    logger.error('❌ Ad generation error:', error);
    const ad = generateAdCopy(productInfo);
    return res.json({
      success: true,
      ad,
      socialPosts: generateSocialPosts(ad, productInfo),
      provider: 'built-in',
      ai_processed: false,
    });
  }
});

// ============================================
// 5. VOICE LISTING — transcribe + extract fields
// ============================================
router.post('/voice/process', handleUpload(audioUpload.single('audio')), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Audio file is required' });
  }
  const language = req.body.language === 'en' ? 'en' : 'ny';

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      success: false,
      error: 'Voice listing is not available right now. Please use the normal listing form.',
    });
  }

  try {
    logger.info('🎤 Processing voice...', { bytes: req.file.size, type: req.file.mimetype, language });
    const transcription = await groqService.transcribeAudio(req.file.buffer, {
      language,
      mimeType: req.file.mimetype,
    });

    if (!transcription.success) {
      return res.status(422).json({
        success: false,
        error: language === 'ny'
          ? 'Sitinamve bwino. Chonde yesaninso pamalo opanda phokoso. (We could not hear the recording clearly. Please try again somewhere quiet.)'
          : 'We could not hear the recording clearly. Please try again somewhere quiet.',
      });
    }

    const transcript = transcription.text;
    const ai = await aiService.extractListingData(transcript, language);
    const listing = ai || extractListingData(transcript);

    return res.json({
      success: true,
      transcript,
      listing,
      validation: validateListing(listing),
      ai_processed: !!ai,
      method: ai ? 'whisper+ai' : 'whisper+rules',
    });
  } catch (error) {
    logger.error('❌ Voice processing error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process the recording. Please try again.' });
  }
});

// ============================================
// 6. VOICE LISTING — create
// ============================================
/**
 * POST /api/ai/voice/create-listing
 * JSON body: { businessId, listingData, transcript?, language? }
 * The owner is always the signed-in user (req.user), never a body field.
 */
router.post('/voice/create-listing', async (req, res) => {
  try {
    const { businessId } = req.body || {};
    const language = req.body?.language === 'en' ? 'en' : 'ny';
    const transcript = String(req.body?.transcript || '').slice(0, 2000);
    let listingData = req.body?.listingData;
    if (typeof listingData === 'string') {
      try { listingData = JSON.parse(listingData); } catch { listingData = null; }
    }
    if (!listingData || typeof listingData !== 'object') {
      return res.status(400).json({ success: false, error: 'Listing data is required' });
    }

    const access = await checkBusinessAccess(req.user.id, businessId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, error: access.error });
    }

    const validation = validateListing(listingData);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.errors.join(', '), validation });
    }

    const num = (v) => (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
    const price = num(listingData.price);
    const quantity = num(listingData.quantity);
    const location = String(listingData.location || listingData.locationArea || '').trim().slice(0, 80) || null;

    const listing = await dbService.createListing({
      businessId,
      title: String(listingData.title).trim().slice(0, 200),
      description: String(listingData.description || transcript || '').slice(0, 2000),
      category: aiService.validateCategory(listingData.category),
      price: price != null && price <= 99999999.99 ? price : null,
      priceType: listingData.priceType === 'negotiable' ? 'negotiable' : 'fixed',
      quantity: quantity != null ? Math.round(quantity) : null,
      unit: String(listingData.unit || '').slice(0, 30),
      images: [],
      status: 'active',
      locationName: location,
      locationArea: location,
      deliveryAvailable: listingData.deliveryAvailable === true || listingData.delivery_available === true,
      contactPhone: String(listingData.contactPhone || listingData.contact_phone || '').slice(0, 20),
    });

    try {
      const full = await dbService.getListing(listing.id);
      if (full) await searchService.indexListing(full);
    } catch (searchError) {
      logger.warn('Voice listing search indexing skipped:', searchError?.message);
    }
    await invalidateCache('listings:');
    await invalidateCache(`business:${businessId}`);

    logger.info('✅ Voice listing created', { id: listing.id, language });
    return res.status(201).json({
      success: true,
      listing,
      transcript,
      validation,
      ai_processed: true,
    });
  } catch (error) {
    logger.error('❌ Voice listing creation error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create listing' });
  }
});

// ============================================
// 7. SMART MATCHING — real listings for a need
// ============================================
/**
 * POST /api/ai/match  { query, category? }
 * Understands the need (dictionary + AI) and returns matching live listings.
 */
router.post('/match', async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim().slice(0, 300);
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    let parsed = parseQuery(query);
    const ai = await aiService.understandSearchQuery(query, { timeoutMs: 3000, unknownWords: parsed.unknown });
    if (ai?.keywords?.length) parsed = mergeTranslatedTerms(parsed, ai.keywords);

    const { listings: rows, interpretation } = await dbService.searchListings(null, {
      parsed,
      category: req.body?.category || undefined,
      limit: 10,
    });
    const maxRelevance = Math.max(1, ...rows.map((r) => r.relevance || 0));

    return res.json({
      success: true,
      matches: rows.map((r) => {
        const item = toAISearchItem(r, query, maxRelevance);
        return {
          ...item,
          type: /service/i.test(r.category || '') ? 'service' : 'product',
          name: r.title,
          reason: item.ai_summary,
          confidence: item.relevance_score,
        };
      }),
      interpretation,
      message: ai?.reply || null,
      provider: ai?.provider || 'bilingual',
      ai_processed: !!ai,
    });
  } catch (error) {
    logger.error('Matching error:', error);
    return res.status(500).json({ success: false, error: 'Matching failed' });
  }
});

// ============================================
// 8. RECOMMENDATIONS — AI picks, real listings
// ============================================
/**
 * POST /api/ai/recommendations  { interests?: string[], history?: string[], location?, userType? }
 */
router.post('/recommendations', async (req, res) => {
  try {
    const interests = Array.isArray(req.body?.interests) ? req.body.interests.slice(0, 20) : [];
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(0, 30) : [];

    const plan = await aiService.getRecommendations({
      interests,
      history,
      location: req.body?.location || 'Mitundu',
      userType: req.body?.userType || 'buyer',
    });

    // Without AI, recommend from the user's own words.
    const searches = plan?.searches?.length ? plan.searches : [...interests, ...history].map(String).slice(0, 4);
    const seen = new Set();
    const personalized = [];
    for (const s of searches) {
      const { listings: rows } = await dbService.searchListings(s, { limit: 4 });
      for (const r of rows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        personalized.push({ ...toAISearchItem(r, s, Math.max(1, r.relevance || 1)), matched_search: s });
      }
      if (personalized.length >= 12) break;
    }

    // Top up with the newest listings so the section is never empty.
    if (personalized.length < 4) {
      const { listings: latest } = await dbService.searchListings(null, { limit: 8 });
      for (const r of latest) {
        if (!seen.has(r.id)) personalized.push(toAISearchItem(r, '', 1));
      }
    }

    return res.json({
      success: true,
      recommendations: {
        personalized: personalized.slice(0, 12),
        searches,
        trendingCategories: plan?.categories || [],
        reason: plan?.reason || null,
      },
      provider: plan ? 'ai' : 'built-in',
      ai_processed: !!plan,
    });
  } catch (error) {
    logger.error('Recommendations error:', error);
    return res.status(500).json({ success: false, error: 'Could not load recommendations' });
  }
});

// ============================================
// 9. VOICE PROMPTS
// ============================================
router.get('/voice/prompts', (req, res) => {
  const { language = 'ny' } = req.query;

  const prompts = {
    ny: [
      'Ndili ndi matumba khumi a chimanga ndikugulitsa. Mtengo ndi 5000 pa thumba.',
      'Ndikugulitsa nkhuku makumi awiri ndi mazira makumi asanu. Ndikupezeka ku Mitundu.',
      'Ndili ndi simenti matumba makumi asanu ndikugulitsa, ndikhoza kubweretsa.',
      'Ndine plumber ku Mitundu, ndimakonza mipope ndi matanki a madzi.',
      'Ndikugulitsa nsapato za amuna, mtengo ndi 12,000, mtengo ukhoza kuchepa.',
    ],
    en: [
      'I have 10 bags of maize for sale. Price is 5000 per bag.',
      'I am selling 20 chickens and 50 eggs in Mitundu.',
      'I have 50 bags of cement for sale and can deliver.',
      'I am a plumber in Mitundu. I fix pipes and water tanks.',
      'Selling men\'s shoes for 12,000 kwacha, price is negotiable.',
    ],
  };

  res.json({
    success: true,
    prompts: prompts[language] || prompts.ny,
  });
});

// ============================================
// 10. AD TEMPLATES
// ============================================
router.get('/ads/templates', (req, res) => {
  res.json({
    success: true,
    templates: {
      categories: LISTING_CATEGORIES,
      tones: ['Professional', 'Friendly', 'Urgent', 'Luxury', 'Budget', 'Eco-friendly'],
      platforms: ['Facebook', 'WhatsApp', 'Twitter', 'Instagram'],
    },
  });
});

// ============================================
// 11. BATCH AD GENERATION
// ============================================
router.post('/ads/batch-generate', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items array is required' });
    }
    if (items.length > 10) {
      return res.status(400).json({ success: false, error: 'At most 10 items per batch' });
    }

    // Sequential: free-tier AI quotas reject bursts of parallel calls.
    const results = [];
    for (const item of items) {
      const generated = await aiService.generateAd(item || {});
      const ad = generated?.ad || generateAdCopy(item || {});
      results.push({
        ad,
        socialPosts: generateSocialPosts(ad, item || {}),
        originalItem: item,
        provider: generated?.provider || 'built-in',
      });
    }

    return res.json({ success: true, results, ai_processed: results.some((r) => r.provider !== 'built-in') });
  } catch (error) {
    logger.error('❌ Batch ad generation error:', error);
    return res.status(500).json({ success: false, error: 'Batch ad generation failed' });
  }
});

// ============================================
// 12. HEALTH CHECK
// ============================================
router.get('/health', async (req, res) => {
  try {
    const groqStatus = groqService.checkAPIKey
      ? await groqService.checkAPIKey()
      : false;
    const geminiStatus = geminiService.checkAPIKey
      ? await geminiService.checkAPIKey()
      : false;

    res.json({
      success: true,
      status: {
        groq: groqStatus,
        gemini: geminiStatus,
        supabase: true,
      },
      message: 'AI services ready',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function getAISummary(item, query) {
  const relevance =
    query &&
    (item.title?.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()));

  const summaries = {
    'Farm Inputs': `🌾 ${item.title} available in Mitundu. ${
      relevance ? 'Matches your search.' : 'Quality farm inputs.'
    }`,
    Construction: `🔨 ${item.title} available in Mitundu. ${
      relevance ? 'Matches your search.' : 'Building materials.'
    }`,
    Plumber: `🔧 Professional plumbing services in Mitundu. ${
      relevance ? 'Matches your search.' : 'Contact for services.'
    }`,
    Electrician: `⚡ Electrical services in Mitundu. ${
      relevance ? 'Matches your search.' : 'Licensed electrician.'
    }`,
    Retail: `🛍️ ${item.title} available in Mitundu. ${
      relevance ? 'Matches your search.' : 'Quality products.'
    }`,
    Restaurant: `🍽️ Delicious meals available in Mitundu. ${
      relevance ? 'Matches your search.' : 'Dine with us.'
    }`,
  };

  return (
    summaries[item.category] ||
    `${item.title} available in Mitundu. ${
      relevance ? 'Matches your search.' : 'Contact for details.'
    }`
  );
}

// Chichewa number words → values, for the no-AI fallback ("matumba khumi")
const NY_NUMBERS = {
  modzi: 1, mmodzi: 1, imodzi: 1, chimodzi: 1, limodzi: 1, ziwiri: 2, awiri: 2, iwiri: 2,
  zitatu: 3, atatu: 3, itatu: 3, zinayi: 4, anayi: 4, zisanu: 5, asanu: 5, khumi: 10,
};

/** Rule-based listing extraction, used only when no AI provider answers. */
function extractListingData(transcript) {
  const text = String(transcript || '');
  const parsed = parseQuery(text);
  const main = parsed.concepts.find((c) => c.source !== 'raw');
  const data = {
    title: '',
    description: text,
    category: main?.category ? aiService.validateCategory(main.category) : 'Other',
    price: null,
    priceType: /negotiable|kuchepa|tikambirana/i.test(text) ? 'negotiable' : 'fixed',
    quantity: null,
    unit: '',
    deliveryAvailable: parsed.deliveryOnly || /deliver|kubweretsa|ndikhoza kubweretsa/i.test(text),
    location: parsed.location,
    contactPhone: (text.match(/(?:\+?265|0)\s?[89]\d{2}\s?\d{3}\s?\d{3}/) || [''])[0].replace(/\s/g, ''),
    missing: [],
    confidence: main ? 0.6 : 0.3,
  };

  if (main) {
    const label = main.label.charAt(0).toUpperCase() + main.label.slice(1);
    data.title = main.service ? `${label} services` : `${label} for sale`;
  } else {
    data.title = text.split(/\s+/).slice(0, 6).join(' ');
  }

  const amount = (s) => Number(String(s).replace(/,/g, ''));
  const priceMatch =
    text.match(/(?:mk|k|mwk|kwacha)\s*([\d,]+)/i) ||
    text.match(/([\d,]+)\s*(?:kwacha|mk)/i) ||
    text.match(/(?:mtengo|price)\D{0,20}([\d,]+)/i) ||
    text.match(/([\d,]+)\s*(?:per|each|pa)\s/i);
  if (priceMatch && amount(priceMatch[1]) > 0) {
    data.price = amount(priceMatch[1]);
    data.confidence += 0.1;
  }

  const qtyMatch = text.match(/(\d+)\s*(matumba|thumba|bags?|kg|pieces|pcs|malita|litres?)/i)
    || text.match(/(matumba|bags?)\s+(\w+)/i);
  if (qtyMatch) {
    const n = /^\d+$/.test(qtyMatch[1]) ? Number(qtyMatch[1]) : NY_NUMBERS[String(qtyMatch[2]).toLowerCase()];
    const unitWord = /^\d+$/.test(qtyMatch[1]) ? qtyMatch[2] : qtyMatch[1];
    if (n) {
      data.quantity = n;
      data.unit = aiService.validateUnit(unitWord);
      data.confidence += 0.1;
    }
  }

  if (data.price == null) data.missing.push('price');
  if (data.quantity == null) data.missing.push('quantity');
  if (!data.location) data.missing.push('location');
  data.confidence = Math.min(1, Math.max(0, data.confidence));
  return data;
}

function validateListing(data = {}) {
  const errors = [];
  const warnings = [];

  if (!data.title || String(data.title).trim().length < 3) {
    errors.push('Title is missing or too short');
  }
  if (!data.category || data.category === 'Other') {
    warnings.push('Category is set to "Other". Please review.');
  }
  if (data.price != null && Number(data.price) <= 0) {
    errors.push('Price must be greater than 0');
  }
  if (data.quantity != null && Number(data.quantity) <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  const missing = Array.isArray(data.missing) ? data.missing : [];
  if (missing.includes('price') || data.price == null) warnings.push('No price was mentioned — buyers will see "Price on request".');
  if (missing.includes('location')) warnings.push('No location was mentioned — nearby buyers find listings with a place name more easily.');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidence: data.confidence || 0.5,
  };
}

function generateAdCopy(productInfo) {
  const title = productInfo.title || 'Product';
  const category = productInfo.category || 'Other';
  const price = productInfo.price || 'competitive';
  const unit = productInfo.unit || 'piece';
  const description = productInfo.description || '';

  const adTemplates = {
    'Farm Inputs': {
      headline: `🌾 Premium ${title} Available Now!`,
      shortCopy: `Quality ${title} from trusted suppliers. ${price} per ${unit}.`,
      fullCopy: `Get premium ${title} for your farm or business. We offer competitive prices and reliable delivery in Mitundu and surrounding areas. ${description}`,
      cta: `📞 Contact us for ${title}!`,
      sellingPoints: [
        'Quality guaranteed',
        'Competitive prices',
        'Reliable delivery',
        'Trusted supplier',
      ],
    },
    Construction: {
      headline: `🔨 ${title} - Build with Confidence!`,
      shortCopy: `Premium ${title} for all your construction needs.`,
      fullCopy: `Get high-quality ${title} for your building projects. We supply materials to contractors and individuals across Mitundu. ${description}`,
      cta: `📞 Order ${title} today!`,
      sellingPoints: [
        'Premium quality',
        'Competitive pricing',
        'Quick delivery',
        'Trusted supplier',
      ],
    },
    Plumber: {
      headline: `🔧 Professional ${title} Services`,
      shortCopy: `Experienced plumber in Mitundu. Reliable and affordable.`,
      fullCopy: `Need a professional plumber? We offer fast, reliable, and affordable plumbing services in Mitundu and surrounding areas. ${description}`,
      cta: `📞 Call for emergency services!`,
      sellingPoints: [
        'Experienced team',
        'Fast response',
        'Affordable rates',
        'Emergency services',
      ],
    },
    default: {
      headline: `📢 ${title} Available Now!`,
      shortCopy: `Quality ${title} available in Mitundu.`,
      fullCopy: `Get quality ${title} at the best prices in Mitundu. We offer reliable service and customer satisfaction. ${description}`,
      cta: `📞 Contact us for details!`,
      sellingPoints: [
        'Quality products',
        'Best prices',
        'Reliable service',
        'Customer satisfaction',
      ],
    },
  };

  const template = adTemplates[category]
    || adTemplates[{ 'Construction Materials': 'Construction' }[category]]
    || adTemplates['default'];

  return {
    headline: template.headline,
    shortCopy: template.shortCopy,
    fullCopy: template.fullCopy,
    cta: template.cta,
    sellingPoints: template.sellingPoints,
  };
}

function generateSocialPosts(ad, productInfo = {}) {
  const tags = Array.isArray(ad.hashtags) && ad.hashtags.length
    ? ad.hashtags
    : ['#Kumsika', '#Mitundu', '#Malawi'];
  const hashtags = [...new Set([...tags, '#Kumsika'])].join(' ');
  const title = ad.headline || ad.title || productInfo.title || 'New Listing';
  const cta = ad.cta || 'Contact for details.';
  const price = productInfo.price ? `\n💰 MK ${Number(productInfo.price).toLocaleString()}${productInfo.unit ? ` / ${productInfo.unit}` : ''}` : '';
  const ny = ad.chichewa?.headline ? `\n\n🇲🇼 ${ad.chichewa.headline}\n${ad.chichewa.shortCopy || ''}` : '';
  const short = ad.shortCopy || ad.description || '';

  return {
    facebook: `${title}\n\n${ad.fullCopy || ad.description || ''}${price}\n\n${cta}${ny}\n\n${hashtags}`,
    whatsapp: `*${title}*\n\n${short}${price}\n\n${cta}${ny}`,
    twitter: `${title}\n${short.length > 120 ? `${short.slice(0, 117)}...` : short}\n${hashtags}`.slice(0, 280),
  };
}

export default router;