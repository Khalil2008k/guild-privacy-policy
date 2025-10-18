/**
 * Auth Service
 * Handles authentication flows: registration, login, logout, 2FA
 */

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  photoURL?: string | null;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return emailRegex.test(email);
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<{ enabled: boolean }> {
    try {
      // Real biometric authentication implementation
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });
      
      if (result.success) {
        // Store biometric preference
        await AsyncStorage.setItem('biometric_enabled', 'true');
        return { enabled: true };
      }
      
      return { enabled: false };
    } catch (error) {
      console.error('Error enabling biometric authentication:', error);
      throw new Error('Failed to enable biometric authentication');
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometric(): Promise<{ success: boolean }> {
    try {
      // Check if biometric is enabled
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (!biometricEnabled) {
        return { success: false };
      }
      
      // Real biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });
      
      return { success: result.success };
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      throw new Error('Failed to authenticate with biometrics');
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<{ disabled: boolean }> {
    try {
      // Remove biometric preference
      await AsyncStorage.removeItem('biometric_enabled');
      return { disabled: true };
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
      throw new Error('Failed to disable biometric authentication');
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    // Basic phone validation - should start with + and have 10-15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    // Validate email
    if (!this.validateEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    if (!this.validatePassword(userData.password)) {
      throw new Error('Password must be at least 8 characters');
    }

    // Validate phone number if provided
    if (userData.phoneNumber && !this.validatePhoneNumber(userData.phoneNumber)) {
      throw new Error('Invalid phone number');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('🔐 Registration error:', error);
      throw new Error(error.message || 'Registration failed. Please try again');
    }

    return response.json();
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginData): Promise<AuthResult> {
    // Validate email
    if (!this.validateEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('🔐 Sign-in error:', error);
      throw new Error(error.message || 'Sign in failed. Please check your credentials');
    }

    return response.json();
  }

  /**
   * Sign out current user
   */
  async signOut(token?: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Sign out failed');
    }

    return { success: true };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; emailSent: boolean }> {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/reset-password-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send password reset email');
    }

    return response.json();
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    if (!this.validatePassword(newPassword)) {
      throw new Error('Password must be at least 8 characters');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<void> {
    if (!this.validatePassword(newPassword)) {
      throw new Error('New password must be at least 6 characters');
    }

    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Email verification failed');
    }
  }

  /**
   * Send verification code for 2FA
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to send verification code');
    }
  }

  /**
   * Verify phone number with code
   */
  async verifyPhoneNumber(phoneNumber: string, code: string): Promise<AuthResult> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/verify-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, code }),
    });

    if (!response.ok) {
      throw new Error('Phone verification failed');
    }

    return response.json();
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(token: string, phoneNumber: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/enable-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(token: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/disable-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  }

  /**
   * Update user profile
   */
  async updateProfile(token: string, updates: Partial<User>): Promise<User> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return response.json();
  }

  /**
   * Delete user account
   */
  async deleteAccount(token: string, password: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete account');
    }
  }

  /**
   * Send 2FA code
   */
  async send2FACode(phoneNumber: string): Promise<{ success: boolean; codeSent: boolean }> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/2fa/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send 2FA code');
    }

    return response.json();
  }

  /**
   * Verify 2FA code
   */
  async verify2FACode(code: string): Promise<{ verified: boolean; token: string }> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify 2FA code');
    }

    return response.json();
  }

  /**
   * Validate session
   */
  async validateSession(token: string): Promise<{ valid: boolean; user?: User }> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/validate-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid session');
    }

    return response.json();
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(oldToken: string): Promise<{ token: string; expiresIn: number }> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oldToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to refresh token');
    }

    return response.json();
  }
}

export default new AuthService();

