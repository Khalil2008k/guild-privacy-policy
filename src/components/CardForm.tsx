/**
 * Card Form Component
 * Independent component for adding/editing payment cards
 * COMMENT: PRODUCTION HARDENING - Task 2.8 - CardForm operates independently
 */

import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { logger } from '../utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

export interface CardFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface CardFormProps {
  initialData?: Partial<CardFormData>;
  mode?: 'add' | 'edit';
  onSubmit?: (data: CardFormData) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
}

/**
 * CardForm Component
 * Handles card form input independently
 */
const CardForm = memo<CardFormProps>(({
  initialData,
  mode = 'add',
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: initialData?.cardNumber || '',
    expiryDate: initialData?.expiryDate || '',
    cvv: initialData?.cvv || '',
    cardholderName: initialData?.cardholderName || '',
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent formatting
  const formatCardNumber = useCallback((text: string): string => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ');
    return formatted.trim();
  }, []);

  const formatExpiryDate = useCallback((text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  }, []);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent validation
  const validateForm = useCallback((): boolean => {
    if (mode === 'add') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
        Alert.alert(t('error'), t('allFieldsRequired'));
        return false;
      }

      // Validate card number (basic Luhn check would be better, but keeping it simple)
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        Alert.alert(t('error'), t('invalidCardNumber') || 'Invalid card number');
        return false;
      }

      // Validate expiry date (MM/YY format)
      if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        Alert.alert(t('error'), t('invalidExpiryDate') || 'Invalid expiry date');
        return false;
      }

      // Validate CVV
      if (formData.cvv.length < 3 || formData.cvv.length > 4) {
        Alert.alert(t('error'), t('invalidCVV') || 'Invalid CVV');
        return false;
      }
    } else {
      // Edit mode - only expiry and name required
      if (!formData.expiryDate || !formData.cardholderName) {
        Alert.alert(t('error'), t('allFieldsRequired'));
        return false;
      }
    }

    return true;
  }, [formData, mode, t]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(formData);
      } catch (error: any) {
        logger.error('Card form submission error:', error);
        Alert.alert(t('error'), error.message || t('submissionFailed') || 'Submission failed');
      }
    }
  }, [formData, validateForm, onSubmit, t]);

  const handleCardNumberChange = useCallback((text: string) => {
    const cleaned = text.replace(/\s/g, '');
    setFormData(prev => ({ ...prev, cardNumber: cleaned }));
  }, []);

  const handleExpiryDateChange = useCallback((text: string) => {
    const formatted = formatExpiryDate(text);
    setFormData(prev => ({ ...prev, expiryDate: formatted }));
  }, [formatExpiryDate]);

  const handleCvvChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cvv: cleaned }));
  }, []);

  const handleCardholderNameChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, cardholderName: text }));
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Privacy Notice */}
      <View style={[styles.noticeBox, { backgroundColor: theme.info + '15', borderColor: theme.info + '40' }]}>
        <Text style={[styles.noticeTitle, { color: theme.info, textAlign: isRTL ? 'right' : 'left' }]}>
          {mode === 'add' ? t('cardStorageNotice') : t('editCardNotice')}
        </Text>
        <Text style={[styles.noticeText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
          {mode === 'add' ? t('cardStorageNoticeText') : t('editCardNoticeText')}
        </Text>
      </View>

      {/* Card Form */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('cardInformation')}
        </Text>
          
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('cardNumber')}
          </Text>
          <TextInput
            style={[styles.formInput, { 
              backgroundColor: theme.background, 
              borderColor: theme.border, 
              color: mode === 'edit' ? theme.textSecondary : theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}
            placeholder={t('cardNumberPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={mode === 'edit' ? formData.cardNumber : formatCardNumber(formData.cardNumber)}
            onChangeText={handleCardNumberChange}
            keyboardType="numeric"
            maxLength={19}
            editable={mode === 'add'}
          />
        </View>

        <View style={[styles.formRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('expiryDate')}
            </Text>
            <TextInput
              style={[styles.formInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border, 
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }]}
              placeholder={t('expiryDatePlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={formData.expiryDate}
              onChangeText={handleExpiryDateChange}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          
          {mode === 'add' && (
            <View style={[styles.formGroup, { flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
              <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('cvv')}
              </Text>
              <TextInput
                style={[styles.formInput, { 
                  backgroundColor: theme.background, 
                  borderColor: theme.border, 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }]}
                placeholder={t('cvvPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={formData.cvv}
                onChangeText={handleCvvChange}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('cardholderName')}
          </Text>
          <TextInput
            style={[styles.formInput, { 
              backgroundColor: theme.background, 
              borderColor: theme.border, 
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}
            placeholder={t('cardholderNamePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={formData.cardholderName}
            onChangeText={handleCardholderNameChange}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton, 
            { backgroundColor: theme.primary },
            submitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.submitButtonText, { color: theme.buttonText }]}>
              {mode === 'add' ? t('addCard') : t('updateCard')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

CardForm.displayName = 'CardForm';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noticeBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  formInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});

export default CardForm;









