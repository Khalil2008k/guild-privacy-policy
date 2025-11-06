/**
 * Card Manager Component
 * Independent component for managing payment cards
 * COMMENT: PRODUCTION HARDENING - Task 2.8 - CardManager operates independently
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CreditCard, Star, Edit, Trash2, CheckCircle, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { secureStorage } from '../services/secureStorage';
import { logger } from '../utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

export interface PaymentMethod {
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

interface CardManagerProps {
  onEdit?: (method: PaymentMethod) => void;
  onDelete?: (methodId: string) => void;
  onSetDefault?: (methodId: string) => void;
  onRefresh?: () => void;
}

/**
 * CardManager Component
 * Manages payment cards independently
 */
const CardManager = memo<CardManagerProps>(({
  onEdit,
  onDelete,
  onSetDefault,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent data loading
  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const storedCards = await secureStorage.getItem('saved_payment_cards');
      if (storedCards) {
        const cards = JSON.parse(storedCards);
        setPaymentMethods(cards);
      } else {
        setPaymentMethods([]);
      }
    } catch (error: any) {
      logger.error('Error loading payment methods:', error);
      Alert.alert(t('error'), error.message || t('failedToLoadPaymentMethods'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  // Refresh when onRefresh prop changes
  useEffect(() => {
    if (onRefresh) {
      loadPaymentMethods();
    }
  }, [onRefresh, loadPaymentMethods]);

  const getMethodColor = useCallback((type: string, provider?: string): string => {
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
  }, [theme]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent default setting
  const handleSetDefault = useCallback(async (methodId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const updatedCards = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }));
      
      await secureStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
      setPaymentMethods(updatedCards);
      
      // Call onSetDefault callback if provided
      if (onSetDefault) {
        onSetDefault(methodId);
      }
      
      Alert.alert(t('success'), t('defaultPaymentMethodUpdated'));
    } catch (error: any) {
      logger.error('Error setting default payment method:', error);
      Alert.alert(t('error'), error.message || t('failedToUpdateDefault'));
    }
  }, [paymentMethods, onSetDefault, t]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent deletion
  const handleDelete = useCallback((methodId: string) => {
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
              
              const updatedCards = paymentMethods.filter(method => method.id !== methodId);
              await secureStorage.setItem('saved_payment_cards', JSON.stringify(updatedCards));
              
              setPaymentMethods(updatedCards);
              
              // Call onDelete callback if provided
              if (onDelete) {
                onDelete(methodId);
              }
              
              Alert.alert(t('success'), t('paymentMethodDeleted'));
            } catch (error: any) {
              logger.error('Error deleting payment method:', error);
              Alert.alert(t('error'), error.message || t('failedToDeletePaymentMethod'));
            }
          }
        }
      ]
    );
  }, [paymentMethods, onDelete, t]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent editing
  const handleEdit = useCallback((method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onEdit) {
      onEdit(method);
    }
  }, [onEdit]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {t('loadingPaymentMethods')}
        </Text>
      </View>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <CreditCard size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {t('noPaymentMethods')}
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {t('addYourFirstPaymentMethod')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {paymentMethods.map((method) => (
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
                onPress={() => handleEdit(method)}
              >
                <Edit size={16} color={theme.textSecondary} />
                <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
                  {t('edit')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
                onPress={() => handleDelete(method.id)}
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
    </View>
  );
});

CardManager.displayName = 'CardManager';

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default CardManager;







