// backend/src/services/redisService.js
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
  }

  async connect() {
    let redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      logger.warn('⚠️ REDIS_URL not configured, using memory cache only');
      return false;
    }

    // ✅ Clean up the URL - remove any whitespace
    redisUrl = redisUrl.trim();

    // ✅ Ensure proper protocol
    if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
      // If it's a raw host:port, add rediss://
      if (redisUrl.includes('upstash.io')) {
        redisUrl = `rediss://${redisUrl}`;
      } else {
        redisUrl = `redis://${redisUrl}`;
      }
    }

    logger.info(`🔄 Connecting to Redis: ${redisUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        retryStrategy: (times) => {
          this.retryAttempts = times;
          if (times > this.maxRetries) {
            logger.warn('⚠️ Redis max retries reached, falling back to memory cache');
            this.isConnected = false;
            return null; // Stop retrying
          }
          const delay = Math.min(times * 100, 3000);
          logger.debug(`🔄 Redis retry ${times}/${this.maxRetries} in ${delay}ms`);
          return delay;
        },
        connectTimeout: 10000,
        lazyConnect: true,
        tls: {
          rejectUnauthorized: false, // Required for Upstash
        },
      });

      // Event handlers
      this.client.on('connect', () => {
        this.isConnected = true;
        this.retryAttempts = 0;
        logger.info('✅ Redis connected');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('✅ Redis ready for commands');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.warn('⚠️ Redis error:', error.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('⚠️ Redis connection closed');
      });

      this.client.on('reconnecting', (delay) => {
        this.isConnected = false;
        logger.debug(`🔄 Redis reconnecting in ${delay}ms`);
      });

      // Connect
      await this.client.connect();

      // Test connection with ping
      const pong = await this.client.ping();
      if (pong === 'PONG') {
        logger.info('✅ Redis ping successful');
        this.isConnected = true;
        return true;
      } else {
        throw new Error('Ping failed');
      }
    } catch (error) {
      this.isConnected = false;
      logger.error('❌ Redis connection failed:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('✅ Redis disconnected');
      } catch (error) {
        logger.error('❌ Redis disconnect error:', error.message);
      }
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      logger.error('Redis get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error.message);
      return false;
    }
  }

  async expire(key, seconds) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error.message);
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected || !this.client) {
      return -2;
    }
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error.message);
      return -2;
    }
  }

  async keys(pattern) {
    if (!this.isConnected || !this.client) {
      return [];
    }
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error.message);
      return [];
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected || !this.client) {
      return 0;
    }
    try {
      const keys = await this.client.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Redis invalidate pattern error:', error.message);
      return 0;
    }
  }

  async flush() {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Redis flush error:', error.message);
      return false;
    }
  }

  async ping() {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  getStats() {
    return {
      connected: this.isConnected,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries,
    };
  }
}

// Create singleton
const redisService = new RedisService();

export default redisService;