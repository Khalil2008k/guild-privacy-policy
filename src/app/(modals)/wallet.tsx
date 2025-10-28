import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Text, 
  ActivityIndicator,
  Dimensions,
  Modal,
  RefreshControl,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useRealPayment } from '../../contexts/RealPaymentContext';
import { Ionicons } from '@expo/vector-icons';
import { Shield, TrendingUp, TrendingDown, Eye, EyeOff, ShoppingBag, Coins, Wallet as WalletIcon } from 'lucide-react-native';
import { CustomAlertService } from '../../services/CustomAlertService';

const { width, height } = Dimensions.get('window');

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TransactionItem {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  jobId?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  reference?: string;
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { theme } = useTheme();
  const { wallet, isLoading, refreshWallet } = useRealPayment();
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;

  const periods = [
    { label: '1D', value: '1D' },
    { label: '5D', value: '5D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M', active: true },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
  ];

  useEffect(() => {
    loadTransactionHistory();
    
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(balanceAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [wallet]);

  const loadTransactionHistory = async () => {
    setLoading(true);
    try {
      // Get transactions from wallet object and map to expected format
      if (wallet?.transactions) {
        const mappedTransactions = wallet.transactions.slice(0, 50).map(t => ({
          id: t.id,
          type: (t.type === 'deposit' || t.type === 'bonus' || t.type === 'refund') ? 'credit' : 'debit',
          amount: t.amount,
          description: t.description,
          jobId: t.jobId,
          status: t.status,
          createdAt: t.createdAt,
          reference: t.reference
        })) as TransactionItem[];
        setTransactions(mappedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Animate refresh
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await refreshWallet();
      await loadTransactionHistory();
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStore = () => {
    router.push('/(modals)/coin-store');
  };

  const handleWithdraw = () => {
    router.push('/(modals)/coin-withdrawal');
  };

  const handleMyCoins = () => {
    router.push('/(modals)/coin-wallet');
  };

  const getTransactionIcon = (type: string, description: string) => {
    return type === 'credit' ? <TrendingUp size={20} color="#00C9A7" /> : <TrendingDown size={20} color="#FF6B6B" />;
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'credit' ? '+' : '';
    return `${sign}${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header - Keep existing design */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.primary }]}>
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={[styles.backButton, {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.2)',
            }]}
            onPress={() => router.back()}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#000000" />
          </TouchableOpacity>
          
          <View style={[styles.headerCenter, { 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            marginRight: isRTL ? 0 : 20,
            marginLeft: isRTL ? 20 : 0,
          }]}>
            <Shield size={24} color="#000000" />
            <Text style={[styles.headerTitle, { 
              marginLeft: isRTL ? 0 : 8, 
              marginRight: isRTL ? 8 : 0,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            }]}>
              {isRTL ? 'المحفظة' : 'Wallet'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.headerRight, {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.2)',
            }]}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Balance Card - Dark background */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <View style={[styles.balanceHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.balanceLabel, { textAlign: isRTL ? 'right' : 'left', color: '#000000' }]}>
              {isRTL ? 'قيمة العملات' : 'Coins Worth'}
            </Text>
            <View style={[styles.percentageChange, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Coins size={16} color="#000000" />
              <Text style={[styles.percentageText, { color: '#000000' }]}>{(wallet?.balance || 0).toLocaleString()}</Text>
            </View>
          </View>
          
          <View style={[styles.balanceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.balanceAmount, { color: '#000000' }]}>
              {isLoading ? '...' : showBalance ? `${(wallet?.balance || 0).toLocaleString()}` : '••••••'}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowBalance(!showBalance)}
              style={styles.eyeIconButton}
            >
              {showBalance ? (
                <Eye size={24} color="#000000" />
              ) : (
                <EyeOff size={24} color="#000000" />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.balanceCurrencyRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.balanceCurrency, { textAlign: isRTL ? 'right' : 'left', color: '#000000' }]}>
              {isRTL ? 'ريال قطري' : 'Qatari Riyal'}
            </Text>
            <Text style={[styles.balanceCurrencyCode, { textAlign: isRTL ? 'right' : 'left', color: '#000000' }]}>
              QAR
            </Text>
          </View>
          
          {/* Period Selector - Like the image */}
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.value && styles.periodButtonActive
                ]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedPeriod(period.value);
                }}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Transaction Summary - Wallet Stats */}
          <View style={styles.transactionSummary}>
            <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'إجمالي الأرباح' : 'Total Earned'}
                </Text>
                <Text style={[styles.summaryValue, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'إجمالي الإنفاق' : 'Total Spent'}
                </Text>
                <Text style={[styles.summaryValue, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtonsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={[styles.actionButtonCard, { backgroundColor: theme.primary }]}
            onPress={handleStore}
          >
            <View style={[styles.actionButtonIcon, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
              <ShoppingBag size={24} color="#000000" />
            </View>
            <Text style={[styles.actionButtonText, { color: '#000000' }]}>
              {isRTL ? 'متجر' : 'Store'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButtonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleWithdraw}
          >
            <View style={[styles.actionButtonIcon, { backgroundColor: theme.primary }]}>
              <WalletIcon size={24} color="#000000" />
            </View>
            <Text style={[styles.actionButtonText, { color: theme.textPrimary || '#000000' }]}>
              {isRTL ? 'سحب' : 'Withdraw'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButtonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleMyCoins}
          >
            <View style={[styles.actionButtonIcon, { backgroundColor: theme.primary }]}>
              <Coins size={24} color="#000000" />
            </View>
            <Text style={[styles.actionButtonText, { color: theme.textPrimary || '#000000' }]}>
              {isRTL ? 'عملاتي' : 'My Coins'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Activities */}
        <View style={styles.transactionsSection}>
          <View style={[styles.transactionsHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.transactionsTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'المعاملات الأخيرة' : 'Recent Transactions'}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.transactionsLink, { color: theme.primary }]}>
                {isRTL ? '‹ هذا الشهر' : 'This month ›'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary, textAlign: 'center' }]}>
                {isRTL ? 'لا توجد معاملات بعد' : 'No transactions yet'}
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <TouchableOpacity 
                key={transaction.id} 
                style={[styles.transactionItem, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedTransaction(transaction);
                  setShowTransactionDetail(true);
                }}
              >
                <View style={[styles.transactionLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.transactionIconWrapper, { backgroundColor: transaction.type === 'credit' ? '#00C9A7' + '15' : '#FF6B6B' + '15' }]}>
                    {getTransactionIcon(transaction.type, transaction.description)}
                  </View>
                  <View style={[styles.transactionInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.transactionName, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                      {transaction.description.replace('Job Posting Fee - Job ', '').replace('Job Completion Reward - Job ', '').replace('Welcome Bonus - Beta Testing', 'Welcome Bonus')}
                    </Text>
                    <Text style={[styles.transactionDate, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.transactionRight, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                  <Text style={[styles.transactionAmount, { color: transaction.type === 'credit' ? '#00C9A7' : theme.textPrimary, textAlign: isRTL ? 'left' : 'right' }]}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: transaction.status === 'completed' ? '#00C9A7' + '15' : '#FFB800' + '15' }]}>
                    <Text style={[styles.statusText, { color: transaction.status === 'completed' ? '#00C9A7' : '#FFB800' }]}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal
        visible={showTransactionDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransactionDetail(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={[styles.detailModalContainer, { backgroundColor: theme.surface }]}>
            {/* Modal Header */}
            <View style={[styles.detailHeader, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.detailTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'تفاصيل المعاملة' : 'Transaction Details'}
              </Text>
              <TouchableOpacity onPress={() => setShowTransactionDetail(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {selectedTransaction && (
              <View style={styles.detailContent}>
                {/* Amount */}
                <View style={[styles.detailAmountContainer, { backgroundColor: selectedTransaction.type === 'credit' ? '#00C9A7' + '15' : '#FF6B6B' + '15' }]}>
                  <Text style={[styles.detailAmountLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'المبلغ' : 'Amount'}
                  </Text>
                  <Text style={[styles.detailAmount, { color: selectedTransaction.type === 'credit' ? '#00C9A7' : '#FF6B6B', textAlign: isRTL ? 'right' : 'left' }]}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}{selectedTransaction.amount.toLocaleString()} {isRTL ? 'عملة' : 'Coins'}
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.detailSection}>
                  <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {isRTL ? 'النوع' : 'Type'}
                    </Text>
                    <View style={[styles.detailBadge, { backgroundColor: selectedTransaction.type === 'credit' ? '#00C9A7' + '15' : '#FF6B6B' + '15' }]}>
                      <Text style={[styles.detailBadgeText, { color: selectedTransaction.type === 'credit' ? '#00C9A7' : '#FF6B6B' }]}>
                        {isRTL 
                          ? (selectedTransaction.type === 'credit' ? 'دخل' : 'مصروف')
                          : (selectedTransaction.type === 'credit' ? 'Income' : 'Expense')
                        }
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {isRTL ? 'الحالة' : 'Status'}
                    </Text>
                    <View style={[styles.detailBadge, { backgroundColor: selectedTransaction.status === 'completed' ? '#00C9A7' + '15' : '#FFB800' + '15' }]}>
                      <Text style={[styles.detailBadgeText, { color: selectedTransaction.status === 'completed' ? '#00C9A7' : '#FFB800' }]}>
                        {selectedTransaction.status}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {isRTL ? 'الوصف' : 'Description'}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{selectedTransaction.description}</Text>
                  </View>

                  <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {isRTL ? 'التاريخ' : 'Date'}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {new Date(selectedTransaction.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  {selectedTransaction.reference && (
                    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {isRTL ? 'المرجع' : 'Reference'}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary, fontFamily: 'monospace', textAlign: isRTL ? 'right' : 'left' }]}>
                        {selectedTransaction.reference}
                      </Text>
                    </View>
                  )}

                  {selectedTransaction.jobId && (
                    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {isRTL ? 'رقم العمل' : 'Job ID'}
                      </Text>
                      <TouchableOpacity onPress={() => {
                        setShowTransactionDetail(false);
                        router.push(`/(modals)/job-details?jobId=${selectedTransaction.jobId}`);
                      }}>
                        <Text style={[styles.detailValue, styles.detailLink, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                          {selectedTransaction.jobId.substring(0, 8)}...
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <TouchableOpacity 
                  style={[styles.detailButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowTransactionDetail(false)}
                >
                  <Text style={[styles.detailButtonText, { color: '#000000' }]}>
                    {isRTL ? 'إغلاق' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={async () => {
                setShowMenu(false);
                await refreshWallet();
                await loadTransactionHistory();
              }}
            >
              <Ionicons name="refresh" size={20} color={theme.textPrimary} />
              <Text style={[styles.menuItemText, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'تحديث المحفظة' : 'Refresh Wallet'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => {
                setShowMenu(false);
                router.push('/(modals)/transaction-history');
              }}
            >
              <Ionicons name="list" size={20} color={theme.textPrimary} />
              <Text style={[styles.menuItemText, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'سجل المعاملات الكامل' : 'Full Transaction History'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => {
                setShowMenu(false);
                router.push('/(modals)/wallet-settings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color={theme.textPrimary} />
              <Text style={[styles.menuItemText, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'إعدادات المحفظة' : 'Wallet Settings'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => {
                setShowMenu(false);
                router.push('/(modals)/payment-methods');
              }}
            >
              <Ionicons name="card-outline" size={20} color={theme.textPrimary} />
              <Text style={[styles.menuItemText, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'طرق الدفع' : 'Payment Methods'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close-circle-outline" size={20} color="#FF6B6B" />
              <Text style={[styles.menuItemText, { color: '#FF6B6B', textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 8,
  },
  headerRight: {
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    opacity: 0.7,
  },
  percentageChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 201, 167, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C9A7',
    marginLeft: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
  },
  eyeIconButton: {
    padding: 4,
  },
  balanceCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  balanceCurrency: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    opacity: 0.7,
  },
  balanceCurrencyCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    opacity: 0.9,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#000000',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    opacity: 0.5,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    opacity: 1,
  },
  transactionSummary: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    opacity: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButtonCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionsLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  menuContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailContent: {
    paddingHorizontal: 20,
  },
  detailAmountContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  detailAmountLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  detailAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  detailSection: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  detailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailLink: {
    textDecorationLine: 'underline',
  },
  detailButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});