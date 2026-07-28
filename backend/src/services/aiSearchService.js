import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import embeddingService from './aiEmbeddingService.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AISearchService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.model = process.env.AI_TEXT_MODEL || 'gpt-3.5-turbo';
  }

  // ============================================
  // MAIN SEARCH WITH RAG
  // ============================================
  async search(query, location = null, category = null) {
    try {
      console.log('🔍 RAG Search:', { query, location, category });

      // Step 1: Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Step 2: Vector similarity search
      const vectorResults = await embeddingService.vectorSearch(queryEmbedding, 0.3, 30);

      // Step 3: Get additional results from full-text search
      const fullTextResults = await this.fullTextSearch(query, category);

      // Step 4: Merge and deduplicate results
      const mergedResults = this.mergeResults(vectorResults, fullTextResults);

      // Step 5: Filter by location if provided
      const locationFiltered = location ? await this.filterByLocation(mergedResults, location) : mergedResults;

      // Step 6: AI-enhanced ranking and summarization
      const enhancedResults = await this.aiEnhanceResults(locationFiltered, query);

      // Step 7: Sort by relevance
      const sorted = enhancedResults.sort((a, b) => b.relevance_score - a.relevance_score);

      return {
        success: true,
        results: sorted.slice(0, 20),
        total: sorted.length,
        query: query,
        ai_processed: true,
        method: 'rag'
      };
    } catch (error) {
      console.error('❌ RAG Search error:', error);
      return await this.fallbackSearch(query, category);
    }
  }

  // ============================================
  // FULL-TEXT SEARCH
  // ============================================
  async fullTextSearch(query, category) {
    let dbQuery = supabase
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
      .eq('status', 'active')
      .limit(30);

    if (query) {
      dbQuery = dbQuery.textSearch('search_vector', query, {
        config: 'english',
        type: 'websearch'
      });
    }

    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data || [];
  }

  // ============================================
  // MERGE RESULTS
  // ============================================
  mergeResults(vectorResults, fullTextResults) {
    const merged = [...vectorResults];
    const existingIds = new Set(merged.map(item => item.id));

    for (const item of fullTextResults) {
      if (!existingIds.has(item.id)) {
        merged.push(item);
        existingIds.add(item.id);
      }
    }

    return merged;
  }

  // ============================================
  // FILTER BY LOCATION
  // ============================================
  async filterByLocation(results, location) {
    if (!location || !location.lat || !location.lng) return results;

    const { data: nearby, error } = await supabase
      .rpc('nearby_businesses', {
        lat: location.lat,
        lng: location.lng,
        radius_km: 10
      });

    if (error || !nearby) return results;

    const nearbyIds = new Set(nearby.map(b => b.id));
    return results.filter(item => nearbyIds.has(item.business_id));
  }

  // ============================================
  // AI ENHANCE RESULTS
  // ============================================
  async aiEnhanceResults(results, query) {
    if (results.length === 0) return results;

    try {
      // Prepare data for AI
      const listingsContext = results.map((item, index) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        business: item.businesses?.business_name || 'Unknown',
        price: item.price || 'Not specified',
        description: item.description || 'No description'
      }));

      const aiPrompt = `
        Analyze these ${results.length} listings from Mitundu, Malawi for the search query: "${query}"

        For each listing, provide:
        1. relevance_score (0.0 to 1.0)
        2. ai_summary (30-50 words explaining why this matches the search)
        3. highlights (key features relevant to the query)

        Return JSON array with objects containing: id, relevance_score, ai_summary, highlights

        Listings:
        ${JSON.stringify(listingsContext, null, 2)}
      `;

      const aiResponse = await this.callLLM(aiPrompt, {
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      let enhancedData;
      try {
        enhancedData = JSON.parse(aiResponse);
        if (!Array.isArray(enhancedData)) {
          enhancedData = enhancedData.results || [];
        }
      } catch (e) {
        enhancedData = [];
      }

      // Merge AI enhancements with original data
      const enhancedMap = {};
      for (const item of enhancedData) {
        if (item.id) {
          enhancedMap[item.id] = item;
        }
      }

      return results.map(item => ({
        ...item,
        ai_summary: enhancedMap[item.id]?.ai_summary || this.getFallbackSummary(item, query),
        relevance_score: enhancedMap[item.id]?.relevance_score || 0.5,
        highlights: enhancedMap[item.id]?.highlights || [],
        ai_enhanced: true
      }));
    } catch (error) {
      console.error('❌ AI Enhancement error:', error);
      return results.map(item => ({
        ...item,
        ai_summary: this.getFallbackSummary(item, query),
        relevance_score: 0.5,
        ai_enhanced: false
      }));
    }
  }

  // ============================================
  // CALL LLM
  // ============================================
  async callLLM(prompt, options = {}) {
    try {
      if (this.provider === 'openai') {
        const response = await openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are MsikaAI, an AI search assistant for a Malawian marketplace. Provide accurate, helpful analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.3,
          max_tokens: options.max_tokens || 500,
          response_format: options.response_format || null
        });
        return response.choices[0].message.content;
      } else if (this.provider === 'openrouter') {
        const response = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'MsikaAI'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3-8b-instruct',
            messages: [
              {
                role: 'system',
                content: 'You are MsikaAI, an AI search assistant for a Malawian marketplace.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: options.temperature || 0.3,
            max_tokens: options.max_tokens || 500
          })
        });
        const data = await response.json();
        return data.choices[0].message.content;
      }
      return null;
    } catch (error) {
      console.error('❌ LLM call error:', error);
      return null;
    }
  }

  // ============================================
  // FALLBACK SUMMARY
  // ============================================
  getFallbackSummary(item, query) {
    const relevance = query && (
      item.title?.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    );
    return `${item.title} available in Mitundu. ${relevance ? 'Matches your search.' : 'Related to your search.'}`;
  }

  // ============================================
  // FALLBACK SEARCH
  // ============================================
  async fallbackSearch(query, category) {
    try {
      let dbQuery = supabase
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
        .eq('status', 'active')
        .limit(20);

      if (query) {
        dbQuery = dbQuery.textSearch('search_vector', query, {
          config: 'english',
          type: 'websearch'
        });
      }

      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;

      return {
        success: true,
        results: data.map(item => ({
          ...item,
          ai_summary: this.getFallbackSummary(item, query),
          relevance_score: 0.5,
          ai_enhanced: false
        })),
        total: data.length,
        ai_processed: false
      };
    } catch (error) {
      console.error('❌ Fallback search error:', error);
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  }

  // ============================================
  // GET SUGGESTIONS
  // ============================================
  async getSuggestions(query) {
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    try {
      const prompt = `
        Given the partial search query "${query}", suggest 5 relevant search terms for a marketplace in Mitundu, Malawi.
        Consider local businesses, products, and services common in Malawi.
        Return ONLY a JSON array of 5 strings.
      `;

      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });

      let suggestions = [];
      try {
        const parsed = JSON.parse(response);
        suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
      } catch (e) {
        suggestions = this.getFallbackSuggestions(query);
      }

      return { suggestions: suggestions.slice(0, 5) };
    } catch (error) {
      console.error('❌ Suggestion error:', error);
      return { suggestions: this.getFallbackSuggestions(query) };
    }
  }

  getFallbackSuggestions(query) {
    const lower = query.toLowerCase();
    const map = {
      'farm': ['Farm inputs', 'Fertilizer', 'Maize seeds', 'Farming tools', 'Livestock feed'],
      'plumb': ['Plumber', 'Plumbing services', 'Pipe repair', 'Water systems', 'Emergency plumber'],
      'elect': ['Electrician', 'Electrical services', 'Wiring', 'Generator repair', 'Solar installation'],
      'hard': ['Hardware store', 'Cement', 'Iron sheets', 'Building materials', 'Construction supplies'],
      'food': ['Restaurants', 'Fresh produce', 'Grocery stores', 'Food delivery', 'Bakery']
    };
    for (const [key, value] of Object.entries(map)) {
      if (lower.includes(key)) return value;
    }
    return [`${query} in Mitundu`, `${query} services`, `${query} products`];
  }
}

export default new AISearchService();