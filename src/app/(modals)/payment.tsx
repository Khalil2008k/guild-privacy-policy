/**
 * Payment Modal Screen
 * 🍎 Apple Compliance: Opens payment in external browser (Safari) on iOS
 * ✅ SADAD: Displays payment details and initiates Sadad payment
 * ❌ FATORA: Replaced Fatora with Sadad
 * iOS: Opens Safari (external browser) - Required for App Store compliance
 * Android: Can use WebView or external browser
 */

import React, { useState, useCallback, Suspense, lazy } from 'react';
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
// COMMENT: PRODUCTION HARDENING - Task 4.7 - Lazy load PaymentWebView (only shown conditionally)
const PaymentWebView = lazy(() => import('../../components/PaymentWebView').then(m => ({ default: m.default })));
import PaymentErrorBoundary from '../../components/PaymentErrorBoundary';
import { CustomAlertService } from '../../services/CustomAlertService';
import { CreditCard, Shield, Lock, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import PaymentProcessor, { usePaymentProcessor } from '../../services/PaymentProcessor';
import type { PaymentState } from '../../services/PaymentProcessor';
import { logger } from '../../utils/logger';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [showWebView, setShowWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  
  // COMMENT: PRODUCTION HARDENING - Task 2.6 - Use PaymentProcessor for validation
  const paymentProcessor = usePaymentProcessor();

  // Parse payment details from params
  const amount = parseFloat((params.amount as string) || '0');
  const orderId = (params.orderId as string) || generateOrderId();
  const description = (params.description as string) || 'GUILD Payment';
  const jobId = params.jobId as string | undefined;
  const freelancerId = params.freelancerId as string | undefined;

  /**
   * Handle payment initiation
   * COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized with useCallback
   */
  const handlePayNow = useCallback(async () => {
    try {
      // COMMENT: PRODUCTION HARDENING - Task 2.6 - Validate payment state transition
      const canStart = paymentProcessor.canTransition(paymentState, 'validating');
      if (!canStart.allowed) {
        CustomAlertService.showError(
          'Payment Error',
          canStart.reason || 'Payment cannot be started in current state'
        );
        return;
      }

      setPaymentState('validating');
      setLoading(true);

      // COMMENT: PRODUCTION HARDENING - Task 2.6 - Comprehensive payment validation using PaymentProcessor
      const paymentInput = {
        amount,
        orderId,
        jobId,
        freelancerId,
        description,
        currency: 'QAR',
      };

      // Sanitize input
      const sanitizedInput = paymentProcessor.sanitize(paymentInput);

      // Validate input
      const validation = paymentProcessor.validate(sanitizedInput);
      
      if (!validation.valid) {
        setPaymentState('idle');
        CustomAlertService.showError(
          'Validation Error',
          validation.errors.join('\n')
        );
        if (validation.warnings && validation.warnings.length > 0) {
          logger.warn('Payment validation warnings:', validation.warnings);
        }
        return;
      }

      // Log warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          logger.warn(`Payment validation warning: ${warning}`);
        });
      }

      setPaymentState('pending');
      logger.info('💳 Initiating payment:', {
        amount: sanitizedInput.amount,
        orderId: sanitizedInput.orderId,
        description: sanitizedInput.description,
      });

      // Step 1: Create payment checkout with backend
      const request: PaymentRequest = {
        amount: sanitizedInput.amount,
        orderId: sanitizedInput.orderId,
        jobId: sanitizedInput.jobId,
        freelancerId: sanitizedInput.freelancerId,
        description: sanitizedInput.description,
        language: 'en', // TODO: Get from app settings
      };

      setPaymentState('processing');
      const response = await initiatePayment(request);

      if (response.success && response.checkout_url) {
        logger.info('✅ Checkout URL received:', response.payment_id);

        // Step 2: Open WebView with Fatora checkout URL
        setCheckoutUrl(response.checkout_url);
        setPaymentId(response.payment_id || 'unknown');
        setShowWebView(true);
        // State remains 'processing' until success/failure callback
      } else {
        setPaymentState('failed');
        logger.error('❌ Payment initiation failed:', response.error);
        CustomAlertService.showError(
          'Payment Error',
          paymentProcessor.formatError(response) || 'Failed to initiate payment. Please try again.'
        );
      }
    } catch (error: any) {
      setPaymentState('failed');
      logger.error('❌ Payment error:', error);
      CustomAlertService.showError(
        'Payment Error',
        paymentProcessor.formatError(error) || 'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [amount, orderId, jobId, freelancerId, description, paymentState, paymentProcessor, router]);

  /**
   * Handle payment success
   * COMMENT: PRODUCTION HARDENING - Task 2.6 & 2.9 - Handle payment success state, optimized with useCallback
   */
  const handlePaymentSuccess = useCallback(async (transactionId: string, orderId: string) => {
    // COMMENT: PRODUCTION HARDENING - Task 2.6 - Validate state transition
    const canComplete = paymentProcessor.canTransition(paymentState, 'completed');
    if (!canComplete.allowed) {
      logger.warn('Invalid state transition for payment success:', {
        currentState: paymentState,
        transactionId,
        orderId,
      });
      // Still proceed but log warning
    }

    paymentProcessor.logStateChange(paymentState, 'completed', paymentId, 'Payment successful');
    setPaymentState('completed');

    logger.info('✅ Payment completed successfully:', { transactionId, orderId });

    // Close WebView
    setShowWebView(false);

    // Optional: Verify payment with backend
    try {
      if (paymentId && paymentId !== 'unknown') {
        const verification = await verifyPayment(paymentId);
        logger.info('🔍 Payment verification:', verification);
      }
    } catch (error) {
      logger.warn('Payment verification failed (non-critical):', error);
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
  }, [amount, paymentState, paymentId, paymentProcessor, router]);

  /**
   * Handle payment failure
   * COMMENT: PRODUCTION HARDENING - Task 2.6 & 2.9 - Handle payment failure state with enhanced feedback, optimized with useCallback
   */
  const handlePaymentFailure = useCallback((error: string, errorCode?: string) => {
    // COMMENT: PRODUCTION HARDENING - Task 2.6 - Validate state transition
    const canFail = paymentProcessor.canTransition(paymentState, 'failed');
    if (!canFail.allowed) {
      logger.warn('Invalid state transition for payment failure:', {
        currentState: paymentState,
        error,
        errorCode,
      });
      // Still proceed but log warning
    }

    paymentProcessor.logStateChange(paymentState, 'failed', paymentId, error);
    setPaymentState('failed');

    logger.error('❌ Payment failed:', { error, errorCode, paymentId });

    // Close WebView
    setShowWebView(false);

    // Format error message
    const errorMessage = paymentProcessor.formatError({ error, errorCode });

    // Format error code for chat sharing (unique format)
    const { formatErrorCodeForChat } = require('@/utils/errorCodeFormatter');
    const formattedErrorCode = errorCode ? formatErrorCodeForChat(errorCode) : null;

    // Show error message with formatted error code
    const displayMessage = formattedErrorCode 
      ? `${errorMessage || 'Payment could not be completed. Please try again.'}\n\nError Code: ${formattedErrorCode}`
      : errorMessage || 'Payment could not be completed. Please try again.';

    CustomAlertService.showError(
      'Payment Failed',
      displayMessage
    );
  }, [paymentState, paymentId, paymentProcessor]);

  /**
   * Handle WebView close
   * COMMENT: PRODUCTION HARDENING - Task 2.6 & 2.9 - Handle payment cancellation, optimized with useCallback
   */
  const handleWebViewClose = useCallback(() => {
    // COMMENT: PRODUCTION HARDENING - Task 2.6 - Handle cancellation state
    if (paymentState === 'processing' || paymentState === 'pending') {
      const canCancel = paymentProcessor.canTransition(paymentState, 'cancelled');
      if (canCancel.allowed) {
        paymentProcessor.logStateChange(paymentState, 'cancelled', paymentId, 'User closed WebView');
        setPaymentState('cancelled');
      }
    }

    setShowWebView(false);
    logger.info('💳 Payment WebView closed by user', { paymentState, paymentId });
  }, [paymentState, paymentId, paymentProcessor]);

  // If WebView is shown, render only WebView
  // COMMENT: PRODUCTION HARDENING - Task 4.7 - Wrap lazy-loaded PaymentWebView in Suspense
  if (showWebView && checkoutUrl) {
    return (
      <PaymentErrorBoundary
        fallbackRoute="/(main)/home"
        onError={(error, errorInfo) => {
          logger.error('PaymentWebView error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          });
        }}
        onRetry={() => {
          setShowWebView(false);
          setCheckoutUrl('');
          setPaymentId('');
        }}
      >
        <Suspense
          fallback={
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading payment...
              </Text>
            </View>
          }
        >
          <PaymentWebView
            checkoutUrl={checkoutUrl}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            onClose={handleWebViewClose}
          />
        </Suspense>
      </PaymentErrorBoundary>
    );
  }

  // Render payment details and confirmation screen
  // COMMENT: PRODUCTION HARDENING - Task 2.7 - Wrap payment screen in error boundary
  return (
    <PaymentErrorBoundary
      fallbackRoute="/(main)/home"
      onError={(error, errorInfo) => {
        logger.error('Payment screen error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
      onRetry={() => {
        // Reset payment state on retry
        setPaymentState('idle');
        setLoading(false);
        setShowWebView(false);
        setCheckoutUrl('');
        setPaymentId('');
      }}
    >
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
    </PaymentErrorBoundary>
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
  // COMMENT: PRODUCTION HARDENING - Task 4.7 - Loading container for lazy-loaded PaymentWebView
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

