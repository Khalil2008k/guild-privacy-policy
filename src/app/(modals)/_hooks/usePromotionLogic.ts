/**
 * usePromotionLogic Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 293-372)
 * Purpose: Manages promotion cost calculation and validation
 */

import { useCallback } from 'react';
import { router } from 'expo-router';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { useI18n } from '../../../contexts/I18nProvider';

interface UsePromotionLogicReturn {
  calculatePromotionCost: () => number;
  calculateWalletValue: (walletBalance: any) => number;
  validatePromotionBalance: (
    promotionCost: number,
    walletValue: number
  ) => { valid: boolean; message: string };
  handlePromotionToggle: (
    type: 'featured' | 'boost',
    currentValue: boolean,
    promotionCost: number,
    walletValue: number,
    onToggle: (type: 'featured' | 'boost', value: boolean) => void
  ) => void;
}

export const usePromotionLogic = (): UsePromotionLogicReturn => {
  const { t, isRTL } = useI18n();

  // Helper function to calculate total promotion cost
  // DISABLED: Promotions will be managed by admin via admin portal
  const calculatePromotionCost = useCallback((featured: boolean, boost: boolean): number => {
    return 0; // Promotions coming soon - admin will set costs
    // let total = 0;
    // if (featured) total += 50;
    // if (boost) total += 100;
    // return total;
  }, []);

  // Helper function to calculate total wallet value
  const calculateWalletValue = useCallback((walletBalance: any): number => {
    if (!walletBalance?.balances) return 0;
    
    const coinValues: { [key: string]: number } = {
      GBC: 5, GSC: 10, GGC: 50, GPC: 100, GDC: 200, GRC: 500
    };
    
    return Object.entries(walletBalance.balances).reduce((sum, [symbol, quantity]: [string, any]) => {
      return sum + (quantity * (coinValues[symbol] || 0));
    }, 0);
  }, []);

  // Helper function to validate promotion balance
  const validatePromotionBalance = useCallback((
    promotionCost: number,
    walletValue: number
  ): { valid: boolean; message: string } => {
    if (promotionCost === 0) {
      return { valid: true, message: '' };
    }
    
    if (walletValue < promotionCost) {
      return {
        valid: false,
        message: t('insufficientBalanceMessage', { required: promotionCost, current: walletValue })
      };
    }
    
    return { valid: true, message: '' };
  }, [t]);

  // Helper function to handle promotion toggle with balance check
  const handlePromotionToggle = useCallback((
    type: 'featured' | 'boost',
    currentValue: boolean,
    promotionCost: number,
    walletValue: number,
    onToggle: (type: 'featured' | 'boost', value: boolean) => void
  ) => {
    // If turning OFF, allow it
    if (currentValue) {
      onToggle(type, false);
      return;
    }

    // If turning ON, check balance first
    const newCost = promotionCost + (type === 'featured' ? 50 : 100);

    if (walletValue < newCost) {
      CustomAlertService.showError(
        t('insufficientBalance'),
        t('insufficientBalanceMessage', { required: newCost, current: walletValue }),
        [
          {
            text: t('cancel'),
            style: 'cancel',
          },
          {
            text: t('buyCoins'),
            onPress: () => router.push('/(modals)/coin-store'),
          },
        ]
      );
      return;
    }

    // Balance is sufficient, allow toggle
    onToggle(type, true);
  }, [t, promotionCost, walletValue, onToggle]);

  return {
    calculatePromotionCost,
    calculateWalletValue,
    validatePromotionBalance,
    handlePromotionToggle,
  };
};

