// backend/src/services/aiService.js
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Supabase client for price aggregation queries
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================
// In-memory caches
// ============================================================
const TRANSLATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const translationCache = new Map();

const PRICE_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const priceCache = new Map();

const QUALITY_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (listing content changes often)
const qualityCache = new Map();

const cacheGet = (key) => {
  const entry = translationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > TRANSLATION_CACHE_TTL_MS) {
    translationCache.delete(key);
    return null;
  }
  return entry.v;
};

const cacheSet = (key, value) => {
  translationCache.set(key, { v: value, t: Date.now() });
  if (translationCache.size > 5000) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
};

const priceCacheGet = (key) => {
  const entry = priceCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > PRICE_CACHE_TTL_MS) {
    priceCache.delete(key);
    return null;
  }
  return entry.v;
};

const priceCacheSet = (key, value) => {
  priceCache.set(key, { v: value, t: Date.now() });
  if (priceCache.size > 2000) {
    const firstKey = priceCache.keys().next().value;
    priceCache.delete(firstKey);
  }
};

const qualityCacheGet = (key) => {
  const entry = qualityCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > QUALITY_CACHE_TTL_MS) {
    qualityCache.delete(key);
    return null;
  }
  return entry.v;
};

const qualityCacheSet = (key, value) => {
  qualityCache.set(key, { v: value, t: Date.now() });
  if (qualityCache.size > 3000) {
    const firstKey = qualityCache.keys().next().value;
    qualityCache.delete(firstKey);
  }
};

class AIService {
  constructor() {
    this.providers = {
      groq: {
        available: !!GROQ_API_KEY,
        name: 'Groq',
        rateLimit: 1000,
        used: 0,
      },
      openrouter: {
        available: !!OPENROUTER_API_KEY,
        name: 'OpenRouter',
        rateLimit: 50,
        used: 0,
      },
      gemini: {
        available: !!GEMINI_API_KEY,
        name: 'Gemini',
        rateLimit: 1500,
        used: 0,
      },
    };
    this.defaultProvider = this.getAvailableProvider();
  }

  // ============================================
  // 1. SELECT BEST AVAILABLE PROVIDER
  // ============================================
  getAvailableProvider() {
    if (this.providers.groq.available) return 'groq';
    if (this.providers.gemini.available) return 'gemini';
    if (this.providers.openrouter.available) return 'openrouter';
    return null;
  }

  // ============================================
  // 2. AI SEARCH
  // ============================================
  async search(query, context = {}) {
    try {
      const provider = this.getAvailableProvider();
      if (!provider) {
        logger.warn('No AI provider available for search');
        return this.getFallbackSearch(query);
      }

      const systemPrompt = `You are MsikaAI, an AI assistant for a marketplace in Mitundu, Malawi. 
        Generate search suggestions, category matches, and relevant listings for:
        - Query: "${query}"
        - Context: ${JSON.stringify(context)}
        
        Respond with a JSON object containing:
        {
          "categories": ["category1", "category2"],
          "keywords": ["keyword1", "keyword2"],
          "suggestions": ["suggestion1", "suggestion2"],
          "summary": "Brief summary of what this search is about"
        }`;

      const response = await this.callProvider(provider, systemPrompt, query);
      return this.parseAIResponse(response);
    } catch (error) {
      logger.error('AI Search error:', error);
      return this.getFallbackSearch(query);
    }
  }

