/**
 * Deep Link Handler for External Payment Flow
 * 
 * Handles deep links for wallet updates after external Sadad payment
 * Scheme: guild://wallet?update=true
 */

import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { InteractionManager, Platform } from 'react-native';
import { logger } from './logger';

export interface WalletDeepLinkParams {
  update?: string;      // 'true' to trigger balance refresh
  txn?: string;         // Transaction ID to display
  success?: string;     // 'true' for success message
  amount?: string;      // Amount added (for success toast)
  error?: string;       // Error message (if payment failed)
}

/**
 * Parse wallet deep link URL
 * Supports multiple formats:
 * - guild://wallet?update=true
 * - guild://wallet?success=true&amount=100
 * - guild://payment/success?transaction_id=xxx&order_id=yyy
 * - guild://payment/failure?order_id=yyy&error=message
 */
export const parseWalletDeepLink = (url: string): WalletDeepLinkParams | null => {
  try {
    logger.debug('[DeepLink] Parsing URL:', url);
    
    const parsed = Linking.parse(url);
    logger.debug('[DeepLink] Parsed URL:', parsed);
    
    // Check if it's a wallet or payment deep link
    const isWalletLink = parsed.hostname === 'wallet' || 
                         parsed.path === '/wallet' || 
                         url.includes('://wallet') ||
                         url.includes('guild://wallet');
    
    const isPaymentLink = parsed.hostname === 'payment' || 
                          parsed.path?.includes('/payment') ||
                          url.includes('://payment') ||
                          url.includes('guild://payment');
    
    if (!isWalletLink && !isPaymentLink) {
      logger.warn('[DeepLink] Not a wallet or payment deep link:', url);
      return null;
    }

    const params: WalletDeepLinkParams = {};
    
    if (parsed.queryParams) {
      if (parsed.queryParams.update) params.update = String(parsed.queryParams.update);
      if (parsed.queryParams.txn) params.txn = String(parsed.queryParams.txn);
      if (parsed.queryParams.success) params.success = String(parsed.queryParams.success);
      if (parsed.queryParams.amount) params.amount = String(parsed.queryParams.amount);
      if (parsed.queryParams.error) params.error = String(parsed.queryParams.error);
      
      // Also check for transaction_id and order_id (payment links)
      if (parsed.queryParams.transaction_id) params.txn = String(parsed.queryParams.transaction_id);
      if (parsed.queryParams.order_id && !params.txn) params.txn = String(parsed.queryParams.order_id);
    }
    
    // If it's a payment success link, set success flag
    if (isPaymentLink && (parsed.path?.includes('/success') || url.includes('/success'))) {
      params.success = 'true';
      params.update = 'true'; // Also trigger balance refresh
    }
    
    // If it's a payment failure link, set error
    if (isPaymentLink && (parsed.path?.includes('/failure') || url.includes('/failure'))) {
      const errorMsg = parsed.queryParams?.error || 'Payment failed';
      params.error = String(errorMsg);
    }

    logger.debug('[DeepLink] Parsed params:', params);
    return params;
  } catch (error) {
    logger.error('[DeepLink] Failed to parse wallet deep link:', error);
    return null;
  }
};

/**
 * Handle wallet deep link
 * 
 * @param url - Deep link URL (e.g., guild://wallet?update=true&amount=100)
 * @param onBalanceRefresh - Callback to trigger balance refresh
 * @param onSuccess - Callback for success toast
 * @param onError - Callback for error toast
 */
