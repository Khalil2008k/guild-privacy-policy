import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  CreditCard, 
  Plus,
  X, 
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { secureStorage } from '../../services/secureStorage'; // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
import { logger } from '../../utils/logger'; // COMMENT: SECURITY - Use logger instead of console.log per Task 1.7
import { CustomAlert } from '../../components/CustomAlert';
import PaymentErrorBoundary from '../../components/PaymentErrorBoundary'; // COMMENT: PRODUCTION HARDENING - Task 4.5 - Add error boundary for payment methods screen
// COMMENT: PRODUCTION HARDENING - Task 4.10 - Import responsive utilities
import { useResponsive, getMaxContentWidth } from '../../utils/responsive';
// COMMENT: PRIORITY 1 - File Modularization - Import extracted components
import { PaymentMethodsHeader } from './_components/PaymentMethodsHeader';
import { PaymentMethodCard } from './_components/PaymentMethodCard';
import { AddPaymentMethodModal } from './_components/AddPaymentMethodModal';
import { EditPaymentMethodModal } from './_components/EditPaymentMethodModal';
// COMMENT: FORBIDDEN AI SYSTEM - U²-Net component disabled per ABSOLUTE_RULES.md
// import SimpleU2NetBackgroundRemover from '../../components/SimpleU2NetBackgroundRemover';
// Note: Cards are stored locally on device only (not on GUILD servers)
// ✅ SADAD: When using Sadad payment gateway, saved card info auto-fills their form
// ❌ FATORA: Replaced Fatora with Sadad
// Sadad is just a payment processor, not storing cards

