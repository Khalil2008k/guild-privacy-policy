import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { useI18n } from '../../../contexts/I18nProvider';
import RTLText from './RTLText';

interface RTLInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function RTLInput({ 
  label,
  error,
  helperText,
  style, 
  placeholder,
  ...props 
}: RTLInputProps) {
  const { isRTL } = useI18n();

  const inputStyle: TextStyle[] = [
    styles.base,
    {
      textAlign: isRTL ? 'right' : 'left' as const,
      writingDirection: isRTL ? 'rtl' : 'ltr' as const,
      fontFamily: 'NotoSansArabic',
    },
    error && styles.error,
    style as TextStyle,
  ];

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      flexDirection: isRTL ? 'row-reverse' : 'row' as const,
    },
  ];

  return (
    <View style={styles.wrapper}>
      {label && (
        <RTLText style={styles.label}>
          {label}
        </RTLText>
      )}
      <View style={containerStyle}>
        <TextInput
          style={inputStyle}
          placeholder={placeholder}
          placeholderTextColor={error ? '#FF4444' : '#999999'}
          accessibilityRole="text"
          accessibilityLabel={label || placeholder}
          {...props}
        />
      </View>
      {(error || helperText) && (
        <RTLText style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </RTLText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    alignItems: 'center',
  },
  base: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    minHeight: 48, // 48dp touch target
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666666',
  },
  error: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
  },
});
