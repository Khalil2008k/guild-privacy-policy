import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Shield, CreditCard, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlertService } from '../../services/CustomAlertService';

const { width } = Dimensions.get('window');

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  details: string;
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
  isVerified: boolean;
  provider?: string;
}

export default function PaymentMethodsScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  // Mock payment methods - For beta, show Guild Coins only
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'wallet',
      name: 'Guild Coins',
      details: 'Beta Testing Currency',
      isDefault: true,
      isVerified: true,
      provider: 'GUILD'
    }
  ]);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard size={24} color="#000000" />;
      case 'bank':
        return <Ionicons name="business" size={24} color="#000000" />;
      case 'wallet':
        return <Ionicons name="wallet" size={24} color="#000000" />;
      default:
        return <CreditCard size={24} color="#000000" />;
    }
  };

  const handleAddMethod = () => {
    CustomAlertService.showInfo(
      'Coming Soon',
      'Additional payment methods will be available after beta testing. Currently, all transactions use Guild Coins.'
    );
  };

  const handleManageMethod = (method: PaymentMethod) => {
    if (method.type === 'wallet' && method.provider === 'GUILD') {
      CustomAlertService.showInfo(
        'Guild Coins',
        'This is your beta testing currency. You can view your balance and transactions from the main wallet screen.'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.primary }]}>
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#000000" />
          </TouchableOpacity>
          
          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Shield size={24} color="#000000" />
            <Text style={[styles.headerTitle, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
              {isRTL ? 'طرق الدفع' : 'Payment Methods'}
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.primary }]}>
          <View style={[styles.infoContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="information-circle" size={24} color="#000000" />
            <View style={[styles.infoText, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
              <Text style={[styles.infoTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'وضع الاختبار التجريبي' : 'Beta Testing Mode'}
              </Text>
              <Text style={[styles.infoDescription, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'حاليًا نستخدم عملات جيلد لجميع المعاملات. ستكون طرق الدفع الحقيقية متاحة بعد الاختبار.' : 'Currently using Guild Coins for all transactions. Real payment methods will be available after beta.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'طرق الدفع النشطة' : 'Active Payment Methods'}
            </Text>
            <TouchableOpacity style={[styles.addButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleAddMethod}>
              <Plus size={20} color={theme.primary} />
              <Text style={[styles.addButtonText, { color: theme.primary, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>
                {isRTL ? 'إضافة جديد' : 'Add New'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment Method Cards */}
          {paymentMethods.map((method) => (
            <TouchableOpacity 
              key={method.id}
              style={[styles.methodCard, { backgroundColor: theme.primary }]}
              onPress={() => handleManageMethod(method)}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIcon}>
                  {getMethodIcon(method.type)}
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodNameRow}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodDetails}>{method.details}</Text>
                  {method.lastFour && (
                    <Text style={styles.methodNumber}>•••• {method.lastFour}</Text>
                  )}
                </View>
              </View>

              <View style={styles.methodRight}>
                {method.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#00C9A7" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Coming Soon
          </Text>

          {/* Credit/Debit Cards */}
          <View style={[styles.comingSoonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.comingSoonLeft}>
              <View style={[styles.comingSoonIcon, { backgroundColor: theme.primary + '20' }]}>
                <CreditCard size={24} color={theme.primary} />
              </View>
              <View style={styles.comingSoonInfo}>
                <Text style={[styles.comingSoonTitle, { color: theme.textPrimary }]}>
                  Credit & Debit Cards
                </Text>
                <Text style={[styles.comingSoonDescription, { color: theme.textSecondary }]}>
                  Visa, Mastercard, American Express
                </Text>
              </View>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={[styles.comingSoonBadgeText, { color: theme.textSecondary }]}>
                Soon
              </Text>
            </View>
          </View>

          {/* Bank Accounts */}
          <View style={[styles.comingSoonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.comingSoonLeft}>
              <View style={[styles.comingSoonIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="business" size={24} color={theme.primary} />
              </View>
              <View style={styles.comingSoonInfo}>
                <Text style={[styles.comingSoonTitle, { color: theme.textPrimary }]}>
                  Bank Accounts
                </Text>
                <Text style={[styles.comingSoonDescription, { color: theme.textSecondary }]}>
                  Direct bank transfers
                </Text>
              </View>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={[styles.comingSoonBadgeText, { color: theme.textSecondary }]}>
                Soon
              </Text>
            </View>
          </View>

          {/* Mobile Wallets */}
          <View style={[styles.comingSoonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.comingSoonLeft}>
              <View style={[styles.comingSoonIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="phone-portrait" size={24} color={theme.primary} />
              </View>
              <View style={styles.comingSoonInfo}>
                <Text style={[styles.comingSoonTitle, { color: theme.textPrimary }]}>
                  Mobile Wallets
                </Text>
                <Text style={[styles.comingSoonDescription, { color: theme.textSecondary }]}>
                  Apple Pay, Google Pay, Samsung Pay
                </Text>
              </View>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={[styles.comingSoonBadgeText, { color: theme.textSecondary }]}>
                Soon
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 8,
  },
  headerRight: {
    padding: 8,
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#00C9A7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  methodDetails: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    marginBottom: 2,
  },
  methodNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    opacity: 0.6,
  },
  methodRight: {
    marginLeft: 12,
  },
  verifiedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 201, 167, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    opacity: 0.6,
  },
  comingSoonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  comingSoonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  comingSoonInfo: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  comingSoonDescription: {
    fontSize: 14,
  },
  comingSoonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});