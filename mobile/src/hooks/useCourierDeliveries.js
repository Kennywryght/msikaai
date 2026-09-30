// mobile/src/hooks/useCourierDeliveries.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { deliveriesAPI } from '../services/api';

export function useCourierDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const res = await deliveriesAPI.active();
      const data = res?.data || {};
      if (!abortRef.current) {
        setDeliveries(Array.isArray(data.deliveries) ? data.deliveries : []);
        setTotal(Number(data.total) || 0);
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(
          err?.response?.data?.error || err?.message || 'Failed to load active deliveries'
        );
        setDeliveries([]);
        setTotal(0);
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

  return { deliveries, total, loading, refreshing, error, refresh };
}

export default useCourierDeliveries;