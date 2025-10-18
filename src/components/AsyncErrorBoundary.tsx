/**
 * Async Error Boundary
 * Handles errors from async operations and promises
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../utils/logger';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface AsyncError {
  error: Error;
  timestamp: number;
}

export default function AsyncErrorBoundary({
  children,
  fallback,
  onError,
}: AsyncErrorBoundaryProps) {
  const [asyncError, setAsyncError] = useState<AsyncError | null>(null);

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      
      logger.error('Unhandled Promise Rejection', {
        error: error.message,
        stack: error.stack,
        asyncErrorBoundary: true,
      });

      setAsyncError({
        error,
        timestamp: Date.now(),
      });

      if (onError) {
        onError(error);
      }

      // Prevent the default browser behavior
      event.preventDefault();
    };

    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      
      logger.error('Unhandled Error', {
        error: error.message,
        stack: error.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        asyncErrorBoundary: true,
      });

      setAsyncError({
        error,
        timestamp: Date.now(),
      });

      if (onError) {
        onError(error);
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  const retry = () => {
    setAsyncError(null);
  };

  if (asyncError) {
    if (fallback) {
      return fallback(asyncError.error, retry);
    }

    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={48} color="#FF6B6B" style={styles.icon} />
          
          <Text style={styles.title}>Connection Error</Text>
          
          <Text style={styles.message}>
            Something went wrong while loading data. Please check your connection and try again.
          </Text>

          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                {asyncError.error.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.retryButton}
            onPress={retry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
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
    maxWidth: 300,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  debugContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Hook for handling async errors in components
export function useAsyncError() {
  const [, setError] = useState();
  
  return (error: Error) => {
    setError(() => {
      throw error;
    });
  };
}
