import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class AISearchService {
  constructor() {
    this.openrouterKey = process.env.OPENROUTER_API_KEY;
  }

  async search(query, location = null, category = null) {
    try {
      console.log('🔍 AI Search:', query);

      // Use OpenRouter for embeddings (free)
      const embedding = await this.getEmbedding(query);
      
      const { data, error } = await supabase
        .rpc('match_listings', {
          query_embedding: embedding,
          match_threshold: 0.3,
          match_count: 20
        });

      if (error) throw error;

      let results = data || [];

      if (category) {
        results = results.filter(item => 
          item.category.toLowerCase() === category.toLowerCase()
        );
      }

      const enhanced = await this.enhanceWithAI(results, query);

      return {
        success: true,
        results: enhanced,
        total: enhanced.length,
        query: query,
        ai_processed: true
      };
    } catch (error) {
      console.error('❌ AI Search error:', error);
      return await this.fallbackSearch(query, location, category);
    }
  }

  async getEmbedding(text) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openrouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });

      const data = await response.json();
      return data.data?.[0]?.embedding || await this.fallbackEmbedding(text);
    } catch (error) {
      console.error('❌ Embedding error:', error);
      return await this.fallbackEmbedding(text);
    }
  }

  async fallbackEmbedding(text) {
    const hash = text.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return Array(384).fill(0).map((_, i) => Math.sin(i + hash) * 0.1);
  }

  async enhanceWithAI(results, query) {
    if (results.length === 0) return [];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openrouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: `You are MsikaAI, an AI assistant for a Malawian marketplace. 
                       For each listing, generate a brief 1-sentence summary that helps the user.
                       Return JSON array only: [{"id": "listing_id", "summary": "..."}]`
            },
            {
              role: 'user',
              content: `Query: "${query}"\nListings: ${JSON.stringify(results.map(r => ({id: r.id, title: r.title, category: r.category, description: r.description})))}`
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      const data = await response.json();
      let summaries = [];
      try {
        summaries = JSON.parse(data.choices?.[0]?.message?.content || '[]');
      } catch (e) {}

      return results.map(item => {
        const summary = summaries.find(s => s.id === item.id);
        return {
          ...item,
          ai_summary: summary?.summary || this.getFallbackSummary(item),
          relevance_score: item.similarity || 0.5
        };
      });
    } catch (error) {
      console.error('❌ AI enhancement error:', error);
      return results.map(item => ({
        ...item,
        ai_summary: this.getFallbackSummary(item),
        relevance_score: 0.5
      }));
    }
  }

  getFallbackSummary(item) {
    const summaries = {
      'Farm Inputs': `🌾 ${item.business_name} offers quality farm inputs in Mitundu.`,
      'Construction': `🔨 ${item.business_name} supplies building materials.`,
      'Plumber': `🔧 ${item.business_name} provides professional plumbing services.`,
      'Retail': `🛍️ ${item.business_name} has quality products in stock.`,
      'Electrician': `⚡ ${item.business_name} offers electrical services.`,
      'Carpenter': `🪚 ${item.business_name} provides carpentry services.`,
      'Mechanic': `🔧 ${item.business_name} offers mechanical services.`,
      'Restaurant': `🍽️ ${item.business_name} serves delicious meals.`,
      'Tailor': `👔 ${item.business_name} offers tailoring services.`,
      'Hairdresser': `💇 ${item.business_name} provides salon services.`
    };
    return summaries[item.category] || `${item.business_name} - ${item.title} available in Mitundu.`;
  }

  async fallbackSearch(query, location, category) {
    let searchQuery = supabase
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
      .eq('status', 'active');

    if (query) {
      searchQuery = searchQuery.textSearch('search_vector', query, {
        config: 'english',
        type: 'websearch'
      });
    }

    if (category) {
      searchQuery = searchQuery.eq('category', category);
    }

    const { data, error } = await searchQuery.limit(20);
    if (error) throw error;

    return {
      success: true,
      results: data.map(item => ({
        ...item,
        ai_summary: this.getFallbackSummary(item),
        relevance_score: 0.5,
        ai_processed: false
      })),
      total: data.length,
      query: query,
      ai_processed: false
    };
  }
}

export default new AISearchService();