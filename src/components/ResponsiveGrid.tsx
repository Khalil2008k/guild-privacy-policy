/**
 * Responsive Grid Component
 * 
 * TASK 14: iPad Responsive Layouts
 * 
 * Provides a grid layout that:
 * - 1 column on phone
 * - 2 columns on tablet
 * - 3 columns on large tablet
 * - 4 columns on desktop
 * 
 * Usage:
 * <ResponsiveGrid spacing={16}>
 *   <JobCard />
 *   <JobCard />
 *   <JobCard />
 * </ResponsiveGrid>
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive, getResponsiveColumns } from '../utils/responsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  style?: ViewStyle | ViewStyle[];
  minItemWidth?: number; // Minimum width for each item (optional)
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 16,
  style,
  minItemWidth,
}) => {
  const { width } = useResponsive();
  const defaultColumns = getResponsiveColumns();
  
  // Calculate columns based on minItemWidth if provided
  const columns = minItemWidth 
    ? Math.max(1, Math.floor(width / minItemWidth))
    : defaultColumns;

  // Convert children to array
  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.grid, { gap: spacing }, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={[
            styles.gridItem,
            {
              width: `${100 / columns}%`,
              paddingHorizontal: spacing / 2,
              marginBottom: spacing,
            },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8, // Compensate for item padding
  },
  gridItem: {
    minWidth: 0, // Prevent overflow
  },
});

export default ResponsiveGrid;

