/**
 * Responsive Layout Components
 * 
 * TASK 14: iPad Responsive Layouts
 * 
 * Centralized export for all responsive layout components
 */

export { ResponsiveContainer } from '../ResponsiveContainer';
export { ResponsiveGrid } from '../ResponsiveGrid';
export { SplitView } from '../SplitView';
export { ResponsiveFlatList } from '../ResponsiveFlatList';

// Re-export responsive utilities for convenience
export {
  useResponsive,
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
  BREAKPOINTS,
} from '../../utils/responsive';

