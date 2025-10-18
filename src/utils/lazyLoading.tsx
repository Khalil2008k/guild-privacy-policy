/**
 * Lazy Loading Utilities
 * Provides components and hooks for implementing lazy loading to improve performance
 */

import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { logger } from './logger';

// Default loading component
const DefaultLoadingComponent = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
        Loading...
      </Text>
    </View>
  );
};

// Error boundary for lazy loaded components
class LazyLoadErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode; componentName?: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Lazy load error', {
      component: this.props.componentName || 'Unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load component
          </Text>
          <Text style={styles.errorSubtext}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  options: {
    loadingComponent?: ComponentType;
    errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
    componentName?: string;
    preload?: boolean;
  } = {}
) {
  const {
    loadingComponent: LoadingComponent = DefaultLoadingComponent,
    errorComponent: ErrorComponent,
    componentName = 'LazyComponent',
    preload = false,
  } = options;

  // Create lazy component
  const LazyComponent = lazy(() => {
    const startTime = Date.now();
    
    return importFunction()
      .then(module => {
        const loadTime = Date.now() - startTime;
        logger.info('Component lazy loaded', {
          component: componentName,
          loadTime,
        });
        
        // Log slow loads
        if (loadTime > 1000) {
          logger.warn('Slow component load', {
            component: componentName,
            loadTime,
          });
        }
        
        return module;
      })
      .catch(error => {
        logger.error('Component lazy load failed', {
          component: componentName,
          error: error.message,
        });
        throw error;
      });
  });

  // Preload if requested
  if (preload) {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFunction().catch(error => {
        logger.warn('Component preload failed', {
          component: componentName,
          error: error.message,
        });
      });
    }, 100);
  }

  // Return wrapped component
  const WrappedComponent = (props: P) => (
    <LazyLoadErrorBoundary 
      componentName={componentName}
      fallback={ErrorComponent ? <ErrorComponent error={new Error('Load failed')} retry={() => window.location.reload()} /> : undefined}
    >
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );

  WrappedComponent.displayName = `LazyLoaded(${componentName})`;
  
  return WrappedComponent;
}

// Hook for lazy loading data
export function useLazyData<T>(
  dataLoader: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: {
    enabled?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const retryCountRef = React.useRef(0);
  
  const { enabled = true, retryCount = 3, retryDelay = 1000 } = options;

  const loadData = React.useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const result = await dataLoader();
      const loadTime = Date.now() - startTime;
      
      setData(result);
      retryCountRef.current = 0;
      
      logger.info('Data lazy loaded', {
        loadTime,
        dataSize: JSON.stringify(result).length,
      });
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (retryCountRef.current < retryCount) {
        retryCountRef.current += 1;
        
        logger.warn('Data load failed, retrying', {
          error: error.message,
          retryCount: retryCountRef.current,
          maxRetries: retryCount,
        });
        
        setTimeout(() => {
          loadData();
        }, retryDelay * retryCountRef.current);
      } else {
        setError(error);
        logger.error('Data load failed after retries', {
          error: error.message,
          totalRetries: retryCountRef.current,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [dataLoader, enabled, retryCount, retryDelay]);

  React.useEffect(() => {
    loadData();
  }, dependencies);

  const retry = React.useCallback(() => {
    retryCountRef.current = 0;
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    retry,
    reload: loadData,
  };
}

// Component for lazy loading images
export const LazyImage = React.memo<{
  source: { uri: string } | number;
  style?: any;
  placeholder?: ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}>(({ source, style, placeholder, onLoad, onError }) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleLoad = React.useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback((err: any) => {
    const error = new Error('Image load failed');
    setError(error);
    onError?.(error);
  }, [onError]);

  if (error) {
    return (
      <View style={[styles.imagePlaceholder, style]}>
        <Text style={styles.imageErrorText}>Failed to load image</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {!loaded && (placeholder || (
        <View style={[styles.imagePlaceholder, style]}>
          <ActivityIndicator size="small" />
        </View>
      ))}
      <Image
        source={source}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
});

// Utility for preloading components
export const preloadComponent = (
  importFunction: () => Promise<{ default: ComponentType<any> }>,
  componentName: string
) => {
  importFunction()
    .then(() => {
      logger.info('Component preloaded successfully', { component: componentName });
    })
    .catch(error => {
      logger.warn('Component preload failed', {
        component: componentName,
        error: error.message,
      });
    });
};

// Bundle splitting utilities
export const createAsyncComponent = <P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  componentName: string
) => {
  return withLazyLoading(importFunction, {
    componentName,
    preload: false,
  });
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  imagePlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    fontSize: 12,
    color: '#666666',
  },
});
