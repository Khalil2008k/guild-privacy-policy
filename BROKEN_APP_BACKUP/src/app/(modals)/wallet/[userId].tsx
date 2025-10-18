import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const FONT_FAMILY = 'Signika Negative SC';

export default function UserWalletScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams();

  const mockUserWallet = {
    userId,
    userName: 'John Doe',
    balance: 1250.50,
    totalEarned: 8750.00,
    totalSpent: 7499.50,
    transactions: [
      {
        id: '1',
        type: 'earning',
        amount: 500.00,
        description: 'Payment for Project Alpha',
        date: '2024-01-15'
      },
      {
        id: '2',
        type: 'earning',
        amount: 750.00,
        description: 'Payment for Website Design',
        date: '2024-01-10'
      },
      {
        id: '3',
        type: 'spending',
        amount: -50.00,
        description: 'Service Fee',
        date: '2024-01-08'
      }
    ]
  };

  const formatCurrency = (amount: number) => {
    return `${amount >= 0 ? '+' : ''}${amount.toFixed(2)} QAR`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>User Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.userInfo, { backgroundColor: theme.surface }]}>
          <View style={styles.userHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Ionicons name="person-outline" size={24} color={theme.surface} />
            </View>
            <View>
              <Text style={[styles.userName, { color: theme.text }]}>{mockUserWallet.userName}</Text>
              <Text style={[styles.userId, { color: theme.textSecondary }]}>ID: {userId}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Current Balance</Text>
          <Text style={[styles.balanceAmount, { color: theme.primary }]}>
            {mockUserWallet.balance.toFixed(2)} QAR
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="trending-up-outline" size={24} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Earned</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{mockUserWallet.totalEarned.toFixed(2)} QAR</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="card-outline" size={24} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Spent</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{mockUserWallet.totalSpent.toFixed(2)} QAR</Text>
          </View>
        </View>

        <View style={[styles.transactionsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>

          {mockUserWallet.transactions.map((transaction) => (
            <View key={transaction.id} style={[styles.transactionItem, { borderBottomColor: theme.border }]}>
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionDescription, { color: theme.text }]}>
                  {transaction.description}
                </Text>
                <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                  {transaction.date}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.amount >= 0 ? theme.primary : '#ff4444' }
              ]}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfo: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userName: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 2,
  },
  userId: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  balanceCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: FONT_FAMILY,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionsSection: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});
