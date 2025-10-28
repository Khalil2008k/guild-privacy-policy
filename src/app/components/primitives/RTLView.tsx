import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useI18n } from '../../../contexts/I18nProvider';

interface RTLViewProps extends ViewProps {
  children: React.ReactNode;
  isRTL?: boolean;
}

export default function RTLView({ 
  children, 
  style, 
  isRTL,
  ...props 
}: RTLViewProps) {
  const { isRTL: contextIsRTL } = useI18n();
  const rtl = isRTL !== undefined ? isRTL : contextIsRTL;
  
  return (
    <View 
      style={[
        styles.base,
        {
          flexDirection: rtl ? 'row-reverse' : 'row' as const,
        },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    // Don't force flex: 1, let parent control layout
  },
});
