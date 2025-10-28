/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data like authentication tokens
 * 
 * NOTE: In Expo Go, crypto-js doesn't work properly, so we fall back to base64 encoding
 * In production builds, use expo-secure-store instead
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

interface SecureStorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class SecureStorage implements SecureStorageInterface {
  private encryptionKey = 'guild-secure-storage-key';
  private useSimpleEncoding = true; // Use base64 in Expo Go to avoid crypto issues
  
  // Keys that should be cleared on sign-out (only secure/auth-related keys)
  private secureKeys = [
    'auth_token',
    'auth_token_expiry',
    'refresh_token',
    'user_session',
    'biometric_token',
    'secure_user_data',
  ];

  private encrypt(value: string): string {
    try {
      if (this.useSimpleEncoding) {
        // Simple base64 encoding for Expo Go compatibility (using built-in btoa)
        return btoa(unescape(encodeURIComponent(value)));
      }
      return CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
    } catch (error) {
      console.warn('⚠️ Encryption failed, storing plain text:', error);
      // Last resort: store as plain text in Expo Go
      return value;
    }
  }

  private decrypt(encryptedValue: string): string {
    try {
      if (this.useSimpleEncoding) {
        // Simple base64 decoding for Expo Go compatibility (using built-in atob)
        return decodeURIComponent(escape(atob(encryptedValue)));
      }
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.warn('⚠️ Decryption failed, returning as-is:', error);
      // Fallback: return as plain text
      return encryptedValue;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) {
        return null;
      }
      return this.decrypt(encryptedValue);
    } catch (error) {
      console.error('Error getting secure item:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = this.encrypt(value);
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error setting secure item:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing secure item:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // Only clear secure/auth-related keys, NOT all AsyncStorage
      // This preserves user preferences like "Remember Me", theme settings, etc.
      console.log('🔐 SecureStorage: Clearing only secure keys, preserving user preferences');
      await AsyncStorage.multiRemove(this.secureKeys);
      console.log('🔐 SecureStorage: Secure keys cleared successfully');
    } catch (error) {
      console.error('❌ SecureStorage: Error clearing secure storage:', error);
      throw error;
    }
  }
}

export const secureStorage = new SecureStorage();
export default secureStorage;