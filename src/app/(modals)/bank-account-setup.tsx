import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useI18n } from '../../../src/contexts/I18nProvider';
import ModalHeader from '../components/ModalHeader';
import { getContrastTextColor } from '../../../src/utils/colorUtils';

const FONT_FAMILY = 'Signika Negative SC';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  iban: string;
  swiftCode: string;
  isDefault: boolean;
}

export default function BankAccountSetupScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  // Removed showAddForm - form shows only when no accounts exist
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    swiftCode: '',
  });

  const qatarBanks = [
    // Qatar Banks
    'Qatar National Bank (QNB)',
    'Commercial Bank of Qatar (CBQ)',
    'Doha Bank',
    'Qatar Islamic Bank (QIB)',
    'Ahli Bank Qatar',
    'Qatar International Islamic Bank (QIIB)',
    'Masraf Al Rayan',
    'International Bank of Qatar (IBQ)',
    'United Development Bank (UDB)',
    'Al Khalij Commercial Bank',
    'Barwa Bank',
    'Qatar Development Bank (QDB)',
    'Industrial Development Bank of Qatar',
    'Qatar First Bank',
    'Dukhan Bank',
    'Al Jazeera Finance Company',
    'Qatar Finance & Business Company',
    
    // UAE Banks
    'Emirates NBD Bank',
    'First Abu Dhabi Bank (FAB)',
    'Abu Dhabi Commercial Bank (ADCB)',
    'Dubai Islamic Bank (DIB)',
    'Mashreq Bank',
    'Commercial Bank of Dubai (CBD)',
    'Union National Bank (UNB)',
    'Ajman Bank',
    'Bank of Sharjah',
    'Emirates Islamic Bank',
    'HSBC UAE',
    'Standard Chartered UAE',
    'Citibank UAE',
    'RAKBANK',
    'Invest Bank',
    'United Arab Bank',
    'Arab Bank UAE',
    'Habib Bank AG Zurich UAE',
    
    // Saudi Arabia Banks
    'Saudi National Bank (SNB)',
    'Al Rajhi Bank',
    'Riyad Bank',
    'Banque Saudi Fransi',
    'Saudi British Bank (SABB)',
    'Arab National Bank (ANB)',
    'Bank AlJazira',
    'Alinma Bank',
    'Bank Albilad',
    'Saudi Investment Bank (SAIB)',
    'National Commercial Bank (NCB)',
    'Saudi Hollandi Bank',
    
    // Kuwait Banks
    'National Bank of Kuwait (NBK)',
    'Kuwait Finance House (KFH)',
    'Commercial Bank of Kuwait (CBK)',
    'Gulf Bank Kuwait',
    'Ahli United Bank Kuwait',
    'Burgan Bank',
    'Kuwait International Bank (KIB)',
    'Warba Bank',
    'Boubyan Bank',
    
    // Bahrain Banks
    'National Bank of Bahrain (NBB)',
    'Ahli United Bank Bahrain',
    'BBK Bank',
    'Gulf International Bank (GIB)',
    'Ithmaar Bank',
    'Al Salam Bank Bahrain',
    'Khaleeji Commercial Bank',
    'Future Bank',
    'Bank of Bahrain and Kuwait (BBK)',
    
    // Oman Banks
    'Bank Muscat',
    'National Bank of Oman (NBO)',
    'Ahli Bank Oman',
    'HSBC Bank Oman',
    'Sohar International Bank',
    'Oman Arab Bank',
    'Bank Dhofar',
    'Nizwa Bank',
    'Al Izz Islamic Bank',
    
    // International Banks in GCC
    'HSBC Middle East',
    'Standard Chartered',
    'Citibank',
    'Deutsche Bank',
    'BNP Paribas',
    'Credit Suisse',
    'JPMorgan Chase',
    'Barclays Bank',
    'Arab Banking Corporation (ABC)',
    'Gulf International Bank',
  ];

  const selectBank = (bankName: string) => {
    setFormData({ ...formData, bankName });
    setShowBankModal(false);
  };

  const validateForm = () => {
    if (!formData.bankName.trim()) {
      CustomAlertService.showError(t('common.error'), t('bankSetup.bankNameRequired'));
      return false;
    }
    if (!formData.accountNumber.trim()) {
      CustomAlertService.showError(t('common.error'), t('bankSetup.accountNumberRequired'));
      return false;
    }
    if (!formData.accountHolderName.trim()) {
      CustomAlertService.showError(t('common.error'), t('bankSetup.accountHolderRequired'));
      return false;
    }
    
    return true;
  };

  const handleAddAccount = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newAccount: BankAccount = {
        id: Date.now().toString(),
        ...formData,
        isDefault: accounts.length === 0, // First account is default
      };
      
      setAccounts([newAccount]); // Only allow one account
      setFormData({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        swiftCode: '',
      });
      // Form will automatically hide since accounts.length > 0
      
      CustomAlertService.showSuccess(
        t('common.success'),
        t('bankSetup.accountAddedSuccess')
      );
    } catch (error) {
      CustomAlertService.showError(t('common.error'), t('bankSetup.addAccountError'));
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteAccount = (accountId: string) => {
    CustomAlertService.showConfirmation(
      t('bankSetup.deleteAccountTitle'),
      t('bankSetup.deleteAccountMessage'),
      () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setAccounts([]); // Remove the account - form will show again
      },
      undefined,
      isRTL
    );
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
      padding: 20,
      paddingBottom: 0,
      backgroundColor: theme.background,
    },
    headerSection: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 24,
    },
    accountCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    defaultAccountCard: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    accountHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    bankName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      flex: 1,
    },
    defaultBadge: {
      backgroundColor: theme.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    defaultBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    accountDetails: {
      gap: 6,
    },
    accountDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '500',
      flex: 2,
      textAlign: 'right',
    },
    accountActions: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 6,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    setDefaultButton: {
      backgroundColor: theme.primary + '20',
      borderWidth: 1,
      borderColor: theme.primary,
    },
    setDefaultButtonText: {
      color: theme.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    deleteButton: {
      backgroundColor: theme.error + '20',
      borderWidth: 1,
      borderColor: theme.error,
    },
    deleteButtonText: {
      color: theme.error,
      fontWeight: '600',
      fontSize: 14,
    },
    addButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    formContainer: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      marginTop: 16,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: theme.border,
      width: '100%',
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    inputGroup: {
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.textPrimary,
      backgroundColor: theme.background,
    },
    bankSelector: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.background,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bankSelectorText: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    bankSelectorPlaceholder: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    formActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
      marginBottom: 0,
      width: '100%',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: getContrastTextColor(theme.surface),
      fontWeight: '600',
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    submitButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonText: {
      color: getContrastTextColor(theme.primary),
      fontWeight: '600',
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalContainer: {
      flex: 1,
      paddingTop: 50,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    modalCloseButton: {
      padding: 4,
    },
    bankItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    bankItemText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ModalHeader 
        title={t('bankSetup.title')}
        onClose={() => router.back()}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ backgroundColor: theme.background, minHeight: '100%' }}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>{t('bankSetup.manageAccounts')}</Text>
          <Text style={styles.subtitle}>{t('bankSetup.description')}</Text>
        </View>

        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={40} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('bankSetup.noAccountsTitle')}</Text>
            <Text style={styles.emptyDescription}>{t('bankSetup.noAccountsDescription')}</Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View 
              key={account.id} 
              style={[
                styles.accountCard,
                account.isDefault && styles.defaultAccountCard
              ]}
            >
              <View style={styles.accountHeader}>
                <Text style={styles.bankName}>{account.bankName}</Text>
                {account.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>{t('bankSetup.default')}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.accountDetails}>
                <View style={styles.accountDetail}>
                  <Text style={styles.detailLabel}>{t('bankSetup.accountHolder')}</Text>
                  <Text style={styles.detailValue}>{account.accountHolderName}</Text>
                </View>
                <View style={styles.accountDetail}>
                  <Text style={styles.detailLabel}>{t('bankSetup.accountNumber')}</Text>
                  <Text style={styles.detailValue}>****{account.accountNumber.slice(-4)}</Text>
                </View>
                {account.swiftCode && (
                  <View style={styles.accountDetail}>
                    <Text style={styles.detailLabel}>{t('bankSetup.swiftCode')}</Text>
                    <Text style={styles.detailValue}>{account.swiftCode}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.accountActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteAccount(account.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {accounts.length === 0 && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{t('bankSetup.addNewAccount')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bankSetup.bankName')} *</Text>
              <TouchableOpacity 
                style={styles.bankSelector}
                onPress={() => setShowBankModal(true)}
              >
                <Text style={formData.bankName ? styles.bankSelectorText : styles.bankSelectorPlaceholder}>
                  {formData.bankName || t('bankSetup.selectBank')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bankSetup.accountHolderName')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.accountHolderName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, accountHolderName: text }))}
                placeholder={t('bankSetup.accountHolderPlaceholder')}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bankSetup.accountNumber')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.accountNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, accountNumber: text }))}
                placeholder={t('bankSetup.accountNumberPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bankSetup.swiftCode')}</Text>
              <TextInput
                style={styles.input}
                value={formData.swiftCode}
                onChangeText={(text) => setFormData(prev => ({ ...prev, swiftCode: text.toUpperCase() }))}
                placeholder={t('bankSetup.swiftCodePlaceholder')}
                placeholderTextColor={theme.textSecondary}
                maxLength={11}
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  // Reset form data
                  setFormData({
                    bankName: '',
                    accountNumber: '',
                    accountHolderName: '',
                    swiftCode: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleAddAccount}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? t('bankSetup.adding') : t('bankSetup.addAccount')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bank Selection Modal */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Bank</Text>
            <TouchableOpacity 
              onPress={() => setShowBankModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={qatarBanks}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.bankItem, { borderBottomColor: theme.border }]}
                onPress={() => selectBank(item)}
              >
                <Text style={[styles.bankItemText, { color: theme.textPrimary }]}>
                  {item}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
