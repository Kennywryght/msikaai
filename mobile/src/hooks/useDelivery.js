// mobile/src/hooks/useDelivery.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { deliveriesAPI } from '../services/api';

export function useDelivery(id) {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);

  const abortRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) {
      setDelivery(null);
      return null;
    }

    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const res = await deliveriesAPI.get(id);
      const data = res?.data || {};
      if (!abortRef.current) {
        setDelivery(data.delivery || null);
      }
      return data.delivery || null;
    } catch (err) {
      if (!abortRef.current) {
        const msg =
          err?.response?.data?.error || err?.message || 'Failed to load delivery';
        setError(msg);
        setDelivery(null);
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

  const run = async (fn) => {
    setMutating(true);
    try {
      const result = await fn();
      await load();
      return result;
    } finally {
      setMutating(false);
    }
  };

  // ★ PHASE 3: request to deliver (competitive)
  const accept = useCallback(
    (note = null) => {
      if (!id) return null;
      return run(() => deliveriesAPI.accept(id, note));
    },
    [id]
  );

  // ★ PHASE 3: list courier requests
  const loadCourierRequests = useCallback(async () => {
    if (!id) return [];
    try {
      const res = await deliveriesAPI.courierRequests(id);
      return res?.data?.courierRequests || [];
    } catch (err) {
      console.warn('Failed to load courier requests:', err?.message);
      return [];
    }
  }, [id]);

  // ★ PHASE 3: approve a specific courier request
  const approveCourier = useCallback(
    (courierRequestId, reason = null) => {
      if (!id) return null;
      return run(() => deliveriesAPI.approveCourier(id, courierRequestId, reason));
    },
    [id]
  );

  // ★ PHASE 3: reject a specific courier request
  const rejectCourier = useCallback(
    (courierRequestId, reason = null) => {
      if (!id) return null;
      return run(() => deliveriesAPI.rejectCourier(id, courierRequestId, reason));
    },
    [id]
  );

  // ★ PHASE 3: withdraw my own request
  const withdrawRequest = useCallback(
    (courierRequestId) => {
      if (!id) return null;
      return run(() => deliveriesAPI.withdrawCourierRequest(id, courierRequestId));
    },
    [id]
  );

  const markPickedUp = useCallback(() => {
    if (!id) return null;
    return run(() => deliveriesAPI.pickup(id));
  }, [id]);

  const markDelivered = useCallback(() => {
    if (!id) return null;
    return run(() => deliveriesAPI.deliver(id));
  }, [id]);

  const confirm = useCallback(() => {
    if (!id) return null;
    return run(() => deliveriesAPI.confirm(id));
  }, [id]);

  const cancel = useCallback(
    (reason) => {
      if (!id) return null;
      setMutating(true);
      return deliveriesAPI
        .remove(id, reason)
        .then((result) => result)
        .finally(() => setMutating(false));
    },
    [id]
  );

  return {
    delivery,
    loading,
    error,
    mutating,
    refresh: load,
    accept,
    loadCourierRequests,
    approveCourier,
    rejectCourier,
    withdrawRequest,
    markPickedUp,
    markDelivered,
    confirm,
    cancel,
  };
}

export default useDelivery;