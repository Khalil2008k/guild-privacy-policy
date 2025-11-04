/**
 * AddJobFooter Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 1512-1578)
 * Purpose: Renders the footer section with Back/Next buttons
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { ChevronRight } from 'lucide-react-native';

interface AddJobFooterProps {
  currentStep: number;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const AddJobFooter: React.FC<AddJobFooterProps> = ({
  currentStep,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  return (
    <View style={[styles.footer, { 
      backgroundColor: theme.surface, 
      borderTopColor: theme.border,
      borderTopWidth: 1,
    }]}>
      <View style={[styles.footerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.footerButton, styles.backButton, { 
              borderColor: theme.border,
              backgroundColor: 'transparent',
              marginRight: isRTL ? 0 : 12,
              marginLeft: isRTL ? 12 : 0,
            }]}
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, { 
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            }]}>
              {isRTL ? 'السابق' : 'Back'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.nextButton,
            {
              backgroundColor: theme.primary,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
            currentStep === 4 && { backgroundColor: theme.primary },
          ]}
          onPress={currentStep === 4 ? onSubmit : onNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={[styles.nextButtonText, { 
                textAlign: isRTL ? 'right' : 'left',
                marginRight: isRTL ? 0 : 8,
                marginLeft: isRTL ? 8 : 0,
              }]}>
                {currentStep === 4 
                  ? (isRTL ? 'إرسال الوظيفة' : 'Submit Job')
                  : (isRTL ? 'التالي' : 'Next')
                }
              </Text>
              {currentStep < 4 && (
                <ChevronRight 
                  size={16} 
                  color="#000000" 
                  style={{ 
                    transform: isRTL ? [{ scaleX: -1 }] : [{ scaleX: 1 }] 
                  }} 
                />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  backButton: {
    borderWidth: 1.5,
  },
  nextButton: {
    // Styles applied inline
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});



