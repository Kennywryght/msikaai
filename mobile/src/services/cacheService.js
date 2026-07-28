// ============================================
// CACHE SERVICE
// ============================================

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
    this.prefix = 'msikaai_cache_';
  }

  // Set cache item
  set(key, data, ttl = this.ttl) {
    const cacheKey = this.prefix + key;
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.set(cacheKey, item);
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Get cache item
  get(key) {
    const cacheKey = this.prefix + key;
    let item = this.cache.get(cacheKey);
    
    // Try localStorage if not in memory
    if (!item) {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          item = JSON.parse(stored);
          // Add to memory cache
          if (item) {
            this.cache.set(cacheKey, item);
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    if (!item) return null;
    
    // Check expiration
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(cacheKey);
      try {
        localStorage.removeItem(cacheKey);
      } catch (e) {}
      return null;
    }
    
    return item.data;
  }

  // Check if key exists
  has(key) {
    return this.get(key) !== null;
  }

  // Delete from cache
  delete(key) {
    const cacheKey = this.prefix + key;
    this.cache.delete(cacheKey);
    try {
      localStorage.removeItem(cacheKey);
    } catch (e) {}
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Clean expired items
  clean() {
    const now = Date.now();
    const toDelete = [];
    
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => {
      this.cache.delete(key);
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });
    
    return toDelete.length;
  }

  // Get all keys
  keys() {
    return Array.from(this.cache.keys());
  }

  // Batch set
  setBatch(items) {
    items.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  // Get multiple
  getBatch(keys) {
    return keys.reduce((acc, key) => {
      acc[key] = this.get(key);
      return acc;
    }, {});
  }

  // Set default TTL
  setDefaultTTL(ttl) {
    this.ttl = ttl;
  }

  // Get cache info
  getInfo() {
    return {
      size: this.size(),
      ttl: this.ttl,
      keys: this.keys()
    };
  }
}

export default new CacheService();