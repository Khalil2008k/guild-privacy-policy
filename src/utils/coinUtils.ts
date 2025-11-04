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
 * 
 * Rules:
 * - Minimum: 100 QR
 * - Coins start at 5 QR increments: 5, 10, 15, 20, 25, 30, ... up to 500
 * - Avoid numbers like 111, 123, 126, 133 (use increments of 5)
 * - For amounts >= 100: round to nearest 5 (100, 105, 110, 115, 120, 125, 130, 135, etc.)
 */
export const roundToProperCoinValue = (amount: number): number => {
  // Ensure minimum 100 QR
  if (amount < 100) {
    return 100;
  }

  // For amounts >= 100, round to nearest 5 to match coin increments
  // This ensures we get: 100, 105, 110, 115, 120, 125, 130, 135, 140, etc.
  // And avoids: 111, 123, 126, 133, etc.
  if (amount >= 100 && amount <= 500) {
    return Math.ceil(amount / 5) * 5;
  }

  // For amounts > 500, round to nearest 50
  if (amount > 500 && amount <= 1000) {
    return Math.ceil(amount / 50) * 50;
  }

  // For amounts > 1000, round to nearest 100
  if (amount > 1000 && amount <= 5000) {
    return Math.ceil(amount / 100) * 100;
  }

  // For amounts > 5000, round to nearest 500
  return Math.ceil(amount / 500) * 500;
};