  // ============================================
  // 3. TRANSLATE CHICHEWA SEARCH QUERY
  // ============================================
  async translateChichewaQuery(query) {
    const originalQuery = String(query || '').trim();
    if (!originalQuery) {
      return {
        translated: '',
        detectedLanguage: 'unknown',
        confidence: 0,
        keywords: [],
      };
    }

    const cacheKey = originalQuery.toLowerCase();
    const cached = cacheGet(cacheKey);
    if (cached) {
      logger.info('🌍 Translation cache HIT:', { q: cacheKey });
      return cached;
    }

    const provider = this.getAvailableProvider();
    if (!provider) {
      logger.warn('No AI provider available for translation — using passthrough');
      const passthrough = {
        translated: originalQuery,
        detectedLanguage: 'unknown',
        confidence: 0,
        keywords: [originalQuery],
      };
      cacheSet(cacheKey, passthrough);
      return passthrough;
    }

    const systemPrompt = `You are a translation engine for a Malawian marketplace (Kumsika).
The user typed a search query that may be in Chichewa, English, or a mix.
Your job: translate it to English keywords that would match marketplace listings.

RULES:
- If the query is already English, return it unchanged.
- If Chichewa, translate the CORE product noun — not word-for-word.
- Drop filler words (ndikufuna, ndikufuna, please, pali, kodi, etc).
- Keep brand names unchanged.
- Use common Malawian marketplace English: "maize" (not "corn"),
  "groundnuts" (not "peanuts"), "tomatoes" (plural for commodities),
  "cloth" or "fabric" for textiles.
- If a query contains MULTIPLE product ideas, keep them space-separated.
- If uncertain, return the original query.
- NEVER invent products that aren't in the query.

EXAMPLES:
  "chimanga"            → translated: "maize",           lang: "ny",  conf: 0.98
  "ndikufuna chimanga"  → translated: "maize",           lang: "ny",  conf: 0.95
  "zovala zachikazi"    → translated: "women clothes",   lang: "ny",  conf: 0.92
  "nyama ya nkhumba"    → translated: "pork",            lang: "ny",  conf: 0.94
  "matimati"            → translated: "tomatoes",        lang: "ny",  conf: 0.96
  "mchere"              → translated: "salt",            lang: "ny",  conf: 0.98
  "fodya"               → translated: "tobacco",         lang: "ny",  conf: 0.97
  "maize"               → translated: "maize",           lang: "en",  conf: 0.99
  "I need tomatoes"     → translated: "tomatoes",        lang: "en",  conf: 0.97
  "plumber"             → translated: "plumber",         lang: "en",  conf: 0.99
  "makina osokera"      → translated: "sewing machine",  lang: "ny",  conf: 0.9

USER QUERY: "${originalQuery}"

Return ONLY valid JSON, no markdown, no preamble:
{
  "translated": "the English keyword(s)",
  "detectedLanguage": "ny" | "en" | "mixed" | "unknown",
  "confidence": 0.0–1.0,
  "keywords": ["original_keyword_if_distinct", "translated_keyword"]
}`;

    try {
      const raw = await this.callProvider(
        provider,
        systemPrompt,
        `Translate: "${originalQuery}"`,
        0.1
      );

      const parsed = this.parseTranslationResponse(raw, originalQuery);
      cacheSet(cacheKey, parsed);

      logger.info('🌍 Translation completed:', {
        from: originalQuery,
        to: parsed.translated,
        lang: parsed.detectedLanguage,
        provider,
      });

      return parsed;
    } catch (error) {
      logger.error('translateChichewaQuery error:', error?.message || error);
      const passthrough = {
        translated: originalQuery,
        detectedLanguage: 'unknown',
        confidence: 0,
        keywords: [originalQuery],
      };
      return passthrough;
    }
  }

  parseTranslationResponse(raw, fallbackQuery) {
    if (!raw || typeof raw !== 'string') {
      return {
        translated: fallbackQuery,
        detectedLanguage: 'unknown',
        confidence: 0,
        keywords: [fallbackQuery],
      };
    }

    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      logger.warn('Translation JSON parse failed, falling back');
      return {
        translated: fallbackQuery,
        detectedLanguage: 'unknown',
        confidence: 0,
        keywords: [fallbackQuery],
      };
    }

    const translated = String(parsed.translated || fallbackQuery).trim();
    const detectedLanguage = ['ny', 'en', 'mixed', 'unknown'].includes(
      parsed.detectedLanguage
    )
      ? parsed.detectedLanguage
      : 'unknown';

    const confidenceRaw = Number(parsed.confidence);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0.5;

    let keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .map((k) => String(k || '').trim())
          .filter(Boolean)
      : [];

    const original = fallbackQuery.trim();
    if (original && !keywords.includes(original)) keywords.unshift(original);
    if (translated && !keywords.includes(translated)) keywords.push(translated);

    keywords = [...new Set(keywords)];

