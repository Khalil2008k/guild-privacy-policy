/**
 * Swipeable Chat Item with Gesture Support
 * WhatsApp/Telegram-style swipe actions
 */

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Pin,
  Archive,
  Trash2,
  BellOff,
  Bell,
} from 'lucide-react-native';

import { EnterpriseChatItem } from './EnterpriseChatItem';
import { EnhancedChat } from '../types/EnhancedChat';
import { useTheme } from '../contexts/ThemeContext';

interface SwipeableChatItemProps {
  chat: EnhancedChat;
  onPress: () => void;
  onLongPress: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMute?: () => void;
  language?: 'en' | 'ar';
  currentUserId?: string;
}

export const SwipeableChatItem: React.FC<SwipeableChatItemProps> = ({
  chat,
  onPress,
  onLongPress,
  onPin,
  onArchive,
  onDelete,
  onMute,
  language = 'en',
  currentUserId,
}) => {
  const { theme } = useTheme();
  const isRTL = language === 'ar';

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const leftActionOpacity = useRef(new Animated.Value(0)).current;
  const rightActionOpacity = useRef(new Animated.Value(0)).current;

  // Swipe thresholds
  const SWIPE_THRESHOLD = 80;
  const ACTION_THRESHOLD = 120;

  // Track if action was triggered
  const actionTriggered = useRef(false);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if horizontal swipe
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderGrant: () => {
        actionTriggered.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;

        // Limit swipe distance
        const maxSwipe = 150;
        const limitedDx = Math.max(-maxSwipe, Math.min(maxSwipe, dx));

        translateX.setValue(limitedDx);

        // Update action opacity
        if (limitedDx > 0) {
          // Swiping right - show left actions (pin/mute)
          const opacity = Math.min(1, limitedDx / SWIPE_THRESHOLD);
          leftActionOpacity.setValue(opacity);
          rightActionOpacity.setValue(0);
        } else if (limitedDx < 0) {
          // Swiping left - show right actions (archive/delete)
          const opacity = Math.min(1, Math.abs(limitedDx) / SWIPE_THRESHOLD);
          rightActionOpacity.setValue(opacity);
          leftActionOpacity.setValue(0);
        }

        // Haptic feedback at threshold
        if (Math.abs(limitedDx) >= ACTION_THRESHOLD && !actionTriggered.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          actionTriggered.current = true;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;

        // Check if action threshold was reached
        if (dx >= ACTION_THRESHOLD) {
          // Swipe right - Pin/Mute
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (onPin) onPin();
          resetPosition();
        } else if (dx <= -ACTION_THRESHOLD) {
          // Swipe left - Archive/Delete
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (onArchive) onArchive();
          resetPosition();
        } else {
          // Not enough swipe - reset
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(leftActionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rightActionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      {/* Left actions (Pin/Mute) */}
      <Animated.View
        style={[
          styles.leftActions,
          {
            opacity: leftActionOpacity,
          },
        ]}
      >
        <View style={[styles.actionButton, { backgroundColor: theme.primary }]}>
          <Pin size={24} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Right actions (Archive/Delete) */}
      <Animated.View
        style={[
          styles.rightActions,
          {
            opacity: rightActionOpacity,
          },
        ]}
      >
        <View style={[styles.actionButton, { backgroundColor: '#FF9500' }]}>
          <Archive size={24} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Chat item */}
      <Animated.View
        style={[
          styles.chatItemContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <EnterpriseChatItem
          chat={chat}
          onPress={onPress}
          onLongPress={onLongPress}
          language={language}
          currentUserId={currentUserId}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 0,
  },
  leftActions: {
    position: 'absolute',
    left: 16,
    top: 4,
    bottom: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 16,
    zIndex: 0,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    top: 4,
    bottom: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    zIndex: 0,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chatItemContainer: {
    zIndex: 1,
  },
});

export default SwipeableChatItem;


