// backend/src/services/aiService.js
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class AIService {
  constructor() {
    this.providers = {
      groq: {
        available: !!GROQ_API_KEY,
        name: 'Groq',
        rateLimit: 1000, // requests per day
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
  // 2. AI SEARCH - Using best available provider
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
  // 3. VOICE TRANSCRIPTION - Groq Whisper (Free)
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
        body: formData
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
  // 4. EXTRACT LISTING DATA - Multi-provider
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
      
      // Validate and clean the response
      return {
        title: parsed.title || 'Product',
        category: this.validateCategory(parsed.category),
        price: parsed.price ? parseFloat(parsed.price) : null,
        quantity: parsed.quantity ? parseFloat(parsed.quantity) : null,
        unit: this.validateUnit(parsed.unit),
        description: parsed.description || '',
        confidence: Math.min(parsed.confidence || 0.5, 1)
      };
    } catch (error) {
      logger.error('Extract error:', error);
      return this.getFallbackExtraction();
    }
  }

  // ============================================
  // 5. GENERATE AD - Multi-provider
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

      const response = await this.callProvider(provider, systemPrompt, 
        `Generate an ad for ${productInfo.title || 'this product'}`, 0.7);
      
      const parsed = JSON.parse(response);
      
      return {
        title: parsed.title || '📢 Product Available!',
        description: parsed.description || 'Quality product in Mitundu. Contact us today.',
        callToAction: parsed.callToAction || '📞 Call now!',
        hashtags: parsed.hashtags || ['#Mitundu', '#Quality'],
        targetAudience: parsed.targetAudience || 'Local community',
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      logger.error('Ad generation error:', error);
      return this.getFallbackAd(productInfo);
    }
  }

  // ============================================
  // 6. AI RECOMMENDATIONS
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

      const response = await this.callProvider(provider, systemPrompt, 
        `Generate recommendations based on: ${JSON.stringify(userHistory)}`, 0.5);
      
      return JSON.parse(response);
    } catch (error) {
      logger.error('Recommendations error:', error);
      return this.getFallbackRecommendations();
    }
  }

  // ============================================
  // 7. SMART CATEGORY SUGGESTION
  // ============================================
  async suggestCategory(title, description) {
    try {
      const provider = this.getAvailableProvider();
      
      if (!provider) {
        return 'Other';
      }

      const systemPrompt = `Based on the title and description, suggest the most appropriate category.
        Categories: Farm Inputs, Construction, Plumber, Retail, Electronics, Fashion, Food, Services, Automotive, Other
        Return only the category name.`;

      const response = await this.callProvider(provider, systemPrompt,
        `Title: "${title}"\nDescription: "${description}"\nCategory:`, 0.1);
      
      return this.validateCategory(response.trim());
    } catch (error) {
      logger.error('Category suggestion error:', error);
      return 'Other';
    }
  }

  // ============================================
  // 8. AI SUPPORT CHAT
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
  // 9. PROVIDER CALLER
  // ============================================
  async callProvider(provider, systemPrompt, userMessage, temperature = 0.5) {
    const config = {
      groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        model: 'llama-3.3-70b-versatile',
      },
      gemini: {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        headers: {
          'Content-Type': 'application/json'
        },
        model: 'gemini-pro',
      },
      openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        model: 'meta-llama/llama-3-8b-instruct:free',
      }
    };

    const providerConfig = config[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const body = {
      model: providerConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
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
      body: JSON.stringify(body)
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
  // 10. VALIDATION HELPERS
  // ============================================
  validateCategory(category) {
    const validCategories = ['Farm Inputs', 'Construction', 'Plumber', 'Retail', 
      'Electronics', 'Fashion', 'Food', 'Services', 'Automotive', 'Other'];
    const found = validCategories.find(c => 
      c.toLowerCase() === category?.toLowerCase()
    );
    return found || 'Other';
  }

  validateUnit(unit) {
    const validUnits = ['kg', 'litre', 'piece', 'bag', 'bundle', 'other'];
    const found = validUnits.find(u => 
      u.toLowerCase() === unit?.toLowerCase()
    );
    return found || 'piece';
  }

  // ============================================
  // 11. FALLBACK RESPONSES
  // ============================================
  getFallbackSearch(query) {
    return {
      categories: ['Other'],
      keywords: [query],
      suggestions: [`Check our listings for "${query}"`],
      summary: `Search results for ${query}`
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
      confidence: 0.5
    };
  }

  getFallbackAd(productInfo) {
    return {
      title: `📢 ${productInfo.title || 'Product Available!'}`,
      description: `Quality ${productInfo.title || 'product'} in Mitundu. Contact us today!`,
      callToAction: '📞 Call now!',
      hashtags: ['#Mitundu', '#Quality'],
      targetAudience: 'Local community',
      confidence: 0.5
    };
  }

  getFallbackRecommendations() {
    return {
      categories: ['Other'],
      products: [],
      interests: ['Local products'],
      budget: { min: 0, max: 1000 }
    };
  }
}

export default new AIService();