/**
 * Color utility functions for dynamic text colors and better visibility
 */

/**
 * Convert hex color to RGB values
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;
  
  // Remove # if present and any alpha values
  let cleanHex = hex.replace('#', '');
  
  // Remove alpha channel if present (last 2 characters for 8-digit hex)
  if (cleanHex.length === 8) {
    cleanHex = cleanHex.slice(0, 6);
  }
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return { r, g, b };
  }
  
  // Invalid hex color format
  return null;
};

/**
 * Calculate luminance of a color (0-1, where 0 is darkest and 1 is lightest)
 */
export const getLuminance = (r: number, g: number, b: number): number => {
  // Convert to relative luminance
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Get the best text color (black or white) for a given background color
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    return '#000000'; // Default to black if parsing fails
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // If background is light/bright, use dark text. If background is dark, use light text.
  // Neon green (#BCFF31) has high luminance, so should return black text
  const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
  
  return textColor;
};

/**
 * Get adaptive text color based on theme and background
 */
export const getAdaptiveTextColor = (
  backgroundColor: string,
  theme: any,
  preferredColor?: string
): string => {
  if (!backgroundColor) {
    return preferredColor || theme.textPrimary;
  }
  
  let cleanBgColor = backgroundColor;
  
  // Handle cases like "theme.primary + '20'" where we get concatenated strings
  // Look for patterns like "#BCFF3120" and extract the base color "#BCFF31"
  if (cleanBgColor.includes('#')) {
    // Extract just the hex color part
    const hexMatch = cleanBgColor.match(/#[0-9a-fA-F]{6}/);
    if (hexMatch) {
      cleanBgColor = hexMatch[0];
    } else {
      // Try 3-digit hex
      const shortHexMatch = cleanBgColor.match(/#[0-9a-fA-F]{3}/);
      if (shortHexMatch) {
        cleanBgColor = shortHexMatch[0];
      }
    }
  }
  
  // Ensure it starts with #
  if (!cleanBgColor.startsWith('#')) {
    cleanBgColor = '#' + cleanBgColor;
  }
  
  // Get the optimal contrast color (black or white)
  const contrastColor = getContrastTextColor(cleanBgColor);
  
  return contrastColor;
};

/**
 * Generate a lighter or darker version of a color
 */
export const adjustColorBrightness = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const adjust = (value: number) => {
    const adjusted = Math.round(value + (amount * 255));
    return Math.max(0, Math.min(255, adjusted));
  };
  
  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
};

/**
 * Check if a color is considered "dark"
 */
export const isDarkColor = (color: string): boolean => {
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance < 0.5;
};

/**
 * Get optimal border color based on background
 */
export const getOptimalBorderColor = (backgroundColor: string, theme: any): string => {
  if (isDarkColor(backgroundColor)) {
    return adjustColorBrightness(backgroundColor, 0.3);
  } else {
    return adjustColorBrightness(backgroundColor, -0.3);
  }
};

/**
 * Test function to verify color logic
 */
export const testColorLogic = () => {
  const testColors = [
    '#BCFF31', // Neon green (should return black text)
    '#000000', // Black (should return white text)
    '#FFFFFF', // White (should return black text)
    '#808080', // Gray (should return white text)
    '#FF0000', // Red (should return white text)
    '#00FF00', // Green (should return black text)
    '#0000FF', // Blue (should return white text)
  ];
  
  console.log('🧪 Color Logic Test Results:');
  testColors.forEach(color => {
    const textColor = getContrastTextColor(color);
    const rgb = hexToRgb(color);
    const luminance = rgb ? getLuminance(rgb.r, rgb.g, rgb.b) : 0;
    
    console.log(`${color} (luminance: ${luminance.toFixed(3)}) → ${textColor}`);
  });
};
