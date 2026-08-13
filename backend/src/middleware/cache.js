// backend/src/middleware/cache.js
import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

// Memory cache for frequent small requests
const memoryCache = new NodeCache({
  stdTTL: parseInt(process.env.MEMORY_CACHE_TTL) || 300, // 5 minutes
  checkperiod: 120,
  useClones: false,
  maxKeys: 500,
});

/**
 * Simple memory-only cache interface
 */
const cache = {
  get: (key) => memoryCache.get(key) || null,
  set: (key, value, ttl = 300) => memoryCache.set(key, value, ttl),
  del: (key) => memoryCache.del(key),
};

/**
 * Cache middleware with configurable duration
 */
export const cacheMiddleware = (duration = 300, keyGenerator = null, options = {}) => {
  const { skipCache = false, userSpecific = false } = options;

  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if explicitly disabled
    if (skipCache || req.headers['x-no-cache']) {
      return next();
    }

    // Generate cache key
    let key;
    if (keyGenerator && typeof keyGenerator === 'function') {
      key = keyGenerator(req);
    } else {
      key = `cache:${req.originalUrl || req.url}`;
    }

    // Add user-specific prefix if needed
    if (userSpecific && req.user) {
      key = `user:${req.user.id}:${key}`;
    }

    try {
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
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 */
export const invalidateCache = async (pattern) => {
  try {
    const memKeys = memoryCache.keys();
    const memMatching = memKeys.filter(key => key.includes(pattern));
    
    if (memMatching.length) {
      memoryCache.del(memMatching);
      logger.debug(`Invalidated ${memMatching.length} cache keys matching pattern "${pattern}"`);
      return memMatching.length;
    }
    
    return 0;
  } catch (error) {
    logger.error('Cache invalidation error:', error);
    return 0;
  }
};

/**
 * Invalidate user-specific cache
 */
export const invalidateUserCache = async (userId) => {
  try {
    const memKeys = memoryCache.keys();
    const matchingKeys = memKeys.filter(key => key.startsWith(`user:${userId}`));
    
    if (matchingKeys.length) {
      memoryCache.del(matchingKeys);
      logger.debug(`Invalidated ${matchingKeys.length} user cache keys for user ${userId}`);
      return matchingKeys.length;
    }
    
    return 0;
  } catch (error) {
    logger.error('User cache invalidation error:', error);
    return 0;
  }
};

/**
 * Clear entire cache
 */
export const clearCache = async () => {
  try {
    const keyCount = memoryCache.keys().length;
    memoryCache.flushAll();
    logger.debug(`Cleared ${keyCount} memory cache keys`);
    return keyCount;
  } catch (error) {
    logger.error('Clear cache error:', error);
    return 0;
  }
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
  const memKeys = memoryCache.keys();
  const memStats = memoryCache.getStats();
  
  return {
    memory: {
      keys: memKeys.length,
      hits: memStats.hits,
      misses: memStats.misses,
      ttl: parseInt(process.env.MEMORY_CACHE_TTL) || 300,
    },
  };
};

/**
 * Cache key generators for common resources
 */
export const keyGenerators = {
  listings: (req) => {
    const { limit, offset, status, category, location } = req.query;
    return `listings:${limit || 20}:${offset || 0}:${status || 'active'}:${category || 'all'}:${location || 'all'}`;
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
    return `search:${q || 'all'}:${category || 'all'}:${minPrice || 0}:${maxPrice || 999999}:${limit || 20}:${offset || 0}`;
  },

  analytics: (req) => {
    const { businessId, days = 30 } = req.query;
    return `analytics:${businessId}:${days}`;
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