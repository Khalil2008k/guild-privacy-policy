/**
 * COIN STORE - Consistent App Design
 * Modern e-commerce design matching app style
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Wallet, ShoppingCart, Plus, Minus, CheckCircle, Store, ArrowLeft, ArrowRight, X, AlertCircle, CreditCard } from 'lucide-react-native';
import { CoinStoreService } from '../../services/CoinStoreService';
import * as Haptics from 'expo-haptics';
import { CustomAlertService } from '../../services/CustomAlertService';
import { WebView } from 'react-native-webview';
import { useRealPayment } from '../../contexts/RealPaymentContext';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';
// 🍎 Apple Compliance: External browser payment utility
import { openExternalPayment, requiresExternalBrowser } from '../../utils/externalPayment';
// ✅ SADAD WEB CHECKOUT 2.1: Firebase Auth for user data
import { auth } from '../../config/firebase';

// 🍎 Apple Compliance: External browser payment component for iOS
const ExternalBrowserPaymentView: React.FC<{
  paymentUrl: string;
  paymentId: string;
  onSuccess: () => void;
  onFailure: () => void;
  theme: any;
}> = ({ paymentUrl, paymentId, onSuccess, onFailure, theme }) => {
  useEffect(() => {
    // 🍎 iOS: Open payment URL directly in Safari (external browser)
    // paymentUrl is now the actual payment URL, not a data URI
    if (paymentUrl && !paymentUrl.startsWith('data:')) {
      logger.info('🍎 Opening payment URL in Safari (external browser):', paymentUrl);
      openExternalPayment(
        paymentUrl,
        paymentId,
        (transactionId, orderId) => {
          logger.info('✅ Payment successful from external browser:', { transactionId, orderId });
          onSuccess();
        },
        (error) => {
          logger.error('❌ Payment failed from external browser:', error);
          onFailure();
        }
      );
    } else {
      logger.error('❌ Invalid payment URL for external browser:', paymentUrl);
      onFailure();
    }
  }, [paymentUrl, paymentId, onSuccess, onFailure]);

  return (
    <View style={styles.externalBrowserContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.externalBrowserTitle, { color: theme.textPrimary }]}>
        Opening Safari...
      </Text>
      <Text style={[styles.externalBrowserText, { color: theme.textSecondary }]}>
        Your payment page is opening in Safari.{'\n'}
        Complete your payment there, then return to the app.
      </Text>
      <Text style={[styles.externalBrowserNote, { color: theme.textSecondary }]}>
        🍎 This is required for App Store compliance
      </Text>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const FONT_FAMILY = 'Signika Negative SC';

// Coin images mapping
const COIN_IMAGES = {
  GBC: require('../../../coin design/5.png'),
  GSC: require('../../../coin design/10.png'),
  GGC: require('../../../coin design/50.png'),
  GPC: require('../../../coin design/100.png'),
  GDC: require('../../../coin design/200.png'),
  GRC: require('../../../coin design/500.png'),
};

const COINS = [
  { symbol: 'GBC', name: 'Bronze', nameAr: 'برونزية', value: 5, price: 5.50 },
  { symbol: 'GSC', name: 'Silver', nameAr: 'فضية', value: 10, price: 11.00 },
  { symbol: 'GGC', name: 'Gold', nameAr: 'ذهبية', value: 50, price: 55.00 },
  { symbol: 'GPC', name: 'Platinum', nameAr: 'بلاتينية', value: 100, price: 110.00 },
  { symbol: 'GDC', name: 'Diamond', nameAr: 'ماسية', value: 200, price: 220.00 },
  { symbol: 'GRC', name: 'Royal', nameAr: 'ملكية', value: 500, price: 550.00 },
];

export default function CoinStoreScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { theme } = useTheme();
  const { refreshWallet } = useRealPayment();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const total = Object.entries(cart).reduce((sum, [sym, qty]) => {
    const coin = COINS.find(c => c.symbol === sym);
    return sum + (coin?.price || 0) * qty;
  }, 0);

  const coinValue = Object.entries(cart).reduce((sum, [sym, qty]) => {
    const coin = COINS.find(c => c.symbol === sym);
    return sum + (coin?.value || 0) * qty;
  }, 0);

  const totalQty = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const addToCart = (symbol: string) => {
    setCart(prev => ({ ...prev, [symbol]: (prev[symbol] || 0) + 1 }));
  };

  const removeFromCart = (symbol: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[symbol] > 1) newCart[symbol]--;
      else delete newCart[symbol];
      return newCart;
    });
  };

  const handleCheckout = () => {
    if (totalQty === 0) {
      CustomAlertService.showWarning(
        t('error'),
        t('addCoins')
      );
      return;
    }
    setShowTermsModal(true);
  };

  const handleAcceptTerms = async () => {
    setShowTermsModal(false);
    setLoading(true);

    try {
      // ✅ SADAD WEB CHECKOUT 2.1: Use new web checkout endpoint
      const { BackendAPI } = await import('../../config/backend');
      
      // Get current user from Firebase Auth (no hooks - direct access)
      // Use auth.currentUser directly, same as authTokenService.ts
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Calculate total amount (with 10% platform fee already included in prices)
      const totalAmount = total; // Use pre-calculated total with markup

      // Call NEW Sadad Coin Purchase endpoint (SHA-256 signature method)
      const response = await BackendAPI.post('/api/coins/purchase/sadad/initiate', {
        customAmount: totalAmount, // Use custom amount instead of package
        email: currentUser.email || `${currentUser.uid}@guild.app`,
        mobileNo: currentUser.phoneNumber || '+97450123456',
        language: 'ENG'
      });

      // NEW: Response is JSON with formPayload (Sadad SHA-256 signature method)
      if (response && response.success && response.data && response.data.formPayload) {
        const { formPayload, orderId } = response.data;
        
        // Generate HTML form that auto-submits to Sadad
        const formFields = Object.entries(formPayload.fields)
          .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
          .join('\n        ');
        
        const htmlForm = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting to Sadad Payment...</title>
</head>
<body>
  <form id="sadadForm" action="${formPayload.action}" method="${formPayload.method}">
    ${formFields}
  </form>
  <script>
    document.getElementById('sadadForm').submit();
  </script>
</body>
</html>`;
        
        let paymentUrl: string;
        
        if (requiresExternalBrowser()) {
          // 🍎 iOS: Can't use data URI, must build URL manually
          // Build query string from form fields
          const queryParams = new URLSearchParams(formPayload.fields as Record<string, string>).toString();
          paymentUrl = `${formPayload.action}?${queryParams}`;
          logger.info('🍎 Built payment URL for iOS external browser:', paymentUrl);
        } else {
          // Android: Use data URI with HTML form
          paymentUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlForm)}`;
        }
        
        setPaymentUrl(paymentUrl);
        setPaymentId(orderId); // Use orderId from backend
        setShowConfirmModal(true);
      } else {
        throw new Error('Invalid response from payment server');
      }
    } catch (error: any) {
      logger.error('❌ Web Checkout initiation failed:', error);
      CustomAlertService.showError(
        t('error'),
        error.message || (isRTL ? 'فشل الشراء' : 'Purchase failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = () => {
    setShowConfirmModal(false);
    // 🍎 Apple Compliance: On iOS, payment opens in external browser (Safari)
    // WebView is only used on Android
    setShowPaymentWebView(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentWebView(false);
    setLoading(true);
    
    try {
      // Refresh wallet to get updated balance
      await refreshWallet();
      
      CustomAlertService.showSuccess(
        t('paymentSuccess'),
        `${t('purchasedCoins')} ${totalQty} ${isRTL ? 'عملة' : 'coins'}`
      );
      
      setCart({});
      router.back();
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error refreshing wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = () => {
    setShowPaymentWebView(false);
    CustomAlertService.showError(
      t('paymentFailed'),
      isRTL ? 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.' : 'Payment failed. Please try again.'
    );
  };

  const handlePaymentClose = () => {
    setShowPaymentWebView(false);
    CustomAlertService.showWarning(
      t('cancelPayment'),
      isRTL ? 'تم إلغاء عملية الدفع' : 'Payment process was cancelled'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header - Matches wallet/payment-methods style */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            {isRTL ? (
              <ArrowRight size={24} color={theme.primary} />
            ) : (
              <ArrowLeft size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
          
          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Store size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
              {t('coinStore')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(modals)/coin-wallet');
            }}
          >
            <Wallet size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Coins Grid */}
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Description */}
        <View style={[styles.descriptionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.descriptionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.descriptionIcon, { backgroundColor: theme.primary }]}>
              <ShoppingCart size={20} color="#000000" />
            </View>
            <Text style={[styles.descriptionTitle, { color: theme.textPrimary }]}>
              {t('buyCoins')}
            </Text>
          </View>
          <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
            {t('neverExpire')}. {t('canBeWithdrawn')}.
          </Text>
        </View>

        {/* Coins Grid */}
        <View style={styles.grid}>
          {COINS.map((coin) => {
            const qty = cart[coin.symbol] || 0;
            return (
              <View key={coin.symbol} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Coin Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={COIN_IMAGES[coin.symbol as keyof typeof COIN_IMAGES]}
                    style={styles.coinImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Coin Info */}
                <View style={styles.cardInfo}>
                  <Text style={[styles.coinName, { color: theme.textPrimary }]}>
                    {isRTL ? coin.nameAr : coin.name}
                  </Text>
                  <View>
                    <Text style={[styles.coinValue, { color: theme.primary, fontWeight: '600' }]}>
                      {coin.price.toFixed(2)} {isRTL ? 'ريال' : 'QAR'}
                    </Text>
                    <Text style={[styles.coinSubValue, { color: theme.textSecondary, fontSize: 11 }]}>
                      {coin.value} {isRTL ? 'ريال قيمة' : 'QAR value'} + 10%
                    </Text>
                  </View>
                </View>

                {/* Add/Remove Buttons */}
                {qty > 0 ? (
                  <View style={[styles.qtyControl, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        removeFromCart(coin.symbol);
                      }} 
                      style={styles.qtyBtn}
                    >
                      <Minus size={18} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: theme.textPrimary }]}>{qty}</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        addToCart(coin.symbol);
                      }} 
                      style={styles.qtyBtn}
                    >
                      <Plus size={18} color={theme.textPrimary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      addToCart(coin.symbol);
                    }} 
                    style={[styles.addBtn, { backgroundColor: theme.primary }]}
                  >
                    <Plus size={20} color="#000000" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Cart Button */}
      {totalQty > 0 && (
        <View style={[styles.floatingCartContainer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.floatingCart, { backgroundColor: theme.primary }]}>
            <View style={[styles.cartInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.cartIconWrapper}>
                <ShoppingCart size={24} color="#000000" />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalQty}</Text>
                </View>
              </View>
              <View style={[styles.cartDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.cartItemsText}>
                  {totalQty} {isRTL ? 'عنصر' : t('items')}
                </Text>
                <Text style={styles.cartTotalText}>
                  {total.toFixed(2)} {isRTL ? 'ريال' : 'QAR'}
                </Text>
                <Text style={[styles.cartItemsText, { fontSize: 12, opacity: 0.6 }]}>
                  {coinValue.toFixed(2)} {isRTL ? 'ريال قيمة' : 'QAR value'} + {(total - coinValue).toFixed(2)} {isRTL ? 'رسوم' : 'fee'}
                </Text>
              </View>
            </View>
            <View style={[styles.cartDivider, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleCheckout();
              }} 
              disabled={loading} 
              style={styles.checkoutBtn}
            >
              {loading ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <>
                  <Text style={styles.checkoutBtnText}>
                    {t('checkout')}
                  </Text>
                  {isRTL ? (
                    <ArrowLeft size={20} color="#000000" />
                  ) : (
                    <ArrowRight size={20} color="#000000" />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {t('coinTermsAndConditions')}
              </Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.termsText, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? (
                  `${t('purchasedCoins')}:\n` +
                  `• ${t('neverExpire')}\n` +
                  `• ${t('canBeWithdrawn')}\n` +
                  `• ${t('fullValueRetained')}\n\n` +
                  `${t('earnedCoins')}:\n` +
                  `• ${t('expireAfterInactivity')}\n` +
                  `• ${t('warnings')}\n` +
                  `• ${t('canBeWithdrawnWithProcessing')}\n\n` +
                  `${t('withdrawals')}:\n` +
                  `• ${t('noWithdrawalLimits')}\n` +
                  `• ${t('processingTime')}\n` +
                  `• ${t('requiresKYC')}\n` +
                  `• ${t('adminApprovalRequired')}\n\n` +
                  `${t('security')}:\n` +
                  `• ${t('eachCoinHasSerial')}\n` +
                  `• ${t('fullyEncrypted')}\n` +
                  `• ${t('protectedFromCounterfeiting')}\n\n` +
                  `${t('legal')}:\n` +
                  `• ${t('virtualCoins')}\n` +
                  `• ${t('forPlatformUseOnly')}\n` +
                  `• ${t('noPeerToPeerTransfers')}\n\n` +
                  `${t('byContinuing')}`
                ) : (
                  `${t('purchasedCoins')}:\n` +
                  `• ${t('neverExpire')}\n` +
                  `• ${t('canBeWithdrawn')}\n` +
                  `• ${t('fullValueRetained')}\n\n` +
                  `${t('earnedCoins')}:\n` +
                  `• ${t('expireAfterInactivity')}\n` +
                  `• ${t('warnings')}\n` +
                  `• ${t('canBeWithdrawnWithProcessing')}\n\n` +
                  `${t('withdrawals')}:\n` +
                  `• ${t('noWithdrawalLimits')}\n` +
                  `• ${t('processingTime')}\n` +
                  `• ${t('requiresKYC')}\n` +
                  `• ${t('adminApprovalRequired')}\n\n` +
                  `${t('security')}:\n` +
                  `• ${t('eachCoinHasSerial')}\n` +
                  `• ${t('fullyEncrypted')}\n` +
                  `• ${t('protectedFromCounterfeiting')}\n\n` +
                  `${t('legal')}:\n` +
                  `• ${t('virtualCoins')}\n` +
                  `• ${t('forPlatformUseOnly')}\n` +
                  `• ${t('noPeerToPeerTransfers')}\n\n` +
                  `${t('byContinuing')}`
                )}
              </Text>
            </ScrollView>

            <View style={[styles.modalActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTermsModal(false);
                }}
                style={[styles.modalBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  handleAcceptTerms();
                }}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: '#000000' }]}>
                  {t('acceptAndPay')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal - Redesigned */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: theme.surface }]}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowConfirmModal(false);
              }}
            >
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom }}
            >
              {/* Success Icon */}
              <View style={[styles.confirmIconContainer, { backgroundColor: theme.primary }]}>
                <CheckCircle size={48} color="#000000" />
              </View>

              {/* Title */}
              <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>
                {t('orderConfirmation')}
              </Text>
              <Text style={[styles.confirmSubtitle, { color: theme.textSecondary }]}>
                {t('reviewOrder')}
              </Text>

              {/* Order Summary Card */}
            <View style={[styles.orderSummaryCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  {t('items')}
                </Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {totalQty} {isRTL ? 'عملة' : 'coins'}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'قيمة العملات' : 'Coin Value'}
                </Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {coinValue.toFixed(2)} {isRTL ? 'ريال' : 'QAR'}
                </Text>
              </View>
              <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'رسوم المنصة (10%)' : 'Platform Fee (10%)'}
                </Text>
                <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>
                  +{(total - coinValue).toFixed(2)} {isRTL ? 'ريال' : 'QAR'}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary, fontWeight: 'bold' }]}>
                  {isRTL ? 'المبلغ الإجمالي' : 'Total Amount'}
                </Text>
                <Text style={[styles.summaryValueLarge, { color: theme.primary }]}>
                  {total.toFixed(2)} {isRTL ? 'ريال' : 'QAR'}
                </Text>
              </View>
            </View>

            {/* Payment Info */}
            <View style={[styles.paymentInfo, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
              <CheckCircle size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentInfoTitle, { color: theme.textPrimary }]}>
                  {t('securePayment')}
                </Text>
                <Text style={[styles.paymentInfoText, { color: theme.textSecondary }]}>
                  {t('securePaymentDescription')}
                </Text>
              </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  handleConfirmPayment();
                }}
                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
              >
                <Wallet size={20} color="#000000" />
                <Text style={styles.confirmButtonText}>
                  {t('proceedToPayment')}
                </Text>
                {isRTL ? (
                  <ArrowLeft size={20} color="#000000" />
                ) : (
                  <ArrowRight size={20} color="#000000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowConfirmModal(false);
                }}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                  {t('notNow')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✅ SADAD: Sadad Payment WebView Modal */}
      {/* 🍎 Apple Compliance: On iOS, opens in external browser (Safari) instead of WebView */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        onRequestClose={handlePaymentClose}
      >
        <View style={[styles.webViewContainer, { backgroundColor: theme.background }]}>
          {/* WebView Header */}
          <View style={[styles.webViewHeader, { paddingTop: insets.top + 10, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
            <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handlePaymentClose}
              >
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              
              <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <CreditCard size={24} color={theme.primary} />
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                  {t('paymentGateway')}
                </Text>
              </View>
              
              <View style={styles.headerActionButton} />
            </View>
            
            {/* Security Badge */}
            <View style={[styles.securityBadge, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
              <CheckCircle size={16} color={theme.primary} />
              <Text style={[styles.securityBadgeText, { color: theme.textPrimary }]}>
                {t('securePaymentViaSadad')}
              </Text>
            </View>
          </View>

          {/* 🍎 Apple Compliance: Use external browser on iOS, WebView on Android */}
          {paymentUrl ? (
            requiresExternalBrowser() ? (
              // iOS: Show message and open external browser
              <ExternalBrowserPaymentView
                paymentUrl={paymentUrl}
                paymentId={paymentId}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                theme={theme}
              />
            ) : (
              // Android: Use WebView
              <WebView
                source={{ uri: paymentUrl }}
                style={styles.webView}
                onNavigationStateChange={(navState) => {
                  logger.debug('Navigation:', navState.url);
                  
                  // Check for deep link (guildapp://) - payment completed
                  if (navState.url.startsWith('guildapp://payment-success')) {
                    logger.info('✅ Payment success deep link detected, closing WebView');
                    handlePaymentSuccess();
                    return false; // Prevent navigation
                  }
                  
                  // Check for success/failure URLs
                  if (navState.url.includes('success') || navState.url.includes('payment/success')) {
                    handlePaymentSuccess();
                  } else if (navState.url.includes('failed') || navState.url.includes('payment/failed')) {
                    handlePaymentFailure();
                  } else if (navState.url.includes('cancel') || navState.url.includes('payment/cancel')) {
                    handlePaymentClose();
                  }
                }}
                onShouldStartLoadWithRequest={(request) => {
                  // Intercept deep links and handle them
                  if (request.url.startsWith('guildapp://')) {
                    logger.info('🔗 Deep link intercepted:', request.url);
                    
                    if (request.url.startsWith('guildapp://payment-success')) {
                      handlePaymentSuccess();
                    } else if (request.url.startsWith('guildapp://payment-failed')) {
                      handlePaymentFailure();
                    } else if (request.url.startsWith('guildapp://payment-cancel')) {
                      handlePaymentClose();
                    }
                    
                    return false; // Don't load the deep link URL
                  }
                  
                  return true; // Allow other URLs
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  // COMMENT: PRIORITY 1 - Replace console.error with logger
                  logger.error('WebView error:', nativeEvent);
                  handlePaymentFailure();
                }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      {t('loadingPaymentGateway')}
                    </Text>
                  </View>
                )}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
              />
            )
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  backButton: { 
    padding: 8, 
    borderRadius: 20 
  },
  headerCenter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    justifyContent: 'center', 
    gap: 8 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    fontFamily: FONT_FAMILY 
  },
  headerActionButton: { 
    padding: 8, 
    borderRadius: 20, 
    width: 40 
  },
  scroll: { 
    flex: 1 
  },
  scrollContent: { 
    padding: 16 
  },
  descriptionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  descriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  card: { 
    width: CARD_WIDTH, 
    marginBottom: 16, 
    borderRadius: 12, 
    padding: 12, 
    borderWidth: 1 
  },
  imageContainer: { 
    width: '100%', 
    height: 126, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8 
  },
  coinImage: { 
    width: 154, 
    height: 154 
  },
  cardInfo: { 
    marginBottom: 12 
  },
  coinName: { 
    fontSize: 16, 
    fontWeight: '600', 
    fontFamily: FONT_FAMILY, 
    marginBottom: 4 
  },
  coinValue: { 
    fontSize: 14, 
    fontFamily: FONT_FAMILY 
  },
  qtyControl: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderRadius: 8, 
    padding: 4,
    borderWidth: 1 
  },
  qtyBtn: { 
    width: 32, 
    height: 32, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  qtyText: { 
    fontSize: 16, 
    fontWeight: '600', 
    fontFamily: FONT_FAMILY, 
    minWidth: 24, 
    textAlign: 'center' 
  },
  addBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    alignSelf: 'center' 
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  floatingCart: {
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  cartDetails: {
    gap: 2,
  },
  cartItemsText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.7,
  },
  cartTotalText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  cartDivider: {
    height: 1,
    width: '100%',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    maxHeight: height * 0.8 
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    fontFamily: FONT_FAMILY, 
    textAlign: 'center',
    flex: 1 
  },
  termsScroll: { 
    maxHeight: 300, 
    marginBottom: 20 
  },
  termsText: { 
    fontSize: 14, 
    fontFamily: FONT_FAMILY, 
    lineHeight: 22 
  },
  confirmModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
    maxHeight: height * 0.75,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  confirmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  orderSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  summaryValueLarge: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 12,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  paymentInfoText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: FONT_FAMILY,
    lineHeight: 18,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  modalActions: { 
    flexDirection: 'row', 
    gap: 12 
  },
  modalBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1 
  },
  modalBtnText: { 
    fontSize: 16, 
    fontWeight: '600', 
    fontFamily: FONT_FAMILY 
  },
  webViewContainer: {
    flex: 1,
  },
  externalBrowserContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  externalBrowserTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  externalBrowserText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  externalBrowserNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 24,
  },
  webViewHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  securityBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginTop: 12,
  },
});
