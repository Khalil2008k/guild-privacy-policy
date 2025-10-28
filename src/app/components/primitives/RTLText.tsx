import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useI18n } from '../../../contexts/I18nProvider';

interface RTLTextProps extends TextProps {
  children: React.ReactNode;
  fontFamily?: 'NotoSansArabic' | 'NotoSansArabic-Bold' | 'NotoSansArabic-Medium';
  isRTL?: boolean;
}

export default function RTLText({ 
  children, 
  style, 
  fontFamily = 'NotoSansArabic',
  isRTL,
  ...props 
}: RTLTextProps) {
  const { isRTL: contextIsRTL } = useI18n();
  const rtl = isRTL !== undefined ? isRTL : contextIsRTL;
  
  const textStyle: TextStyle[] = [
    styles.base,
    {
      fontFamily,
      textAlign: rtl ? 'right' : 'left' as const,
      writingDirection: rtl ? 'rtl' : 'ltr' as const,
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
