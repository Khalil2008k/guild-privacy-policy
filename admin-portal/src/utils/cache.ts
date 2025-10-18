/**
 * Simple in-memory cache utility for admin portal
 * Reduces unnecessary Firebase queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expirationTime = ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt: now + expirationTime
    });
  }

  /**
   * Get a value from cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or fetch data with caching
   * If data is in cache and not expired, return it
   * Otherwise, fetch new data and cache it
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch new data
    const data = await fetchFn();
    
    // Cache the result
    this.set(key, data, ttl);
    
    return data;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    this.clearExpired();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.clearExpired();
  }, 5 * 60 * 1000);
}

/**
 * Cache key generators for common queries
 */
export const CacheKeys = {
  users: {
    list: (filters?: any) => `users:list:${JSON.stringify(filters)}`,
    stats: () => 'users:stats',
    detail: (userId: string) => `users:detail:${userId}`,
    all: () => 'users:*'
  },
  
  jobs: {
    list: (filters?: any) => `jobs:list:${JSON.stringify(filters)}`,
    pending: () => 'jobs:pending',
    detail: (jobId: string) => `jobs:detail:${jobId}`,
    all: () => 'jobs:*'
  },
  
  guilds: {
    list: () => 'guilds:list',
    stats: () => 'guilds:stats',
    detail: (guildId: string) => `guilds:detail:${guildId}`,
    all: () => 'guilds:*'
  },
  
  dashboard: {
    stats: (timeRange: string) => `dashboard:stats:${timeRange}`,
    activity: () => 'dashboard:activity',
    all: () => 'dashboard:*'
  }
};

/**
 * Decorator for caching async functions
 */
export function Cacheable(key: string, ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      
      return cache.getOrFetch(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}




