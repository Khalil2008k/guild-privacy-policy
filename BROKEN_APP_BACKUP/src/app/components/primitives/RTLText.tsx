import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';

interface RTLTextProps extends TextProps {
  children: React.ReactNode;
  fontFamily?: 'NotoSansArabic' | 'NotoSansArabic-Bold' | 'NotoSansArabic-Medium';
  isRTL?: boolean;
}

export default function RTLText({ 
  children, 
  style, 
  fontFamily = 'NotoSansArabic',
  isRTL = false,
  ...props 
}: RTLTextProps) {
  const textStyle: TextStyle[] = [
    styles.base,
    {
      fontFamily,
      textAlign: isRTL ? 'right' : 'left' as const,
      writingDirection: isRTL ? 'rtl' : 'ltr' as const,
    },
    style as TextStyle,
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
  },
});
