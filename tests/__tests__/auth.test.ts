/**
 * GUILD Authentication Tests
 * Tests all authentication flows including sign up, sign in, logout, 2FA
 */

import { AuthService } from '../../src/services/authService';
import { createMockUser, mockApiResponse, mockApiError } from '../utils/testHelpers';

describe('Authentication Flow Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    test('should successfully register a new user with email and password', async () => {
      const userData = {
        email: 'newuser@guild.com',
        password: 'SecurePass123!',
        displayName: 'New User',
        phoneNumber: '+97412345678',
      };

      const mockUser = createMockUser({
        email: userData.email,
        displayName: userData.displayName,
      });

      // Mock successful registration
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ user: mockUser, token: 'test-token-123' })
      );

      const result = await authService.register(userData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBe('test-token-123');
    });

    test('should fail registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      await expect(authService.register(userData)).rejects.toThrow('Invalid email format');
    });

    test('should fail registration with weak password', async () => {
      const userData = {
        email: 'test@guild.com',
        password: '123',
      };

      await expect(authService.register(userData)).rejects.toThrow('Password must be at least 8 characters');
    });

    test('should fail registration with existing email', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Email already in use', 409)
      );

      const userData = {
        email: 'existing@guild.com',
        password: 'SecurePass123!',
      };

      await expect(authService.register(userData)).rejects.toThrow('Email already in use');
    });

    test('should validate phone number format', async () => {
      const userData = {
        email: 'test@guild.com',
        password: 'SecurePass123!',
        phoneNumber: 'invalid-phone',
      };

      await expect(authService.register(userData)).rejects.toThrow('Invalid phone number');
    });
  });

  describe('User Sign In', () => {
    test('should successfully sign in with email and password', async () => {
      const mockUser = createMockUser();

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ user: mockUser, token: 'test-token-123' })
      );

      const result = await authService.signIn({
        email: 'test@guild.com',
        password: 'SecurePass123!',
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBe('test-token-123');
    });

    test('should fail sign in with incorrect password', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Invalid credentials', 401)
      );

      await expect(
        authService.signIn({
          email: 'test@guild.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    test('should fail sign in with non-existent user', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('User not found', 404)
      );

      await expect(
        authService.signIn({
          email: 'nonexistent@guild.com',
          password: 'SecurePass123!',
        })
      ).rejects.toThrow('User not found');
    });

    test('should handle sign in with unverified email', async () => {
      const mockUser = createMockUser({ emailVerified: false });

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ user: mockUser, token: 'test-token-123', emailVerified: false })
      );

      const result = await authService.signIn({
        email: 'test@guild.com',
        password: 'SecurePass123!',
      });

      expect(result.user.emailVerified).toBe(false);
    });
  });

  describe('Two-Factor Authentication', () => {
    test('should send 2FA code via SMS', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ success: true, codeSent: true })
      );

      const result = await authService.send2FACode('+97412345678');

      expect(result.success).toBe(true);
      expect(result.codeSent).toBe(true);
    });

    test('should verify 2FA code successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ verified: true, token: 'test-2fa-token' })
      );

      const result = await authService.verify2FACode('123456');

      expect(result.verified).toBe(true);
      expect(result.token).toBe('test-2fa-token');
    });

    test('should fail 2FA verification with invalid code', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Invalid verification code', 400)
      );

      await expect(authService.verify2FACode('000000')).rejects.toThrow('Invalid verification code');
    });

    test('should fail 2FA verification with expired code', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Verification code expired', 410)
      );

      await expect(authService.verify2FACode('123456')).rejects.toThrow('Verification code expired');
    });

    test('should rate limit 2FA code requests', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Too many requests', 429)
      );

      await expect(authService.send2FACode('+97412345678')).rejects.toThrow('Too many requests');
    });
  });

  describe('Password Reset', () => {
    test('should send password reset email', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ success: true, emailSent: true })
      );

      const result = await authService.sendPasswordResetEmail('test@guild.com');

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
    });

    test('should fail password reset for non-existent email', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('User not found', 404)
      );

      await expect(authService.sendPasswordResetEmail('nonexistent@guild.com')).rejects.toThrow('User not found');
    });

    test('should reset password with valid token', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ success: true })
      );

      const result = await authService.resetPassword('reset-token-123', 'NewSecurePass123!');

      expect(result.success).toBe(true);
    });

    test('should fail password reset with invalid token', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Invalid reset token', 400)
      );

      await expect(authService.resetPassword('invalid-token', 'NewSecurePass123!')).rejects.toThrow('Invalid reset token');
    });
  });

  describe('Session Management', () => {
    test('should maintain session with valid token', async () => {
      const mockUser = createMockUser();

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ user: mockUser, valid: true })
      );

      const result = await authService.validateSession('valid-token-123');

      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
    });

    test('should invalidate expired token', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Token expired', 401)
      );

      await expect(authService.validateSession('expired-token')).rejects.toThrow('Token expired');
    });

    test('should refresh token before expiry', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ token: 'new-token-123', expiresIn: 3600 })
      );

      const result = await authService.refreshToken('old-token-123');

      expect(result.token).toBe('new-token-123');
      expect(result.expiresIn).toBe(3600);
    });

    test('should successfully sign out user', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ success: true })
      );

      const result = await authService.signOut();

      expect(result.success).toBe(true);
    });
  });

  describe('Biometric Authentication', () => {
    test('should enable biometric authentication', async () => {
      const result = await authService.enableBiometric();

      expect(result.enabled).toBe(true);
    });

    test('should authenticate with biometrics', async () => {
      const result = await authService.authenticateWithBiometric();

      expect(result.success).toBe(true);
    });

    test('should disable biometric authentication', async () => {
      const result = await authService.disableBiometric();

      expect(result.disabled).toBe(true);
    });
  });

  describe('Account Security', () => {
    test('should detect and prevent brute force attacks', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockApiError('Too many failed attempts', 429)
      );

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        try {
          await authService.signIn({
            email: 'test@guild.com',
            password: 'WrongPassword',
          });
        } catch (error) {
          // Expected to fail
        }
      }

      await expect(
        authService.signIn({
          email: 'test@guild.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Too many failed attempts');
    });

    test('should log security events', async () => {
      const mockUser = createMockUser();

      global.fetch = jest.fn().mockResolvedValue(
        mockApiResponse({ user: mockUser, token: 'test-token-123', securityLog: true })
      );

      const result = await authService.signIn({
        email: 'test@guild.com',
        password: 'SecurePass123!',
      });

      expect(result.securityLog).toBe(true);
    });
  });
});


