/**
 * Performance Optimization Utilities
 * Enterprise-grade performance optimization for React Native
 */

import { InteractionManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: Date;
}

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  persistToDisk?: boolean;
}

// Memory cache implementation
class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expiry: number; size: number }>();
  private totalSize = 0;
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(config: CacheConfig) {
    this.maxSize = config.maxSize;
    this.ttl = config.ttl;
  }

  set(key: string, value: T): void {
    const size = this.calculateSize(value);
    const expiry = Date.now() + this.ttl;

    // Remove expired entries
    this.cleanup();

    // Make room if necessary
    while (this.totalSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.totalSize -= this.cache.get(key)!.size;
    }

    this.cache.set(key, { value, expiry, size });
    this.totalSize += size;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0.85; // Mock value
  }

  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1000; // Default size for non-serializable objects
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.delete(key);
      }
    }
  }

  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.delete(firstKey);
    }
  }
}

// Persistent cache implementation
class PersistentCache<T = any> {
  private memoryCache: MemoryCache<T>;
  private keyPrefix: string;

  constructor(keyPrefix: string, config: CacheConfig) {
    this.keyPrefix = keyPrefix;
    this.memoryCache = new MemoryCache<T>(config);
  }

  async set(key: string, value: T): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, value);

    // Persist to disk
    try {
      const storageKey = `${this.keyPrefix}_${key}`;
      const data = {
        value,
        expiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error: any) {
      logger.error('Failed to persist cache entry', { key, error: error.message });
    }
  }

  async get(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue !== null) {
      return memoryValue;
    }

    // Try disk cache
    try {
      const storageKey = `${this.keyPrefix}_${key}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        
        if (Date.now() < data.expiry) {
          // Add back to memory cache
          this.memoryCache.set(key, data.value);
          return data.value;
        } else {
          // Remove expired entry
          await AsyncStorage.removeItem(storageKey);
        }
      }
    } catch (error: any) {
      logger.error('Failed to read cache entry', { key, error: error.message });
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    try {
      const storageKey = `${this.keyPrefix}_${key}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error: any) {
      logger.error('Failed to delete cache entry', { key, error: error.message });
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.keyPrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error: any) {
      logger.error('Failed to clear cache', { error: error.message });
    }
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

// Lazy loading utility
export function lazy<T>(factory: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  
  return () => {
    if (!promise) {
      promise = factory();
    }
    return promise;
  };
}

// Batch operations utility
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly delay: number;
  private readonly processor: (items: T[]) => Promise<void>;

  constructor(
    processor: (items: T[]) => Promise<void>,
    batchSize: number = 10,
    delay: number = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.delay);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) {
      return;
    }

    const items = [...this.batch];
    this.batch = [];

    try {
      await this.processor(items);
    } catch (error: any) {
      logger.error('Batch processing failed', { 
        batchSize: items.length, 
        error: error.message 
      });
    }
  }
}

// Image optimization utility
export class ImageOptimizer {
  private static cache = new PersistentCache<string>('image_cache', {
    maxSize: 50 * 1024 * 1024, // 50MB
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  static async optimizeImageUrl(
    url: string,
    width?: number,
    height?: number,
    quality?: number
  ): Promise<string> {
    const cacheKey = `${url}_${width}_${height}_${quality}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate optimized URL (this would integrate with your image service)
    let optimizedUrl = url;
    
    if (width || height || quality) {
      const params = new URLSearchParams();
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      if (quality) params.append('q', quality.toString());
      
      optimizedUrl = `${url}?${params.toString()}`;
    }

    // Cache the result
    await this.cache.set(cacheKey, optimizedUrl);
    
    return optimizedUrl;
  }

  static preloadImages(urls: string[]): void {
    // Preload images in the background
    InteractionManager.runAfterInteractions(() => {
      urls.forEach(url => {
        if (Platform.OS === 'web') {
          const img = new Image();
          img.src = url;
        }
        // For React Native, you might use react-native-fast-image or similar
      });
    });
  }
}

// Performance monitoring utility
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly maxMetrics = 1000;

  static startTiming(label: string): () => number {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      logger.debug('Performance timing', { label, duration });
      return duration;
    };
  }

  static async measureAsync<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const endTiming = this.startTiming(label);
    
    try {
      const result = await operation();
      const duration = endTiming();
      
      this.recordMetric({
        renderTime: duration,
        memoryUsage: this.getMemoryUsage(),
        networkLatency: 0,
        cacheHitRate: 0.85,
        errorRate: 0,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  static recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  static getAverageMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics {
    let relevantMetrics = this.metrics;
    
    if (timeRange) {
      relevantMetrics = this.metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (relevantMetrics.length === 0) {
      return {
        renderTime: 0,
        memoryUsage: 0,
        networkLatency: 0,
        cacheHitRate: 0,
        errorRate: 0,
        timestamp: new Date()
      };
    }

    return {
      renderTime: relevantMetrics.reduce((sum, m) => sum + m.renderTime, 0) / relevantMetrics.length,
      memoryUsage: relevantMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / relevantMetrics.length,
      networkLatency: relevantMetrics.reduce((sum, m) => sum + m.networkLatency, 0) / relevantMetrics.length,
      cacheHitRate: relevantMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / relevantMetrics.length,
      errorRate: relevantMetrics.reduce((sum, m) => sum + m.errorRate, 0) / relevantMetrics.length,
      timestamp: new Date()
    };
  }

  private static getMemoryUsage(): number {
    // In a real React Native app, you'd use a native module to get memory usage
    return 0;
  }
}

// List optimization utility for FlatList
export class ListOptimizer {
  static getOptimizedProps(itemCount: number) {
    const windowSize = Math.min(Math.max(itemCount * 0.1, 10), 50);
    const initialNumToRender = Math.min(itemCount, 10);
    
    return {
      windowSize,
      initialNumToRender,
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 50,
      removeClippedSubviews: itemCount > 50,
      getItemLayout: (data: any, index: number) => ({
        length: 80, // Estimated item height
        offset: 80 * index,
        index
      })
    };
  }

  static createKeyExtractor = (item: any, index: number): string => {
    return item.id?.toString() || index.toString();
  };
}

// Bundle optimization utility
export class BundleOptimizer {
  private static loadedModules = new Set<string>();

  static async loadModuleAsync<T>(
    moduleName: string,
    loader: () => Promise<T>
  ): Promise<T> {
    if (this.loadedModules.has(moduleName)) {
      return loader();
    }

    return InteractionManager.runAfterInteractions(async () => {
      const module = await loader();
      this.loadedModules.add(moduleName);
      return module;
    });
  }

  static preloadCriticalModules(loaders: Array<() => Promise<any>>): void {
    InteractionManager.runAfterInteractions(() => {
      loaders.forEach(loader => {
        loader().catch(error => {
          logger.error('Failed to preload module', { error: error.message });
        });
      });
    });
  }
}

// Export cache instances
export const apiCache = new PersistentCache<any>('api_cache', {
  maxSize: 10 * 1024 * 1024, // 10MB
  ttl: 5 * 60 * 1000 // 5 minutes
});

export const userCache = new PersistentCache<any>('user_cache', {
  maxSize: 5 * 1024 * 1024, // 5MB
  ttl: 30 * 60 * 1000 // 30 minutes
});

// Export utilities
export { 
  MemoryCache, 
  PersistentCache, 
  ImageOptimizer, 
  BatchProcessor, 
  ListOptimizer, 
  BundleOptimizer 
};

