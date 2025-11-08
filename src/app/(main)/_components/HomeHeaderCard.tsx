/**
 * HomeHeaderCard Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines 509-645)
 * Purpose: Renders the main header card with GUILD logo, buttons, and user greeting
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Shield } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { 
  createHeaderAccessibility,
  createButtonAccessibility,
} from '../../../utils/accessibility';

interface HomeHeaderCardProps {
  totalUnread: number;
  headerButton1Anim: Animated.Value;
  headerButton2Anim: Animated.Value;
  headerButton3Anim: Animated.Value;
  headerButton4Anim: Animated.Value;
  onToggleLanguage: () => void;
  onNotificationsPress: () => void;
  onChatPress: () => void;
  onSearchPress: () => void;
  onSettingsPress: () => void;
}

export const HomeHeaderCard: React.FC<HomeHeaderCardProps> = ({
  totalUnread,
  headerButton1Anim,
  headerButton2Anim,
  headerButton3Anim,
  headerButton4Anim,
  onToggleLanguage,
  onNotificationsPress,
  onChatPress,
  onSearchPress,
  onSettingsPress,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const { profile } = useUserProfile();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.mainHeaderCard, { paddingTop: insets.top + 14, marginHorizontal: 3 }]}>
      <View style={[styles.headerTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Shield size={24} color={theme.buttonText} />
          <TouchableOpacity onPress={onToggleLanguage}>
            <Text style={[styles.headerTitle, { 
              color: theme.buttonText, 
              marginLeft: isRTL ? 0 : 8, 
              marginRight: isRTL ? 8 : 0 
            }]}>
              GUILD
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Notifications Button */}
          <Animated.View
            style={{
              opacity: headerButton1Anim,
              transform: [
                {
                  scale: headerButton1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={onNotificationsPress}
              activeOpacity={0.7}
              {...createButtonAccessibility('View notifications', 'button')}
            >
              <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Chat Button */}
          <Animated.View
            style={{
              opacity: headerButton2Anim,
              transform: [
                {
                  scale: headerButton2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={onChatPress}
              activeOpacity={0.7}
              {...createButtonAccessibility('Open chat', 'button')}
            >
              <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
              {totalUnread > 0 && (
                <View style={[styles.notificationDot, { backgroundColor: theme.primary }]}>
                  {totalUnread > 9 && (
                    <Text style={styles.notificationDotText}>9+</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Search Button */}
          <Animated.View
            style={{
              opacity: headerButton3Anim,
              transform: [
                {
                  scale: headerButton3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={onSearchPress}
              activeOpacity={0.7}
              {...createButtonAccessibility('Search for jobs', 'button')}
            >
              <Ionicons name="search-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Settings Button */}
          <Animated.View
            style={{
              opacity: headerButton4Anim,
              transform: [
                {
                  scale: headerButton4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={onSettingsPress}
              activeOpacity={0.7}
              {...createButtonAccessibility('Open settings', 'button')}
            >
              <Ionicons name="menu-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* User Greeting */}
      <View style={[styles.headerBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          style={[styles.userAvatar, { 
            marginRight: isRTL ? 0 : 12, 
            marginLeft: isRTL ? 12 : 0 
          }]}
          onPress={() => router.push('/(main)/profile')}
          {...createButtonAccessibility('View profile', 'button')}
        >
          {(profile?.processedImage || profile?.profileImage) ? (
            <Image 
              source={{ uri: profile.processedImage || profile.profileImage }} 
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.userGreeting}>
          <Text style={[styles.greetingText, { 
            color: theme.buttonText, 
            textAlign: isRTL ? 'right' : 'left' 
          }]}>
            {profile.fullName 
              ? (isRTL ? `هلا، ${profile.fullName.split(' ')[0]}!` : `Hi, ${profile.fullName.split(' ')[0]}!`)
              : (isRTL ? 'هلا!' : 'Hi!')
            }
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainHeaderCard: {
    backgroundColor: '#BCFF31', // Keep neon green for header card
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 26,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Signika Negative SC',
  },
  headerRight: {
    gap: 5,
  },
  headerIconButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  notificationDotText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  avatarText: {
    fontSize: 24,
  },
  userGreeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Signika Negative SC',
  },
});







