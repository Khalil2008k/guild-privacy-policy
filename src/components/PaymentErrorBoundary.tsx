/**
 * Payment Error Boundary
 * Specialized error boundary for payment-related components
 * COMMENT: PRODUCTION HARDENING - Task 2.7 - Add error boundaries for payment failures
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, RefreshCw, ArrowLeft, CreditCard } from 'lucide-react-native';
import { logger } from '../utils/logger';
import { CustomAlertService } from '../services/CustomAlertService';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class PaymentErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Payment Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      paymentErrorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show user-friendly error message
    CustomAlertService.showError(
      'Payment Error',
      'Something went wrong with the payment process. Please try again or contact support if the problem persists.'
    );
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      CustomAlertService.showError(
        'Too Many Retries',
        'Maximum retry attempts reached. Please contact support for assistance.'
      );
      this.handleGoBack();
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Call the onRetry prop if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }

    logger.info('Payment error boundary retry', {
      retryCount: retryCount + 1,
      maxRetries: this.maxRetries,
    });
  };

  handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        this.handleGoHome();
      }
    } catch (error) {
      logger.error('Failed to navigate back from payment error', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.handleGoHome();
    }
  };

  handleGoHome = () => {
    try {
      const fallbackRoute = this.props.fallbackRoute || '/(main)/home';
      router.replace(fallbackRoute);
    } catch (error) {
      logger.error('Failed to navigate to home from payment error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color="#FF6B6B" />
            </View>
            
            <Text style={styles.title}>Payment Error</Text>
            
            <Text style={styles.message}>
              {canRetry 
                ? 'Something went wrong with the payment process. Don\'t worry, no charges have been made. You can try again or go back.'
                : 'Too many errors occurred. Please contact support for assistance.'
              }
            </Text>

            {canRetry && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={this.handleRetry}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={20} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>
                    Try Again ({this.maxRetries - retryCount} left)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={this.handleGoBack}
                  activeOpacity={0.8}
                >
                  <ArrowLeft size={20} color="#666666" />
                  <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {!canRetry && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.supportButton}
                  onPress={this.handleGoHome}
                  activeOpacity={0.8}
                >
                  <CreditCard size={20} color="#FFFFFF" />
                  <Text style={styles.supportButtonText}>Go to Home</Text>
                </TouchableOpacity>
              </View>
            )}

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text style={styles.debugStack}>
                    {this.state.error.stack.substring(0, 500)}...
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#00FF88',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  debugContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  debugStack: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'monospace',
  },
});

export default PaymentErrorBoundary;







