/**
 * CardForm Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from payment-methods.tsx
 * Purpose: Renders card form fields for adding/editing payment methods
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';

interface CardFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface CardFormProps {
  formData: CardFormData;
  onChange: (field: keyof CardFormData, value: string) => void;
  formatCardNumber: (text: string) => string;
  formatExpiryDate: (text: string) => string;
  onSubmit: () => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
}

export const CardForm: React.FC<CardFormProps> = ({
  formData,
  onChange,
  formatCardNumber,
  formatExpiryDate,
  onSubmit,
  isSubmitting,
  isEditMode = false,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  return (
    <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
        {t('cardInformation')}
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('cardNumber')}
        </Text>
        <TextInput
          style={[
            styles.formInput,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: isEditMode ? theme.textSecondary : theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}
          placeholder={t('cardNumberPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={isEditMode ? formData.cardNumber : formatCardNumber(formData.cardNumber)}
          onChangeText={(text) => onChange('cardNumber', text.replace(/\s/g, ''))}
          keyboardType="numeric"
          maxLength={19}
          editable={!isEditMode}
        />
      </View>

      {!isEditMode && (
        <View style={[styles.formRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('expiryDate')}
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}
              placeholder={t('expiryDatePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={formData.expiryDate}
              onChangeText={(text) => onChange('expiryDate', formatExpiryDate(text))}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
            <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('cvv')}
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}
              placeholder={t('cvvPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={formData.cvv}
              onChangeText={(text) => onChange('cvv', text)}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
      )}

      {isEditMode && (
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('expiryDate')}
          </Text>
          <TextInput
            style={[
              styles.formInput,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}
            placeholder={t('expiryDatePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={formData.expiryDate}
            onChangeText={(text) => onChange('expiryDate', formatExpiryDate(text))}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('cardholderName')}
        </Text>
        <TextInput
          style={[
            styles.formInput,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}
          placeholder={t('cardholderNamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={formData.cardholderName}
          onChangeText={(text) => onChange('cardholderName', text)}
          autoCapitalize="words"
        />
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }, isSubmitting && styles.addButtonDisabled]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.buttonText} />
        ) : (
          <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
            {isEditMode ? t('updateCard') : t('addCard')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Signika Negative SC',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Signika Negative SC',
    marginBottom: 6,
  },
  formInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Signika Negative SC',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
});







