/**
 * Enhanced Typing Indicator Component
 * 
 * Displays typing indicator with support for multiple users and smooth animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
// Modern typing indicator - using built-in Animated API

interface EnhancedTypingIndicatorProps {
  typingUsers?: string[];
  typingUserNames?: Record<string, string>; // Map of userId to userName
  maxVisibleUsers?: number;
  isOwnMessage?: boolean;
}

export function EnhancedTypingIndicator({
  typingUsers = [],
  typingUserNames = {},
  maxVisibleUsers = 3,
  isOwnMessage = false,
}: EnhancedTypingIndicatorProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate dots with improved timing
  useEffect(() => {
    if (typingUsers.length === 0) {
      // Fade out when no one is typing
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Fade in when someone is typing
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();

    return () => animation.stop();
  }, [typingUsers.length, fadeAnim, dot1, dot2, dot3]);

  // Get typing text based on number of users
  const getTypingText = (): string => {
    if (typingUsers.length === 0) return '';
    
    const visibleUsers = typingUsers.slice(0, maxVisibleUsers);
    const userNames = visibleUsers
      .map(uid => typingUserNames[uid] || t('someone'))
      .filter(Boolean);

    if (userNames.length === 1) {
      return isRTL ? `${userNames[0]} يكتب...` : `${userNames[0]} is typing...`;
    } else if (userNames.length === 2) {
      return isRTL 
        ? `${userNames[0]} و ${userNames[1]} يكتبان...`
        : `${userNames[0]} and ${userNames[1]} are typing...`;
    } else if (userNames.length === 3) {
      return isRTL 
        ? `${userNames[0]}, ${userNames[1]} و ${userNames[2]} يكتبون...`
        : `${userNames[0]}, ${userNames[1]} and ${userNames[2]} are typing...`;
    } else {
      const remaining = typingUsers.length - maxVisibleUsers;
      return isRTL 
        ? `${userNames.join(', ')} و ${remaining} آخرون يكتبون...`
        : `${userNames.join(', ')} and ${remaining} others are typing...`;
    }
  };

  if (typingUsers.length === 0) {
    return null;
  }

  const dotStyle = (animatedValue: Animated.Value): ViewStyle => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 1, 0.3],
    }),
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -6, 0],
        }),
      },
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.8, 1, 0.8],
        }),
      },
    ],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isOwnMessage ? theme.primary : theme.surface,
          opacity: fadeAnim,
          transform: [{ scale: fadeAnim }],
        },
      ]}
    >
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: isOwnMessage ? '#000000' : theme.textPrimary,
            },
            dotStyle(dot1),
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: isOwnMessage ? '#000000' : theme.textPrimary,
            },
            dotStyle(dot2),
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: isOwnMessage ? '#000000' : theme.textPrimary,
            },
            dotStyle(dot3),
          ]}
        />
      </View>
      
      {typingUsers.length > 0 && (
        <Text
          style={[
            styles.typingText,
            {
              color: isOwnMessage ? '#000000' : theme.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {getTypingText()}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginVertical: 4,
    gap: 8,
    maxWidth: '80%',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typingText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
});


