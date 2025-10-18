import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { RTLText, RTLView } from '../components/primitives/primitives';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppBottomNavigation from '../components/AppBottomNavigation';

const FONT_FAMILY = 'Signika Negative SC';

const mockTransactions = [
  {
    id: '1',
    type: 'earning',
    title: 'Data Cleaning Project',
    amount: 3000,
    date: '2024-01-20',
    status: 'completed',
  },
  {
    id: '2',
    type: 'withdrawal',
    title: 'Bank Transfer',
    amount: -5000,
    date: '2024-01-19',
    status: 'completed',
  },
  {
    id: '3',
    type: 'bonus',
    title: 'Guild Monthly Bonus',
    amount: 1500,
    date: '2024-01-18',
    status: 'completed',
  },
  {
    id: '4',
    type: 'earning',
    title: 'Website Development',
    amount: 2500,
    date: '2024-01-17',
    status: 'pending',
  },
  {
    id: '5',
    type: 'earning',
    title: 'Garden Maintenance',
    amount: 4000,
    date: '2024-01-15',
    status: 'completed',
  },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  
  const periods = ['This Week', 'This Month', 'Last 3 Months', 'This Year'];
  
  const totalBalance = 24500;
  const pendingEarnings = 2500;
  const monthlyEarnings = 11000;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return <Ionicons name="arrow-down-outline" size={16} color="#23D5AB" />;
      case 'withdrawal':
        return <Ionicons name="arrow-up-outline" size={16} color="#F9CB40" />;
      case 'bonus':
        return <Ionicons name="flash-outline" size={16} color="#8A6DF1" fill="#8A6DF1" />;
      default:
        return <Ionicons name="cash-outline" size={16} color="#A4B1C0" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning':
        return '#23D5AB';
      case 'withdrawal':
        return '#F9CB40';
      case 'bonus':
        return '#8A6DF1';
      default:
        return '#A4B1C0';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={'#BCFF31'}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-down-outline" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#000000' }]}>
          {t('wallet')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.balanceHeader}>
            <RTLText style={[styles.balanceLabel, { color: theme.textSecondary }]}>{t('availableBalance')}</RTLText>
            <Ionicons name="card-outline" size={24} color={theme.primary} />
          </View>
          <RTLText style={[styles.balanceAmount, { color: theme.textPrimary }]}>QR {totalBalance.toLocaleString()}</RTLText>

          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <RTLText style={[styles.statValue, { color: theme.primary }]}>QR {pendingEarnings.toLocaleString()}</RTLText>
              <RTLText style={[styles.statLabel, { color: theme.textSecondary }]}>{t('processing')}</RTLText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.primary + '30' }]} />
            <View style={styles.balanceStat}>
              <RTLText style={[styles.statValue, { color: theme.primary }]}>QR {monthlyEarnings.toLocaleString()}</RTLText>
              <RTLText style={[styles.statLabel, { color: theme.textSecondary }]}>{t('thisMonth')}</RTLText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.withdrawButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/(modals)/escrow-payment')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up-outline" size={20} color="#000000" />
            <RTLText style={[styles.withdrawText, { color: '#000000' }]}>{t('withdrawFunds')}</RTLText>
          </TouchableOpacity>
        </View>

        {/* Earnings Overview Card */}
        <View style={[styles.earningsOverview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.overviewHeader}>
            <RTLText style={[styles.overviewTitle, { color: theme.textPrimary }]}>{t('earningsOverview')}</RTLText>
            <Ionicons name="trending-up-outline" size={20} color={theme.primary} />
          </View>
          
          <View style={styles.earningsGrid}>
            <View style={[styles.earningCard, { backgroundColor: theme.surfaceSecondary }]}>
              <RTLText style={[styles.earningLabel, { color: theme.textSecondary }]}>{t('jobs')}</RTLText>
              <RTLText style={[styles.earningAmount, { color: theme.textPrimary }]}>{isRTL ? '9,500 ق.ر' : 'QR 9,500'}</RTLText>
              <RTLText style={[styles.earningChange, { color: theme.primary }]}>+12% from last month</RTLText>
            </View>
            <View style={[styles.earningCard, { backgroundColor: theme.surfaceSecondary }]}>
              <RTLText style={[styles.earningLabel, { color: theme.textSecondary }]}>{isRTL ? 'مكافأة النقابة' : 'Guild Bonus'}</RTLText>
              <RTLText style={[styles.earningAmount, { color: theme.textPrimary }]}>{isRTL ? '1,500 ق.ر' : 'QR 1,500'}</RTLText>
              <RTLText style={[styles.earningChange, { color: theme.primary }]}>+5% from last month</RTLText>
            </View>
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <RTLText style={[styles.sectionTitle, { color: theme.textPrimary }]}>{isRTL ? 'سجل المعاملات' : 'Transaction History'}</RTLText>
            <View style={styles.periodSelector}>
              <TouchableOpacity 
                style={[styles.periodButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '30' }]}
                onPress={() => {
                  // Cycle through periods
                  const currentIndex = periods.indexOf(selectedPeriod);
                  const nextIndex = (currentIndex + 1) % periods.length;
                  setSelectedPeriod(periods[nextIndex]);
                }}
                activeOpacity={0.7}
              >
                <RTLText style={[styles.periodText, { color: theme.primary }]}>{selectedPeriod}</RTLText>
                <Ionicons name="calendar-outline" size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {mockTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={[styles.transactionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push('/(modals)/escrow-payment')}
              activeOpacity={0.7}
            >
              <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor(transaction.type)}20` }]}>
                {getTransactionIcon(transaction.type)}
              </View>
              
              <View style={styles.transactionInfo}>
                <RTLText style={[styles.transactionTitle, { color: theme.textPrimary }]}>{transaction.title}</RTLText>
                <RTLText style={[styles.transactionDate, { color: theme.textSecondary }]}>{transaction.date}</RTLText>
              </View>
              
              <View style={styles.transactionAmount}>
                <RTLText
                  style={[
                    styles.amountText,
                    { color: getTransactionColor(transaction.type) },
                  ]}
                >
                  {transaction.amount > 0 ? '+' : ''}QR {Math.abs(transaction.amount).toLocaleString()}
                </RTLText>
                <View
                  style={[
                    styles.statusBadge,
                    transaction.status === 'pending'
                      ? styles.pendingBadge
                      : styles.completedBadge,
                  ]}
                >
                  <RTLText
                    style={[
                      styles.statusText,
                      transaction.status === 'pending'
                        ? styles.pendingText
                        : styles.completedText,
                    ]}
                  >
                    {transaction.status.toUpperCase()}
                  </RTLText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Navigation */}
      <AppBottomNavigation currentRoute="/(modals)/wallet" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#BCFF31',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#23D5AB15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#23D5AB30',
  },
  balanceCard: {
    borderRadius: 16,
    margin: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#23D5AB',
    opacity: 0.3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 20,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#23D5AB',
    opacity: 0.2,
    borderRadius: 12,
  },
  withdrawText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  earningsOverview: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  earningCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  earningLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  earningAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  earningChange: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
  },
  periodText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
  },
  transactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: '#F9CB4020',
  },
  completedBadge: {
    backgroundColor: '#23D5AB20',
  },
  statusText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pendingText: {
    color: '#F9CB40',
  },
  completedText: {
    color: '#23D5AB',
  },
     listBottom: {
     height: 100,
   },
});
