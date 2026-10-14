// backend/src/services/bilingualSearch.js
//
// Understands marketplace search sentences in Chichewa, English, or a mix:
//   "Ndikufuna chimanga cha mtengo wotsika"   → maize, cheapest first
//   "I need a plumber pafupi ndi Mitundu"      → plumber, location Mitundu
//   "nsapato za akazi pansi pa 5000"           → shoes + women, max MK5,000
//
// parseQuery() is pure (no I/O): it strips filler words in both languages,
// maps words/phrases to bilingual "concepts" (each concept = all the words a
// listing might use for that thing, in either language), and extracts price,
// delivery, sort and location intent. dbService.searchListings turns the
// concepts into a ranked query. No AI key is required; when one is configured
// the route can add AI-translated terms for words the dictionary doesn't know.

// ------------------------------------------------------------
// Lexicon: concept → English + Chichewa forms (+ optional category hint)
// Terms are what we look for in listings, so include the spellings sellers
// actually write. Keep entries lowercase.
// ------------------------------------------------------------
const LEXICON = [
  // Grains, staples & produce
  { id: 'maize', en: ['maize', 'corn'], ny: ['chimanga'], cat: 'Food & Groceries' },
  { id: 'flour', en: ['flour', 'maize flour', 'mgaiwa'], ny: ['ufa', 'mgaiwa'], cat: 'Food & Groceries' },
  { id: 'rice', en: ['rice'], ny: ['mpunga'], cat: 'Food & Groceries' },
  { id: 'beans', en: ['beans'], ny: ['nyemba'], cat: 'Food & Groceries' },
  { id: 'groundnuts', en: ['groundnuts', 'peanuts', 'g-nuts'], ny: ['mtedza'], cat: 'Food & Groceries' },
  { id: 'soya', en: ['soya', 'soy'], ny: ['soya'], cat: 'Food & Groceries' },
  { id: 'tomatoes', en: ['tomatoes'], ny: ['matimati', 'tomato'], cat: 'Food & Groceries' },
  { id: 'onions', en: ['onions'], ny: ['anyezi'], cat: 'Food & Groceries' },
  { id: 'cabbage', en: ['cabbage'], ny: ['kabichi', 'kabeji'], cat: 'Food & Groceries' },
  { id: 'vegetables', en: ['vegetables', 'greens', 'veggies', 'rape'], ny: ['ndiwo', 'masamba', 'mpiru'], cat: 'Food & Groceries' },
  { id: 'potatoes', en: ['potatoes', 'sweet potatoes', 'irish potatoes'], ny: ['mbatata', 'kachewere'], cat: 'Food & Groceries' },
  { id: 'cassava', en: ['cassava'], ny: ['chinangwa'], cat: 'Food & Groceries' },
  { id: 'bananas', en: ['bananas'], ny: ['nthochi'], cat: 'Food & Groceries' },
  { id: 'mangoes', en: ['mangoes'], ny: ['mango'], cat: 'Food & Groceries' },
  { id: 'oranges', en: ['oranges'], ny: ['malalanje'], cat: 'Food & Groceries' },
  { id: 'pumpkin', en: ['pumpkin'], ny: ['dzungu', 'maungu'], cat: 'Food & Groceries' },
  { id: 'fruit', en: ['fruit', 'fruits'], ny: ['zipatso', 'chipatso'], cat: 'Food & Groceries' },
  { id: 'eggs', en: ['eggs'], ny: ['mazira', 'dzira'], cat: 'Food & Groceries' },
  { id: 'milk', en: ['milk', 'dairy'], ny: ['mkaka'], cat: 'Food & Groceries' },
  { id: 'meat', en: ['meat'], ny: ['nyama'], cat: 'Food & Groceries' },
  { id: 'beef', en: ['beef', 'cow', 'cattle'], ny: ["ng'ombe", 'ngombe'], cat: 'Food & Groceries' },
  { id: 'goat', en: ['goat', 'goats'], ny: ['mbuzi'], cat: 'Food & Groceries' },
  { id: 'pork', en: ['pork', 'pig', 'pigs'], ny: ['nkhumba'], cat: 'Food & Groceries' },
  { id: 'chicken', en: ['chicken', 'chickens', 'poultry', 'broiler'], ny: ['nkhuku'], cat: 'Food & Groceries' },
  { id: 'fish', en: ['fish', 'chambo', 'usipa', 'kapenta'], ny: ['nsomba', 'chambo', 'usipa', 'utaka'], cat: 'Food & Groceries' },
  { id: 'salt', en: ['salt'], ny: ['mchere'], cat: 'Food & Groceries' },
  { id: 'sugar', en: ['sugar'], ny: ['shuga'], cat: 'Food & Groceries' },
  { id: 'oil', en: ['cooking oil', 'oil'], ny: ['mafuta'], cat: 'Food & Groceries' },
  { id: 'bread', en: ['bread'], ny: ['buledi', 'mkate'], cat: 'Food & Groceries' },
  { id: 'tea', en: ['tea'], ny: ['tiyi'], cat: 'Food & Groceries' },
  { id: 'food', en: ['food', 'groceries', 'grocery'], ny: ['chakudya', 'zakudya'], cat: 'Food & Groceries' },
  { id: 'tobacco', en: ['tobacco'], ny: ['fodya'], cat: 'Farm Inputs' },
  { id: 'fertilizer', en: ['fertilizer', 'fertiliser', 'urea'], ny: ['feteleza', 'fetereza'], cat: 'Farm Inputs' },
  { id: 'seeds', en: ['seeds', 'seed'], ny: ['mbewu', 'njere'], cat: 'Farm Inputs' },
  { id: 'hoe', en: ['hoe'], ny: ['khasu', 'makasu'], cat: 'Farm Inputs' },

  // Clothing (+ who it's for)
  { id: 'clothes', en: ['clothes', 'clothing'], ny: ['zovala', 'chovala', 'malaya'], cat: 'Clothing & Fashion' },
  { id: 'shoes', en: ['shoes', 'sandals', 'sneakers'], ny: ['nsapato', 'masapato'], cat: 'Clothing & Fashion' },
  { id: 'chitenje', en: ['chitenje', 'fabric', 'wrapper', 'cloth'], ny: ['chitenje', 'zitenje', 'nsalu'], cat: 'Clothing & Fashion' },
  { id: 'dress', en: ['dress', 'dresses'], ny: ['diresi'], cat: 'Clothing & Fashion' },
  { id: 'trousers', en: ['trousers', 'pants', 'jeans'], ny: ['buluku', 'mabuluku'], cat: 'Clothing & Fashion' },
  { id: 'shirt', en: ['shirt', 'shirts', 't-shirt'], ny: ['malaya', 'sheti'], cat: 'Clothing & Fashion' },
  { id: 'women', en: ['women', 'ladies', 'female', 'womens'], ny: ['akazi', 'azimayi', 'achikazi', 'zachikazi', 'amayi'] },
  { id: 'men', en: ['men', 'mens', 'gents', 'male'], ny: ['amuna', 'achimuna', 'zachimuna', 'abambo'] },
  { id: 'children', en: ['children', 'kids', 'baby', 'babies'], ny: ['ana', 'mwana', 'zaana', 'makanda'] },

  // Household, electronics, transport
  { id: 'phone', en: ['phone', 'phones', 'mobile', 'smartphone'], ny: ['foni', 'lamya'], cat: 'Electronics' },
  { id: 'radio', en: ['radio'], ny: ['wailesi'], cat: 'Electronics' },
  { id: 'tv', en: ['tv', 'television'], ny: ['tivi', 'kanema'], cat: 'Electronics' },
  { id: 'solar', en: ['solar', 'solar panel', 'battery'], ny: ['sola', 'batire'], cat: 'Electronics' },
  { id: 'chair', en: ['chair', 'chairs'], ny: ['mpando', 'mipando'], cat: 'Products' },
  { id: 'table', en: ['table', 'tables'], ny: ['tebulo', 'gome'], cat: 'Products' },
  { id: 'bed', en: ['bed', 'beds', 'mattress'], ny: ['bedi', 'matiresi'], cat: 'Products' },
  { id: 'pots', en: ['pot', 'pots', 'cooking pot'], ny: ['mphika', 'miphika', 'poto'], cat: 'Products' },
  { id: 'plates', en: ['plates', 'dishes'], ny: ['mbale'], cat: 'Products' },
  { id: 'charcoal', en: ['charcoal'], ny: ['makala'], cat: 'Products' },
  { id: 'firewood', en: ['firewood', 'wood'], ny: ['nkhuni'], cat: 'Products' },
  { id: 'bicycle', en: ['bicycle', 'bike'], ny: ['njinga'], cat: 'Vehicles & Parts' },
  { id: 'motorbike', en: ['motorbike', 'motorcycle'], ny: ['njinga yamoto', 'njinga ya moto'], cat: 'Vehicles & Parts' },
  { id: 'car', en: ['car', 'cars', 'vehicle'], ny: ['galimoto', 'magalimoto'], cat: 'Vehicles & Parts' },

  // Building & hardware
  { id: 'cement', en: ['cement'], ny: ['simenti', 'saimenti'], cat: 'Construction Materials' },
  { id: 'bricks', en: ['bricks', 'blocks'], ny: ['njerwa'], cat: 'Construction Materials' },
  { id: 'ironsheets', en: ['iron sheets', 'roofing sheets', 'roofing'], ny: ['malata'], cat: 'Construction Materials' },
  { id: 'timber', en: ['timber', 'planks'], ny: ['matabwa', 'thabwa'], cat: 'Construction Materials' },
  { id: 'nails', en: ['nails'], ny: ['misomali', 'msomali'], cat: 'Construction Materials' },
  { id: 'paint', en: ['paint'], ny: ['penti'], cat: 'Construction Materials' },
  { id: 'door', en: ['door', 'doors'], ny: ['chitseko', 'zitseko'], cat: 'Construction Materials' },
  { id: 'window', en: ['window', 'windows'], ny: ['windo', 'zenera', 'mawindo'], cat: 'Construction Materials' },
  { id: 'tools', en: ['tools', 'hammer', 'spanner'], ny: ['zida', 'nyundo'], cat: 'Construction Materials' },

  // Services
  { id: 'plumber', en: ['plumber', 'plumbing', 'pipes', 'pipe'], ny: ['mipope', 'mapaipi', 'wokonza mipope'], cat: 'Services', service: true },
  { id: 'electrician', en: ['electrician', 'electrical', 'wiring', 'electricity'], ny: ['magetsi', 'wamagetsi', 'wokonza magetsi'], cat: 'Services', service: true },
  { id: 'carpenter', en: ['carpenter', 'carpentry', 'furniture'], ny: ['kalipentala', 'mmisiri wamatabwa', 'mipando'], cat: 'Services', service: true },
  { id: 'tailor', en: ['tailor', 'tailoring', 'sewing'], ny: ['telala', 'wosoka', 'osoka', 'kusoka'], cat: 'Services', service: true },
  { id: 'sewingmachine', en: ['sewing machine'], ny: ['makina osokera', 'makina osoka'], cat: 'Services' },
  { id: 'hair', en: ['hair', 'salon', 'barber', 'haircut', 'braids'], ny: ['tsitsi', 'kumeta', 'kuluka', 'saluni', 'ometa'], cat: 'Services', service: true },
  { id: 'mechanic', en: ['mechanic', 'garage', 'car repair'], ny: ['makanika', 'wokonza galimoto'], cat: 'Services', service: true },
  { id: 'repair', en: ['repair', 'repairs', 'fix', 'fixing'], ny: ['kukonza', 'wokonza', 'okonza'], cat: 'Services', service: true },
  { id: 'builder', en: ['builder', 'construction', 'building', 'mason'], ny: ['womanga', 'omanga', 'kumanga', 'zomangamanga'], cat: 'Services', service: true },
  { id: 'transport', en: ['transport', 'taxi', 'minibus', 'kabaza'], ny: ['mayendedwe', 'kabaza', 'kukwera'], cat: 'Services', service: true },
  { id: 'cleaning', en: ['cleaning', 'cleaner'], ny: ['kuyeretsa', 'kusesa', 'oyeretsa'], cat: 'Services', service: true },
  { id: 'laundry', en: ['laundry', 'washing'], ny: ['kuchapa', 'ochapa'], cat: 'Services', service: true },
  { id: 'tutor', en: ['tutor', 'teacher', 'lessons', 'tuition'], ny: ['mphunzitsi', 'maphunziro'], cat: 'Services', service: true },
  { id: 'catering', en: ['catering', 'cook', 'caterer'], ny: ['ophika', 'kuphika'], cat: 'Services', service: true },
  { id: 'phonerepair', en: ['phone repair'], ny: ['kukonza foni', 'wokonza foni'], cat: 'Services', service: true },
  { id: 'welder', en: ['welder', 'welding'], ny: ['wowotcherera', 'kuwotcherera', 'owotcherera'], cat: 'Services', service: true },
  { id: 'driver', en: ['driver', 'drivers'], ny: ['dalaivala', 'woyendetsa', 'oyendetsa'], cat: 'Services', service: true },
  { id: 'guard', en: ['guard', 'security guard', 'watchman'], ny: ['mlonda', 'alonda'], cat: 'Services', service: true },
  { id: 'househelp', en: ['maid', 'house help', 'housemaid', 'nanny'], ny: ['wantchito', 'antchito', 'wosamalira ana'], cat: 'Services', service: true },
  { id: 'jobs', en: ['job', 'jobs', 'vacancy', 'employment'], ny: ['ntchito', 'ganyu'], cat: 'Services' },
  { id: 'grainmill', en: ['maize mill', 'grinding mill', 'hammer mill', 'milling'], ny: ['chigayo', 'zigayo', 'kugaya'], cat: 'Services', service: true },
  { id: 'shoerepair', en: ['shoe repair', 'cobbler'], ny: ['wokonza nsapato', 'kukonza nsapato'], cat: 'Services', service: true },
  { id: 'maths', en: ['maths', 'mathematics', 'math'], ny: ['masamu'], cat: 'Services', service: true },

  // More food, farming & livestock
  { id: 'chicks', en: ['chicks', 'day old chicks', 'baby chickens'], ny: ['ana a nkhuku', 'ana ankhuku', 'tiana ta nkhuku', 'anapiye'], cat: 'Farm Inputs' },
  { id: 'livestock', en: ['livestock', 'animals'], ny: ['ziweto', 'chiweto'], cat: 'Farm Inputs' },
  { id: 'sheep', en: ['sheep'], ny: ['nkhosa'], cat: 'Farm Inputs' },
  { id: 'ducks', en: ['ducks', 'duck'], ny: ['abakha', 'bakha'], cat: 'Farm Inputs' },
  { id: 'rabbits', en: ['rabbits', 'rabbit'], ny: ['akalulu', 'kalulu'], cat: 'Farm Inputs' },
  { id: 'guineafowl', en: ['guinea fowl'], ny: ['nkhanga'], cat: 'Farm Inputs' },
  { id: 'feed', en: ['animal feed', 'feed', 'bran', 'chicken feed'], ny: ['madeya', 'chakudya cha ziweto', 'chakudya cha nkhuku'], cat: 'Farm Inputs' },
  { id: 'pesticide', en: ['pesticide', 'pesticides', 'insecticide', 'chemicals'], ny: ['mankhwala opha tizilombo', 'mankhwala a mbewu'], cat: 'Farm Inputs' },
  { id: 'peas', en: ['pigeon peas', 'peas', 'cowpeas'], ny: ['nandolo', 'khobwe'], cat: 'Food & Groceries' },
  { id: 'millet', en: ['millet', 'sorghum'], ny: ['mapira', 'mawere', 'mchewere'], cat: 'Food & Groceries' },
  { id: 'okra', en: ['okra'], ny: ['therere'], cat: 'Food & Groceries' },
  { id: 'pumpkinleaves', en: ['pumpkin leaves'], ny: ['nkhwani'], cat: 'Food & Groceries' },
  { id: 'sugarcane', en: ['sugar cane', 'sugarcane'], ny: ['nzimbe'], cat: 'Food & Groceries' },
  { id: 'honey', en: ['honey'], ny: ['uchi'], cat: 'Food & Groceries' },
  { id: 'driedfish', en: ['dried fish', 'dry fish'], ny: ['nsomba zouma', 'nsomba youma'], cat: 'Food & Groceries' },
  { id: 'nsima', en: ['nsima', 'lunch', 'meals', 'restaurant'], ny: ['nsima', 'chakudya chamasana', 'chakudya cha masana', 'malo odyera'], cat: 'Food & Groceries' },
  { id: 'drinks', en: ['drinks', 'soft drinks', 'soda', 'juice'], ny: ['zakumwa', 'chakumwa', 'thobwa', 'sobo'], cat: 'Food & Groceries' },

  // Household & personal
  { id: 'soap', en: ['soap', 'detergent', 'washing powder'], ny: ['sopo'], cat: 'Products' },
  { id: 'blanket', en: ['blanket', 'blankets'], ny: ['bulangete', 'bulangeti', 'mabulangete'], cat: 'Products' },
  { id: 'mosquitonet', en: ['mosquito net', 'mosquito nets', 'net'], ny: ['neti', 'masikito', 'neti ya udzudzu'], cat: 'Products' },
  { id: 'bucket', en: ['bucket', 'buckets', 'basin'], ny: ['chidebe', 'zidebe', 'ndowa', 'beseni'], cat: 'Products' },
  { id: 'kitchen', en: ['kitchen', 'kitchenware', 'utensils', 'cooking utensils'], ny: ['khitchini', 'ziwiya', 'zipangizo za kukhitchini'], cat: 'Products' },
  { id: 'medicine', en: ['medicine', 'medicines', 'pharmacy', 'drugs'], ny: ['mankhwala'], cat: 'Products' },
  { id: 'cosmetics', en: ['cosmetics', 'lotion', 'perfume', 'makeup'], ny: ['mafuta odzola', 'zodzola'], cat: 'Products' },
  { id: 'bag', en: ['handbag', 'backpack', 'school bag'], ny: ['chikwama', 'zikwama'], cat: 'Clothing & Fashion' },
  { id: 'uniform', en: ['uniform', 'school uniform'], ny: ['yunifolomu'], cat: 'Clothing & Fashion' },
  { id: 'wedding', en: ['wedding', 'bridal', 'wedding dress'], ny: ['ukwati', 'chinkhoswe', 'diresi laukwati'], cat: 'Clothing & Fashion' },

  // Electronics & energy
  { id: 'laptop', en: ['laptop', 'computer', 'laptops'], ny: ['kompyuta', 'laputopu', 'makompyuta'], cat: 'Electronics' },
  { id: 'charger', en: ['charger', 'chargers', 'cable'], ny: ['chaja', 'macharger'], cat: 'Electronics' },
  { id: 'fuel', en: ['fuel', 'petrol', 'diesel', 'paraffin'], ny: ['petulo', 'dizilo', 'palafini', 'mafuta a galimoto', 'mafuta agalimoto'], cat: 'Vehicles & Parts' },
  { id: 'spareparts', en: ['spare parts', 'spares', 'tyres', 'tires'], ny: ['zipangizo za galimoto', 'matayala', 'tayala'], cat: 'Vehicles & Parts' },

  // Property & accommodation
  { id: 'house', en: ['house', 'houses', 'home'], ny: ['nyumba', 'manyumba'], cat: 'Other' },
  { id: 'rent', en: ['rent', 'rental', 'for rent', 'to let'], ny: ['yobwereka', 'kubwereka', 'yolipira', 'lendi', 'renti'], cat: 'Other' },
  { id: 'room', en: ['room', 'rooms'], ny: ['chipinda', 'zipinda'], cat: 'Other' },
  { id: 'lodge', en: ['lodge', 'accommodation', 'guest house', 'guesthouse', 'hostel'], ny: ['malo ogona', 'logde', 'gesthausi'], cat: 'Services' },
  { id: 'land', en: ['land', 'plot', 'plots', 'farm land'], ny: ['munda', 'minda', 'puloti', 'malo omangapo'], cat: 'Other' },
  { id: 'water', en: ['water', 'borehole', 'water tank', 'tank'], ny: ['madzi', 'chitsime', 'thanki'], cat: 'Products' },
];

