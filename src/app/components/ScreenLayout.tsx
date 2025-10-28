import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useI18n } from '../../contexts/I18nProvider';

interface ScreenLayoutProps extends ViewProps {
  children: React.ReactNode;
  headerLayout?: boolean; // For headers (flexDirection: row-reverse in RTL)
  contentLayout?: boolean; // For content (flexDirection: row-reverse in RTL)
}

/**
 * Universal screen layout wrapper that handles RTL automatically
 * Usage: Wrap your screen content with <ScreenLayout>
 */
export default function ScreenLayout({ 
  children, 
  style,
  headerLayout = false,
  contentLayout = false,
  ...props 
}: ScreenLayoutProps) {
  const { isRTL } = useI18n();
  
  return (
    <View 
      style={[
        styles.base,
        headerLayout && {
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        contentLayout && {
          flexDirection: isRTL ? 'row-reverse' : 'row',
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

