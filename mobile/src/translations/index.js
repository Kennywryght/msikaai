// ============================================
// TRANSLATIONS
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
    back: 'Back',
    cancel: 'Cancel',
    
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
    editProfile: 'Edit Profile',
    pendingVerification: 'Pending Verification',
    verified: 'Verified',
    active: 'Active',
    inactive: 'Inactive',
    
    // Listings
    listing: 'Listing',
    listings: 'Listings',
    title: 'Title',
    price: 'Price',
    quantity: 'Quantity',
    unit: 'Unit',
    images: 'Images',
    status: 'Status',
    yourListings: 'Your Listings',
    addListingButton: '+ Add Listing',
    noListings: 'No listings yet. Click "Add Listing" to get started!',
    priceOnRequest: 'Price on request',
    negotiable: 'Negotiable',
    fixedPrice: 'Fixed Price',
    freeQuote: 'Free Quote',
    sold: 'Sold',
    featured: 'Featured',
    
    // Reviews
    reviews: 'Reviews',
    writeReview: 'Write Review',
    rating: 'Rating',
    comment: 'Comment',
    submitReview: 'Submit Review',
    noReviews: 'No reviews yet. Be the first to review!',
    stars: 'Stars',
    
    // Common
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
    createFirstListing: 'Click "Add Listing" to get started!',
    notFound: 'Not found',
    manageBusiness: 'Manage your business profile and listings.',
    registerBusinessPrompt: 'Register your business to get discovered by customers.',
    
    // Search
    searchPlaceholder: 'Search products or services...',
    searchResults: 'Found {count} results',
    filterByCategory: 'Filter by category',
    priceRange: 'Price range',
    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    applyFilters: 'Apply Filters',
    clearFilters: 'Clear',
    showFilters: 'Show Filters',
    hideFilters: 'Hide Filters',
    allCategories: 'All',
    searchProducts: 'Search for products and services in Mitundu',
    searchPrompt: 'Enter a search term above to get started',
    noResultsFound: 'No results found',
    tryAdjusting: 'Try adjusting your search or filters',
    
    // AI Features
    aiSearch: 'AI Search',
    voiceSearch: 'Voice Search',
    askAI: 'Ask AI Assistant',
    voiceListing: 'Voice Listing',
    speakNow: 'Speak now...',
    generatingAd: 'Generating ad...',
    aiAssistant: 'AI Assistant',
    
    // Location
    nearMe: 'Near Me',
    distance: '{distance}km away',
    useCurrentLocation: 'Use Current Location',
    locationRequired: 'Location access is required for this feature',
    findingLocation: 'Finding your location...',
    
    // Authentication
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signInToAccount: 'Sign in to your account',
    createNewAccount: 'Create a new account',
    
    // Business Registration
    selectCategory: 'Select category',
    hardware: 'Hardware',
    retail: 'Retail Shop',
    plumber: 'Plumber',
    electrician: 'Electrician',
    carpenter: 'Carpenter',
    mechanic: 'Mechanic',
    builder: 'Builder',
    tailor: 'Tailor',
    hairdresser: 'Hairdresser',
    farmInputs: 'Farm Inputs',
    restaurant: 'Restaurant',
    other: 'Other',
    
    // Listing Creation
    selectBusiness: 'Select a business',
    selectSubCategory: 'Select sub category',
    addProductService: 'Add a new product or service to your business',
    creating: 'Creating...',
    createListingButton: 'Create Listing',
    
    // Status Messages
    businessCreated: 'Business created successfully!',
    listingCreated: 'Listing created successfully!',
    reviewSubmitted: 'Review submitted successfully!',
    failedToCreate: 'Failed to create',
    pleaseTryAgain: 'Please try again.',
    permissionDenied: 'Permission denied. Please check your account permissions.'
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
    back: 'Bwererani',
    cancel: 'Lekani',
    
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
    editProfile: 'Konzani Mbiri',
    pendingVerification: 'Kuyembekezera Kutsimikizidwa',
    verified: 'Yotsimikizika',
    active: 'Yogwira',
    inactive: 'Yolephera',
    
    // Listings
    listing: 'Mndandanda',
    listings: 'Mindandanda',
    title: 'Mutu',
    price: 'Mtengo',
    quantity: 'Kuchuluka',
    unit: 'Chiyeso',
    images: 'Zithunzi',
    status: 'Mkhalidwe',
    yourListings: 'Mindandanda Yanu',
    addListingButton: '+ Onjezani Mndandanda',
    noListings: 'Palibe mindandanda. Dina "Add Listing" kuti muyambe!',
    priceOnRequest: 'Funsani Mtengo',
    negotiable: 'Zokambirana',
    fixedPrice: 'Mtengo Wokhazikika',
    freeQuote: 'Mtengo Waulere',
    sold: 'Yagulitsidwa',
    featured: 'Yodziwika',
    
    // Reviews
    reviews: 'Ndemanga',
    writeReview: 'Lembani Ndemanga',
    rating: 'Mavoti',
    comment: 'Ndemanga',
    submitReview: 'Tumizani Ndemanga',
    noReviews: 'Palibe ndemanga. Khalani oyamba kulemba!',
    stars: 'Nyenyezi',
    
    // Common
    save: 'Sungani',
    delete: 'Chotsani',
    edit: 'Konzani',
    view: 'Onani',
    loading: 'Kukonzekera...',
    error: 'Cholakwika',
    success: 'Zatheka',
    confirm: 'Tsimikizani',
    
    // Messages
    noResults: 'Palibe zopezeka',
    noBusiness: 'Simunalembeletsabe bizinesi',
    createFirstListing: 'Dina "Add Listing" kuti muyambe!',
    notFound: 'Sinapezeke',
    manageBusiness: 'Yang\'anani bizinesi yanu ndi mindandanda.',
    registerBusinessPrompt: 'Lembetsani bizinesi yanu kuti makasitomala akupezeni.',
    
    // Search
    searchPlaceholder: 'Fufuzani katundu kapena ntchito...',
    searchResults: 'Tapeza {count} zotsatira',
    filterByCategory: 'Sankhani gulu',
    priceRange: 'Mtengo',
    minPrice: 'Mtengo Wochepa',
    maxPrice: 'Mtengo Wokwera',
    applyFilters: 'Gwiritsani Ntchito',
    clearFilters: 'Chotsani',
    showFilters: 'Onani Zosefera',
    hideFilters: 'Bisani Zosefera',
    allCategories: 'Zonse',
    searchProducts: 'Fufuzani katundu kapena ntchito ku Mitundu',
    searchPrompt: 'Lowetsani mawu kuti muyambe',
    noResultsFound: 'Palibe zopezeka',
    tryAdjusting: 'Yesani kusintha zomwe mwafufuza',
    
    // AI Features
    aiSearch: 'Kufufuza kwa AI',
    voiceSearch: 'Kufufuza ndi Mawu',
    askAI: 'Funsani AI',
    voiceListing: 'Mndandanda wa Mawu',
    speakNow: 'Lankhulani tsopano...',
    generatingAd: 'Kukonzekera malonda...',
    aiAssistant: 'Mthandizi wa AI',
    
    // Location
    nearMe: 'Pafupi ndi Ine',
    distance: 'mtunda wa {distance}km',
    useCurrentLocation: 'Gwiritsani Ntchito Malo Anu',
    locationRequired: 'Malo akufunika pa ntchito iyi',
    findingLocation: 'Kufuna malo anu...',
    
    // Authentication
    email: 'Imelo',
    password: 'Chinsinsi',
    fullName: 'Dzina Lathunthu',
    phoneNumber: 'Nambala ya Foni',
    signIn: 'Lowani',
    signUp: 'Lembetsani',
    createAccount: 'Pangani Akaunti',
    alreadyHaveAccount: 'Muli ndi akaunti kale?',
    dontHaveAccount: 'Mulibe akaunti?',
    signInToAccount: 'Lowani mu akaunti yanu',
    createNewAccount: 'Pangani akaunti yatsopano',
    
    // Business Registration
    selectCategory: 'Sankhani gulu',
    hardware: 'Zomangamanga',
    retail: 'Malo Ogulitsira',
    plumber: 'Wokonza Mipope',
    electrician: 'Wamagetsi',
    carpenter: 'Wamati',
    mechanic: 'Wamagalimoto',
    builder: 'Womanga',
    tailor: 'Wosoka',
    hairdresser: 'Wometa',
    farmInputs: 'Zaulimi',
    restaurant: 'Malo Odyera',
    other: 'Zina',
    
    // Listing Creation
    selectBusiness: 'Sankhani bizinesi',
    selectSubCategory: 'Sankhani gulu laling\'ono',
    addProductService: 'Onjezani katundu kapena ntchito ku bizinesi yanu',
    creating: 'Kukonzekera...',
    createListingButton: 'Pangani Mndandanda',
    
    // Status Messages
    businessCreated: 'Bizinesi yapangidwa bwino!',
    listingCreated: 'Mndandanda wapangidwa bwino!',
    reviewSubmitted: 'Ndemanga yatumizidwa bwino!',
    failedToCreate: 'Kulephera kupanga',
    pleaseTryAgain: 'Chonde yesaninso.',
    permissionDenied: 'Mulibe chilolezo. Chonde onani akaunti yanu.'
  }
};

// ============================================
// TRANSLATION HELPER
// ============================================

export const getTranslation = (lang, key, params = {}) => {
  const langData = translations[lang] || translations.en;
  let text = langData[key] || key;
  
  // Replace params like {count}
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
};

export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'ny', name: 'Chichewa' }
  ];
};

export default translations;