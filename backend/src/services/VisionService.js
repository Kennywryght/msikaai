import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

class VisionService {
  constructor() {
    this.optiicKey = process.env.OPTIIC_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.openrouterKey = process.env.OPENROUTER_API_KEY;
  }

  async analyzeImage(imageBuffer) {
    try {
      console.log('🖼️ Analyzing image with Optiic OCR + Gemini...');

      // Step 1: OCR with Optiic
      const ocrResult = await this.ocrOptiic(imageBuffer);
      console.log('📝 OCR Result:', ocrResult);

      // Step 2: Understand image with Gemini
      const analysis = await this.understandWithGemini(imageBuffer);
      console.log('🧠 Gemini Analysis:', analysis);

      return {
        success: true,
        ocr_text: ocrResult.text || '',
        detectedProduct: analysis.product || 'product',
        category: analysis.category || 'Other',
        description: analysis.description || '',
        confidence: analysis.confidence || 0.7,
        suggestedCategory: analysis.category
      };
    } catch (error) {
      console.error('❌ Vision analysis error:', error);
      return {
        success: false,
        error: error.message,
        detectedProduct: 'product',
        category: 'Other'
      };
    }
  }

  async ocrOptiic(imageBuffer) {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, { filename: 'image.jpg' });
      formData.append('mode', 'ocr');
      formData.append('language', 'en');

      const response = await axios.post('https://api.optiic.dev/ocr', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.optiicKey}`
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('❌ Optiic error:', error);
      return { text: '' };
    }
  }

  async understandWithGemini(imageBuffer) {
    try {
      const base64Image = imageBuffer.toString('base64');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image
                  }
                },
                {
                  text: `Analyze this product image. Return JSON: 
                         {"product": "name", "category": "Farm Inputs|Construction|Plumber|Retail|Restaurant|Hardware|Other", 
                          "description": "brief description", "quality": "rating", "confidence": 0.0-1.0}`
                }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      try {
        return JSON.parse(text);
      } catch (e) {
        return { product: 'product', category: 'Other', description: '', confidence: 0.5 };
      }
    } catch (error) {
      console.error('❌ Gemini error:', error);
      return { product: 'product', category: 'Other', description: '', confidence: 0.5 };
    }
  }

  async generateAdWithOpenRouter(productInfo, visionResult) {
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
              content: `You are an ad copywriter for Mitundu, Malawi. Generate a short, compelling ad for a product.
                       Return JSON: {"title": "", "description": "", "callToAction": "", "hashtags": []}`
            },
            {
              role: 'user',
              content: `Product: ${productInfo.title || visionResult.detectedProduct}
                       Category: ${visionResult.category}
                       Description: ${visionResult.description || productInfo.description || ''}
                       Price: ${productInfo.price || 'competitive'}`
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      const data = await response.json();
      try {
        return JSON.parse(data.choices?.[0]?.message?.content || '{}');
      } catch (e) {
        return this.getFallbackAd(productInfo, visionResult);
      }
    } catch (error) {
      console.error('❌ Ad generation error:', error);
      return this.getFallbackAd(productInfo, visionResult);
    }
  }

  getFallbackAd(productInfo, visionResult) {
    const product = productInfo.title || visionResult.detectedProduct || 'Product';
    return {
      title: `📢 ${product} Available Now in Mitundu!`,
      description: `Quality ${product} available at competitive prices. Contact us today!`,
      callToAction: `📞 Call us now for ${product}!`,
      hashtags: ['Mitundu', 'Available', 'Quality']
    };
  }
}

export default new VisionService();