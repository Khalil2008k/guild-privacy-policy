/**
 * COIN STORE - Consistent App Design
 * Modern e-commerce design matching app style
 */

import React, { useState } from 'react';
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
  { symbol: 'GBC', name: 'Bronze', nameAr: 'برونزية', value: 5 },
  { symbol: 'GSC', name: 'Silver', nameAr: 'فضية', value: 10 },
  { symbol: 'GGC', name: 'Gold', nameAr: 'ذهبية', value: 50 },
  { symbol: 'GPC', name: 'Platinum', nameAr: 'بلاتينية', value: 100 },
  { symbol: 'GDC', name: 'Diamond', nameAr: 'ماسية', value: 200 },
  { symbol: 'GRC', name: 'Ruby', nameAr: 'ياقوتية', value: 500 },
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
      const response = await CoinStoreService.purchaseCoins(cart);
      
      // If there's a payment URL, show it (Fatora integration - ONLY way to connect to Fatora)
      if (response.data?.paymentUrl) {
        setPaymentUrl(response.data.paymentUrl);
        setPaymentId(response.data?.paymentId || response.data?.payment_id || '');
        setShowConfirmModal(true);
      } else {
        // Direct purchase (no payment needed)
        CustomAlertService.showSuccess(
          t('success'),
          `${t('purchasedCoins')} ${totalQty} ${isRTL ? 'عملة' : 'coins'}`
        );
        setCart({});
        // Refresh wallet to show updated balance
        await refreshWallet();
        router.back();
      }
    } catch (error: any) {
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
            {t('neverExpire')} {t('canBeWithdrawn')}
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
                  <Text style={[styles.coinValue, { color: theme.textSecondary }]}>
                    {coin.value} {isRTL ? 'ريال' : 'QAR'}
                  </Text>
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
                  {total} {isRTL ? 'ريال' : 'QAR'}
                </Text>
              </View>
            </View>
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
                  {t('totalAmount')}
                </Text>
                <Text style={[styles.summaryValueLarge, { color: theme.primary }]}>
                  {total} {isRTL ? 'ريال' : 'QAR'}
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
          </View>
        </View>
      </Modal>

      {/* Fatora Payment WebView Modal */}
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
                {t('securePaymentViaFatora')}
              </Text>
            </View>
          </View>

          {/* WebView */}
          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.webView}
              onNavigationStateChange={(navState) => {
                // COMMENT: PRIORITY 1 - Replace console.log with logger
                logger.debug('Navigation:', navState.url);
                
                // Check for success/failure URLs
                if (navState.url.includes('success') || navState.url.includes('payment/success')) {
                  handlePaymentSuccess();
                } else if (navState.url.includes('failed') || navState.url.includes('payment/failed')) {
                  handlePaymentFailure();
                } else if (navState.url.includes('cancel') || navState.url.includes('payment/cancel')) {
                  handlePaymentClose();
                }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
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
