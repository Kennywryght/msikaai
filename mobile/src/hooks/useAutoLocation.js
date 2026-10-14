// mobile/src/hooks/useAutoLocation.js
// Detects where the user is (GPS) and turns it into a place name such as
// "Kawale 1, Lilongwe" via the backend's reverse geocoder.
import { useCallback, useEffect, useRef, useState } from 'react';
import { locationAPI } from '../services/api';

const CACHE_KEY = 'kumsika:lastLocation';
const CACHE_TTL_MS = 10 * 60 * 1000; // reuse a fix for 10 min across forms

const readCache = () => {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    return c && Date.now() - c.t < CACHE_TTL_MS ? c : null;
  } catch {
    return null;
  }
};
const writeCache = (v) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...v, t: Date.now() })); } catch { /* private mode */ }
};

const getPosition = (opts) =>
  new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opts));

/**
 * @param {{ auto?: boolean, onResolved?: (r: { name: string|null, place: object|null,
 *   coords: { lat: number, lng: number }, accuracy: number|null }) => void }} options
 * status: 'idle' | 'locating' | 'resolving' | 'done' | 'unnamed' | 'denied' | 'unsupported' | 'error'
 */
export const useAutoLocation = ({ auto = true, onResolved } = {}) => {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;
  const busy = useRef(false);

  const finish = useCallback((r) => {
    setResult(r);
    setStatus(r.name ? 'done' : 'unnamed');
    onResolvedRef.current?.(r);
  }, []);

  const detect = useCallback(async ({ useCache = false } = {}) => {
    if (busy.current) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }
    if (useCache) {
      const cached = readCache();
      if (cached?.name) { finish(cached); return; }
    }

    busy.current = true;
    setStatus('locating');
    try {
      let pos;
      try {
        // GPS first for street-level accuracy…
        pos = await getPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
      } catch (err) {
        if (err?.code === 1) throw err; // permission denied: don't retry
        // …then a quicker network-based fix if GPS is slow (indoors).
        pos = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
      }

      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const accuracy = Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null;
      setStatus('resolving');

      let place = null;
      try {
        const res = await locationAPI.reverse(coords.lat, coords.lng);
        place = res?.data?.place || (res?.data?.name ? { name: res.data.name, full: res.data.name } : null);
      } catch (e) {
        console.warn('Reverse geocode failed:', e?.message || e);
      }

      const r = { name: place?.name || null, place, coords, accuracy };
      if (r.name) writeCache(r);
      finish(r);
    } catch (err) {
      setStatus(err?.code === 1 ? 'denied' : 'error');
    } finally {
      busy.current = false;
    }
  }, [finish]);

  useEffect(() => {
    if (!auto) return undefined;
    let cancelled = false;
    (async () => {
      // Don't trigger a prompt the user has already refused.
      try {
        const perm = await navigator.permissions?.query({ name: 'geolocation' });
        if (perm?.state === 'denied') { if (!cancelled) setStatus('denied'); return; }
      } catch { /* Permissions API unsupported (older Safari): just ask */ }
      if (!cancelled) detect({ useCache: true });
    })();
    return () => { cancelled = true; };
  }, [auto, detect]);

  return { status, result, detect };
};

export default useAutoLocation;
