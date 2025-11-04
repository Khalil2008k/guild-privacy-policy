/**
 * StepIndicator Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 511-536)
 * Purpose: Shows progress indicator for multi-step form
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export const StepIndicator = React.memo<StepIndicatorProps>(({ currentStep, totalSteps = 4 }) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  return (
    <View style={[styles.stepIndicator, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            {
              backgroundColor: step <= currentStep ? theme.primary : 'rgba(128,128,128,0.3)',
              borderColor: '#000000',
              marginRight: isRTL ? 0 : 4,
              marginLeft: isRTL ? 4 : 0,
            },
          ]}
        />
      ))}
      <Text style={[styles.stepText, { 
        color: '#000000',
        textAlign: isRTL ? 'right' : 'left',
        marginRight: isRTL ? 0 : 12,
        marginLeft: isRTL ? 12 : 0,
      }]}>
        {isRTL ? `الخطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
      </Text>
    </View>
  );
});

StepIndicator.displayName = 'StepIndicator';

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
  },
});




