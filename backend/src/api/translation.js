import { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// ============================================
// TRANSLATIONS DATA
// ============================================

const translations = {
  en: {
    // Navigation
    welcome: 'Welcome',
    search: 'Search',
    register: 'Register',
    login: 'Login',
    logout: 'Logout',
    dashboard: 'Dashboard',
    browse: 'Browse',
    addListing: '+ List',
    createListing: 'Create Listing',
    
    // Business
    business: 'Business',
    businesses: 'Businesses',
    registerBusiness: 'Register Your Business',
    businessName: 'Business Name',
    category: 'Category',
    description: 'Description',
    phone: 'Phone Number',
    address: 'Address',
    location: 'Location',
    
    // Listings
    listing: 'Listing',
    listings: 'Listings',
    title: 'Title',
    price: 'Price',
    quantity: 'Quantity',
    unit: 'Unit',
    images: 'Images',
    status: 'Status',
    
    // Common
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    
    // Messages
    noResults: 'No results found',
    noBusiness: 'You haven\'t registered a business yet',
    noListings: 'No listings yet',
    createFirstListing: 'Click "Add Listing" to get started!',
    
    // Search
    searchPlaceholder: 'Search products or services...',
    searchResults: 'Found {count} results',
    filterByCategory: 'Filter by category',
    priceRange: 'Price range',
    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    applyFilters: 'Apply Filters',
    clearFilters: 'Clear',
    
    // AI Features
    aiSearch: 'AI Search',
    voiceSearch: 'Voice Search',
    askAI: 'Ask AI Assistant',
    voiceListing: 'Voice Listing',
    speakNow: 'Speak now...',
    generatingAd: 'Generating ad...',
    
    // Location
    nearMe: 'Near Me',
    distance: '{distance}km away',
    useCurrentLocation: 'Use Current Location',
    locationRequired: 'Location access is required for this feature'
  },
  ny: {
    // Navigation
    welcome: 'Takulandilani',
    search: 'Fufuzani',
    register: 'Lembetsani',
    login: 'Lowani',
    logout: 'Tulukani',
    dashboard: 'Dashboard',
    browse: 'Onani',
    addListing: '+ Mndandanda',
    createListing: 'Pangani Mndandanda',
    
    // Business
    business: 'Bizinesi',
    businesses: 'Mabizinesi',
    registerBusiness: 'Lembetsani Bizinesi Yanu',
    businessName: 'Dzina la Bizinesi',
    category: 'Gulu',
    description: 'Mafotokozedwe',
    phone: 'Nambala ya Foni',
    address: 'Adilesi',
    location: 'Malo',
    
    // Listings
    listing: 'Mndandanda',
    listings: 'Mindandanda',
    title: 'Mutu',
    price: 'Mtengo',
    quantity: 'Kuchuluka',
    unit: 'Chiyeso',
    images: 'Zithunzi',
    status: 'Mkhalidwe',
    
    // Common
    cancel: 'Lekani',
    save: 'Sungani',
    delete: 'Chotsani',
    edit: 'Konenani',
    view: 'Onani',
    loading: 'Kukonzekera...',
    error: 'Cholakwika',
    success: 'Zatheka',
    confirm: 'Tsimikizani',
    
    // Messages
    noResults: 'Palibe zopezeka',
    noBusiness: 'Simunalembeletsabe bizinesi',
    noListings: 'Palibe mindandanda',
    createFirstListing: 'Dina "Add Listing" kuti muyambe!',
    
    // Search
    searchPlaceholder: 'Fufuzani katundu kapena ntchito...',
    searchResults: 'Tapeza {count} zotsatira',
    filterByCategory: 'Sankhani gulu',
    priceRange: 'Mtengo',
    minPrice: 'Mtengo Wochepa',
    maxPrice: 'Mtengo Wokwera',
    applyFilters: 'Gwiritsani Ntchito',
    clearFilters: 'Chotsani',
    
    // AI Features
    aiSearch: 'Kufufuza kwa AI',
    voiceSearch: 'Kufufuza ndi Mawu',
    askAI: 'Funsani AI',
    voiceListing: 'Mndandanda wa Mawu',
    speakNow: 'Lankhulani tsopano...',
    generatingAd: 'Kukonzekera malonda...',
    
    // Location
    nearMe: 'Pafupi ndi Ine',
    distance: 'mtunda wa {distance}km',
    useCurrentLocation: 'Gwiritsani Ntchito Malo Anu',
    locationRequired: 'Malo akufunika pa ntchito iyi'
  }
};

// ============================================
// GET TRANSLATIONS
// ============================================
router.get('/:lang', (req, res) => {
  try {
    const { lang } = req.params;
    
    // Default to English if language not found
    const translationData = translations[lang] || translations.en;
    
    return res.json({
      success: true,
      language: lang,
      translations: translationData
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET SUPPORTED LANGUAGES
// ============================================
router.get('/', (req, res) => {
  return res.json({
    success: true,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'ny', name: 'Chichewa' }
    ],
    default: 'en'
  });
});

export default router;