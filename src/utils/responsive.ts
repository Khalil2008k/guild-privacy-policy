/**
 * Responsive Layout Utilities
 * PRODUCTION HARDENING - Task 4.10: Ensure responsive layout works on tablet and large devices
 * 
 * Provides responsive breakpoints and utilities for:
 * - Tablet detection (width > 600px or height > 600px)
 * - Large device detection (width > 900px)
 * - Responsive sizing utilities
 * - Adaptive spacing and layout helpers
 */

import React from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

// Breakpoints (in points, not pixels)
export const BREAKPOINTS = {
  SMALL_PHONE: 320,
  PHONE: 375,
  LARGE_PHONE: 414,
  TABLET: 600,
  LARGE_TABLET: 900,
  DESKTOP: 1200,
} as const;

/**
 * Device type detection
 */
export type DeviceType = 'phone' | 'tablet' | 'large' | 'desktop';

/**
 * Get current window dimensions
 */
export const getWindowDimensions = (): ScaledSize => {
  return Dimensions.get('window');
};

/**
 * Get current screen dimensions
 */
export const getScreenDimensions = (): ScaledSize => {
  return Dimensions.get('screen');
};

/**
 * Check if device is a tablet
 * Tablet: width > 600 OR height > 600 (landscape/portrait)
 */
export const isTablet = (): boolean => {
  const { width, height } = getWindowDimensions();
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  
  // Tablet if smallest dimension > 600 OR if both dimensions are large
  return minDimension > 600 || (minDimension > 480 && maxDimension > 800);
};

/**
 * Check if device is a large tablet/desktop
 */
export const isLargeDevice = (): boolean => {
  const { width } = getWindowDimensions();
  return width > BREAKPOINTS.LARGE_TABLET;
};

/**
 * Get device type
 */
export const getDeviceType = (): DeviceType => {
  const { width } = getWindowDimensions();
  
  if (width > BREAKPOINTS.DESKTOP) {
    return 'desktop';
  } else if (width > BREAKPOINTS.LARGE_TABLET) {
    return 'large';
  } else if (isTablet()) {
    return 'tablet';
  } else {
    return 'phone';
  }
};

/**
 * Get responsive value based on device type
 * Usage: getResponsiveValue({ phone: 16, tablet: 24, large: 32 })
 */
export const getResponsiveValue = <T>(values: {
  phone?: T;
  tablet?: T;
  large?: T;
  desktop?: T;
}): T => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'desktop':
      return values.desktop ?? values.large ?? values.tablet ?? values.phone!;
    case 'large':
      return values.large ?? values.tablet ?? values.phone!;
    case 'tablet':
      return values.tablet ?? values.phone!;
    case 'phone':
    default:
      return values.phone!;
  }
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (baseSize: number): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'desktop':
      return baseSize * 1.5;
    case 'large':
      return baseSize * 1.3;
    case 'tablet':
      return baseSize * 1.15;
    case 'phone':
    default:
      return baseSize;
  }
};

/**
 * Get responsive padding
 */
export const getResponsivePadding = (basePadding: number): number => {
  return getResponsiveValue({
    phone: basePadding,
    tablet: basePadding * 1.5,
    large: basePadding * 2,
    desktop: basePadding * 2.5,
  });
};

/**
 * Get responsive margin
 */
export const getResponsiveMargin = (baseMargin: number): number => {
  return getResponsiveValue({
    phone: baseMargin,
    tablet: baseMargin * 1.5,
    large: baseMargin * 2,
    desktop: baseMargin * 2.5,
  });
};

/**
 * Get responsive border radius
 */
export const getResponsiveBorderRadius = (baseRadius: number): number => {
  return getResponsiveValue({
    phone: baseRadius,
    tablet: baseRadius * 1.2,
    large: baseRadius * 1.5,
    desktop: baseRadius * 1.5,
  });
};

/**
 * Get number of columns for grid layouts
 */
export const getResponsiveColumns = (): number => {
  return getResponsiveValue({
    phone: 1,
    tablet: 2,
    large: 3,
    desktop: 4,
  });
};

/**
 * Get maximum content width for centered layouts
 */
export const getMaxContentWidth = (): number => {
  const { width } = getWindowDimensions();
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'desktop':
      return 1200;
    case 'large':
      return 1000;
    case 'tablet':
      return 800;
    case 'phone':
    default:
      return width;
  }
};

/**
 * Check if device is in landscape orientation
 */
export const isLandscape = (): boolean => {
  const { width, height } = getWindowDimensions();
  return width > height;
};

/**
 * Check if device is in portrait orientation
 */
export const isPortrait = (): boolean => {
  return !isLandscape();
};

/**
 * Responsive hook for dimensions changes
 * Usage: const { width, height, isTablet } = useResponsive();
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = React.useState(() => getWindowDimensions());
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    isTablet: isTablet(),
    isLargeDevice: isLargeDevice(),
    deviceType: getDeviceType(),
    isLandscape: isLandscape(),
    isPortrait: isPortrait(),
  };
};

/**
 * Responsive style helper
 * Usage: const styles = createResponsiveStyles({ padding: { phone: 16, tablet: 24 } })
 */
export const createResponsiveStyles = <T extends Record<string, any>>(
  styleDefinitions: {
    [K in keyof T]: T[K] | {
      phone?: T[K];
      tablet?: T[K];
      large?: T[K];
      desktop?: T[K];
    };
  }
): T => {
  const deviceType = getDeviceType();
  
  const styles = {} as T;
  
  for (const [key, value] of Object.entries(styleDefinitions)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if it's a responsive object
      if ('phone' in value || 'tablet' in value || 'large' in value || 'desktop' in value) {
        styles[key as keyof T] = getResponsiveValue(value as any);
      } else {
        // Regular object, use as-is
        styles[key as keyof T] = value as T[Extract<keyof T, string>];
      }
    } else {
      // Primitive value, use as-is
      styles[key as keyof T] = value as T[Extract<keyof T, string>];
    }
  }
  
  return styles;
};

export default {
  BREAKPOINTS,
  isTablet,
  isLargeDevice,
  getDeviceType,
  getResponsiveValue,
  getResponsiveFontSize,
  getResponsivePadding,
  getResponsiveMargin,
  getResponsiveBorderRadius,
  getResponsiveColumns,
  getMaxContentWidth,
  isLandscape,
  isPortrait,
  useResponsive,
  createResponsiveStyles,
  getWindowDimensions,
  getScreenDimensions,
};

