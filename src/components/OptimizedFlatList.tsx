import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewToken,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[] | undefined;
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  itemHeight?: number; // Fixed height for getItemLayout optimization
  estimatedItemSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  onEndReachedThreshold?: number;
  enableOptimizations?: boolean;
}

/**
 * Optimized FlatList component with performance best practices
 * - Memoized renderItem
 * - getItemLayout for fixed height items
 * - Optimized window and batch sizes
 * - ViewabilityConfig for tracking visible items
 */
export function OptimizedFlatList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  estimatedItemSize = 100,
  loading = false,
  emptyMessage = 'No items found',
  onEndReachedThreshold = 0.5,
  enableOptimizations = true,
  ...props
}: OptimizedFlatListProps<T>) {
  const { theme } = useTheme();

  // Memoized render function
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItem(item, index);
    },
    [renderItem]
  );

  // Optimized getItemLayout for fixed height items
  const getItemLayout = useMemo(() => {
    if (!itemHeight || !enableOptimizations) return undefined;
    
    return (_: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight, enableOptimizations]);

  // Viewability configuration for tracking visible items
  const viewabilityConfig = useMemo(
    () => ({
      minimumViewTime: 250,
      viewAreaCoveragePercentThreshold: 50,
      waitForInteraction: false,
    }),
    []
  );

  // Handle viewable items change
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // You can add analytics or lazy loading logic here
      if (__DEV__) {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug(`Visible items: ${viewableItems.length}`);
      }
    },
    []
  );

  // Empty component
  const ListEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }, [loading, emptyMessage, theme]);

  // Loading footer
  const ListFooterComponent = useCallback(() => {
    if (!props.onEndReached || !data?.length) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }, [props.onEndReached, data?.length, theme]);

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      // Performance optimizations
      getItemLayout={getItemLayout}
      removeClippedSubviews={enableOptimizations}
      maxToRenderPerBatch={enableOptimizations ? 10 : 50}
      updateCellsBatchingPeriod={enableOptimizations ? 50 : 10}
      initialNumToRender={enableOptimizations ? 10 : 20}
      windowSize={enableOptimizations ? 10 : 21}
      onEndReachedThreshold={onEndReachedThreshold}
      // Viewability tracking
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      // Other optimizations
      maintainVisibleContentPosition={
        enableOptimizations
          ? {
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }
          : undefined
      }
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

/**
 * Memoized list item wrapper to prevent unnecessary re-renders
 */
export const MemoizedListItem = memo(
  <T extends { id: string }>(props: {
    item: T;
    renderItem: (item: T) => React.ReactElement;
  }) => {
    return props.renderItem(props.item);
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if item data changes
    return prevProps.item.id === nextProps.item.id;
  }
);

