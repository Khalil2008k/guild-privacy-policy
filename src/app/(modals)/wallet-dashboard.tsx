import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  client?: string;
  project?: string;
}

export default function WalletDashboardScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Real wallet data - should be connected to backend
  const walletData = {
    totalBalance: 0.00,
    availableBalance: 0.00,
    pendingBalance: 0.00,
    totalEarnings: 0.00,
    monthlyEarnings: 0.00,
    weeklyEarnings: 0.00,
    yearlyEarnings: 0.00,
  };

  // Real transactions - should be fetched from backend
  const [recentTransactions] = useState<Transaction[]>([]);

  const periods = [
    { key: 'week', label: 'Week', earnings: walletData.weeklyEarnings },
    { key: 'month', label: 'Month', earnings: walletData.monthlyEarnings },
    { key: 'year', label: 'Year', earnings: walletData.yearlyEarnings },
  ];

  const quickActions = [
    { 
      key: 'withdraw', 
      label: 'Withdraw', 
      icon: 'arrow-up-circle', 
      color: theme.error,
      route: '/(modals)/withdraw-funds'
    },
    { 
      key: 'deposit', 
      label: 'Deposit', 
      icon: 'arrow-down-circle', 
      color: theme.success,
      route: '/(modals)/deposit-funds'
    },
    { 
      key: 'history', 
      label: 'History', 
      icon: 'time', 
      color: theme.info,
      route: '/(modals)/transaction-history'
    },
    { 
      key: 'analytics', 
      label: 'Analytics', 
      icon: 'analytics', 
      color: theme.warning,
      route: '/(modals)/earnings-analytics'
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income': return 'arrow-down';
      case 'expense': return 'arrow-up';
      case 'withdrawal': return 'arrow-up-circle';
      case 'deposit': return 'arrow-down-circle';
      default: return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income': return theme.success;
      case 'expense': return theme.error;
      case 'withdrawal': return theme.warning;
      case 'deposit': return theme.info;
      default: return theme.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.success;
      case 'pending': return theme.warning;
      case 'failed': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount >= 0 ? '+' : ''}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} QAR`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="account-balance-wallet" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Wallet
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push('/(modals)/payment-methods')}
          >
            <Ionicons name="card-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <LinearGradient
          colors={[theme.primary, theme.primary + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: theme.buttonText + 'CC' }]}>
              Total Balance
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Toggle balance visibility
              }}
            >
              <Ionicons name="eye-outline" size={20} color={theme.buttonText + 'CC'} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.balanceAmount, { color: theme.buttonText }]}>
            {walletData.totalBalance.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} QAR
          </Text>

          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetailItem}>
              <Text style={[styles.balanceDetailLabel, { color: theme.buttonText + 'CC' }]}>
                Available
              </Text>
              <Text style={[styles.balanceDetailAmount, { color: theme.buttonText }]}>
                {walletData.availableBalance.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} QAR
              </Text>
            </View>
            
            <View style={styles.balanceDetailItem}>
              <Text style={[styles.balanceDetailLabel, { color: theme.buttonText + 'CC' }]}>
                Pending
              </Text>
              <Text style={[styles.balanceDetailAmount, { color: theme.buttonText }]}>
                {walletData.pendingBalance.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} QAR
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[styles.quickActionItem, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(action.route as any);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.textPrimary }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Earnings Overview */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Earnings Overview
            </Text>
            
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    { 
                      backgroundColor: selectedPeriod === period.key ? theme.primary + '20' : 'transparent',
                      borderColor: selectedPeriod === period.key ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPeriod(period.key as any);
                  }}
                >
                  <Text style={[
                    styles.periodButtonText,
                    { color: selectedPeriod === period.key ? theme.primary : theme.textSecondary }
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.earningsCard}>
            <Text style={[styles.earningsAmount, { color: theme.success }]}>
              +{periods.find(p => p.key === selectedPeriod)?.earnings.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })} QAR
            </Text>
            <Text style={[styles.earningsLabel, { color: theme.textSecondary }]}>
              This {selectedPeriod}
            </Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Recent Transactions
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(modals)/transaction-history');
              }}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.slice(0, 5).map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={[styles.transactionItem, { borderColor: theme.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/(modals)/transaction-details/${transaction.id}` as any);
              }}
            >
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionColor(transaction.type) + '20' }
                ]}>
                  <Ionicons 
                    name={getTransactionIcon(transaction.type) as any} 
                    size={20} 
                    color={getTransactionColor(transaction.type)} 
                  />
                </View>
                
                <View style={styles.transactionContent}>
                  <Text style={[styles.transactionDescription, { color: theme.textPrimary }]}>
                    {transaction.description}
                  </Text>
                  {transaction.client && (
                    <Text style={[styles.transactionClient, { color: theme.textSecondary }]}>
                      {transaction.client}
                    </Text>
                  )}
                  <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  { color: getTransactionColor(transaction.type) }
                ]}>
                  {formatAmount(transaction.amount)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetailItem: {
    alignItems: 'center',
  },
  balanceDetailLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  balanceDetailAmount: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    minWidth: (width - 64) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  earningsCard: {
    alignItems: 'center',
    padding: 16,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: 14,
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
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  transactionClient: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    textTransform: 'capitalize',
  },
});



