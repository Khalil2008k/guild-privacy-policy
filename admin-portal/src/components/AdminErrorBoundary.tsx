/**
 * Admin Error Boundary Component
 * Catches React component errors in the admin portal
 */

import React, { Component, ReactNode } from 'react';
import { adminErrorMonitoring } from '../services/errorMonitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report error to monitoring service
    adminErrorMonitoring.reportError(error, 'high', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorInfo: JSON.stringify(errorInfo)
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default admin error UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>
              We've encountered an unexpected error in the admin portal. 
              The issue has been reported and we're working on a fix.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="error-debug">
                <h4>Debug Information:</h4>
                <pre>{this.state.error.message}</pre>
                <pre>{this.state.error.stack}</pre>
              </div>
            )}

            <button 
              className="error-retry-button" 
              onClick={this.handleRetry}
            >
              Try Again
            </button>
          </div>
          
          <style>{`
            .error-boundary-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 400px;
              padding: 20px;
              background-color: #f5f5f5;
            }
            
            .error-boundary-content {
              background: white;
              border-radius: 12px;
              padding: 32px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              max-width: 500px;
              width: 100%;
            }
            
            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            
            .error-boundary-content h2 {
              color: #333;
              margin-bottom: 16px;
              font-size: 24px;
            }
            
            .error-boundary-content p {
              color: #666;
              line-height: 1.5;
              margin-bottom: 24px;
            }
            
            .error-debug {
              background: #f8f8f8;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
              text-align: left;
            }
            
            .error-debug h4 {
              margin: 0 0 12px 0;
              color: #333;
            }
            
            .error-debug pre {
              font-size: 12px;
              color: #666;
              white-space: pre-wrap;
              word-break: break-word;
              margin: 8px 0;
            }
            
            .error-retry-button {
              background: #007AFF;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            
            .error-retry-button:hover {
              background: #0056CC;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;