export const handleWalletDeepLink = async (
  url: string,
  callbacks: {
    onBalanceRefresh?: () => Promise<void>;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }
): Promise<void> => {
  try {
    logger.info('[DeepLink] Handling wallet deep link:', url);

    const params = parseWalletDeepLink(url);
    if (!params) {
      logger.warn('[DeepLink] Invalid wallet deep link format');
      return;
    }

    // ⚠️ CRITICAL FIX for Xiaomi/Android: Wait for app to be fully initialized
    // On some Android devices (especially Xiaomi), the app can be killed in background
    // When returning from payment, we need to wait for the app to be ready before navigating
    await new Promise<void>((resolve) => {
      // Wait for interactions to complete (ensures app is ready)
      InteractionManager.runAfterInteractions(() => {
        // Additional delay for Android/Xiaomi devices to ensure app is fully initialized
        const delay = Platform.OS === 'android' ? 500 : 100;
        setTimeout(() => {
          resolve();
        }, delay);
      });
    });

    // Navigate to wallet if not already there
    // Use try-catch to prevent crashes if navigation fails
    try {
      router.push('/(modals)/wallet');
    } catch (navError: any) {
      logger.error('[DeepLink] Navigation error:', navError);
      // Fallback: Try again after a short delay
      setTimeout(() => {
        try {
          router.push('/(modals)/wallet');
        } catch (retryError: any) {
          logger.error('[DeepLink] Retry navigation failed:', retryError);
          callbacks.onError?.('Failed to navigate to wallet. Please open it manually.');
        }
      }, 1000);
      return;
    }

    // Handle error case
    if (params.error) {
      const errorMessage = decodeURIComponent(params.error);
      logger.error('[DeepLink] Payment error:', errorMessage);
      callbacks.onError?.(errorMessage);
      return;
    }

    // Refresh balance
    if (params.update === 'true' && callbacks.onBalanceRefresh) {
      logger.info('[DeepLink] Triggering balance refresh...');
      await callbacks.onBalanceRefresh();
    }

    // Show success message
    if (params.success === 'true') {
      const amount = params.amount || 'unknown';
      const message = `Credits added successfully: ${amount} QAR`;
      logger.info('[DeepLink] Payment success:', message);
      callbacks.onSuccess?.(message);
    }

    // Show specific transaction
    if (params.txn) {
      logger.info('[DeepLink] Navigating to transaction:', params.txn);
      // TODO: Implement transaction detail modal
      // router.push(`/(modals)/transaction/${params.txn}`);
    }

  } catch (error) {
    logger.error('[DeepLink] Error handling wallet deep link:', error);
    callbacks.onError?.('Failed to process payment result. Please check your balance manually.');
  }
};

/**
 * Initialize deep link listener
 * 
 * Call this in app root (_layout.tsx)
 */
export const initializeDeepLinkListener = (
  onWalletLink: (url: string) => void
): (() => void) => {
  logger.info('[DeepLink] Initializing deep link listener...');

  // Handle initial URL (app opened from deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      logger.info('[DeepLink] Initial URL:', url);
      if (url.includes('://wallet')) {
        onWalletLink(url);
      }
    }
  });

  // Handle subsequent deep links (app already open)
  const subscription = Linking.addEventListener('url', (event) => {
    logger.info('[DeepLink] Received URL:', event.url);
    if (event.url.includes('://wallet')) {
      onWalletLink(event.url);
    }
  });

  // Return cleanup function
  return () => {
    logger.info('[DeepLink] Cleaning up deep link listener');
    subscription.remove();
  };
};

/**
 * Generate external payment URL
 * 
 * @param userId - Firebase user ID
 * @param amount - Optional pre-filled amount
 * @returns URL to open in Safari/Chrome
 */
export const generateExternalPaymentURL = (userId: string, amount?: number): string => {
  // 🌐 Option 1: Use hosted web page (when ready)
  // const baseURL = 'https://guild-app.net/wallet/topup.html';
  
  // 🌐 Option 2: Direct to backend API with redirect
  const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://guild-yf7q.onrender.com';
  const endpoint = `${baseURL}/api/v1/payments/sadad/wallet-topup`;
  
  const params = new URLSearchParams({
    userId,
    amount: (amount || 100).toString(),
    returnUrl: 'guild://wallet', // Deep link return URL
  });

  return `${endpoint}?${params.toString()}`;
};

/**
 * Open external payment in browser (Safari/Chrome)
 * 
 * ⚖️ COMPLIANCE: Opens external browser (not WebView)
 * This is REQUIRED for App Store compliance (Guideline 3.1.5)
 */
export const openExternalPayment = async (userId: string, amount?: number): Promise<void> => {
  try {
    const url = generateExternalPaymentURL(userId, amount);
    logger.info('[DeepLink] Opening external payment:', url);

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error('Cannot open payment URL');
    }

    await Linking.openURL(url);
    logger.info('[DeepLink] External payment opened successfully');
  } catch (error) {
    logger.error('[DeepLink] Failed to open external payment:', error);
    throw new Error('Failed to open payment page. Please try again.');
  }
};

export default {
  parseWalletDeepLink,
  handleWalletDeepLink,
  initializeDeepLinkListener,
  generateExternalPaymentURL,
  openExternalPayment,
};

