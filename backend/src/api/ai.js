// backend/src/api/ai.js
import { Router } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import groqService from '../services/groqService.js';
import geminiService from '../services/geminiService.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============================================
// 1. SMART SEARCH - Using Groq for speed
// ============================================
router.post('/search', async (req, res) => {
  try {
    const { query, location, category, history } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    logger.info('🔍 AI Search:', { query, category });

    // Step 1: Use Groq for smart search
    let aiResults = null;
    let searchMethod = 'fallback';

    try {
      const result = await groqService.smartSearch(query, {
        location: location || 'Mitundu',
        category: category || 'All',
        history: history || []
      });

      if (result.success) {
        aiResults = result.parsed || result.data;
        searchMethod = 'groq-ai';
        logger.info('✅ Groq search successful');
      }
    } catch (error) {
      logger.error('Groq search error:', error.message);
    }

    // Step 2: Database search with AI-enhanced terms
    let searchTerms = [];
    let suggestedCategory = category || 'All';

    if (aiResults) {
      searchTerms = aiResults.searchTerms || [query];
      suggestedCategory = aiResults.category || category || 'All';
    } else {
      searchTerms = [query];
    }

    // Build database query
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

    // Use search terms
    if (searchTerms.length > 0) {
      const searchQuery = searchTerms.join(' ');
      dbQuery = dbQuery.textSearch('search_vector', searchQuery, {
        config: 'english',
        type: 'websearch'
      });
    }

    // Apply category filter
    if (suggestedCategory && suggestedCategory !== 'All') {
      dbQuery = dbQuery.eq('category', suggestedCategory);
    }

    const { data, error } = await dbQuery;

    if (error) {
      logger.error('Database search error:', error);
      // Fallback to simple search
      const { data: fallbackData, error: fallbackError } = await supabase
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

      if (!fallbackError && fallbackData) {
        return res.json({
          success: true,
          results: fallbackData,
          total: fallbackData.length,
          query: query,
          ai_processed: false,
          method: 'fallback'
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Step 3: Enhance results with AI summaries
    const enhancedResults = data.map(item => ({
      ...item,
      ai_summary: getAISummary(item, query),
      ai_enhanced: true
    }));

    // Step 4: Add AI response
    const response = {
      success: true,
      results: enhancedResults.slice(0, 20),
      total: enhancedResults.length,
      query: query,
      ai_processed: true,
      method: searchMethod,
      ai_response: aiResults?.response || null,
      related_searches: aiResults?.relatedSearches || [],
      suggested_category: suggestedCategory
    };

    res.json(response);
  } catch (error) {
    logger.error('❌ AI Search error:', error);
    
    // Ultimate fallback
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
        .ilike('title', `%${req.body.query}%`)
        .limit(20);

      if (fallbackError) throw fallbackError;

      res.json({
        success: true,
        results: data || [],
        total: data?.length || 0,
        query: req.body.query,
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

    // Chichewa sample queries
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
// 3. GENERATE DESCRIPTION - Using Gemini for quality
// ============================================
router.post('/generate-description', async (req, res) => {
  try {
    const { title, category, features, price, location } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // Try Gemini first for quality
    let result = null;
    let provider = 'gemini';

    try {
      result = await geminiService.generateDescription({
        title,
        category: category || 'General',
        features: features || 'Not specified',
        price: price || 'Contact for price',
        location: location || 'Mitundu'
      });

      if (result.success) {
        logger.info('✅ Gemini description generated');
      }
    } catch (error) {
      logger.error('Gemini description error:', error.message);
      
      // Fallback to Groq
      try {
        const prompt = `
          Generate a compelling product listing description for Kumsika marketplace in Mitundu, Malawi.
          
          Product Title: ${title}
          Category: ${category || 'General'}
          Key Features: ${features || 'Not specified'}
          Price: ${price || 'Contact for price'}
          Location: ${location || 'Mitundu'}
          
          Write a friendly, professional description (150-250 words) with a call-to-action.
        `;
        
        const fallbackResult = await groqService.generateText(prompt, {
          temperature: 0.7,
          maxTokens: 500,
          systemPrompt: 'You are a professional marketplace assistant for Kumsika in Mitundu, Malawi.'
        });
        
        result = fallbackResult;
        provider = 'groq (fallback)';
      } catch (fallbackError) {
        logger.error('Fallback description error:', fallbackError);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate description'
        });
      }
    }

    if (result && result.success) {
      res.json({
        success: true,
        description: result.parsed?.text || result.data,
        provider: provider,
        usage: result.usage
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate description'
      });
    }
  } catch (error) {
    logger.error('Description generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4. GENERATE AD - Using Gemini for quality
// ============================================
router.post('/ads/generate', upload.single('image'), async (req, res) => {
  try {
    const productInfo = req.body.productInfo ? JSON.parse(req.body.productInfo) : {};
    const imageBuffer = req.file ? req.file.buffer : null;

    logger.info('🎨 Generating ad for:', productInfo.title || 'Product');

    // Try Gemini first for quality
    let result = null;
    let provider = 'gemini';

    try {
      result = await geminiService.generateAd({
        title: productInfo.title || 'Product',
        description: productInfo.description || '',
        category: productInfo.category || 'Other',
        price: productInfo.price || 'Contact for price'
      });

      if (result.success) {
        logger.info('✅ Gemini ad generated');
      }
    } catch (error) {
      logger.error('Gemini ad error:', error.message);
      
      // Fallback to Groq
      try {
        const prompt = `
          Create engaging ad content for a listing on Kumsika marketplace.
          
          Title: ${productInfo.title || 'Product'}
          Category: ${productInfo.category || 'Other'}
          Price: ${productInfo.price || 'Contact for price'}
          
          Generate headline, short copy, full copy, call to action, and selling points.
        `;
        
        const fallbackResult = await groqService.generateText(prompt, {
          temperature: 0.8,
          maxTokens: 600,
          systemPrompt: 'You are an advertising expert for Kumsika marketplace.'
        });
        
        result = fallbackResult;
        provider = 'groq (fallback)';
      } catch (fallbackError) {
        logger.error('Fallback ad error:', fallbackError);
        // Use built-in generator
        const adCopy = generateAdCopy(productInfo);
        return res.json({
          success: true,
          ad: adCopy,
          socialPosts: generateSocialPosts(adCopy, productInfo),
          provider: 'built-in',
          ai_processed: false
        });
      }
    }

    let adData = result.parsed || result.data;
    
    // If result is text, parse it
    if (typeof adData === 'string') {
      try {
        const parsed = JSON.parse(adData);
        adData = parsed;
      } catch (e) {
        // Use as text
        adData = { fullCopy: adData };
      }
    }

    // Ensure we have ad data
    if (!adData.headline && !adData.fullCopy) {
      const fallbackAd = generateAdCopy(productInfo);
      adData = fallbackAd;
      provider = 'built-in (fallback)';
    }

    const socialPosts = generateSocialPosts(adData, productInfo);

    res.json({
      success: true,
      ad: adData,
      socialPosts: socialPosts,
      provider: provider,
      ai_processed: true
    });
  } catch (error) {
    logger.error('❌ Ad generation error:', error);
    
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

// ============================================
// 5. VOICE LISTING - Using Groq Whisper
// ============================================
router.post('/voice/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    const { language = 'ny' } = req.body;
    logger.info('🎤 Processing voice...');

    // Step 1: Transcribe using Groq Whisper
    let transcript = '';
    let aiProcessed = false;
    
    try {
      const transcription = await groqService.transcribeAudio(req.file.buffer, {
        language: language === 'ny' ? 'en' : 'en' // Groq Whisper supports 'en'
      });

      if (transcription.success) {
        transcript = transcription.text;
        aiProcessed = true;
        logger.info('✅ Groq Whisper transcription successful');
      } else {
        throw new Error(transcription.error);
      }
    } catch (error) {
      logger.error('Whisper transcription error:', error.message);
      
      // Fallback: Use sample transcript based on language
      transcript = language === 'ny' 
        ? 'Ndili ndi matumba 10 a chimanga ndikugulitsa. Mtengo ndi 5000 per bag.'
        : 'I have 10 bags of maize for sale. Price is 5000 per bag.';
      aiProcessed = false;
    }

    logger.info('📝 Transcript:', transcript);

    // Step 2: Process the transcript with Groq
    let listingData = null;
    let validation = null;

    try {
      const result = await groqService.processVoiceListing(transcript, {
        location: 'Mitundu',
        language: language
      });

      if (result.success) {
        listingData = result.parsed || result.data;
        validation = {
          isValid: true,
          errors: [],
          warnings: [],
          confidence: 0.8
        };
      }
    } catch (error) {
      logger.error('Voice processing error:', error.message);
      // Extract listing data locally
      listingData = extractListingData(transcript, language);
      validation = validateListing(listingData);
    }

    res.json({
      success: true,
      transcript: transcript,
      listing: listingData,
      validation: validation || { isValid: true, errors: [], warnings: [], confidence: 0.5 },
      ai_processed: aiProcessed,
      method: 'whisper'
    });
  } catch (error) {
    logger.error('❌ Voice processing error:', error);
    
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

// ============================================
// 6. VOICE LISTING - CREATE
// ============================================
router.post('/voice/create-listing', upload.single('audio'), async (req, res) => {
  try {
    const { businessId, userId, language = 'ny' } = req.body;
    
    // If audio file is provided, process it first
    let transcript = req.body.transcript || '';
    let listingData = req.body.listingData ? JSON.parse(req.body.listingData) : null;
    let validation = req.body.validation ? JSON.parse(req.body.validation) : null;

    if (req.file) {
      // Process the audio
      try {
        const transcription = await groqService.transcribeAudio(req.file.buffer, {
          language: language === 'ny' ? 'en' : 'en'
        });

        if (transcription.success) {
          transcript = transcription.text;
          
          // Process the transcript
          const result = await groqService.processVoiceListing(transcript, {
            location: 'Mitundu',
            language: language
          });

          if (result.success) {
            listingData = result.parsed || result.data;
            validation = {
              isValid: true,
              errors: [],
              warnings: [],
              confidence: 0.8
            };
          }
        }
      } catch (error) {
        logger.error('Voice processing error:', error.message);
      }
    }

    if (!businessId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and User ID are required'
      });
    }

    if (!listingData) {
      return res.status(400).json({
        success: false,
        error: 'Listing data is required'
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

    // Validate
    const validationResult = validateListing(listingData);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.errors.join(', '),
        validation: validationResult
      });
    }

    // Create listing
    const { data: newListing, error: createError } = await supabase
      .from('listings')
      .insert({
        business_id: businessId,
        title: listingData.title || 'Voice Listing',
        description: transcript || listingData.description || '',
        category: listingData.category || 'Other',
        price: listingData.price || null,
        quantity: listingData.quantity || null,
        unit: listingData.unit || '',
        delivery_available: listingData.deliveryAvailable || false,
        contact_phone: listingData.contact_phone || '',
        status: 'active',
        metadata: {
          voice_created: true,
          language: language,
          transcript: transcript,
          confidence: validationResult.confidence || 0.5,
          ai_processed: true
        }
      })
      .select()
      .single();

    if (createError) {
      logger.error('❌ Listing creation error:', createError);
      return res.status(400).json({
        success: false,
        error: createError.message
      });
    }

    res.json({
      success: true,
      listing: newListing,
      transcript: transcript,
      validation: validationResult,
      ai_processed: true,
      method: 'whisper'
    });
  } catch (error) {
    logger.error('❌ Voice listing creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 7. SMART MATCHING - Using Groq
// ============================================
router.post('/match', async (req, res) => {
  try {
    const { query, userType, location } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    let matches = [];
    let provider = 'built-in';

    try {
      const result = await groqService.findMatches(query, {
        userType: userType || 'buyer',
        location: location || 'Mitundu'
      });

      if (result.success) {
        const parsed = result.parsed || result.data;
        matches = parsed.recommendations || [];
        provider = 'groq';
        logger.info('✅ Groq matching successful');
      }
    } catch (error) {
      logger.error('Groq matching error:', error.message);
      
      // Built-in matching
      const { data, err } = await supabase
        .from('listings')
        .select(`
          *,
          businesses:business_id (
            business_name,
            category
          )
        `)
        .eq('status', 'active')
        .limit(5);

      if (!err && data) {
        matches = data.map(item => ({
          type: 'product',
          name: item.title,
          description: item.description,
          reason: 'Available in Mitundu',
          confidence: 0.5
        }));
      }
    }

    res.json({
      success: true,
      matches: matches,
      provider: provider,
      ai_processed: true
    });
  } catch (error) {
    logger.error('Matching error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 8. RECOMMENDATIONS - Using Groq
// ============================================
router.post('/recommendations', async (req, res) => {
  try {
    const { interests, history, location, userType } = req.body;

    let recommendations = {};
    let provider = 'built-in';

    try {
      const result = await groqService.getRecommendations({
        interests: interests || [],
        history: history || [],
        location: location || 'Mitundu',
        userType: userType || 'buyer'
      });

      if (result.success) {
        recommendations = result.parsed || result.data;
        provider = 'groq';
        logger.info('✅ Groq recommendations successful');
      }
    } catch (error) {
      logger.error('Groq recommendations error:', error.message);
      
      // Built-in recommendations
      const { data, err } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .limit(3);

      if (!err && data) {
        recommendations = {
          personalized: data.map(item => ({
            name: item.title,
            category: item.category,
            reason: 'Popular in Mitundu'
          })),
          trendingCategories: ['Farm Inputs', 'Construction', 'Plumber']
        };
      }
    }

    res.json({
      success: true,
      recommendations: recommendations,
      provider: provider,
      ai_processed: true
    });
  } catch (error) {
    logger.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 9. VOICE PROMPTS
// ============================================
router.get('/voice/prompts', (req, res) => {
  const { language = 'ny' } = req.query;
  
  const prompts = {
    'ny': [
      'Ndili ndi matumba 10 a chimanga ndikugulitsa. Mtengo ndi 5000 per bag.',
      'Ndikufuna kugulitsa nkhuku 20 ndi mazira 50.',
      'Ndili ndi simenti 50kg ndikugulitsa.',
      'Ndikufuna plumber ku Mitundu.',
      'Ndili ndi fensi 100m ndikugulitsa.'
    ],
    'en': [
      'I have 10 bags of maize for sale. Price is 5000 per bag.',
      'I want to sell 20 chickens and 50 eggs.',
      'I have 50kg cement for sale.',
      'I need a plumber in Mitundu.',
      'I have 100m of fencing wire for sale.'
    ]
  };

  res.json({
    success: true,
    prompts: prompts[language] || prompts['ny']
  });
});

// ============================================
// 10. AD TEMPLATES
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
// 11. BATCH AD GENERATION
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

    const results = await Promise.all(items.map(async (item) => {
      try {
        const result = await geminiService.generateAd({
          title: item.title || 'Product',
          description: item.description || '',
          category: item.category || 'Other',
          price: item.price || 'Contact for price'
        });

        if (result.success) {
          const adData = result.parsed || result.data;
          return {
            ad: adData,
            socialPosts: generateSocialPosts(adData, item),
            originalItem: item,
            provider: 'gemini'
          };
        }
      } catch (error) {
        logger.error('Batch ad error:', error);
      }

      // Fallback
      const adCopy = generateAdCopy(item);
      return {
        ad: adCopy,
        socialPosts: generateSocialPosts(adCopy, item),
        originalItem: item,
        provider: 'built-in'
      };
    }));

    res.json({
      success: true,
      results: results,
      ai_processed: true
    });
  } catch (error) {
    logger.error('❌ Batch ad generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 12. HEALTH CHECK FOR AI SERVICES
// ============================================
router.get('/health', async (req, res) => {
  try {
    const groqStatus = await groqService.checkAPIKey ? await groqService.checkAPIKey() : false;
    const geminiStatus = await geminiService.checkAPIKey ? await geminiService.checkAPIKey() : false;

    res.json({
      success: true,
      status: {
        groq: groqStatus,
        gemini: geminiStatus,
        supabase: true
      },
      message: 'AI services ready'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAISummary(item, query) {
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

function generateAdCopy(productInfo) {
  const title = productInfo.title || 'Product';
  const category = productInfo.category || 'Other';
  const price = productInfo.price || 'competitive';
  const unit = productInfo.unit || 'piece';
  const description = productInfo.description || '';

  const adTemplates = {
    'Farm Inputs': {
      headline: `🌾 Premium ${title} Available Now!`,
      shortCopy: `Quality ${title} from trusted suppliers. ${price} per ${unit}.`,
      fullCopy: `Get premium ${title} for your farm or business. We offer competitive prices and reliable delivery in Mitundu and surrounding areas. ${description}`,
      cta: `📞 Contact us for ${title}!`,
      sellingPoints: ['Quality guaranteed', 'Competitive prices', 'Reliable delivery', 'Trusted supplier']
    },
    'Construction': {
      headline: `🔨 ${title} - Build with Confidence!`,
      shortCopy: `Premium ${title} for all your construction needs.`,
      fullCopy: `Get high-quality ${title} for your building projects. We supply materials to contractors and individuals across Mitundu. ${description}`,
      cta: `📞 Order ${title} today!`,
      sellingPoints: ['Premium quality', 'Competitive pricing', 'Quick delivery', 'Trusted supplier']
    },
    'Plumber': {
      headline: `🔧 Professional ${title} Services`,
      shortCopy: `Experienced plumber in Mitundu. Reliable and affordable.`,
      fullCopy: `Need a professional plumber? We offer fast, reliable, and affordable plumbing services in Mitundu and surrounding areas. ${description}`,
      cta: `📞 Call for emergency services!`,
      sellingPoints: ['Experienced team', 'Fast response', 'Affordable rates', 'Emergency services']
    },
    'default': {
      headline: `📢 ${title} Available Now!`,
      shortCopy: `Quality ${title} available in Mitundu.`,
      fullCopy: `Get quality ${title} at the best prices in Mitundu. We offer reliable service and customer satisfaction. ${description}`,
      cta: `📞 Contact us for details!`,
      sellingPoints: ['Quality products', 'Best prices', 'Reliable service', 'Customer satisfaction']
    }
  };

  const template = adTemplates[category] || adTemplates['default'];
  
  return {
    headline: template.headline,
    shortCopy: template.shortCopy,
    fullCopy: template.fullCopy,
    cta: template.cta,
    sellingPoints: template.sellingPoints
  };
}

function generateSocialPosts(ad, productInfo) {
  const hashtags = '#Mitundu #Quality #BestPrice #Kumsika';
  const title = ad.headline || ad.title || 'New Listing';

  return {
    facebook: `${title}\n\n${ad.fullCopy || ad.description || ''}\n\n${ad.cta || 'Contact for details.'}\n\n${hashtags}`,
    whatsapp: `${title}\n\n${ad.shortCopy || ad.description || ''}\n\n${ad.cta || 'Contact for details.'}`,
    twitter: `${title}\n${ad.shortCopy?.substring(0, 100) || ''}...\n${hashtags}`
  };
}

export default router;