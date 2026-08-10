// backend/src/services/redis.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const cache = {
  get: async (key) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  set: async (key, value, ttl = 3600) => {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  },
  invalidate: async (pattern) => {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  }
};

export default cache;