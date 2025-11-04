/**
 * COIN WITHDRAWAL REQUEST
 * Request withdrawal to cash (admin-mediated, 10-14 days)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { CoinWithdrawalService } from '../../services/CoinWithdrawalService';
import { CoinWalletAPIClient } from '../../services/CoinWalletAPIClient';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

export default function CoinWithdrawalScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [note, setNote] = useState('');

  const colors = {
    bg: isDarkMode ? '#000000' : '#FFFFFF',
    surface: isDarkMode ? '#1A1A1A' : '#F8F9FA',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#999999' : '#666666',
    border: isDarkMode ? '#333333' : '#E5E5E5',
    primary: theme.primary || '#6366F1',
    error: '#EF4444',
    success: '#10B981',
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await CoinWalletAPIClient.getBalance();
      setBalance(data);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading balance:', error);
    }
  };

  const totalValue = balance?.balances
    ? Object.entries(balance.balances).reduce((sum, [sym, qty]: [string, any]) => {
        const values: any = { GBC: 5, GSC: 10, GGC: 50, GPC: 100, GDC: 200, GRC: 500 };
        return sum + (qty * (values[sym] || 0));
      }, 0)
    : 0;

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert(
        t('error'),
        t('enterValidAmount'),
        [{ text: isRTL ? 'حسناً' : 'OK' }]
      );
      return;
    }

    if (amountNum > totalValue) {
      Alert.alert(
        t('error'),
        t('insufficientBalance'),
        [{ text: isRTL ? 'حسناً' : 'OK' }]
      );
      return;
    }

    if (!bankDetails.trim()) {
      Alert.alert(
        t('error'),
        t('enterBankDetails'),
        [{ text: isRTL ? 'حسناً' : 'OK' }]
      );
      return;
    }

    Alert.alert(
      t('confirm'),
      `${t('requestWithdrawalOf')} ${amountNum} ${isRTL ? 'ريال' : 'QAR'}?\n\n${t('processingTakes')}`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            setLoading(true);
            try {
              await CoinWithdrawalService.requestWithdrawal({
                amount: amountNum,
                bankDetails,
                note,
              });

              Alert.alert(
                t('success'),
                t('withdrawalRequestSubmitted'),
                [{ text: isRTL ? 'حسناً' : 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              Alert.alert(
                t('error'),
                t('withdrawalRequestFailed'),
                [{ text: isRTL ? 'حسناً' : 'OK' }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary + 'DD']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.2)',
          }]}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { 
            fontFamily: FONT_FAMILY, 
            color: '#000000',
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }]}>
            {t('withdrawalRequest')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Available Balance */}
        <View style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { fontFamily: FONT_FAMILY, color: '#000000' }]}>
            {t('availableBalance')}
          </Text>
          <Text style={[styles.balanceValue, { fontFamily: FONT_FAMILY, color: '#000000' }]}>
            {totalValue.toFixed(2)} {isRTL ? 'ريال' : 'QAR'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('importantInformation')}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('withdrawalInfo')}
            </Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('amountQAR')}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}
              value={amount}
              onChangeText={setAmount}
              placeholder={isRTL ? 'أدخل المبلغ' : 'Enter amount'}
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.inputSuffix, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>QAR</Text>
          </View>
          <View style={[styles.quickAmounts, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {[100, 500, 1000].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setAmount(val.toString())}
                style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.quickBtnText, { color: colors.text, fontFamily: FONT_FAMILY }]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setAmount(totalValue.toString())}
              style={[styles.quickBtn, { backgroundColor: colors.primary }]}
            >
                <Text style={[styles.quickBtnText, { color: '#000000', fontFamily: FONT_FAMILY }]}>
                  {t('max')}
                </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('bankDetails')}
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}
            value={bankDetails}
            onChangeText={setBankDetails}
            placeholder={t('bankDetailsPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Note */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('noteOptional')}
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}
            value={note}
            onChangeText={setNote}
            placeholder={t('additionalNotes')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={loading}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="cash-outline" size={24} color="#000000" />
              <Text style={[styles.submitBtnText, { fontFamily: FONT_FAMILY, color: '#000000' }]}>
                {t('submitWithdrawalRequest')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  headerBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'transparent', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#000000' },
  balanceCard: { 
    marginHorizontal: 16, 
    padding: 16, 
    backgroundColor: 'transparent', 
    borderRadius: 16, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceLabel: { fontSize: 14, color: '#000000', marginBottom: 4, fontWeight: '600' },
  balanceValue: { fontSize: 32, fontWeight: '700', color: '#000000' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  infoBox: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1.5, 
    marginBottom: 24, 
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 13, lineHeight: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 16, 
    borderWidth: 1.5, 
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: { flex: 1, fontSize: 18, fontWeight: '600', paddingVertical: 16 },
  inputSuffix: { fontSize: 16, fontWeight: '600' },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickBtnText: { fontSize: 14, fontWeight: '600' },
  textArea: { 
    borderRadius: 16, 
    borderWidth: 1.5, 
    padding: 16, 
    fontSize: 14, 
    minHeight: 100, 
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  submitBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 16, 
    gap: 8, 
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: { fontSize: 18, fontWeight: '700', color: '#000000' },
});

