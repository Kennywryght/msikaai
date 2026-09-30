// mobile/src/hooks/useCourierEarnings.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { deliveriesAPI } from '../services/api';

export function useCourierEarnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const res = await deliveriesAPI.earnings();
      const data = res?.data || {};
      if (!abortRef.current) {
        setEarnings({
          lifetime: data.lifetime || { completedCount: 0, totalEarned: 0 },
          thisMonth: data.thisMonth || { completedCount: 0, totalEarned: 0 },
          activeCount: data.activeCount || 0,
          recent: Array.isArray(data.recent) ? data.recent : [],
        });
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(
          err?.response?.data?.error || err?.message || 'Failed to load earnings'
        );
        setEarnings(null);
      }
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
    return () => {
      abortRef.current = true;
    };
  }, [load]);

  return { earnings, loading, refreshing, error, refresh };
}

export default useCourierEarnings;