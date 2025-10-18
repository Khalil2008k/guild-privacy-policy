import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  // Main colors
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border and shadow
  border: string;
  shadow: string;
  
  // Special UI elements
  cardBackground: string;
  modalBackground: string;
  buttonText: string;
  inputBackground: string;
  
  // Chart colors
  chartColors: string[];
}

const darkTheme: Theme = {
  // Main colors - matching Guild app
  primary: '#00FF88',
  secondary: '#FF6B6B',
  background: '#000000',
  surface: '#2D2D2D',
  surfaceSecondary: '#1A1A1A',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',
  info: '#2196F3',
  
  // Border and shadow
  border: '#333333',
  shadow: 'rgba(0, 255, 136, 0.2)',
  
  // Special UI elements
  cardBackground: '#1A1A1A',
  modalBackground: 'rgba(0, 0, 0, 0.9)',
  buttonText: '#000000',
  inputBackground: '#1A1A1A',
  
  // Chart colors for analytics
  chartColors: [
    '#00FF88',
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#A8E6CF',
    '#FFDDC1',
    '#FF8B94',
    '#B4A7D6',
  ],
};

const lightTheme: Theme = {
  // Main colors - keep Guild green but adjust for light mode
  primary: '#00D174',
  secondary: '#FF6B6B',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F3F4',
  
  // Text colors - better contrast for light mode
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  
  // Status colors
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#007BFF',
  
  // Border and shadow - more visible in light mode
  border: '#DEE2E6',
  shadow: 'rgba(0, 0, 0, 0.15)',
  
  // Special UI elements - better contrast
  cardBackground: '#FFFFFF',
  modalBackground: 'rgba(0, 0, 0, 0.5)',
  buttonText: '#FFFFFF',
  inputBackground: '#FFFFFF',
  
  // Chart colors
  chartColors: [
    '#00D174',
    '#FF5252',
    '#4ECDC4',
    '#FFC107',
    '#4CAF50',
    '#FF9800',
    '#9C27B0',
    '#3F51B5',
  ],
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode like the app
  
  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('guild-admin-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document body
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem('guild-admin-theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

