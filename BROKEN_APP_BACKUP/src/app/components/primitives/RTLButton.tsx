import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, View, ViewStyle } from 'react-native';
import { useI18n } from '@/contexts/I18nProvider';
import RTLText from './RTLText';

interface RTLButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export default function RTLButton({ 
  children, 
  style, 
  variant = 'primary',
  size = 'medium',
  ...props 
}: RTLButtonProps) {
  const { isRTL } = useI18n();

  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[size],
    styles[variant],
    {
      flexDirection: isRTL ? 'row-reverse' : 'row' as const,
    },
    style as ViewStyle,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : 'Button'}
      {...props}
    >
      <RTLText style={textStyle}>
        {children}
      </RTLText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 48, // 48dp touch target
    paddingHorizontal: 16,
  },
  // Size variants
  small: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  medium: {
    minHeight: 48,
    paddingHorizontal: 16,
  },
  large: {
    minHeight: 56,
    paddingHorizontal: 20,
  },
  // Color variants
  primary: {
    backgroundColor: '#1E90FF',
  },
  secondary: {
    backgroundColor: '#F5F5F5',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E90FF',
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#000000',
  },
  outlineText: {
    color: '#1E90FF',
  },
  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
