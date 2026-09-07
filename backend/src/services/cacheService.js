// backend/src/services/cacheService.js
import NodeCache from 'node-cache';
import redisService from './redisService.js';
import { logger } from '../utils/logger.js';

class CacheService {
  constructor() {
    this.memoryCache = new NodeCache({
      stdTTL: parseInt(process.env.MEMORY_CACHE_TTL) || 300,
      checkperiod: 120,
      useClones: false,
      maxKeys: parseInt(process.env.MEMORY_CACHE_MAX_KEYS) || 500,
    });
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  // Set cache item - tries Redis first, falls back to memory
  async set(key, data, ttl = null) {
    const ttlValue = ttl || parseInt(process.env.MEMORY_CACHE_TTL) || 300;
    
    // Try Redis first
    if (redisService.isConnected) {
      try {
        await redisService.set(key, data, ttlValue);
        this.stats.sets++;
        logger.debug(`Redis cache set: ${key} (${ttlValue}s)`);
        return true;
      } catch (error) {
        logger.warn('Redis set error, falling back to memory:', error.message);
      }
    }
    
    // Fallback to memory cache
    const result = this.memoryCache.set(key, data, ttlValue);
    this.stats.sets++;
    logger.debug(`Memory cache set: ${key} (${ttlValue}s)`);
    return result;
  }

  // Get cache item - tries Redis first, falls back to memory
  async get(key) {
    // Try Redis first
    if (redisService.isConnected) {
      try {
        const data = await redisService.get(key);
        if (data !== null) {
          this.stats.hits++;
          logger.debug(`Redis cache hit: ${key}`);
          return data;
        }
      } catch (error) {
        logger.warn('Redis get error, falling back to memory:', error.message);
      }
    }
    
    // Fallback to memory cache
    const data = this.memoryCache.get(key);
    if (data !== undefined) {
      this.stats.hits++;
      logger.debug(`Memory cache hit: ${key}`);
      return data;
    }
    
    this.stats.misses++;
    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  // Delete cache item
  async del(key) {
    let deleted = 0;
    
    // Try Redis first
    if (redisService.isConnected) {
      try {
        await redisService.del(key);
        deleted++;
        this.stats.deletes++;
      } catch (error) {
        logger.warn('Redis del error:', error.message);
      }
    }
    
    // Also delete from memory cache
    if (this.memoryCache.del(key)) {
      deleted++;
      this.stats.deletes++;
    }
    
    logger.debug(`Cache delete: ${key}`);
    return deleted;
  }

  // Clear all cache
  async flush() {
    let count = 0;
    
    // Clear Redis
    if (redisService.isConnected) {
      try {
        await redisService.flush();
        count = 1;
      } catch (error) {
        logger.warn('Redis flush error:', error.message);
      }
    }
    
    // Clear memory cache
    const memSize = this.memoryCache.keys().length;
    this.memoryCache.flushAll();
    count += memSize;
    
    logger.info(`Cache flushed: ${count} items`);
    return count;
  }

  // Get cache keys
  keys() {
    const memKeys = this.memoryCache.keys();
    return memKeys;
  }

  // Get cache stats
  getStats() {
    const stats = this.memoryCache.getStats();
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      cacheStats: stats,
      memorySize: this.memoryCache.keys().length,
      maxKeys: this.memoryCache.options.maxKeys,
      redisConnected: redisService.isConnected,
    };
  }

  // Invalidate by pattern
  async invalidatePattern(pattern) {
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
    const memKeys = this.memoryCache.keys();
    const memToRemove = memKeys.filter(key => key.includes(pattern));
    memToRemove.forEach(key => this.memoryCache.del(key));
    count += memToRemove.length;
    
    logger.info(`Invalidated ${count} cache entries matching: ${pattern}`);
    return count;
  }

  // Get TTL for a key
  getTTL(key) {
    return this.memoryCache.getTtl(key);
  }

  // Check if key exists
  has(key) {
    return this.memoryCache.has(key);
  }

  // Get info
  getInfo() {
    return {
      memorySize: this.memoryCache.keys().length,
      maxKeys: this.memoryCache.options.maxKeys,
      ttl: this.memoryCache.options.stdTTL,
      stats: this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0,
      redisConnected: redisService.isConnected,
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;