import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // Exchange rate to QAR
  change24h: number; // Percentage change in 24h
  isSupported: boolean;
  isPreferred: boolean;
}

interface CurrencyConversion {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: string;
  fee: number;
}

interface WalletBalance {
  currency: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
}

export default function CurrencyManagerScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'convert' | 'history' | 'settings'>('overview');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [conversionAmount, setConversionAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('QAR');
  const [toCurrency, setToCurrency] = useState('USD');

  // Mock currencies data
  const currencies: Currency[] = [
    {
      code: 'QAR',
      name: 'Qatari Riyal',
      symbol: 'ر.ق',
      flag: '🇶🇦',
      rate: 1.0,
      change24h: 0.0,
      isSupported: true,
      isPreferred: true,
    },
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      flag: '🇺🇸',
      rate: 0.275,
      change24h: +0.15,
      isSupported: true,
      isPreferred: true,
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      flag: '🇪🇺',
      rate: 0.252,
      change24h: -0.08,
      isSupported: true,
      isPreferred: true,
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      flag: '🇬🇧',
      rate: 0.218,
      change24h: +0.22,
      isSupported: true,
      isPreferred: false,
    },
    {
      code: 'AED',
      name: 'UAE Dirham',
      symbol: 'د.إ',
      flag: '🇦🇪',
      rate: 1.009,
      change24h: +0.05,
      isSupported: true,
      isPreferred: true,
    },
    {
      code: 'SAR',
      name: 'Saudi Riyal',
      symbol: 'ر.س',
      flag: '🇸🇦',
      rate: 1.031,
      change24h: -0.02,
      isSupported: true,
      isPreferred: true,
    },
    {
      code: 'KWD',
      name: 'Kuwaiti Dinar',
      symbol: 'د.ك',
      flag: '🇰🇼',
      rate: 0.084,
      change24h: +0.18,
      isSupported: true,
      isPreferred: false,
    },
    {
      code: 'BHD',
      name: 'Bahraini Dinar',
      symbol: '.د.ب',
      flag: '🇧🇭',
      rate: 0.103,
      change24h: +0.12,
      isSupported: true,
      isPreferred: false,
    },
    {
      code: 'OMR',
      name: 'Omani Rial',
      symbol: 'ر.ع.',
      flag: '🇴🇲',
      rate: 0.106,
      change24h: +0.09,
      isSupported: true,
      isPreferred: false,
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      flag: '🇯🇵',
      rate: 41.2,
      change24h: -0.35,
      isSupported: true,
      isPreferred: false,
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      flag: '🇨🇦',
      rate: 0.372,
      change24h: +0.11,
      isSupported: true,
      isPreferred: false,
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      flag: '🇦🇺',
      rate: 0.413,
      change24h: -0.19,
      isSupported: true,
      isPreferred: false,
    },
  ];

  // Mock wallet balances
  const walletBalances: WalletBalance[] = [
    { currency: 'QAR', balance: 45750.00, lockedBalance: 5000.00, availableBalance: 40750.00 },
    { currency: 'USD', balance: 2840.50, lockedBalance: 200.00, availableBalance: 2640.50 },
    { currency: 'EUR', balance: 1250.75, lockedBalance: 0.00, availableBalance: 1250.75 },
    { currency: 'AED', balance: 8920.25, lockedBalance: 1500.00, availableBalance: 7420.25 },
    { currency: 'SAR', balance: 3450.00, lockedBalance: 0.00, availableBalance: 3450.00 },
  ];

  // Mock conversion history
  const conversionHistory: CurrencyConversion[] = [
    {
      id: 'conv_001',
      fromCurrency: 'QAR',
      toCurrency: 'USD',
      amount: 10000,
      convertedAmount: 2750,
      rate: 0.275,
      timestamp: '2025-09-19T10:30:00Z',
      fee: 25.00,
    },
    {
      id: 'conv_002',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      amount: 1000,
      convertedAmount: 916.67,
      rate: 0.9167,
      timestamp: '2025-09-18T14:15:00Z',
      fee: 8.50,
    },
    {
      id: 'conv_003',
      fromCurrency: 'AED',
      toCurrency: 'QAR',
      amount: 5000,
      convertedAmount: 4955.45,
      rate: 0.9911,
      timestamp: '2025-09-17T09:45:00Z',
      fee: 12.75,
    },
  ];

  const getCurrencyByCode = (code: string) => currencies.find(c => c.code === code);
  const getWalletBalance = (code: string) => walletBalances.find(w => w.currency === code);

  const calculateConversion = () => {
    const amount = parseFloat(conversionAmount);
    if (!amount || amount <= 0) return 0;
    
    const fromCurr = getCurrencyByCode(fromCurrency);
    const toCurr = getCurrencyByCode(toCurrency);
    
    if (!fromCurr || !toCurr) return 0;
    
    // Convert to QAR first, then to target currency
    const qarAmount = amount / fromCurr.rate;
    const convertedAmount = qarAmount * toCurr.rate;
    
    return convertedAmount;
  };

  const getConversionFee = () => {
    const amount = parseFloat(conversionAmount);
    if (!amount || amount <= 0) return 0;
    
    // 0.25% conversion fee, minimum 1 QAR
    const feeRate = 0.0025;
    const fromCurr = getCurrencyByCode(fromCurrency);
    if (!fromCurr) return 0;
    
    const qarAmount = amount / fromCurr.rate;
    const fee = Math.max(qarAmount * feeRate, 1);
    
    return fee;
  };

  const handleCurrencyConversion = () => {
    const amount = parseFloat(conversionAmount);
    if (!amount || amount <= 0) {
      CustomAlertService.showError(
        isRTL ? 'مبلغ غير صحيح' : 'Invalid Amount',
        isRTL ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount'
      );
      return;
    }

    const fromWallet = getWalletBalance(fromCurrency);
    if (!fromWallet || fromWallet.availableBalance < amount) {
      CustomAlertService.showError(
        isRTL ? 'رصيد غير كافي' : 'Insufficient Balance',
        isRTL ? 'ليس لديك رصيد كافي لهذا التحويل' : 'You do not have sufficient balance for this conversion'
      );
      return;
    }

    const convertedAmount = calculateConversion();
    const fee = getConversionFee();
    
    CustomAlertService.showConfirmation(
      isRTL ? 'تأكيد التحويل' : 'Confirm Conversion',
      isRTL 
        ? `تحويل ${amount} ${fromCurrency} إلى ${convertedAmount.toFixed(2)} ${toCurrency}\nالرسوم: ${fee.toFixed(2)} QAR`
        : `Convert ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}\nFee: ${fee.toFixed(2)} QAR`,
      () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        console.log('Currency conversion confirmed');
        setConversionAmount('');
        CustomAlertService.showSuccess(
          isRTL ? 'تم التحويل' : 'Conversion Complete',
          isRTL ? 'تم تحويل العملة بنجاح' : 'Currency conversion completed successfully'
        );
      },
      undefined,
      isRTL
    );
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Total Portfolio Value */}
      <View style={[styles.portfolioCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <LinearGradient
          colors={[theme.primary, theme.primary + 'CC']}
          style={styles.portfolioGradient}
        >
          <View style={styles.portfolioHeader}>
            <Text style={[styles.portfolioLabel, { color: '#000000CC' }]}>
              {isRTL ? 'إجمالي قيمة المحفظة' : 'Total Portfolio Value'}
            </Text>
            <Text style={[styles.portfolioValue, { color: '#000000' }]}>
              QAR {walletBalances.reduce((sum, wallet) => {
                const currency = getCurrencyByCode(wallet.currency);
                return sum + (wallet.balance / (currency?.rate || 1));
              }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.portfolioStats}>
            <View style={styles.portfolioStat}>
              <Text style={[styles.portfolioStatLabel, { color: '#000000CC' }]}>
                {isRTL ? 'متاح' : 'Available'}
              </Text>
              <Text style={[styles.portfolioStatValue, { color: '#000000' }]}>
                QAR {walletBalances.reduce((sum, wallet) => {
                  const currency = getCurrencyByCode(wallet.currency);
                  return sum + (wallet.availableBalance / (currency?.rate || 1));
                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.portfolioStat}>
              <Text style={[styles.portfolioStatLabel, { color: '#000000CC' }]}>
                {isRTL ? 'مقفل' : 'Locked'}
              </Text>
              <Text style={[styles.portfolioStatValue, { color: '#000000' }]}>
                QAR {walletBalances.reduce((sum, wallet) => {
                  const currency = getCurrencyByCode(wallet.currency);
                  return sum + (wallet.lockedBalance / (currency?.rate || 1));
                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Currency Balances */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'أرصدة العملات' : 'Currency Balances'}
        </Text>
        
        {walletBalances.map((wallet) => {
          const currency = getCurrencyByCode(wallet.currency);
          if (!currency) return null;
          
          return (
            <View key={wallet.currency} style={[styles.balanceCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceInfo}>
                  <Text style={styles.currencyFlag}>{currency.flag}</Text>
                  <View>
                    <Text style={[styles.currencyCode, { color: theme.textPrimary }]}>
                      {currency.code}
                    </Text>
                    <Text style={[styles.currencyName, { color: theme.textSecondary }]}>
                      {currency.name}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.balanceValues}>
                  <Text style={[styles.balanceAmount, { color: theme.textPrimary }]}>
                    {currency.symbol} {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.balanceQAR, { color: theme.textSecondary }]}>
                    ≈ QAR {(wallet.balance / currency.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
              
              {wallet.lockedBalance > 0 && (
                <View style={styles.balanceDetails}>
                  <View style={styles.balanceDetail}>
                    <Text style={[styles.balanceDetailLabel, { color: theme.textSecondary }]}>
                      {isRTL ? 'متاح:' : 'Available:'}
                    </Text>
                    <Text style={[styles.balanceDetailValue, { color: theme.success }]}>
                      {currency.symbol} {wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.balanceDetail}>
                    <Text style={[styles.balanceDetailLabel, { color: theme.textSecondary }]}>
                      {isRTL ? 'مقفل:' : 'Locked:'}
                    </Text>
                    <Text style={[styles.balanceDetailValue, { color: theme.warning }]}>
                      {currency.symbol} {wallet.lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Exchange Rates */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'أسعار الصرف' : 'Exchange Rates'}
        </Text>
        
        {currencies.filter(c => c.isPreferred).map((currency) => (
          <View key={currency.code} style={styles.rateCard}>
            <View style={styles.rateInfo}>
              <Text style={styles.currencyFlag}>{currency.flag}</Text>
              <View>
                <Text style={[styles.rateCode, { color: theme.textPrimary }]}>
                  1 QAR = {currency.rate.toFixed(4)} {currency.code}
                </Text>
                <Text style={[styles.rateName, { color: theme.textSecondary }]}>
                  {currency.name}
                </Text>
              </View>
            </View>
            
            <View style={styles.rateChange}>
              <Ionicons 
                name={currency.change24h >= 0 ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={currency.change24h >= 0 ? theme.success : theme.error} 
              />
              <Text style={[
                styles.rateChangeText,
                { color: currency.change24h >= 0 ? theme.success : theme.error }
              ]}>
                {currency.change24h >= 0 ? '+' : ''}{currency.change24h.toFixed(2)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );

  const renderConvert = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Currency Converter */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'محول العملات' : 'Currency Converter'}
        </Text>
        
        {/* From Currency */}
        <View style={styles.converterRow}>
          <Text style={[styles.converterLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'من' : 'From'}
          </Text>
          <TouchableOpacity
            style={[styles.currencySelector, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => {
              // Show currency selection modal for 'from'
              setShowCurrencyModal(true);
            }}
          >
            <Text style={styles.currencyFlag}>{getCurrencyByCode(fromCurrency)?.flag}</Text>
            <Text style={[styles.currencySelectorText, { color: theme.textPrimary }]}>
              {fromCurrency}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.converterRow}>
          <Text style={[styles.converterLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'المبلغ' : 'Amount'}
          </Text>
          <TextInput
            style={[styles.amountInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
            value={conversionAmount}
            onChangeText={setConversionAmount}
            placeholder="0.00"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>

        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <TouchableOpacity
            style={[styles.swapButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const temp = fromCurrency;
              setFromCurrency(toCurrency);
              setToCurrency(temp);
            }}
          >
            <Ionicons name="swap-vertical" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* To Currency */}
        <View style={styles.converterRow}>
          <Text style={[styles.converterLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'إلى' : 'To'}
          </Text>
          <TouchableOpacity
            style={[styles.currencySelector, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => {
              // Show currency selection modal for 'to'
              setShowCurrencyModal(true);
            }}
          >
            <Text style={styles.currencyFlag}>{getCurrencyByCode(toCurrency)?.flag}</Text>
            <Text style={[styles.currencySelectorText, { color: theme.textPrimary }]}>
              {toCurrency}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Converted Amount */}
        <View style={[styles.convertedAmountCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.convertedLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'ستحصل على' : 'You will receive'}
          </Text>
          <Text style={[styles.convertedAmount, { color: theme.primary }]}>
            {getCurrencyByCode(toCurrency)?.symbol} {calculateConversion().toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.conversionRate, { color: theme.textSecondary }]}>
            1 {fromCurrency} = {(getCurrencyByCode(toCurrency)?.rate! / getCurrencyByCode(fromCurrency)?.rate!).toFixed(6)} {toCurrency}
          </Text>
        </View>

        {/* Conversion Fee */}
        <View style={styles.feeContainer}>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'رسوم التحويل (0.25%):' : 'Conversion Fee (0.25%):'}
            </Text>
            <Text style={[styles.feeAmount, { color: theme.warning }]}>
              QAR {getConversionFee().toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Convert Button */}
        <TouchableOpacity
          style={[styles.convertButton, { backgroundColor: theme.primary }]}
          onPress={handleCurrencyConversion}
          disabled={!conversionAmount || parseFloat(conversionAmount) <= 0}
        >
          <Ionicons name="swap-horizontal" size={20} color="#000000" />
          <Text style={[styles.convertButtonText, { color: '#000000' }]}>
            {isRTL ? 'تحويل العملة' : 'Convert Currency'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {conversionHistory.map((conversion) => {
        const fromCurr = getCurrencyByCode(conversion.fromCurrency);
        const toCurr = getCurrencyByCode(conversion.toCurrency);
        
        return (
          <View key={conversion.id} style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <View style={styles.historyCurrencies}>
                  <Text style={styles.currencyFlag}>{fromCurr?.flag}</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.textSecondary} />
                  <Text style={styles.currencyFlag}>{toCurr?.flag}</Text>
                </View>
                <Text style={[styles.historyTitle, { color: theme.textPrimary }]}>
                  {conversion.fromCurrency} → {conversion.toCurrency}
                </Text>
              </View>
              <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                {new Date(conversion.timestamp).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.historyDetails}>
              <View style={styles.historyAmount}>
                <Text style={[styles.historyFromAmount, { color: theme.textSecondary }]}>
                  {fromCurr?.symbol} {conversion.amount.toLocaleString()}
                </Text>
                <Text style={[styles.historyToAmount, { color: theme.textPrimary }]}>
                  {toCurr?.symbol} {conversion.convertedAmount.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.historyMeta}>
                <Text style={[styles.historyRate, { color: theme.textSecondary }]}>
                  {isRTL ? 'السعر:' : 'Rate:'} {conversion.rate.toFixed(6)}
                </Text>
                <Text style={[styles.historyFee, { color: theme.warning }]}>
                  {isRTL ? 'الرسوم:' : 'Fee:'} QAR {conversion.fee.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Preferred Currencies */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'العملات المفضلة' : 'Preferred Currencies'}
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          {isRTL ? 'اختر العملات التي تريد عرضها في الصفحة الرئيسية' : 'Select currencies to display on the main page'}
        </Text>
        
        {currencies.map((currency) => (
          <View key={currency.code} style={styles.currencySettingRow}>
            <View style={styles.currencySettingInfo}>
              <Text style={styles.currencyFlag}>{currency.flag}</Text>
              <View>
                <Text style={[styles.currencySettingCode, { color: theme.textPrimary }]}>
                  {currency.code}
                </Text>
                <Text style={[styles.currencySettingName, { color: theme.textSecondary }]}>
                  {currency.name}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.currencyToggle,
                { 
                  backgroundColor: currency.isPreferred ? theme.primary : theme.border,
                  borderColor: currency.isPreferred ? theme.primary : theme.border,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('Toggle currency preference:', currency.code);
              }}
            >
              {currency.isPreferred && (
                <Ionicons name="checkmark" size={16} color="#000000" />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Auto-Conversion Settings */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'إعدادات التحويل التلقائي' : 'Auto-Conversion Settings'}
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'التحويل التلقائي للمدفوعات' : 'Auto-convert Payments'}
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              {isRTL ? 'تحويل المدفوعات تلقائياً إلى العملة المفضلة' : 'Automatically convert payments to preferred currency'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingToggle, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          >
            <Ionicons name="checkmark" size={16} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'تحويل الأرباح تلقائياً' : 'Auto-convert Earnings'}
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              {isRTL ? 'تحويل الأرباح إلى QAR تلقائياً' : 'Automatically convert earnings to QAR'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingToggle, { backgroundColor: theme.border, borderColor: theme.border }]}
          >
          </TouchableOpacity>
        </View>
      </View>

      {/* Rate Alerts */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'تنبيهات أسعار الصرف' : 'Exchange Rate Alerts'}
        </Text>
        
        <TouchableOpacity
          style={[styles.addAlertButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
          onPress={() => {
            CustomAlertService.showInfo(
              isRTL ? 'إضافة تنبيه' : 'Add Alert',
              isRTL ? 'سيتم إضافة ميزة تنبيهات أسعار الصرف قريباً' : 'Exchange rate alerts feature will be added soon'
            );
          }}
        >
          <Ionicons name="add" size={20} color={theme.primary} />
          <Text style={[styles.addAlertText, { color: theme.primary }]}>
            {isRTL ? 'إضافة تنبيه سعر صرف' : 'Add Rate Alert'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'CC']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="swap-horizontal" size={28} color="#000000" />
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {isRTL ? 'إدارة العملات' : 'Currency Manager'}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: '#000000CC' }]}>
            {isRTL ? 'تحويل وإدارة العملات المتعددة' : 'Convert & Manage Multiple Currencies'}
          </Text>
        </View>
        
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {[
            { key: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: 'pie-chart-outline' },
            { key: 'convert', label: isRTL ? 'تحويل' : 'Convert', icon: 'swap-horizontal-outline' },
            { key: 'history', label: isRTL ? 'السجل' : 'History', icon: 'time-outline' },
            { key: 'settings', label: isRTL ? 'الإعدادات' : 'Settings', icon: 'settings-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                {
                  backgroundColor: selectedTab === tab.key ? theme.primary : 'transparent',
                  borderColor: selectedTab === tab.key ? theme.primary : 'transparent',
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTab(tab.key as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={selectedTab === tab.key ? '#000000' : theme.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.key ? '#000000' : theme.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'convert' && renderConvert()}
      {selectedTab === 'history' && renderHistory()}
      {selectedTab === 'settings' && renderSettings()}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  portfolioCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  portfolioGradient: {
    padding: 20,
  },
  portfolioHeader: {
    marginBottom: 16,
  },
  portfolioLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  portfolioValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '800',
  },
  portfolioStats: {
    flexDirection: 'row',
    gap: 24,
  },
  portfolioStat: {
    flex: 1,
  },
  portfolioStatLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  portfolioStatValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyFlag: {
    fontSize: 24,
  },
  currencyCode: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
  },
  currencyName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  balanceValues: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  balanceQAR: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceDetail: {
    alignItems: 'center',
  },
  balanceDetailLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceDetailValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  rateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateCode: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  rateName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  rateChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateChangeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  // Converter styles
  converterRow: {
    marginBottom: 16,
  },
  converterLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  currencySelectorText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  amountInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convertedAmountCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  convertedLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  convertedAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  conversionRate: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  feeContainer: {
    marginBottom: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  feeAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  convertButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  // History styles
  historyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyCurrencies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  historyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  historyDetails: {
    gap: 8,
  },
  historyAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyFromAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  historyToAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRate: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  historyFee: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  // Settings styles
  currencySettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencySettingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currencySettingCode: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  currencySettingName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  currencyToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
  },
  settingToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addAlertText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
});
