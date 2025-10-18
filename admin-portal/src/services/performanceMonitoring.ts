/**
 * Performance Monitoring Service for Admin Portal
 * Tracks Core Web Vitals and admin-specific performance metrics
 */

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PageMetric {
  page: string;
  loadTime: number;
  renderTime: number;
  timestamp: number;
  resources?: {
    scripts: number;
    stylesheets: number;
    images: number;
    total: number;
  };
}

interface UserInteractionMetric {
  action: string;
  element: string;
  duration: number;
  timestamp: number;
}

class AdminPerformanceMonitoringService {
  private isProduction = process.env.NODE_ENV === 'production';
  private webVitals: WebVitalsMetric[] = [];
  private pageMetrics: PageMetric[] = [];
  private interactions: UserInteractionMetric[] = [];
  private pageStartTime: number = Date.now();

  /**
   * Initialize performance monitoring
   */
  initialize() {
    if (this.isProduction) {
      this.setupWebVitalsObserver();
      this.setupNavigationObserver();
      this.setupResourceObserver();
      console.log('📊 Admin performance monitoring initialized for production');
    } else {
      console.log('📊 Admin performance monitoring initialized for development');
    }

    this.collectInitialMetrics();
  }

  /**
   * Record page navigation
   */
  recordPageNavigation(pageName: string) {
    const loadTime = Date.now() - this.pageStartTime;
    
    const pageMetric: PageMetric = {
      page: pageName,
      loadTime,
      renderTime: loadTime,
      timestamp: Date.now(),
      resources: this.getResourceCounts()
    };

    this.pageMetrics.push(pageMetric);

    // Report slow page loads
    if (loadTime > 3000) {
      this.recordCustomMetric('slow_page_load', loadTime, {
        page: pageName,
        severity: loadTime > 8000 ? 'critical' : 'warning'
      });
    }

    if (!this.isProduction) {
      console.log(`📊 Page "${pageName}" loaded in ${loadTime}ms`);
    }

    this.pageStartTime = Date.now();
  }

  /**
   * Record user interaction performance
   */
  recordInteraction(action: string, element: string, startTime: number) {
    const duration = Date.now() - startTime;
    
    const interaction: UserInteractionMetric = {
      action,
      element,
      duration,
      timestamp: Date.now()
    };

    this.interactions.push(interaction);

    // Report slow interactions
    if (duration > 100) { // Slower than 100ms
      this.recordCustomMetric('slow_interaction', duration, {
        action,
        element,
        severity: duration > 300 ? 'critical' : 'warning'
      });
    }
  }

  /**
   * Record custom performance metric
   */
  recordCustomMetric(name: string, value: number, context?: Record<string, any>) {
    if (!this.isProduction) {
      console.log(`📊 Admin Metric "${name}": ${value}`, context);
    }

    // Send to analytics
    this.sendToAnalytics({
      type: 'custom_metric',
      name,
      value,
      context,
      timestamp: Date.now()
    });
  }

