/**
 * Error Monitoring Service
 * Centralized error handling and reporting for production
 */

interface ErrorReport {
  message: string;
  stack?: string;
  userId?: string;
  screen?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

class ErrorMonitoringService {
  private isProduction = process.env.NODE_ENV === 'production';
  private userId: string | null = null;
  private currentScreen: string | null = null;

  /**
   * Initialize error monitoring
   */
  initialize(userId?: string) {
    this.userId = userId || null;
    
    if (this.isProduction) {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      console.log('🔍 Error monitoring initialized for production');
    } else {
      console.log('🔍 Error monitoring initialized for development');
    }
  }

  /**
   * Set current user for error context
   */
  setUser(userId: string) {
    this.userId = userId;
  }

  /**
   * Set current screen for error context
   */
  setScreen(screenName: string) {
    this.currentScreen = screenName;
  }

  /**
   * Report an error manually
   */
  reportError(error: Error, severity: ErrorReport['severity'] = 'medium', context?: Record<string, any>) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      userId: this.userId,
      screen: this.currentScreen,
      timestamp: Date.now(),
      severity,
      context: {
        ...context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
        platform: 'mobile'
      }
    };

    this.sendErrorReport(errorReport);
  }

  /**
   * Report a custom message
   */
  reportMessage(message: string, severity: ErrorReport['severity'] = 'low', context?: Record<string, any>) {
    const errorReport: ErrorReport = {
      message,
      userId: this.userId,
      screen: this.currentScreen,
      timestamp: Date.now(),
      severity,
      context
    };

    this.sendErrorReport(errorReport);
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.reportError(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          'high',
          { type: 'unhandledrejection' }
        );
      });
    }

    // React Native specific error handling
    if (typeof ErrorUtils !== 'undefined') {
      const originalHandler = ErrorUtils.getGlobalHandler();
      
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.reportError(error, isFatal ? 'critical' : 'high', {
          type: 'global_error',
          isFatal
        });
        
        // Call original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }

  /**
   * Send error report to monitoring service
   */
  private async sendErrorReport(errorReport: ErrorReport) {
    try {
      if (this.isProduction) {
        // In production, send to Firebase Crashlytics or external service
        await this.sendToErrorTracking(errorReport);
      } else {
        // In development, log to console
        console.group(`🚨 Error Report [${errorReport.severity.toUpperCase()}]`);
        console.error('Message:', errorReport.message);
        console.error('Stack:', errorReport.stack);
        console.log('User:', errorReport.userId);
        console.log('Screen:', errorReport.screen);
        console.log('Context:', errorReport.context);
        console.groupEnd();
      }
    } catch (reportingError) {
      console.error('Failed to send error report:', reportingError);
    }
  }

  /**
   * Send to error tracking service
   */
  private async sendToErrorTracking(errorReport: ErrorReport) {
    try {
      if (this.isProduction) {
        // Send to backend error tracking endpoint
        try {
          const { BackendAnalyticsService } = await import('../config/backend');
          await BackendAnalyticsService.trackEvent('error_report', {
            message: errorReport.message,
            stack: errorReport.stack,
            severity: errorReport.severity,
            screen: errorReport.screen,
            context: errorReport.context,
            timestamp: errorReport.timestamp,
            userId: errorReport.userId
          });
        } catch (backendError) {
          // Fallback: Store locally for later sync
          const storedErrors = JSON.parse(
            global.localStorage?.getItem('error_reports') || '[]'
          );
          storedErrors.push(errorReport);
          
          // Keep only last 50 errors to prevent storage bloat
          if (storedErrors.length > 50) {
            storedErrors.splice(0, storedErrors.length - 50);
          }
          
          global.localStorage?.setItem('error_reports', JSON.stringify(storedErrors));
        }
      } else {
        // Development: Enhanced console logging
        console.group(`🚨 Error Report [${errorReport.severity.toUpperCase()}]`);
        console.error('Message:', errorReport.message);
        if (errorReport.stack) console.error('Stack:', errorReport.stack);
        if (errorReport.screen) console.log('Screen:', errorReport.screen);
        if (errorReport.userId) console.log('User:', errorReport.userId);
        if (errorReport.context) console.log('Context:', errorReport.context);
        console.groupEnd();
      }
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  /**
   * Test error reporting (development only)
   */
  testErrorReporting() {
    if (!this.isProduction) {
      this.reportError(new Error('Test error for monitoring'), 'low', {
        test: true,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// Export hook for React components
export const useErrorMonitoring = () => {
  return {
    reportError: errorMonitoring.reportError.bind(errorMonitoring),
    reportMessage: errorMonitoring.reportMessage.bind(errorMonitoring),
    setScreen: errorMonitoring.setScreen.bind(errorMonitoring),
    testErrorReporting: errorMonitoring.testErrorReporting.bind(errorMonitoring)
  };
};

export default errorMonitoring;

