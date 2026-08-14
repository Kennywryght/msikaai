// backend/src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      }
    });
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // ============================================
  // GENERATE TEXT WITH RETRY LOGIC
  // ============================================
  async generateText(prompt, options = {}) {
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 1000;

    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        logger.debug(`Gemini request (attempt ${attempt})`);

        // Configure model with custom settings
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
          generationConfig: {
            temperature: temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: maxTokens,
          }
        });

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const data = response.text();

        const responseTime = Date.now() - startTime;
        const usage = {
          total_tokens: response.usageMetadata?.totalTokenCount || 0,
          prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.usageMetadata?.candidatesTokenCount || 0
        };

        logger.info(`Gemini request successful (${responseTime}ms)`, {
          attempt,
          tokens: usage.total_tokens,
        });

        return {
          success: true,
          data: data,
          usage: usage,
          provider: 'gemini',
          responseTime: responseTime
        };

      } catch (error) {
        lastError = error;
        logger.error(`Gemini request failed (attempt ${attempt}):`, {
          message: error.message,
          status: error.status,
          code: error.code
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

    throw new Error(`Gemini request failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  // ============================================
  // GENERATE LISTING DESCRIPTION
  // ============================================
  async generateDescription(productData) {
    const prompt = `
      Generate a compelling product listing description for Kumsika marketplace in Mitundu, Malawi.
      
      Product Title: ${productData.title}
      Category: ${productData.category}
      Key Features: ${productData.features || 'Not specified'}
      Price: ${productData.price || 'Contact for price'}
      Location: ${productData.location || 'Mitundu'}
      
      Requirements:
      1. Write in a friendly, professional tone
      2. Highlight benefits to the customer
      3. Include local context (Mitundu, Malawi)
      4. Keep it concise (150-250 words)
      5. Include a clear call-to-action
      
      Write the description in English. Be persuasive and compelling.
    `;

    const result = await this.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 500
    });

    return this.parseResponse(result);
  }

  // ============================================
  // GENERATE AD COPY
  // ============================================
  async generateAd(listingData) {
    const prompt = `
      Create engaging ad content for a listing on Kumsika marketplace in Mitundu, Malawi.
      
      Title: ${listingData.title}
      Description: ${listingData.description}
      Category: ${listingData.category}
      Price: ${listingData.price || 'Contact for price'}
      
      Generate:
      1. Headline: Max 60 characters, attention-grabbing
      2. Short Copy: Max 150 characters, compelling
      3. Full Copy: Max 300 characters, detailed
      4. Call to Action: Clear action for the user
      5. Key Selling Points: 3-5 benefits
      
      Format as JSON:
      {
        "headline": "...",
        "shortCopy": "...",
        "fullCopy": "...",
        "cta": "...",
        "sellingPoints": ["point1", "point2", "point3"]
      }
    `;

    const result = await this.generateText(prompt, {
      temperature: 0.8,
      maxTokens: 600
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
}

// Create and export singleton
const geminiService = new GeminiService();
export default geminiService;