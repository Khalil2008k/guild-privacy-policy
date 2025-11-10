/**
 * HomeActionButtons Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx
 * Purpose: Renders the action buttons (Create Job, Find Jobs)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { 
  createButtonAccessibility,
} from '../../../utils/accessibility';

interface HomeActionButtonsProps {
  button1Anim: Animated.Value;
  button2Anim: Animated.Value;
  onCreateJobPress: () => void;
  onGuildMapPress?: () => void;
  onFindJobsPress?: () => void;
}

export const HomeActionButtons: React.FC<HomeActionButtonsProps> = ({
  button1Anim,
  button2Anim,
  onCreateJobPress,
  onGuildMapPress,
  onFindJobsPress,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  return (
    <View style={styles.actionsContainer}>
      {/* Create Job Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
          },
        ]}
        onPress={onCreateJobPress}
        activeOpacity={0.8}
        {...createButtonAccessibility('Create a new job', 'button')}
      >
        <Animated.View
          style={{
            transform: [{ scale: button1Anim }],
          }}
        >
          <Ionicons name="add-circle" size={16} color="#000000" />
        </Animated.View>
        <Text style={[styles.actionButtonText, { color: '#000000' }]}>
          {t('addJob')}
        </Text>
      </TouchableOpacity>

      {/* Guild Map Button */}
      {onGuildMapPress && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={onGuildMapPress}
          activeOpacity={0.8}
          {...createButtonAccessibility('Open Guild Map', 'button')}
        >
          <Animated.View
            style={{
              transform: [{ scale: button2Anim }],
            }}
          >
            <Ionicons name="map" size={16} color={theme.textPrimary} />
          </Animated.View>
          <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
            {t('guildMap')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Find Jobs Button - Only show if onGuildMapPress is not provided */}
      {!onGuildMapPress && onFindJobsPress && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={onFindJobsPress}
          activeOpacity={0.8}
          {...createButtonAccessibility('Find available jobs', 'button')}
        >
          <Animated.View
            style={{
              transform: [{ scale: button2Anim }],
            }}
          >
            <Ionicons name="search" size={16} color={theme.textPrimary} />
          </Animated.View>
          <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
            {t('findJobs')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    paddingHorizontal: 0, // No padding when inline with search bar
    marginBottom: 0, // No margin when inline with search bar
    gap: 12, // 12px space between buttons
    flexDirection: 'column', // Stack buttons vertically
    width: 108, // 120 * 0.9 = 108 (10% reduction)
    justifyContent: 'center', // Center align buttons vertically
  },
  actionButton: {
    width: '100%', // Full width of container
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // Increased vertical padding
    paddingHorizontal: 12, // Increased horizontal padding
    borderRadius: 8.064, // 5.76 * 1.4 = 8.064 (40% increase from current)
    borderWidth: 1,
    gap: 6, // Increased gap between icon and text
  },
  actionButtonText: {
    fontSize: 12, // Increased font size
    fontWeight: '600',
  },
});
