// backend/src/middleware/cache.js
import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';
import redisCache from '../services/redis.js';

// Memory cache for frequent small requests
const memoryCache = new NodeCache({
  stdTTL: parseInt(process.env.MEMORY_CACHE_TTL) || 300, // 5 minutes
  checkperiod: 120,
  useClones: false,
  maxKeys: 500,
});

// Use Redis if available, fallback to memory cache
const useRedis = process.env.REDIS_URL && true;

/**
 * Get cache with fallback
 */
const getCache = () => {
  if (useRedis) {
    return {
      get: async (key) => {
        try {
          const data = await redisCache.get(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          logger.warn('Redis get error, falling back to memory:', error.message);
          return memoryCache.get(key) || null;
        }
      },
      set: async (key, value, ttl = 300) => {
        try {
          await redisCache.set(key, JSON.stringify(value), ttl);
          memoryCache.set(key, value, ttl); // Also store in memory
        } catch (error) {
          logger.warn('Redis set error, falling back to memory:', error.message);
          memoryCache.set(key, value, ttl);
        }
      },
      del: async (key) => {
        try {
          await redisCache.del(key);
          memoryCache.del(key);
        } catch (error) {
          memoryCache.del(key);
        }
      },
    };
  }
  
  // Memory only cache
  return {
    get: (key) => memoryCache.get(key) || null,
    set: (key, value, ttl = 300) => memoryCache.set(key, value, ttl),
    del: (key) => memoryCache.del(key),
  };
};

const cache = getCache();

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
      const cachedResponse = await cache.get(key);

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
          cache.set(key, data, duration).catch(() => {});
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
    let count = 0;
    
    // Invalidate memory cache
    const memKeys = memoryCache.keys();
    const memMatching = memKeys.filter(key => key.includes(pattern));
    if (memMatching.length) {
      memoryCache.del(memMatching);
      count += memMatching.length;
    }

    // Invalidate Redis cache
    if (useRedis) {
      const keys = await redisCache.keys(pattern);
      if (keys.length) {
        await redisCache.del(keys);
        count += keys.length;
      }
    }

    logger.debug(`Invalidated ${count} cache keys matching pattern "${pattern}"`);
    return count;
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
    const pattern = `user:${userId}:*`;
    const count = await invalidateCache(pattern);
    logger.debug(`Invalidated ${count} user cache keys for user ${userId}`);
    return count;
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
    const memKeyCount = memoryCache.keys().length;
    memoryCache.flushAll();
    
    if (useRedis) {
      await redisCache.flushall();
    }
    
    logger.debug(`Cleared ${memKeyCount} memory cache keys and Redis cache`);
    return memKeyCount;
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
    redis: {
      enabled: !!process.env.REDIS_URL,
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