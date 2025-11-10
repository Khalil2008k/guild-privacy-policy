/**
 * Split View Component
 * 
 * TASK 14: iPad Responsive Layouts
 * 
 * Provides a split view layout that:
 * - Shows sidebar + content side-by-side on tablet
 * - Shows only content on phone (sidebar handled separately)
 * - Responsive sidebar width
 * 
 * Usage:
 * <SplitView
 *   sidebar={<ChatList />}
 *   content={<ChatConversation />}
 *   sidebarWidth={320}
 * />
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../utils/responsive';

interface SplitViewProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  sidebarWidth?: number;
  sidebarPosition?: 'left' | 'right';
  style?: ViewStyle | ViewStyle[];
  sidebarStyle?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
  showSidebarOnPhone?: boolean; // Force show sidebar on phone (for testing)
}

export const SplitView: React.FC<SplitViewProps> = ({
  sidebar,
  content,
  sidebarWidth = 320,
  sidebarPosition = 'left',
  style,
  sidebarStyle,
  contentStyle,
  showSidebarOnPhone = false,
}) => {
  const { isTablet } = useResponsive();

  // On phone, show only content (unless forced)
  if (!isTablet && !showSidebarOnPhone) {
    return (
      <View style={[styles.container, style]}>
        {content}
      </View>
    );
  }

  // On tablet, show split view
  return (
    <View style={[styles.splitContainer, style]}>
      {sidebarPosition === 'left' ? (
        <>
          <View style={[styles.sidebar, { width: sidebarWidth }, sidebarStyle]}>
            {sidebar}
          </View>
          <View style={[styles.content, contentStyle]}>
            {content}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.content, contentStyle]}>
            {content}
          </View>
          <View style={[styles.sidebar, { width: sidebarWidth }, sidebarStyle]}>
            {sidebar}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default SplitView;

