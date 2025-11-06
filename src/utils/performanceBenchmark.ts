/**
 * Performance Benchmarking Utility
 * 
 * COMMENT: PRODUCTION HARDENING - Task 5.3
 * - Uses performance.now() for high-precision timing
 * - Logs benchmarks via logger utility
 * - Tracks performance metrics for critical operations
 * - Disables in production builds (performance only, not security)
 */

import { logger } from './logger';

export interface BenchmarkResult {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  operation: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  count: number;
  totalDuration: number;
}

class PerformanceBenchmark {
  private static instance: PerformanceBenchmark;
  private metrics: Map<string, BenchmarkResult[]> = new Map();
  private enabled: boolean = __DEV__; // Only enabled in development by default

  private constructor() {
    // Allow enabling via environment variable in production for monitoring
    if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true') {
      this.enabled = true;
    }
  }

  static getInstance(): PerformanceBenchmark {
    if (!PerformanceBenchmark.instance) {
      PerformanceBenchmark.instance = new PerformanceBenchmark();
    }
    return PerformanceBenchmark.instance;
  }

  /**
   * Enable or disable performance benchmarking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if benchmarking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Measure the duration of a synchronous operation
   */
  measureSync<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.enabled) {
      return fn();
    }

    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure the duration of an asynchronous operation
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    const result: BenchmarkResult = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    // Store metric
    const metrics = this.metrics.get(operation) || [];
    metrics.push(result);
    
    // Keep only last 100 metrics per operation
    if (metrics.length > 100) {
      metrics.shift();
    }
    this.metrics.set(operation, metrics);

    // Log performance (only in development)
    if (__DEV__) {
      const logLevel = duration > 1000 ? 'WARN' : 'INFO'; // Warn if > 1 second
      const message = `⏱️ ${operation}: ${duration.toFixed(2)}ms`;
      
      if (logLevel === 'WARN') {
        logger.warn(message, metadata || {});
      } else {
        logger.info(message, metadata || {});
      }
    }
  }

  /**
   * Get performance metrics for a specific operation
   */
  getMetrics(operation: string): PerformanceMetrics | null {
    const results = this.metrics.get(operation);
    if (!results || results.length === 0) {
      return null;
    }

    const durations = results.map(r => r.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      operation,
      avgDuration,
      minDuration,
      maxDuration,
      count: results.length,
      totalDuration,
    };
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    const operations = Array.from(this.metrics.keys());
    return operations
      .map(op => this.getMetrics(op))
      .filter((m): m is PerformanceMetrics => m !== null);
  }

  /**
   * Clear metrics for a specific operation
   */
  clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get a summary report of all performance metrics
   */
  getSummaryReport(): {
    totalOperations: number;
    slowOperations: PerformanceMetrics[];
    averageDurations: Record<string, number>;
  } {
    const allMetrics = this.getAllMetrics();
    const slowOperations = allMetrics.filter(m => m.avgDuration > 500); // > 500ms
    
    const averageDurations: Record<string, number> = {};
    allMetrics.forEach(m => {
      averageDurations[m.operation] = m.avgDuration;
    });

    return {
      totalOperations: allMetrics.length,
      slowOperations,
      averageDurations,
    };
  }
}

// Export singleton instance
export const performanceBenchmark = PerformanceBenchmark.getInstance();

/**
 * Hook to measure React component render performance
 */
export function usePerformanceBenchmark(componentName: string) {
  const renderStartTime = React.useRef<number | null>(null);

  React.useEffect(() => {
    renderStartTime.current = performance.now();
  });

  React.useEffect(() => {
    if (renderStartTime.current !== null) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceBenchmark.recordMetric(
        `component_render:${componentName}`,
        renderTime,
        { component: componentName }
      );
    }
  });
}

/**
 * Decorator/HOF to wrap async functions with performance benchmarking
 */
export function benchmark<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    return performanceBenchmark.measureAsync(operation, () => fn(...args), {
      args: args.length,
    });
  }) as T;
}

/**
 * Decorator/HOF to wrap sync functions with performance benchmarking
 */
export function benchmarkSync<T extends (...args: any[]) => any>(
  operation: string,
  fn: T
): T {
  return ((...args: Parameters<T>) => {
    return performanceBenchmark.measureSync(operation, () => fn(...args), {
      args: args.length,
    });
  }) as T;
}

// Import React for hooks (conditional to avoid issues in non-React contexts)
import React from 'react';







