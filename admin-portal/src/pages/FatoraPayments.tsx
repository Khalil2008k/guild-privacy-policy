/**
 * Fatora Payment Monitoring Page
 * Real-time monitoring of Fatora payments and transactions
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  CreditCard,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye
} from 'lucide-react';
import { demoDataService } from '../services/demoDataService';
import './FatoraPayments.css';

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  userId: string;
  userName: string;
  paymentMethod: string;
  timestamp: Date;
  paymentUrl?: string;
}

interface PaymentStats {
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  successRate: number;
}

const FatoraPayments: React.FC = () => {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalTransactions: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalRevenue: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  useEffect(() => {
    loadPaymentData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Get transactions (demo data or real data)
      const demoTransactions = demoDataService.getDemoTransactions();
      setTransactions(demoTransactions as any);

      // Calculate stats
      const successful = demoTransactions.filter(t => t.status === 'completed');
      const pending = demoTransactions.filter(t => t.status === 'pending');
      const failed = demoTransactions.filter(t => t.status === 'failed');
      const revenue = successful.reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalTransactions: demoTransactions.length,
        successfulTransactions: successful.length,
        pendingTransactions: pending.length,
        failedTransactions: failed.length,
        totalRevenue: revenue,
        successRate: demoTransactions.length > 0 
          ? (successful.length / demoTransactions.length) * 100 
          : 0
      });

    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.orderId.toLowerCase().includes(search) ||
        t.userName.toLowerCase().includes(search) ||
        t.id.toLowerCase().includes(search)
      );
    }

    setFilteredTransactions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.success;
      case 'pending': return theme.warning;
      case 'failed': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <RefreshCw size={32} color={theme.primary} className="spin" />
      </div>
    );
  }

  return (
    <div className="fatora-payments">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ color: theme.textPrimary }}>Fatora Payment Monitoring</h1>
          <p style={{ color: theme.textSecondary }}>
            Real-time tracking of all Fatora payment transactions
          </p>
        </div>
        
        <div className="header-actions">
          <button
            onClick={loadPaymentData}
            className="btn btn-secondary"
            style={{
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <button
            className="btn btn-primary"
            style={{ backgroundColor: theme.primary, color: theme.buttonText }}
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ backgroundColor: theme.surface }}>
          <div className="stat-icon" style={{ backgroundColor: theme.primary + '20' }}>
            <CreditCard size={24} color={theme.primary} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.totalTransactions}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary }}>
              Total Transactions
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: theme.surface }}>
          <div className="stat-icon" style={{ backgroundColor: theme.success + '20' }}>
            <CheckCircle size={24} color={theme.success} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.successfulTransactions}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary }}>
              Successful
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: theme.surface }}>
          <div className="stat-icon" style={{ backgroundColor: theme.warning + '20' }}>
            <Clock size={24} color={theme.warning} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.pendingTransactions}
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary }}>
              Pending
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: theme.surface }}>
          <div className="stat-icon" style={{ backgroundColor: theme.success + '20' }}>
            <DollarSign size={24} color={theme.success} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: theme.textPrimary }}>
              {stats.totalRevenue.toLocaleString()} QAR
            </div>
            <div className="stat-label" style={{ color: theme.textSecondary }}>
              Total Revenue
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate Badge */}
      <div
        style={{
          backgroundColor: theme.surface,
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <TrendingUp size={32} color={theme.success} />
        <div>
          <div style={{ color: theme.textPrimary, fontSize: '24px', fontWeight: '700' }}>
            {stats.successRate.toFixed(1)}%
          </div>
          <div style={{ color: theme.textSecondary, fontSize: '14px' }}>
            Success Rate
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.surface,
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                color={theme.textSecondary}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search by Order ID, User, or Transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '8px',
                  border: `2px solid ${theme.border}`,
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${theme.border}`,
                backgroundColor: theme.background,
                color: theme.textPrimary,
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ marginTop: '12px', color: theme.textSecondary, fontSize: '14px' }}>
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ backgroundColor: theme.surface, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="transactions-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: theme.background, borderBottom: `2px solid ${theme.border}` }}>
                <th style={{ padding: '16px', textAlign: 'left', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Status
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Transaction ID
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Order ID
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  User
                </th>
                <th style={{ padding: '16px', textAlign: 'right', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Amount
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Method
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Date
                </th>
                <th style={{ padding: '16px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const StatusIcon = getStatusIcon(transaction.status);
                const statusColor = getStatusColor(transaction.status);

                return (
                  <tr
                    key={transaction.id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.background;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          backgroundColor: statusColor + '20',
                          color: statusColor,
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <StatusIcon size={14} />
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '13px' }}>
                      {transaction.id}
                    </td>
                    <td style={{ padding: '16px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '13px' }}>
                      {transaction.orderId}
                    </td>
                    <td style={{ padding: '16px', color: theme.textPrimary, fontSize: '14px' }}>
                      {transaction.userName}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', color: theme.textPrimary, fontSize: '14px', fontWeight: '600' }}>
                      {transaction.amount.toLocaleString()} {transaction.currency}
                    </td>
                    <td style={{ padding: '16px', color: theme.textSecondary, fontSize: '13px' }}>
                      {transaction.paymentMethod}
                    </td>
                    <td style={{ padding: '16px', color: theme.textSecondary, fontSize: '13px' }}>
                      {formatDate(transaction.timestamp)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.background,
                          color: theme.textPrimary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => alert(`Transaction Details:\n\nID: ${transaction.id}\nOrder: ${transaction.orderId}\nAmount: ${transaction.amount} ${transaction.currency}\nStatus: ${transaction.status}`)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
            <CreditCard size={48} color={theme.textSecondary} style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              No transactions found
            </div>
            <div style={{ fontSize: '14px' }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Transactions will appear here once users make payments'}
            </div>
          </div>
        )}
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FatoraPayments;

