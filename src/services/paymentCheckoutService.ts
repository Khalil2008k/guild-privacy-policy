/**
 * Payment Checkout Service
 * Handles showing saved cards and prompting to save new cards during checkout
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface SavedCard {
  id: string;
  type: 'card';
  name: string;
  details: string;
  lastFour: string;
  expiryDate: string;
  isDefault: boolean;
  isVerified: boolean;
  provider?: string;
}

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

/**
 * Get all saved cards from device local storage
 */
export const getSavedCards = async (): Promise<SavedCard[]> => {
  try {
    const storedCards = await AsyncStorage.getItem('saved_payment_cards');
    if (storedCards) {
      return JSON.parse(storedCards);
    }
    return [];
  } catch (error) {
    console.error('Error loading saved cards:', error);
    return [];
  }
};

/**
 * Save a new card to device local storage
 */
export const saveCardToDevice = async (cardDetails: CardDetails): Promise<void> => {
  try {
    const existingCards = await AsyncStorage.getItem('saved_payment_cards');
    const cards = existingCards ? JSON.parse(existingCards) : [];
    
    const newCard: SavedCard = {
      id: Date.now().toString(),
      type: 'card',
      name: cardDetails.cardNumber.startsWith('4') ? 'Visa Card' : 'Mastercard',
      details: 'Personal Card',
      lastFour: cardDetails.cardNumber.slice(-4),
      expiryDate: cardDetails.expiryDate,
      isDefault: cards.length === 0,
      isVerified: true,
      provider: cardDetails.cardNumber.startsWith('4') ? 'visa' : 'mastercard'
    };
    
    cards.push(newCard);
    await AsyncStorage.setItem('saved_payment_cards', JSON.stringify(cards));
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
};

/**
 * Prompt user to save card after successful payment with new card
 * Call this after user completes payment with a card that's not saved
 */
export const promptSaveCardAfterPayment = (
  cardDetails: CardDetails,
  onSave: () => void,
  onCancel: () => void
): void => {
  Alert.alert(
    'Save Card?',
    'Would you like to save this card for faster checkout next time? Your card will be stored securely on your device only.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Save',
        style: 'default',
        onPress: async () => {
          try {
            await saveCardToDevice(cardDetails);
            onSave();
          } catch (error) {
            console.error('Error saving card:', error);
            Alert.alert('Error', 'Failed to save card. Please try again.');
          }
        }
      }
    ]
  );
};

/**
 * Check if a card is already saved
 */
export const isCardSaved = async (cardNumber: string): Promise<boolean> => {
  try {
    const savedCards = await getSavedCards();
    const lastFour = cardNumber.slice(-4);
    return savedCards.some(card => card.lastFour === lastFour);
  } catch (error) {
    console.error('Error checking if card is saved:', error);
    return false;
  }
};

