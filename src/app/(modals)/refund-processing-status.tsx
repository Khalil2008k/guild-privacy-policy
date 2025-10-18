import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';

type RefundStatus = 'submitted' | 'under_review' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
type RefundReason = 'service_not_delivered' | 'quality_issues' | 'billing_error' | 'duplicate_payment' | 'cancelled_order' | 'other';

interface RefundRequest {
  id: string;
  requestNumber: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: RefundReason;
  description: string;
  status: RefundStatus;
  submittedAt: Date;
  lastUpdated: Date;
  estimatedCompletion?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  attachments: string[];
  timeline: RefundTimelineEvent[];
}

interface RefundTimelineEvent {
  id: string;
  status: RefundStatus;
  timestamp: Date;
  description: string;
  automated: boolean;
}

const SAMPLE_REFUNDS: RefundRequest[] = [
  {
    id: 'ref_001',
    requestNumber: 'REF-2024-001',
    transactionId: 'TXN-2024-456',
    amount: 2500,
    currency: 'QAR',
    reason: 'service_not_delivered',
    description: 'Project was cancelled by client before completion. Requesting refund for unused hours.',
    status: 'processing',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    attachments: ['contract.pdf', 'cancellation_notice.pdf'],
    timeline: [
      {
        id: 'evt_1',
        status: 'submitted',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'Refund request submitted and assigned reference number',
        automated: true
      },
      {
        id: 'evt_2',
        status: 'under_review',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Request is being reviewed by our finance team',
        automated: true
      },
      {
        id: 'evt_3',
        status: 'approved',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        description: 'Refund approved. Processing payment to original payment method.',
        automated: false
      },
      {
        id: 'evt_4',
        status: 'processing',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        description: 'Payment is being processed by payment provider',
        automated: true
      }
    ]
  },
  {
    id: 'ref_002',
    requestNumber: 'REF-2024-002',
    transactionId: 'TXN-2024-789',
    amount: 850,
    currency: 'QAR',
    reason: 'billing_error',
    description: 'Duplicate charge for the same service. Please refund the extra amount.',
    status: 'completed',
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    attachments: ['receipt_1.pdf', 'receipt_2.pdf'],
    timeline: [
      {
        id: 'evt_5',
        status: 'submitted',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: 'Refund request submitted',
        automated: true
      },
      {
        id: 'evt_6',
        status: 'approved',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Billing error confirmed. Refund approved.',
        automated: false
      },
      {
        id: 'evt_7',
        status: 'completed',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Refund completed. Amount credited to your account.',
        automated: true
      }
    ]
  },
  {
    id: 'ref_003',
    requestNumber: 'REF-2024-003',
    transactionId: 'TXN-2024-123',
    amount: 1200,
    currency: 'QAR',
    reason: 'quality_issues',
    description: 'Work delivered did not meet agreed specifications and quality standards.',
    status: 'rejected',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    rejectionReason: 'Work was completed according to specifications. Quality concerns were addressed during revision phase.',
    attachments: ['quality_report.pdf'],
    timeline: [
      {
        id: 'evt_8',
        status: 'submitted',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        description: 'Refund request submitted',
        automated: true
      },
      {
        id: 'evt_9',
        status: 'under_review',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        description: 'Quality team reviewing work deliverables',
        automated: false
      },
      {
        id: 'evt_10',
        status: 'rejected',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Refund request rejected after thorough review',
        automated: false
      }
    ]
  }
];

