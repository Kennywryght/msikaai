// backend/src/services/geocodingService.js
// Free reverse geocoding via OpenStreetMap Nominatim.
// Policy: https://operations.osmfoundation.org/policies/nominatim/
//   - Max 1 request/second
//   - Must send a real User-Agent
//   - Cache results to avoid repeat calls

import { logger } from '../utils/logger.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'KumsikaApp/1.0 (contact: support@kumsika.app)';
const REQUEST_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_MAX_ENTRIES = 500;
const MIN_INTERVAL_MS = 1100; // respect 1 req/sec limit

// In-memory cache: key = "lat,lng" rounded to 4 decimals (~11m precision)
const cache = new Map(); // key -> { name, expiresAt }

// Simple throttle queue
let lastCallAt = 0;
let inflight = Promise.resolve();

const roundCoord = (n) => Math.round(Number(n) * 10000) / 10000;

const cacheKey = (lat, lng) => `${roundCoord(lat)},${roundCoord(lng)}`;

const getFromCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.name;
};

const setInCache = (key, name) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, { name, expiresAt: Date.now() + CACHE_TTL_MS });
};

const throttle = () => {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastCallAt));
  const chain = inflight.then(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          lastCallAt = Date.now();
          resolve();
        }, wait);
      })
  );
  inflight = chain.catch(() => {});
  return chain;
};

const first = (addr, keys) => keys.map((k) => addr[k]).find((v) => typeof v === 'string' && v.trim());
// "Lilongwe District" → "Lilongwe" when used as the town part
const stripDistrict = (s) => (s ? s.replace(/\s+(District|City|Municipality)$/i, '').trim() : s);

/**
 * Split a Nominatim address into the parts people use for a place in Malawi:
 *   locality: the area / township / village ("Kawale 1", "Area 25", "Mitundu")
 *   town:     the city or town ("Lilongwe")
 *   district / region for context.
 * name is "<locality>, <town>" — e.g. "Kawale 1, Lilongwe".
 */
export const buildPlace = (addr = {}, displayName = '') => {
  const town = stripDistrict(first(addr, ['city', 'town', 'municipality', 'city_district']));
  // In Malawi OSM puts the district in "state" (e.g. "Lilongwe") and the
  // region in "region" ("Central Region, Malawi").
  const district = stripDistrict(first(addr, ['county', 'state_district', 'state']));
  const region = first(addr, ['region'])?.replace(/,\s*Malawi$/i, '') || null;
  const road = first(addr, ['road', 'pedestrian', 'footway', 'path']);
  const landmark = first(addr, ['amenity', 'shop', 'building', 'office', 'school', 'marketplace']);

  // Area names are sometimes "Area 49, Lilongwe" or "Area8": drop the repeated
  // town and space out the number.
  const rawLocality = first(addr, [
    'neighbourhood', 'quarter', 'residential', 'suburb', 'city_block',
    'hamlet', 'village', 'isolated_dwelling', 'allotments', 'locality',
  ]);
  const locality = rawLocality
    ?.split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== town && s !== district)
    .join(', ')
    .replace(/^(Area|Sector|Zone)\s*(\d+)/i, (_, w, n) => `${w} ${n}`) || null;

  // "<area>, <town>"; with no area, "<town>, <district>" (e.g. "Mitundu, Lilongwe")
  const parts = [...new Set((locality ? [locality, town || district] : [town, district || region]).filter(Boolean))];
  let name = parts.join(', ');
  if (!name) {
    // Nothing structured: take the first two parts of the display name.
    name = String(displayName || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2).join(', ');
  }
  if (!name) return null;

  return {
    name,
    locality: locality || null,
    town: town || null,
    district: district || null,
    region: region || null,
    road: road || null,
    landmark: landmark || null,
    // Longer form for addresses: "Mtsiliza Road, Kawale 1, Lilongwe"
    full: [...new Set([road, ...parts])].filter(Boolean).join(', ') || name,
  };
};

/**
 * Reverse geocode lat/lng to a structured place (see buildPlace).
 * Returns { name, locality, town, district, region, road, landmark, full } or null. Never throws.
 */
export const reverseGeocodeDetailed = async (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (
    Number.isNaN(latNum) ||
    Number.isNaN(lngNum) ||
    latNum < -90 ||
    latNum > 90 ||
    lngNum < -180 ||
    lngNum > 180
  ) {
    return null;
  }

  const key = cacheKey(latNum, lngNum);
  const cached = getFromCache(key);
  if (cached) return cached;

  try {
    await throttle();

    // zoom=18 asks for building-level detail, so the address includes the
    // neighbourhood / area (e.g. "Kawale 1"), not just the district.
    const url =
      `${NOMINATIM_URL}?format=jsonv2&lat=${latNum}&lon=${lngNum}` +
      `&zoom=18&addressdetails=1&accept-language=en`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      logger.warn('Nominatim non-OK', {
        status: res.status,
        lat: latNum,
        lng: lngNum,
      });
      return null;
    }

    const data = await res.json();
    const place = buildPlace(data?.address, data?.display_name);
    if (place) setInCache(key, place);
    return place;
  } catch (err) {
    if (err?.name === 'AbortError') {
      logger.warn('Nominatim timeout', { lat: latNum, lng: lngNum });
    } else {
      logger.warn('Nominatim error', { error: err?.message || err });
    }
    return null;
  }
};

/**
 * Reverse geocode lat/lng to a short place name, e.g. "Kawale 1, Lilongwe".
 * Returns a string or null. Never throws.
 */
export const reverseGeocode = async (lat, lng) => (await reverseGeocodeDetailed(lat, lng))?.name || null;

export default { reverseGeocode, reverseGeocodeDetailed };
