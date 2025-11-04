/**
 * Step2BudgetTimeline Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 849-1045)
 * Purpose: Renders step 2 - Budget & Timeline (Budget, Duration, Urgent)
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { Zap } from 'lucide-react-native';
import { getBudgetTypes } from '../_constants/jobFormConstants';

interface JobFormData {
  budget: string;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
  duration: string;
  isUrgent: boolean;
}

interface Step2BudgetTimelineProps {
  formData: JobFormData;
  focusedField: string | null;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onInputChange: (field: keyof JobFormData, value: any) => void;
  onFocusChange: (field: string | null) => void;
}

export const Step2BudgetTimeline: React.FC<Step2BudgetTimelineProps> = ({
  formData,
  focusedField,
  fadeAnim,
  slideAnim,
  scaleAnim,
  onInputChange,
  onFocusChange,
}) => {
  const { theme } = useTheme();
  const { isRTL, t } = useI18n();

  // COMMENT: PRIORITY 1 - File Modularization - Use constants from _constants/jobFormConstants.ts
  const budgetTypes = getBudgetTypes(isRTL);

  return (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Text style={[styles.stepTitle, { 
        color: theme.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
      }]}>
        {t('budgetAndTimeline')}
      </Text>

      {/* Budget Type */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {t('budgetType')} *
        </Text>
        <View style={[styles.optionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {budgetTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: formData.budgetType === type.key ? theme.primary : theme.surface,
                    borderColor: formData.budgetType === type.key ? theme.primary : theme.border,
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                  },
                ]}
                onPress={() => onInputChange('budgetType', type.key)}
              >
                <IconComponent 
                  size={20}
                  color={formData.budgetType === type.key ? '#000000' : theme.textPrimary}
                />
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: formData.budgetType === type.key ? '#000000' : theme.textPrimary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Budget Amount */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {t('budget')} *
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.surface,
              borderColor: focusedField === 'budget' ? theme.primary : theme.border,
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          placeholder={t('enterBudgetAmount')}
          placeholderTextColor={theme.textSecondary}
          value={formData.budget}
          onChangeText={(value) => onInputChange('budget', value)}
          onFocus={() => onFocusChange('budget')}
          keyboardType="numeric"
        />
      </View>

      {/* Duration */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {t('duration')} *
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.surface,
              borderColor: focusedField === 'duration' ? theme.primary : theme.border,
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          placeholder={t('durationExample')}
          placeholderTextColor={theme.textSecondary}
          value={formData.duration}
          onChangeText={(value) => onInputChange('duration', value)}
          onFocus={() => onFocusChange('duration')}
        />
      </View>

      {/* Urgent Toggle */}
      <TouchableOpacity
        style={[
          styles.urgentToggle,
          {
            backgroundColor: formData.isUrgent ? '#EF4444' : theme.surface,
            borderColor: formData.isUrgent ? '#EF4444' : theme.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        onPress={() => onInputChange('isUrgent', !formData.isUrgent)}
      >
        <View style={{
          marginRight: isRTL ? 0 : 8,
          marginLeft: isRTL ? 8 : 0,
        }}>
          <Zap size={20} color={formData.isUrgent ? '#000000' : '#EF4444'} />
        </View>
        <Text
          style={[
            styles.urgentText,
            {
              color: formData.isUrgent ? '#000000' : '#EF4444',
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {t('urgentJob')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsRow: {
    gap: 12,
  },
  optionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  optionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  urgentToggle: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  urgentText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

