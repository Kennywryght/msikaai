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
  { id: 'maize', en: ['maize', 'corn'], ny: ['chimanga'], cat: 'Food' },
  { id: 'flour', en: ['flour', 'maize flour', 'mgaiwa'], ny: ['ufa', 'mgaiwa'], cat: 'Food' },
  { id: 'rice', en: ['rice'], ny: ['mpunga'], cat: 'Food' },
  { id: 'beans', en: ['beans'], ny: ['nyemba'], cat: 'Food' },
  { id: 'groundnuts', en: ['groundnuts', 'peanuts', 'g-nuts'], ny: ['mtedza'], cat: 'Food' },
  { id: 'soya', en: ['soya', 'soy'], ny: ['soya'], cat: 'Food' },
  { id: 'tomatoes', en: ['tomatoes'], ny: ['matimati', 'tomato'], cat: 'Food' },
  { id: 'onions', en: ['onions'], ny: ['anyezi'], cat: 'Food' },
  { id: 'cabbage', en: ['cabbage'], ny: ['kabichi', 'kabeji'], cat: 'Food' },
  { id: 'vegetables', en: ['vegetables', 'greens', 'veggies', 'rape'], ny: ['ndiwo', 'masamba', 'mpiru'], cat: 'Food' },
  { id: 'potatoes', en: ['potatoes', 'sweet potatoes', 'irish potatoes'], ny: ['mbatata', 'kachewere'], cat: 'Food' },
  { id: 'cassava', en: ['cassava'], ny: ['chinangwa'], cat: 'Food' },
  { id: 'bananas', en: ['bananas'], ny: ['nthochi'], cat: 'Food' },
  { id: 'mangoes', en: ['mangoes'], ny: ['mango'], cat: 'Food' },
  { id: 'oranges', en: ['oranges'], ny: ['malalanje'], cat: 'Food' },
  { id: 'pumpkin', en: ['pumpkin'], ny: ['dzungu', 'maungu'], cat: 'Food' },
  { id: 'fruit', en: ['fruit', 'fruits'], ny: ['zipatso', 'chipatso'], cat: 'Food' },
  { id: 'eggs', en: ['eggs'], ny: ['mazira', 'dzira'], cat: 'Food' },
  { id: 'milk', en: ['milk', 'dairy'], ny: ['mkaka'], cat: 'Food' },
  { id: 'meat', en: ['meat'], ny: ['nyama'], cat: 'Food' },
  { id: 'beef', en: ['beef', 'cow', 'cattle'], ny: ["ng'ombe", 'ngombe'], cat: 'Food' },
  { id: 'goat', en: ['goat', 'goats'], ny: ['mbuzi'], cat: 'Food' },
  { id: 'pork', en: ['pork', 'pig', 'pigs'], ny: ['nkhumba'], cat: 'Food' },
  { id: 'chicken', en: ['chicken', 'chickens', 'poultry', 'broiler'], ny: ['nkhuku'], cat: 'Food' },
  { id: 'fish', en: ['fish', 'chambo', 'usipa', 'kapenta'], ny: ['nsomba', 'chambo', 'usipa', 'utaka'], cat: 'Food' },
  { id: 'salt', en: ['salt'], ny: ['mchere'], cat: 'Food' },
  { id: 'sugar', en: ['sugar'], ny: ['shuga'], cat: 'Food' },
  { id: 'oil', en: ['cooking oil', 'oil'], ny: ['mafuta'], cat: 'Food' },
  { id: 'bread', en: ['bread'], ny: ['buledi', 'mkate'], cat: 'Food' },
  { id: 'tea', en: ['tea'], ny: ['tiyi'], cat: 'Food' },
  { id: 'food', en: ['food', 'groceries', 'grocery'], ny: ['chakudya', 'zakudya'], cat: 'Food' },
  { id: 'tobacco', en: ['tobacco'], ny: ['fodya'], cat: 'Farm Inputs' },
  { id: 'fertilizer', en: ['fertilizer', 'fertiliser', 'urea'], ny: ['feteleza', 'fetereza'], cat: 'Farm Inputs' },
  { id: 'seeds', en: ['seeds', 'seed'], ny: ['mbewu', 'njere'], cat: 'Farm Inputs' },
  { id: 'hoe', en: ['hoe'], ny: ['khasu', 'makasu'], cat: 'Farm Inputs' },

  // Clothing (+ who it's for)
  { id: 'clothes', en: ['clothes', 'clothing'], ny: ['zovala', 'chovala', 'malaya'], cat: 'Clothing' },
  { id: 'shoes', en: ['shoes', 'sandals', 'sneakers'], ny: ['nsapato', 'masapato'], cat: 'Clothing' },
  { id: 'chitenje', en: ['chitenje', 'fabric', 'wrapper', 'cloth'], ny: ['chitenje', 'zitenje', 'nsalu'], cat: 'Clothing' },
  { id: 'dress', en: ['dress', 'dresses'], ny: ['diresi'], cat: 'Clothing' },
  { id: 'trousers', en: ['trousers', 'pants', 'jeans'], ny: ['buluku', 'mabuluku'], cat: 'Clothing' },
  { id: 'shirt', en: ['shirt', 'shirts', 't-shirt'], ny: ['malaya', 'sheti'], cat: 'Clothing' },
  { id: 'women', en: ['women', 'ladies', 'female', 'womens'], ny: ['akazi', 'azimayi', 'achikazi', 'zachikazi', 'amayi'] },
  { id: 'men', en: ['men', 'mens', 'gents', 'male'], ny: ['amuna', 'achimuna', 'zachimuna', 'abambo'] },
  { id: 'children', en: ['children', 'kids', 'baby', 'babies'], ny: ['ana', 'mwana', 'zaana', 'makanda'] },

  // Household, electronics, transport
  { id: 'phone', en: ['phone', 'phones', 'mobile', 'smartphone'], ny: ['foni', 'lamya'], cat: 'Electronics' },
  { id: 'radio', en: ['radio'], ny: ['wailesi'], cat: 'Electronics' },
  { id: 'tv', en: ['tv', 'television'], ny: ['tivi', 'kanema'], cat: 'Electronics' },
  { id: 'solar', en: ['solar', 'solar panel', 'battery'], ny: ['sola', 'batire'], cat: 'Electronics' },
  { id: 'chair', en: ['chair', 'chairs'], ny: ['mpando', 'mipando'], cat: 'Home & Garden' },
  { id: 'table', en: ['table', 'tables'], ny: ['tebulo', 'gome'], cat: 'Home & Garden' },
  { id: 'bed', en: ['bed', 'beds', 'mattress'], ny: ['bedi', 'matiresi'], cat: 'Home & Garden' },
  { id: 'pots', en: ['pot', 'pots', 'cooking pot'], ny: ['mphika', 'miphika', 'poto'], cat: 'Home & Garden' },
  { id: 'plates', en: ['plates', 'dishes'], ny: ['mbale'], cat: 'Home & Garden' },
  { id: 'charcoal', en: ['charcoal'], ny: ['makala'], cat: 'Home & Garden' },
  { id: 'firewood', en: ['firewood', 'wood'], ny: ['nkhuni'], cat: 'Home & Garden' },
  { id: 'bicycle', en: ['bicycle', 'bike'], ny: ['njinga'], cat: 'Transport' },
  { id: 'motorbike', en: ['motorbike', 'motorcycle'], ny: ['njinga yamoto', 'njinga ya moto'], cat: 'Transport' },
  { id: 'car', en: ['car', 'cars', 'vehicle'], ny: ['galimoto', 'magalimoto'], cat: 'Transport' },

  // Building & hardware
  { id: 'cement', en: ['cement'], ny: ['simenti', 'saimenti'], cat: 'Hardware' },
  { id: 'bricks', en: ['bricks', 'blocks'], ny: ['njerwa'], cat: 'Hardware' },
  { id: 'ironsheets', en: ['iron sheets', 'roofing sheets', 'roofing'], ny: ['malata'], cat: 'Hardware' },
  { id: 'timber', en: ['timber', 'planks'], ny: ['matabwa', 'thabwa'], cat: 'Hardware' },
  { id: 'nails', en: ['nails'], ny: ['misomali', 'msomali'], cat: 'Hardware' },
  { id: 'paint', en: ['paint'], ny: ['penti'], cat: 'Hardware' },
  { id: 'door', en: ['door', 'doors'], ny: ['chitseko', 'zitseko'], cat: 'Hardware' },
  { id: 'window', en: ['window', 'windows'], ny: ['windo', 'zenera', 'mawindo'], cat: 'Hardware' },
  { id: 'tools', en: ['tools', 'hammer', 'spanner'], ny: ['zida', 'nyundo'], cat: 'Hardware' },

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
];

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
]);
const STOPWORDS_EN = new Set([
  'i', 'im', 'me', 'my', 'we', 'you', 'need', 'needs', 'want', 'wants', 'looking', 'look', 'search',
  'searching', 'find', 'for', 'a', 'an', 'the', 'some', 'any', 'to', 'buy', 'buying', 'sell', 'selling',
  'seller', 'please', 'where', 'can', 'could', 'get', 'is', 'are', 'there', 'who', 'which', 'what', 'in',
  'at', 'on', 'of', 'and', 'or', 'with', 'good', 'best', 'someone', 'somebody', 'anyone', 'service',
  'services', 'shop', 'store', 'available', 'today', 'now', 'urgent', 'urgently', 'price', 'prices',
  'from', 'that', 'this', 'it', 'do', 'does', 'have', 'has', 'sells', 'offer', 'offers', 'near', 'nearby',
  'around', 'like', 'just', 'very', 'really', 'also', 'mk', 'kwacha', 'per', 'each', 'new', 'brand',
]);

