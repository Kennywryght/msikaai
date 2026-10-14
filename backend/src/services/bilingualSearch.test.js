// backend/src/services/bilingualSearch.test.js
// Run: npm test   (node's built-in test runner, no extra dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, mergeTranslatedTerms } from './bilingualSearch.js';

const ids = (q) => parseQuery(q).concepts.filter((c) => c.source !== 'raw').map((c) => c.id);
const raw = (q) => parseQuery(q).concepts.filter((c) => c.source === 'raw').map((c) => c.label);

test('Chichewa sentences map to the right items, with no filler left over', () => {
  const cases = [
    ['Ndikufuna chimanga cha mtengo wotsika', ['maize']],
    ['Ndikufuna munthu wokonza foni yanga', ['phonerepair']],
    ['ndingapeze kuti matumba a feteleza', ['fertilizer']],
    ['ndikufunafuna nyumba yobwereka', ['house', 'rent']],
    ['ndikufuna malo ogona', ['lodge']],
    ['ndikusowa zovala za ukwati', ['clothes', 'wedding']],
    ['mukundipezera mazira angati pa 5000', ['eggs']],
    ['ndikufuna ophunzitsa ana masamu', ['tutor', 'children', 'maths']],
    ['ndimafuna chakudya chamasana', ['nsima']],
    ['ndili ndi vuto la madzi mnyumba mwanga', ['plumber', 'house']],
    ['Ndikufuna ana a nkhuku', ['chicks']],
    ['ndikufuna matumba khumi a simenti', ['cement']],
    ['ndikufuna nsomba zouma', ['driedfish']],
    ['foni ya samsung yotsika mtengo', ['phone']],
    ['ndikufuna wina wondimetera tsitsi', ['hair']],
    ['ndikufuna mafuta ophikira', ['oil']],
    ['ndikufuna zipangizo za kukhitchini', ['kitchen']],
    ['ndikufuna galimoto yogulitsa yotsika mtengo', ['car']],
    ['kodi mungandipezere wokonza magetsi mwamsanga?', ['electrician']],
  ];
  for (const [q, expected] of cases) {
    assert.deepEqual(ids(q), expected, q);
    assert.deepEqual(raw(q), [], `no leftover words for: ${q}`);
  }
});

test('prefixes, enclitics and typos', () => {
  assert.deepEqual(ids('zachimanga'), ['maize']);
  assert.deepEqual(ids('ndikufuna chimanganso'), ['maize']);
  assert.deepEqual(ids('chimaga'), ['maize']);
  assert.deepEqual(ids('simenthi 50kg'), ['cement']);
  assert.equal(parseQuery('chimaga').concepts[0].source, 'fuzzy');
});

test('price, cheap, delivery and location intent', () => {
  const p = parseQuery('nsapato za amuna zosapitirira 10k ndi kundibweretsera');
  assert.deepEqual(p.concepts.map((c) => c.id), ['shoes', 'men']);
  assert.equal(p.maxPrice, 10000);
  assert.equal(p.deliveryOnly, true);

  const h = parseQuery('ndikufuna nyumba yobwereka ku Area 25 pansi pa 80,000');
  assert.equal(h.maxPrice, 80000);
  assert.equal(h.location, 'area 25');

  assert.equal(parseQuery('ndikufuna galimoto yotsika mtengo').sort, 'price_asc');
  assert.equal(parseQuery('chimaga chotsika').sort, 'price_asc');
});

test('English and mixed queries still work', () => {
  assert.deepEqual(ids('I need a plumber pafupi ndi Mitundu'), ['plumber']);
  assert.equal(parseQuery('I need a plumber pafupi ndi Mitundu').location, 'mitundu');
  assert.deepEqual(ids('cheap tomatoes with delivery'), ['tomatoes']);
  assert.deepEqual(ids('nsapato za akazi pansi pa 5000'), ['shoes', 'women']);
  assert.deepEqual(ids('mango'), ['mangoes']);
});

test('unknown words stay raw instead of being forced onto a wrong item', () => {
  for (const w of ['fridge', 'guitar', 'printer', 'manager', 'amazon']) {
    assert.deepEqual(ids(w), [], w);
    assert.deepEqual(raw(w), [w], w);
  }
});

test('AI keywords become searchable concepts ahead of raw words', () => {
  const p = mergeTranslatedTerms(parseQuery('ndikufuna fridge yatsopano'), ['refrigerator', 'fridge']);
  const ai = p.concepts.find((c) => c.source === 'ai');
  assert.ok(ai, 'an AI concept is added');
  assert.ok(ai.terms.includes('refrigerator'));
  assert.equal(p.aiUsed, true);

  const d = mergeTranslatedTerms(parseQuery('xyz'), ['dried fish']);
  assert.ok(d.concepts.some((c) => c.id === 'driedfish'), 'multi-word keyword matched as a phrase');
});
