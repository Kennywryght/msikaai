import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIAdService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.model = process.env.AI_TEXT_MODEL || 'gpt-3.5-turbo';
  }

  // ============================================
  // GENERATE AD WITH AI
  // ============================================
  async generateAd(productInfo, imageBuffer = null) {
    try {
      console.log('🎨 Generating ad for:', productInfo.title || 'Product');

      // Step 1: Analyze image if provided
      let imageAnalysis = null;
      if (imageBuffer) {
        imageAnalysis = await this.analyzeImage(imageBuffer);
      }

      // Step 2: Generate ad copy with AI
      const adCopy = await this.generateAdCopy(productInfo, imageAnalysis);

      // Step 3: Generate social media posts
      const socialPosts = this.generateSocialPosts(adCopy, productInfo);

      // Step 4: Generate marketing tagline
      const tagline = await this.generateTagline(productInfo, adCopy);

      return {
        success: true,
        ad: adCopy,
        socialPosts: socialPosts,
        tagline: tagline,
        imageAnalysis: imageAnalysis,
        ai_processed: true,
        ai_provider: this.provider
      };
    } catch (error) {
      console.error('❌ Ad generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================
  // ANALYZE IMAGE WITH AI VISION
  // ============================================
  async analyzeImage(imageBuffer) {
    try {
      const base64Image = imageBuffer.toString('base64');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this product image and return JSON with:
                {
                  "product": "what you see (be specific)",
                  "category": "Farm Inputs|Construction|Plumber|Electrician|Retail|Restaurant|Other",
                  "quality": "quality assessment",
                  "colors": ["color1", "color2"],
                  "description": "detailed description",
                  "suggested_price": null or number,
                  "confidence": 0.0-1.0
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      return {
        product: 'product',
        category: 'Other',
        quality: 'Good',
        colors: [],
        description: 'A product image',
        suggested_price: null,
        confidence: 0.5
      };
    }
  }

  // ============================================
  // GENERATE AD COPY
  // ============================================
  async generateAdCopy(productInfo, imageAnalysis) {
    const prompt = this.buildAdPrompt(productInfo, imageAnalysis);

    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a professional marketing copywriter for MsikaAI, a marketplace in Mitundu, Malawi.
                     Create compelling, culturally relevant ad copy. Use emojis and make it engaging.
                     Always include a clear call-to-action.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('❌ Ad copy error:', error);
      return this.fallbackAdCopy(productInfo);
    }
  }

  // ============================================
  // BUILD AD PROMPT
  // ============================================
  buildAdPrompt(productInfo, imageAnalysis) {
    const title = productInfo.title || imageAnalysis?.product || 'Product';
    const category = productInfo.category || imageAnalysis?.category || 'Other';
    const price = productInfo.price || imageAnalysis?.suggested_price || 'competitive';
    const unit = productInfo.unit || 'piece';
    const description = productInfo.description || imageAnalysis?.description || '';
    const quality = imageAnalysis?.quality || 'High Quality';

    return `
      Product Details:
      - Title: ${title}
      - Category: ${category}
      - Price: ${price} MWK per ${unit}
      - Quality: ${quality}
      - Description: ${description}
      ${imageAnalysis ? `- Image Analysis: ${JSON.stringify(imageAnalysis)}` : ''}

      Generate a professional ad with:
      1. Catchy title (max 60 chars)
      2. Persuasive description (max 200 chars)
      3. Clear call-to-action
      4. 5 relevant hashtags

      Return JSON:
      {
        "title": "",
        "description": "",
        "callToAction": "",
        "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
      }
    `;
  }

  // ============================================
  // FALLBACK AD COPY
  // ============================================
  fallbackAdCopy(productInfo) {
    const title = productInfo.title || 'Product';
    const price = productInfo.price || 'competitive';
    const unit = productInfo.unit || 'piece';

    return {
      title: `📢 ${title} Available Now in Mitundu!`,
      description: `Quality ${title} at ${price} per ${unit}. Contact us for the best deals.`,
      callToAction: `📞 Call now for ${title}!`,
      hashtags: ['#Mitundu', '#Quality', '#BestPrice', '#LocalBusiness', '#MsikaAI']
    };
  }

  // ============================================
  // GENERATE SOCIAL MEDIA POSTS
  // ============================================
  generateSocialPosts(ad, productInfo) {
    const hashtags = ad.hashtags?.join(' ') || '#Mitundu #Quality #BestPrice';

    return {
      facebook: `${ad.title}\n\n${ad.description}\n\n${ad.callToAction}\n\n${hashtags}`,
      whatsapp: `${ad.title}\n\n${ad.description}\n\n${ad.callToAction}`,
      twitter: `${ad.title}\n${ad.description.substring(0, 100)}...\n${hashtags}`,
      linkedin: `📊 ${ad.title}\n\n${ad.description}\n\n${ad.callToAction}`
    };
  }

  // ============================================
  // GENERATE TAGLINE
  // ============================================
  async generateTagline(productInfo, adCopy) {
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Generate a short, catchy tagline for a product in Malawi. Max 8 words.'
          },
          {
            role: 'user',
            content: `Product: ${productInfo.title || 'Product'}\nAd: ${adCopy.title}\nCategory: ${productInfo.category || 'General'}`
          }
        ],
        temperature: 0.8,
        max_tokens: 50
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      const taglines = [
        'Quality you can trust.',
        'Serving Mitundu with excellence.',
        'Your trusted local partner.',
        'Quality products, fair prices.',
        'Building community through commerce.'
      ];
      return taglines[Math.floor(Math.random() * taglines.length)];
    }
  }

  // ============================================
  // BATCH GENERATE ADS
  // ============================================
  async batchGenerateAds(items) {
    const results = [];
    for (const item of items) {
      const result = await this.generateAd(item.productInfo, item.imageBuffer);
      results.push({
        ...result,
        originalItem: item.productInfo
      });
    }
    return results;
  }

  // ============================================
  // GET AD TEMPLATES
  // ============================================
  async getAdTemplates() {
    return {
      categories: [
        'Farm Inputs',
        'Construction',
        'Plumber',
        'Electrician',
        'Retail',
        'Restaurant',
        'Tailor',
        'Hairdresser',
        'Mechanic',
        'Carpenter',
        'Other'
      ],
      tones: ['Professional', 'Friendly', 'Urgent', 'Luxury', 'Budget', 'Eco-friendly'],
      formats: ['Social Media', 'Print', 'Radio', 'Video Script']
    };
  }
}

export default new AIAdService();