import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

/**
 * Custom hook for safely handling dimension changes
 * Automatically cleans up event listeners to prevent memory leaks
 */
export function useDimensionListener() {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    };

    // Add event listener
    const subscription = Dimensions.addEventListener('change', updateDimensions);

    // Cleanup function
    return () => {
      // Remove event listener to prevent memory leak
      subscription?.remove();
    };
  }, []);

  return dimensions;
}

/**
 * Hook for getting screen dimensions once without listeners
 * Use this when you don't need to track dimension changes
 */
export function useScreenDimensions() {
  const [dimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  return dimensions;
}

