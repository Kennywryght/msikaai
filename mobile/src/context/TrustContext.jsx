// mobile/src/context/TrustContext.jsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { trustAPI } from '../services/api';
import { useAuth } from './AuthContext';

const TrustContext = createContext(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function TrustProvider({ children }) {
  const { user } = useAuth();

  // Map of userId -> { trust, fetchedAt }
  const [cache, setCache] = useState({});
  const [ownTrust, setOwnTrust] = useState(null);
  const [loadingOwn, setLoadingOwn] = useState(false);
  const [error, setError] = useState(null);

  const isStale = (entry) => {
    if (!entry) return true;
    return Date.now() - entry.fetchedAt > CACHE_TTL_MS;
  };

  /**
   * Fetch own trust profile (recomputes server-side if stale).
   */
  const fetchOwnTrust = useCallback(async (force = false) => {
    if (!user?.id) {
      setOwnTrust(null);
      return null;
    }

    if (!force && ownTrust && !isStale({ fetchedAt: ownTrust._fetchedAt })) {
      return ownTrust;
    }

    setLoadingOwn(true);
    setError(null);

    try {
      const res = await trustAPI.getMe();
      const trust = res?.data?.trust || null;
      if (trust) {
        trust._fetchedAt = Date.now();
        setOwnTrust(trust);
        setCache((prev) => ({
          ...prev,
          [user.id]: { trust, fetchedAt: Date.now() },
        }));
      }
      return trust;
    } catch (err) {
      console.error('❌ TrustContext fetchOwnTrust failed:', err?.message);
      setError(err?.message || 'Failed to load trust profile');
      return null;
    } finally {
      setLoadingOwn(false);
    }
  }, [user?.id, ownTrust]);

  /**
   * Fetch any user's trust profile (public). Cached per userId.
   */
  const fetchUserTrust = useCallback(async (userId, force = false) => {
    if (!userId) return null;

    const cached = cache[userId];
    if (!force && cached && !isStale(cached)) {
      return cached.trust;
    }

    try {
      const res = await trustAPI.getUser(userId);
      const trust = res?.data?.trust || null;
      if (trust) {
        trust._fetchedAt = Date.now();
        setCache((prev) => ({
          ...prev,
          [userId]: { trust, fetchedAt: Date.now() },
        }));
      }
      return trust;
    } catch (err) {
      // 404 is expected for users without a trust row — don't spam logs
      if (err?.response?.status !== 404) {
        console.warn('⚠️ TrustContext fetchUserTrust failed:', err?.message);
      }
      return null;
    }
  }, [cache]);

  /**
   * Force refresh own trust (used after verification approval, etc.)
   */
  const refreshOwnTrust = useCallback(async () => {
    return fetchOwnTrust(true);
  }, [fetchOwnTrust]);

  /**
   * Manually trigger a server-side recompute of own score.
   */
  const recomputeOwnTrust = useCallback(async () => {
    if (!user?.id) return null;
    setLoadingOwn(true);
    try {
      const res = await trustAPI.recompute();
      const trust = res?.data?.trust || null;
      if (trust) {
        trust._fetchedAt = Date.now();
        setOwnTrust(trust);
        setCache((prev) => ({
          ...prev,
          [user.id]: { trust, fetchedAt: Date.now() },
        }));
      }
      return trust;
    } catch (err) {
      console.error('❌ TrustContext recomputeOwnTrust failed:', err?.message);
      return null;
    } finally {
      setLoadingOwn(false);
    }
  }, [user?.id]);

  // Auto-load own trust when user changes
  useEffect(() => {
    if (user?.id) {
      fetchOwnTrust();
    } else {
      setOwnTrust(null);
      setCache({});
    }
  }, [user?.id]);

  const value = useMemo(() => ({
    // Own
    ownTrust,
    loadingOwn,
    error,
    refreshOwnTrust,
    recomputeOwnTrust,

    // Others
    fetchUserTrust,
    getCachedTrust: (userId) => cache[userId]?.trust || null,
  }), [
    ownTrust,
    loadingOwn,
    error,
    refreshOwnTrust,
    recomputeOwnTrust,
    fetchUserTrust,
    cache,
  ]);

  return (
    <TrustContext.Provider value={value}>
      {children}
    </TrustContext.Provider>
  );
}

export function useTrust() {
  const ctx = useContext(TrustContext);
  if (!ctx) {
    throw new Error('useTrust must be used inside <TrustProvider>');
  }
  return ctx;
}

export default TrustContext;