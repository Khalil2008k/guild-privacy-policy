/**
 * Payment Modal Screen
 * Displays payment details and initiates Fatora payment
 * Opens WebView for secure payment processing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initiatePayment,
  verifyPayment,
  generateOrderId,
  formatAmount,
  validatePaymentAmount,
  PaymentRequest,
} from '../../services/paymentService';
import PaymentWebView from '../../components/PaymentWebView';
import { CustomAlertService } from '../../services/CustomAlertService';
import { CreditCard, Shield, Lock, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [showWebView, setShowWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse payment details from params
  const amount = parseFloat((params.amount as string) || '0');
  const orderId = (params.orderId as string) || generateOrderId();
  const description = (params.description as string) || 'GUILD Payment';
  const jobId = params.jobId as string | undefined;
  const freelancerId = params.freelancerId as string | undefined;

  /**
   * Handle payment initiation
   */
  const handlePayNow = async () => {
    try {
      // Validate amount
      const validation = validatePaymentAmount(amount);
      if (!validation.valid) {
        CustomAlertService.showError(
          'Invalid Amount',
          validation.error || 'Please enter a valid amount'
        );
        return;
      }

      setLoading(true);

      console.log('💳 Initiating payment:', {
        amount,
        orderId,
        description,
      });

      // Step 1: Create payment checkout with backend
      const request: PaymentRequest = {
        amount,
        orderId,
        jobId,
        freelancerId,
        description,
        language: 'en', // TODO: Get from app settings
      };

      const response = await initiatePayment(request);

      if (response.success && response.checkout_url) {
        console.log('✅ Checkout URL received:', response.payment_id);

        // Step 2: Open WebView with Fatora checkout URL
        setCheckoutUrl(response.checkout_url);
        setPaymentId(response.payment_id || 'unknown');
        setShowWebView(true);
      } else {
        console.error('❌ Payment initiation failed:', response.error);
        CustomAlertService.showError(
          'Payment Error',
          response.error || 'Failed to initiate payment. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      CustomAlertService.showError(
        'Payment Error',
        error.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle payment success
   */
  const handlePaymentSuccess = async (transactionId: string, orderId: string) => {
    console.log('✅ Payment completed successfully:', { transactionId, orderId });

    // Close WebView
    setShowWebView(false);

    // Optional: Verify payment with backend
    try {
      if (paymentId && paymentId !== 'unknown') {
        const verification = await verifyPayment(paymentId);
        console.log('🔍 Payment verification:', verification);
      }
    } catch (error) {
      console.warn('Payment verification failed (non-critical):', error);
    }

    // Show success message
    CustomAlertService.showSuccess(
      'Payment Successful',
      `Your payment of ${formatAmount(amount)} has been processed successfully!`
    );

    // Navigate back or to success page
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    }, 2000);
  };

  /**
   * Handle payment failure
   */
  const handlePaymentFailure = (error: string, errorCode?: string) => {
    console.log('❌ Payment failed:', { error, errorCode });

    // Close WebView
    setShowWebView(false);

    // Show error message
    CustomAlertService.showError(
      'Payment Failed',
      error || 'Payment could not be completed. Please try again.'
    );
  };

  /**
   * Handle WebView close
   */
  const handleWebViewClose = () => {
    setShowWebView(false);
    console.log('💳 Payment WebView closed by user');
  };

  // If WebView is shown, render only WebView
  if (showWebView && checkoutUrl) {
    return (
      <PaymentWebView
        checkoutUrl={checkoutUrl}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onClose={handleWebViewClose}
      />
    );
  }

  // Render payment details and confirmation screen
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: theme.card,
        paddingTop: insets.top + 16,
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Confirm Payment
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View style={[styles.amountCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
            Amount to Pay
          </Text>
          <Text style={[styles.amountValue, { color: theme.primary }]}>
            {formatAmount(amount)}
          </Text>
          <Text style={[styles.orderIdText, { color: theme.textSecondary }]}>
            Order ID: {orderId}
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Payment Details
          </Text>
          <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
            {description}
          </Text>
        </View>

        {/* Security Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.securityRow}>
            <Shield size={20} color={theme.primary} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Secured by Fatora Payment Gateway
            </Text>
          </View>
          <View style={styles.securityRow}>
            <Lock size={20} color={theme.primary} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              PCI-DSS Compliant - Your card data is encrypted
            </Text>
          </View>
        </View>

        {/* Payment Methods Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Accepted Payment Methods
          </Text>
          <View style={styles.paymentMethods}>
            <View style={styles.paymentMethodItem}>
              <CreditCard size={24} color={theme.primary} />
              <Text style={[styles.paymentMethodText, { color: theme.textSecondary }]}>
                Visa
              </Text>
            </View>
            <View style={styles.paymentMethodItem}>
              <CreditCard size={24} color={theme.primary} />
              <Text style={[styles.paymentMethodText, { color: theme.textSecondary }]}>
                Mastercard
              </Text>
            </View>
            <View style={styles.paymentMethodItem}>
              <CreditCard size={24} color={theme.primary} />
              <Text style={[styles.paymentMethodText, { color: theme.textSecondary }]}>
                Debit Cards
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.footer, { 
        backgroundColor: theme.card,
        paddingBottom: insets.bottom + 16,
      }]}>
        <TouchableOpacity
          style={[
            styles.payButton,
            { backgroundColor: theme.primary },
            loading && styles.payButtonDisabled,
          ]}
          onPress={handlePayNow}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0A0A0A" />
          ) : (
            <>
              <Lock size={20} color="#0A0A0A" />
              <Text style={styles.payButtonText}>
                Pay {formatAmount(amount)} Securely
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: theme.textTertiary }]}>
          You will be redirected to Fatora's secure payment page
        </Text>
      </View>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    elevation: 4,
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
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  amountCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 12,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  paymentMethodItem: {
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
  },
});

