import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'large',
  color,
  message = 'Loading...',
  fullScreen = false
}: LoadingSpinnerProps) {
  const { theme } = useTheme();

  const spinnerColor = color || theme.primary;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: theme.surface }]}>
          <ActivityIndicator size={size} color={spinnerColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {message}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
    minHeight: 120,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
    marginTop: 12,
    textAlign: 'center',
  },
});
