/**
 * HomeHeader Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx
 * Purpose: Renders the home screen header with buttons, search, and notifications
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { 
  createHeaderAccessibility,
  createButtonAccessibility,
} from '../../../utils/accessibility';

interface HomeHeaderProps {
  headerOpacity: Animated.AnimatedAddition | Animated.AnimatedInterpolation;
  totalUnread: number;
  onSearchPress: () => void;
  onChatPress: () => void;
  onNotificationsPress: () => void;
  onSettingsPress: () => void;
  button1Anim: Animated.Value;
  button2Anim: Animated.Value;
  headerButton1Anim: Animated.Value;
  headerButton2Anim: Animated.Value;
  headerButton3Anim: Animated.Value;
  headerButton4Anim: Animated.Value;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  headerOpacity,
  totalUnread,
  onSearchPress,
  onChatPress,
  onNotificationsPress,
  onSettingsPress,
  button1Anim,
  button2Anim,
  headerButton1Anim,
  headerButton2Anim,
  headerButton3Anim,
  headerButton4Anim,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          paddingTop: insets.top + 12,
          opacity: headerOpacity,
        },
      ]}
    >
      <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Search Button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onSearchPress}
          {...createButtonAccessibility('Search for jobs', 'button')}
        >
          <Animated.View
            style={{
              transform: [{ scale: headerButton1Anim }],
            }}
          >
            <Ionicons name="search" size={24} color={theme.textPrimary} />
          </Animated.View>
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onChatPress}
          {...createButtonAccessibility('Open chat', 'button')}
        >
          <Animated.View
            style={{
              transform: [{ scale: headerButton2Anim }],
            }}
          >
            <Ionicons name="chatbubbles" size={24} color={theme.textPrimary} />
            {totalUnread > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.error }]}>
                <Text style={styles.badgeText}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Notifications Button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onNotificationsPress}
          {...createButtonAccessibility('View notifications', 'button')}
        >
          <Animated.View
            style={{
              transform: [{ scale: headerButton3Anim }],
            }}
          >
            <Ionicons name="notifications" size={24} color={theme.textPrimary} />
          </Animated.View>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onSettingsPress}
          {...createButtonAccessibility('Open settings', 'button')}
        >
          <Animated.View
            style={{
              transform: [{ scale: headerButton4Anim }],
            }}
          >
            <Ionicons name="settings" size={24} color={theme.textPrimary} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});