// Word forms that should map onto an existing concept (filled in below the
// lexicon so the main table stays readable).
const EXTRA_FORMS = {
  phone: ['samsung', 'tecno', 'itel', 'iphone', 'infinix', 'nokia', 'huawei'],
  oil: ['mafuta ophikira', 'mafuta ophikila'],
  tools: ['zipangizo', 'chipangizo'],
  tutor: ['ophunzitsa', 'wophunzitsa', 'aphunzitsi', 'mphunzitsi'],
  water: ['madzi akumwa'],
  plumber: ['vuto la madzi', 'mipope ya madzi'],
  hair: ['wondimetera', 'ondimetera', 'kumetera', 'ometera', 'wometa', 'wokonza tsitsi'],
};
for (const [id, forms] of Object.entries(EXTRA_FORMS)) {
  const c = LEXICON.find((x) => x.id === id);
  if (c) c.ny.push(...forms.filter((f) => !c.ny.includes(f)));
}

// Filler words that carry no product meaning.
const STOPWORDS_NY = new Set([
  'ndikufuna', 'ndifuna', 'ndikufunafuna', 'tikufuna', 'mukufuna', 'akufuna', 'ndikusaka', 'ndikusakasaka',
  'ndikuyangana', 'ndikuyang\'ana', 'kodi', 'pali', 'alipo', 'ilipo', 'zilipo', 'ali', 'ndi', 'ndipo',
  'ine', 'ife', 'inu', 'chonde', 'za', 'ya', 'wa', 'la', 'cha', 'zake', 'ku', 'pa', 'mu', 'kwa', 'kwanu',
  'zina', 'ena', 'iyi', 'ichi', 'izi', 'uyu', 'apa', 'apo', 'bwanji', 'kuti', 'komwe', 'kuli', 'kuno',
  'ndani', 'chiyani', 'bwino', 'zabwino', 'ndiye', 'koma', 'ndithu', 'ngati', 'zambiri', 'wina',
  'aliyense', 'kugula', 'ndigule', 'kugulitsa', 'ogulitsa', 'wogulitsa', 'akugulitsa', 'amene',
  'malo', 'zogulitsa', 'katundu', 'muli', 'mungandipezere', 'mungathe', 'ndingapeze', 'ndipeze',
  'yemwe', 'omwe', 'zomwe', 'chomwe', 'mtengo', 'ndalama', 'lero', 'msanga', 'tsopano',
  'yatsopano', 'zatsopano', 'chatsopano', 'watsopano', 'latsopano',
  // people, pronouns & possessives
  'munthu', 'anthu', 'winawake', 'wina', 'ena', 'enanso', 'iwo', 'iye',
  'yanga', 'wanga', 'zanga', 'changa', 'langa', 'mwanga', 'kwanga', 'panga', 'yake', 'wake', 'chake',
  'yako', 'wako', 'zako', 'yathu', 'wathu', 'zathu', 'chathu', 'yanu', 'wanu', 'zanu', 'chanu',
  'amene', 'yemwe', 'omwe', 'zimene', 'zomwe', 'chimene', 'komwe', 'pomwe', 'momwe',
  // question / helper words
  'angati', 'zingati', 'zingati', 'chingati', 'ingati', 'kuti', 'liti', 'bwanji', 'nanga', 'kapena',
  'ndili', 'tili', 'muli', 'ali', 'ndiri', 'ndikupempha', 'pempho', 'thandizo', 'ndithandizeni',
  'chabwino', 'yabwino', 'wabwino', 'labwino', 'zabwinozabwino', 'odalirika', 'wodalirika',
  'odziwa', 'wodziwa', 'akatswiri', 'katswiri', 'mwachangu', 'mwamsanga', 'pompano', 'chifukwa',
  'vuto', 'mavuto', 'nawo', 'nazo', 'nacho', 'nayo', 'naye', 'basi', 'chonchi', 'choncho',
  // numbers & units (quantities aren't what to search for)
  'modzi', 'mmodzi', 'imodzi', 'chimodzi', 'limodzi', 'ziwiri', 'awiri', 'iwiri', 'ziwiri',
  'zitatu', 'atatu', 'itatu', 'zinayi', 'anayi', 'zisanu', 'asanu', 'khumi', 'makumi', 'zana', 'chikwi', 'zikwi',
  'matumba', 'thumba', 'makilogalamu', 'kilogalamu', 'makilo', 'kilo', 'malita', 'lita', 'malitala',
  'yogulitsa', 'chogulitsa', 'logulitsa', 'zinthu', 'chinthu', 'zamoyo', 'wamoyo', 'yamoyo',
  // time
  'mawa', 'masana', 'madzulo', 'mmawa', 'usiku', 'sabata', 'mwezi',
]);

