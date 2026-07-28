import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { writeFileSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIVoiceService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
  }

  // ============================================
  // PROCESS VOICE WITH WHISPER
  // ============================================
  async processVoice(audioBuffer, language = 'ny') {
    try {
      console.log('🎤 Processing voice with Whisper...');

      // Step 1: Transcribe with Whisper
      const transcript = await this.transcribeAudio(audioBuffer, language);
      console.log('📝 Transcription:', transcript);

      // Step 2: Extract structured data using LLM
      const listingData = await this.extractListingData(transcript, language);
      console.log('📋 Extracted data:', listingData);

      // Step 3: Validate
      const validation = this.validateListing(listingData);

      return {
        success: true,
        transcript: transcript,
        listing: listingData,
        validation: validation,
        ai_processed: true,
        ai_provider: this.provider
      };
    } catch (error) {
      console.error('❌ Voice processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================
  // TRANSCRIBE WITH WHISPER
  // ============================================
  async transcribeAudio(audioBuffer, language) {
    try {
      // Save audio to temp file
      const tempFile = `/tmp/voice-${uuidv4()}.wav`;
      writeFileSync(tempFile, audioBuffer);

      const response = await openai.audio.transcriptions.create({
        file: tempFile,
        model: 'whisper-1',
        language: language === 'ny' ? 'ny' : 'en',
        response_format: 'text',
        temperature: 0.2,
        prompt: 'This is a voice recording for a marketplace listing in Malawi.'
      });

      // Clean up
      try { unlinkSync(tempFile); } catch (e) {}

      return response;
    } catch (error) {
      console.error('❌ Whisper error:', error);
      throw error;
    }
  }

  // ============================================
  // EXTRACT LISTING DATA WITH LLM
  // ============================================
  async extractListingData(transcript, language) {
    try {
      const prompt = `
        Extract product/service information from this voice transcript.
        Language: ${language === 'ny' ? 'Chichewa' : 'English'}
        Transcript: "${transcript}"

        Return ONLY valid JSON with:
        {
          "title": "Product or service name (max 50 chars)",
          "description": "Full description extracted from transcript",
          "category": "One of: Farm Inputs, Construction, Plumber, Electrician, Retail, Restaurant, Tailor, Hairdresser, Mechanic, Carpenter, Food, Other",
          "price": null or number,
          "quantity": null or number,
          "unit": "kg|bags|pieces|liters|hours|days|month|year",
          "delivery_available": true/false,
          "contact_phone": null or string,
          "condition": "new|used|refurbished",
          "location": "specific location if mentioned"
        }

        If information is not mentioned, use null.
        Be specific and accurate.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI for a Malawi marketplace. Extract accurate structured data from voice transcripts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('❌ Extraction error:', error);
      throw error;
    }
  }

  // ============================================
  // VALIDATE LISTING
  // ============================================
  validateListing(data) {
    const errors = [];
    const warnings = [];
    let confidence = 0.8;

    if (!data.title || data.title.length < 3) {
      errors.push('Title is missing or too short');
      confidence -= 0.2;
    }

    if (!data.category || data.category === 'Other') {
      warnings.push('Category is set to "Other". Please review.');
      confidence -= 0.1;
    }

    if (data.price && data.price <= 0) {
      errors.push('Price must be greater than 0');
      confidence -= 0.2;
    }

    if (data.quantity && data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
      confidence -= 0.1;
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  // ============================================
  // CREATE LISTING FROM VOICE
  // ============================================
  async createListingFromVoice(audioBuffer, businessId, userId, language = 'ny') {
    try {
      // Process voice
      const result = await this.processVoice(audioBuffer, language);
      
      if (!result.success) {
        return result;
      }

      // Validate
      if (!result.validation.isValid) {
        return {
          success: false,
          error: result.validation.errors.join(', '),
          validation: result.validation,
          transcript: result.transcript
        };
      }

      // Get business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('id, user_id')
        .eq('id', businessId)
        .eq('user_id', userId)
        .single();

      if (bizError || !business) {
        return {
          success: false,
          error: 'Business not found or permission denied'
        };
      }

      // Create listing
      const listing = {
        business_id: businessId,
        title: result.listing.title || 'Voice Listing',
        description: result.transcript,
        category: result.listing.category || 'Other',
        price: result.listing.price || null,
        quantity: result.listing.quantity || null,
        unit: result.listing.unit || '',
        delivery_available: result.listing.delivery_available || false,
        contact_phone: result.listing.contact_phone || '',
        status: 'active',
        location_area: result.listing.location || null,
        metadata: {
          voice_created: true,
          language: language,
          transcript: result.transcript,
          confidence: result.validation.confidence,
          ai_processed: true,
          raw_extraction: result.listing
        }
      };

      const { data: newListing, error: createError } = await supabase
        .from('listings')
        .insert(listing)
        .select()
        .single();

      if (createError) {
        console.error('❌ Listing creation error:', createError);
        return {
          success: false,
          error: createError.message
        };
      }

      return {
        success: true,
        listing: newListing,
        transcript: result.transcript,
        validation: result.validation,
        ai_processed: true
      };
    } catch (error) {
      console.error('❌ Voice listing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================
  // GET SAMPLE PROMPTS
  // ============================================
  getSamplePrompts(language = 'ny') {
    const prompts = {
      'ny': [
        'Ndili ndi matumba 10 a chimanga ndikugulitsa. Mtengo ndi 5000 per bag. Ndimakhala ku Mitundu Trading Centre.',
        'Ndikufuna kugulitsa nkhuku 20 ndi mazira 50. Ndimakhala ku Mitundu Bunda.',
        'Ndili ndi simenti 50kg ndikugulitsa. Ntchito zanga ndi zomanga. Ndimakhala ku Mitundu.',
        'Ndikufuna plumber. Kodi pali amene angandithandize? Ndimakhala ku Mitundu Chimbiri.',
        'Ndili ndi matabwa ndikugulitsa. Zomanga nyumba. Ndimakhala ku Mitundu Motolosi.'
      ],
      'en': [
        'I have 10 bags of maize for sale. Price is 5000 per bag. I am at Mitundu Trading Centre.',
        'I want to sell 20 chickens and 50 eggs. I am in Mitundu Bunda.',
        'I have 50kg cement for sale. I do construction work. I am in Mitundu.',
        'I need a plumber. Is there anyone who can help me? I am in Mitundu Chimbiri.',
        'I have timber for sale. For building houses. I am in Mitundu Motolosi.'
      ]
    };
    return prompts[language] || prompts['ny'];
  }
}

export default new AIVoiceService();