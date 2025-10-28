/**
 * Payment Method Service
 * Handles payment method storage and retrieval from Firestore
 * Integrates with backend tokenization service
 */

import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { BackendAPI } from '../config/backend';
import { logger } from '../utils/logger';

export interface TokenizedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentMethodInput {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface PaymentMethodData {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  details: string;
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
  isVerified: boolean;
  provider?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
}

/**
 * Get user's payment methods from Firestore
 */
export const getPaymentMethods = async (): Promise<PaymentMethodData[]> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      logger.error('User not authenticated');
      return [];
    }

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();
    
    const methods = userData?.paymentMethods || [];
    
    // Transform backend TokenizedCard format to frontend PaymentMethodData format
    return methods.map((method: TokenizedCard) => ({
      id: method.id,
      type: 'card' as const,
      name: method.brand ? `${method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} Card` : 'Card',
      details: 'Personal Card',
      lastFour: method.last4,
      expiryDate: method.expMonth && method.expYear 
        ? `${String(method.expMonth).padStart(2, '0')}/${String(method.expYear).slice(-2)}`
        : undefined,
      isDefault: method.isDefault || false,
      isVerified: true, // Payment methods from backend are always verified after tokenization
      provider: method.brand,
      brand: method.brand,
      expMonth: method.expMonth,
      expYear: method.expYear
    }));
  } catch (error: any) {
    logger.error('Error getting payment methods:', error);
    return [];
  }
};

/**
 * Add a new payment method
 * Card is tokenized on backend before storage
 */
export const addPaymentMethod = async (
  methodInput: PaymentMethodInput
): Promise<PaymentMethodData> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Parse expiry date
    const [month, year] = methodInput.expiryDate.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt('20' + year, 10); // Assuming 2-digit year

    // Tokenize card via backend
    logger.info('Tokenizing card via backend...');
    const tokenizeResponse = await BackendAPI.post('/payments/tokenize', {
      cardNumber: methodInput.cardNumber.replace(/\s/g, ''),
      expMonth,
      expYear,
      cvc: methodInput.cvv
    });

    if (!tokenizeResponse.success || !tokenizeResponse.token) {
      throw new Error(tokenizeResponse.error || 'Failed to tokenize card');
    }

    const token = tokenizeResponse.token;

    // Save payment method via backend
    logger.info('Saving payment method...');
    const saveResponse = await BackendAPI.post('/payments/methods', {
      token,
      setAsDefault: false // Will be handled separately
    });

    if (!saveResponse.success) {
      throw new Error(saveResponse.error || 'Failed to save payment method');
    }

    const cardData = saveResponse.card;

    // Transform to frontend format
    const paymentMethod: PaymentMethodData = {
      id: cardData.id,
      type: 'card',
      name: cardData.brand ? `${cardData.brand.charAt(0).toUpperCase() + cardData.brand.slice(1)} Card` : 'Card',
      details: 'Personal Card',
      lastFour: cardData.last4,
      expiryDate: methodInput.expiryDate,
      isDefault: false,
      isVerified: true,
      provider: cardData.brand,
      brand: cardData.brand,
      expMonth: cardData.expMonth,
      expYear: cardData.expYear
    };

    logger.info('Payment method added successfully:', paymentMethod.id);
    return paymentMethod;
  } catch (error: any) {
    logger.error('Error adding payment method:', error);
    throw new Error(error.message || 'Failed to add payment method');
  }
};

/**
 * Set payment method as default
 */
export const setDefaultPaymentMethod = async (methodId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get current payment methods
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();
    const methods = userData?.paymentMethods || [];

    // Update all methods - set selected as default, others as non-default
    const updatedMethods = methods.map((method: TokenizedCard) => ({
      ...method,
      isDefault: method.id === methodId
    }));

    // Update Firestore
    await updateDoc(doc(db, 'users', currentUser.uid), {
      paymentMethods: updatedMethods,
      updatedAt: Timestamp.now()
    });

    logger.info('Default payment method updated:', methodId);
  } catch (error: any) {
    logger.error('Error setting default payment method:', error);
    throw new Error(error.message || 'Failed to set default payment method');
  }
};

/**
 * Delete payment method
 */
export const deletePaymentMethod = async (methodId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Delete from backend first
    logger.info('Deleting payment method from backend...');
    await BackendAPI.delete(`/payments/methods/${methodId}`);

    // Remove from Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();
    const methods = userData?.paymentMethods || [];
    const updatedMethods = methods.filter((method: TokenizedCard) => method.id !== methodId);

    await updateDoc(doc(db, 'users', currentUser.uid), {
      paymentMethods: updatedMethods,
      updatedAt: Timestamp.now()
    });

    logger.info('Payment method deleted:', methodId);
  } catch (error: any) {
    logger.error('Error deleting payment method:', error);
    throw new Error(error.message || 'Failed to delete payment method');
  }
};

/**
 * Get default payment method
 */
export const getDefaultPaymentMethod = async (): Promise<PaymentMethodData | null> => {
  try {
    const methods = await getPaymentMethods();
    return methods.find(m => m.isDefault) || null;
  } catch (error: any) {
    logger.error('Error getting default payment method:', error);
    return null;
  }
};

