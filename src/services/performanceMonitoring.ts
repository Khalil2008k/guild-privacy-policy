/**
 * Performance Monitoring Service for React Native
 * Tracks app performance metrics and user experience
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface ScreenMetrics {
  screenName: string;
  loadTime: number;
  renderTime: number;
  timestamp: number;
}

interface NetworkMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  size?: number;
  timestamp: number;
}

class PerformanceMonitoringService {
  private isProduction = process.env.NODE_ENV === 'production';
  private metrics: PerformanceMetric[] = [];
  private screenMetrics: ScreenMetrics[] = [];
  private networkMetrics: NetworkMetric[] = [];
  private screenStartTimes: Map<string, number> = new Map();

  /**
   * Initialize performance monitoring
   */
  initialize() {
    if (this.isProduction) {
      this.setupPerformanceObservers();
      console.log('📊 Performance monitoring initialized for production');
    } else {
      console.log('📊 Performance monitoring initialized for development');
    }

    // Start collecting basic metrics
    this.collectAppStartMetrics();
  }

  /**
   * Record screen navigation start
   */
  screenNavigationStart(screenName: string) {
    this.screenStartTimes.set(screenName, Date.now());
  }

  /**
   * Record screen navigation complete
   */
  screenNavigationComplete(screenName: string) {
    const startTime = this.screenStartTimes.get(screenName);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      
      const screenMetric: ScreenMetrics = {
        screenName,
        loadTime,
        renderTime: loadTime, // For now, same as load time
        timestamp: Date.now()
      };

      this.screenMetrics.push(screenMetric);
      this.screenStartTimes.delete(screenName);

      // Report slow screens
      if (loadTime > 2000) { // Slower than 2 seconds
        this.recordMetric('slow_screen_load', loadTime, {
          screenName,
          severity: loadTime > 5000 ? 'critical' : 'warning'
        });
      }

      if (!this.isProduction) {
        console.log(`📊 Screen "${screenName}" loaded in ${loadTime}ms`);
      }
    }
  }

  /**
   * Record network request performance
   */
  recordNetworkRequest(url: string, method: string, duration: number, status: number, size?: number) {
    const networkMetric: NetworkMetric = {
      url,
      method,
      duration,
      status,
      size,
      timestamp: Date.now()
    };

    this.networkMetrics.push(networkMetric);

    // Report slow requests
    if (duration > 3000) { // Slower than 3 seconds
      this.recordMetric('slow_network_request', duration, {
        url,
        method,
        status,
        severity: duration > 10000 ? 'critical' : 'warning'
      });
    }

    // Report failed requests
    if (status >= 400) {
      this.recordMetric('network_error', status, {
        url,
        method,
        duration
      });
    }
  }

  /**
   * Record custom performance metric
   */
  recordMetric(name: string, value: number, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);

    if (!this.isProduction) {
      console.log(`📊 Metric "${name}": ${value}`, context);
    }

    // Send to Firebase Performance or analytics
    this.sendMetricToAnalytics(metric);
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      
      this.recordMetric('memory_used', memory.usedJSHeapSize, {
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });

      // Warn about high memory usage
      const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) {
        this.recordMetric('high_memory_usage', memoryUsagePercent, {
          severity: memoryUsagePercent > 90 ? 'critical' : 'warning'
        });
      }
    }
  }

  /**
   * Record frame rate performance
   */
  recordFrameRate(fps: number) {
    this.recordMetric('frame_rate', fps, {
      target: 60,
      performance: fps >= 55 ? 'good' : fps >= 30 ? 'fair' : 'poor'
    });

    // Warn about low frame rates
    if (fps < 30) {
      this.recordMetric('low_frame_rate', fps, {
        severity: fps < 15 ? 'critical' : 'warning'
      });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const last5Minutes = now - (5 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);
    const recentScreens = this.screenMetrics.filter(s => s.timestamp > last5Minutes);
    const recentNetwork = this.networkMetrics.filter(n => n.timestamp > last5Minutes);

    return {
      metrics: recentMetrics.length,
      avgScreenLoadTime: recentScreens.length > 0 
        ? recentScreens.reduce((sum, s) => sum + s.loadTime, 0) / recentScreens.length 
        : 0,
      avgNetworkTime: recentNetwork.length > 0
        ? recentNetwork.reduce((sum, n) => sum + n.duration, 0) / recentNetwork.length
        : 0,
      networkErrors: recentNetwork.filter(n => n.status >= 400).length,
      slowScreens: recentScreens.filter(s => s.loadTime > 2000).length
    };
  }

  /**
   * Setup performance observers (React Native specific)
   */
  private setupPerformanceObservers() {
    // Monitor memory usage periodically
    setInterval(() => {
      this.recordMemoryUsage();
    }, 30000); // Every 30 seconds

    // Monitor frame rate (if available)
    if (typeof requestAnimationFrame !== 'undefined') {
      let lastTime = Date.now();
      let frameCount = 0;

      const measureFrameRate = () => {
        frameCount++;
        const currentTime = Date.now();
        
        if (currentTime - lastTime >= 1000) { // Every second
          const fps = frameCount;
          this.recordFrameRate(fps);
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFrameRate);
      };

      requestAnimationFrame(measureFrameRate);
    }
  }

  /**
   * Collect app startup metrics
   */
  private collectAppStartMetrics() {
    // Record app start time
    this.recordMetric('app_start', Date.now(), {
      platform: 'react-native',
      environment: this.isProduction ? 'production' : 'development'
    });

    // Record initial memory usage
    setTimeout(() => {
      this.recordMemoryUsage();
    }, 1000);
  }

  /**
   * Send metric to analytics service
   */
  private async sendMetricToAnalytics(metric: PerformanceMetric) {
    try {
      if (this.isProduction) {
        // Send to custom analytics endpoint (backend API)
        try {
          // Import backend API dynamically to avoid bundling issues
          const { BackendAnalyticsService } = await import('../config/backend');
          await BackendAnalyticsService.trackEvent('performance_metric', {
            name: metric.name,
            value: metric.value,
            context: metric.context,
            timestamp: metric.timestamp
          });
        } catch (backendError) {
          // Fallback: Store locally for later sync
          const storedMetrics = JSON.parse(
            global.localStorage?.getItem('performance_metrics') || '[]'
          );
          storedMetrics.push(metric);
          
          // Keep only last 100 metrics to prevent storage bloat
          if (storedMetrics.length > 100) {
            storedMetrics.splice(0, storedMetrics.length - 100);
          }
          
          global.localStorage?.setItem('performance_metrics', JSON.stringify(storedMetrics));
        }
      } else {
        // Development: Just log to console
        console.log('📊 Performance Metric:', metric);
      }
    } catch (error) {
      console.error('Failed to send performance metric:', error);
    }
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  private clearOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.screenMetrics = this.screenMetrics.filter(s => s.timestamp > oneHourAgo);
    this.networkMetrics = this.networkMetrics.filter(n => n.timestamp > oneHourAgo);
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Export hook for React components
export const usePerformanceMonitoring = () => {
  return {
    recordMetric: performanceMonitoring.recordMetric.bind(performanceMonitoring),
    screenNavigationStart: performanceMonitoring.screenNavigationStart.bind(performanceMonitoring),
    screenNavigationComplete: performanceMonitoring.screenNavigationComplete.bind(performanceMonitoring),
    recordNetworkRequest: performanceMonitoring.recordNetworkRequest.bind(performanceMonitoring),
    getPerformanceSummary: performanceMonitoring.getPerformanceSummary.bind(performanceMonitoring)
  };
};

export default performanceMonitoring;

