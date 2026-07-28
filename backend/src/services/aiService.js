import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

class AIService {
  // ============================================
  // 1. AI SEARCH - Using OpenRouter (Free)
  // ============================================
  async search(query) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are MsikaAI. Generate search suggestions and summaries for business listings in Mitundu, Malawi. Respond concisely.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 150
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('AI Search error:', error);
      return '';
    }
  }

  // ============================================
  // 2. VOICE TRANSCRIPTION - Groq Whisper (Free)
  // ============================================
  async transcribeAudio(audioBuffer) {
    try {
      // Create a FormData instance
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'ny');
      formData.append('response_format', 'text');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: formData
      });

      if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error('Voice transcription error:', error);
      return 'Ndili ndi matumba 10 a chimanga ndikugulitsa.'; // Fallback
    }
  }

  // ============================================
  // 3. EXTRACT LISTING DATA - Groq Llama (Free)
  // ============================================
  async extractListingData(transcript) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Extract listing data from transcript. Return ONLY valid JSON:
                       {"title":"", "category":"Farm Inputs|Construction|Plumber|Retail|Other", "price":null, "quantity":null, "unit":""}`
            },
            {
              role: 'user',
              content: `Transcript: "${transcript}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Extract error:', error);
      return { title: 'Product', category: 'Other', price: null, quantity: null, unit: '' };
    }
  }

  // ============================================
  // 4. GENERATE AD - Groq Llama (Free)
  // ============================================
  async generateAd(productInfo) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Generate a short ad for a product in Mitundu, Malawi. Return JSON:
                       {"title":"", "description":"", "callToAction":"", "hashtags":[]}`
            },
            {
              role: 'user',
              content: `Product: ${productInfo.title || 'Product'}\nCategory: ${productInfo.category || 'Other'}\nPrice: ${productInfo.price || 'competitive'}`
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Ad generation error:', error);
      return { 
        title: '📢 Product Available!', 
        description: 'Quality product in Mitundu. Contact us today.', 
        callToAction: '📞 Call now!',
        hashtags: ['Mitundu', 'Quality']
      };
    }
  }
}

export default new AIService();