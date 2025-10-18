/**
 * Route Error Boundary
 * Specialized error boundary for route-level errors with navigation recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  routeName?: string;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class RouteErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
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
    const { routeName } = this.props;
    
    logger.error('Route Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      routeName,
      retryCount: this.state.retryCount,
      routeErrorBoundary: true,
    });

    // Auto-navigate to fallback route if too many retries
    if (this.state.retryCount >= this.maxRetries) {
      const fallbackRoute = this.props.fallbackRoute || '/(main)/home';
      
      setTimeout(() => {
        try {
          router.replace(fallbackRoute);
        } catch (navError) {
          logger.error('Failed to navigate to fallback route', {
            fallbackRoute,
            navError: navError instanceof Error ? navError.message : String(navError),
          });
        }
      }, 2000);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    try {
      router.replace('/(main)/home');
    } catch (error) {
      logger.error('Failed to navigate to home', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        this.handleGoHome();
      }
    } catch (error) {
      logger.error('Failed to navigate back', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.handleGoHome();
    }
  };

  render() {
    if (this.state.hasError) {
      const { routeName } = this.props;
      const { retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons 
              name="alert-circle" 
              size={64} 
              color="#FF6B6B" 
              style={styles.icon} 
            />
            
            <Text style={styles.title}>
              {canRetry ? 'Page Error' : 'Too Many Errors'}
            </Text>
            
            <Text style={styles.message}>
              {canRetry 
                ? `There was a problem loading ${routeName || 'this page'}. You can try again or go back.`
                : 'This page is experiencing repeated errors. You will be redirected to the home screen.'
              }
            </Text>

            {canRetry && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={this.handleRetry}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Try Again ({this.maxRetries - retryCount} left)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={this.handleGoBack}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={20} color="#666666" />
                  <Text style={styles.secondaryButtonText}>Go Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={this.handleGoHome}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home" size={20} color="#666666" />
                  <Text style={styles.secondaryButtonText}>Home</Text>
                </TouchableOpacity>
              </View>
            )}

            {!canRetry && (
              <View style={styles.redirectContainer}>
                <Text style={styles.redirectText}>
                  Redirecting to home screen...
                </Text>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            )}

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.message}
                </Text>
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
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  redirectContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  redirectText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  debugContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
});

export default RouteErrorBoundary;
