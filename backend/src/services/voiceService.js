import { createClient } from '@supabase/supabase-js';
import { writeFileSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class VoiceService {
  constructor() {
    this.openrouterKey = process.env.OPENROUTER_API_KEY;
  }

  async processVoice(audioBuffer, language = 'ny') {
    try {
      console.log('🎤 Processing voice with OpenRouter...');

      const tempFile = `/tmp/voice-${uuidv4()}.wav`;
      writeFileSync(tempFile, audioBuffer);

      // Use OpenRouter for Whisper transcription
      const transcript = await this.transcribeOpenRouter(tempFile);
      console.log('📝 Transcript:', transcript);

      try { unlinkSync(tempFile); } catch (e) {}

      const listingData = await this.extractWithOpenRouter(transcript);
      const validation = this.validateListingData(listingData);

      return {
        success: true,
        transcript: transcript,
        listing: listingData,
        validation: validation,
        ai_processed: true
      };
    } catch (error) {
      console.error('❌ Voice processing error:', error);
      return this.fallbackProcess(audioBuffer, language);
    }
  }

  async transcribeOpenRouter(audioFilePath) {
    try {
      const formData = new FormData();
      formData.append('file', audioFilePath);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ny');
      formData.append('response_format', 'text');

      const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openrouterKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('❌ Transcription error:', error);
      // Fallback to Groq if available
      if (process.env.GROQ_API_KEY) {
        return await this.transcribeGroq(audioFilePath);
      }
      throw error;
    }
  }

  async transcribeGroq(audioFilePath) {
    // Groq API - you'll need to add GROQ_API_KEY to .env
    const formData = new FormData();
    formData.append('file', audioFilePath);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ny');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData
    });

    return await response.text();
  }

  async extractWithOpenRouter(transcript) {
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
              content: `You are MsikaAI. Extract listing data from voice transcript. Return JSON: 
                       {"title": "", "description": "", "category": "", "price": null, "quantity": null, "unit": "", "confidence": 0.0}`
            },
            {
              role: 'user',
              content: `Transcript: "${transcript}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 200
        })
      });

      const data = await response.json();
      try {
        return JSON.parse(data.choices?.[0]?.message?.content || '{}');
      } catch (e) {
        return this.manualExtract(transcript);
      }
    } catch (error) {
      console.error('❌ Extraction error:', error);
      return this.manualExtract(transcript);
    }
  }

  manualExtract(transcript) {
    const lower = transcript.toLowerCase();
    let category = 'Other';
    let title = transcript.substring(0, 50);

    if (lower.includes('chimanga') || lower.includes('maize')) {
      category = 'Farm Inputs';
      title = 'Maize for Sale';
    } else if (lower.includes('simenti') || lower.includes('cement')) {
      category = 'Construction';
      title = 'Cement for Sale';
    } else if (lower.includes('plumber')) {
      category = 'Plumber';
      title = 'Plumbing Services';
    } else if (lower.includes('electrician') || lower.includes('magetsi')) {
      category = 'Electrician';
      title = 'Electrical Services';
    }

    return { title, description: transcript, category, price: null, quantity: null, unit: '', confidence: 0.5 };
  }

  validateListingData(data) {
    const errors = [];
    if (!data.title || data.title.length < 3) errors.push('Title is too short');
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      confidence: data.confidence || 0.5
    };
  }

  fallbackProcess(audioBuffer, language) {
    const transcript = language === 'ny' 
      ? 'Ndili ndi matumba 10 a chimanga ndikugulitsa.'
      : 'I have 10 bags of maize for sale.';
    const listingData = this.manualExtract(transcript);
    return {
      success: true,
      transcript: transcript,
      listing: listingData,
      validation: this.validateListingData(listingData),
      ai_processed: false,
      fallback: true
    };
  }

  async createListingFromVoice(audioBuffer, businessId, userId, language = 'ny') {
    const result = await this.processVoice(audioBuffer, language);
    if (!result.success || !result.validation.isValid) {
      return result;
    }

    const { data, error } = await supabase.from('listings').insert({
      business_id: businessId,
      title: result.listing.title || 'Voice Listing',
      description: result.transcript,
      category: result.listing.category || 'Other',
      price: result.listing.price || null,
      quantity: result.listing.quantity || null,
      unit: result.listing.unit || '',
      status: 'active',
      metadata: {
        voice_created: true,
        language: language,
        transcript: result.transcript,
        ai_processed: true
      }
    }).select().single();

    if (error) throw error;
    return { success: true, listing: data, transcript: result.transcript };
  }

  getSamplePrompts(language = 'ny') {
    return language === 'ny' 
      ? ['Ndili ndi matumba 10 a chimanga ndikugulitsa.', 'Ndikufuna kugulitsa nkhuku 20.']
      : ['I have 10 bags of maize for sale.', 'I want to sell 20 chickens.'];
  }
}

export default new VoiceService();