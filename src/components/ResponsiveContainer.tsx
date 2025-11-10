/**
 * Responsive Container Component
 * 
 * TASK 14: iPad Responsive Layouts
 * 
 * Provides a container that:
 * - Centers content on tablet/desktop with max width
 * - Full width on phone
 * - Responsive padding based on device type
 * 
 * Usage:
 * <ResponsiveContainer centered={true}>
 *   <YourContent />
 * </ResponsiveContainer>
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive, getMaxContentWidth, getResponsivePadding } from '../utils/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  centered?: boolean;
  noPadding?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  centered = true,
  noPadding = false,
}) => {
  const { isTablet, isLargeDevice } = useResponsive();
  const maxWidth = getMaxContentWidth();
  const padding = noPadding ? 0 : getResponsivePadding(16);

  const containerStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: padding,
  };

  if (isTablet && centered) {
    containerStyle.maxWidth = maxWidth;
    containerStyle.alignSelf = 'center';
    containerStyle.width = '100%';
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

export default ResponsiveContainer;