// Intent phrases (matched before tokenizing; longest first).
const CHEAP_PHRASES = ['mtengo wotsika', 'otsika mtengo', 'wotsika mtengo', 'zotsika mtengo', 'zotchipa', 'yotchipa', 'wotchipa',
  'cheapest', 'cheap', 'affordable', 'low price', 'lowest price', 'budget'];
const DELIVERY_PHRASES = ['with delivery', 'home delivery', 'delivery', 'deliver', 'kubweretsa', 'kubweretsera', 'kutumiza', 'adzabweretse'];
const MAX_PRICE_MARKERS = ['less than', 'under', 'below', 'up to', 'max', 'maximum', 'not more than',
  'pansi pa', 'osapitirira', 'zosaposa', 'mpaka', 'osaposa', 'zochepera'];
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
  const addConcept = (c, matched) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    concepts.push({
      id: c.id,
      label: c.en[0],
      matched,
      terms: searchTermsFor(c),
      category: c.cat,
      service: !!c.service,
      source: 'dictionary',
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
    if (!tok || /^\d+([.,]\d+)?k?$/.test(tok)) continue;
    if (STOPWORDS_NY.has(tok)) { nyHits++; continue; }
    if (STOPWORDS_EN.has(tok)) { enHits++; continue; }
    const c = KEY_TO_CONCEPT.get(tok) || KEY_TO_CONCEPT.get(stem(tok));
    if (c) {
      addConcept(c, tok);
      if (NY_KEYS.has(tok) && !EN_KEYS.has(tok)) nyHits++;
      else if (EN_KEYS.has(tok) || EN_KEYS.has(stem(tok))) enHits++;
      continue;
    }
    // Chichewa noun-class prefixes on a known word: "zachimanga", "yamagetsi"
    const prefixed = tok.match(/^(za|ya|wa|la|cha|ka|kwa|ma)(.{3,})$/);
    const inner = prefixed && KEY_TO_CONCEPT.get(prefixed[2]);
    if (inner) { addConcept(inner, tok); nyHits++; continue; }
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
 * Fold extra English words (e.g. from the AI translator) into a parsed query.
 * Words matching dictionary concepts become concepts; the rest attach to
 * the raw-word concepts so a mistranslation can't remove matches.
 */
export const mergeTranslatedTerms = (parsed, words = []) => {
  const extra = [...new Set(words.map(normKey).flatMap((w) => w.split(' ')))]
    .filter((w) => w.length >= 3 && !STOPWORDS_EN.has(w) && !STOPWORDS_NY.has(w));
  if (!extra.length) return parsed;

  const concepts = [...parsed.concepts];
  const have = new Set(concepts.map((c) => c.id));
  const loose = [];
  for (const w of extra) {
    const c = KEY_TO_CONCEPT.get(w) || KEY_TO_CONCEPT.get(stem(w));
    if (c && !have.has(c.id)) {
      have.add(c.id);
      concepts.push({ id: c.id, label: c.en[0], matched: w, terms: searchTermsFor(c), category: c.cat, service: !!c.service, source: 'ai' });
    } else if (!c) {
      loose.push(stem(w));
    }
  }
  if (loose.length) {
    const raw = concepts.find((c) => c.source === 'raw');
    if (raw) raw.terms = [...new Set([...raw.terms, ...loose])].slice(0, 10);
    else concepts.push({ id: `ai:${loose[0]}`, label: loose.join(' '), matched: parsed.original, terms: loose.slice(0, 10), source: 'ai' });
  }
  return { ...parsed, concepts: concepts.slice(0, 8), aiUsed: true };
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
});

export const _internals = { LEXICON, KEY_TO_CONCEPT, stem, parseAmount };