  /**
   * Get Core Web Vitals summary
   */
  getWebVitalsSummary() {
    const summary: Record<string, { value: number; rating: string }> = {};
    
    ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'].forEach(metric => {
      const latest = this.webVitals
        .filter(m => m.name === metric)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (latest) {
        summary[metric] = {
          value: latest.value,
          rating: latest.rating
        };
      }
    });

    return summary;
  }

  /**
   * Get performance dashboard data
   */
  getPerformanceDashboard() {
    const now = Date.now();
    const last10Minutes = now - (10 * 60 * 1000);

    const recentPages = this.pageMetrics.filter(p => p.timestamp > last10Minutes);
    const recentInteractions = this.interactions.filter(i => i.timestamp > last10Minutes);

    return {
      webVitals: this.getWebVitalsSummary(),
      avgPageLoadTime: recentPages.length > 0
        ? recentPages.reduce((sum, p) => sum + p.loadTime, 0) / recentPages.length
        : 0,
      slowPages: recentPages.filter(p => p.loadTime > 3000).length,
      avgInteractionTime: recentInteractions.length > 0
        ? recentInteractions.reduce((sum, i) => sum + i.duration, 0) / recentInteractions.length
        : 0,
      slowInteractions: recentInteractions.filter(i => i.duration > 100).length,
      totalPageViews: recentPages.length,
      totalInteractions: recentInteractions.length
    };
  }

  /**
   * Setup Web Vitals observer
   */
  private setupWebVitalsObserver() {
    // Use web-vitals library if available, otherwise implement basic observers
    try {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.onWebVital.bind(this));
        getFID(this.onWebVital.bind(this));
        getFCP(this.onWebVital.bind(this));
        getLCP(this.onWebVital.bind(this));
        getTTFB(this.onWebVital.bind(this));
      }).catch(() => {
        // Fallback to basic performance observers
        this.setupBasicPerformanceObservers();
      });
    } catch (error) {
      this.setupBasicPerformanceObservers();
    }
  }

  /**
   * Handle Web Vitals callback
   */
  private onWebVital(metric: any) {
    const webVitalMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now()
    };

    this.webVitals.push(webVitalMetric);

    // Report poor Web Vitals
    if (metric.rating === 'poor') {
      this.recordCustomMetric(`poor_${metric.name.toLowerCase()}`, metric.value, {
        rating: metric.rating,
        severity: 'warning'
      });
    }

    if (!this.isProduction) {
      console.log(`📊 Web Vital ${metric.name}: ${metric.value} (${metric.rating})`);
    }
  }

  /**
   * Setup basic performance observers (fallback)
   */
  private setupBasicPerformanceObservers() {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Calculate basic metrics
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            const fcp = navEntry.loadEventEnd - navEntry.fetchStart;
            
            this.webVitals.push({
              name: 'TTFB',
              value: ttfb,
              rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
              timestamp: Date.now()
            });

            this.webVitals.push({
              name: 'FCP',
              value: fcp,
              rating: fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor',
              timestamp: Date.now()
            });
          }
        }
      });

      navObserver.observe({ entryTypes: ['navigation'] });

      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordCustomMetric('long_task', entry.duration, {
            startTime: entry.startTime,
            severity: entry.duration > 100 ? 'warning' : 'info'
          });
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task observer not supported
      }
    }
  }

  /**
   * Setup navigation observer
   */
  private setupNavigationObserver() {
    // Monitor route changes (React Router specific)
    let currentPath = window.location.pathname;
    
    const checkRouteChange = () => {
      if (window.location.pathname !== currentPath) {
        this.recordPageNavigation(window.location.pathname);
        currentPath = window.location.pathname;
      }
    };

    // Check for route changes periodically
    setInterval(checkRouteChange, 1000);

    // Also listen to popstate events
    window.addEventListener('popstate', checkRouteChange);
  }

  /**
   * Setup resource observer
   */
  private setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Report slow resources
          if (resource.duration > 2000) {
            this.recordCustomMetric('slow_resource', resource.duration, {
              name: resource.name,
              type: resource.initiatorType,
              size: resource.transferSize,
              severity: resource.duration > 5000 ? 'critical' : 'warning'
            });
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Get resource counts
   */
  private getResourceCounts() {
    if (!('performance' in window)) return undefined;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return {
      scripts: resources.filter(r => r.initiatorType === 'script').length,
      stylesheets: resources.filter(r => r.initiatorType === 'css').length,
      images: resources.filter(r => r.initiatorType === 'img').length,
      total: resources.length
    };
  }

  /**
   * Collect initial metrics
   */
  private collectInitialMetrics() {
    // Record initial page load
    setTimeout(() => {
      this.recordPageNavigation(window.location.pathname);
    }, 100);

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordCustomMetric('memory_usage', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
      }, 60000); // Every minute
    }
  }

  /**
   * Send data to analytics
   */
  private async sendToAnalytics(data: any) {
    try {
      if (this.isProduction) {
        // Send to your analytics endpoint
        await fetch('/api/v1/admin/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
      }
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  }
}

// Export singleton instance
export const adminPerformanceMonitoring = new AdminPerformanceMonitoringService();

// Export React hook
export const useAdminPerformanceMonitoring = () => {
  return {
    recordPageNavigation: adminPerformanceMonitoring.recordPageNavigation.bind(adminPerformanceMonitoring),
    recordInteraction: adminPerformanceMonitoring.recordInteraction.bind(adminPerformanceMonitoring),
    recordCustomMetric: adminPerformanceMonitoring.recordCustomMetric.bind(adminPerformanceMonitoring),
    getWebVitalsSummary: adminPerformanceMonitoring.getWebVitalsSummary.bind(adminPerformanceMonitoring),
    getPerformanceDashboard: adminPerformanceMonitoring.getPerformanceDashboard.bind(adminPerformanceMonitoring)
  };
};

export default adminPerformanceMonitoring;

