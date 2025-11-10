/**
 * LanguageSelector Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 538-581)
 * Purpose: Language selection component for job posting
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';

interface LanguageSelectorProps {
  primaryLanguage: 'en' | 'ar' | 'both';
  onLanguageChange: (language: 'en' | 'ar' | 'both') => void;
}

export const LanguageSelector = React.memo<LanguageSelectorProps>(({ primaryLanguage, onLanguageChange }) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  const languageOptions = [
    { key: 'en' as const, label: isRTL ? 'الإنجليزية' : 'English' },
    { key: 'ar' as const, label: isRTL ? 'العربية' : 'Arabic' },
    { key: 'both' as const, label: isRTL ? 'كلاهما' : 'Both' },
  ];

  return (
    <View style={styles.languageSelector}>
      <Text style={[styles.languageLabel, { 
        color: theme.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
      }]}>
        {isRTL ? 'اللغة الأساسية' : 'Primary Language'}
      </Text>
      <View style={[styles.languageOptions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {languageOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.languageOption,
              {
                backgroundColor: primaryLanguage === option.key ? theme.primary : theme.surface,
                borderColor: primaryLanguage === option.key ? theme.primary : theme.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                marginRight: isRTL ? 0 : 8,
                marginLeft: isRTL ? 8 : 0,
              },
            ]}
            onPress={() => onLanguageChange(option.key)}
          >
            <Text
              style={[
                styles.languageOptionText,
                {
                  color: primaryLanguage === option.key ? '#000000' : theme.textPrimary,
                  textAlign: 'center',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

const styles = StyleSheet.create({
  languageSelector: {
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});









