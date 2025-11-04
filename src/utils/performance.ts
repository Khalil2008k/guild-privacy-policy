// Performance optimization utilities for React components

import { useMemo, useCallback, useRef, useEffect } from 'react';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from './logger';

// Memoization helper for expensive computations
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugLabel?: string
): T {
  const value = useMemo(factory, deps);

  if (__DEV__ && debugLabel && process.env.NODE_ENV !== 'production') {
    // Only log in development and when explicitly enabled
    const shouldLog = process.env.EXPO_PUBLIC_DEBUG_PERFORMANCE === 'true';
    if (shouldLog) {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug(`[Performance] ${debugLabel} recomputed`, { 
        deps: deps.map(dep => typeof dep === 'string' ? dep : typeof dep), 
        hasValue: !!value 
      });
    }
  }

  return value;
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update the callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastExecutedRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastExecutedRef.current >= delay) {
      callbackRef.current(...args);
      lastExecutedRef.current = now;
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        lastExecutedRef.current = Date.now();
        timeoutRef.current = undefined;
      }, delay - (now - lastExecutedRef.current));
    }
  }, [delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// Memory usage monitoring (development only)
export function useMemoryMonitor(enabled: boolean = __DEV__) {
  const [memoryInfo, setMemoryInfo] = React.useState<any>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const updateMemoryInfo = () => {
      // @ts-ignore - performance.memory is not in TypeScript definitions
      const memory = (window.performance as any)?.memory;
      if (memory) {
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        });
      }
    };

    const interval = setInterval(updateMemoryInfo, 5000);
    updateMemoryInfo(); // Initial call

    return () => clearInterval(interval);
  }, [enabled]);

  return memoryInfo;
}

// Component render counter (development only)
export function useRenderCounter(componentName: string, enabled: boolean = __DEV__) {
  const renderCount = useRef(0);

  useEffect(() => {
    if (enabled) {
      renderCount.current += 1;
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug(`[Render Counter] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
}

// Bundle size monitoring utility
export function logBundleSize() {
  if (__DEV__) {
    // In development, we can monitor bundle size
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('[Bundle Size] Monitoring enabled');

    // You can integrate with webpack-bundle-analyzer or similar
    // This is a placeholder for actual bundle size monitoring
  }
}

// Image optimization helper
export function getOptimizedImageUrl(
  url: string,
  width: number,
  height?: number,
  quality: number = 80
): string {
  // This would integrate with your image CDN/service
  // For now, return the original URL
  return url;
}

// Network request caching utility
export class RequestCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static size(): number {
    return this.cache.size;
  }
}
