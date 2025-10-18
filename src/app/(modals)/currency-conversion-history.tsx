import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';

interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
  change24h: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

interface ConversionHistory {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  timestamp: Date;
  transactionId?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  popular: boolean;
}

const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦', popular: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', popular: true },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', popular: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', popular: true },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', popular: true },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦', popular: true },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', popular: false },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', popular: false },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲', popular: false },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', popular: false },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', popular: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', popular: false },
];

const SAMPLE_RATES: CurrencyRate[] = [
  { from: 'USD', to: 'QAR', rate: 3.64, lastUpdated: new Date(), change24h: 0.12, trend: 'up' },
  { from: 'EUR', to: 'QAR', rate: 3.95, lastUpdated: new Date(), change24h: -0.08, trend: 'down' },
  { from: 'GBP', to: 'QAR', rate: 4.58, lastUpdated: new Date(), change24h: 0.05, trend: 'up' },
  { from: 'AED', to: 'QAR', rate: 0.99, lastUpdated: new Date(), change24h: 0.02, trend: 'stable' },
  { from: 'SAR', to: 'QAR', rate: 0.97, lastUpdated: new Date(), change24h: -0.03, trend: 'down' },
  { from: 'KWD', to: 'QAR', rate: 11.95, lastUpdated: new Date(), change24h: 0.18, trend: 'up' },
];

const SAMPLE_HISTORY: ConversionHistory[] = [
  {
    id: 'conv_001',
    fromCurrency: 'USD',
    toCurrency: 'QAR',
    fromAmount: 1000,
    toAmount: 3640,
    rate: 3.64,
    fee: 15,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    transactionId: 'TXN-2024-001',
    status: 'completed'
  },
  {
    id: 'conv_002',
    fromCurrency: 'EUR',
    toCurrency: 'QAR',
    fromAmount: 500,
    toAmount: 1975,
    rate: 3.95,
    fee: 12,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    transactionId: 'TXN-2024-002',
    status: 'completed'
  },
  {
    id: 'conv_003',
    fromCurrency: 'GBP',
    toCurrency: 'QAR',
    fromAmount: 750,
    toAmount: 3435,
    rate: 4.58,
    fee: 18,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    transactionId: 'TXN-2024-003',
    status: 'completed'
  },
  {
    id: 'conv_004',
    fromCurrency: 'AED',
    toCurrency: 'QAR',
    fromAmount: 2000,
    toAmount: 1980,
    rate: 0.99,
    fee: 8,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    transactionId: 'TXN-2024-004',
    status: 'completed'
  },
  {
    id: 'conv_005',
    fromCurrency: 'SAR',
    toCurrency: 'QAR',
    fromAmount: 1500,
    toAmount: 1455,
    rate: 0.97,
    fee: 6,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    transactionId: 'TXN-2024-005',
    status: 'completed'
  }
];

