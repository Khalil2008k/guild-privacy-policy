/**
 * COMMENT: PRODUCTION HARDENING - Fake Payment Display Component DISABLED per Task 2.1
 * This component is deprecated and should not be used in production
 * Use RealPaymentContext instead for all payment operations
 * 
 * REMOVED: All imports and functionality commented out
 * MIGRATION: Replace FakePaymentDisplay with RealPaymentContext-based components
 */

// COMMENT: DISABLED - Fake Payment Display Component per Production Hardening Task 2.1
import React from 'react';
// All other imports commented out as component is disabled
/*
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFakePayment } from '../contexts/FakePaymentContext';
import { useTheme } from '../contexts/ThemeContext';
*/

// COMMENT: DISABLED - Component implementation per Production Hardening Task 2.1
/*
interface FakePaymentDisplayProps {
  onPress?: () => void;
  showIcon?: boolean;
  compact?: boolean;
}

export const FakePaymentDisplay: React.FC<FakePaymentDisplayProps> = ({ 
  onPress, 
  showIcon = true, 
  compact = false 
}) => {
  const { wallet, isLoading } = useFakePayment();
  const { theme } = useTheme();

  if (isLoading || !wallet) {
    return (
      <View style={[styles.container, compact && styles.compact]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  const balanceDisplay = compact 
    ? `${wallet.balance} 🪙`
    : `${wallet.balance.toLocaleString()} Guild Coins`;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        compact && styles.compact,
        { backgroundColor: theme.primary + '15' }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showIcon && (
        <Ionicons 
          name="diamond-outline" 
          size={compact ? 16 : 18} 
          color={theme.primary} 
          style={styles.icon}
        />
      )}
      <Text style={[styles.balanceText, { color: theme.primary }]}>
        {balanceDisplay}
      </Text>
    </TouchableOpacity>
  );
};
*/

// COMMENT: Placeholder export to prevent import errors - Component disabled per Task 2.1
export const FakePaymentDisplay: React.FC<any> = () => {
  // COMMENT: Component disabled - Use RealPaymentContext instead
  return null;
};

// COMMENT: DISABLED - Styles per Production Hardening Task 2.1
/*
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  icon: {
    marginRight: 4,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
*/

export default FakePaymentDisplay;


