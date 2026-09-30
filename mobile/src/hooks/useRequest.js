// mobile/src/hooks/useRequest.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { requestsAPI } from '../services/api';

export function useRequest(id) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);

  const abortRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) {
      setRequest(null);
      return null;
    }

    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const res = await requestsAPI.get(id);
      const data = res?.data || {};
      if (!abortRef.current) {
        setRequest(data.request || null);
      }
      return data.request || null;
    } catch (err) {
      if (!abortRef.current) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load request';
        setError(msg);
        setRequest(null);
      }
      return null;
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      abortRef.current = true;
    };
  }, [load]);

  // ============================================================
  // MUTATIONS
  // ============================================================
  const respond = useCallback(async ({ message, offeredPrice }) => {
    if (!id) return null;
    setMutating(true);
    try {
      const res = await requestsAPI.respond(id, { message, offeredPrice });
      await load();
      return res?.data?.response || null;
    } finally {
      setMutating(false);
    }
  }, [id, load]);

  const acceptResponse = useCallback(async (responseId) => {
    if (!id) return null;
    setMutating(true);
    try {
      const res = await requestsAPI.accept(id, responseId);
      await load();
      return res?.data || null;
    } finally {
      setMutating(false);
    }
  }, [id, load]);

  const withdrawResponse = useCallback(async (responseId) => {
    if (!id) return null;
    setMutating(true);
    try {
      await requestsAPI.withdraw(id, responseId);
      await load();
      return true;
    } finally {
      setMutating(false);
    }
  }, [id, load]);

  const markFulfilled = useCallback(async () => {
    if (!id) return null;
    setMutating(true);
    try {
      await requestsAPI.fulfill(id);
      await load();
      return true;
    } finally {
      setMutating(false);
    }
  }, [id, load]);

  const cancel = useCallback(async () => {
    if (!id) return null;
    setMutating(true);
    try {
      await requestsAPI.remove(id);
      return true;
    } finally {
      setMutating(false);
    }
  }, [id]);

  return {
    request,
    loading,
    error,
    mutating,
    refresh: load,
    respond,
    acceptResponse,
    withdrawResponse,
    markFulfilled,
    cancel,
  };
}

export default useRequest;