// mobile/src/hooks/useRequests.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { requestsAPI } from '../services/api';

const DEFAULT_LIMIT = 20;

export function useRequests(initialFilters = {}) {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: 'open',
    category: 'All',
    urgency: 'all',
    search: '',
    locationArea: '',
    sort: 'recent',
    ...initialFilters,
  });

  const offsetRef = useRef(0);
  const filtersRef = useRef(filters);
  const abortRef = useRef(false);

  // Keep filters ref in sync
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // ============================================================
  // LOAD FIRST PAGE
  // ============================================================
  const load = useCallback(async (overrideFilters) => {
    const f = overrideFilters || filtersRef.current;
    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const res = await requestsAPI.list({ ...f, limit: DEFAULT_LIMIT, offset: 0 });
      const data = res?.data || {};
      if (!abortRef.current) {
        setRequests(Array.isArray(data.requests) ? data.requests : []);
        setTotal(Number(data.total) || 0);
        offsetRef.current = 0;
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load requests');
        setRequests([]);
        setTotal(0);
      }
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, []);

  // ============================================================
  // REFRESH (same filters, reset offset)
  // ============================================================
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ============================================================
  // LOAD MORE (append)
  // ============================================================
  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    if (requests.length >= total) return;

    setLoadingMore(true);
    try {
      const nextOffset = offsetRef.current + DEFAULT_LIMIT;
      const res = await requestsAPI.list({
        ...filtersRef.current,
        limit: DEFAULT_LIMIT,
        offset: nextOffset,
      });
      const data = res?.data || {};
      if (Array.isArray(data.requests) && data.requests.length > 0) {
        setRequests((prev) => [...prev, ...data.requests]);
        offsetRef.current = nextOffset;
      }
    } catch (err) {
      console.warn('loadMore failed:', err?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, requests.length, total]);

  // ============================================================
  // UPDATE FILTERS (triggers reload)
  // ============================================================
  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'open',
      category: 'All',
      urgency: 'all',
      search: '',
      locationArea: '',
      sort: 'recent',
    });
  }, []);

  // ============================================================
  // AUTO-LOAD ON FILTER CHANGE
  // ============================================================
  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.category,
    filters.urgency,
    filters.search,
    filters.locationArea,
    filters.sort,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return {
    requests,
    total,
    loading,
    refreshing,
    loadingMore,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh,
    loadMore,
    hasMore: requests.length < total,
  };
}

export default useRequests;