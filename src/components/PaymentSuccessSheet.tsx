import React, { useEffect, useRef, useCallback, memo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'SignikaNegative_400Regular';

interface PaymentSuccessSheetProps {
  visible: boolean;
  onDismiss: () => void;
  transactionData?: {
    title: string;
    amount: string;
    date: string;
    from: string;
    cardNumber: string;
    type?: 'debit' | 'credit';
  };
  isSuccess?: boolean;
}

/**
 * Payment Success Sheet Component
 * COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized with React.memo and useCallback
 */
export const PaymentSuccessSheet = memo<PaymentSuccessSheetProps>(({
  visible,
  onDismiss,
  transactionData,
  isSuccess = true,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { isRTL } = useI18n();
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  const iconColor = isSuccess ? theme.primary : theme.error;

  // COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized handler with useCallback
  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // COMMENT: PRODUCTION HARDENING - Task 2.9 - Optimized animation with useCallback
  const animateShow = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim]);

  const animateHide = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim, height]);

  useEffect(() => {
    if (visible) {
      animateShow();
    } else {
      animateHide();
    }
  }, [visible, animateShow, animateHide]);

  const defaultData = {
    title: isRTL ? 'تحويل إلى بطاقة **** 2345' : 'Transfer to card **** 2345',
    amount: '-2,500.00',
    date: isRTL ? '11 أبريل، 20:20' : '11th of April, 20:20',
    from: isRTL ? 'محفظة GUILD' : 'GUILD Wallet',
    cardNumber: '**** 6234 2345',
    type: 'debit' as const,
  };

  const data = transactionData || defaultData;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleDismiss}
        />

        <Animated.View 
          style={[
            styles.sheetContainer, 
            { 
              backgroundColor: theme.background,
              borderTopColor: theme.border,
              borderTopWidth: 1,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Success/Error Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, styles.iconCircleOuter, { backgroundColor: `${iconColor}25` }]}>
              <View style={[styles.iconCircle, styles.iconCircleInner, { backgroundColor: iconColor }]}>
                {isSuccess ? (
                  <Check size={52} color="#000000" strokeWidth={3} />
                ) : (
                  <X size={52} color="#000000" strokeWidth={3} />
                )}
              </View>
            </View>
          </View>

          {/* Transaction Title */}
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {data.title}
          </Text>

          {/* Date */}
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {data.date}
          </Text>

          {/* Amount */}
          <Text style={[styles.amount, { color: theme.textPrimary }]}>
            {data.amount.startsWith('-') ? `-$${data.amount.replace('-', '')}` : `+$${data.amount}`}
          </Text>

          {/* Transaction Details */}
          <View style={[styles.detailsContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'من' : 'From'}
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {data.from}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'بواسطة رقم البطاقة' : 'By Card Number'}
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {data.cardNumber}
              </Text>
            </View>
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.primary }]}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>
              {isRTL ? 'تم' : 'Done'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
});

PaymentSuccessSheet.displayName = 'PaymentSuccessSheet';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    minHeight: height * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 24,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  iconCircleOuter: {
    width: 140,
    height: 140,
  },
  iconCircleInner: {
    width: 100,
    height: 100,
    position: 'absolute',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 20,
  },
  amount: {
    fontSize: 42,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -1,
  },
  detailsContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  doneButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
});
