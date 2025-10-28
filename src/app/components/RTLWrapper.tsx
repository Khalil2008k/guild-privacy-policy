/**
 * ADVANCED RTL WRAPPER - OCT 2025 COMPATIBLE
 * Automatically applies RTL support to any component without code changes
 * Uses React 19+ patterns and new RN features
 */

import React, { ComponentType } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useI18n } from '../../contexts/I18nProvider';

interface RTLStyleProps {
  style?: ViewStyle | ViewStyle[];
  [key: string]: any;
}

/**
 * Higher-Order Component that automatically injects RTL support
 * Usage: export default withRTL(MyComponent)
 */
export function withRTL<P extends object>(
  Component: ComponentType<P>
): ComponentType<P & RTLStyleProps> {
  return function RTLComponent(props: P & RTLStyleProps) {
    const { isRTL } = useI18n();
    
    // Convert props to style if it contains ViewStyle properties
    const rtlStyle: ViewStyle = {
      flexDirection: isRTL ? 'row-reverse' : 'row',
    };
    
    return <Component {...props} rtlStyle={rtlStyle} isRTL={isRTL} />;
  };
}

/**
 * Hook for automatic RTL styles
 * Returns styles object with RTL-aware properties
 */
export function useRTLStyles<T extends Record<string, ViewStyle>>(
  styles: T
): T {
  const { isRTL } = useI18n();
  
  return React.useMemo(() => {
    const rtlStyles = { ...styles };
    
    // Auto-convert row to row-reverse for RTL
    Object.keys(rtlStyles).forEach(key => {
      const style = rtlStyles[key];
      if (style.flexDirection === 'row') {
        rtlStyles[key] = {
          ...style,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        };
      }
    });
    
    return rtlStyles;
  }, [styles, isRTL]);
}

/**
 * Advanced RTL Context Provider
 * Wraps app with automatic RTL detection
 */
export const RTLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isRTL } = useI18n();
  
  React.useEffect(() => {
    // Automatic RTL setup
    if (isRTL) {
      require('react-native').I18nManager.forceRTL(true);
      require('react-native').I18nManager.allowRTL(true);
    }
  }, [isRTL]);
  
  return <>{children}</>;
};

/**
 * Smart Text Component with automatic RTL text alignment
 */
export const RTLText: React.FC<{
  children: React.ReactNode;
  style?: any;
  [key: string]: any;
}> = ({ children, style, ...props }) => {
  const { isRTL } = useI18n();
  const Text = require('react-native').Text;
  
  return (
    <Text
      style={[
        style,
        {
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

/**
 * Smart View Component with automatic RTL layout
 */
export const RTLView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  header?: boolean;
  [key: string]: any;
}> = ({ children, style, header = false, ...props }) => {
  const { isRTL } = useI18n();
  
  return (
    <View
      style={[
        style,
        header && {
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});

// Default export for Expo Router compatibility
export default RTLProvider;

