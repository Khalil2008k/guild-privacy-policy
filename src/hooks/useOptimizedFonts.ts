import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

interface FontMap {
  [fontFamily: string]: any;
}

interface UseOptimizedFontsOptions {
  onError?: (error: Error) => void;
  fallbackFonts?: FontMap;
  timeout?: number;
}

/**
 * Optimized font loading hook that prevents blocking app startup
 * - Loads fonts asynchronously
 * - Shows splash screen while loading
 * - Falls back to system fonts on error
 * - Implements timeout to prevent infinite loading
 */
export function useOptimizedFonts(
  fonts: FontMap,
  options: UseOptimizedFontsOptions = {}
): [boolean, Error | null] {
  const { onError, fallbackFonts = {}, timeout = 3000 } = options;
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    async function loadFonts() {
      try {
        // Keep splash screen visible while loading
        await SplashScreen.preventAutoHideAsync();

        // Set timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!mounted) return;
          
          const timeoutError = new Error('Font loading timeout');
          setError(timeoutError);
          setFontsLoaded(true);
          onError?.(timeoutError);
          SplashScreen.hideAsync();
        }, timeout);

        // Load fonts
        await Font.loadAsync(fonts);

        if (mounted) {
          clearTimeout(timeoutId);
          setFontsLoaded(true);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;

        clearTimeout(timeoutId);
        const loadError = err as Error;
        setError(loadError);
        onError?.(loadError);

        // Try loading fallback fonts
        if (Object.keys(fallbackFonts).length > 0) {
          try {
            await Font.loadAsync(fallbackFonts);
          } catch (fallbackErr) {
            console.warn('Fallback fonts also failed to load:', fallbackErr);
          }
        }

        // Mark as loaded even on error to prevent app blocking
        setFontsLoaded(true);
      } finally {
        if (mounted) {
          // Hide splash screen
          await SplashScreen.hideAsync();
        }
      }
    }

    loadFonts();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return [fontsLoaded, error];
}

/**
 * Font loading with progressive enhancement
 * Loads critical fonts first, then additional fonts
 */
export function useProgressiveFonts(
  criticalFonts: FontMap,
  additionalFonts: FontMap = {},
  options: UseOptimizedFontsOptions = {}
): {
  criticalFontsLoaded: boolean;
  allFontsLoaded: boolean;
  error: Error | null;
} {
  const [criticalLoaded, criticalError] = useOptimizedFonts(criticalFonts, {
    ...options,
    timeout: 2000, // Shorter timeout for critical fonts
  });

  const [additionalLoaded, setAdditionalLoaded] = useState(false);
  const [additionalError, setAdditionalError] = useState<Error | null>(null);

  useEffect(() => {
    if (!criticalLoaded || Object.keys(additionalFonts).length === 0) return;

    // Load additional fonts in background
    Font.loadAsync(additionalFonts)
      .then(() => setAdditionalLoaded(true))
      .catch((err) => {
        setAdditionalError(err);
        setAdditionalLoaded(true); // Continue even if additional fonts fail
      });
  }, [criticalLoaded, additionalFonts]);

  return {
    criticalFontsLoaded: criticalLoaded,
    allFontsLoaded: criticalLoaded && additionalLoaded,
    error: criticalError || additionalError,
  };
}

/**
 * Get font family with fallback support
 */
export function getFontFamily(
  preferredFont: string,
  fallbackFont: string = 'System'
): string {
  // Check if font is loaded
  if (Font.isLoaded(preferredFont)) {
    return preferredFont;
  }
  
  // Use fallback
  return fallbackFont;
}

/**
 * Font loading status provider for debugging
 */
export function useFontLoadingStatus(): {
  loadedFonts: string[];
  isLoading: boolean;
} {
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This is a debug utility, only runs in DEV
    if (!__DEV__) {
      setIsLoading(false);
      return;
    }

    const checkLoadedFonts = () => {
      const fonts = Font.isLoaded;
      // Note: This is a simplified version as expo-font doesn't expose all loaded fonts
      setIsLoading(false);
    };

    checkLoadedFonts();
  }, []);

  return { loadedFonts, isLoading };
}

