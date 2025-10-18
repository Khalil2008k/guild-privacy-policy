/**
 * Theme Helper Utilities
 * 
 * This file provides utility functions to help developers use the correct
 * theme colors for different UI elements, especially in light mode where
 * some colors need to be adapted for visibility.
 */

import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook to get adaptive colors that work well in both light and dark modes
 */
export const useAdaptiveColors = () => {
  const { theme, isDarkMode } = useTheme();

  return {
    // Use these for icons instead of theme.primary
    iconPrimary: theme.iconPrimary,     // Dark grey in light mode, neon green in dark mode
    iconSecondary: theme.iconSecondary, // Medium grey in both modes
    iconActive: theme.iconActive,       // Dark green in light mode, neon green in dark mode
    
    // Use these for borders instead of theme.primary
    borderDefault: theme.border,        // Soft grey borders
    borderActive: theme.borderActive,   // Dark green in light mode, neon green in dark mode
    
    // Use these for text colors
    textPrimary: theme.textPrimary,     // High contrast text
    textSecondary: theme.textSecondary, // Medium contrast text
    
    // Background colors
    background: theme.background,       // Main screen background
    surface: theme.surface,             // Cards and modals
    surfaceSecondary: theme.surfaceSecondary, // Secondary surfaces
    
    // Brand colors (use sparingly)
    primary: theme.primary,             // Neon green (use for buttons, not small icons)
    primaryLight: theme.primaryLight,   // Transparent neon green
    
    // Status colors (already adapted for light/dark)
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
    info: theme.info,
  };
};

/**
 * Get the appropriate icon color based on the icon's purpose
 */
export const getIconColor = (type: 'primary' | 'secondary' | 'active' | 'brand') => {
  const { theme } = useTheme();
  
  switch (type) {
    case 'primary':
      return theme.iconPrimary;   // Main icons (visible in both modes)
    case 'secondary':
      return theme.iconSecondary; // Secondary icons (subtle)
    case 'active':
      return theme.iconActive;    // Active/selected state
    case 'brand':
      return theme.primary;       // Brand color (use sparingly)
    default:
      return theme.iconPrimary;
  }
};

/**
 * Get the appropriate border color based on the border's purpose
 */
export const getBorderColor = (type: 'default' | 'light' | 'dark' | 'active') => {
  const { theme } = useTheme();
  
  switch (type) {
    case 'default':
      return theme.border;        // Standard borders
    case 'light':
      return theme.borderLight;   // Subtle borders
    case 'dark':
      return theme.borderDark;    // Stronger borders
    case 'active':
      return theme.borderActive;  // Active/selected borders
    default:
      return theme.border;
  }
};

/**
 * Migration guide for existing code:
 * 
 * OLD (invisible in light mode):
 * color={theme.primary}
 * borderColor: theme.primary
 * 
 * NEW (visible in both modes):
 * color={theme.iconPrimary}        // For icons
 * color={theme.iconActive}         // For active/selected icons
 * borderColor: theme.borderActive  // For active borders
 * borderColor: theme.border        // For default borders
 */

