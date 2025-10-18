import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  View,
  StyleSheet,
  Platform,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface AccessibleButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  label: string;
  hint?: string;
  role?: AccessibilityRole;
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  hapticFeedback?: boolean;
  announceOnPress?: string;
}

/**
 * Fully accessible button component with proper ARIA attributes
 * Includes haptic feedback, loading states, and screen reader support
 */
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  label,
  hint,
  role = 'button',
  isLoading = false,
  isDisabled = false,
  variant = 'primary',
  size = 'medium',
  hapticFeedback = true,
  announceOnPress,
  onPress,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const handlePress = (event: any) => {
    if (isDisabled || isLoading) return;

    // Haptic feedback
    if (hapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Announce action to screen reader
    if (announceOnPress && Platform.OS !== 'web') {
      const { AccessibilityInfo } = require('react-native');
      AccessibilityInfo.announceForAccessibility(announceOnPress);
    }

    onPress?.(event);
  };

  const getButtonStyles = () => {
    const baseStyles = [styles.button, styles[size]];

    switch (variant) {
      case 'primary':
        baseStyles.push({
          backgroundColor: isDisabled ? theme.disabled : theme.primary,
        });
        break;
      case 'secondary':
        baseStyles.push({
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: isDisabled ? theme.disabled : theme.primary,
        });
        break;
      case 'danger':
        baseStyles.push({
          backgroundColor: isDisabled ? theme.disabled : theme.error,
        });
        break;
      case 'ghost':
        baseStyles.push({
          backgroundColor: 'transparent',
        });
        break;
    }

    return baseStyles;
  };

  const getTextStyles = () => {
    const baseStyles = [styles.text, styles[`${size}Text`]];

    if (variant === 'secondary' || variant === 'ghost') {
      baseStyles.push({ color: isDisabled ? theme.disabled : theme.primary });
    } else {
      baseStyles.push({ color: theme.surface });
    }

    return baseStyles;
  };

  // Accessibility state
  const accessibilityState: AccessibilityState = {
    disabled: isDisabled,
    busy: isLoading,
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={accessibilityState}
      disabled={isDisabled || isLoading}
      onPress={handlePress}
      style={[getButtonStyles(), style]}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.content}>
        {typeof children === 'string' ? (
          <Text style={getTextStyles()}>{children}</Text>
        ) : (
          children
        )}
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <Text style={[styles.loadingText, { color: theme.surface }]}>
              •••
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44, // Minimum touch target size for accessibility
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 56,
  },
  // Text sizes
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default AccessibleButton;

