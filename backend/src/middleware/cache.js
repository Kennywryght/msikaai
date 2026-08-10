// backend/src/middleware/cache.js
import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

/**
 * Cache configuration
 */
const cacheConfig = {
  stdTTL: parseInt(process.env.MEMORY_CACHE_TTL) || 600, // 10 minutes default
  checkperiod: 120,
  useClones: false,
  maxKeys: 1000,
};

const cache = new NodeCache(cacheConfig);

/**
 * Cache middleware
 */
export const cacheMiddleware = (duration = 600, keyGenerator = null) => {
  return (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip cache for authenticated user-specific data
    if (req.user && req.path.includes('/me')) {
      return next();
    }
    
    // Generate cache key
    let key;
    if (keyGenerator && typeof keyGenerator === 'function') {
      key = keyGenerator(req);
    } else {
      key = `cache:${req.originalUrl || req.url}`;
    }
    
    // Add user-specific prefix for authenticated requests
    if (req.user) {
      key = `user:${req.user.id}:${key}`;
    }
    
    // Check cache
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      logger.debug(`Cache hit: ${key}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200 && data?.success !== false) {
        cache.set(key, data, duration);
        logger.debug(`Cache set: ${key}`);
        res.setHeader('X-Cache', 'MISS');
      }
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Invalidate cache by pattern
 */
export const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  if (matchingKeys.length > 0) {
    logger.debug(`Invalidating cache: ${matchingKeys.length} keys matching pattern "${pattern}"`);
    cache.del(matchingKeys);
    return matchingKeys.length;
  }
  
  return 0;
};

/**
 * Invalidate user-specific cache
 */
export const invalidateUserCache = (userId) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.startsWith(`user:${userId}`));
  
  if (matchingKeys.length > 0) {
    logger.debug(`Invalidating user cache: ${matchingKeys.length} keys for user ${userId}`);
    cache.del(matchingKeys);
    return matchingKeys.length;
  }
  
  return 0;
};

/**
 * Clear entire cache
 */
export const clearCache = () => {
  const keyCount = cache.keys().length;
  logger.debug(`Clearing entire cache: ${keyCount} keys`);
  cache.flushAll();
  return keyCount;
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
    ttl: cacheConfig.stdTTL,
  };
};

/**
 * Cache key generators for common resources
 */
export const keyGenerators = {
  listings: (req) => {
    const { limit, offset, status, category, location } = req.query;
    return `listings:${limit}:${offset}:${status}:${category}:${location}`;
  },
  
  business: (req) => {
    const { id } = req.params;
    return `business:${id}`;
  },
  
  profile: (req) => {
    const { userId } = req.params;
    return `profile:${userId}`;
  },
  
  search: (req) => {
    const { q, category, minPrice, maxPrice, limit, offset } = req.query;
    return `search:${q}:${category}:${minPrice}:${maxPrice}:${limit}:${offset}`;
  },
};

export default {
  cache,
  cacheMiddleware,
  invalidateCache,
  invalidateUserCache,
  clearCache,
  getCacheStats,
  keyGenerators,
};