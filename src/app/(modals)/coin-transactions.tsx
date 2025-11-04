/**
 * COIN TRANSACTIONS HISTORY
 * Complete transaction history with filters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Ionicons } from '@expo/vector-icons';
import { CoinWalletAPIClient } from '../../services/CoinWalletAPIClient';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

export default function CoinTransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const colors = {
    bg: isDarkMode ? '#000000' : '#FFFFFF',
    surface: isDarkMode ? '#1A1A1A' : '#F8F9FA',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#999999' : '#666666',
    border: isDarkMode ? '#333333' : '#E5E5E5',
    primary: theme.primary || '#6366F1',
  };

  const loadData = async () => {
    try {
      const data = await CoinWalletAPIClient.getTransactions();
      setTransactions(data.transactions || []);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredTx = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const getIcon = (tx: any) => {
    if (tx.metadata?.source === 'purchase') return 'cart';
    if (tx.metadata?.source === 'job_payment') return 'briefcase';
    if (tx.metadata?.source === 'withdrawal') return 'cash';
    if (tx.metadata?.source === 'bonus') return 'gift';
    return tx.type === 'credit' ? 'arrow-down' : 'arrow-up';
  };

  const getColor = (tx: any) => {
    return tx.type === 'credit' ? '#10B981' : '#EF4444';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary + 'DD']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: FONT_FAMILY }]}>
            {t('transactionHistory')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filters */}
        <View style={[styles.filters, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {[
            { key: 'all', label: t('all') },
            { key: 'credit', label: isRTL ? 'إضافة' : 'Credit' },
            { key: 'debit', label: isRTL ? 'خصم' : 'Debit' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key as any)}
              style={[
                styles.filterBtn,
                { backgroundColor: filter === f.key ? '#FFF' : 'rgba(255,255,255,0.2)' },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.key ? colors.primary : '#FFF', fontFamily: FONT_FAMILY },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filteredTx.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
              {t('noTransactionsFound')}
            </Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {filteredTx.map((tx, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.txItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {/* TODO: Show details */}}
              >
                <View style={[styles.txLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.txIcon, { backgroundColor: getColor(tx) + '20' }]}>
                    <Ionicons name={getIcon(tx)} size={24} color={getColor(tx)} />
                  </View>
                  <View style={[styles.txInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.txType, { color: colors.text, fontFamily: FONT_FAMILY }]}>
                      {tx.description || (tx.type === 'credit' ? (isRTL ? 'إضافة عملات' : t('coinsAdded')) : (isRTL ? 'خصم عملات' : t('coinsDeducted')))}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </Text>
                    {tx.metadata?.idempotencyKey && (
                      <Text style={[styles.txId, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
                        ID: {tx.metadata.idempotencyKey.slice(0, 8)}...
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.txRight, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                  <Text style={[styles.txAmount, { color: getColor(tx), fontFamily: FONT_FAMILY }]}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.qarValue || 0} {isRTL ? 'ريال' : 'QAR'}
                  </Text>
                  {tx.coins && Object.keys(tx.coins).length > 0 && (
                    <Text style={[styles.txCoins, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
                      {Object.entries(tx.coins).map(([sym, qty]) => `${qty}×${sym}`).join(', ')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filterText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  emptyState: { padding: 60, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, marginTop: 16 },
  txList: { gap: 8 },
  txItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txType: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  txDate: { fontSize: 12, marginBottom: 2 },
  txId: { fontSize: 10 },
  txRight: {},
  txAmount: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  txCoins: { fontSize: 11 },
});

