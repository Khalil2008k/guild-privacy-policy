import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
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
  background: '#000000', // Pure black
  surface: '#2D2D2D', // Dark grey
  surfaceSecondary: '#1A1A1A', // Slightly lighter black
  
  // Text colors
  textPrimary: '#FFFFFF', // White
  textSecondary: '#CCCCCC', // Light grey
  buttonText: '#000000', // Black for contrast on neon green
  buttonTextSecondary: '#FFFFFF', // White for secondary buttons
  
  // Primary colors
  primary: '#BCFF31', // Neon green
  primaryLight: '#BCFF3115', // Neon green with transparency
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Border colors
  border: '#404040', // Medium grey
  borderLight: '#333333', // Dark grey
  borderDark: '#1A1A1A', // Very dark grey
  
  // Shadow colors
  shadow: '#000000',
  
  // Button colors
  buttonPrimary: '#BCFF31', // Neon green
  buttonSecondary: 'transparent', // Transparent for secondary buttons
};

// Light theme with new color palette
const lightTheme: ThemeColors = {
  // Background colors
  background: '#FFFFFF', // White
  surface: '#F5F5F5', // Light grey
  surfaceSecondary: '#EEEEEE', // Lighter grey
  
  // Text colors
  textPrimary: '#000000', // Black
  textSecondary: '#666666', // Dark grey
  buttonText: '#000000', // Black for contrast on neon green
  buttonTextSecondary: '#FFFFFF', // White for secondary buttons
  
  // Primary colors
  primary: '#BCFF31', // Neon green
  primaryLight: '#BCFF3115', // Neon green with transparency
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Border colors
  border: '#E0E0E0', // Light grey
  borderLight: '#F0F0F0', // Very light grey
  borderDark: '#CCCCCC', // Medium grey
  
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
      theme: darkTheme,
      accentColor: ACCENT_COLORS.GREEN,
      setAccentColor: () => {},
    };
  }
  return context;
};

// Default export for the provider
export default ThemeProvider;