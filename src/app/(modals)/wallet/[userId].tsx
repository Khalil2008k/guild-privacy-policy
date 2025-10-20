import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Banknote,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import { realPaymentService, Wallet as RealWallet, Transaction } from '@/services/realPaymentService';
import { CustomAlertService } from '@/services/CustomAlertService';

const FONT_FAMILY = 'Signika Negative SC';

export default function UserWalletScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams();

  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [wallet, setWallet] = useState<RealWallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    loadWalletData();
    checkDemoMode();
  }, [userId]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const walletData = await realPaymentService.getWallet(userId as string);
      const transactionData = await realPaymentService.getTransactionHistory(userId as string);
      
      setWallet(walletData);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error loading wallet:', error);
      CustomAlertService.showError('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const checkDemoMode = async () => {
    try {
      const demoMode = await realPaymentService.isDemoModeEnabled();
      setIsDemoMode(demoMode);
    } catch (error) {
      console.error('Error checking demo mode:', error);
    }
  };

  const handleDeposit = () => {
    CustomAlertService.showInfo(
      isRTL ? 'إيداع' : 'Deposit',
      isRTL 
        ? 'ميزة الإيداع قيد التطوير. ستكون متاحة قريباً.'
        : 'Deposit feature is under development. Coming soon.'
    );
  };

  const handleWithdraw = () => {
    Alert.alert(
      isRTL ? 'طلب سحب' : 'Request Withdrawal',
      isRTL 
        ? 'هل تريد طلب سحب من محفظتك؟'
        : 'Do you want to request a withdrawal from your wallet?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { 
          text: isRTL ? 'طلب السحب' : 'Request Withdrawal', 
          style: 'default',
          onPress: () => {
            CustomAlertService.showSuccess(
              isRTL ? 'تم إرسال الطلب' : 'Request Sent',
              isRTL 
                ? 'تم إرسال طلب السحب بنجاح. سيتم مراجعته خلال 24 ساعة.'
                : 'Withdrawal request sent successfully. It will be reviewed within 24 hours.'
            );
          }
        }
      ]
    );
  };

  const handleTransfer = () => {
    CustomAlertService.showInfo(
      isRTL ? 'تحويل' : 'Transfer',
      isRTL 
        ? 'ميزة التحويل قيد التطوير. ستكون متاحة قريباً.'
        : 'Transfer feature is under development. Coming soon.'
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'Guild Coins') {
      return `${amount.toFixed(0)} Guild Coins`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp size={20} color="#10B981" />;
      case 'withdrawal':
        return <TrendingDown size={20} color="#EF4444" />;
      case 'payment':
        return <DollarSign size={20} color="#3B82F6" />;
      case 'refund':
        return <ArrowUpDown size={20} color="#8B5CF6" />;
      case 'bonus':
        return <CheckCircle size={20} color="#10B981" />;
      default:
        return <AlertCircle size={20} color={adaptiveColors.textSecondary} />;
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return adaptiveColors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: adaptiveColors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: adaptiveColors.text }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: adaptiveColors.surface, borderBottomColor: adaptiveColors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={adaptiveColors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: adaptiveColors.text }]}>
          {isRTL ? 'المحفظة' : 'Wallet'}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <View style={[styles.demoModeCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <AlertCircle size={20} color="#F59E0B" />
            <Text style={[styles.demoModeText, { color: '#92400E' }]}>
              {isRTL 
                ? 'وضع التجربة: تستخدم عملات GUILD للاختبار'
                : 'Demo Mode: Using Guild Coins for testing'
              }
            </Text>
          </View>
        )}

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={styles.balanceHeader}>
            <Wallet size={24} color={theme.primary} />
            <Text style={[styles.balanceLabel, { color: adaptiveColors.textSecondary }]}>
              {isRTL ? 'الرصيد الحالي' : 'Current Balance'}
            </Text>
          </View>
          <Text style={[styles.balanceAmount, { color: theme.primary }]}>
            {wallet ? formatCurrency(wallet.balance, wallet.currency) : '0 Guild Coins'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}
            onPress={handleDeposit}
            activeOpacity={0.7}
          >
            <CreditCard size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: adaptiveColors.text }]}>
              {isRTL ? 'إيداع' : 'Deposit'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}
            onPress={handleWithdraw}
            activeOpacity={0.7}
          >
            <Banknote size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: adaptiveColors.text }]}>
              {isRTL ? 'سحب' : 'Withdraw'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}
            onPress={handleTransfer}
            activeOpacity={0.7}
          >
            <ArrowUpDown size={20} color={adaptiveColors.textSecondary} />
            <Text style={[styles.actionButtonText, { color: adaptiveColors.textSecondary }]}>
              {isRTL ? 'تحويل' : 'Transfer'}
            </Text>
            <Text style={[styles.comingSoonText, { color: adaptiveColors.textSecondary }]}>
              {isRTL ? '(قريباً)' : '(Coming Soon)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions Section */}
        <View style={[styles.transactionsSection, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <Text style={[styles.sectionTitle, { color: adaptiveColors.text }]}>
            {isRTL ? 'المعاملات الأخيرة' : 'Recent Transactions'}
          </Text>

          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <View key={transaction.id} style={[styles.transactionItem, { borderBottomColor: adaptiveColors.border }]}>
                <View style={styles.transactionLeft}>
                  {getTransactionIcon(transaction.type)}
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionDescription, { color: adaptiveColors.text }]}>
                      {transaction.description}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text style={[styles.transactionDate, { color: adaptiveColors.textSecondary }]}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getTransactionStatusColor(transaction.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getTransactionStatusColor(transaction.status) }]}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'deposit' || transaction.type === 'bonus' ? '#10B981' : '#EF4444' }
                ]}>
                  {transaction.type === 'deposit' || transaction.type === 'bonus' ? '+' : '-'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Clock size={48} color={adaptiveColors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: adaptiveColors.textSecondary }]}>
                {isRTL ? 'لا توجد معاملات بعد' : 'No transactions yet'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  demoModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  demoModeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  comingSoonText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  transactionsSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: FONT_FAMILY,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: FONT_FAMILY,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
});
