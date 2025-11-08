/**
 * EditPaymentMethodModal Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from payment-methods.tsx
 * Purpose: Modal for editing an existing payment method
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { CardForm } from './CardForm';

interface CardFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface EditPaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  formData: CardFormData;
  onFormChange: (field: keyof CardFormData, value: string) => void;
  formatCardNumber: (text: string) => string;
  formatExpiryDate: (text: string) => string;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const EditPaymentMethodModal: React.FC<EditPaymentMethodModalProps> = ({
  visible,
  onClose,
  formData,
  onFormChange,
  formatCardNumber,
  formatExpiryDate,
  onSubmit,
  isSubmitting,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.modalHeader,
            {
              backgroundColor: theme.background,
              paddingTop: insets.top + 10,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <X size={24} color={theme.primary} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('editPaymentMethod')}
            </Text>

            <View style={styles.headerActionButton} />
          </View>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Privacy Notice */}
          <View style={[styles.noticeBox, { backgroundColor: theme.info + '15', borderColor: theme.info + '40' }]}>
            <Text style={[styles.noticeTitle, { color: theme.info, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('editCardNotice')}
            </Text>
            <Text style={[styles.noticeText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('editCardNoticeText')}
            </Text>
          </View>

          {/* Card Form */}
          <CardForm
            formData={formData}
            onChange={onFormChange}
            formatCardNumber={formatCardNumber}
            formatExpiryDate={formatExpiryDate}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            isEditMode={true}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Signika Negative SC',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
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
    fontFamily: 'Signika Negative SC',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
    lineHeight: 20,
  },
});








