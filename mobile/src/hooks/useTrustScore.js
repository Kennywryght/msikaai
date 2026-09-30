// mobile/src/hooks/useTrustScore.js
import { useEffect, useState } from 'react';
import { useTrust } from '../context/TrustContext';
import { useAuth } from '../context/AuthContext';

/**
 * useTrustScore()
 *   → Returns the current user's trust profile.
 *
 * useTrustScore(userId)
 *   → Returns the specified user's trust profile.
 *
 * useTrustScore(null)
 *   → Returns null without fetching (for conditional rendering).
 */
export function useTrustScore(userId) {
  const { user } = useAuth();
  const {
    ownTrust,
    loadingOwn,
    fetchUserTrust,
    getCachedTrust,
  } = useTrust();

  const targetId = userId === undefined ? user?.id : userId;
  const isOwn = targetId === user?.id;

  const [trust, setTrust] = useState(() => {
    if (!targetId) return null;
    if (isOwn) return ownTrust || null;
    return getCachedTrust(targetId);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetId) {
      setTrust(null);
      return;
    }

    if (isOwn) {
      setTrust(ownTrust || null);
      setLoading(loadingOwn);
      return;
    }

    // Others
    let cancelled = false;

    const cached = getCachedTrust(targetId);
    if (cached) {
      setTrust(cached);
      return;
    }

    setLoading(true);
    setError(null);

    fetchUserTrust(targetId)
      .then((result) => {
        if (!cancelled) setTrust(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load trust');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetId, isOwn, ownTrust, loadingOwn]);

  // Convenience derived fields
  const tier = trust?.tier ?? 0;
  const score = trust?.trust_score ?? 0;

  return {
    trust,
    tier,
    score,
    loading,
    error,
    // Sugar flags
    isVerified: tier >= 1,
    isIdVerified: tier >= 2,
    isBusinessVerified: tier >= 3,
    phoneVerified: !!trust?.phone_verified,
    emailVerified: !!trust?.email_verified,
    idVerified: !!trust?.id_verified,
    businessVerified: !!trust?.business_verified,
  };
}

export default useTrustScore;