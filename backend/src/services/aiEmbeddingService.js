import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIEmbeddingService {
  constructor() {
    this.localModel = null;
    this.initialized = false;
    this.provider = process.env.AI_PROVIDER || 'openai';
  }

  // Initialize local embedding model
  async initLocalModel() {
    if (this.initialized) return;
    try {
      console.log('🔢 Loading embedding model...');
      this.localModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      this.initialized = true;
      console.log('✅ Embedding model loaded');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    }
  }

  // Generate embeddings for text
  async generateEmbedding(text) {
    try {
      if (this.provider === 'openai' && process.env.OPENAI_API_KEY) {
        return await this.openAIEmbedding(text);
      } else if (this.provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
        return await this.openRouterEmbedding(text);
      } else {
        return await this.localEmbedding(text);
      }
    } catch (error) {
      console.error('❌ Embedding error:', error);
      return await this.localEmbedding(text);
    }
  }

  // OpenAI Embeddings (Best quality)
  async openAIEmbedding(text) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  }

  // OpenRouter Embeddings (Free alternative)
  async openRouterEmbedding(text) {
    const response = await fetch(`${process.env.OPENROUTER_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MsikaAI'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  // Local embeddings (Free, offline)
  async localEmbedding(text) {
    await this.initLocalModel();
    const result = await this.localModel(text, {
      pooling: 'mean',
      normalize: true
    });
    return Array.from(result.data);
  }

  // Generate embeddings for multiple texts
  async generateBatchEmbeddings(texts) {
    if (this.provider === 'openai') {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        encoding_format: 'float',
      });
      return response.data.map(item => item.embedding);
    }

    // Fallback to sequential processing
    const embeddings = [];
    for (const text of texts) {
      embeddings.push(await this.generateEmbedding(text));
    }
    return embeddings;
  }

  // Store embedding in database
  async storeEmbedding(listingId, embedding) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ embedding: embedding })
        .eq('id', listingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Store embedding error:', error);
      return { success: false, error: error.message };
    }
  }

  // Search by vector similarity
  async vectorSearch(queryEmbedding, threshold = 0.3, limit = 20) {
    try {
      const { data, error } = await supabase.rpc('match_listings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Vector search error:', error);
      return [];
    }
  }
}

export default new AIEmbeddingService();