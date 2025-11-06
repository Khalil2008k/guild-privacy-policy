/**
 * PaymentMethodCard Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from payment-methods.tsx (lines 583-670)
 * Purpose: Renders a single payment method card with actions
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CreditCard,
  CheckCircle,
  Clock,
  Star,
  Edit,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';

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

interface PaymentMethodCardProps {
  method: PaymentMethod;
  getMethodColor: (type: string, provider?: string) => string;
  onSetDefault: (methodId: string) => void;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (methodId: string) => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  getMethodColor,
  onSetDefault,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  return (
    <View style={[styles.methodCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
              <Text
                style={[
                  styles.statusText,
                  { color: method.isVerified ? theme.success : theme.warning, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {method.isVerified ? t('verified') : t('pending')}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.methodActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!method.isDefault && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => onSetDefault(method.id)}
            >
              <Star size={16} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                {t('setDefault')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => onEdit(method)}
          >
            <Edit size={16} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
              {t('edit')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
            onPress={() => onDelete(method.id)}
          >
            <Trash2 size={16} color={theme.error} />
            <Text style={[styles.actionButtonText, { color: theme.error }]}>
              {t('delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Signika Negative SC',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Signika Negative SC',
  },
  methodDetails: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
    marginBottom: 4,
  },
  methodExpiry: {
    fontSize: 12,
    fontFamily: 'Signika Negative SC',
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
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Signika Negative SC',
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Signika Negative SC',
  },
});







