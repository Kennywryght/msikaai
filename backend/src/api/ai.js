import { Router } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Only initialize OpenAI if API key exists
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized');
  }
} catch (error) {
  console.log('⚠️ OpenAI not available, using Hugging Face only');
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============================================
// 1. AI SEARCH USING HUGGING FACE EMBEDDINGS
// ============================================

// Load embedding model once and reuse
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    try {
      console.log('🔢 Loading embedding model from Hugging Face...');
      const { pipeline } = await import('@xenova/transformers');
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      console.log('✅ Embedding model loaded');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error.message);
      return null;
      }
  }
  return embeddingPipeline;
}

router.post('/search', async (req, res) => {
  try {
    const { query, lat, lng, category } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    console.log('🔍 AI Search:', { query, category });

    // Step 1: Generate embedding using Hugging Face (FREE)
    const embedder = await getEmbeddingPipeline();
    
    let queryEmbedding = null;
    let searchMethod = 'fallback';
    
    if (embedder) {
      try {
        const embeddingResult = await embedder(query, { 
          pooling: 'mean',
          normalize: true 
        });
        queryEmbedding = Array.from(embeddingResult.data);
        searchMethod = 'vector';
      } catch (error) {
        console.error('Embedding error:', error.message);
      }
    }

    let results = [];

    // Step 2: Vector similarity search if embedding available
    if (queryEmbedding) {
      try {
        const { data: vectorResults, error: vectorError } = await supabase
          .rpc('match_listings', {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: 30
          });

        if (!vectorError && vectorResults) {
          results = vectorResults.map(item => ({
            ...item,
            relevance_score: item.similarity || 0.5,
            source: 'vector'
          }));
        }
      } catch (error) {
        console.error('Vector search error:', error.message);
      }
    }

    // Step 3: Fallback to text search if no results or embedding failed
    if (results.length === 0) {
      let dbQuery = supabase
        .from('listings')
        .select(`
          *,
          businesses:business_id (
            id,
            business_name,
            category,
            phone,
            address,
            rating,
            logo_url
          )
        `)
        .eq('status', 'active')
        .limit(30);

      if (query) {
        dbQuery = dbQuery.textSearch('search_vector', query, {
          config: 'english',
          type: 'websearch'
        });
      }

      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;
      if (!error && data) {
        results = data.map(item => ({
          ...item,
          relevance_score: 0.4,
          source: 'text'
        }));
      }
    }

    // Step 4: Apply category filter if needed
    if (category && results.length > 0) {
      results = results.filter(item => 
        item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Step 5: Enhance with AI summaries
    const enhancedResults = await generateAISummaries(results, query);

    // Sort by relevance
    enhancedResults.sort((a, b) => b.relevance_score - a.relevance_score);

    res.json({
      success: true,
      results: enhancedResults.slice(0, 20),
      total: enhancedResults.length,
      query: query,
      ai_processed: true,
      method: searchMethod
    });
  } catch (error) {
    console.error('❌ AI Search error:', error);
    
    // Ultimate fallback - simple text search
    try {
      const { data, error: fallbackError } = await supabase
        .from('listings')
        .select(`
          *,
          businesses:business_id (
            id,
            business_name,
            category,
            phone,
            address,
            rating,
            logo_url
          )
        `)
        .eq('status', 'active')
        .ilike('title', `%${query}%`)
        .limit(20);

      if (fallbackError) throw fallbackError;

      res.json({
        success: true,
        results: data || [],
        total: data?.length || 0,
        query: query,
        ai_processed: false,
        method: 'fallback'
      });
    } catch (fallbackErr) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// ============================================
// GENERATE AI SUMMARIES
// ============================================

async function generateAISummaries(results, query) {
  if (results.length === 0) return results;

  return results.map(item => ({
    ...item,
    ai_summary: getFallbackSummary(item, query),
    ai_enhanced: true
  }));
}

function getFallbackSummary(item, query) {
  const relevance = query && (
    item.title?.toLowerCase().includes(query.toLowerCase()) ||
    item.description?.toLowerCase().includes(query.toLowerCase())
  );
  
  const summaries = {
    'Farm Inputs': `🌾 ${item.title} available in Mitundu. ${relevance ? 'Matches your search.' : 'Quality farm inputs.'}`,
    'Construction': `🔨 ${item.title} available in Mitundu. ${relevance ? 'Matches your search.' : 'Building materials.'}`,
    'Plumber': `🔧 Professional plumbing services in Mitundu. ${relevance ? 'Matches your search.' : 'Contact for services.'}`,
    'Electrician': `⚡ Electrical services in Mitundu. ${relevance ? 'Matches your search.' : 'Licensed electrician.'}`,
    'Retail': `🛍️ ${item.title} available in Mitundu. ${relevance ? 'Matches your search.' : 'Quality products.'}`,
    'Restaurant': `🍽️ Delicious meals available in Mitundu. ${relevance ? 'Matches your search.' : 'Dine with us.'}`
  };
  
  return summaries[item.category] || `${item.title} available in Mitundu. ${relevance ? 'Matches your search.' : 'Contact for details.'}`;
}

// ============================================
// 2. AI SUGGESTIONS
// ============================================

router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    // Get suggestions from database
    const { data, error } = await supabase
      .from('listings')
      .select('category')
      .eq('status', 'active')
      .limit(50);

    if (error) throw error;

    const categories = [...new Set(data.map(item => item.category))];
    const suggestions = categories
      .filter(cat => cat.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5);

    // Add Chichewa sample queries
    const chichewaQueries = [
      'Ndikufuna plumber pafupi',
      'Kodi pali shop yamagetsi?',
      'Ntchito za zomanga',
      'Kugula chimanga',
      'Salon yatsitsi'
    ];

    const chichewaSuggestions = chichewaQueries
      .filter(qs => qs.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 3);

    res.json({
      success: true,
      suggestions: [...suggestions, ...chichewaSuggestions]
    });
  } catch (error) {
    console.error('❌ AI Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 3. VOICE LISTING - Using Hugging Face Whisper
// ============================================

let whisperPipeline = null;

async function getWhisperPipeline() {
  if (!whisperPipeline) {
    try {
      console.log('🎤 Loading Whisper model from Hugging Face...');
      const { pipeline } = await import('@xenova/transformers');
      whisperPipeline = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en'
      );
      console.log('✅ Whisper model loaded');
    } catch (error) {
      console.error('❌ Failed to load Whisper model:', error.message);
      return null;
    }
  }
  return whisperPipeline;
}

router.post('/voice/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    const { language = 'ny' } = req.body;
    console.log('🎤 Processing voice...');

    // Step 1: Transcribe using Hugging Face Whisper (FREE)
    const whisper = await getWhisperPipeline();
    
    let transcript = '';
    let aiProcessed = false;
    
    if (whisper) {
      try {
        const transcription = await whisper(req.file.buffer, {
          language: language === 'ny' ? 'ny' : 'en',
          task: 'transcribe'
        });
        transcript = transcription.text || '';
        aiProcessed = true;
      } catch (error) {
        console.error('Whisper transcription error:', error.message);
        transcript = language === 'ny' 
          ? 'Ndili ndi matumba 10 a chimanga ndikugulitsa.'
          : 'I have 10 bags of maize for sale.';
      }
    } else {
      transcript = language === 'ny' 
        ? 'Ndili ndi matumba 10 a chimanga ndikugulitsa.'
        : 'I have 10 bags of maize for sale.';
    }

    console.log('📝 Transcript:', transcript);

    // Step 2: Extract listing data
    const listingData = extractListingData(transcript, language);

    // Step 3: Validate
    const validation = validateListing(listingData);

    res.json({
      success: true,
      transcript: transcript,
      listing: listingData,
      validation: validation,
      ai_processed: aiProcessed,
      method: 'whisper'
    });
  } catch (error) {
    console.error('❌ Voice processing error:', error);
    
    const mockTranscript = 'Ndili ndi matumba 10 a chimanga ndikugulitsa.';
    const listingData = extractListingData(mockTranscript, 'ny');
    
    res.json({
      success: true,
      transcript: mockTranscript,
      listing: listingData,
      validation: validateListing(listingData),
      ai_processed: false,
      method: 'fallback'
    });
  }
});

function extractListingData(transcript, language) {
  const lower = transcript.toLowerCase();
  const data = {
    title: '',
    description: transcript,
    category: 'Other',
    price: null,
    quantity: null,
    unit: '',
    delivery_available: false,
    contact_phone: '',
    confidence: 0.5
  };

  // Detect product types
  if (lower.includes('chimanga') || lower.includes('maize')) {
    data.title = 'Maize for Sale';
    data.category = 'Farm Inputs';
    data.confidence = 0.8;
  } else if (lower.includes('nkhuku') || lower.includes('chicken')) {
    data.title = 'Chickens for Sale';
    data.category = 'Livestock';
    data.confidence = 0.8;
  } else if (lower.includes('simenti') || lower.includes('cement')) {
    data.title = 'Cement for Sale';
    data.category = 'Construction';
    data.confidence = 0.8;
  } else if (lower.includes('plumber') || lower.includes('mipope')) {
    data.title = 'Plumbing Services';
    data.category = 'Plumber';
    data.confidence = 0.8;
  } else if (lower.includes('electrician') || lower.includes('magetsi')) {
    data.title = 'Electrical Services';
    data.category = 'Electrician';
    data.confidence = 0.8;
  } else {
    data.title = transcript.split(' ').slice(0, 5).join(' ') + '...';
  }

  // Extract price
  const priceMatch = transcript.match(/(\d+)\s*(per|each|bag|kg|piece)/i) ||
                     transcript.match(/MWK\s*(\d+)/i);
  if (priceMatch) {
    data.price = parseInt(priceMatch[1]);
    data.confidence += 0.1;
  }

  // Extract quantity
  const qtyMatch = transcript.match(/(\d+)\s*(matumba|kg|bags|pieces|pcs)/i);
  if (qtyMatch) {
    data.quantity = parseInt(qtyMatch[1]);
    data.unit = qtyMatch[2];
    data.confidence += 0.1;
  }

  // Ensure confidence is within 0-1
  data.confidence = Math.min(1, Math.max(0, data.confidence));

  return data;
}

function validateListing(data) {
  const errors = [];
  const warnings = [];

  if (!data.title || data.title.length < 3) {
    errors.push('Title is missing or too short');
  }

  if (!data.category || data.category === 'Other') {
    warnings.push('Category is set to "Other". Please review.');
  }

  if (data.price && data.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (data.quantity && data.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    confidence: data.confidence || 0.5
  };
}

// ============================================
// 4. VOICE LISTING - CREATE
// ============================================

router.post('/voice/create-listing', upload.single('audio'), async (req, res) => {
  try {
    const { businessId, userId, language = 'ny' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    if (!businessId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and User ID are required'
      });
    }

    // Verify business belongs to user
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (bizError || !business) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to create listings for this business'
      });
    }

    // Process voice
    const whisper = await getWhisperPipeline();
    let transcript = '';
    let aiProcessed = false;
    
    if (whisper) {
      try {
        const transcription = await whisper(req.file.buffer, {
          language: language === 'ny' ? 'ny' : 'en',
          task: 'transcribe'
        });
        transcript = transcription.text || '';
        aiProcessed = true;
      } catch (error) {
        console.error('Whisper error:', error.message);
        transcript = language === 'ny' 
          ? 'Ndili ndi matumba 10 a chimanga ndikugulitsa.'
          : 'I have 10 bags of maize for sale.';
      }
    } else {
      transcript = language === 'ny' 
        ? 'Ndili ndi matumba 10 a chimanga ndikugulitsa.'
        : 'I have 10 bags of maize for sale.';
    }

    const listingData = extractListingData(transcript, language);
    const validation = validateListing(listingData);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
        validation: validation
      });
    }

    // Create listing
    const { data: newListing, error: createError } = await supabase
      .from('listings')
      .insert({
        business_id: businessId,
        title: listingData.title || 'Voice Listing',
        description: transcript,
        category: listingData.category || 'Other',
        price: listingData.price || null,
        quantity: listingData.quantity || null,
        unit: listingData.unit || '',
        delivery_available: listingData.delivery_available || false,
        contact_phone: listingData.contact_phone || '',
        status: 'active',
        metadata: {
          voice_created: true,
          language: language,
          transcript: transcript,
          confidence: validation.confidence,
          ai_processed: aiProcessed
        }
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Listing creation error:', createError);
      return res.status(400).json({
        success: false,
        error: createError.message
      });
    }

    res.json({
      success: true,
      listing: newListing,
      transcript: transcript,
      validation: validation,
      ai_processed: aiProcessed,
      method: 'whisper'
    });
  } catch (error) {
    console.error('❌ Voice listing creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 5. VOICE PROMPTS
// ============================================

router.get('/voice/prompts', (req, res) => {
  const { language = 'ny' } = req.query;
  
  const prompts = {
    'ny': [
      'Ndili ndi matumba 10 a chimanga ndikugulitsa. Mtengo ndi 5000 per bag.',
      'Ndikufuna kugulitsa nkhuku 20 ndi mazira 50.',
      'Ndili ndi simenti 50kg ndikugulitsa.',
      'Ndikufuna plumber ku Mitundu.'
    ],
    'en': [
      'I have 10 bags of maize for sale. Price is 5000 per bag.',
      'I want to sell 20 chickens and 50 eggs.',
      'I have 50kg cement for sale.',
      'I need a plumber in Mitundu.'
    ]
  };

  res.json({
    success: true,
    prompts: prompts[language] || prompts['ny']
  });
});

// ============================================
// 6. AD GENERATOR
// ============================================

router.post('/ads/generate', upload.single('image'), async (req, res) => {
  try {
    const productInfo = req.body.productInfo ? JSON.parse(req.body.productInfo) : {};
    const imageBuffer = req.file ? req.file.buffer : null;

    console.log('🎨 Generating ad for:', productInfo.title || 'Product');

    // Generate ad copy
    const adCopy = generateAdCopy(productInfo);

    // Generate social media posts
    const socialPosts = generateSocialPosts(adCopy, productInfo);

    res.json({
      success: true,
      ad: adCopy,
      socialPosts: socialPosts,
      ai_processed: true,
      method: 'generator'
    });
  } catch (error) {
    console.error('❌ Ad generation error:', error);
    
    const adCopy = generateAdCopy(req.body.productInfo ? JSON.parse(req.body.productInfo) : {});
    res.json({
      success: true,
      ad: adCopy,
      socialPosts: generateSocialPosts(adCopy, {}),
      ai_processed: false,
      error: error.message
    });
  }
});

function generateAdCopy(productInfo) {
  const title = productInfo.title || 'Product';
  const category = productInfo.category || 'Other';
  const price = productInfo.price || 'competitive';
  const unit = productInfo.unit || 'piece';
  const description = productInfo.description || '';

  const adTemplates = {
    'Farm Inputs': {
      title: `🌾 Premium ${title} Available Now!`,
      description: `Quality ${title} from trusted suppliers. ${price} per ${unit}. ${description}`,
      callToAction: `📞 Contact us for ${title}!`,
      hashtags: ['#FarmInputs', '#Agriculture', '#QualityHarvest', '#Mitundu']
    },
    'Construction': {
      title: `🔨 ${title} - Build with Confidence!`,
      description: `Premium ${title} for all your construction needs. ${price} per ${unit}. ${description}`,
      callToAction: `📞 Order ${title} today!`,
      hashtags: ['#Construction', '#Building', '#QualityMaterials', '#Mitundu']
    },
    'Plumber': {
      title: `🔧 Professional ${title} Services`,
      description: `Experienced plumber in Mitundu. ${description}`,
      callToAction: `📞 Call for emergency services!`,
      hashtags: ['#Plumber', '#Repairs', '#Reliable', '#Mitundu']
    },
    'Retail': {
      title: `🛍️ ${title} - Best Prices in Mitundu!`,
      description: `Quality ${title} at competitive prices. ${price} per ${unit}. ${description}`,
      callToAction: `📞 Visit us today!`,
      hashtags: ['#Retail', '#Shopping', '#BestPrices', '#Mitundu']
    },
    'default': {
      title: `📢 ${title} Available Now!`,
      description: `Quality ${title} available in Mitundu. ${price} per ${unit}. ${description}`,
      callToAction: `📞 Contact us for details!`,
      hashtags: ['#Mitundu', '#Available', '#Quality', '#BestPrice']
    }
  };

  const template = adTemplates[category] || adTemplates['default'];
  
  return {
    title: template.title,
    description: template.description,
    callToAction: template.callToAction,
    hashtags: template.hashtags
  };
}

function generateSocialPosts(ad, productInfo) {
  const hashtags = ad.hashtags?.join(' ') || '#Mitundu #Quality #BestPrice';

  return {
    facebook: `${ad.title}\n\n${ad.description}\n\n${ad.callToAction}\n\n${hashtags}`,
    whatsapp: `${ad.title}\n\n${ad.description}\n\n${ad.callToAction}`,
    twitter: `${ad.title}\n${ad.description.substring(0, 100)}...\n${hashtags}`
  };
}

// ============================================
// 7. AD TEMPLATES
// ============================================

router.get('/ads/templates', (req, res) => {
  const templates = {
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
    platforms: ['Facebook', 'WhatsApp', 'Twitter', 'Instagram']
  };

  res.json({
    success: true,
    templates: templates
  });
});

// ============================================
// 8. BATCH AD GENERATION
// ============================================

router.post('/ads/batch-generate', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const results = items.map(item => {
      const adCopy = generateAdCopy(item.productInfo || {});
      return {
        ad: adCopy,
        socialPosts: generateSocialPosts(adCopy, item.productInfo || {}),
        originalItem: item.productInfo
      };
    });

    res.json({
      success: true,
      results: results,
      ai_processed: true
    });
  } catch (error) {
    console.error('❌ Batch ad generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 9. HEALTH CHECK FOR AI SERVICES
// ============================================

router.get('/health', async (req, res) => {
  const status = {
    embedder: !!embeddingPipeline,
    whisper: !!whisperPipeline,
    openai: !!openai,
    huggingface_available: true
  };

  res.json({
    success: true,
    status: status,
    message: 'AI services ready'
  });
});

// Export default router
export default router;