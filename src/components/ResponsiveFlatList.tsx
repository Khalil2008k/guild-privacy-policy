/**
 * Responsive FlatList Component
 * 
 * TASK 14: iPad Responsive Layouts
 * 
 * Wrapper around FlatList that automatically adjusts numColumns based on device type
 * 
 * Usage:
 * <ResponsiveFlatList
 *   data={jobs}
 *   renderItem={({ item }) => <JobCard job={item} />}
 *   keyExtractor={(item) => item.id}
 * />
 */

import React from 'react';
import { FlatList, FlatListProps, ViewStyle } from 'react-native';
import { useResponsive, getResponsiveColumns } from '../utils/responsive';

interface ResponsiveFlatListProps<T> extends Omit<FlatListProps<T>, 'numColumns'> {
  forceColumns?: number; // Override automatic column detection
  minItemWidth?: number; // Calculate columns based on minimum item width
}

export function ResponsiveFlatList<T>({
  forceColumns,
  minItemWidth,
  contentContainerStyle,
  columnWrapperStyle,
  ...props
}: ResponsiveFlatListProps<T>) {
  const { width, isTablet } = useResponsive();
  const defaultColumns = getResponsiveColumns();
  
  // Calculate columns
  let columns = forceColumns || defaultColumns;
  
  if (minItemWidth && !forceColumns) {
    columns = Math.max(1, Math.floor(width / minItemWidth));
  }

  // FlatList requires key change when numColumns changes
  const key = `flatlist-${columns}`;

  // Add spacing to column wrapper
  const enhancedColumnWrapperStyle: ViewStyle = {
    paddingHorizontal: isTablet ? 16 : 8,
    gap: isTablet ? 16 : 8,
    ...(columnWrapperStyle as object),
  };

  return (
    <FlatList
      {...props}
      key={key}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? enhancedColumnWrapperStyle : undefined}
      contentContainerStyle={[
        {
          paddingHorizontal: isTablet ? 24 : 16,
          paddingVertical: isTablet ? 24 : 16,
        },
        contentContainerStyle,
      ]}
    />
  );
}

export default ResponsiveFlatList;

