
// React Hooks Optimization with useMemo/useCallback
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Example of heavily optimized component with useMemo/useCallback
interface OptimizedListProps {
  data: Array<{ id: string; title: string; description: string }>;
  onItemPress: (item: { id: string; title: string; description: string }) => void;
  filter?: string;
}

export function OptimizedList({ data, onItemPress, filter }: OptimizedListProps) {
  // Memoize filtered data to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    if (!filter) return data;

    return data.filter(item =>
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.description.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  // Memoize expensive calculations
  const itemCount = useMemo(() => filteredData.length, [filteredData]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleItemPress = useCallback((item: { id: string; title: string; description: string }) => {
    onItemPress(item);
  }, [onItemPress]);

  // Memoize render item function
  const renderItem = useCallback(({ item }: { item: { id: string; title: string; description: string } }) => (
    <OptimizedListItem item={item} onPress={handleItemPress} />
  ), [handleItemPress]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: { id: string; title: string; description: string }) => item.id, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Items: {itemCount}</Text>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />
    </View>
  );
}

// Individual list item with optimization
interface OptimizedListItemProps {
  item: { id: string; title: string; description: string };
  onPress: (item: { id: string; title: string; description: string }) => void;
}

function OptimizedListItem({ item, onPress }: OptimizedListItemProps) {
  // Memoize press handler for this specific item
  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  return (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
}

// Custom hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    lastRenderTime.current = performance.now();

    // Log performance metrics in development
    if (__DEV__) {
      console.log(`${componentName} render #${renderCount.current}`);
    }
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  };
}

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for previous value comparison
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Hook for async operations with cleanup
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (
    asyncFn: (signal: AbortSignal) => Promise<any>
  ): Promise<any> => {
    // Cancel previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const result = await asyncFn(abortControllerRef.current.signal);
      return result;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { execute, loading, error };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
