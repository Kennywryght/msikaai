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
  /**
   * Suggest a price for a listing based on similar listings in the DB.
   * Never invents prices — LLM only summarizes the numbers we computed.
   *
   * Returns:
   *   { hasSuggestion: true, min, median, max, sampleSize, confidence,
   *     insight, currency, category }
   * OR
   *   { hasSuggestion: false, reason: 'insufficient_data', message }
   */
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

    // Cache key: category + first few tokens of normalized title
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

    // Step 1: query the DB for comparables
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

    // Step 2: compute stats
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

    // Step 3: confidence from sample size + spread
    const spread = (max - min) / (median || 1);
    let confidence = 'low';
    if (sampleSize >= 10 && spread < 0.6) confidence = 'high';
    else if (sampleSize >= 5 && spread < 1.2) confidence = 'medium';

    // Step 4: ask LLM for a one-sentence insight (best-effort)
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

  /**
   * Query the DB for listings that look like the given one.
   * Uses ILIKE on title + optional category match.
   */
  async fetchComparableListings({ tokens, category }) {
    if (!tokens || tokens.length === 0) return [];

    // Build an OR clause on tokens using ilike on title
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
      // Soft filter: same category, but allow cross-category if few matches
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    // If strict category filter returned too few, retry without category
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