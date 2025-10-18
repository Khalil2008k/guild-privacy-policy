/**
 * Performance Monitoring Hook
 * Monitors app performance metrics and provides optimization insights
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleLoadTime: number;
  navigationTime: number;
  apiResponseTime: number;
}

interface PerformanceConfig {
  enableMemoryMonitoring?: boolean;
  enableRenderTimeTracking?: boolean;
  enableNavigationTracking?: boolean;
  sampleRate?: number; // 0-1, percentage of events to track
}

const defaultConfig: PerformanceConfig = {
  enableMemoryMonitoring: __DEV__,
  enableRenderTimeTracking: __DEV__,
  enableNavigationTracking: true,
  sampleRate: __DEV__ ? 1 : 0.1, // 100% in dev, 10% in production
};

export function usePerformanceMonitor(
  componentName: string,
  config: PerformanceConfig = defaultConfig
) {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const renderStartTime = useRef<number>(Date.now());
  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);
  const memoryCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Sample rate check
  const shouldTrack = useCallback(() => {
    return Math.random() < (config.sampleRate || defaultConfig.sampleRate!);
  }, [config.sampleRate]);

  // Track render performance
  useEffect(() => {
    if (!config.enableRenderTimeTracking || !shouldTrack()) return;

    const renderEndTime = Date.now();
    const renderTime = renderEndTime - renderStartTime.current;
    renderCount.current += 1;

    setMetrics(prev => ({
      ...prev,
      renderTime,
    }));

    // Log slow renders
    if (renderTime > 100) {
      logger.warn('Slow render detected', {
        component: componentName,
        renderTime,
        renderCount: renderCount.current,
      });
    }

    // Update render start time for next render
    renderStartTime.current = Date.now();
  });

  // Track memory usage
  useEffect(() => {
    if (!config.enableMemoryMonitoring || !shouldTrack()) return;

    const checkMemory = () => {
      // @ts-ignore - performance.memory is not in TypeScript definitions
      const memory = (global as any).performance?.memory;
      if (memory) {
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        
        setMetrics(prev => ({
          ...prev,
          memoryUsage,
        }));

        // Log high memory usage
        if (memoryUsage > 100) {
          logger.warn('High memory usage detected', {
            component: componentName,
            memoryUsage,
            totalMemory: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          });
        }
      }
    };

    // Check memory immediately and then every 10 seconds
    checkMemory();
    memoryCheckInterval.current = setInterval(checkMemory, 10000);

    return () => {
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
    };
  }, [componentName, config.enableMemoryMonitoring, shouldTrack]);

  // Track app state changes
  useEffect(() => {
    if (!shouldTrack()) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const timestamp = Date.now();
      
      logger.info('App state changed', {
        component: componentName,
        appState: nextAppState,
        timestamp,
      });
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [componentName, shouldTrack]);

  // Track component lifecycle
  useEffect(() => {
    if (!shouldTrack()) return;

    const mountEndTime = Date.now();
    const mountDuration = mountEndTime - mountTime.current;

    logger.info('Component mounted', {
      component: componentName,
      mountDuration,
    });

    return () => {
      const unmountTime = Date.now();
      const totalLifetime = unmountTime - mountTime.current;

      logger.info('Component unmounted', {
        component: componentName,
        totalLifetime,
        renderCount: renderCount.current,
      });
    };
  }, [componentName, shouldTrack]);

  // Performance measurement utilities
  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    if (!shouldTrack()) {
      return operation();
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      logger.info('Async operation completed', {
        component: componentName,
        operation: operationName,
        duration,
      });

      // Log slow operations
      if (duration > 1000) {
        logger.warn('Slow async operation', {
          component: componentName,
          operation: operationName,
          duration,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Async operation failed', {
        component: componentName,
        operation: operationName,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }, [componentName, shouldTrack]);

  const measureSync = useCallback(<T>(
    operation: () => T,
    operationName: string
  ): T => {
    if (!shouldTrack()) {
      return operation();
    }

    const startTime = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      
      // Log slow synchronous operations
      if (duration > 16) { // 16ms = 60fps threshold
        logger.warn('Slow sync operation', {
          component: componentName,
          operation: operationName,
          duration: Math.round(duration * 100) / 100,
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('Sync operation failed', {
        component: componentName,
        operation: operationName,
        duration: Math.round(duration * 100) / 100,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }, [componentName, shouldTrack]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    return {
      component: componentName,
      metrics,
      renderCount: renderCount.current,
      uptime: Date.now() - mountTime.current,
    };
  }, [componentName, metrics]);

  return {
    metrics,
    measureAsync,
    measureSync,
    getPerformanceSummary,
  };
}

// Hook for tracking navigation performance
export function useNavigationPerformance() {
  const [navigationMetrics, setNavigationMetrics] = useState<{
    [route: string]: number;
  }>({});

  const trackNavigation = useCallback((routeName: string, startTime: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    setNavigationMetrics(prev => ({
      ...prev,
      [routeName]: duration,
    }));

    logger.info('Navigation completed', {
      route: routeName,
      duration,
    });

    // Log slow navigations
    if (duration > 500) {
      logger.warn('Slow navigation detected', {
        route: routeName,
        duration,
      });
    }
  }, []);

  return {
    navigationMetrics,
    trackNavigation,
  };
}

// Hook for tracking API performance
export function useAPIPerformance() {
  const [apiMetrics, setApiMetrics] = useState<{
    [endpoint: string]: { count: number; averageTime: number; lastTime: number };
  }>({});

  const trackAPICall = useCallback((endpoint: string, duration: number) => {
    setApiMetrics(prev => {
      const existing = prev[endpoint] || { count: 0, averageTime: 0, lastTime: 0 };
      const newCount = existing.count + 1;
      const newAverage = (existing.averageTime * existing.count + duration) / newCount;

      return {
        ...prev,
        [endpoint]: {
          count: newCount,
          averageTime: Math.round(newAverage),
          lastTime: duration,
        },
      };
    });

    logger.info('API call completed', {
      endpoint,
      duration,
    });

    // Log slow API calls
    if (duration > 2000) {
      logger.warn('Slow API call detected', {
        endpoint,
        duration,
      });
    }
  }, []);

  return {
    apiMetrics,
    trackAPICall,
  };
}
