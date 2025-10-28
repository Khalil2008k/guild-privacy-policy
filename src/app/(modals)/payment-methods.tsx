import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  ArrowRight, 
  CreditCard, 
  Plus, 
  X, 
  CheckCircle, 
  Clock, 
  Star, 
  Edit, 
  Trash2, 
  ChevronRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '../../components/CustomAlert';
// Note: Cards are stored locally on device only (not on GUILD servers)
// When using Fatora payment gateway, saved card info auto-fills their form
// Fatora is just a payment processor, not storing cards

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMethod, setAddingMethod] = useState(false);
  const [editingMethodState, setEditingMethodState] = useState(false);
  const [showSaveCardAlert, setShowSaveCardAlert] = useState(false);
  const [pendingCard, setPendingCard] = useState<PaymentMethod | null>(null);

  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  // Load payment methods on mount
  // Cards are stored locally on device via Fatora SDK
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      // Load cards from device local storage (AsyncStorage)
      const storedCards = await AsyncStorage.getItem('saved_payment_cards');
      if (storedCards) {
        const cards = JSON.parse(storedCards);
        setPaymentMethods(cards);
      } else {
        setPaymentMethods([]);
      }
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
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
      
      // Update cards in local storage
      const updatedCards = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }));
      
      await AsyncStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
      setPaymentMethods(updatedCards);
      
      Alert.alert(t('success'), t('defaultPaymentMethodUpdated'));
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
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
              
              // Delete card from local storage
              const updatedCards = paymentMethods.filter(method => method.id !== methodId);
              await AsyncStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
              
              setPaymentMethods(updatedCards);
              Alert.alert(t('success'), t('paymentMethodDeleted'));
            } catch (error: any) {
              console.error('Error deleting payment method:', error);
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

      // Save card to device local storage (AsyncStorage)
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
      const existingCards = await AsyncStorage.getItem('saved_payment_cards');
      const cards = existingCards ? JSON.parse(existingCards) : [];
      cards.push(newCard);
      
      // Save to device local storage
      await AsyncStorage.setItem('saved_payment_cards', JSON.stringify(cards));
      
      Alert.alert(
        t('addCardSuccess'), 
        t('cardSavedLocally')
      );
      
      setShowAddModal(false);
      setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      
      // Reload cards
      loadPaymentMethods();
    } catch (error: any) {
      console.error('Error adding payment method:', error);
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

      // Update card in local storage
      const updatedCards = paymentMethods.map(method => 
        method.id === editingMethod.id
          ? {
              ...method,
              expiryDate: cardForm.expiryDate,
              details: cardForm.cardholderName,
            }
          : method
      );
      
      await AsyncStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
      
      Alert.alert(t('success'), t('paymentMethodUpdated'));
      
      setShowEditModal(false);
      setEditingMethod(null);
      setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      
      // Reload cards
      loadPaymentMethods();
    } catch (error: any) {
      console.error('Error updating payment method:', error);
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
      // Get existing cards and add new one
      const existingCards = await AsyncStorage.getItem('saved_payment_cards');
      const cards = existingCards ? JSON.parse(existingCards) : [];
      cards.push(pendingCard);
      
      // Save to device local storage
      await AsyncStorage.setItem('saved_payment_cards', JSON.stringify(cards));
      
      Alert.alert(t('success'), t('cardSavedSuccessfully'));
      
      setShowSaveCardAlert(false);
      setPendingCard(null);
      
      // Reload cards
      loadPaymentMethods();
    } catch (error: any) {
      console.error('Error saving card:', error);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            {isRTL ? <ArrowRight size={24} color={theme.primary} /> : <ArrowLeft size={24} color={theme.primary} />}
          </TouchableOpacity>
          
          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <CreditCard size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('paymentMethods')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
          >
            <Plus size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          <View key={method.id} style={[styles.methodCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={[getMethodColor(method.type, method.provider) + '10', 'transparent']}
              style={styles.methodGradient}
            >
              <View style={[styles.methodHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.methodLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.methodIcon, { backgroundColor: getMethodColor(method.type, method.provider) + '20' }]}>
                    <CreditCard size={24} color={getMethodColor(method.type, method.provider)} />
                  </View>
                  
                  <View style={styles.methodInfo}>
                    <View style={[styles.methodTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.methodName, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {method.name}
                      </Text>
                      {method.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: theme.success }]}>
                          <Text style={[styles.defaultBadgeText, { color: theme.buttonText }]}>
                            {t('default')}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[styles.methodDetails, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {method.details}
                      {method.lastFour && ` •••• ${method.lastFour}`}
                    </Text>
                    
                    {method.expiryDate && (
                      <Text style={[styles.methodExpiry, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('expires')} {method.expiryDate}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.methodRight}>
                  <View style={[styles.methodStatus, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {method.isVerified ? <CheckCircle size={20} color={theme.success} /> : <Clock size={20} color={theme.warning} />}
                    <Text style={[
                      styles.statusText,
                      { color: method.isVerified ? theme.success : theme.warning, textAlign: isRTL ? 'right' : 'left' }
                    ]}>
                      {method.isVerified ? t('verified') : t('pending')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.methodActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {!method.isDefault && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                    onPress={() => handleSetDefault(method.id)}
                  >
                    <Star size={16} color={theme.primary} />
                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                      {t('setDefault')}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => handleEditMethod(method)}
                >
                  <Edit size={16} color={theme.textSecondary} />
                  <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
                    {t('edit')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
                  onPress={() => handleDeleteMethod(method.id)}
                >
                  <Trash2 size={16} color={theme.error} />
                  <Text style={[styles.actionButtonText, { color: theme.error }]}>
                    {t('delete')}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
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

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.background, paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
            <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color={theme.primary} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('addPaymentMethod')}
              </Text>
              
              <View style={styles.headerActionButton} />
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Privacy Notice */}
            <View style={[styles.noticeBox, { backgroundColor: theme.info + '15', borderColor: theme.info + '40' }]}>
              <Text style={[styles.noticeTitle, { color: theme.info, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('cardStorageNotice')}
              </Text>
              <Text style={[styles.noticeText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('cardStorageNoticeText')}
              </Text>
            </View>

            {/* Card Form */}
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('cardInformation')}
              </Text>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('cardNumber')}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { 
                      backgroundColor: theme.background, 
                      borderColor: theme.border, 
                      color: theme.textPrimary,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }]}
                    placeholder={t('cardNumberPlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    value={formatCardNumber(cardForm.cardNumber)}
                    onChangeText={(text) => setCardForm(prev => ({ ...prev, cardNumber: text.replace(/\s/g, '') }))}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={[styles.formRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('expiryDate')}
                    </Text>
                    <TextInput
                      style={[styles.formInput, { 
                        backgroundColor: theme.background, 
                        borderColor: theme.border, 
                        color: theme.textPrimary,
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr'
                      }]}
                      placeholder={t('expiryDatePlaceholder')}
                      placeholderTextColor={theme.textSecondary}
                      value={cardForm.expiryDate}
                      onChangeText={(text) => setCardForm(prev => ({ ...prev, expiryDate: formatExpiryDate(text) }))}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('cvv')}
                    </Text>
                    <TextInput
                      style={[styles.formInput, { 
                        backgroundColor: theme.background, 
                        borderColor: theme.border, 
                        color: theme.textPrimary,
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr'
                      }]}
                      placeholder={t('cvvPlaceholder')}
                      placeholderTextColor={theme.textSecondary}
                      value={cardForm.cvv}
                      onChangeText={(text) => setCardForm(prev => ({ ...prev, cvv: text }))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('cardholderName')}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { 
                      backgroundColor: theme.background, 
                      borderColor: theme.border, 
                      color: theme.textPrimary,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }]}
                    placeholder={t('cardholderNamePlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    value={cardForm.cardholderName}
                    onChangeText={(text) => setCardForm(prev => ({ ...prev, cardholderName: text }))}
                    autoCapitalize="words"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.addButton, 
                    { backgroundColor: theme.primary },
                    addingMethod && styles.addButtonDisabled
                  ]}
                  onPress={handleAddCard}
                  disabled={addingMethod}
                >
                  {addingMethod ? (
                    <ActivityIndicator color={theme.buttonText} />
                  ) : (
                    <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
                      {t('addCard')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Payment Method Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.background, paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
            <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingMethod(null);
                  setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
                }}
              >
                <X size={24} color={theme.primary} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('editPaymentMethod')}
              </Text>
              
              <View style={styles.headerActionButton} />
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Privacy Notice */}
            <View style={[styles.noticeBox, { backgroundColor: theme.info + '15', borderColor: theme.info + '40' }]}>
              <Text style={[styles.noticeTitle, { color: theme.info, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('editCardNotice')}
              </Text>
              <Text style={[styles.noticeText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('editCardNoticeText')}
              </Text>
            </View>

            {/* Card Form */}
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('cardInformation')}
              </Text>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('cardNumber')}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { 
                      backgroundColor: theme.background, 
                      borderColor: theme.border, 
                      color: theme.textSecondary,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }]}
                    value={cardForm.cardNumber}
                    editable={false}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('expiryDate')}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { 
                      backgroundColor: theme.background, 
                      borderColor: theme.border, 
                      color: theme.textPrimary,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }]}
                    placeholder={t('expiryDatePlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    value={cardForm.expiryDate}
                    onChangeText={(text) => setCardForm(prev => ({ ...prev, expiryDate: formatExpiryDate(text) }))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('cardholderName')}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { 
                      backgroundColor: theme.background, 
                      borderColor: theme.border, 
                      color: theme.textPrimary,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }]}
                    placeholder={t('cardholderNamePlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    value={cardForm.cardholderName}
                    onChangeText={(text) => setCardForm(prev => ({ ...prev, cardholderName: text }))}
                    autoCapitalize="words"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.addButton, 
                    { backgroundColor: theme.primary },
                    editingMethodState && styles.addButtonDisabled
                  ]}
                  onPress={handleUpdateCard}
                  disabled={editingMethodState}
                >
                  {editingMethodState ? (
                    <ActivityIndicator color={theme.buttonText} />
                  ) : (
                    <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
                      {t('updateCard')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
          </ScrollView>
        </View>
      </Modal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});



