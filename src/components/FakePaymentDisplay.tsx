/**
 * Fake Payment Display Component
 * Shows user's Guild Coins balance in the header
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFakePayment } from '../contexts/FakePaymentContext';
import { useTheme } from '../contexts/ThemeContext';

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

export default FakePaymentDisplay;


