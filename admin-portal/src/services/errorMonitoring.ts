/**
 * Error Monitoring Service for Admin Portal
 * Centralized error handling and reporting for production
 */

interface ErrorReport {
  message: string;
  stack?: string;
  userId?: string | null;
  page?: string | null;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

class AdminErrorMonitoringService {
  private isProduction = process.env.NODE_ENV === 'production';
  private userId: string | null = null;
  private currentPage: string | null = null;

  /**
   * Initialize error monitoring
   */
  initialize(userId?: string) {
    this.userId = userId || null;
    
    if (this.isProduction) {
      this.setupGlobalErrorHandlers();
      console.log('🔍 Admin error monitoring initialized for production');
    } else {
      console.log('🔍 Admin error monitoring initialized for development');
    }
  }

  /**
   * Set current user for error context
   */
  setUser(userId: string) {
    this.userId = userId;
  }

  /**
   * Set current page for error context
   */
  setPage(pageName: string) {
    this.currentPage = pageName;
  }

  /**
   * Report an error manually
   */
  reportError(error: Error, severity: ErrorReport['severity'] = 'medium', context?: Record<string, any>) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      userId: this.userId,
      page: this.currentPage,
      timestamp: Date.now(),
      severity,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        platform: 'admin-portal',
        url: window.location.href
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
      page: this.currentPage,
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
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        'high',
        { type: 'unhandledrejection' }
      );
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.reportError(
        new Error(event.message),
        'high',
        { 
          type: 'global_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });
  }

  /**
   * Send error report to monitoring service
   */
  private async sendErrorReport(errorReport: ErrorReport) {
    try {
      if (this.isProduction) {
        // In production, send to external monitoring service
        await this.sendToExternalService(errorReport);
      } else {
        // In development, log to console
        console.group(`🚨 Admin Error Report [${errorReport.severity.toUpperCase()}]`);
        console.error('Message:', errorReport.message);
        console.error('Stack:', errorReport.stack);
        console.log('User:', errorReport.userId);
        console.log('Page:', errorReport.page);
        console.log('Context:', errorReport.context);
        console.groupEnd();
      }
    } catch (reportingError) {
      console.error('Failed to send error report:', reportingError);
    }
  }

  /**
   * Send to external monitoring service (Sentry, LogRocket, etc.)
   */
  private async sendToExternalService(errorReport: ErrorReport) {
    try {
      // Example: Send to your backend API for logging
      await fetch('/api/v1/admin/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      });
    } catch (error) {
      console.error('Failed to send to external service:', error);
      
      // Fallback: Store in localStorage for later retry
      try {
        const storedErrors = JSON.parse(localStorage.getItem('admin_error_queue') || '[]');
        storedErrors.push(errorReport);
        localStorage.setItem('admin_error_queue', JSON.stringify(storedErrors.slice(-10))); // Keep last 10
      } catch (storageError) {
        console.error('Failed to store error for retry:', storageError);
      }
    }
  }

  /**
   * Test error reporting (development only)
   */
  testErrorReporting() {
    if (!this.isProduction) {
      this.reportError(new Error('Test admin error for monitoring'), 'low', {
        test: true,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Export singleton instance
export const adminErrorMonitoring = new AdminErrorMonitoringService();

export default adminErrorMonitoring;

