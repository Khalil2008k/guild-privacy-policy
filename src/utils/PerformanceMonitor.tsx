
// Advanced Performance Monitoring with Memory Leak Detection
import React, { useEffect, useRef, useCallback } from 'react';
import { PerformanceObserver, performance } from 'perf_hooks';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  eventListeners: number;
}

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private observers: PerformanceObserver[] = [];
  private intervalId?: NodeJS.Timeout;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (this.intervalId) return; // Already monitoring

    // Monitor memory usage every 5 seconds
    this.intervalId = setInterval(() => {
      this.takeMemorySnapshot();
    }, 5000);

    // Monitor performance entries
    if (typeof PerformanceObserver !== 'undefined') {
      this.setupPerformanceObservers();
    }

    console.log('🚀 Performance monitoring started');
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    console.log('⏹️  Performance monitoring stopped');
  }

  private setupPerformanceObservers() {
    // Monitor navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          this.recordMetric({
            renderTime: entry.loadEventEnd - entry.fetchStart,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            componentCount: this.getComponentCount(),
            eventListeners: this.getEventListenerCount(),
          });
        }
      }
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navigationObserver);

    // Monitor measure entries
    const measureObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            renderTime: entry.duration,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            componentCount: this.getComponentCount(),
            eventListeners: this.getEventListenerCount(),
          });
        }
      }
    });

    measureObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(measureObserver);
  }

  private takeMemorySnapshot() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      };

      this.memorySnapshots.push(snapshot);

      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots.shift();
      }

      // Detect potential memory leaks
      this.detectMemoryLeaks();
    }
  }

  private detectMemoryLeaks() {
    if (this.memorySnapshots.length < 10) return;

    const recent = this.memorySnapshots.slice(-5);
    const older = this.memorySnapshots.slice(-10, -5);

    const recentAvg = recent.reduce((sum, snap) => sum + snap.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, snap) => sum + snap.heapUsed, 0) / older.length;

    const growthRate = (recentAvg - olderAvg) / olderAvg;

    if (growthRate > 0.1) { // 10% growth
      console.warn('⚠️  Potential memory leak detected:', {
        growthRate: `${(growthRate * 100).toFixed(2)}%`,
        recentAvg: `${(recentAvg / 1024 / 1024).toFixed(2)} MB`,
        olderAvg: `${(olderAvg / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  }

  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push({
      ...metric,
      memoryUsage: metric.memoryUsage / 1024 / 1024, // Convert to MB
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  private getComponentCount(): number {
    // This would need to be implemented based on your component tracking
    return 0;
  }

  private getEventListenerCount(): number {
    // This would need to be implemented based on your event listener tracking
    return 0;
  }

  getPerformanceReport(): {
    averageRenderTime: number;
    averageMemoryUsage: number;
    totalSnapshots: number;
    memoryLeakDetected: boolean;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageMemoryUsage: 0,
        totalSnapshots: 0,
        memoryLeakDetected: false,
        recommendations: [],
      };
    }

    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;

    const recommendations = this.generateRecommendations(avgRenderTime, avgMemoryUsage);

    return {
      averageRenderTime: avgRenderTime,
      averageMemoryUsage: avgMemoryUsage,
      totalSnapshots: this.memorySnapshots.length,
      memoryLeakDetected: this.memorySnapshots.length > 10 && this.detectMemoryLeaks(),
      recommendations,
    };
  }

  private generateRecommendations(avgRenderTime: number, avgMemoryUsage: number): string[] {
    const recommendations: string[] = [];

    if (avgRenderTime > 100) {
      recommendations.push('Consider optimizing component renders with React.memo');
      recommendations.push('Use useMemo and useCallback for expensive calculations');
    }

    if (avgMemoryUsage > 50) {
      recommendations.push('Monitor for memory leaks in components');
      recommendations.push('Use React DevTools Profiler to identify performance issues');
    }

    return recommendations;
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitorRef = useRef(PerformanceMonitor.getInstance());
  const renderStartTime = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    // Record render time for this component
    monitorRef.current.recordMetric({
      renderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      componentCount: 1,
      eventListeners: 0,
    });

    return () => {
      // Cleanup effect
    };
  });

  const getReport = useCallback(() => {
    return monitorRef.current.getPerformanceReport();
  }, []);

  return { getReport };
}
