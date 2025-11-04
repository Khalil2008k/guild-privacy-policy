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
    <View style={[styles.actionsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {/* Create Job Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            marginRight: isRTL ? 0 : 6,
            marginLeft: isRTL ? 6 : 0,
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
          <Ionicons name="add-circle" size={20} color="#000000" />
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
              marginRight: isRTL ? 6 : 0,
              marginLeft: isRTL ? 0 : 6,
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
            <Ionicons name="map" size={20} color={theme.textPrimary} />
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
              marginRight: isRTL ? 6 : 0,
              marginLeft: isRTL ? 0 : 6,
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
            <Ionicons name="search" size={20} color={theme.textPrimary} />
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
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15.5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
