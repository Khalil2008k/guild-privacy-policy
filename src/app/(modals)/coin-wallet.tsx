/**
 * COIN WALLET SCREEN
 * Shows balance, inventory, and transaction history
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
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
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, ArrowRight, ShoppingCart, Coins as CoinsIcon } from 'lucide-react-native';
import { CoinWalletAPIClient } from '../../services/CoinWalletAPIClient';

const FONT_FAMILY = 'Signika Negative SC';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COINS = [
  { symbol: 'GBC', name: 'Bronze', nameAr: 'برونزية', colors: ['#CD7F32', '#8B5A00'] },
  { symbol: 'GSC', name: 'Silver', nameAr: 'فضية', colors: ['#C0C0C0', '#808080'] },
  { symbol: 'GGC', name: 'Gold', nameAr: 'ذهبية', colors: ['#FFD700', '#FFA500'] },
  { symbol: 'GPC', name: 'Platinum', nameAr: 'بلاتينية', colors: ['#E5E4E2', '#A8A8A8'] },
  { symbol: 'GDC', name: 'Diamond', nameAr: 'ماسية', colors: ['#B9F2FF', '#4A90E2'] },
  { symbol: 'GRC', name: 'Ruby', nameAr: 'ياقوتية', colors: ['#E0115F', '#8B0000'] },
];

export default function CoinWalletScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<any>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [transactions, setTransactions] = useState<any[]>([]);

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
      const [balanceData, txData] = await Promise.all([
        CoinWalletAPIClient.getBalance(),
        CoinWalletAPIClient.getTransactions(),
      ]);
      setBalance(balanceData);
      setTransactions(txData.transactions || []);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
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
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Animate refresh
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    loadData();
  };

  const totalValue = balance?.balances
    ? Object.entries(balance.balances).reduce((sum, [sym, qty]: [string, any]) => {
        const coin = COINS.find(c => c.symbol === sym);
        return sum + (coin ? (qty * getCoinValue(sym)) : 0);
      }, 0)
    : 0;

  const getCoinValue = (symbol: string): number => {
    const values: any = { GBC: 5, GSC: 10, GGC: 50, GPC: 100, GDC: 200, GRC: 500 };
    return values[symbol] || 0;
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
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.2)',
          }]}>
            {isRTL ? (
              <ArrowRight size={24} color="#000000" />
            ) : (
              <ArrowLeft size={24} color="#000000" />
            )}
          </TouchableOpacity>
          <View style={[styles.headerTitleContainer, { 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            marginRight: isRTL ? 0 : 20,
            marginLeft: isRTL ? 20 : 0,
          }]}>
            <CoinsIcon size={24} color="#000000" />
            <Text style={[styles.headerTitle, { 
              fontFamily: FONT_FAMILY,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            }]}>
              {t('myCoins')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(modals)/coin-store')} style={[styles.headerBtn, {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.2)',
          }]}>
            <ShoppingCart size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Total Balance */}
        <View style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { fontFamily: FONT_FAMILY, color: '#000000' }]}>
            {t('totalWorth')}
          </Text>
          <Text style={[styles.balanceValue, { fontFamily: FONT_FAMILY, color: '#000000' }]}>
            {totalValue.toFixed(2)} QAR
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Action Buttons */}
        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/coin-store')}
            style={[styles.actionBtn, { 
              backgroundColor: colors.primary,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }]}
          >
            <Ionicons name="cart" size={24} color="#000000" />
            <Text style={[styles.actionBtnText, { 
              fontFamily: FONT_FAMILY, 
              color: '#000000',
              marginRight: isRTL ? 0 : 8,
              marginLeft: isRTL ? 8 : 0,
            }]}>
              {t('buy')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(modals)/coin-withdrawal')}
            style={[styles.actionBtn, { 
              backgroundColor: colors.surface, 
              borderWidth: 2, 
              borderColor: colors.primary,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }]}
          >
            <Ionicons name="cash-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionBtnText, { 
              color: colors.primary, 
              fontFamily: FONT_FAMILY,
              marginRight: isRTL ? 0 : 8,
              marginLeft: isRTL ? 8 : 0,
            }]}>
              {t('withdraw')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Coin Balances */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONT_FAMILY, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('yourCoins')}
          </Text>
          <View style={styles.coinsList}>
            {COINS.map((coin) => {
              const qty = balance?.balances?.[coin.symbol] || 0;
              const value = qty * getCoinValue(coin.symbol);
              return (
                <View key={coin.symbol} style={[styles.coinItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.coinItemLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <LinearGradient colors={coin.colors} style={styles.coinIcon}>
                      <Text style={[styles.coinIconText, { fontFamily: FONT_FAMILY }]}>{coin.symbol[1]}</Text>
                    </LinearGradient>
                    <View style={[styles.coinItemInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.coinItemName, { color: colors.text, fontFamily: FONT_FAMILY }]}>
                        {isRTL ? coin.nameAr : coin.name}
                      </Text>
                      <Text style={[styles.coinItemValue, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
                        {getCoinValue(coin.symbol)} QAR
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.coinItemRight, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                    <Text style={[styles.coinItemQty, { color: colors.text, fontFamily: FONT_FAMILY }]}>
                      {qty}
                    </Text>
                    <Text style={[styles.coinItemTotal, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
                      {value} QAR
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONT_FAMILY }]}>
              {t('recentTransactions')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(modals)/coin-transactions')}>
              <Text style={[styles.seeAll, { color: colors.primary, fontFamily: FONT_FAMILY }]}>
                {isRTL ? 'عرض الكل' : 'See All'}
              </Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
                {isRTL ? 'لا توجد معاملات' : 'No transactions yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.slice(0, 5).map((tx, i) => (
                <View key={i} style={[styles.txItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.txItemLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#10B98120' : '#EF444420' }]}>
                      <Ionicons
                        name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                        size={20}
                        color={tx.type === 'credit' ? '#10B981' : '#EF4444'}
                      />
                    </View>
                    <View style={[styles.txInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.txType, { color: colors.text, fontFamily: FONT_FAMILY }]}>
                        {tx.description || (tx.type === 'credit' ? (isRTL ? 'إضافة' : t('transactionAdded')) : (isRTL ? 'خصم' : t('transactionDeducted')))}
                      </Text>
                      <Text style={[styles.txDate, { color: colors.textSecondary, fontFamily: FONT_FAMILY }]}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#10B981' : '#EF4444', fontFamily: FONT_FAMILY }]}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.qarValue || 0} QAR
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#000000' },
  balanceCard: { 
    marginHorizontal: 16, 
    padding: 20, 
    backgroundColor: 'transparent', 
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceLabel: { fontSize: 14, color: '#000000', marginBottom: 8, fontWeight: '600' },
  balanceValue: { fontSize: 36, fontWeight: '700', color: '#000000' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    backgroundColor: 'transparent', 
    borderRadius: 16, 
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  coinsList: { gap: 8 },
  coinItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1 },
  coinItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  coinIconText: { fontSize: 16, fontWeight: '700', color: '#000000' },
  coinItemInfo: {},
  coinItemName: { fontSize: 16, fontWeight: '600' },
  coinItemValue: { fontSize: 12 },
  coinItemRight: {},
  coinItemQty: { fontSize: 18, fontWeight: '700' },
  coinItemTotal: { fontSize: 12 },
  emptyState: { padding: 40, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 14, marginTop: 12 },
  txList: { gap: 8 },
  txItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1 },
  txItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: {},
  txType: { fontSize: 14, fontWeight: '600' },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 16, fontWeight: '700' },
});

