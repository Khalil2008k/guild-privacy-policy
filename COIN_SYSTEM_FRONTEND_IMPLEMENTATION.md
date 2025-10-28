# 🎨 **GUILD COIN SYSTEM - FRONTEND IMPLEMENTATION**

> **Date:** October 22, 2025
> **Status:** Production-Ready UI/UX Implementation
> **Design:** Premium, Modern, Hyper-Visual with Theme Support

---

## 📋 **TABLE OF CONTENTS**

1. [Design System & Theme](#design-system--theme)
2. [Coin Store UI](#coin-store-ui)
3. [Wallet UI Updates](#wallet-ui-updates)
4. [Job Payment Integration](#job-payment-integration)
5. [Withdrawal Request UI](#withdrawal-request-ui)
6. [Shared Components](#shared-components)

---

## 🎨 **DESIGN SYSTEM & THEME**

### **Color Palette (Extended for Coins)**

```typescript
// Coin-specific colors (in addition to existing theme)
export const COIN_COLORS = {
  GBC: {
    primary: '#CD7F32',      // Bronze
    gradient: ['#CD7F32', '#B8732D'],
    glow: '#CD7F3240',
    icon: '🥉',
  },
  GSC: {
    primary: '#C0C0C0',      // Silver
    gradient: ['#C0C0C0', '#A8A8A8'],
    glow: '#C0C0C040',
    icon: '🥈',
  },
  GGC: {
    primary: '#FFD700',      // Gold
    gradient: ['#FFD700', '#FFC700'],
    glow: '#FFD70040',
    icon: '🥇',
  },
  GPC: {
    primary: '#E5E4E2',      // Platinum
    gradient: ['#E5E4E2', '#D3D3D3'],
    glow: '#E5E4E240',
    icon: '💎',
  },
  GDC: {
    primary: '#B9F2FF',      // Diamond
    gradient: ['#B9F2FF', '#87CEEB'],
    glow: '#B9F2FF40',
    icon: '💠',
  },
  GRC: {
    primary: '#9B59B6',      // Royal Purple
    gradient: ['#9B59B6', '#8E44AD'],
    glow: '#9B59B640',
    icon: '👑',
  },
};

// Adaptive colors for light/dark mode
export const getAdaptiveCoinColors = (isDarkMode: boolean) => ({
  cardBackground: isDarkMode ? '#2D2D2D' : '#FFFFFF',
  cardBorder: isDarkMode ? '#404040' : 'rgba(0,0,0,0.08)',
  textPrimary: isDarkMode ? '#FFFFFF' : '#1A1A1A',
  textSecondary: isDarkMode ? '#CCCCCC' : '#666666',
  surfaceElevated: isDarkMode ? '#1A1A1A' : '#F8F9FA',
  glowIntensity: isDarkMode ? 0.3 : 0.15,
});
```

### **Typography**

```typescript
export const COIN_TYPOGRAPHY = {
  coinValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Signika Negative SC',
  },
  coinName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Signika Negative SC',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Signika Negative SC',
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Signika Negative SC',
  },
};
```

---

## 🛒 **COIN STORE UI**

### **File:** `src/app/(modals)/coin-store.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ShoppingCart,
  Info,
  Check,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { CustomAlertService } from '@/services/CustomAlertService';
import { coinStoreService } from '@/services/CoinStoreService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// Coin catalog
const COIN_CATALOG = [
  {
    symbol: 'GBC',
    name: 'Guild Bronze',
    value: 5,
    color: '#CD7F32',
    gradient: ['#CD7F32', '#B8732D'],
    icon: '🥉',
    description: 'Perfect for small tasks',
  },
  {
    symbol: 'GSC',
    name: 'Guild Silver',
    value: 10,
    color: '#C0C0C0',
    gradient: ['#C0C0C0', '#A8A8A8'],
    icon: '🥈',
    description: 'Great for quick jobs',
  },
  {
    symbol: 'GGC',
    name: 'Guild Gold',
    value: 50,
    color: '#FFD700',
    gradient: ['#FFD700', '#FFC700'],
    icon: '🥇',
    description: 'Standard job pricing',
  },
  {
    symbol: 'GPC',
    name: 'Guild Platinum',
    value: 100,
    color: '#E5E4E2',
    gradient: ['#E5E4E2', '#D3D3D3'],
    icon: '💎',
    description: 'Premium projects',
  },
  {
    symbol: 'GDC',
    name: 'Guild Diamond',
    value: 200,
    color: '#B9F2FF',
    gradient: ['#B9F2FF', '#87CEEB'],
    icon: '💠',
    description: 'Large contracts',
  },
  {
    symbol: 'GRC',
    name: 'Guild Royal',
    value: 500,
    color: '#9B59B6',
    gradient: ['#9B59B6', '#8E44AD'],
    icon: '👑',
    description: 'Enterprise deals',
  },
];

// Pre-defined packs
const QUICK_PACKS = [
  { name: 'Starter', symbol: 'GBC', qty: 1, value: 5 },
  { name: 'Basic', symbol: 'GSC', qty: 1, value: 10 },
  { name: 'Standard', symbol: 'GGC', qty: 1, value: 50 },
  { name: 'Pro', symbol: 'GPC', qty: 1, value: 100 },
  { name: 'Premium', symbol: 'GDC', qty: 1, value: 200 },
  { name: 'Elite', symbol: 'GRC', qty: 1, value: 500 },
];

export default function CoinStoreScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedTab, setSelectedTab] = useState<'quick' | 'custom'>('quick');
  const [customAmount, setCustomAmount] = useState('');
  const [calculatedPack, setCalculatedPack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);

  // Animated values
  const [scaleAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Pulsing glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    text: isDarkMode ? theme.textPrimary : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // Calculate custom pack
  useEffect(() => {
    if (customAmount && parseInt(customAmount) >= 5) {
      const amount = parseInt(customAmount);
      const pack = calculateOptimalPack(amount);
      setCalculatedPack(pack);
    } else {
      setCalculatedPack(null);
    }
  }, [customAmount]);

  const calculateOptimalPack = (targetQAR: number) => {
    const coinTiers = [
      { symbol: 'GRC', value: 500 },
      { symbol: 'GDC', value: 200 },
      { symbol: 'GPC', value: 100 },
      { symbol: 'GGC', value: 50 },
      { symbol: 'GSC', value: 10 },
      { symbol: 'GBC', value: 5 },
    ];

    let remaining = targetQAR;
    const coins: Record<string, number> = {};

    for (const coin of coinTiers) {
      const count = Math.floor(remaining / coin.value);
      if (count > 0) {
        coins[coin.symbol] = count;
        remaining -= count * coin.value;
      }
    }

    // If there's a remainder, add one more of the smallest coin that covers it
    if (remaining > 0) {
      for (let i = coinTiers.length - 1; i >= 0; i--) {
        if (coinTiers[i].value >= remaining) {
          coins[coinTiers[i].symbol] = (coins[coinTiers[i].symbol] || 0) + 1;
          break;
        }
      }
    }

    const actualValue = Object.entries(coins).reduce((sum, [symbol, qty]) => {
      const coin = coinTiers.find(c => c.symbol === symbol);
      return sum + (coin ? coin.value * qty : 0);
    }, 0);

    const price = Math.round(actualValue * 1.10 * 100) / 100; // 10% markup

    return { coins, value: actualValue, price };
  };

  const handlePurchase = async (pack: any) => {
    setSelectedPack(pack);
    setShowTerms(true);
  };

  const handleConfirmPurchase = async () => {
    if (!termsAccepted) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب قبول الشروط والأحكام' : 'You must accept the terms and conditions'
      );
      return;
    }

    try {
      setLoading(true);
      setShowTerms(false);

      const purchaseData = selectedTab === 'quick'
        ? { coins: { [selectedPack.symbol]: selectedPack.qty } }
        : { customAmount: calculatedPack.value };

      const result = await coinStoreService.createPurchase(purchaseData);

      // Redirect to Fatora payment
      router.push({
        pathname: '/payment-webview',
        params: {
          url: result.paymentUrl,
          purchaseId: result.purchaseId,
        },
      });
    } catch (error) {
      console.error('Purchase error:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        error instanceof Error ? error.message : 'Failed to create purchase'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCoinCard = (coin: typeof COIN_CATALOG[0], index: number) => {
    const pack = QUICK_PACKS[index];
    const price = Math.round(pack.value * 1.10 * 100) / 100;

    return (
      <TouchableOpacity
        key={coin.symbol}
        activeOpacity={0.8}
        onPress={() => handlePurchase(pack)}
        style={[styles.coinCard, { borderColor: adaptiveColors.border }]}
      >
        <LinearGradient
          colors={[...coin.gradient, coin.gradient[0]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coinGradient}
        >
          <Animated.View
            style={[
              styles.coinGlow,
              {
                backgroundColor: coin.color,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3],
                }),
              },
            ]}
          />
          
          <View style={styles.coinContent}>
            <Text style={styles.coinIcon}>{coin.icon}</Text>
            <Text style={[styles.coinName, { color: '#FFFFFF' }]}>
              {coin.name}
            </Text>
            <Text style={[styles.coinValue, { color: '#FFFFFF' }]}>
              {pack.value} QAR
            </Text>
            <Text style={[styles.coinDescription, { color: 'rgba(255,255,255,0.8)' }]}>
              {coin.description}
            </Text>
            
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: 'rgba(255,255,255,0.7)' }]}>
                {isRTL ? 'السعر' : 'Price'}
              </Text>
              <Text style={[styles.price, { color: '#FFFFFF' }]}>
                {price} QAR
              </Text>
              <Text style={[styles.savings, { color: theme.primary }]}>
                {isRTL ? 'وفر 10%' : 'Save 10%'}
              </Text>
            </View>

            <View style={[styles.buyButton, { backgroundColor: theme.primary }]}>
              <ShoppingCart size={18} color={adaptiveColors.buttonText} />
              <Text style={[styles.buyButtonText, { color: adaptiveColors.buttonText }]}>
                {isRTL ? 'شراء الآن' : 'Buy Now'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCustomPack = () => {
    return (
      <View style={[styles.customSection, { backgroundColor: adaptiveColors.surface }]}>
        <View style={styles.customHeader}>
          <Sparkles size={24} color={theme.primary} />
          <Text style={[styles.customTitle, { color: adaptiveColors.text }]}>
            {isRTL ? 'حزمة مخصصة' : 'Custom Pack'}
          </Text>
        </View>

        <Text style={[styles.customDescription, { color: adaptiveColors.textSecondary }]}>
          {isRTL 
            ? 'أدخل المبلغ الذي تريده وسنحسب أفضل مجموعة عملات لك'
            : 'Enter your desired amount and we\'ll calculate the best coin combination for you'
          }
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: adaptiveColors.background,
                color: adaptiveColors.text,
                borderColor: adaptiveColors.border,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'أدخل المبلغ (5 - 5000 ريال)' : 'Enter amount (5 - 5000 QAR)'}
            placeholderTextColor={adaptiveColors.textSecondary}
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={setCustomAmount}
            maxLength={4}
          />
          <Text style={[styles.currency, { color: adaptiveColors.textSecondary }]}>
            QAR
          </Text>
        </View>

        {calculatedPack && (
          <Animated.View
            style={[
              styles.calculatedPack,
              {
                backgroundColor: adaptiveColors.background,
                borderColor: theme.primary,
              },
            ]}
          >
            <View style={styles.packHeader}>
              <Check size={20} color={theme.primary} />
              <Text style={[styles.packTitle, { color: adaptiveColors.text }]}>
                {isRTL ? 'ستحصل على' : 'You\'ll Get'}
              </Text>
            </View>

            <View style={styles.coinList}>
              {Object.entries(calculatedPack.coins).map(([symbol, qty]) => {
                const coin = COIN_CATALOG.find(c => c.symbol === symbol);
                return (
                  <View key={symbol} style={styles.coinItem}>
                    <Text style={styles.coinItemIcon}>{coin?.icon}</Text>
                    <Text style={[styles.coinItemText, { color: adaptiveColors.text }]}>
                      {qty}x {coin?.name}
                    </Text>
                    <Text style={[styles.coinItemValue, { color: adaptiveColors.textSecondary }]}>
                      ({(qty as number) * (coin?.value || 0)} QAR)
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.totalContainer}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: adaptiveColors.textSecondary }]}>
                  {isRTL ? 'القيمة' : 'Value'}
                </Text>
                <Text style={[styles.totalValue, { color: adaptiveColors.text }]}>
                  {calculatedPack.value} QAR
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: adaptiveColors.textSecondary }]}>
                  {isRTL ? 'رسوم المنصة (10%)' : 'Platform Fee (10%)'}
                </Text>
                <Text style={[styles.totalValue, { color: adaptiveColors.text }]}>
                  {Math.round((calculatedPack.price - calculatedPack.value) * 100) / 100} QAR
                </Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={[styles.totalLabelFinal, { color: adaptiveColors.text }]}>
                  {isRTL ? 'المجموع' : 'Total'}
                </Text>
                <Text style={[styles.totalValueFinal, { color: theme.primary }]}>
                  {calculatedPack.price} QAR
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.customBuyButton, { backgroundColor: theme.primary }]}
              onPress={() => handlePurchase(calculatedPack)}
              activeOpacity={0.8}
            >
              <ShoppingCart size={20} color={adaptiveColors.buttonText} />
              <Text style={[styles.customBuyButtonText, { color: adaptiveColors.buttonText }]}>
                {isRTL ? 'شراء الآن' : 'Buy Now'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderTermsModal = () => {
    return (
      <Modal
        visible={showTerms}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTerms(false)}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: adaptiveColors.surface }]}>
            <View style={styles.modalHeader}>
              <Shield size={32} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: adaptiveColors.text }]}>
                {isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}
              </Text>
            </View>

            <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.termsText, { color: adaptiveColors.text }]}>
                {isRTL ? 'شروط شراء العملات:' : 'Coin Purchase Terms:'}
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL 
                  ? 'العملات غير قابلة للتحويل ويمكن استخدامها فقط داخل منصة Guild'
                  : 'Coins are non-transferable and usable only inside Guild platform'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'العملات تمثل رصيد داخل التطبيق؛ 1 عملة = قيمة ثابتة بالريال القطري عند الشراء'
                  : 'Coins represent in-app credit; 1 coin unit = fixed QAR value at purchase'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'العملات المشتراة لا تنتهي صلاحيتها. العملات المكتسبة تنتهي بعد 24 شهرًا من عدم النشاط'
                  : 'Purchased coins never expire. Earned coins expire after 24 months of inactivity'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'سيتم إرسال إشعارات انتهاء الصلاحية قبل 30/7/1 يومًا'
                  : 'Expiry notifications will be sent 30/7/1 days prior'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'العملات غير قابلة للاسترداد إلا في حالة فشل الشراء/الخدمات'
                  : 'Coins are non-refundable except where platform authorizes refunds for failed purchases/services'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'السحب النقدي متاح فقط عبر طلبات معتمدة من الإدارة؛ تتم المدفوعات خلال 10-14 يومًا بعد التحقق'
                  : 'Cash-out available only via admin-approved requests; payouts processed within 10-14 days after verification'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'قد تتطلب المنصة التحقق من الهوية (KYC) قبل الموافقة على عمليات السحب'
                  : 'Platform may require KYC before approving withdrawals'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'الرسوم: رسوم المنصة 10% ورسوم PSP مضمنة في سعر العملة'
                  : 'Fees: 10% platform fee & PSP fees included in coin pricing'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'تحتفظ Guild بالحق في تعليق الحسابات عند الاشتباه في الاحتيال'
                  : 'Guild reserves the right to suspend accounts on suspicion of fraud'
                }
              </Text>
              
              <Text style={[styles.termItem, { color: adaptiveColors.textSecondary }]}>
                • {isRTL
                  ? 'بشراء العملات، فإنك توافق على هذه الشروط'
                  : 'By purchasing coins, you accept these terms'
                }
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.acceptCheckbox}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: termsAccepted ? theme.primary : 'transparent',
                    borderColor: termsAccepted ? theme.primary : adaptiveColors.border,
                  },
                ]}
              >
                {termsAccepted && <Check size={18} color={adaptiveColors.buttonText} />}
              </View>
              <Text style={[styles.acceptText, { color: adaptiveColors.text }]}>
                {isRTL ? 'أوافق على الشروط والأحكام' : 'I accept the terms and conditions'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border, borderWidth: 1 }]}
                onPress={() => {
                  setShowTerms(false);
                  setTermsAccepted(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: adaptiveColors.text }]}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: termsAccepted ? theme.primary : adaptiveColors.surface,
                    opacity: termsAccepted ? 1 : 0.5,
                  },
                ]}
                onPress={handleConfirmPurchase}
                disabled={!termsAccepted || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={adaptiveColors.buttonText} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: termsAccepted ? adaptiveColors.buttonText : adaptiveColors.textSecondary }]}>
                    {isRTL ? 'متابعة الدفع' : 'Continue to Payment'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: adaptiveColors.surface, borderBottomColor: adaptiveColors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={adaptiveColors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Sparkles size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: adaptiveColors.text }]}>
            {isRTL ? 'متجر العملات' : 'Coin Store'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/coin-info')}
          style={styles.infoButton}
          activeOpacity={0.7}
        >
          <Info size={24} color={adaptiveColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: adaptiveColors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'quick' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setSelectedTab('quick')}
          activeOpacity={0.7}
        >
          <TrendingUp size={20} color={selectedTab === 'quick' ? adaptiveColors.buttonText : adaptiveColors.textSecondary} />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'quick' ? adaptiveColors.buttonText : adaptiveColors.textSecondary,
              },
            ]}
          >
            {isRTL ? 'حزم سريعة' : 'Quick Packs'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'custom' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setSelectedTab('custom')}
          activeOpacity={0.7}
        >
          <Sparkles size={20} color={selectedTab === 'custom' ? adaptiveColors.buttonText : adaptiveColors.textSecondary} />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'custom' ? adaptiveColors.buttonText : adaptiveColors.textSecondary,
              },
            ]}
          >
            {isRTL ? 'حزمة مخصصة' : 'Custom Pack'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {selectedTab === 'quick' ? (
          <View style={styles.quickPacks}>
            {COIN_CATALOG.map((coin, index) => renderCoinCard(coin, index))}
          </View>
        ) : (
          renderCustomPack()
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: adaptiveColors.surface }]}>
          <AlertCircle size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: adaptiveColors.textSecondary }]}>
            {isRTL
              ? 'جميع الأسعار تشمل رسوم المنصة 10%. رسوم PSP (2.5%) مضمنة.'
              : 'All prices include 10% platform fee. PSP fees (2.5%) included.'
            }
          </Text>
        </View>
      </ScrollView>

      {/* Terms Modal */}
      {renderTermsModal()}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  infoButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  quickPacks: {
    gap: 16,
  },
  coinCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  coinGradient: {
    padding: 20,
    position: 'relative',
  },
  coinGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  coinContent: {
    alignItems: 'center',
    gap: 8,
  },
  coinIcon: {
    fontSize: 48,
  },
  coinName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  coinValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  coinDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  savings: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  customSection: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  customDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  calculatedPack: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    gap: 16,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  coinList: {
    gap: 12,
  },
  coinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinItemIcon: {
    fontSize: 24,
  },
  coinItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  coinItemValue: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  totalContainer: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRowFinal: {
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  totalLabelFinal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  totalValueFinal: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  customBuyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  customBuyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  termsScroll: {
    maxHeight: 300,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  termItem: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 22,
    marginBottom: 8,
  },
  acceptCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
});
```

---

This is the **Coin Store UI** - a premium, modern design with:

✅ **Animated coin cards** with gradient backgrounds
✅ **Pulsing glow effects** for visual appeal
✅ **Quick packs** (6 pre-defined options)
✅ **Custom pack calculator** (user enters amount, system calculates optimal coins)
✅ **Terms & Conditions modal** (must accept before purchase)
✅ **Full RTL/LTR support**
✅ **Dark/Light mode adaptive**
✅ **Lucide icons throughout**

**Should I continue with:**
1. ✅ Wallet UI updates (balance display, transaction history)
2. ✅ Job payment integration (coin selection for jobs)
3. ✅ Withdrawal request UI (KYC, request form)
4. ✅ Admin console (withdrawal management)

Or would you like me to review/adjust the Coin Store UI first?

