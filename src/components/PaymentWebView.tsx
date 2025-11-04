/**
 * Payment WebView Component
 * Displays Fatora payment page in WebView and detects completion
 * Follows Fatora's official mobile integration guide
 * Reference: https://fatora.io/api/mobileIntegration.php
 */

import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Text,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { logger } from '../utils/logger';

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
    // COMMENT: PRODUCTION HARDENING - Task 2.7 - Use logger instead of console.log
    logger.info('💳 Payment WebView opened', { checkoutUrl: checkoutUrl.substring(0, 50) + '...' });
  }, [checkoutUrl]);

  /**
   * Handle URL changes - detect success/failure
   * As per Fatora documentation: https://fatora.io/api/mobileIntegration.php
   * 
   * Success URL format:
   * https://domain.com/payments/success?transaction_id=XXXXX&order_id=XXXXX&response_code=000
   * 
   * Failure URL format:
   * https://domain.com/payments/failure?order_id=XXXXX&response_code=XXX&description=XXXXX
   * COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized with useCallback
   */
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    const { url } = navState;
    
    // COMMENT: PRODUCTION HARDENING - Task 2.7 - Use logger instead of console.log
    logger.debug('💳 WebView URL changed', { url: url.substring(0, 100) + '...' });

    // Check for success completion
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
    
    // Check for failure completion
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

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <Text style={styles.headerSubtitle}>Powered by Fatora</Text>
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
});

PaymentWebView.displayName = 'PaymentWebView';

export default PaymentWebView;