// "want / need / find / buy / sell" verb forms in any person or tense:
// ndimafuna, ndinkafuna, ndikusowa, mukundipezera, tikugula, angandigulitse …
const NY_FILLER_VERB = /^(?:ndi|ti|mu|a|u|ndima|ndinka|ndika|tika|muka)?(?:ku|ma|na|nka|dza|nga|ka|zi)?(?:ndi|ti|mu|wa|ku)?(?:funa|funafuna|funika|sowa|sowek|saka|sakasaka|pez|pezer|pezek|gul|gulits|yang.?an|thandiz|tumiz|bweret)[a-z]*$/;

// Chichewa prefixes that sit in front of a noun: locatives (mnyumba,
// kukhitchini), concords (yamagetsi, zachimanga), relatives (yotsika, zouma).
const NY_PREFIXES = ['kwa', 'cha', 'zo', 'yo', 'wo', 'cho', 'lo', 'ko', 'po', 'mo', 'za', 'ya', 'wa', 'la',
  'ka', 'ma', 'mu', 'ku', 'pa', 'ta', 'ti', 'zi', 'mi', 'o', 'a', 'm'];
// Enclitics: "nso" (also), "tu"/"di" (emphasis)
const NY_SUFFIXES = ['nso', 'tu', 'di'];
const STOPWORDS_EN = new Set([
  'i', 'im', 'me', 'my', 'we', 'you', 'need', 'needs', 'want', 'wants', 'looking', 'look', 'search',
  'searching', 'find', 'for', 'a', 'an', 'the', 'some', 'any', 'to', 'buy', 'buying', 'sell', 'selling',
  'seller', 'please', 'where', 'can', 'could', 'get', 'is', 'are', 'there', 'who', 'which', 'what', 'in',
  'at', 'on', 'of', 'and', 'or', 'with', 'good', 'best', 'someone', 'somebody', 'anyone', 'service',
  'services', 'shop', 'store', 'available', 'today', 'now', 'urgent', 'urgently', 'price', 'prices',
  'from', 'that', 'this', 'it', 'do', 'does', 'have', 'has', 'sells', 'offer', 'offers', 'near', 'nearby',
  'around', 'like', 'just', 'very', 'really', 'also', 'mk', 'kwacha', 'per', 'each', 'new', 'brand',
  'person', 'people', 'guy', 'guys', 'help', 'hire', 'someone', 'my', 'our', 'your', 'how', 'much', 'many',
  'bags', 'bag', 'kg', 'kgs', 'litres', 'liters', 'pieces', 'pcs', 'one', 'two', 'three', 'four', 'five', 'ten',
]);

