import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * GUILD APP THEME SYSTEM
 * 
 * Theme Design Guidelines:
 * - The Guild app follows the home screen theme design as the base
 * - Few different things based on specific screens but maintaining the same overall style
 * - When app background is black/dark, logo should have: white shield icon, white "GUILD" text, and NO neon green background
 * - The logo consists of a shield icon above the "GUILD" text
 * 
 * Background Usage:
 * - theme.background: Main screen backgrounds (welcome, home, etc.) - Pure black (#000000) in dark mode
 * - theme.surface: Cards, modals, elevated surfaces - Dark grey (#2D2D2D) in dark mode
 * - theme.surfaceSecondary: Secondary surfaces, subtle backgrounds - Lighter black (#1A1A1A) in dark mode
 * 
 * Always use theme.background for main screen backgrounds to ensure consistency!
 */

// Theme colors interface
interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  buttonText: string;
  buttonTextSecondary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  
  // Icon colors (adaptive for light/dark modes)
  iconPrimary: string;
  iconSecondary: string;
  iconActive: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  borderActive: string;
  
  // Shadow colors
  shadow: string;
  
  // Button colors
  buttonPrimary: string;
  buttonSecondary: string;
}

// Theme context type
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: ThemeColors;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

// Accent color options
export const ACCENT_COLORS = {
  GREEN: '#BCFF31',
  YELLOW: '#F9CB40',
  BLUE: '#1E90FF',
  PURPLE: '#8A6DF1',
} as const;

// Dark theme with new color palette
const darkTheme: ThemeColors = {
  // Background colors
  background: '#000000', // Pure black - Main screen background (used in welcome screen, etc.)
  surface: '#2D2D2D', // Dark grey - Cards, modals, elevated surfaces
  surfaceSecondary: '#1A1A1A', // Slightly lighter black - Secondary surfaces
  
  // Text colors
  textPrimary: '#FFFFFF', // White
  textSecondary: '#CCCCCC', // Light grey
  buttonText: '#000000', // Black for contrast on neon green
  buttonTextSecondary: '#FFFFFF', // White for secondary buttons
  
  // Primary colors
  primary: '#BCFF31', // Neon green
  primaryLight: '#BCFF3115', // Neon green with transparency
  
  // Icon colors (visible in dark mode)
  iconPrimary: '#BCFF31', // Neon green for primary icons
  iconSecondary: '#CCCCCC', // Light grey for secondary icons
  iconActive: '#BCFF31', // Neon green for active/selected icons
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Border colors
  border: '#404040', // Medium grey
  borderLight: '#333333', // Dark grey
  borderDark: '#1A1A1A', // Very dark grey
  borderActive: '#BCFF31', // Neon green for active borders
  
  // Shadow colors
  shadow: '#000000',
  
  // Button colors
  buttonPrimary: '#BCFF31', // Neon green
  buttonSecondary: 'transparent', // Transparent for secondary buttons
};

// Light theme with eye-friendly color palette (Material Design 3 inspired)
const lightTheme: ThemeColors = {
  // Background colors - Soft, easy on eyes
  background: '#FAFAFA', // Soft off-white - Main screen background (reduces eye strain)
  surface: '#FFFFFF', // Pure white - Cards, modals, elevated surfaces
  surfaceSecondary: '#F5F5F5', // Light grey - Secondary surfaces
  
  // Text colors - High contrast but not harsh
  textPrimary: '#1C1B1F', // Near black (softer than pure black)
  textSecondary: '#49454F', // Medium grey (better readability)
  buttonText: '#000000', // Black for contrast on neon green
  buttonTextSecondary: '#FFFFFF', // White for secondary buttons
  
  // Primary colors
  primary: '#BCFF31', // Neon green (maintained brand color)
  primaryLight: '#BCFF3120', // Neon green with more transparency
  
  // Icon colors (visible in light mode)
  iconPrimary: '#1C1B1F', // Dark grey for primary icons (visible on light bg)
  iconSecondary: '#49454F', // Medium grey for secondary icons
  iconActive: '#2E7D32', // Dark green for active/selected icons (visible but branded)
  
  // Status colors - Material Design 3 palette
  success: '#2E7D32', // Darker green for better contrast
  warning: '#F57C00', // Darker orange for better contrast
  error: '#D32F2F', // Darker red for better contrast
  info: '#1976D2', // Darker blue for better contrast
  
  // Border colors - Subtle and soft
  border: '#E6E1E5', // Soft grey border
  borderLight: '#F4EFF4', // Very light border
  borderDark: '#CAC4D0', // Medium border
  borderActive: '#2E7D32', // Dark green for active borders (visible but branded)
  
  // Shadow colors
  shadow: '#000000',
  
  // Button colors
  buttonPrimary: '#BCFF31', // Neon green
  buttonSecondary: 'transparent', // Transparent for secondary buttons
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ 
  children: React.ReactNode;
  onReady?: () => void;
}> = ({ children, onReady }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [accentColor, setAccentColorState] = useState<string>(ACCENT_COLORS.GREEN);
  const [isReady, setIsReady] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
        
        const savedAccentColor = await AsyncStorage.getItem('accentColor');
        if (savedAccentColor !== null) {
          setAccentColorState(savedAccentColor);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        // Mark as ready after loading preferences
        setIsReady(true);
        if (onReady) {
          onReady();
        }
      }
    };

    loadThemePreference();
  }, [onReady]);

  // Save theme preference to storage
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };

    saveThemePreference();
  }, [isDarkMode]);

  // Save accent color to storage (only after initial load)
  useEffect(() => {
    if (!isReady) return; // Don't save during initial load
    
    const saveAccentColor = async () => {
      try {
        await AsyncStorage.setItem('accentColor', accentColor);
      } catch (error) {
        console.error('Error saving accent color:', error);
      }
    };

    saveAccentColor();
  }, [accentColor, isReady]);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Set accent color
  const setAccentColor = (color: string) => {
    setAccentColorState(color);
  };

  // Get current theme based on dark mode
  const theme = isDarkMode ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    theme,
    accentColor,
    setAccentColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return fallback values instead of throwing error
    console.warn('useTheme called outside ThemeProvider, using fallback values');
    return {
      isDarkMode: true,
      toggleTheme: () => {},
      theme: {
        ...darkTheme,
        iconPrimary: '#BCFF31',
        iconSecondary: '#CCCCCC',
        iconActive: '#BCFF31',
        borderActive: '#BCFF31',
      },
      accentColor: ACCENT_COLORS.GREEN,
      setAccentColor: () => {},
    };
  }
  return context;
};

// Default export for the provider
export default ThemeProvider;