export default function CurrencyConversionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { showAlert, AlertComponent } = useCustomAlert();

  // State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState<CurrencyRate[]>(SAMPLE_RATES);
  const [history, setHistory] = useState<ConversionHistory[]>(SAMPLE_HISTORY);
  const [showConverter, setShowConverter] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'rates' | 'history' | 'converter'>('rates');

  // Converter state
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('QAR');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [conversionFee, setConversionFee] = useState(0);

  // Handle refresh rates
  const handleRefreshRates = async () => {
    try {
      setRefreshing(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update rates with small random changes
      setRates(prev => prev.map(rate => ({
        ...rate,
        rate: rate.rate * (1 + (Math.random() - 0.5) * 0.02), // ±1% change
        change24h: (Math.random() - 0.5) * 0.5, // ±0.25% change
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'down' : 'stable',
        lastUpdated: new Date()
      })));
      
      showAlert('Rates Updated', 'Currency exchange rates have been refreshed.', 'success');
    } catch (error) {
      console.error('Error refreshing rates:', error);
      showAlert('Refresh Error', 'Failed to refresh exchange rates. Please try again.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle currency conversion
  const handleConvert = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount to convert.', 'warning');
      return;
    }

    const rate = rates.find(r => r.from === fromCurrency && r.to === toCurrency);
    if (!rate) {
      showAlert('Rate Not Available', 'Exchange rate not available for selected currencies.', 'error');
      return;
    }

    const inputAmount = parseFloat(amount);
    const converted = inputAmount * rate.rate;
    const fee = Math.max(5, converted * 0.015); // 1.5% fee, minimum 5 QAR

    setConvertedAmount(converted);
    setConversionFee(fee);
  };

  // Handle execute conversion
  const handleExecuteConversion = async () => {
    try {
      setLoading(true);

      // Simulate conversion process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newConversion: ConversionHistory = {
        id: `conv_${Date.now()}`,
        fromCurrency,
        toCurrency,
        fromAmount: parseFloat(amount),
        toAmount: convertedAmount,
        rate: rates.find(r => r.from === fromCurrency && r.to === toCurrency)?.rate || 0,
        fee: conversionFee,
        timestamp: new Date(),
        transactionId: `TXN-${Date.now()}`,
        status: 'completed'
      };

      setHistory(prev => [newConversion, ...prev]);
      setAmount('');
      setConvertedAmount(0);
      setConversionFee(0);
      setShowConverter(false);

      showAlert(
        'Conversion Completed',
        `Successfully converted ${newConversion.fromAmount} ${fromCurrency} to ${newConversion.toAmount.toFixed(2)} ${toCurrency}`,
        'success'
      );
    } catch (error) {
      console.error('Error executing conversion:', error);
      showAlert('Conversion Error', 'Failed to execute currency conversion. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get currency info
  const getCurrencyInfo = (code: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];
  };

  // Get status color
  const getStatusColor = (status: ConversionHistory['status']) => {
    switch (status) {
      case 'completed': return theme.success;
      case 'pending': return theme.warning;
      case 'failed': return theme.error;
      default: return theme.textSecondary;
    }
  };

  // Get trend color
  const getTrendColor = (trend: CurrencyRate['trend']) => {
    switch (trend) {
      case 'up': return theme.success;
      case 'down': return theme.error;
      case 'stable': return theme.warning;
      default: return theme.textSecondary;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: CurrencyRate['trend']) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    headerDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      marginBottom: 16,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 6,
    },
    headerButtonTextSecondary: {
      color: theme.textPrimary,
    },
    tabContainer: {
      backgroundColor: theme.surface,
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    tabActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    tabTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    scrollContent: {
      padding: 20,
    },
    rateCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    currencyPair: {
      flex: 1,
    },
    currencyFlags: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    currencyFlag: {
      fontSize: 20,
      marginRight: 8,
    },
    currencyPairText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    lastUpdated: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    rateInfo: {
      alignItems: 'flex-end',
    },
    rateValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    rateChange: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    rateChangeText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
      marginLeft: 4,
    },
    historyCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    historyInfo: {
      flex: 1,
    },
    conversionPair: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    transactionId: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
      textTransform: 'uppercase',
    },
    historyDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    historyTimestamp: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    converterCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    converterTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 16,
      textAlign: 'center',
    },
    currencySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    currencyButton: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    swapButton: {
      backgroundColor: theme.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 12,
    },
    currencyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    amountInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingVertical: 16,
      paddingHorizontal: 16,
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    conversionResult: {
      backgroundColor: theme.primary + '20',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    resultAmount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.primary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    resultLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    feeInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    feeLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    feeValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    converterActions: {
      flexDirection: 'row',
      gap: 12,
    },
    converterButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    converterButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    converterButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    converterButtonTextSecondary: {
      color: theme.textPrimary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const renderRates = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefreshRates} />
      }
    >
      {rates.map((rate, index) => {
        const fromCurrency = getCurrencyInfo(rate.from);
        const toCurrency = getCurrencyInfo(rate.to);
        
        return (
          <View key={index} style={styles.rateCard}>
            <View style={styles.currencyPair}>
              <View style={styles.currencyFlags}>
                <Text style={styles.currencyFlag}>{fromCurrency.flag}</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.textSecondary} />
                <Text style={styles.currencyFlag}>{toCurrency.flag}</Text>
              </View>
              <Text style={styles.currencyPairText}>
                {rate.from}/{rate.to}
              </Text>
              <Text style={styles.lastUpdated}>
                Updated {rate.lastUpdated.toLocaleTimeString()}
              </Text>
            </View>
            
            <View style={styles.rateInfo}>
              <Text style={styles.rateValue}>
                {rate.rate.toFixed(4)}
              </Text>
              <View style={[styles.rateChange, { backgroundColor: getTrendColor(rate.trend) }]}>
                <Ionicons 
                  name={getTrendIcon(rate.trend)} 
                  size={12} 
                  color="white" 
                />
                <Text style={styles.rateChangeText}>
                  {rate.change24h > 0 ? '+' : ''}{rate.change24h.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderHistory = () => (
    <View>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons 
            name="swap-horizontal-outline" 
            size={48} 
            color={theme.textSecondary} 
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Conversion History</Text>
          <Text style={styles.emptyDescription}>
            Your currency conversion history will appear here once you make your first conversion.
          </Text>
        </View>
      ) : (
        history.map((conversion) => {
          const fromCurrency = getCurrencyInfo(conversion.fromCurrency);
          const toCurrency = getCurrencyInfo(conversion.toCurrency);
          
          return (
            <View key={conversion.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyInfo}>
                  <Text style={styles.conversionPair}>
                    {fromCurrency.flag} {conversion.fromCurrency} → {toCurrency.flag} {conversion.toCurrency}
                  </Text>
                  {conversion.transactionId && (
                    <Text style={styles.transactionId}>ID: {conversion.transactionId}</Text>
                  )}
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(conversion.status) }]}>
                  <Text style={styles.statusText}>{conversion.status}</Text>
                </View>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>From Amount</Text>
                  <Text style={styles.detailValue}>
                    {conversion.fromAmount.toLocaleString()} {conversion.fromCurrency}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rate</Text>
                  <Text style={styles.detailValue}>{conversion.rate.toFixed(4)}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Fee</Text>
                  <Text style={styles.detailValue}>{conversion.fee.toFixed(2)} QAR</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>To Amount</Text>
                  <Text style={[styles.detailValue, { color: theme.success }]}>
                    {conversion.toAmount.toFixed(2)} {conversion.toCurrency}
                  </Text>
                </View>
              </View>

              <Text style={styles.historyTimestamp}>
                {conversion.timestamp.toLocaleString()}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );

  const renderConverter = () => (
    <View>
      <View style={styles.converterCard}>
        <Text style={styles.converterTitle}>Currency Converter</Text>
        
        {/* Currency Selector */}
        <View style={styles.currencySelector}>
          <TouchableOpacity style={styles.currencyButton}>
            <Text style={styles.currencyButtonText}>
              {getCurrencyInfo(fromCurrency).flag} {fromCurrency}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => {
              setFromCurrency(toCurrency);
              setToCurrency(fromCurrency);
            }}
          >
            <Ionicons name="swap-horizontal" size={20} color={getContrastTextColor(theme.primary)} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.currencyButton}>
            <Text style={styles.currencyButtonText}>
              {getCurrencyInfo(toCurrency).flag} {toCurrency}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          onSubmitEditing={handleConvert}
        />

        {/* Conversion Result */}
        {convertedAmount > 0 && (
          <>
            <View style={styles.conversionResult}>
              <Text style={styles.resultAmount}>
                {convertedAmount.toFixed(2)} {toCurrency}
              </Text>
              <Text style={styles.resultLabel}>Converted Amount</Text>
            </View>

            <View style={styles.feeInfo}>
              <Text style={styles.feeLabel}>Conversion Fee:</Text>
              <Text style={styles.feeValue}>{conversionFee.toFixed(2)} QAR</Text>
            </View>

            <View style={styles.feeInfo}>
              <Text style={styles.feeLabel}>Total You'll Receive:</Text>
              <Text style={[styles.feeValue, { color: theme.success }]}>
                {(convertedAmount - (toCurrency === 'QAR' ? conversionFee : 0)).toFixed(2)} {toCurrency}
              </Text>
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.converterActions}>
          <TouchableOpacity
            style={[styles.converterButton, styles.converterButtonSecondary]}
            onPress={handleConvert}
          >
            <Text style={[styles.converterButtonText, styles.converterButtonTextSecondary]}>
              Calculate
            </Text>
          </TouchableOpacity>

          {convertedAmount > 0 && (
            <TouchableOpacity
              style={styles.converterButton}
              onPress={handleExecuteConversion}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
              ) : (
                <Text style={styles.converterButtonText}>Convert Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Currency Conversion',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Currency Exchange</Text>
        <Text style={styles.headerDescription}>
          Track exchange rates, convert currencies, and view your conversion history with competitive rates.
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonSecondary]}
            onPress={() => router.push('/(modals)/wallet')}
          >
            <Ionicons name="wallet-outline" size={16} color={theme.textPrimary} />
            <Text style={[styles.headerButtonText, styles.headerButtonTextSecondary]}>
              View Wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefreshRates}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
            ) : (
              <Ionicons name="refresh" size={16} color={getContrastTextColor(theme.primary)} />
            )}
            <Text style={styles.headerButtonText}>
              {refreshing ? 'Refreshing...' : 'Refresh Rates'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['rates', 'converter', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab && styles.tabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {selectedTab === 'rates' && renderRates()}
        {selectedTab === 'converter' && renderConverter()}
        {selectedTab === 'history' && renderHistory()}
      </ScrollView>

      <AlertComponent />
    </View>
  );
}
