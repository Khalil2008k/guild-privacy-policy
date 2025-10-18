import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Text, 
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  RefreshControl,
  Alert,
  Share
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useRealPayment } from '../../contexts/RealPaymentContext';
import { Ionicons } from '@expo/vector-icons';
import { Shield, TrendingUp, TrendingDown, Search, Filter, Download, Calendar } from 'lucide-react-native';
import { CustomAlertService } from '../../services/CustomAlertService';

const { width } = Dimensions.get('window');

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

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { wallet } = useRealPayment();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');

  useEffect(() => {
    loadTransactionHistory();
  }, [wallet]);

  const loadTransactionHistory = async () => {
    setLoading(true);
    try {
      // Get transactions from wallet object and map to expected format
      if (wallet?.transactions) {
        const mappedTransactions = wallet.transactions.slice(0, 100).map(t => ({
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
      CustomAlertService.showError('Error', 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTransactionHistory();
    } finally {
      setRefreshing(false);
    }
  };

  const filterByDate = (transaction: TransactionItem) => {
    if (dateFilter === 'all') return true;
    
    const now = new Date();
    const transactionDate = new Date(transaction.createdAt);
    const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (dateFilter) {
      case '7days':
        return daysDiff <= 7;
      case '30days':
        return daysDiff <= 30;
      case '90days':
        return daysDiff <= 90;
      default:
        return true;
    }
  };

  const exportToCSV = async () => {
    try {
      // Create CSV header
      let csv = 'Date,Description,Type,Amount,Status,Reference\n';
      
      // Add transaction rows
      filteredTransactions.forEach(t => {
        const date = formatDate(t.createdAt);
        const description = t.description.replace(/,/g, ';'); // Replace commas to avoid CSV issues
        const type = t.type === 'credit' ? 'Income' : 'Expense';
        const amount = t.amount;
        const status = t.status;
        const reference = t.reference || 'N/A';
        
        csv += `${date},${description},${type},${amount},${status},${reference}\n`;
      });

      // Share the CSV
      await Share.share({
        message: csv,
        title: 'Transaction History',
      });

      CustomAlertService.showSuccess('Success', 'Transaction history exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      CustomAlertService.showError('Error', 'Failed to export transaction history');
    }
  };

  const exportToText = async () => {
    try {
      let text = '📊 GUILD Transaction History\n';
      text += `Generated: ${new Date().toLocaleString()}\n`;
      text += '═══════════════════════════════════════\n\n';

      filteredTransactions.forEach((t, index) => {
        text += `Transaction #${index + 1}\n`;
        text += `Date: ${formatDate(t.createdAt)}\n`;
        text += `Description: ${t.description}\n`;
        text += `Type: ${t.type === 'credit' ? 'Income ↗️' : 'Expense ↘️'}\n`;
        text += `Amount: ${formatAmount(t.amount, t.type)} 🪙\n`;
        text += `Status: ${t.status}\n`;
        if (t.reference) text += `Reference: ${t.reference}\n`;
        text += '───────────────────────────────────────\n\n';
      });

      await Share.share({
        message: text,
        title: 'Transaction History',
      });

      CustomAlertService.showSuccess('Success', 'Transaction history exported successfully');
    } catch (error) {
      console.error('Error exporting text:', error);
      CustomAlertService.showError('Error', 'Failed to export transaction history');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    const matchesDate = filterByDate(transaction);
    return matchesSearch && matchesFilter && matchesDate;
  });

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? <TrendingUp size={20} color="#00C9A7" /> : <TrendingDown size={20} color="#FF6B6B" />;
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'credit' ? '+' : '';
    return `${sign}${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.primary }]}>
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#000000" />
          </TouchableOpacity>
          
          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Shield size={24} color="#000000" />
            <Text style={[styles.headerTitle, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
              {isRTL ? 'سجل المعاملات' : 'Transaction History'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerRight}
            onPress={() => setShowExportMenu(true)}
          >
            <Download size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}
            placeholder={isRTL ? 'ابحث عن المعاملات...' : 'Search transactions...'}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={[styles.filterContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: filterType === 'all' ? theme.primary : theme.surface, borderColor: theme.border }
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterButtonText, { color: filterType === 'all' ? '#000000' : theme.textPrimary }]}>
              {isRTL ? 'الكل' : 'All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: filterType === 'credit' ? theme.primary : theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
            onPress={() => setFilterType('credit')}
          >
            <TrendingUp size={16} color={filterType === 'credit' ? '#000000' : theme.textPrimary} />
            <Text style={[styles.filterButtonText, { color: filterType === 'credit' ? '#000000' : theme.textPrimary }]}>
              {isRTL ? 'دخل' : 'Income'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: filterType === 'debit' ? theme.primary : theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}
            onPress={() => setFilterType('debit')}
          >
            <TrendingDown size={16} color={filterType === 'debit' ? '#000000' : theme.textPrimary} />
            <Text style={[styles.filterButtonText, { color: filterType === 'debit' ? '#000000' : theme.textPrimary }]}>
              {isRTL ? 'مصروف' : 'Expense'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter */}
        <View style={styles.dateFilterContainer}>
          <Calendar size={16} color={theme.textSecondary} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateFilterScroll}>
            {[
              { label: 'All Time', value: 'all' },
              { label: 'Last 7 Days', value: '7days' },
              { label: 'Last 30 Days', value: '30days' },
              { label: 'Last 90 Days', value: '90days' },
            ].map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.dateFilterButton,
                  { backgroundColor: dateFilter === period.value ? theme.primary : theme.surface, borderColor: theme.border }
                ]}
                onPress={() => setDateFilter(period.value as any)}
              >
                <Text style={[styles.dateFilterText, { color: dateFilter === period.value ? '#000000' : theme.textPrimary }]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
        {/* Transaction List */}
        <View style={styles.transactionsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading transactions...
              </Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions found
              </Text>
            </View>
          ) : (
            filteredTransactions.map((transaction) => (
              <TouchableOpacity 
                key={transaction.id}
                style={[styles.transactionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setShowDetailModal(true);
                }}
              >
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: transaction.type === 'credit' ? '#00C9A7' + '15' : '#FF6B6B' + '15' }]}>
                    {getTransactionIcon(transaction.type)}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                    {transaction.reference && (
                      <Text style={[styles.transactionReference, { color: theme.textSecondary }]}>
                        Ref: {transaction.reference}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmount, { color: transaction.type === 'credit' ? '#00C9A7' : theme.textPrimary }]}>
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

      {/* Export Menu Modal */}
      <Modal
        visible={showExportMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportMenu(false)}
      >
        <TouchableOpacity 
          style={styles.exportModalOverlay}
          activeOpacity={1}
          onPress={() => setShowExportMenu(false)}
        >
          <View style={[styles.exportMenuContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.exportMenuTitle, { color: theme.textPrimary }]}>Export Transaction History</Text>
            
            <TouchableOpacity 
              style={[styles.exportMenuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowExportMenu(false);
                exportToCSV();
              }}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.textPrimary} />
              <View style={styles.exportMenuItemContent}>
                <Text style={[styles.exportMenuItemTitle, { color: theme.textPrimary }]}>Export as CSV</Text>
                <Text style={[styles.exportMenuItemDesc, { color: theme.textSecondary }]}>
                  Spreadsheet format for Excel/Google Sheets
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.exportMenuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowExportMenu(false);
                exportToText();
              }}
            >
              <Ionicons name="share-outline" size={24} color={theme.textPrimary} />
              <View style={styles.exportMenuItemContent}>
                <Text style={[styles.exportMenuItemTitle, { color: theme.textPrimary }]}>Export as Text</Text>
                <Text style={[styles.exportMenuItemDesc, { color: theme.textSecondary }]}>
                  Readable format for sharing
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.exportMenuItem}
              onPress={() => setShowExportMenu(false)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#FF6B6B" />
              <View style={styles.exportMenuItemContent}>
                <Text style={[styles.exportMenuItemTitle, { color: '#FF6B6B' }]}>Cancel</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Transaction Detail Modal - Copy from wallet.tsx */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={[styles.detailModalContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.detailContent}>
                <View style={[styles.detailAmountContainer, { backgroundColor: selectedTransaction.type === 'credit' ? '#00C9A7' + '15' : '#FF6B6B' + '15' }]}>
                  <Text style={[styles.detailAmountLabel, { color: theme.textSecondary }]}>Amount</Text>
                  <Text style={[styles.detailAmount, { color: selectedTransaction.type === 'credit' ? '#00C9A7' : '#FF6B6B' }]}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}{selectedTransaction.amount.toLocaleString()} 🪙
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Type</Text>
                    <View style={[styles.detailBadge, { backgroundColor: selectedTransaction.type === 'credit' ? '#00C9A7' + '15' : '#FF6B6B' + '15' }]}>
                      <Text style={[styles.detailBadgeText, { color: selectedTransaction.type === 'credit' ? '#00C9A7' : '#FF6B6B' }]}>
                        {selectedTransaction.type === 'credit' ? 'Income' : 'Expense'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status</Text>
                    <View style={[styles.detailBadge, { backgroundColor: selectedTransaction.status === 'completed' ? '#00C9A7' + '15' : '#FFB800' + '15' }]}>
                      <Text style={[styles.detailBadgeText, { color: selectedTransaction.status === 'completed' ? '#00C9A7' : '#FFB800' }]}>
                        {selectedTransaction.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedTransaction.description}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Date</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                      {formatDate(selectedTransaction.createdAt)}
                    </Text>
                  </View>

                  {selectedTransaction.reference && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Reference</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary, fontFamily: 'monospace' }]}>
                        {selectedTransaction.reference}
                      </Text>
                    </View>
                  )}

                  {selectedTransaction.jobId && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Job ID</Text>
                      <TouchableOpacity onPress={() => {
                        setShowDetailModal(false);
                        router.push(`/(modals)/job-details?jobId=${selectedTransaction.jobId}`);
                      }}>
                        <Text style={[styles.detailValue, styles.detailLink, { color: theme.primary }]}>
                          {selectedTransaction.jobId.substring(0, 8)}...
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.detailButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={[styles.detailButtonText, { color: '#000000' }]}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
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
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
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
  transactionIcon: {
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
    fontSize: 13,
    marginBottom: 2,
  },
  transactionReference: {
    fontSize: 12,
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
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  dateFilterScroll: {
    flex: 1,
  },
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  dateFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  exportMenuContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exportMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  exportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  exportMenuItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  exportMenuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportMenuItemDesc: {
    fontSize: 14,
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
    maxHeight: 600,
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
    marginBottom: 20,
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
