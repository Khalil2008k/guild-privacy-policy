/**
 * Payment WebView Component
 * Displays Fatora payment page in WebView and detects completion
 * Follows Fatora's official mobile integration guide
 * Reference: https://fatora.io/api/mobileIntegration.php
 */

import React, { useRef, useState, useEffect } from 'react';
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

interface PaymentWebViewProps {
  checkoutUrl: string;
  onSuccess: (transactionId: string, orderId: string) => void;
  onFailure: (error: string, errorCode?: string) => void;
  onClose: () => void;
}

const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  checkoutUrl,
  onSuccess,
  onFailure,
  onClose
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log('💳 Payment WebView opened with URL:', checkoutUrl);
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
   */
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    
    console.log('💳 WebView URL changed:', url);

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

        console.log('✅ Payment successful!', { 
          transactionId, 
          orderId, 
          responseCode 
        });
        
        onSuccess(transactionId, orderId);
      } catch (error) {
        console.error('Failed to parse success URL:', error);
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

        console.log('❌ Payment failed:', { responseCode, description });
        
        onFailure(description, responseCode);
      } catch (error) {
        console.error('Failed to parse failure URL:', error);
        onFailure('Payment failed', 'unknown');
      }
    }
  };

  /**
   * Handle WebView errors
   */
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    onFailure('Failed to load payment page. Please check your connection.');
  };

  /**
   * Handle HTTP errors
   */
  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ HTTP error:', nativeEvent.statusCode, nativeEvent.url);
    onFailure(`Payment page returned error ${nativeEvent.statusCode}`);
  };

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
        onLoadStart={() => {
          console.log('💳 WebView loading started');
          setLoading(true);
          setProgress(10);
        }}
        onLoadProgress={({ nativeEvent }) => {
          setProgress(nativeEvent.progress * 100);
        }}
        onLoadEnd={() => {
          console.log('💳 WebView loading completed');
          setLoading(false);
          setProgress(100);
        }}
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
};

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

export default PaymentWebView;

