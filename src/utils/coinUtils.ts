/**
 * Coin Utility Functions
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines 141-152)
 * Purpose: Utility functions for coin/budget calculations
 */

/**
 * Rounds amounts to proper coin denominations (QR values)
 * @param amount - Amount to round
 * @returns Rounded amount based on denomination rules
 */
export const roundToProperCoinValue = (amount: number): number => {
  // Round to proper coin denominations: 5, 10, 50, 100, 200, 500 QR
  if (amount <= 5) return 5;
  if (amount <= 10) return 10;
  if (amount <= 50) return Math.ceil(amount / 5) * 5; // Round to nearest 5
  if (amount <= 100) return Math.ceil(amount / 10) * 10; // Round to nearest 10
  if (amount <= 200) return Math.ceil(amount / 50) * 50; // Round to nearest 50
  if (amount <= 500) return Math.ceil(amount / 100) * 100; // Round to nearest 100
  if (amount <= 1000) return Math.ceil(amount / 200) * 200; // Round to nearest 200
  if (amount <= 5000) return Math.ceil(amount / 500) * 500; // Round to nearest 500
  return Math.ceil(amount / 1000) * 1000; // Round to nearest 1000
};




