/**
 * Step1BasicInfo Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 671-847)
 * Purpose: Renders step 1 - Basic Information (Title, Category, Description)
 */

import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { LanguageSelector } from './LanguageSelector';
import { getCategories } from '../_constants/jobFormConstants';

interface JobFormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  primaryLanguage: 'en' | 'ar' | 'both';
}

interface Step1BasicInfoProps {
  formData: JobFormData;
  focusedField: string | null;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onInputChange: (field: keyof JobFormData, value: any) => void;
  onFocusChange: (field: string | null) => void;
  onLanguageChange: (language: 'en' | 'ar' | 'both') => void;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  formData,
  focusedField,
  fadeAnim,
  slideAnim,
  scaleAnim,
  onInputChange,
  onFocusChange,
  onLanguageChange,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  // COMMENT: PRIORITY 1 - File Modularization - Use constants from _constants/jobFormConstants.ts
  const categories = getCategories(isRTL);

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
        {isRTL ? 'معلومات أساسية' : 'Basic Information'}
      </Text>
      
      <LanguageSelector
        primaryLanguage={formData.primaryLanguage}
        onLanguageChange={onLanguageChange}
      />
      
      {/* Job Title */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'عنوان الوظيفة' : 'Job Title'} *
        </Text>
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'title' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'مثال: مطور تطبيقات جوال' : 'e.g. Mobile App Developer'}
            placeholderTextColor={theme.textSecondary}
            value={formData.title}
            onChangeText={(value) => onInputChange('title', value)}
            onFocus={() => onFocusChange('title')}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'titleAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'مثال: مطور تطبيقات جوال' : 'مثال: مطور تطبيقات جوال'}
            placeholderTextColor={theme.textSecondary}
            value={formData.titleAr}
            onChangeText={(value) => onInputChange('titleAr', value)}
            onFocus={() => onFocusChange('titleAr')}
          />
        ) : null}
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'التصنيف' : 'Category'} *
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={{ 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            gap: 12,
          }}
        >
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: formData.category === category.key ? category.color : theme.surface,
                    borderColor: formData.category === category.key ? category.color : theme.border,
                  },
                ]}
                onPress={() => onInputChange('category', category.key)}
              >
                <IconComponent 
                  size={24}
                  color={formData.category === category.key ? '#FFFFFF' : theme.textPrimary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: formData.category === category.key ? '#FFFFFF' : theme.textPrimary,
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'الوصف' : 'Description'} *
        </Text>
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'description' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'اكتب وصفاً مفصلاً للوظيفة...' : 'Write a detailed description of the job...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.description}
            onChangeText={(value) => onInputChange('description', value)}
            onFocus={() => onFocusChange('description')}
            multiline
            numberOfLines={4}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'descriptionAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'اكتب وصفاً مفصلاً للوظيفة...' : 'اكتب وصفاً مفصلاً للوظيفة...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.descriptionAr}
            onChangeText={(value) => onInputChange('descriptionAr', value)}
            onFocus={() => onFocusChange('descriptionAr')}
            multiline
            numberOfLines={4}
          />
        ) : null}
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
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 100,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});

