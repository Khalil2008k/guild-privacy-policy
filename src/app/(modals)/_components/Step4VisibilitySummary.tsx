/**
 * Step4VisibilitySummary Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 1189-1380)
 * Purpose: Renders step 4 - Visibility & Summary (Visibility, Promotion, Summary)
 */

import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { Globe, Shield, Star } from 'lucide-react-native';

interface JobFormData {
  visibility: 'public' | 'guild_only' | 'premium';
  featured: boolean;
  boost: boolean;
  title: string;
  titleAr: string;
  category: string;
  budget: string;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
  duration: string;
  location: string;
  locationAr: string;
  primaryLanguage: 'en' | 'ar' | 'both';
}

interface Step4VisibilitySummaryProps {
  formData: JobFormData;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onInputChange: (field: keyof JobFormData, value: any) => void;
  onPromotionToggle?: (type: 'featured' | 'boost', currentValue: boolean) => void;
  categories: Array<{ key: string; label: string; icon: any; color: string }>;
}

export const Step4VisibilitySummary: React.FC<Step4VisibilitySummaryProps> = ({
  formData,
  fadeAnim,
  slideAnim,
  scaleAnim,
  onInputChange,
  onPromotionToggle,
  categories,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  const selectedCategory = categories.find(c => c.key === formData.category);

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
        {isRTL ? 'خيارات متقدمة' : 'Advanced Options'}
      </Text>

      {/* Visibility Options */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'الرؤية' : 'Visibility'}
        </Text>
        <View style={[styles.visibilityContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {[
            { key: 'public', label: isRTL ? 'عام' : 'Public', icon: Globe },
            { key: 'guild_only', label: isRTL ? 'النقابة فقط' : 'Guild Only', icon: Shield },
            { key: 'premium', label: isRTL ? 'مميز' : 'Premium', icon: Star },
          ].map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.visibilityCard,
                  {
                    backgroundColor: formData.visibility === option.key ? theme.primary : theme.surface,
                    borderColor: formData.visibility === option.key ? theme.primary : theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  },
                ]}
                onPress={() => onInputChange('visibility', option.key)}
              >
                <IconComponent
                  size={18}
                  color={formData.visibility === option.key ? '#000000' : theme.textPrimary}
                />
                <Text
                  style={[
                    styles.visibilityText,
                    {
                      color: formData.visibility === option.key ? '#000000' : theme.textPrimary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryTitle, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'ملخص الوظيفة' : 'Job Summary'}
        </Text>
        <View style={[styles.summaryCard, { 
          backgroundColor: theme.surface, 
          borderColor: theme.border,
        }]}>
          <Text style={[styles.summaryText, { 
            color: theme.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }]}>
            {formData.primaryLanguage === 'ar' ? formData.titleAr : formData.title}
          </Text>
          <Text style={[styles.summaryCategory, { 
            color: theme.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
          }]}>
            {selectedCategory?.label || formData.category}
          </Text>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'الميزانية:' : 'Budget:'}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {formData.budget} {formData.budgetType === 'fixed' ? (isRTL ? 'عملة' : 'coins') : formData.budgetType === 'hourly' ? (isRTL ? 'عملة/ساعة' : 'coins/hr') : (isRTL ? 'قابل للتفاوض' : 'Negotiable')}
            </Text>
          </View>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'المدة:' : 'Duration:'}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {formData.duration}
            </Text>
          </View>
          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'الموقع:' : 'Location:'}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {formData.primaryLanguage === 'ar' ? formData.locationAr : formData.location}
            </Text>
          </View>
        </View>
      </View>
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
  visibilityContainer: {
    gap: 12,
  },
  visibilityCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  visibilityText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryCategory: {
    fontSize: 14,
    marginBottom: 16,
  },
  summaryRow: {
    marginBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});








