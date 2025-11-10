/**
 * useWalletBalance Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 102-150)
 * Purpose: Manages wallet balance loading and state
 */

import { useState, useEffect, useCallback } from 'react';
import { CoinWalletAPIClient } from '../../../services/CoinWalletAPIClient';
import { logger } from '../../../utils/logger';
import { useI18n } from '../../../contexts/I18nProvider';
import { CustomAlertService } from '../../../services/CustomAlertService';

interface UseWalletBalanceReturn {
  walletBalance: any;
  balanceLoading: boolean;
  balanceError: string | null;
  loadBalance: () => Promise<void>;
  calculateWalletValue: () => number;
}

export const useWalletBalance = (): UseWalletBalanceReturn => {
  const { isRTL } = useI18n();
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Load wallet balance function
  const loadBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      setBalanceError(null);
      const balance = await CoinWalletAPIClient.getBalance();
      setWalletBalance(balance);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading wallet balance:', error);
      const errorMessage = isRTL 
        ? 'فشل تحميل رصيد المحفظة'
        : 'Failed to load wallet balance';
      setBalanceError(errorMessage);
    } finally {
      setBalanceLoading(false);
    }
  }, [isRTL]);

  // Helper function to calculate total wallet value
  const calculateWalletValue = useCallback((): number => {
    if (!walletBalance?.balances) return 0;
    
    const coinValues: { [key: string]: number } = {
      GBC: 5, GSC: 10, GGC: 50, GPC: 100, GDC: 200, GRC: 500
    };
    
    return Object.entries(walletBalance.balances).reduce((sum, [symbol, quantity]: [string, any]) => {
      return sum + (quantity * (coinValues[symbol] || 0));
    }, 0);
  }, [walletBalance]);

  // Load balance on mount
  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  return {
    walletBalance,
    balanceLoading,
    balanceError,
    loadBalance,
    calculateWalletValue,
  };
};









