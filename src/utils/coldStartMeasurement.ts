/**
 * Cold Start Time Measurement Utility
 * 
 * COMMENT: PRODUCTION HARDENING - Task 5.5
 * Measures app cold start time (time from app launch to first render)
 * Target: < 3 seconds for cold start
 */

// React Native doesn't have performance.now(), use Date.now() instead
// For higher precision, we'll use Date.now() with millisecond resolution

// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from './logger';

export interface ColdStartMetrics {
  totalTime: number;
  timeToFirstRender: number;
  timeToInteractive: number;
  timestamp: number;
}

class ColdStartMeasurement {
  private static instance: ColdStartMeasurement;
  private startTime: number | null = null;
  private firstRenderTime: number | null = null;
  private interactiveTime: number | null = null;
  private isMeasuring: boolean = false;

  private constructor() {
    // Don't auto-start in constructor - wait for explicit startMeasurement() call
    // This prevents issues with module loading timing
  }

  static getInstance(): ColdStartMeasurement {
    if (!ColdStartMeasurement.instance) {
      ColdStartMeasurement.instance = new ColdStartMeasurement();
    }
    return ColdStartMeasurement.instance;
  }

  /**
   * Start cold start measurement
   * Should be called as early as possible (e.g., in App.tsx or _layout.tsx)
   */
  startMeasurement(): void {
    if (this.isMeasuring) {
      return; // Already measuring
    }

    this.isMeasuring = true;
    this.startTime = Date.now();

    // Log start time
    if (__DEV__) {
      logger.debug(`[Cold Start] Measurement started at ${this.startTime}ms`);
    }
  }

  /**
   * Mark first render complete
   * Should be called after first screen renders
   */
  markFirstRender(): void {
    if (!this.isMeasuring || !this.startTime) {
      return;
    }

    this.firstRenderTime = Date.now();

    if (__DEV__) {
      const timeToFirstRender = this.firstRenderTime - this.startTime;
      logger.debug(`[Cold Start] First render completed at ${timeToFirstRender}ms`);
    }
  }

  /**
   * Mark app interactive (user can interact)
   * Should be called when app is ready for user interaction
   */
  markInteractive(): void {
    if (!this.isMeasuring || !this.startTime) {
      return;
    }

    this.interactiveTime = Date.now();

    const metrics = this.getMetrics();
    this.logMetrics(metrics);
    this.isMeasuring = false;
  }

  /**
   * Get cold start metrics
   */
  getMetrics(): ColdStartMetrics | null {
    if (!this.startTime) {
      return null;
    }

    const now = Date.now();
    const totalTime = this.interactiveTime ? this.interactiveTime - this.startTime : now - this.startTime;
    const timeToFirstRender = this.firstRenderTime ? this.firstRenderTime - this.startTime : 0;
    const timeToInteractive = this.interactiveTime ? this.interactiveTime - this.startTime : totalTime;

    return {
      totalTime,
      timeToFirstRender,
      timeToInteractive,
      timestamp: Date.now(),
    };
  }

  /**
   * Log metrics
   */
  private logMetrics(metrics: ColdStartMetrics | null): void {
    if (!metrics) {
      return;
    }

    if (__DEV__) {
      logger.debug(`\n${'='.repeat(60)}`);
      logger.debug(`[Cold Start] Metrics:`);
      logger.debug(`${'='.repeat(60)}`);
      logger.debug(`Total Time: ${metrics.totalTime.toFixed(2)}ms (${(metrics.totalTime / 1000).toFixed(2)}s)`);
      logger.debug(`Time to First Render: ${metrics.timeToFirstRender.toFixed(2)}ms (${(metrics.timeToFirstRender / 1000).toFixed(2)}s)`);
      logger.debug(`Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms (${(metrics.timeToInteractive / 1000).toFixed(2)}s)`);
      logger.debug(`${'='.repeat(60)}\n`);

      // Check against targets
      const TARGET_COLD_START_MS = 3000; // 3 seconds
      const TARGET_FIRST_RENDER_MS = 1500; // 1.5 seconds
      const TARGET_INTERACTIVE_MS = 3000; // 3 seconds

      if (metrics.totalTime > TARGET_COLD_START_MS) {
        logger.warn(`⚠️  Cold start time exceeds target: ${(metrics.totalTime / 1000).toFixed(2)}s > ${(TARGET_COLD_START_MS / 1000).toFixed(2)}s`);
      } else {
        logger.debug(`✅ Cold start time within target: ${(metrics.totalTime / 1000).toFixed(2)}s < ${(TARGET_COLD_START_MS / 1000).toFixed(2)}s`);
      }

      if (metrics.timeToFirstRender > TARGET_FIRST_RENDER_MS) {
        logger.warn(`⚠️  First render time exceeds target: ${(metrics.timeToFirstRender / 1000).toFixed(2)}s > ${(TARGET_FIRST_RENDER_MS / 1000).toFixed(2)}s`);
      } else {
        logger.debug(`✅ First render time within target: ${(metrics.timeToFirstRender / 1000).toFixed(2)}s < ${(TARGET_FIRST_RENDER_MS / 1000).toFixed(2)}s`);
      }

      if (metrics.timeToInteractive > TARGET_INTERACTIVE_MS) {
        logger.warn(`⚠️  Interactive time exceeds target: ${(metrics.timeToInteractive / 1000).toFixed(2)}s > ${(TARGET_INTERACTIVE_MS / 1000).toFixed(2)}s`);
      } else {
        logger.debug(`✅ Interactive time within target: ${(metrics.timeToInteractive / 1000).toFixed(2)}s < ${(TARGET_INTERACTIVE_MS / 1000).toFixed(2)}s`);
      }
      logger.debug(`${'='.repeat(60)}\n`);
    }
  }

  /**
   * Reset measurement (for testing)
   */
  reset(): void {
    this.startTime = null;
    this.firstRenderTime = null;
    this.interactiveTime = null;
    this.isMeasuring = false;
  }
}

// Export singleton instance
export const coldStartMeasurement = ColdStartMeasurement.getInstance();

/**
 * React hook to mark first render
 */
export function useColdStartMeasurement() {
  React.useEffect(() => {
    coldStartMeasurement.markFirstRender();

    // Mark interactive after a short delay (allowing initial render to complete)
    const timeout = setTimeout(() => {
      coldStartMeasurement.markInteractive();
    }, 100);

    return () => clearTimeout(timeout);
  }, []);
}

// Import React for hooks
import React from 'react';