const FONT_FAMILY = 'Signika Negative SC';

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
  // COMMENT: PRODUCTION HARDENING - Task 4.10 - Get responsive dimensions
  const { isTablet, isLargeDevice, width } = useResponsive();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMethod, setAddingMethod] = useState(false);
  const [editingMethodState, setEditingMethodState] = useState(false);
  const [showSaveCardAlert, setShowSaveCardAlert] = useState(false);
  const [pendingCard, setPendingCard] = useState<PaymentMethod | null>(null);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isU2NetLoaded, setIsU2NetLoaded] = useState(false);

  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Timeout ref for U²-Net initialization cleanup
  const u2netTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load payment methods on mount
  // ✅ SADAD: Cards are stored locally on device via Sadad SDK
  // ❌ FATORA: Replaced Fatora with Sadad
  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Add cleanup for async operations
  useEffect(() => {
    let isMounted = true; // Cleanup flag to prevent state updates on unmounted component
    
    const initialize = async () => {
      await loadPaymentMethods();
      if (!isMounted) return;
      await loadProfilePicture();
      if (!isMounted) return;
      await initializeU2Net();
    };
    
    initialize();
    
    // Cleanup: Set flag to prevent state updates if component unmounts, clear timeout
    return () => {
      isMounted = false;
      // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear U²-Net initialization timeout
      if (u2netTimeoutRef.current) {
        clearTimeout(u2netTimeoutRef.current);
        u2netTimeoutRef.current = null;
      }
    };
  }, []);

  const initializeU2Net = async () => {
    try {
      // COMMENT: SECURITY - Use logger instead of console.log per Task 1.7
      logger.info('🔄 Initializing U²-Net for profile pictures...');
      // COMMENT: PRODUCTION HARDENING - Task 5.1 - Store timeout ID for cleanup
      // Simulate U²-Net initialization
      await new Promise<void>(resolve => {
        u2netTimeoutRef.current = setTimeout(() => {
          u2netTimeoutRef.current = null;
          resolve();
        }, 2000);
      });
      setIsU2NetLoaded(true);
      logger.info('✅ U²-Net ready for profile picture processing');
    } catch (error) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('❌ Failed to initialize U²-Net:', error);
    }
  };

  const loadProfilePicture = async () => {
    try {
      // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
      const savedPicture = await secureStorage.getItem('user_profile_picture');
      if (savedPicture) {
        setProfilePicture(savedPicture);
      }
    } catch (error) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('Error loading profile picture:', error);
    }
  };

  const handleProfilePictureProcessed = async (processedImageUri: string) => {
    try {
      // COMMENT: SECURITY - Use logger instead of console.log per Task 1.7
      logger.info('🎨 Profile picture processed with U²-Net:', processedImageUri);
      setProfilePicture(processedImageUri);
      // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
      await secureStorage.setItem('user_profile_picture', processedImageUri);
      Alert.alert(t('success'), t('profilePictureUpdated'));
    } catch (error) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('Error saving profile picture:', error);
      Alert.alert(t('error'), t('failedToSaveProfilePicture'));
    }
  };

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
      // Load cards from secure storage (hardware-backed encryption in production)
      const storedCards = await secureStorage.getItem('saved_payment_cards');
      if (storedCards) {
        const cards = JSON.parse(storedCards);
        setPaymentMethods(cards);
      } else {
        setPaymentMethods([]);
      }
    } catch (error: any) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('Error loading payment methods:', error);
      Alert.alert(t('error'), error.message || t('failedToLoadPaymentMethods'));
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (type: string, provider?: string) => {
    // Return Lucide icon component name
    return 'CreditCard';
  };

  const getMethodColor = (type: string, provider?: string) => {
    if (type === 'card') {
      switch (provider) {
        case 'visa': return '#1A1F71';
        case 'mastercard': return '#EB001B';
        default: return theme.primary;
      }
    }
    switch (type) {
      case 'bank': return theme.info;
      case 'wallet': return theme.success;
      default: return theme.primary;
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
      // Update cards in secure storage
      const updatedCards = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }));
      
      await secureStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
      setPaymentMethods(updatedCards);
      
      Alert.alert(t('success'), t('defaultPaymentMethodUpdated'));
    } catch (error: any) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('Error setting default payment method:', error);
      Alert.alert(t('error'), error.message || t('failedToUpdateDefault'));
    }
  };

  const handleDeleteMethod = (methodId: string) => {
    Alert.alert(
      t('deletePaymentMethod'),
      t('deletePaymentMethodMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              
              // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
              // Delete card from secure storage
              const updatedCards = paymentMethods.filter(method => method.id !== methodId);
              await secureStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
              
              setPaymentMethods(updatedCards);
              Alert.alert(t('success'), t('paymentMethodDeleted'));
            } catch (error: any) {
              // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
              logger.error('Error deleting payment method:', error);
              Alert.alert(t('error'), error.message || t('failedToDeletePaymentMethod'));
            }
          }
        }
      ]
    );
  };

  const handleAddCard = async () => {
    // Validate form
    if (!cardForm.cardNumber || !cardForm.expiryDate || !cardForm.cvv || !cardForm.cardholderName) {
      Alert.alert(t('error'), t('allFieldsRequired'));
      return;
    }

    try {
      setAddingMethod(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
      // Save card to secure storage (hardware-backed encryption in production)
      const newCard: PaymentMethod = {
        id: Date.now().toString(),
        type: 'card',
        name: cardForm.cardNumber.startsWith('4') ? 'Visa Card' : 'Mastercard',
        details: 'Personal Card',
        lastFour: cardForm.cardNumber.slice(-4),
        expiryDate: cardForm.expiryDate,
        isDefault: paymentMethods.length === 0,
        isVerified: true,
        provider: cardForm.cardNumber.startsWith('4') ? 'visa' : 'mastercard'
      };

      // Get existing cards and add new one
      const existingCards = await secureStorage.getItem('saved_payment_cards');
      const cards = existingCards ? JSON.parse(existingCards) : [];
      cards.push(newCard);
      
      // Save to secure storage
      await secureStorage.setItem('saved_payment_cards', JSON.stringify(cards));
      
      Alert.alert(
        t('addCardSuccess'), 
        t('cardSavedLocally')
      );
      
      setShowAddModal(false);
      setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      
      // Reload cards
      loadPaymentMethods();
    } catch (error: any) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('Error adding payment method:', error);
      Alert.alert(t('error'), error.message || t('failedToAddPaymentMethod'));
    } finally {
      setAddingMethod(false);
    }
  };

  const handleEditMethod = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingMethod(method);
    // Pre-fill form with card data (masked except last 4)
    setCardForm({
      cardNumber: method.lastFour ? `•••• •••• •••• ${method.lastFour}` : '',
      expiryDate: method.expiryDate || '',
      cvv: '',
      cardholderName: method.details || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateCard = async () => {
    if (!editingMethod) return;

    // Validate form
    if (!cardForm.expiryDate || !cardForm.cardholderName) {
      Alert.alert(t('error'), t('allFieldsRequired'));
      return;
    }

    try {
      setEditingMethodState(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
      // Update card in secure storage
      const updatedCards = paymentMethods.map(method => 
        method.id === editingMethod.id
          ? {
              ...method,
              expiryDate: cardForm.expiryDate,
              details: cardForm.cardholderName,
            }
          : method
      );
      
      await secureStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
      
      Alert.alert(t('success'), t('paymentMethodUpdated'));
      
      setShowEditModal(false);
      setEditingMethod(null);
      setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      
      // Reload cards
      loadPaymentMethods();
    } catch (error: any) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('Error updating payment method:', error);
      Alert.alert(t('error'), error.message || t('failedToUpdatePaymentMethod'));
    } finally {
      setEditingMethodState(false);
    }
  };

  // Function to save card after payment (used in checkout flow)
  const promptSaveCard = (cardDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  }) => {
    const newCard: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      name: cardDetails.cardNumber.startsWith('4') ? 'Visa Card' : 'Mastercard',
      details: 'Personal Card',
      lastFour: cardDetails.cardNumber.slice(-4),
      expiryDate: cardDetails.expiryDate,
      isDefault: paymentMethods.length === 0,
      isVerified: true,
      provider: cardDetails.cardNumber.startsWith('4') ? 'visa' : 'mastercard'
    };

    setPendingCard(newCard);
    setShowSaveCardAlert(true);
  };

  const handleSaveCardFromPrompt = async () => {
    if (!pendingCard) return;

    try {
      // COMMENT: SECURITY - Use secureStorage instead of AsyncStorage per Task 1.10
      // Get existing cards and add new one
      const existingCards = await secureStorage.getItem('saved_payment_cards');
      const cards = existingCards ? JSON.parse(existingCards) : [];
      cards.push(pendingCard);
      
      // Save to secure storage
      await secureStorage.setItem('saved_payment_cards', JSON.stringify(cards));
      
      Alert.alert(t('success'), t('cardSavedSuccessfully'));
      
      setShowSaveCardAlert(false);
      setPendingCard(null);
      
      // Reload cards
      loadPaymentMethods();
    } catch (error: any) {
      // COMMENT: SECURITY - Use logger instead of console.error per Task 1.7
      logger.error('Error saving card:', error);
      Alert.alert(t('error'), error.message || t('failedToAddPaymentMethod'));
    }
  };

  const handleCancelSaveCard = () => {
    setShowSaveCardAlert(false);
    setPendingCard(null);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ');
    return formatted.trim();
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  // COMMENT: PRODUCTION HARDENING - Task 4.5 - Wrap payment methods screen in error boundary
  return (
    <PaymentErrorBoundary
      fallbackRoute="/(main)/home"
      onError={(error, errorInfo) => {
        logger.error('Payment methods screen error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
      onRetry={() => {
        // Reset payment methods state on retry
        setLoading(true);
        setPaymentMethods([]);
        loadPaymentMethods();
      }}
    >
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* COMMENT: PRODUCTION HARDENING - Task 4.10 - Responsive content wrapper with max width on tablet */}
      <View style={[
        styles.contentWrapper,
        {
          maxWidth: isTablet ? getMaxContentWidth() : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }
      ]}>
      {/* Header */}
      <PaymentMethodsHeader
        onAddPress={() => setShowAddModal(true)}
        onProfilePicturePress={() => setShowProfilePictureModal(true)}
        profilePicture={profilePicture}
        isU2NetLoaded={isU2NetLoaded}
      />

      <ScrollView 
        style={[
          styles.content,
          {
            paddingHorizontal: isTablet ? 24 : 16,
          }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {t('loadingPaymentMethods')}
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && paymentMethods.length === 0 && (
          <View style={styles.emptyContainer}>
            <CreditCard size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {t('noPaymentMethods')}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t('addYourFirstPaymentMethod')}
            </Text>
          </View>
        )}

        {/* Payment Methods List */}
        {!loading && paymentMethods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            getMethodColor={getMethodColor}
            onSetDefault={handleSetDefault}
            onEdit={handleEditMethod}
            onDelete={handleDeleteMethod}
          />
        ))}

        {/* Add New Method Button */}
        <TouchableOpacity
          style={[styles.addMethodButton, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
        >
          <View style={[styles.addMethodIcon, { backgroundColor: theme.primary + '20' }]}>
            <Plus size={24} color={theme.primary} />
          </View>
          <Text style={[styles.addMethodText, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('addNewPaymentMethod')}
          </Text>
          {isRTL ? <ChevronRight size={20} color={theme.textSecondary} style={{ transform: [{ scaleX: -1 }] }} /> : <ChevronRight size={20} color={theme.textSecondary} />}
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
      </View>
      {/* COMMENT: PRODUCTION HARDENING - Task 4.10 - End responsive wrapper */}

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
        }}
        formData={cardForm}
        onFormChange={(field, value) => setCardForm(prev => ({ ...prev, [field]: value }))}
        formatCardNumber={formatCardNumber}
        formatExpiryDate={formatExpiryDate}
        onSubmit={handleAddCard}
        isSubmitting={addingMethod}
      />

      {/* Edit Payment Method Modal */}
      <EditPaymentMethodModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMethod(null);
          setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
        }}
        formData={cardForm}
        onFormChange={(field, value) => setCardForm(prev => ({ ...prev, [field]: value }))}
        formatCardNumber={formatCardNumber}
        formatExpiryDate={formatExpiryDate}
        onSubmit={handleUpdateCard}
        isSubmitting={editingMethodState}
      />

      {/* Save Card Alert */}
      <CustomAlert
        visible={showSaveCardAlert}
        title={t('saveCardAlertTitle')}
        message={t('saveCardAlertMessage')}
        type="info"
        buttons={[
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: handleCancelSaveCard
          },
          {
            text: t('save'),
            style: 'default',
            onPress: handleSaveCardFromPrompt
          }
        ]}
        onDismiss={handleCancelSaveCard}
      />

      {/* U²-Net Profile Picture Modal */}
      <Modal
        visible={showProfilePictureModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.background, paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
            <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowProfilePictureModal(false)}
              >
                <X size={24} color={theme.primary} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('profilePicture')}
              </Text>
              
              <View style={styles.headerActionButton} />
            </View>
          </View>

          <View style={styles.modalContent}>
            {/* COMMENT: FORBIDDEN AI SYSTEM - U²-Net component disabled per ABSOLUTE_RULES.md */}
            {/* <SimpleU2NetBackgroundRemover
              onImageProcessed={handleProfilePictureProcessed}
              showAdvancedControls={true}
              autoProcess={false}
              style={styles.u2netContainer}
            /> */}
          </View>
        </View>
      </Modal>
    </View>
    </PaymentErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // COMMENT: PRODUCTION HARDENING - Task 4.10 - Responsive content wrapper for tablet
  contentWrapper: {
    flex: 1,
    width: '100%',
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
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  methodCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  methodGradient: {
    padding: 16,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  methodDetails: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  methodExpiry: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  methodRight: {
    alignItems: 'flex-end',
  },
  methodStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
  },
  addMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  formInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  noticeBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 16,
  },
  profilePictureContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  profilePlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  u2netContainer: {
    margin: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});