// Intent phrases (matched before tokenizing; longest first).
const CHEAP_PHRASES = ['mtengo wotsika', 'otsika mtengo', 'wotsika mtengo', 'zotsika mtengo', 'yotsika mtengo', 'chotsika mtengo', 'lotsika mtengo',
  'mtengo otsika', 'mtengo wabwino', 'zotchipa', 'yotchipa', 'wotchipa', 'chotchipa', 'lotchipa', 'zotsika', 'yotsika', 'chotsika', 'wotsika', 'lotsika',
  'cheapest', 'cheap', 'affordable', 'low price', 'lowest price', 'budget'];
const DELIVERY_PHRASES = ['with delivery', 'home delivery', 'delivery', 'deliver', 'kubweretsa', 'kubweretsera', 'kutumiza', 'adzabweretse',
  'kundibweretsera', 'abweretse', 'kubweretsa kunyumba', 'atumize'];
const MAX_PRICE_MARKERS = ['less than', 'under', 'below', 'up to', 'max', 'maximum', 'not more than',
  'pansi pa', 'osapitirira', 'zosaposa', 'mpaka', 'osaposa', 'zochepera',
  'zosapitirira', 'yosapitirira', 'yosaposa', 'chosaposa', 'zosaposera'];
const MIN_PRICE_MARKERS = ['more than', 'above', 'over', 'at least', 'minimum', 'kuposa', 'kupitirira', 'zoposa'];
const LOCATION_MARKERS = ['pafupi ndi', 'near', 'around', 'in', 'at', 'ku', 'kwa'];

