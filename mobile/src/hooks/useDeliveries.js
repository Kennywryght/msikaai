// mobile/src/hooks/useDeliveries.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { deliveriesAPI } from '../services/api';

const DEFAULT_LIMIT = 20;

export function useDeliveries(initialFilters = {}) {
  const [deliveries, setDeliveries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: 'open',
    packageSize: 'all',
    search: '',
    pickupArea: '',
    dropoffArea: '',
    sort: 'recent',
    ...initialFilters,
  });

  const offsetRef = useRef(0);
  const filtersRef = useRef(filters);
  const abortRef = useRef(false);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const load = useCallback(async (overrideFilters) => {
    const f = overrideFilters || filtersRef.current;
    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const res = await deliveriesAPI.list({
        ...f,
        limit: DEFAULT_LIMIT,
        offset: 0,
      });
      const data = res?.data || {};
      if (!abortRef.current) {
        setDeliveries(Array.isArray(data.deliveries) ? data.deliveries : []);
        setTotal(Number(data.total) || 0);
        offsetRef.current = 0;
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(
          err?.response?.data?.error || err?.message || 'Failed to load deliveries'
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

  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    if (deliveries.length >= total) return;

    setLoadingMore(true);
    try {
      const nextOffset = offsetRef.current + DEFAULT_LIMIT;
      const res = await deliveriesAPI.list({
        ...filtersRef.current,
        limit: DEFAULT_LIMIT,
        offset: nextOffset,
      });
      const data = res?.data || {};
      if (Array.isArray(data.deliveries) && data.deliveries.length > 0) {
        setDeliveries((prev) => [...prev, ...data.deliveries]);
        offsetRef.current = nextOffset;
      }
    } catch (err) {
      console.warn('loadMore failed:', err?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, deliveries.length, total]);

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'open',
      packageSize: 'all',
      search: '',
      pickupArea: '',
      dropoffArea: '',
      sort: 'recent',
    });
  }, []);

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.packageSize,
    filters.search,
    filters.pickupArea,
    filters.dropoffArea,
    filters.sort,
  ]);

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return {
    deliveries,
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
    hasMore: deliveries.length < total,
  };
}

export default useDeliveries;