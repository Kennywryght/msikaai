// backend/src/services/groqService.js
import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.client = new Groq({
      apiKey: this.apiKey,
    });
    this.models = {
      llama: 'llama-3.3-70b-versatile',
      mixtral: 'mixtral-8x7b-32768',
      gemma: 'gemma2-9b-it',
      whisper: 'whisper-large-v3-turbo'
    };
    this.defaultModel = this.models.llama;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // ============================================
  // TEXT GENERATION
  // ============================================
  async generateText(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature || 0.7;

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
  async transcribeAudio(audioBuffer, options = {}) {
    try {
      logger.info('Transcribing audio with Groq Whisper...');

      // Create a File object from the buffer
      const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

      const transcription = await this.client.audio.transcriptions.create({
        file: file,
        model: this.models.whisper,
        response_format: 'json',
        language: options.language || 'en',
        temperature: options.temperature || 0.0,
      });

      logger.info('Transcription successful');
      
      return {
        success: true,
        text: transcription.text,
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