// ------------------------------------------------------------
// Normalization helpers
// ------------------------------------------------------------
const stripDiacritics = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
// Apostrophes are dropped for matching keys (ng'ombe → ngombe).
export const normKey = (s) =>
  stripDiacritics(String(s || '').toLowerCase())
    .replace(/(\d),(?=\d{3}(?!\d))/g, '$1') // thousands separators: 2,500 → 2500
    .replace(/[’'`]/g, '')
    .replace(/[^\p{L}\p{N}\s.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// English plural → stem, so 'tomato' finds both "tomato" and "tomatoes".
const stem = (t) => {
  if (t.length <= 3 || /\s/.test(t)) return t;
  if (t.endsWith('oes') && t.length > 5) return t.slice(0, -2); // tomatoes → tomato (but shoes → shoe)
  if (t.endsWith('ies')) return `${t.slice(0, -3)}y`;
  if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
};

// key (normalized word or phrase) → concept
const KEY_TO_CONCEPT = new Map();
const NY_KEYS = new Set();
const EN_KEYS = new Set();
for (const c of LEXICON) {
  for (const w of c.en) {
    for (const k of new Set([normKey(w), stem(normKey(w))])) {
      if (!KEY_TO_CONCEPT.has(k)) KEY_TO_CONCEPT.set(k, c);
      EN_KEYS.add(k);
    }
  }
  for (const w of c.ny) {
    const k = normKey(w);
    if (!KEY_TO_CONCEPT.has(k)) KEY_TO_CONCEPT.set(k, c);
    NY_KEYS.add(k);
  }
}
const MULTIWORD_KEYS = [...KEY_TO_CONCEPT.keys()].filter((k) => k.includes(' ')).sort((a, b) => b.length - a.length);
const SINGLE_KEYS = [...KEY_TO_CONCEPT.keys()].filter((k) => !k.includes(' ') && k.length >= 4);
const PREFIXES_LONGEST_FIRST = [...NY_PREFIXES].sort((a, b) => b.length - a.length);

/**
 * Peel Chichewa prefixes (up to two, e.g. "kwamagetsi" → kwa + magetsi,
 * "mnyumba" → m + nyumba) and enclitics ("chimanganso") off a token until
 * it hits a known concept or filler word.
 * @returns {{ concept?: object, stop?: true } | null}
 */
const chichewaRoot = (tok) => {
  const lookup = (w) => {
    if (w.length < 3) return null;
    const c = KEY_TO_CONCEPT.get(w);
    if (c) return { concept: c };
    if (STOPWORDS_NY.has(w)) return { stop: true };
    return null;
  };
  const bases = [tok];
  for (const s of NY_SUFFIXES) {
    if (tok.endsWith(s) && tok.length - s.length >= 3) bases.push(tok.slice(0, -s.length));
  }
  for (const base of bases) {
    if (base !== tok) {
      const hit = lookup(base);
      if (hit) return hit;
    }
    for (const p of PREFIXES_LONGEST_FIRST) {
      if (!base.startsWith(p)) continue;
      const rest = base.slice(p.length);
      const hit = lookup(rest);
      if (hit) return hit;
      for (const p2 of PREFIXES_LONGEST_FIRST) {
        if (p2.length > 1 && rest.startsWith(p2)) {
          const hit2 = lookup(rest.slice(p2.length));
          if (hit2) return hit2;
        }
      }
    }
  }
  return null;
};

// Edit distance with an early exit once every cell in a row exceeds `max`.
const editDistance = (a, b, max) => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
};

/** Closest dictionary word for a likely typo (same first letter, 1–2 edits). */
const fuzzyConcept = (tok) => {
  if (tok.length < 5) return null;
  const max = tok.length >= 8 ? 2 : 1;
  let best = null;
  let bestD = max + 1;
  let tie = false;
  for (const k of SINGLE_KEYS) {
    if (k[0] !== tok[0]) continue;
    const d = editDistance(tok, k, max);
    if (d < bestD) { best = k; bestD = d; tie = false; }
    else if (d === bestD && best && KEY_TO_CONCEPT.get(k) !== KEY_TO_CONCEPT.get(best)) tie = true;
  }
  if (!best || bestD > max || tie) return null;
  return { concept: KEY_TO_CONCEPT.get(best), key: best };
};

// Terms we search listings for, per concept (both languages, stemmed, deduped).
const searchTermsFor = (c) => {
  const out = [];
  for (const w of [...c.en, ...c.ny]) {
    const t = /[’']/.test(w) ? w.toLowerCase() : stem(w.toLowerCase());
    if (t.length >= 3 && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 10);
};

// "5000", "5,000", "mk5000", "k5000", "5k", "5.5k" → number
const parseAmount = (tok) => {
  const t = String(tok).toLowerCase().replace(/,/g, '').replace(/^(mk|k)/, '');
  const m = t.match(/^(\d+(?:\.\d+)?)(k)?$/);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] ? 1000 : 1);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const consumePhrase = (text, phrases) => {
  for (const p of [...phrases].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(^|\\s)${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'i');
    if (re.test(text)) return { found: true, text: text.replace(re, ' ').replace(/\s+/g, ' ').trim() };
  }
  return { found: false, text };
};

/**
 * Parse a free-text query.
 * @returns {{
 *   original: string, language: 'en'|'ny'|'mixed'|'unknown',
 *   concepts: Array<{ id: string, label: string, matched: string, terms: string[], category?: string, source: string }>,
 *   minPrice: number|null, maxPrice: number|null, deliveryOnly: boolean,
 *   sort: 'relevance'|'price_asc', location: string|null, unknown: string[], isService: boolean
 * }}
 */
export const parseQuery = (input) => {
  const original = String(input || '').trim().slice(0, 300);
  let text = normKey(original);
  let nyHits = 0;
  let enHits = 0;

  // --- price ranges first, so their numbers aren't searched for ---
  let minPrice = null;
  let maxPrice = null;
  const amountRe = '((?:mk|k)?\\s?\\d[\\d,]*(?:\\.\\d+)?k?)';
  const between = text.match(new RegExp(`(?:between|pakati pa)\\s+${amountRe}\\s+(?:and|ndi|to|-)\\s+${amountRe}`));
  if (between) {
    minPrice = parseAmount(between[1].replace(/\s/g, ''));
    maxPrice = parseAmount(between[2].replace(/\s/g, ''));
    text = text.replace(between[0], ' ');
    if (/pakati pa/.test(between[0])) nyHits++; else enHits++;
  }
  const markerRe = (markers) => new RegExp(`(?:^|\\s)(${markers.map((m) => m.replace(/\s/g, '\\s+')).join('|')})\\s+${amountRe}`);
  const maxM = text.match(markerRe(MAX_PRICE_MARKERS));
  if (maxM) {
    maxPrice = parseAmount(maxM[2].replace(/\s/g, ''));
    text = text.replace(maxM[0], ' ');
    if (MAX_PRICE_MARKERS.slice(7).some((m) => maxM[1].startsWith(m.split(' ')[0]))) nyHits++; else enHits++;
  }
  const minM = text.match(markerRe(MIN_PRICE_MARKERS));
  if (minM) {
    minPrice = parseAmount(minM[2].replace(/\s/g, ''));
    text = text.replace(minM[0], ' ');
  }
  if (minPrice && maxPrice && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

  // --- intents ---
  const cheap = consumePhrase(text, CHEAP_PHRASES.map(normKey));
  text = cheap.text;
  const delivery = consumePhrase(text, DELIVERY_PHRASES.map(normKey));
  text = delivery.text;

  // --- location: "pafupi ndi Mitundu", "in Lilongwe", "ku Area 25" ---
  let location = null;
  const locRe = new RegExp(`(?:^|\\s)(${LOCATION_MARKERS.map((m) => m.replace(/\s/g, '\\s+')).join('|')})\\s+([\\p{L}][\\p{L}\\p{N}-]*(?:\\s\\d+)?)`, 'u');
  const locM = text.match(locRe);
  if (locM) {
    const candidate = locM[2];
    const first = candidate.split(' ')[0];
    const isWord = KEY_TO_CONCEPT.has(first) || KEY_TO_CONCEPT.has(stem(first))
      || STOPWORDS_EN.has(first) || STOPWORDS_NY.has(first);
    if (!isWord && first.length >= 3) {
      location = candidate;
      text = text.replace(locM[0], ' ');
      if (['ku', 'kwa', 'pafupi ndi'].includes(locM[1].replace(/\s+/g, ' '))) nyHits++; else enHits++;
    }
  }

  // --- concepts: multi-word phrases, then single words ---
  const concepts = [];
  const seen = new Set();
  const addConcept = (c, matched, source = 'dictionary') => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    concepts.push({
      id: c.id,
      label: c.en[0],
      matched,
      terms: searchTermsFor(c),
      category: c.cat,
      service: !!c.service,
      source,
    });
  };

  for (const k of MULTIWORD_KEYS) {
    const re = new RegExp(`(^|\\s)${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`);
    if (re.test(text)) {
      addConcept(KEY_TO_CONCEPT.get(k), k);
      if (NY_KEYS.has(k)) nyHits++; else enHits++;
      text = text.replace(re, ' ');
    }
  }

  const unknown = [];
  for (const raw of text.split(' ').filter(Boolean)) {
    const tok = raw.replace(/^[-.]+|[-.]+$/g, '');
    if (!tok || /^\d+([.,]\d+)?(k|kg|kgs|g|l|ltr|litres?|m|cm|mm|pcs)?$/.test(tok)) continue;
    if (STOPWORDS_NY.has(tok)) { nyHits++; continue; }
    if (STOPWORDS_EN.has(tok)) { enHits++; continue; }
    const c = KEY_TO_CONCEPT.get(tok) || KEY_TO_CONCEPT.get(stem(tok));
    if (c) {
      addConcept(c, tok);
      if (NY_KEYS.has(tok) && !EN_KEYS.has(tok)) nyHits++;
      else if (EN_KEYS.has(tok) || EN_KEYS.has(stem(tok))) enHits++;
      continue;
    }
    // Chichewa prefixes/enclitics on a known word: "zachimanga", "mnyumba", "kukhitchini"
    const root = chichewaRoot(tok);
    if (root) {
      if (root.stop) { nyHits++; continue; }
      addConcept(root.concept, tok);
      nyHits++;
      continue;
    }
    if (tok.length >= 4 && NY_FILLER_VERB.test(tok)) { nyHits++; continue; }
    // Misspellings: "chimaga", "feteleza", "simenthi"
    const near = fuzzyConcept(tok);
    if (near) {
      addConcept(near.concept, tok, 'fuzzy');
      if (NY_KEYS.has(near.key)) nyHits++; else enHits++;
      continue;
    }
    if (tok.length >= 3 && unknown.length < 6) unknown.push(tok);
  }

  // Unknown words are still searched as-is (brand names, rare items).
  for (const u of unknown) {
    const t = stem(u);
    concepts.push({ id: `raw:${t}`, label: u, matched: u, terms: [t], source: 'raw' });
  }

  const language = nyHits && enHits ? 'mixed' : nyHits ? 'ny' : enHits ? 'en' : 'unknown';

  return {
    original,
    language,
    concepts: concepts.slice(0, 8),
    minPrice,
    maxPrice,
    deliveryOnly: delivery.found,
    sort: cheap.found ? 'price_asc' : 'relevance',
    location,
    unknown,
    isService: concepts.some((c) => c.service),
  };
};

/**
 * Fold extra English keywords (e.g. from the AI) into a parsed query.
 * Phrases/words matching dictionary concepts become those concepts; other
 * words form one AI concept. AI concepts are placed before raw leftovers so
 * they survive the 8-concept cap and count as "understood" when matching.
 */
export const mergeTranslatedTerms = (parsed, words = []) => {
  const isUseful = (w) => w.length >= 3 && !STOPWORDS_EN.has(w) && !STOPWORDS_NY.has(w);
  const phrases = [...new Set(words.map(normKey).filter(Boolean))];
  if (!phrases.length) return parsed;

  const known = parsed.concepts.filter((c) => c.source !== 'raw');
  const raw = parsed.concepts.filter((c) => c.source === 'raw');
  const have = new Set(known.map((c) => c.id));
  const added = [];
  const loose = [];
  const addKnown = (c, matched) => {
    if (have.has(c.id)) return;
    have.add(c.id);
    added.push({ id: c.id, label: c.en[0], matched, terms: searchTermsFor(c), category: c.cat, service: !!c.service, source: 'ai' });
  };

  for (const phrase of phrases) {
    const whole = KEY_TO_CONCEPT.get(phrase) || KEY_TO_CONCEPT.get(stem(phrase));
    if (whole) { addKnown(whole, phrase); continue; }
    for (const w of phrase.split(' ').filter(isUseful)) {
      const c = KEY_TO_CONCEPT.get(w) || KEY_TO_CONCEPT.get(stem(w));
      if (c) addKnown(c, w);
      else if (!loose.includes(stem(w))) loose.push(stem(w));
    }
  }
  if (loose.length) {
    added.push({ id: `ai:${loose[0]}`, label: loose.slice(0, 3).join(' '), matched: parsed.original, terms: loose.slice(0, 10), source: 'ai' });
  }
  if (!added.length) return parsed;
  const concepts = [...known, ...added, ...raw].slice(0, 8);
  return { ...parsed, concepts, isService: concepts.some((c) => c.service), aiUsed: true };
};

/** Short, UI-ready summary of how the query was understood. */
export const describeInterpretation = (p) => ({
  language: p.language,
  concepts: p.concepts.map((c) => ({ label: c.label, matched: c.matched, source: c.source })),
  minPrice: p.minPrice,
  maxPrice: p.maxPrice,
  deliveryOnly: p.deliveryOnly,
  sort: p.sort,
  location: p.location,
  isService: p.isService,
  aiUsed: !!p.aiUsed,
  relaxed: p.relaxed || null,
});

export const _internals = { LEXICON, KEY_TO_CONCEPT, stem, parseAmount, chichewaRoot, fuzzyConcept };
