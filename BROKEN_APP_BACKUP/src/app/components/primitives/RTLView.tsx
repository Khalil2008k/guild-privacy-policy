import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

interface RTLViewProps extends ViewProps {
  children: React.ReactNode;
  isRTL?: boolean;
}

export default function RTLView({ 
  children, 
  style, 
  isRTL = false,
  ...props 
}: RTLViewProps) {
  return (
    <View 
      style={[
        styles.base,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row' as const,
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
    flex: 1,
  },
});
