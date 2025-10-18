import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { PaymentSheetService } from '../../../services/PaymentSheetService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { RTLText, RTLView, RTLButton, RTLInput } from '@/app/components/primitives/primitives';
import { jobService, Job } from '@/services/jobService';
import { OfferService, Offer } from '@/services/offerService';
import { EscrowService, CreateEscrowData } from '@/services/escrowService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface EscrowFormData {
  includeZakat: boolean;
}

export default function EscrowPaymentScreen() {
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  const offerId = params.offerId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState<EscrowFormData>({
    includeZakat: false,
  });

  // Load job and offer details
  const loadDetails = useCallback(async () => {
    if (!jobId || !offerId) {
      CustomAlertService.showError(
        t('error'),
        'Job ID and Offer ID are required'
      );
      router.back();
      return;
    }

    try {
      setLoading(true);
      const [jobDetails, offerDetails] = await Promise.all([
        jobService.getJobById(jobId),
        OfferService.getOfferById(offerId),
      ]);

      if (!jobDetails || !offerDetails) {
        CustomAlertService.showError(
          t('error'),
          'Job or offer not found'
        );
        router.back();
        return;
      }

      setJob(jobDetails);
      setOffer(offerDetails);
    } catch (error) {
      console.error('Error loading details:', error);
      CustomAlertService.showError(
        t('error'),
        'Failed to load job and offer details'
      );
    } finally {
      setLoading(false);
    }
  }, [jobId, offerId, t]);

  // Calculate fees and totals
  const calculatePaymentBreakdown = useCallback(() => {
    if (!offer) return null;

    const clientFee = Math.round(offer.price * 0.05); // 5% client fee
    const freelancerFee = Math.round(offer.price * 0.10); // 10% freelancer fee
    const zakatAmount = formData.includeZakat ? Math.round(offer.price * 0.025) : 0; // 2.5% zakat (optional)
    const totalAmount = offer.price + clientFee + freelancerFee + zakatAmount;

    return {
      offerPrice: offer.price,
      clientFee,
      freelancerFee,
      zakatAmount,
      totalAmount,
    };
  }, [offer, formData.includeZakat]);

  // Handle payment processing
  const handlePayment = useCallback(async () => {
    if (!job || !offer) return;

    try {
      setProcessing(true);
      const clientId = user?.uid || '';

      const breakdown = calculatePaymentBreakdown();

      if (!breakdown) {
        throw new Error('Failed to calculate payment breakdown');
      }

      // Create escrow transaction
      const escrowData: CreateEscrowData = {
        jobId: job.id,
        offerId: offer.id,
        clientId,
        freelancerId: offer.freelancerId,
        amount: breakdown.totalAmount,
      };

      const escrowId = await EscrowService.createEscrow(escrowData);

      // Update job status to 'Accepted'
      await jobService.updateJobStatus(job.id, 'accepted');

      // Update offer status to 'Accepted'
      await OfferService.updateOfferStatus(offer.id, 'Accepted');

      // Show success payment sheet
      const paymentBreakdown = calculatePaymentBreakdown();
      PaymentSheetService.showPaymentSuccess({
        title: isRTL ? `دفع إلى ${offer.freelancerName}` : `Payment to ${offer.freelancerName}`,
        amount: paymentBreakdown ? `-${paymentBreakdown.totalAmount.toLocaleString()}` : '-0.00',
        date: new Date().toLocaleString(),
        from: isRTL ? 'محفظة GUILD' : 'GUILD Wallet',
        cardNumber: job.title.substring(0, 20),
        type: 'debit'
      });
      
      setTimeout(() => router.back(), 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      CustomAlertService.showError(
        t('error'),
        t('paymentFailed')
      );
    } finally {
      setProcessing(false);
    }
  }, [job, offer, formData, calculatePaymentBreakdown, t]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString()} QAR`;
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    const icons: { [key: string]: any } = {
      creditCard: CreditCard,
      qrCode: QrCode,
      bankTransfer: Building2,
      digitalWallet: Wallet,
    };
    return icons[method] || CreditCard;
  };

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
        <RTLView style={styles.loadingContainer}>
          <RTLText style={styles.loadingText}>{t('loading')}</RTLText>
        </RTLView>
      </View>
    );
  }

  if (!job || !offer) {
    return (
      <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
        <RTLView style={styles.errorContainer}>
          <RTLText style={styles.errorText}>{t('error')}</RTLText>
        </RTLView>
      </View>
    );
  }

  const breakdown = calculatePaymentBreakdown();

  return (
    <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
      {/* Header */}
      <RTLView style={styles.header}>
        <RTLButton
          variant="outline"
          size="small"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={20} />
        </RTLButton>
        <RTLText style={styles.headerTitle}>{t('escrowPayment')}</RTLText>
      </RTLView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Details */}
        <RTLView style={styles.jobCard}>
          <RTLText style={styles.sectionTitle}>{t('jobDetails')}</RTLText>
          <RTLText style={styles.jobTitle}>{job.title}</RTLText>
          <RTLText style={styles.jobDescription}>{job.description}</RTLText>
        </RTLView>

        {/* Offer Details */}
        <RTLView style={styles.offerCard}>
          <RTLText style={styles.sectionTitle}>{t('offerDetails')}</RTLText>
          <RTLView style={styles.offerRow}>
            <RTLText style={styles.offerLabel}>{t('offerPrice')}:</RTLText>
            <RTLText style={styles.offerValue}>{formatCurrency(offer.price)}</RTLText>
          </RTLView>
          <RTLText style={styles.offerMessage}>{offer.message}</RTLText>
        </RTLView>

        {/* Payment Breakdown */}
        {breakdown && (
          <RTLView style={styles.paymentCard}>
            <RTLText style={styles.sectionTitle}>{t('paymentDetails')}</RTLText>
            
            <RTLView style={styles.breakdownRow}>
              <RTLText style={styles.breakdownLabel}>{t('paymentAmount')}:</RTLText>
              <RTLText style={styles.breakdownValue}>{formatCurrency(breakdown.offerPrice)}</RTLText>
            </RTLView>

            <RTLView style={styles.breakdownRow}>
              <RTLText style={styles.breakdownLabel}>{t('clientFee')} (5%):</RTLText>
              <RTLText style={styles.breakdownValue}>{formatCurrency(breakdown.clientFee)}</RTLText>
            </RTLView>

            <RTLView style={styles.breakdownRow}>
              <RTLText style={styles.breakdownLabel}>{t('freelancerFee')} (10%):</RTLText>
              <RTLText style={styles.breakdownValue}>{formatCurrency(breakdown.freelancerFee)}</RTLText>
            </RTLView>

            {formData.includeZakat && (
              <RTLView style={styles.breakdownRow}>
                <RTLText style={styles.breakdownLabel}>{t('zakatAmount')} (2.5%):</RTLText>
                <RTLText style={styles.breakdownValue}>{formatCurrency(breakdown.zakatAmount)}</RTLText>
              </RTLView>
            )}

            <RTLView style={styles.totalRow}>
              <RTLText style={styles.totalLabel}>{t('totalAmount')}:</RTLText>
              <RTLText style={styles.totalValue}>{formatCurrency(breakdown.totalAmount)}</RTLText>
            </RTLView>
          </RTLView>
        )}

        {/* Zakat Toggle */}
        <RTLView style={styles.zakatCard}>
          <RTLView style={styles.zakatHeader}>
            <RTLText style={styles.zakatTitle}>{t('includeZakat')}</RTLText>
            <RTLButton
              variant={formData.includeZakat ? "primary" : "outline"}
              size="small"
              onPress={() => setFormData(prev => ({ ...prev, includeZakat: !prev.includeZakat }))}
              style={styles.zakatToggle}
            >
              <RTLText style={styles.zakatToggleText}>
                {formData.includeZakat ? t('yes') : t('no')}
              </RTLText>
            </RTLButton>
          </RTLView>
          <RTLText style={styles.zakatDescription}>{t('zakatDescription')}</RTLText>
        </RTLView>

        {/* Security Information */}
        <RTLView style={styles.securityCard}>
          <RTLView style={styles.securityHeader}>
            <MaterialIcons name="security" size={20} color="#1E90FF" />
            <RTLText style={styles.securityTitle}>{t('securityInfo')}</RTLText>
          </RTLView>
          
          <RTLView style={styles.securityList}>
            <RTLView style={styles.securityItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#27AE60" />
              <RTLText style={styles.securityText}>{t('securityInfo1')}</RTLText>
            </RTLView>
            <RTLView style={styles.securityItem}>
              <Ionicons name="time-outline" size={16} color="#1E90FF" />
              <RTLText style={styles.securityText}>{t('securityInfo2')}</RTLText>
            </RTLView>
            <RTLView style={styles.securityItem}>
              <Ionicons name="people-outline" size={16} color="#1E90FF" />
              <RTLText style={styles.securityText}>{t('securityInfo3')}</RTLText>
            </RTLView>
            <RTLView style={styles.securityItem}>
              <Ionicons name="lock-closed-outline" size={16} color="#1E90FF" />
              <RTLText style={styles.securityText}>{t('securityInfo4')}</RTLText>
            </RTLView>
          </RTLView>
        </RTLView>

        {/* Payment Methods */}
        <RTLView style={styles.methodsCard}>
          <RTLText style={styles.sectionTitle}>{t('paymentMethod')}</RTLText>
          
          <RTLView style={styles.methodsList}>
            <RTLView style={styles.methodItem}>
              <Ionicons name="card-outline" size={20} color="#1E90FF" />
              <RTLText style={styles.methodText}>{t('creditCard')}</RTLText>
            </RTLView>
            <RTLView style={styles.methodItem}>
              <Ionicons name="qr-code-outline" size={20} color="#1E90FF" />
              <RTLText style={styles.methodText}>{t('qrCodePayment')}</RTLText>
            </RTLView>
            <RTLView style={styles.methodItem}>
              <Building2 size={20} color="#1E90FF" />
              <RTLText style={styles.methodText}>{t('bankTransfer')}</RTLText>
            </RTLView>
            <RTLView style={styles.methodItem}>
              <Ionicons name="wallet-outline" size={20} color="#1E90FF" />
              <RTLText style={styles.methodText}>{t('digitalWallet')}</RTLText>
            </RTLView>
          </RTLView>
        </RTLView>

        {/* Support Information */}
        <RTLView style={styles.supportCard}>
          <RTLView style={styles.supportHeader}>
            <Ionicons name="help-circle-outline" size={20} color="#1E90FF" />
            <RTLText style={styles.supportTitle}>{t('customerSupport')}</RTLText>
          </RTLView>
          
          <RTLView style={styles.supportInfo}>
            <RTLView style={styles.supportItem}>
              <Ionicons name="mail-outline" size={16} color="#666666" />
              <RTLText style={styles.supportText}>{t('supportEmail')}</RTLText>
            </RTLView>
            <RTLView style={styles.supportItem}>
              <Ionicons name="call-outline" size={16} color="#666666" />
              <RTLText style={styles.supportText}>{t('supportPhone')}</RTLText>
            </RTLView>
          </RTLView>
        </RTLView>
      </ScrollView>

      {/* Payment Button */}
      <RTLView style={styles.footer}>
        <RTLButton
          onPress={handlePayment}
          disabled={processing}
          style={styles.payButton}
        >
          <RTLText style={styles.payButtonText}>
            {processing ? t('paymentProcessing') : t('payNow')}
          </RTLText>
        </RTLButton>
      </RTLView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    minWidth: 48,
    height: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  zakatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerLabel: {
    fontSize: 14,
    color: '#666666',
  },
  offerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  offerMessage: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#000000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  zakatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zakatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  zakatToggle: {
    minWidth: 60,
    height: 32,
  },
  zakatToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  zakatDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  securityList: {
    gap: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    lineHeight: 20,
  },
  methodsList: {
    gap: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  methodText: {
    fontSize: 14,
    color: '#666666',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  supportInfo: {
    gap: 8,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  payButton: {
    height: 48,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