    return { translated, detectedLanguage, confidence, keywords };
  }

  // ============================================
  // ★ PHASE 7B: PRICE SUGGESTION (based on real listings)
  // ============================================
  async suggestPriceForListing({ title, category }) {
    const cleanTitle = String(title || '').trim();
    const cleanCategory = String(category || '').trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      return {
        hasSuggestion: false,
        reason: 'invalid_input',
        message: 'Title is too short to analyze.',
      };
    }

    const tokens = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4);
    const cacheKey = `${cleanCategory.toLowerCase()}::${tokens.join(' ')}`;

    const cached = priceCacheGet(cacheKey);
    if (cached) {
      logger.info('💰 Price cache HIT:', { key: cacheKey });
      return cached;
    }

    let comparables = [];
    try {
      comparables = await this.fetchComparableListings({
        tokens,
        category: cleanCategory,
      });
    } catch (err) {
      logger.error('fetchComparableListings error:', err?.message || err);
      return {
        hasSuggestion: false,
        reason: 'query_failed',
        message: 'Could not analyze similar listings right now.',
      };
    }

    if (comparables.length < 3) {
      const noData = {
        hasSuggestion: false,
        reason: 'insufficient_data',
        sampleSize: comparables.length,
        message: 'Not enough similar listings yet to suggest a price.',
      };
      priceCacheSet(cacheKey, noData);
      return noData;
    }

    const prices = comparables
      .map((l) => Number(l.price))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    if (prices.length < 3) {
      const noData = {
        hasSuggestion: false,
        reason: 'insufficient_data',
        sampleSize: prices.length,
        message: 'Not enough similar listings with prices yet.',
      };
      priceCacheSet(cacheKey, noData);
      return noData;
    }

    const min = prices[0];
    const max = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];
    const sampleSize = prices.length;

    const spread = (max - min) / (median || 1);
    let confidence = 'low';
    if (sampleSize >= 10 && spread < 0.6) confidence = 'high';
    else if (sampleSize >= 5 && spread < 1.2) confidence = 'medium';

    let insight = this.fallbackInsight({ min, median, max, cleanCategory });
    try {
      const provider = this.getAvailableProvider();
      if (provider) {
        const prompt = `You are a marketplace pricing assistant for Kumsika in Malawi.
You will be given a title, a category, and the prices of similar listings.
Write ONE short sentence (max 22 words) telling the seller what a fair price is.
Use Malawi Kwacha (MK) formatting like "MK 8,000".
Be specific and confident. Do NOT invent products. Do NOT mention AI.
Do NOT add greetings or emojis.

Title: ${cleanTitle}
Category: ${cleanCategory || 'Other'}
Similar listings — min: MK ${min.toLocaleString()}, median: MK ${median.toLocaleString()}, max: MK ${max.toLocaleString()}
Sample size: ${sampleSize}

Return ONLY the sentence, no JSON, no quotes.`;

        const raw = await this.callProvider(provider, prompt, 'Write the sentence.', 0.3);
        const cleaned = String(raw || '')
          .replace(/^["'`]+|["'`]+$/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleaned && cleaned.length >= 15 && cleaned.length <= 200) {
          insight = cleaned;
        }
      }
    } catch (err) {
      logger.warn('Price insight LLM failed, using fallback:', err?.message);
    }

    const result = {
      hasSuggestion: true,
      min,
      median,
      max,
      sampleSize,
      confidence,
      insight,
      currency: 'MWK',
      category: cleanCategory || null,
    };

    priceCacheSet(cacheKey, result);
    logger.info('💰 Price suggestion generated:', {
      key: cacheKey,
      min,
      median,
      max,
      sampleSize,
    });
    return result;
  }

  async fetchComparableListings({ tokens, category }) {
    if (!tokens || tokens.length === 0) return [];

    const ilikeClauses = tokens
      .filter((t) => t.length >= 3)
      .map((t) => `title.ilike.%${t}%`);
    if (ilikeClauses.length === 0) return [];

    let query = supabase
      .from('listings')
      .select('id, title, category, price, created_at')
      .eq('status', 'active')
      .not('price', 'is', null)
      .gt('price', 0)
      .or(ilikeClauses.join(','))
      .limit(50);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    if ((!data || data.length < 3) && category) {
      const retry = await supabase
        .from('listings')
        .select('id, title, category, price, created_at')
        .eq('status', 'active')
        .not('price', 'is', null)
        .gt('price', 0)
        .or(ilikeClauses.join(','))
        .limit(50);
      if (!retry.error && retry.data) return retry.data;
    }

    return data || [];
  }

  fallbackInsight({ min, median, max, cleanCategory }) {
    const fmt = (n) => `MK ${Number(n).toLocaleString()}`;
    const cat = cleanCategory ? ` in ${cleanCategory}` : '';
    if (min === max) {
      return `Similar items${cat} sell for about ${fmt(median)}.`;
    }
    return `Similar items${cat} sell for ${fmt(min)} – ${fmt(max)}, most around ${fmt(median)}.`;
  }

  // ============================================
  // ★ PHASE 7C: LISTING QUALITY SCORE
  // ============================================
  /**
   * Score a listing 0–100 based on completeness, clarity, and market fit.
   * Deterministic breakdown + LLM-generated improvement tips.
   *
   * @param {Object} input
   * @param {string} [input.listingId] - If provided, fetches listing from DB
   * @param {string} [input.title]
   * @param {string} [input.description]
   * @param {string} [input.category]
   * @param {number|string} [input.price]
   * @param {number|string} [input.quantity]
   * @param {string} [input.unit]
   * @param {Array}  [input.images]
   * @param {string} [input.locationArea]
   * @param {boolean}[input.deliveryAvailable]
   * @param {string} [input.contactPhone]
   *
   * Returns:
   *   { score, grade, breakdown, tips, computedAt }
   */
  async scoreListingQuality(input = {}) {
    let listing = { ...input };

    // Optionally hydrate from DB
    if (input.listingId) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', input.listingId)
          .maybeSingle();
        if (!error && data) {
          listing = { ...data, ...input, listingId: data.id };
        }
      } catch (err) {
        logger.warn('scoreListingQuality: DB fetch failed:', err?.message);
      }
    }

    const title = String(listing.title || '').trim();
    const description = String(listing.description || '').trim();
    const category = String(listing.category || '').trim();
    const subCategory = String(listing.subCategory || listing.sub_category || '').trim();
    const price = Number(listing.price) || 0;
    const quantity = Number(listing.quantity) || 0;
    const unit = String(listing.unit || '').trim();
    const locationArea = String(listing.locationArea || listing.location_area || '').trim();
    const contactPhone = String(listing.contactPhone || listing.contact_phone || '').trim();
    const deliveryAvailable = !!(listing.deliveryAvailable ?? listing.delivery_available);
    const images = Array.isArray(listing.images) ? listing.images.filter(Boolean) : [];

    // ============================================
    // MECHANICAL BREAKDOWN (max 100)
    // ============================================
    const breakdown = {
      photos:      { score: 0, max: 25 },
      title:       { score: 0, max: 20 },
      description: { score: 0, max: 20 },
      price:       { score: 0, max: 15 },
      details:     { score: 0, max: 10 },
      location:    { score: 0, max: 10 },
    };

    // --- PHOTOS (25) ---
    // 0 photos → 0, 1 → 12, 2 → 18, 3 → 22, 4+ → 25
    const photoCount = images.length;
    if (photoCount >= 4) breakdown.photos.score = 25;
    else if (photoCount === 3) breakdown.photos.score = 22;
    else if (photoCount === 2) breakdown.photos.score = 18;
    else if (photoCount === 1) breakdown.photos.score = 12;
    else breakdown.photos.score = 0;

    // --- TITLE (20) ---
    // Length (0–10) + word diversity (0–5) + no ALL CAPS spam (0–5)
    const titleLen = title.length;
    let titleScore = 0;
    if (titleLen >= 15 && titleLen <= 70) titleScore += 10;
    else if (titleLen >= 8) titleScore += 7;
    else if (titleLen >= 4) titleScore += 4;
    else if (titleLen > 0) titleScore += 1;

    const words = title.split(/\s+/).filter(Boolean);
    if (words.length >= 3 && words.length <= 10) titleScore += 5;
    else if (words.length >= 2) titleScore += 3;
    else if (words.length === 1) titleScore += 1;

    const capsRatio =
      title.length > 0
        ? title.replace(/[^A-Z]/g, '').length / title.replace(/[^A-Za-z]/g, '').length
        : 0;
    if (title.length > 0 && (isNaN(capsRatio) || capsRatio < 0.5)) titleScore += 5;
    else if (title.length > 0) titleScore += 2;

    breakdown.title.score = Math.min(20, titleScore);

    // --- DESCRIPTION (20) ---
    // Length (0–12) + sentence structure (0–4) + mentions price/qty (0–4)
    const descLen = description.length;
    let descScore = 0;
    if (descLen >= 120) descScore += 12;
    else if (descLen >= 60) descScore += 9;
    else if (descLen >= 25) descScore += 6;
    else if (descLen >= 10) descScore += 3;
    else if (descLen > 0) descScore += 1;

    const sentenceCount = (description.match(/[.!?]+/g) || []).length;
    if (sentenceCount >= 2) descScore += 4;
    else if (sentenceCount === 1) descScore += 2;

    const lowerDesc = description.toLowerCase();
    const mentionsSpecifics =
      /\d/.test(description) ||
      lowerDesc.includes('price') ||
      lowerDesc.includes('quality') ||
      lowerDesc.includes('condition') ||
      lowerDesc.includes('available') ||
      lowerDesc.includes('deliver');
    if (mentionsSpecifics) descScore += 4;

    breakdown.description.score = Math.min(20, descScore);

    // --- PRICE (15) ---
    // Present + reasonable (positive int) + not absurdly high
    let priceScore = 0;
    if (price > 0) priceScore += 10;
    if (price >= 100 && price <= 100_000_000) priceScore += 5;
    breakdown.price.score = Math.min(15, priceScore);

    // --- DETAILS (10) ---
    let detailScore = 0;
    if (category) detailScore += 3;
    if (subCategory) detailScore += 2;
    if (quantity > 0 && unit) detailScore += 3;
    else if (unit) detailScore += 1;
    else if (quantity > 0) detailScore += 1;
    if (deliveryAvailable) detailScore += 2;
    breakdown.details.score = Math.min(10, detailScore);

    // --- LOCATION (10) ---
    let locScore = 0;
    if (locationArea) locScore += 6;
    if (contactPhone && contactPhone.replace(/\D/g, '').length >= 8) locScore += 4;
    breakdown.location.score = Math.min(10, locScore);

    // ============================================
    // TOTAL + GRADE
    // ============================================
    const score = Object.values(breakdown).reduce((sum, b) => sum + b.score, 0);

    let grade = 'poor';
    if (score >= 85) grade = 'excellent';
    else if (score >= 70) grade = 'good';
    else if (score >= 50) grade = 'fair';

    // ============================================
    // FALLBACK TIPS (always available)
    // ============================================
    const fallbackTips = [];
    if (breakdown.photos.score < 20) {
      const need = Math.max(0, 4 - photoCount);
      fallbackTips.push(
        need > 0
          ? `Add ${need} more photo${need === 1 ? '' : 's'} — listings with 4+ photos sell faster.`
          : 'Add sharper, well-lit photos.'
      );
    }
    if (breakdown.title.score < 15) {
      fallbackTips.push('Make your title 15–70 characters and describe exactly what you sell.');
    }
    if (breakdown.description.score < 14) {
      fallbackTips.push('Add a 2–3 sentence description with condition, quantity, and delivery info.');
    }
    if (breakdown.price.score < 12) {
      fallbackTips.push('Set a clear price in MWK — listings without a price get 60% fewer clicks.');
    }
    if (breakdown.details.score < 8) {
      fallbackTips.push('Fill in subcategory, quantity + unit, and delivery availability.');
    }
    if (breakdown.location.score < 8) {
      fallbackTips.push('Add a location area and a valid contact phone number.');
    }

    // Cap at 3 tips — the most important ones
    let tips = fallbackTips.slice(0, 3);

    // ============================================
    // LLM-ENRICHED TIPS (best-effort)
    // ============================================
    try {
      const provider = this.getAvailableProvider();
      if (provider && score < 95) {
        const prompt = `You are a marketplace quality coach for Kumsika in Malawi.
A seller has this listing:
- Title: ${title || '(empty)'}
- Description: ${description ? description.slice(0, 300) : '(empty)'}
- Category: ${category || '(none)'}${subCategory ? ` / ${subCategory}` : ''}
- Price: ${price > 0 ? `MK ${price.toLocaleString()}` : '(none)'}
- Quantity: ${quantity > 0 ? `${quantity} ${unit || ''}`.trim() : '(none)'}
- Photos: ${photoCount}
- Location: ${locationArea || '(none)'}
- Delivery: ${deliveryAvailable ? 'yes' : 'no'}
- Quality score: ${score}/100 (${grade})

Write EXACTLY 3 short, actionable improvement tips.
Each tip: max 14 words, concrete, no greetings, no fluff, no emoji.
Reference specifics from the listing where possible.
Return ONLY a JSON array of 3 strings, no other text.`;

        const raw = await this.callProvider(provider, prompt, 'Give the tips.', 0.4);
        const parsed = this.parseTipsArray(raw);
        if (parsed.length >= 2) {
          tips = parsed.slice(0, 3);
        }
      }
    } catch (err) {
      logger.warn('Quality tips LLM failed, using fallback:', err?.message);
    }

    const result = {
      score,
      grade,
      breakdown,
      tips,
      computedAt: new Date().toISOString(),
    };

    // Cache by content hash
    const cacheKey = this.hashQualityInput({
      title,
      description,
      category,
      subCategory,
      price,
      quantity,
      unit,
      photoCount,
      locationArea,
      contactPhone,
      deliveryAvailable,
    });
    qualityCacheSet(cacheKey, result);

    logger.info('✨ Quality score computed:', {
      score,
      grade,
      photoCount,
      titleLen,
      descLen,
    });

    return result;
  }

  parseTipsArray(raw) {
    if (!raw || typeof raw !== 'string') return [];
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((t) => String(t || '').replace(/^["'\-\*\s]+|["'\s]+$/g, '').trim())
        .filter((t) => t.length >= 8 && t.length <= 140);
    } catch {
      return [];
    }
  }

  hashQualityInput(input) {
    const parts = [
      input.title || '',
      input.description || '',
      input.category || '',
      input.subCategory || '',
      String(input.price || ''),
      String(input.quantity || ''),
      input.unit || '',
      String(input.photoCount || 0),
      input.locationArea || '',
      input.contactPhone || '',
      String(!!input.deliveryAvailable),
    ];
    let hash = 0;
    const joined = parts.join('|');
    for (let i = 0; i < joined.length; i++) {
      hash = (hash << 5) - hash + joined.charCodeAt(i);
      hash |= 0;
    }
    return `q:${hash}`;
  }

  // ============================================
  // ★ PHASE 7D: SALES ASSISTANT
  // ============================================
  /**
   * Draft a seller reply to a buyer's message, using listing context.
   *
   * @param {Object} input
   * @param {string} input.buyerMessage - The buyer's latest message
   * @param {Object} [input.listing] - Listing context (title, price, location, delivery)
   * @param {Array}  [input.history] - Recent chat history [{role:'buyer'|'seller', text}]
   * @param {string} [input.tone] - 'friendly' | 'professional' | 'brief'
   *
   * Returns:
   *   { draft, alternatives: [string, string], tone }
   */
  async draftSalesReply({ buyerMessage, listing = {}, history = [], tone = 'friendly' }) {
    const message = String(buyerMessage || '').trim();
    if (!message) {
      return {
        draft: '',
        alternatives: [],
        tone,
        error: 'No buyer message provided',
      };
    }

    const cleanTone = ['friendly', 'professional', 'brief'].includes(tone)
      ? tone
      : 'friendly';

    const title = String(listing.title || '').trim();
    const price = Number(listing.price) || 0;
    const currency = 'MK';
    const location = String(listing.locationArea || listing.location_area || '').trim();
    const deliveryAvailable = !!(listing.deliveryAvailable ?? listing.delivery_available);
    const deliveryFee = Number(listing.deliveryFee ?? listing.delivery_fee) || 0;
    const quantity = Number(listing.quantity) || 0;
    const unit = String(listing.unit || '').trim();
    const category = String(listing.category || '').trim();

    // Format recent history (last 6 turns)
    const recentHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .map((h) => {
            const who = h.role === 'buyer' ? 'Buyer' : 'Seller';
            return `${who}: ${String(h.text || '').slice(0, 200)}`;
          })
          .join('\n')
      : '';

    const toneGuide = {
      friendly: 'Warm and helpful, like a local business owner. Use natural English.',
      professional: 'Polite and businesslike. Clear, concise, no slang.',
      brief: 'Very short — max 2 short sentences. No greetings.',
    }[cleanTone];

    const provider = this.getAvailableProvider();
    if (!provider) {
      return this.fallbackSalesReply({
        buyerMessage: message,
        listing,
        tone: cleanTone,
      });
    }

    const systemPrompt = `You are a sales assistant for a Malawian marketplace seller on Kumsika.
Draft a reply to the buyer's message.

LISTING CONTEXT:
- Title: ${title || '(unknown)'}
- Category: ${category || '(unknown)'}
- Price: ${price > 0 ? `${currency} ${price.toLocaleString()}` : '(not set)'}
- Quantity: ${quantity > 0 ? `${quantity} ${unit}`.trim() : '(not set)'}
- Location: ${location || '(unknown)'}
- Delivery: ${deliveryAvailable ? `yes${deliveryFee > 0 ? `, fee ${currency} ${deliveryFee.toLocaleString()}` : ''}` : 'no'}

RECENT CHAT:
${recentHistory || '(none)'}

TONE: ${cleanTone} — ${toneGuide}

BUYER MESSAGE: "${message}"

RULES:
- Answer the buyer's actual question directly.
- If price/delivery is asked and unknown, invite them to chat — do NOT invent numbers.
- Use Malawi Kwacha formatting like "MK 8,000".
- Never mention AI. Never add emojis unless the tone is friendly and it feels natural (max 1).
- Do NOT include the buyer's name unless it was given.
- Keep the main draft under 40 words.

Return ONLY valid JSON, no markdown, no preamble:
{
  "draft": "the main reply",
  "alternatives": ["a slightly different phrasing", "another variation"]
}`;

    try {
      const raw = await this.callProvider(
        provider,
        systemPrompt,
        `Draft a reply to: "${message}"`,
        0.6
      );

      const parsed = this.parseSalesReply(raw);
      if (parsed.draft) {
        return {
          draft: parsed.draft,
          alternatives: parsed.alternatives.slice(0, 2),
          tone: cleanTone,
        };
      }

      return this.fallbackSalesReply({
        buyerMessage: message,
        listing,
        tone: cleanTone,
      });
    } catch (err) {
      logger.warn('draftSalesReply LLM failed, using fallback:', err?.message);
      return this.fallbackSalesReply({
        buyerMessage: message,
        listing,
        tone: cleanTone,
      });
    }
  }

  parseSalesReply(raw) {
    if (!raw || typeof raw !== 'string') return { draft: '', alternatives: [] };

    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(cleaned);
      const draft = String(parsed.draft || '').trim();
      const alternatives = Array.isArray(parsed.alternatives)
        ? parsed.alternatives
            .map((a) => String(a || '').trim())
            .filter((a) => a.length > 0)
            .slice(0, 2)
        : [];
      return { draft, alternatives };
    } catch {
      return { draft: '', alternatives: [] };
    }
  }

  fallbackSalesReply({ buyerMessage, listing, tone }) {
    const price = Number(listing?.price) || 0;
    const location = String(listing?.locationArea || listing?.location_area || '').trim();
    const deliveryAvailable = !!(listing?.deliveryAvailable ?? listing?.delivery_available);
    const lower = buyerMessage.toLowerCase();

    let draft = 'Thanks for your message! Yes, it is still available.';

    if (lower.includes('deliver')) {
      draft = deliveryAvailable
        ? `Yes, I can deliver${location ? ` within ${location}` : ''}. When would you like it?`
        : `Sorry, delivery is not available right now — pickup${location ? ` in ${location}` : ''} only.`;
    } else if (lower.includes('price') || lower.includes('how much') || lower.includes('cost')) {
      draft = price > 0
        ? `The price is MK ${price.toLocaleString()}. Let me know if you'd like it.`
        : `Let me share the price with you — what quantity do you need?`;
    } else if (lower.includes('available') || lower.includes('still')) {
      draft = `Yes, it's still available${price > 0 ? ` at MK ${price.toLocaleString()}` : ''}. When would you like to pick it up?`;
    } else if (lower.includes('pick') || lower.includes('collect')) {
      draft = `Sure! ${location ? `Pickup is in ${location}. ` : ''}What time works for you?`;
    }

    if (tone === 'brief') {
      draft = draft.split(/[.!?]/)[0].trim() + '.';
    }

    return {
      draft,
      alternatives: [
        'Happy to help! Let me know what you need and I will get back to you.',
        'Thanks for reaching out — I will confirm the details and reply shortly.',
      ],
      tone: tone || 'friendly',
    };
  }

  // ============================================
  // 4. VOICE TRANSCRIPTION
  // ============================================
  async transcribeAudio(audioBuffer, language = 'ny') {
    try {
      if (!GROQ_API_KEY) {
        logger.warn('Groq API key not available for transcription');
        return this.getFallbackTranscription();
      }

      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', language);
      formData.append('response_format', 'text');
      formData.append('temperature', '0.2');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const result = await response.text();
      logger.info(`Voice transcription successful: ${result.length} characters`);
      return result;
    } catch (error) {
      logger.error('Voice transcription error:', error);
      return this.getFallbackTranscription();
    }
  }

  // ============================================
  // 5. EXTRACT LISTING DATA
  // ============================================
  async extractListingData(transcript) {
    try {
      const provider = this.getAvailableProvider();
      if (!provider) {
        logger.warn('No AI provider available for extraction');
        return this.getFallbackExtraction();
      }

      const systemPrompt = `Extract listing data from the transcript.
        Return ONLY valid JSON:
        {
          "title": "Product title",
          "category": "Farm Inputs|Construction|Plumber|Retail|Electronics|Fashion|Food|Other",
          "price": null,
          "quantity": null,
          "unit": "kg|litre|piece|bag|bundle|other",
          "description": "Brief description",
          "confidence": 0.9
        }`;

      const response = await this.callProvider(provider, systemPrompt, transcript, 0.2);
      const parsed = JSON.parse(response);

      return {
        title: parsed.title || 'Product',
        category: this.validateCategory(parsed.category),
        price: parsed.price ? parseFloat(parsed.price) : null,
        quantity: parsed.quantity ? parseFloat(parsed.quantity) : null,
        unit: this.validateUnit(parsed.unit),
        description: parsed.description || '',
        confidence: Math.min(parsed.confidence || 0.5, 1),
      };
    } catch (error) {
      logger.error('Extract error:', error);
      return this.getFallbackExtraction();
    }
  }

  // ============================================
  // 6. GENERATE AD
  // ============================================
  async generateAd(productInfo) {
    try {
      const provider = this.getAvailableProvider();
      if (!provider) {
        logger.warn('No AI provider available for ad generation');
        return this.getFallbackAd(productInfo);
      }

      const systemPrompt = `Generate a compelling ad for a product in Mitundu, Malawi.
        Product: ${productInfo.title || 'Product'}
        Category: ${productInfo.category || 'Other'}
        Price: ${productInfo.price || 'competitive'}
        Description: ${productInfo.description || ''}
        
        Return JSON:
        {
          "title": "Catchy title",
          "description": "Engaging description",
          "callToAction": "Action prompt",
          "hashtags": ["#tag1", "#tag2"],
          "targetAudience": "Who should buy this?"
        }`;

      const response = await this.callProvider(
        provider,
        systemPrompt,
        `Generate an ad for ${productInfo.title || 'this product'}`,
        0.7
      );

      const parsed = JSON.parse(response);

      return {
        title: parsed.title || '📢 Product Available!',
        description: parsed.description || 'Quality product in Mitundu. Contact us today.',
        callToAction: parsed.callToAction || '📞 Call now!',
        hashtags: parsed.hashtags || ['#Mitundu', '#Quality'],
        targetAudience: parsed.targetAudience || 'Local community',
        confidence: parsed.confidence || 0.8,
      };
    } catch (error) {
      logger.error('Ad generation error:', error);
      return this.getFallbackAd(productInfo);
    }
  }

  // ============================================
  // 7. AI RECOMMENDATIONS
  // ============================================
  async getRecommendations(userHistory, limit = 5) {
    try {
      const provider = this.getAvailableProvider();
      if (!provider) {
        logger.warn('No AI provider available for recommendations');
        return this.getFallbackRecommendations();
      }

      const systemPrompt = `Based on this user's history: ${JSON.stringify(userHistory)}
        Recommend products they might be interested in.
        Return JSON: { "categories": [], "products": [], "interests": [], "budget": {} }`;

      const response = await this.callProvider(
        provider,
        systemPrompt,
        `Generate recommendations based on: ${JSON.stringify(userHistory)}`,
        0.5
      );

      return JSON.parse(response);
    } catch (error) {
      logger.error('Recommendations error:', error);
      return this.getFallbackRecommendations();
    }
  }

  // ============================================
  // 8. SMART CATEGORY SUGGESTION
  // ============================================
  async suggestCategory(title, description) {
    try {
      const provider = this.getAvailableProvider();
      if (!provider) return 'Other';

      const systemPrompt = `Based on the title and description, suggest the most appropriate category.
        Categories: Farm Inputs, Construction, Plumber, Retail, Electronics, Fashion, Food, Services, Automotive, Other
        Return only the category name.`;

      const response = await this.callProvider(
        provider,
        systemPrompt,
        `Title: "${title}"\nDescription: "${description}"\nCategory:`,
        0.1
      );

      return this.validateCategory(response.trim());
    } catch (error) {
      logger.error('Category suggestion error:', error);
      return 'Other';
    }
  }

  // ============================================
  // 9. AI SUPPORT CHAT
  // ============================================
  async supportChat(message, history = []) {
    try {
      const provider = this.getAvailableProvider();
      if (!provider) {
        logger.warn('No AI provider available for support chat');
        return "I'm here to help! Please contact support at support@msikaai.com for immediate assistance.";
      }

      const systemPrompt = `You are MsikaAI Support Assistant for a marketplace in Mitundu, Malawi.
        Conversation history: ${JSON.stringify(history)}
        Current message: "${message}"
        
        Provide helpful, friendly support. If you don't know something, be honest.
        Include any helpful links or contacts in your response.`;

      const response = await this.callProvider(provider, systemPrompt, message, 0.7);
      return response;
    } catch (error) {
      logger.error('Support chat error:', error);
      return "I'm here to help! Please contact support at support@msikaai.com for immediate assistance.";
    }
  }

  // ============================================
  // 10. PROVIDER CALLER
  // ============================================
  async callProvider(provider, systemPrompt, userMessage, temperature = 0.5) {
    const config = {
      groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        model: 'llama-3.3-70b-versatile',
      },
      gemini: {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        headers: {
          'Content-Type': 'application/json',
        },
        model: 'gemini-pro',
      },
      openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        model: 'meta-llama/llama-3-8b-instruct:free',
      },
    };

    const providerConfig = config[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const body = {
      model: providerConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: temperature,
      max_tokens: 300,
    };

    if (provider === 'gemini') {
      body.contents = [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }];
      delete body.messages;
    }

    const response = await fetch(providerConfig.url, {
      method: 'POST',
      headers: providerConfig.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (provider === 'gemini') {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    return data.choices?.[0]?.message?.content || '';
  }

  // ============================================
  // 11. VALIDATION HELPERS
  // ============================================
  validateCategory(category) {
    const validCategories = [
      'Farm Inputs',
      'Construction',
      'Plumber',
      'Retail',
      'Electronics',
      'Fashion',
      'Food',
      'Services',
      'Automotive',
      'Other',
    ];
    const found = validCategories.find(
      (c) => c.toLowerCase() === category?.toLowerCase()
    );
    return found || 'Other';
  }

  validateUnit(unit) {
    const validUnits = ['kg', 'litre', 'piece', 'bag', 'bundle', 'other'];
    const found = validUnits.find(
      (u) => u.toLowerCase() === unit?.toLowerCase()
    );
    return found || 'piece';
  }

  // ============================================
  // 12. FALLBACK RESPONSES
  // ============================================
  parseAIResponse(response) {
    try {
      return JSON.parse(response);
    } catch {
      return this.getFallbackSearch('');
    }
  }

  getFallbackSearch(query) {
    return {
      categories: ['Other'],
      keywords: [query],
      suggestions: [`Check our listings for "${query}"`],
      summary: `Search results for ${query}`,
    };
  }

  getFallbackTranscription() {
    return 'Ndili ndi matumba 10 a chimanga ndikugulitsa. (I have 10 bags of maize for sale.)';
  }

  getFallbackExtraction() {
    return {
      title: 'Product',
      category: 'Other',
      price: null,
      quantity: null,
      unit: 'piece',
      description: '',
      confidence: 0.5,
    };
  }

  getFallbackAd(productInfo) {
    return {
      title: `📢 ${productInfo.title || 'Product Available!'}`,
      description: `Quality ${productInfo.title || 'product'} in Mitundu. Contact us today!`,
      callToAction: '📞 Call now!',
      hashtags: ['#Mitundu', '#Quality'],
      targetAudience: 'Local community',
      confidence: 0.5,
    };
  }

  getFallbackRecommendations() {
    return {
      categories: ['Other'],
      products: [],
      interests: ['Local products'],
      budget: { min: 0, max: 1000 },
    };
  }
}

export default new AIService();