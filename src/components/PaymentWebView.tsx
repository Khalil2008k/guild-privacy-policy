/**
 * Payment WebView Component
 * 🍎 Apple Compliance: Uses external browser (Safari) on iOS instead of WebView
 * ✅ SADAD: Displays Sadad payment page
 * ❌ FATORA: Replaced Fatora with Sadad
 * 
 * iOS: Opens payment in Safari (external browser) - Required for App Store compliance
 * Android: Can use WebView or external browser (configurable)
 */

import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Text,
  Platform,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { logger } from '../utils/logger';
import { openExternalPayment, requiresExternalBrowser } from '../utils/externalPayment';

interface PaymentWebViewProps {
  checkoutUrl: string;
  onSuccess: (transactionId: string, orderId: string) => void;
  onFailure: (error: string, errorCode?: string) => void;
  onClose: () => void;
}

/**
 * Payment WebView Component
 * COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized with React.memo and useCallback
 */
const PaymentWebView = memo<PaymentWebViewProps>(({
  checkoutUrl,
  onSuccess,
  onFailure,
  onClose
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const webViewRef = useRef<WebView>(null);
  
  // 🍎 Apple Compliance: Check if external browser is required (iOS)
  const useExternalBrowser = requiresExternalBrowser();

  // COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized load handlers with useCallback
  const handleLoadStart = useCallback(() => {
    logger.debug('💳 WebView loading started');
    setLoading(true);
    setProgress(10);
  }, []);

  const handleLoadEnd = useCallback(() => {
    logger.debug('💳 WebView loading completed');
    setLoading(false);
    setProgress(100);
  }, []);

  useEffect(() => {
    // 🍎 Apple Compliance: On iOS, open payment in external browser (Safari)
    if (useExternalBrowser) {
      logger.info('🍎 iOS detected - Opening payment in Safari (external browser) for Apple compliance');
      openExternalPayment(
        checkoutUrl,
        'unknown', // orderId not available here, will be extracted from deep link
        (transactionId, orderId) => {
          logger.info('✅ Payment successful from external browser:', { transactionId, orderId });
          onSuccess(transactionId, orderId);
        },
        (error) => {
          logger.error('❌ Payment failed from external browser:', error);
          onFailure(error);
        }
      );
      // Close this component since we're using external browser
      // User will return via deep link
      return;
    }
    
    // Android: Use WebView (or can also use external browser)
    logger.info('💳 Payment WebView opened', { checkoutUrl: checkoutUrl.substring(0, 50) + '...' });
  }, [checkoutUrl, useExternalBrowser, onSuccess, onFailure]);

  /**
   * Handle URL changes - detect success/failure
   * ✅ SADAD WEB CHECKOUT 2.1: Updated for Sadad callback URLs
   * 
   * Success URL format:
   * https://domain.com/api/payments/sadad/callback?STATUS=TXN_SUCCESS&ORDERID=XXX&TXNAMOUNT=XXX
   * 
   * Failure URL format:
   * https://domain.com/api/payments/sadad/callback?STATUS=TXN_FAILURE&ORDERID=XXX
   * COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized with useCallback
   */
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    const { url } = navState;
    
    // COMMENT: PRODUCTION HARDENING - Task 2.7 - Use logger instead of console.log
    logger.debug('💳 WebView URL changed', { url: url.substring(0, 100) + '...' });

    // ✅ SADAD WEB CHECKOUT 2.1: Check for Sadad callback URL
    if (url.includes('/api/payments/sadad/callback') || url.includes('/payments/sadad/callback')) {
      try {
        // Extract parameters from URL
        const urlObj = new URL(url);
        const status = urlObj.searchParams.get('STATUS') || urlObj.searchParams.get('status');
        const orderId = urlObj.searchParams.get('ORDERID') || 
                       urlObj.searchParams.get('ORDER_ID') ||
                       urlObj.searchParams.get('order_id') ||
                       'unknown';
        const transactionId = urlObj.searchParams.get('transaction_number') ||
                             urlObj.searchParams.get('transaction_id') ||
                             urlObj.searchParams.get('TXN_ID') ||
                             'unknown';

        if (status === 'TXN_SUCCESS' || status === 'SUCCESS' || status === 'success') {
          logger.info('✅ Payment successful!', { 
            transactionId, 
            orderId, 
            status 
          });
          onSuccess(transactionId, orderId);
        } else {
          const errorMsg = urlObj.searchParams.get('RESPMSG') || 
                          urlObj.searchParams.get('error') ||
                          'Payment failed';
          logger.error('❌ Payment failed:', { status, orderId, errorMsg });
          onFailure(errorMsg, status || 'unknown');
        }
      } catch (error) {
        logger.error('Failed to parse callback URL:', error);
        // If we can't parse, assume success if it's the callback URL
        onSuccess('callback', 'unknown');
      }
      return; // Don't check other URL patterns
    }

    // Legacy: Check for success completion (backward compatibility)
    if (url.includes('/payments/success') || url.includes('success=true') || url.includes('/success')) {
      try {
        // Extract parameters from URL
        const urlObj = new URL(url);
        const transactionId = urlObj.searchParams.get('transaction_id') || 
                             urlObj.searchParams.get('paymentId') || 
                             urlObj.searchParams.get('payment_id') ||
                             'unknown';
        const orderId = urlObj.searchParams.get('order_id') || 
                       urlObj.searchParams.get('orderId') ||
                       'unknown';
        const responseCode = urlObj.searchParams.get('response_code') || '000';

        // COMMENT: PRODUCTION HARDENING - Task 2.7 - Use logger instead of console.log
        logger.info('✅ Payment successful!', { 
          transactionId, 
          orderId, 
          responseCode 
        });
        
        onSuccess(transactionId, orderId);
      } catch (error) {
        logger.error('Failed to parse success URL:', error);
        onSuccess('success', 'unknown');
      }
    }
    
    // Legacy: Check for failure completion (backward compatibility)
    if (url.includes('/payments/failure') || url.includes('failure=true') || url.includes('/failure')) {
      try {
        // Extract parameters from URL
        const urlObj = new URL(url);
        const responseCode = urlObj.searchParams.get('response_code') || 'unknown';
        const description = urlObj.searchParams.get('description') || 
                          urlObj.searchParams.get('error') ||
                          'Payment failed';

        logger.error('❌ Payment failed:', { responseCode, description });
        
        onFailure(description, responseCode);
      } catch (error) {
        logger.error('Failed to parse failure URL:', error);
        onFailure('Payment failed', 'unknown');
      }
    }
  }, [onSuccess, onFailure]);

  /**
   * Handle WebView errors
   * COMMENT: PRODUCTION HARDENING - Task 2.7 & 2.9 - Enhanced error handling with user feedback, optimized with useCallback
   */
  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    logger.error('❌ WebView error:', nativeEvent);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to load payment page. Please check your connection and try again.';
    
    if (nativeEvent.description) {
      if (nativeEvent.description.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (nativeEvent.description.includes('timeout')) {
        errorMessage = 'Connection timeout. Please try again.';
      } else if (nativeEvent.description.includes('SSL') || nativeEvent.description.includes('certificate')) {
        errorMessage = 'Security error. Please contact support if this persists.';
      }
    }
    
    onFailure(errorMessage, 'WEBVIEW_ERROR');
  }, [onFailure]);

  /**
   * Handle HTTP errors
   * COMMENT: PRODUCTION HARDENING - Task 2.7 & 2.9 - Enhanced error handling with user feedback, optimized with useCallback
   */
  const handleHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const statusCode = nativeEvent.statusCode;
    logger.error('❌ HTTP error:', statusCode, nativeEvent.url);
    
    // Provide specific error messages based on HTTP status code
    let errorMessage = `Payment page returned error ${statusCode}. Please try again.`;
    
    switch (statusCode) {
      case 400:
        errorMessage = 'Invalid payment request. Please try again or contact support.';
        break;
      case 401:
      case 403:
        errorMessage = 'Authentication error. Please log out and log back in, then try again.';
        break;
      case 404:
        errorMessage = 'Payment page not found. Please contact support.';
        break;
      case 500:
      case 502:
      case 503:
        errorMessage = 'Payment service is temporarily unavailable. Please try again in a few moments.';
        break;
      case 504:
        errorMessage = 'Connection timeout. Please check your connection and try again.';
        break;
    }
    
    onFailure(errorMessage, `HTTP_${statusCode}`);
  }, [onFailure]);

  // 🍎 Apple Compliance: On iOS, show message instead of WebView
  if (useExternalBrowser) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Opening Payment</Text>
            <Text style={styles.headerSubtitle}>Powered by Sadad</Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.externalBrowserContainer}>
          <ActivityIndicator size="large" color="#00FF88" />
          <Text style={styles.externalBrowserTitle}>Opening Safari...</Text>
          <Text style={styles.externalBrowserText}>
            Your payment page is opening in Safari.{'\n'}
            Complete your payment there, then return to the app.
          </Text>
          <Text style={styles.externalBrowserNote}>
            🍎 This is required for App Store compliance
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <Text style={styles.headerSubtitle}>Powered by Sadad</Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Loading progress bar */}
      {loading && (
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${progress}%` }]} />
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF88" />
          <Text style={styles.loadingText}>Loading secure payment page...</Text>
        </View>
      )}
      
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadProgress={({ nativeEvent }) => {
          setProgress(nativeEvent.progress * 100);
        }}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="automatic"
        {...Platform.select({
          ios: {
            allowsInlineMediaPlayback: true,
            allowsLinkPreview: false,
          },
          android: {
            mixedContentMode: 'always',
            hardwareAccelerationDisabled: false,
          },
        })}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#2A2A2A',
  },
  progress: {
    height: '100%',
    backgroundColor: '#00FF88',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -50 }],
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  externalBrowserContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#0A0A0A',
  },
  externalBrowserTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  externalBrowserText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  externalBrowserNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 24,
  },
});

PaymentWebView.displayName = 'PaymentWebView';

export default PaymentWebView;

