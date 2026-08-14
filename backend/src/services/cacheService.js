// backend/src/services/cacheService.js
import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

class CacheService {
  constructor() {
    this.cache = new NodeCache({
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

  // Set cache item
  set(key, data, ttl = null) {
    const ttlValue = ttl || parseInt(process.env.MEMORY_CACHE_TTL) || 300;
    const result = this.cache.set(key, data, ttlValue);
    this.stats.sets++;
    logger.debug(`Cache set: ${key} (${ttlValue}s)`);
    return result;
  }

  // Get cache item
  get(key) {
    const data = this.cache.get(key);
    if (data !== undefined) {
      this.stats.hits++;
      logger.debug(`Cache hit: ${key}`);
      return data;
    }
    this.stats.misses++;
    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  // Delete cache item
  del(key) {
    const result = this.cache.del(key);
    this.stats.deletes++;
    logger.debug(`Cache delete: ${key}`);
    return result;
  }

  // Clear all cache
  flush() {
    const size = this.cache.keys().length;
    this.cache.flushAll();
    logger.info(`Cache flushed: ${size} items`);
    return size;
  }

  // Get cache keys
  keys() {
    return this.cache.keys();
  }

  // Get cache stats
  getStats() {
    const stats = this.cache.getStats();
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      cacheStats: stats,
      size: this.cache.keys().length,
      maxKeys: this.cache.options.maxKeys
    };
  }

  // Invalidate by pattern
  invalidatePattern(pattern) {
    const keys = this.cache.keys();
    const toRemove = keys.filter(key => key.includes(pattern));
    toRemove.forEach(key => this.cache.del(key));
    logger.info(`Invalidated ${toRemove.length} cache entries matching: ${pattern}`);
    return toRemove.length;
  }

  // Get TTL for a key
  getTTL(key) {
    return this.cache.getTtl(key);
  }

  // Check if key exists
  has(key) {
    return this.cache.has(key);
  }

  // Get multiple keys
  mget(keys) {
    return this.cache.mget(keys);
  }

  // Set multiple keys
  mset(items) {
    return this.cache.mset(items);
  }

  // Take a key (get and delete)
  take(key) {
    const data = this.get(key);
    if (data) {
      this.del(key);
    }
    return data;
  }

  // Get info
  getInfo() {
    return {
      size: this.cache.keys().length,
      maxKeys: this.cache.options.maxKeys,
      ttl: this.cache.options.stdTTL,
      stats: this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;