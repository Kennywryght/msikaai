// backend/src/middleware/cache.js
import NodeCache from 'node-cache';
import redisService from '../services/redisService.js';
import { logger } from '../utils/logger.js';

// Memory cache as fallback
const memoryCache = new NodeCache({
  stdTTL: parseInt(process.env.MEMORY_CACHE_TTL) || 300,
  checkperiod: 120,
  useClones: false,
  maxKeys: 500,
});

/**
 * Cache interface - tries Redis first, falls back to memory
 */
const cache = {
  get: async (key) => {
    // Try Redis first
    if (redisService.isConnected) {
      try {
        const data = await redisService.get(key);
        if (data !== null) return data;
      } catch (error) {
        logger.warn('Redis get error, falling back to memory:', error.message);
      }
    }
    // Fallback to memory cache
    return memoryCache.get(key) || null;
  },

  set: async (key, value, ttl = 300) => {
    // Try Redis first
    if (redisService.isConnected) {
      try {
        await redisService.set(key, value, ttl);
        return true;
      } catch (error) {
        logger.warn('Redis set error, falling back to memory:', error.message);
      }
    }
    // Fallback to memory cache
    return memoryCache.set(key, value, ttl);
  },

  del: async (key) => {
    let deleted = 0;
    // Try Redis first
    if (redisService.isConnected) {
      try {
        await redisService.del(key);
        deleted++;
      } catch (error) {
        logger.warn('Redis del error:', error.message);
      }
    }
    // Also delete from memory cache
    if (memoryCache.del(key)) {
      deleted++;
    }
    return deleted;
  },
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
      const cachedResponse = await cache.get(key);

      if (cachedResponse) {
        logger.debug(`Cache hit: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = async function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data?.success !== false) {
          await cache.set(key, data, duration);
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
  let count = 0;

  // Invalidate in Redis
  if (redisService.isConnected) {
    try {
      count += await redisService.invalidatePattern(pattern);
    } catch (error) {
      logger.warn('Redis invalidation error:', error.message);
    }
  }

  // Also invalidate in memory
  try {
    const memKeys = memoryCache.keys();
    const memMatching = memKeys.filter(key => key.includes(pattern));
    if (memMatching.length) {
      memoryCache.del(memMatching);
      count += memMatching.length;
    }
  } catch (error) {
    logger.error('Memory cache invalidation error:', error);
  }

  logger.debug(`Invalidated ${count} cache entries matching pattern "${pattern}"`);
  return count;
};

/**
 * Invalidate user-specific cache
 */
export const invalidateUserCache = async (userId) => {
  let count = 0;
  const pattern = `user:${userId}`;

  // Invalidate in Redis
  if (redisService.isConnected) {
    try {
      count += await redisService.invalidatePattern(pattern);
    } catch (error) {
      logger.warn('Redis user invalidation error:', error.message);
    }
  }

  // Also invalidate in memory
  try {
    const memKeys = memoryCache.keys();
    const matchingKeys = memKeys.filter(key => key.startsWith(pattern));
    if (matchingKeys.length) {
      memoryCache.del(matchingKeys);
      count += matchingKeys.length;
    }
  } catch (error) {
    logger.error('Memory user invalidation error:', error);
  }

  logger.debug(`Invalidated ${count} user cache keys for user ${userId}`);
  return count;
};

/**
 * Clear entire cache
 */
export const clearCache = async () => {
  let count = 0;

  // Clear Redis
  if (redisService.isConnected) {
    try {
      await redisService.flush();
      count = 1;
    } catch (error) {
      logger.warn('Redis clear error:', error.message);
    }
  }

  // Clear memory cache
  try {
    const keyCount = memoryCache.keys().length;
    memoryCache.flushAll();
    count += keyCount;
  } catch (error) {
    logger.error('Memory clear error:', error);
  }

  logger.debug(`Cleared ${count} cache entries`);
  return count;
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
    redis: redisService.isConnected ? {
      connected: true,
      keys: redisService.getKeys ? redisService.getKeys().length : 'unknown',
    } : {
      connected: false,
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