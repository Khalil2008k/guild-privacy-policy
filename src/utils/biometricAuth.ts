import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface BiometricData {
  enabled: boolean;
  type: string;
  setupDate: string;
  deviceId: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export class BiometricAuthService {
  /**
   * Check if biometric authentication is available and configured
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      console.log('🔒 Biometric availability check:', { hasHardware, isEnrolled });
      
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('🔒 Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Check if biometric is enabled in app settings (for secure operations)
   */
  static async isEnabledInSettings(): Promise<boolean> {
    try {
      const isEnabled = await AsyncStorage.getItem('biometricEnabled');
      return isEnabled === 'true';
    } catch (error) {
      console.error('🔒 Error checking biometric settings:', error);
      return false;
    }
  }

  /**
   * Get the configured biometric type
   */
  static async getBiometricType(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('biometricType');
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return null;
    }
  }

  /**
   * Get full biometric data
   */
  static async getBiometricData(): Promise<BiometricData | null> {
    try {
      const dataString = await AsyncStorage.getItem('biometricData');
      return dataString ? JSON.parse(dataString) : null;
    } catch (error) {
      console.error('Error getting biometric data:', error);
      return null;
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(promptMessage: string = 'Authenticate with biometrics'): Promise<BiometricAuthResult> {
    try {
      // Check if device has biometric capability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return {
          success: false,
          error: 'biometric_not_available'
        };
      }

      // Get biometric type for better UX
      const biometricType = await this.getBiometricType();

      // Configure authentication options
      const authOptions = {
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: Platform.OS === 'ios' ? 'Use Passcode' : 'Use Password',
        disableDeviceFallback: false,
        requireConfirmation: true,
      };

      console.log('🔒 Starting biometric authentication...');
      const result = await LocalAuthentication.authenticateAsync(authOptions);

      console.log('🔒 Biometric authentication result:', result);

      if (result.success) {
        console.log('✅ Biometric authentication successful!');
        return {
          success: true,
          biometricType: biometricType || 'unknown'
        };
      } else {
        console.log('❌ Biometric authentication failed:', result.error);
        return {
          success: false,
          error: result.error || 'authentication_failed'
        };
      }
    } catch (error) {
      console.error('🔒 Biometric authentication error:', error);
      return {
        success: false,
        error: 'authentication_error'
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disable(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem('biometricEnabled');
      await AsyncStorage.removeItem('biometricType');
      await AsyncStorage.removeItem('biometricData');
      return true;
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
      return false;
    }
  }

  /**
   * Check device capabilities
   */
  static async getDeviceCapabilities(): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        hasHardware,
        isEnrolled,
        supportedTypes
      };
    } catch (error) {
      console.error('Error getting device capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: []
      };
    }
  }

  /**
   * Get human-readable biometric type name
   */
  static getBiometricTypeName(supportedTypes: LocalAuthentication.AuthenticationType[]): string {
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    } else {
      return 'biometric';
    }
  }

  /**
   * Quick authentication for app unlock
   */
  static async quickAuth(): Promise<boolean> {
    const result = await this.authenticate('Unlock GUILD');
    return result.success;
  }

  /**
   * Authentication for sensitive operations
   */
  static async sensitiveAuth(operation: string): Promise<boolean> {
    const result = await this.authenticate(`Authenticate to ${operation}`);
    return result.success;
  }
}

export default BiometricAuthService;
