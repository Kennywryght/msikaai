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

/**
 * Build a short, friendly place name from a Nominatim response.
 */
const buildPlaceName = (addr = {}) => {
  const parts = [
    addr.suburb,
    addr.village,
    addr.town,
    addr.city_district,
    addr.city,
    addr.county,
    addr.state,
  ].filter(Boolean);

  const unique = [...new Set(parts)];
  if (unique.length === 0) return null;
  return unique.slice(0, 3).join(', ');
};

/**
 * Reverse geocode lat/lng to a short place name.
 * Returns a string or null. Never throws.
 */
export const reverseGeocode = async (lat, lng) => {
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

    const url =
      `${NOMINATIM_URL}?format=jsonv2&lat=${latNum}&lon=${lngNum}` +
      `&zoom=14&addressdetails=1&accept-language=en`;

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
    const name =
      buildPlaceName(data?.address) ||
      (data?.display_name
        ? data.display_name.split(',').slice(0, 2).join(',').trim()
        : null);

    if (name) {
      setInCache(key, name);
      return name;
    }
    return null;
  } catch (err) {
    if (err?.name === 'AbortError') {
      logger.warn('Nominatim timeout', { lat: latNum, lng: lngNum });
    } else {
      logger.warn('Nominatim error', { error: err?.message || err });
    }
    return null;
  }
};

export default { reverseGeocode };