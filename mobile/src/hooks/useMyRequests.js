// mobile/src/hooks/useMyRequests.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { requestsAPI } from '../services/api';

export function useMyRequests(initialStatus = 'all') {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(initialStatus);

  const abortRef = useRef(false);

  const load = useCallback(async (overrideStatus) => {
    const s = overrideStatus ?? status;
    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const res = await requestsAPI.mine({ status: s });
      const data = res?.data || {};
      if (!abortRef.current) {
        setRequests(Array.isArray(data.requests) ? data.requests : []);
        setTotal(Number(data.total) || 0);
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load your requests');
        setRequests([]);
        setTotal(0);
      }
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, [status]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const changeStatus = useCallback((newStatus) => {
    setStatus(newStatus);
  }, []);

  useEffect(() => {
    load(status);
    return () => {
      abortRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return {
    requests,
    total,
    loading,
    refreshing,
    error,
    status,
    changeStatus,
    refresh,
  };
}

export default useMyRequests;