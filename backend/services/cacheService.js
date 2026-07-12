const { getRedisClient } = require("../config/redis");
const logger = require("../utils/logger"); // Sovereign Logger

class CacheService {
  constructor() {
    this.client = getRedisClient();

    this.client.on("error", (err) => {
      // Only log once to avoid spamming
      if (!this.useMemoryCache) {
        logger.error(
          "🚨 CRITICAL: Redis Connection Failed! Falling back to IN-MEMORY cache.",
          {
            component: "Redis",
            error: err.message,
            timestamp: new Date().toISOString(),
          },
        );
      }
      this.useMemoryCache = true;
    });

    this.client.on("connect", () => {
      console.log("✅ Redis connected");
      this.useMemoryCache = false;
    });

    this.useMemoryCache = false;
    this.memoryCache = new Map();
  }

  async get(key) {
    if (this.useMemoryCache) {
      return this.memoryCache.get(key);
    }
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      this.useMemoryCache = true; // Switch to memory on runtime error
      return this.memoryCache.get(key);
    }
  }

  async set(key, value, ttl = 60) {
    if (this.useMemoryCache) {
      this.memoryCache.set(key, value);
      // Simple TTL for memory cache
      setTimeout(() => this.memoryCache.delete(key), ttl * 1000).unref();
      return;
    }
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttl);
    } catch (e) {
      this.useMemoryCache = true;
      this.memoryCache.set(key, value);
    }
  }

  async del(key) {
    if (this.useMemoryCache) {
      this.memoryCache.delete(key);
      return;
    }
    try {
      await this.client.del(key);
    } catch (e) {
      this.memoryCache.delete(key);
    }
  }

  async health() {
    if (this.useMemoryCache) return { status: "disconnected", mode: "memory" };
    try {
      await this.client.ping();
      return { status: "connected", mode: "redis" };
    } catch {
      return { status: "disconnected", mode: "memory" };
    }
  }
}

module.exports = new CacheService();
