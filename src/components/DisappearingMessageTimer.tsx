/**
 * Disappearing Message Timer Component
 * 
 * Displays a timer indicator for messages that will disappear
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';

interface DisappearingMessageTimerProps {
  expiresAt: Date | number; // Timestamp when message expires
  duration: number; // Total duration in seconds
  size?: 'small' | 'medium' | 'large';
  isOwnMessage?: boolean;
}

export function DisappearingMessageTimer({
  expiresAt,
  duration,
  size = 'small',
  isOwnMessage = false,
}: DisappearingMessageTimerProps) {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const expires = typeof expiresAt === 'number' ? expiresAt : expiresAt.getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return isRTL ? 'انتهى' : 'Expired';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${secs}s`;
    }
  };

  const getProgress = (): number => {
    if (duration === 0) return 0;
    return Math.max(0, Math.min(1, timeRemaining / duration));
  };

  const iconSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 11 : 12;

  return (
    <View style={styles.container}>
      <Clock 
        size={iconSize} 
        color={isOwnMessage ? '#000000' : theme.textSecondary}
      />
      <Text
        style={[
          styles.timerText,
          {
            fontSize,
            color: isOwnMessage ? '#000000' : theme.textSecondary,
          },
        ]}
      >
        {formatTime(timeRemaining)}
      </Text>
      {/* Progress indicator */}
      <View
        style={[
          styles.progressBar,
          {
            width: `${getProgress() * 100}%`,
            backgroundColor: isOwnMessage ? '#000000' : theme.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    position: 'relative',
  },
  timerText: {
    fontWeight: '500',
    fontFamily: 'System',
  },
  progressBar: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    height: 1,
    borderRadius: 0.5,
    opacity: 0.3,
  },
});







