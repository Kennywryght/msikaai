// backend/src/services/geocodingService.test.js
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlace } from './geocodingService.js';

test('place names are "<area>, <town>" for Malawi addresses', () => {
  const cases = [
    [{ suburb: 'Kawale 1', city: 'Lilongwe', state: 'Lilongwe' }, 'Kawale 1, Lilongwe'],
    [{ residential: 'Area 49, Lilongwe', city: 'Lilongwe', state: 'Lilongwe' }, 'Area 49, Lilongwe'],
    [{ road: 'Kavale Road', residential: 'Area8', city: 'Lilongwe', state: 'Lilongwe' }, 'Area 8, Lilongwe'],
    [{ town: 'Mitundu', state: 'Lilongwe', region: 'Central Region, Malawi' }, 'Mitundu, Lilongwe'],
    [{ village: 'Chitedze', state: 'Lilongwe' }, 'Chitedze, Lilongwe'],
    [{ neighbourhood: 'Mbayani', city: 'Blantyre', state: 'Blantyre' }, 'Mbayani, Blantyre'],
  ];
  for (const [addr, expected] of cases) assert.equal(buildPlace(addr).name, expected);
});

test('full address adds the road', () => {
  const p = buildPlace({ road: 'Kavale Road', residential: 'Area8', city: 'Lilongwe', state: 'Lilongwe' });
  assert.equal(p.full, 'Kavale Road, Area 8, Lilongwe');
  assert.equal(p.locality, 'Area 8');
  assert.equal(p.town, 'Lilongwe');
});

test('falls back to the display name, or null when there is nothing', () => {
  assert.equal(buildPlace({}, 'Kamuzu Central Hospital, Mzimba Street, Lilongwe').name, 'Kamuzu Central Hospital, Mzimba Street');
  assert.equal(buildPlace({}, ''), null);
});
