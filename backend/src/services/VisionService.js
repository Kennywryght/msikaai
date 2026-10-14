// backend/src/services/VisionService.js
// Product photo understanding: Gemini vision first, Groq vision as fallback,
// optional Optiic OCR for text on packaging.
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { MODELS, geminiGenerationConfig } from '../config/ai-providers.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const CATEGORIES = [
  'Products', 'Services', 'Farm Inputs', 'Food & Groceries', 'Construction Materials',
  'Electronics', 'Clothing & Fashion', 'Vehicles & Parts', 'Furniture', 'Tools & Equipment', 'Other',
];

const PROMPT = `You are looking at a product photo for a listing on Kumsika, a marketplace in Malawi.
Return JSON only:
{"product":"short name of the main item (English)","productNy":"Chichewa name if common, else empty",
 "category":"one of: ${CATEGORIES.join(', ')}",
 "description":"1-2 factual sentences about what is visible (condition, colour, quantity, packaging)",
 "features":["up to 4 visible selling points"],"visibleText":"any brand/label text you can read",
 "confidence":0.0-1.0}
If the photo shows no product, set product to "unknown" and confidence below 0.3.`;

const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

const parseJSON = (text) => {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
};

class VisionService {
  constructor() {
    this.optiicKey = process.env.OPTIIC_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.groqKey = process.env.GROQ_API_KEY;
  }

  get isConfigured() {
    return !!(this.geminiKey || this.groqKey);
  }

  /**
   * @param {Buffer} imageBuffer
   * @param {string} mimeType e.g. image/jpeg, image/png, image/webp
   * @returns {Promise<{success:boolean, detectedProduct:string, category:string, description:string,
   *   features:string[], ocr_text:string, confidence:number, provider?:string, error?:string}>}
   */
  async analyzeImage(imageBuffer, mimeType = 'image/jpeg') {
    const empty = {
      success: false, detectedProduct: '', category: 'Other', description: '',
      features: [], ocr_text: '', confidence: 0,
    };
    if (!imageBuffer?.length) return { ...empty, error: 'No image' };
    const mime = /^image\/(jpeg|png|webp|heic|heif)$/i.test(mimeType) ? mimeType.toLowerCase() : 'image/jpeg';

    const [analysis, ocr] = await Promise.all([
      this.understand(imageBuffer, mime),
      this.optiicKey ? this.ocrOptiic(imageBuffer) : Promise.resolve({ text: '' }),
    ]);
    if (!analysis) return { ...empty, ocr_text: ocr.text || '', error: 'Image analysis unavailable' };

    const category = CATEGORIES.find((c) => c.toLowerCase() === String(analysis.category || '').toLowerCase()) || 'Other';
    const product = String(analysis.product || '').trim();
    return {
      success: !!product && product.toLowerCase() !== 'unknown',
      detectedProduct: product.toLowerCase() === 'unknown' ? '' : product,
      productNy: String(analysis.productNy || '').trim(),
      category,
      suggestedCategory: category,
      description: String(analysis.description || '').trim(),
      features: Array.isArray(analysis.features) ? analysis.features.map(String).slice(0, 4) : [],
      ocr_text: [analysis.visibleText, ocr.text].filter(Boolean).join(' ').trim(),
      confidence: Math.max(0, Math.min(1, Number(analysis.confidence) || 0.5)),
      provider: analysis._provider,
    };
  }

  async understand(imageBuffer, mime) {
    if (this.geminiKey) {
      try {
        return { ...(await this.understandWithGemini(imageBuffer, mime)), _provider: 'gemini' };
      } catch (error) {
        logger.warn('Gemini vision failed:', error?.message || error);
      }
    }
    if (this.groqKey) {
      try {
        return { ...(await this.understandWithGroq(imageBuffer, mime)), _provider: 'groq' };
      } catch (error) {
        logger.warn('Groq vision failed:', error?.message || error);
      }
    }
    return null;
  }

  async understandWithGemini(imageBuffer, mime) {
    const model = MODELS.geminiVision;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.geminiKey },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: mime, data: imageBuffer.toString('base64') } },
              { text: PROMPT },
            ],
          }],
          generationConfig: geminiGenerationConfig(model, { temperature: 0.2, maxTokens: 500, json: true }),
        }),
      }
    );
    if (!response.ok) throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const data = await response.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    const parsed = parseJSON(text);
    if (!parsed) throw new Error('Gemini vision returned no JSON');
    return parsed;
  }

  async understandWithGroq(imageBuffer, mime) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.groqKey}` },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBuffer.toString('base64')}` } },
          ],
        }],
      }),
    });
    if (!response.ok) throw new Error(`Groq ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const data = await response.json();
    const parsed = parseJSON(data.choices?.[0]?.message?.content);
    if (!parsed) throw new Error('Groq vision returned no JSON');
    return parsed;
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
          Authorization: `Bearer ${this.optiicKey}`,
        },
        timeout: 15000,
      });
      return { text: String(response.data?.text || '').trim() };
    } catch (error) {
      logger.warn('Optiic OCR failed:', error?.message || error);
      return { text: '' };
    }
  }
}

export default new VisionService();
