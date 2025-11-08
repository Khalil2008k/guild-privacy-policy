/**
 * Delete Account Screen
 * 
 * Apple Guideline 5.1.1(v) - Account Deletion Requirement
 * 
 * Allows users to delete their account and all associated data
 * from within the app.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { AlertTriangle, Trash2, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { BackendAPI } from '../../config/backend';
import { logger } from '../../utils/logger';
import { auth } from '../../config/firebase';

const FONT_FAMILY = 'Signika Negative SC';

type DeletionReason = 'no_longer_needed' | 'privacy_concerns' | 'switching_platforms' | 'too_expensive' | 'not_enough_features' | 'other';

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'warning' | 'reason' | 'confirm' | 'processing' | 'complete'>('warning');
  const [selectedReason, setSelectedReason] = useState<DeletionReason>('no_longer_needed');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  const reasons: { value: DeletionReason; label: string; labelAr: string }[] = [
    { value: 'no_longer_needed', label: 'No longer needed', labelAr: 'لم أعد بحاجة إليه' },
    { value: 'privacy_concerns', label: 'Privacy concerns', labelAr: 'مخاوف تتعلق بالخصوصية' },
    { value: 'switching_platforms', label: 'Switching to another platform', labelAr: 'الانتقال إلى منصة أخرى' },
    { value: 'too_expensive', label: 'Too expensive', labelAr: 'باهظ الثمن' },
    { value: 'not_enough_features', label: 'Not enough features', labelAr: 'عدم كفاية الميزات' },
    { value: 'other', label: 'Other', labelAr: 'أخرى' },
  ];

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      setError(isRTL ? 'يرجى كتابة DELETE للتأكيد' : 'Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      logger.info('🗑️ Initiating account deletion...');

      const response = await BackendAPI.post('/api/account/delete', {
        reason: selectedReason,
        confirmationText,
      });

      if (response && response.success) {
        logger.info('✅ Account deletion successful');
        setStep('complete');
        
        // Sign out after 3 seconds
        setTimeout(async () => {
          try {
            await auth.signOut();
            router.replace('/');
          } catch (signOutError) {
            logger.error('Error signing out:', signOutError);
            router.replace('/');
          }
        }, 3000);
      } else {
        throw new Error(response?.error || 'Deletion failed');
      }
    } catch (error: any) {
      logger.error('❌ Account deletion failed:', error);
      setError(error.message || (isRTL ? 'فشل حذف الحساب' : 'Failed to delete account'));
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const renderWarning = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
        <AlertTriangle size={48} color={theme.error} />
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {isRTL ? 'حذف الحساب' : 'Delete Account'}
      </Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isRTL 
          ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك بشكل دائم.'
          : 'This action cannot be undone. All your data will be permanently deleted.'
        }
      </Text>

      <View style={[styles.warningBox, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]}>
        <Text style={[styles.warningTitle, { color: theme.error }]}>
          {isRTL ? 'ما سيتم حذفه:' : 'What will be deleted:'}
        </Text>
        <Text style={[styles.warningText, { color: theme.textPrimary }]}>
          • {isRTL ? 'معلومات الملف الشخصي' : 'Profile information'}{'\n'}
          • {isRTL ? 'المحفظة والعملات' : 'Wallet and coins'}{'\n'}
          • {isRTL ? 'سجل المعاملات' : 'Transaction history'}{'\n'}
          • {isRTL ? 'الوظائف والطلبات' : 'Jobs and applications'}{'\n'}
          • {isRTL ? 'الإشعارات' : 'Notifications'}{'\n'}
          • {isRTL ? 'بيانات التحقق من الهوية' : 'KYC verification data'}
        </Text>
      </View>

      <View style={[styles.warningBox, { backgroundColor: theme.warning + '10', borderColor: theme.warning + '30' }]}>
        <Text style={[styles.warningTitle, { color: theme.warning }]}>
          {isRTL ? 'قبل المتابعة:' : 'Before proceeding:'}
        </Text>
        <Text style={[styles.warningText, { color: theme.textPrimary }]}>
          • {isRTL ? 'أكمل جميع الوظائف النشطة' : 'Complete all active jobs'}{'\n'}
          • {isRTL ? 'اسحب رصيدك المتبقي' : 'Withdraw any remaining balance'}{'\n'}
          • {isRTL ? 'قم بتصدير بياناتك إذا لزم الأمر' : 'Export your data if needed'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setStep('reason')}
        style={[styles.button, { backgroundColor: theme.error }]}
      >
        <Trash2 size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>
          {isRTL ? 'متابعة الحذف' : 'Continue with Deletion'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
          {isRTL ? 'إلغاء' : 'Cancel'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReason = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {isRTL ? 'لماذا تغادر؟' : 'Why are you leaving?'}
      </Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isRTL 
          ? 'ساعدنا في التحسين من خلال إخبارنا بسبب المغادرة'
          : 'Help us improve by telling us why you\'re leaving'
        }
      </Text>

      {reasons.map((reason) => (
        <TouchableOpacity
          key={reason.value}
          onPress={() => setSelectedReason(reason.value)}
          style={[
            styles.reasonOption,
            { 
              backgroundColor: selectedReason === reason.value ? theme.primary + '20' : theme.surface,
              borderColor: selectedReason === reason.value ? theme.primary : theme.border
            }
          ]}
        >
          <View style={[
            styles.radio,
            { borderColor: selectedReason === reason.value ? theme.primary : theme.border }
          ]}>
            {selectedReason === reason.value && (
              <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
            )}
          </View>
          <Text style={[styles.reasonText, { color: theme.textPrimary }]}>
            {isRTL ? reason.labelAr : reason.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={() => setStep('confirm')}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.buttonText, { color: '#000000' }]}>
          {isRTL ? 'التالي' : 'Next'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setStep('warning')}
        style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
          {isRTL ? 'رجوع' : 'Back'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirm = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
        <AlertTriangle size={48} color={theme.error} />
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {isRTL ? 'تأكيد نهائي' : 'Final Confirmation'}
      </Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isRTL 
          ? 'اكتب DELETE لتأكيد حذف حسابك نهائيًا'
          : 'Type DELETE to confirm permanent account deletion'
        }
      </Text>

      <TextInput
        value={confirmationText}
        onChangeText={setConfirmationText}
        placeholder="DELETE"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { 
            backgroundColor: theme.surface,
            borderColor: error ? theme.error : theme.border,
            color: theme.textPrimary
          }
        ]}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleDeleteAccount}
        disabled={loading || confirmationText !== 'DELETE'}
        style={[
          styles.button,
          { 
            backgroundColor: confirmationText === 'DELETE' ? theme.error : theme.border,
            opacity: confirmationText === 'DELETE' ? 1 : 0.5
          }
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Trash2 size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              {isRTL ? 'حذف حسابي' : 'Delete My Account'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setStep('reason')}
        disabled={loading}
        style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
          {isRTL ? 'رجوع' : 'Back'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.content}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.title, { color: theme.textPrimary, marginTop: 24 }]}>
        {isRTL ? 'جاري حذف الحساب...' : 'Deleting Account...'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isRTL ? 'يرجى الانتظار' : 'Please wait'}
      </Text>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
        <CheckCircle size={48} color={theme.primary} />
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {isRTL ? 'تم حذف الحساب' : 'Account Deleted'}
      </Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isRTL 
          ? 'تم حذف حسابك وجميع بياناتك بنجاح. شكرًا لاستخدام GUILD.'
          : 'Your account and all data have been successfully deleted. Thank you for using GUILD.'
        }
      </Text>

      <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: 16 }]}>
        {isRTL 
          ? 'سيتم تسجيل خروجك تلقائيًا...'
          : 'You will be automatically logged out...'
        }
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { 
          paddingTop: insets.top + 16,
          backgroundColor: theme.surface,
          borderBottomColor: theme.border
        }
      ]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={loading || step === 'processing' || step === 'complete'}
        >
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'حذف الحساب' : 'Delete Account'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'warning' && renderWarning()}
        {step === 'reason' && renderReason()}
        {step === 'confirm' && renderConfirm()}
        {step === 'processing' && renderProcessing()}
        {step === 'complete' && renderComplete()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  warningBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 22,
  },
  reasonOption: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});

