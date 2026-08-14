// mobile/src/hooks/useCache.js
import { useState, useCallback, useEffect } from 'react';
import cacheService from '../services/cacheService';

export const useCache = () => {
  const [stats, setStats] = useState(() => {
    const info = cacheService.getInfo();
    return {
      size: info.size,
      ttl: info.ttl,
      keys: info.keys || []
    };
  });

  const setCache = useCallback((key, data, ttl) => {
    const result = cacheService.set(key, data, ttl);
    const info = cacheService.getInfo();
    setStats({
      size: info.size,
      ttl: info.ttl,
      keys: info.keys || []
    });
    return result;
  }, []);

  const getCache = useCallback((key) => {
    return cacheService.get(key);
  }, []);

  const removeCache = useCallback((key) => {
    const result = cacheService.delete(key);
    const info = cacheService.getInfo();
    setStats({
      size: info.size,
      ttl: info.ttl,
      keys: info.keys || []
    });
    return result;
  }, []);

  const clearCache = useCallback(() => {
    const result = cacheService.clear();
    setStats({
      size: 0,
      ttl: cacheService.ttl,
      keys: []
    });
    return result;
  }, []);

  const invalidateCache = useCallback((pattern) => {
    const keys = cacheService.keys();
    const toRemove = keys.filter(key => key.includes(pattern));
    toRemove.forEach(key => cacheService.delete(key));
    const info = cacheService.getInfo();
    setStats({
      size: info.size,
      ttl: info.ttl,
      keys: info.keys || []
    });
    return toRemove.length;
  }, []);

  const getCacheStats = useCallback(() => {
    return cacheService.getInfo();
  }, []);

  const getCacheTTL = useCallback((key) => {
    return cacheService.getTTL ? cacheService.getTTL(key) : null;
  }, []);

  const cleanCache = useCallback(() => {
    const cleaned = cacheService.clean ? cacheService.clean() : 0;
    const info = cacheService.getInfo();
    setStats({
      size: info.size,
      ttl: info.ttl,
      keys: info.keys || []
    });
    return cleaned;
  }, []);

  // Auto-refresh stats
  useEffect(() => {
    const interval = setInterval(() => {
      const info = cacheService.getInfo();
      setStats({
        size: info.size,
        ttl: info.ttl,
        keys: info.keys || []
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    setCache,
    getCache,
    removeCache,
    clearCache,
    invalidateCache,
    getCacheStats,
    getCacheTTL,
    cleanCache,
    stats
  };
};

export default useCache;