export default function RefundProcessingStatusScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { showAlert, AlertComponent } = useCustomAlert();

  // State
  const [loading, setLoading] = useState(false);
  const [refunds, setRefunds] = useState<RefundRequest[]>(SAMPLE_REFUNDS);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewRefundModal, setShowNewRefundModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RefundStatus | 'all'>('all');

  // New refund form
  const [newRefund, setNewRefund] = useState({
    transactionId: '',
    amount: '',
    reason: 'service_not_delivered' as RefundReason,
    description: ''
  });

  // Handle new refund submission
  const handleSubmitRefund = async () => {
    if (!newRefund.transactionId || !newRefund.amount || !newRefund.description) {
      showAlert('Validation Error', 'Please fill in all required fields.', 'warning');
      return;
    }

    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const refundRequest: RefundRequest = {
        id: `ref_${Date.now()}`,
        requestNumber: `REF-2024-${String(refunds.length + 1).padStart(3, '0')}`,
        transactionId: newRefund.transactionId,
        amount: parseFloat(newRefund.amount),
        currency: 'QAR',
        reason: newRefund.reason,
        description: newRefund.description,
        status: 'submitted',
        submittedAt: new Date(),
        lastUpdated: new Date(),
        attachments: [],
        timeline: [{
          id: `evt_${Date.now()}`,
          status: 'submitted',
          timestamp: new Date(),
          description: 'Refund request submitted and assigned reference number',
          automated: true
        }]
      };

      setRefunds(prev => [refundRequest, ...prev]);
      setNewRefund({
        transactionId: '',
        amount: '',
        reason: 'service_not_delivered',
        description: ''
      });
      setShowNewRefundModal(false);

      showAlert(
        'Refund Request Submitted',
        `Your refund request ${refundRequest.requestNumber} has been submitted successfully.`,
        'success'
      );
    } catch (error) {
      console.error('Error submitting refund:', error);
      showAlert('Submission Error', 'Failed to submit refund request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel refund
  const handleCancelRefund = (refundId: string) => {
    showAlert(
      'Cancel Refund Request',
      'Are you sure you want to cancel this refund request? This action cannot be undone.',
      'warning',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setRefunds(prev => prev.map(refund => 
              refund.id === refundId 
                ? {
                    ...refund,
                    status: 'cancelled' as RefundStatus,
                    lastUpdated: new Date(),
                    timeline: [
                      ...refund.timeline,
                      {
                        id: `evt_${Date.now()}`,
                        status: 'cancelled' as RefundStatus,
                        timestamp: new Date(),
                        description: 'Refund request cancelled by user',
                        automated: false
                      }
                    ]
                  }
                : refund
            ));
            showAlert('Request Cancelled', 'Your refund request has been cancelled.', 'success');
          }
        }
      ]
    );
  };

  // Get status color
  const getStatusColor = (status: RefundStatus) => {
    switch (status) {
      case 'completed': return theme.success;
      case 'approved': return theme.info;
      case 'processing': return theme.warning;
      case 'under_review': return theme.secondary;
      case 'rejected': return theme.error;
      case 'cancelled': return theme.textSecondary;
      default: return theme.primary;
    }
  };

  // Get status icon
  const getStatusIcon = (status: RefundStatus) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'approved': return 'thumbs-up';
      case 'processing': return 'sync';
      case 'under_review': return 'eye';
      case 'rejected': return 'close-circle';
      case 'cancelled': return 'ban';
      default: return 'time';
    }
  };

  // Get reason label
  const getReasonLabel = (reason: RefundReason) => {
    const labels = {
      service_not_delivered: 'Service Not Delivered',
      quality_issues: 'Quality Issues',
      billing_error: 'Billing Error',
      duplicate_payment: 'Duplicate Payment',
      cancelled_order: 'Cancelled Order',
      other: 'Other'
    };
    return labels[reason];
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  // Filter refunds
  const filteredRefunds = filterStatus === 'all' 
    ? refunds 
    : refunds.filter(refund => refund.status === filterStatus);

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
    filterContainer: {
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
    },
    filterButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    filterButtonTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    scrollContent: {
      padding: 20,
    },
    refundCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    refundHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    refundInfo: {
      flex: 1,
    },
    refundNumber: {
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
    refundAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.primary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    refundReason: {
      fontSize: 14,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    refundDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      lineHeight: 18,
      marginBottom: 12,
    },
    refundMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaItem: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    metaValue: {
      fontSize: 12,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      fontWeight: '500',
    },
    refundActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    actionButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonDanger: {
      backgroundColor: theme.error,
      borderColor: theme.error,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    actionButtonTextSecondary: {
      color: theme.textPrimary,
    },
    actionButtonTextDanger: {
      color: 'white',
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    formGroup: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      borderWidth: 1,
      borderColor: theme.border,
    },
    reasonSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    reasonButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    reasonButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    reasonButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    reasonButtonTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    modalButtonTextSecondary: {
      color: theme.textPrimary,
    },
    timelineContainer: {
      marginTop: 20,
    },
    timelineTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    timelineIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    timelineContent: {
      flex: 1,
    },
    timelineStatus: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    timelineDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginTop: 2,
      lineHeight: 18,
    },
    timelineTimestamp: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Refund Processing Status',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refund Management</Text>
        <Text style={styles.headerDescription}>
          Track your refund requests and manage payment disputes with full transparency.
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
            onPress={() => setShowNewRefundModal(true)}
          >
            <Ionicons name="add" size={16} color={getContrastTextColor(theme.primary)} />
            <Text style={styles.headerButtonText}>New Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'submitted', 'under_review', 'approved', 'processing', 'completed', 'rejected', 'cancelled'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive
              ]}>
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {filteredRefunds.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="receipt-outline" 
              size={48} 
              color={theme.textSecondary} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Refund Requests</Text>
            <Text style={styles.emptyDescription}>
              {filterStatus === 'all' 
                ? 'You haven\'t submitted any refund requests yet.'
                : `No refund requests with status "${filterStatus.replace('_', ' ')}" found.`
              }
            </Text>
          </View>
        ) : (
          filteredRefunds.map((refund) => (
            <View key={refund.id} style={styles.refundCard}>
              <View style={styles.refundHeader}>
                <View style={styles.refundInfo}>
                  <Text style={styles.refundNumber}>{refund.requestNumber}</Text>
                  <Text style={styles.transactionId}>Transaction: {refund.transactionId}</Text>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(refund.status) }]}>
                  <Ionicons 
                    name={getStatusIcon(refund.status)} 
                    size={12} 
                    color="white" 
                  />
                  <Text style={styles.statusText}>{refund.status.replace('_', ' ')}</Text>
                </View>
              </View>

              <Text style={styles.refundAmount}>
                {formatCurrency(refund.amount, refund.currency)}
              </Text>

              <Text style={styles.refundReason}>
                Reason: {getReasonLabel(refund.reason)}
              </Text>

              <Text style={styles.refundDescription} numberOfLines={2}>
                {refund.description}
              </Text>

              <View style={styles.refundMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Submitted</Text>
                  <Text style={styles.metaValue}>{refund.submittedAt.toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Last Updated</Text>
                  <Text style={styles.metaValue}>{refund.lastUpdated.toLocaleDateString()}</Text>
                </View>
                
                {refund.estimatedCompletion && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Est. Completion</Text>
                    <Text style={styles.metaValue}>{refund.estimatedCompletion.toLocaleDateString()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.refundActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedRefund(refund);
                    setShowDetailsModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>

                {(refund.status === 'submitted' || refund.status === 'under_review') && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => handleCancelRefund(refund.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* New Refund Modal */}
      <Modal
        visible={showNewRefundModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewRefundModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Refund Request</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowNewRefundModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Transaction ID *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newRefund.transactionId}
                  onChangeText={(text) => setNewRefund(prev => ({ ...prev, transactionId: text }))}
                  placeholder="Enter transaction ID"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Refund Amount (QAR) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newRefund.amount}
                  onChangeText={(text) => setNewRefund(prev => ({ ...prev, amount: text }))}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reason for Refund *</Text>
                <View style={styles.reasonSelector}>
                  {([
                    'service_not_delivered',
                    'quality_issues', 
                    'billing_error',
                    'duplicate_payment',
                    'cancelled_order',
                    'other'
                  ] as RefundReason[]).map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonButton,
                        newRefund.reason === reason && styles.reasonButtonActive
                      ]}
                      onPress={() => setNewRefund(prev => ({ ...prev, reason }))}
                    >
                      <Text style={[
                        styles.reasonButtonText,
                        newRefund.reason === reason && styles.reasonButtonTextActive
                      ]}>
                        {getReasonLabel(reason)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  value={newRefund.description}
                  onChangeText={(text) => setNewRefund(prev => ({ ...prev, description: text }))}
                  placeholder="Please provide detailed explanation for the refund request"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowNewRefundModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSubmitRefund}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
                ) : (
                  <Text style={styles.modalButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedRefund?.requestNumber}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedRefund && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Amount</Text>
                    <Text style={styles.refundAmount}>
                      {formatCurrency(selectedRefund.amount, selectedRefund.currency)}
                    </Text>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Reason</Text>
                    <Text style={styles.refundReason}>
                      {getReasonLabel(selectedRefund.reason)}
                    </Text>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <Text style={styles.refundDescription}>
                      {selectedRefund.description}
                    </Text>
                  </View>

                  {selectedRefund.rejectionReason && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Rejection Reason</Text>
                      <Text style={[styles.refundDescription, { color: theme.error }]}>
                        {selectedRefund.rejectionReason}
                      </Text>
                    </View>
                  )}

                  {/* Timeline */}
                  <View style={styles.timelineContainer}>
                    <Text style={styles.timelineTitle}>Processing Timeline</Text>
                    {selectedRefund.timeline.map((event, index) => (
                      <View key={event.id} style={styles.timelineItem}>
                        <View style={[
                          styles.timelineIconContainer,
                          { backgroundColor: getStatusColor(event.status) }
                        ]}>
                          <Ionicons
                            name={getStatusIcon(event.status)}
                            size={16}
                            color="white"
                          />
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineStatus}>
                            {event.status.replace('_', ' ')}
                          </Text>
                          <Text style={styles.timelineDescription}>
                            {event.description}
                          </Text>
                          <Text style={styles.timelineTimestamp}>
                            {event.timestamp.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertComponent />
    </View>
  );
}
