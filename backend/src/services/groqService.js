// backend/src/services/groqService.js
import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';
import { MODELS } from '../config/ai-providers.js';

// Whisper has no Chichewa language code; a prompt in Chichewa steers its
// spelling toward the words sellers actually use.
const CHICHEWA_WHISPER_PROMPT =
  'Ndili ndi matumba khumi a chimanga ndikugulitsa. Mtengo ndi kwacha zikwi zisanu pa thumba. ' +
  'Nkhuku, mazira, simenti, feteleza, nsapato, zovala, foni, njinga. Ndikupezeka ku Mitundu.';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this._client = null;
    this.models = {
      llama: MODELS.groqText,
      fast: MODELS.groqFast,
      whisper: MODELS.groqWhisper,
    };
    this.defaultModel = this.models.llama;
    this.maxRetries = 2;
    this.retryDelay = 1000;
  }

  // The SDK throws at construction without a key, so build it on first use.
  get client() {
    if (!this.apiKey) throw new Error('GROQ_API_KEY is not set');
    if (!this._client) this._client = new Groq({ apiKey: this.apiKey });
    return this._client;
  }

  // ============================================
  // TEXT GENERATION
  // ============================================
  async generateText(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature ?? 0.7;
    if (!this.apiKey) throw new Error('GROQ_API_KEY is not set');

    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        logger.debug(`Groq request: ${model} (attempt ${attempt})`);
        
        const response = await this.client.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: options.systemPrompt || 'You are a helpful assistant for Kumsika marketplace in Mitundu, Malawi.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: options.topP || 0.9,
          stop: options.stop || null,
          stream: false
        });

        const responseTime = Date.now() - startTime;
        const data = response.choices[0]?.message?.content || '';
        const usage = response.usage || {};

        logger.info(`Groq request successful (${responseTime}ms)`, {
          model,
          attempt,
          tokens: usage.total_tokens,
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens
        });

        return {
          success: true,
          data: data,
          usage: usage,
          model: model,
          responseTime: responseTime,
          provider: 'groq'
        };

      } catch (error) {
        lastError = error;
        logger.error(`Groq request failed (attempt ${attempt}):`, {
          message: error.message,
          status: error.status
        });

        if (error.status === 429) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          logger.warn(`Rate limit hit, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Groq request failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  // ============================================
  // SMART SEARCH
  // ============================================
  async smartSearch(query, context = {}) {
    const prompt = `
      Analyze this marketplace search query for Kumsika in Mitundu, Malawi.
      
      Query: "${query}"
      Location: ${context.location || 'Mitundu'}
      Category: ${context.category || 'All'}
      
      Provide:
      1. Search Terms: Key search terms for database matching
      2. Category: Most relevant category
      3. Response: A friendly, helpful response
      4. Related Searches: 3 related search suggestions
      
      Format as JSON:
      {
        "searchTerms": ["term1", "term2"],
        "category": "suggested category",
        "response": "AI response text",
        "relatedSearches": ["search1", "search2", "search3"]
      }
    `;

    const result = await this.generateText(prompt, {
      temperature: 0.5,
      maxTokens: 500,
      systemPrompt: 'You are a smart search assistant for Kumsika marketplace in Mitundu, Malawi.'
    });

    return this.parseResponse(result);
  }

  // ============================================
  // SMART MATCHING
  // ============================================
  async findMatches(query, context = {}) {
    const prompt = `
      Find matches for this marketplace query on Kumsika in Mitundu, Malawi.
      
      Query: "${query}"
      User Type: ${context.userType || 'buyer'}
      Location: ${context.location || 'Mitundu'}
      
      Provide 5 recommendations with explanations.
      
      Format as JSON:
      {
        "recommendations": [
          {
            "type": "product|service|customer|category",
            "name": "...",
            "description": "...",
            "reason": "...",
            "confidence": 0-1
          }
        ],
        "trending": [],
        "seasonal": []
      }
    `;

    const result = await this.generateText(prompt, {
      temperature: 0.6,
      maxTokens: 700,
      systemPrompt: 'You are a smart matching engine for Kumsika marketplace in Mitundu, Malawi.'
    });

    return this.parseResponse(result);
  }

  // ============================================
  // GET RECOMMENDATIONS
  // ============================================
  async getRecommendations(userData) {
    const prompt = `
      Recommend products/services for this user on Kumsika marketplace.
      
      Interests: ${userData.interests || 'Not specified'}
      Past Purchases: ${userData.history || 'None'}
      Location: ${userData.location || 'Mitundu'}
      User Type: ${userData.userType || 'buyer'}
      
      Provide personalized recommendations.
      
      Format as JSON:
      {
        "personalized": [
          {"name": "...", "category": "...", "reason": "..."}
        ],
        "newListings": [],
        "trendingCategories": [],
        "seasonal": []
      }
    `;

    const result = await this.generateText(prompt, {
      temperature: 0.5,
      maxTokens: 600,
      systemPrompt: 'You are a recommendation engine for Kumsika marketplace.'
    });

    return this.parseResponse(result);
  }

  // ============================================
  // VOICE TRANSCRIPTION (Whisper)
  // ============================================
  /**
   * options: { language: 'ny' | 'en', mimeType, filename, temperature }
   * Chichewa ('ny') isn't a Whisper language, so it's auto-detected with a
   * Chichewa prompt instead of being forced to English.
   */
  async transcribeAudio(audioBuffer, options = {}) {
    try {
      logger.info('Transcribing audio with Groq Whisper...');

      const mimeType = options.mimeType || 'audio/webm';
      const ext = (mimeType.split('/')[1] || 'webm').split(';')[0].replace('mpeg', 'mp3').replace('x-m4a', 'm4a');
      const file = new File([audioBuffer], options.filename || `audio.${ext}`, { type: mimeType });

      const request = {
        file,
        model: this.models.whisper,
        response_format: 'json',
        temperature: options.temperature ?? 0.0,
      };
      if (options.language === 'en') request.language = 'en';
      else request.prompt = CHICHEWA_WHISPER_PROMPT;

      const transcription = await this.client.audio.transcriptions.create(request);
      const text = String(transcription.text || '').trim();
      if (!text) throw new Error('No speech detected in the recording');

      logger.info('Transcription successful');

      return {
        success: true,
        text,
        provider: 'groq-whisper'
      };

    } catch (error) {
      logger.error('Transcription error:', error);
      return {
        success: false,
        error: error.message || 'Transcription failed'
      };
    }
  }

  // ============================================
  // PROCESS VOICE LISTING
  // ============================================
  async processVoiceListing(transcript, userContext = {}) {
    const prompt = `
      Process this voice transcription for a marketplace listing on Kumsika.
      
      Transcription: "${transcript}"
      Location: ${userContext.location || 'Mitundu'}
      
      Extract:
      1. Product/Service Title
      2. Description
      3. Category
      4. Price (if mentioned)
      5. Location
      6. Features
      7. Delivery Availability
      
      Format as JSON:
      {
        "title": "...",
        "description": "...",
        "category": "...",
        "price": null,
        "location": "...",
        "features": [],
        "deliveryAvailable": false,
        "confirmationMessage": "..."
      }
    `;

    const result = await this.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 800,
      systemPrompt: 'You are a voice processing assistant for Kumsika marketplace.'
    });

    return this.parseResponse(result);
  }

  // ============================================
  // PARSE AI RESPONSE
  // ============================================
  parseResponse(response) {
    try {
      if (!response.success) {
        return { text: response.data || '', error: 'Request failed' };
      }

      const data = response.data.trim();
      
      // Try to parse as JSON
      try {
        const jsonMatch = data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...response,
            parsed: parsed,
            data: parsed
          };
        }
      } catch (e) {
        // Not JSON, return as text
      }

      return {
        ...response,
        text: data
      };

    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return {
        ...response,
        text: response.data || '',
        error: 'Failed to parse response'
      };
    }
  }

  // ============================================
  // CHECK AVAILABILITY
  // ============================================
  async checkAPIKey() {
    if (!this.apiKey) return false;
    try {
      await this.generateText('Hello, test connection.', {
        maxTokens: 10,
        temperature: 0
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getModels() {
    return this.models;
  }
}

// Create and export singleton
const groqService = new GroqService();
export default groqService;