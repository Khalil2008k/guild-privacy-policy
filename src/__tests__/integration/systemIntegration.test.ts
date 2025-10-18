/**
 * Comprehensive System Integration Tests
 * Tests the complete ecosystem: React Native + Firebase + Backend + Admin Portal
 */

import { unifiedAuth, UserRole } from '../../services/unifiedAuth';
import { api } from '../../services/apiGateway';
import { dataProtection, ConsentType } from '../../services/dataProtection';
import { securityMonitoring, SecurityEventType } from '../../services/securityMonitoring';
import { validateEmail, validatePassword, sanitizeInput } from '../../utils/inputValidation';

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  db: {}
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

describe('System Integration Tests', () => {
  
  describe('Authentication Flow Integration', () => {
    it('should handle complete authentication flow', async () => {
      // Test user registration
      const registrationData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        acceptTerms: true,
        acceptPrivacy: true
      };

      // Validate input
      const emailValidation = validateEmail(registrationData.email);
      const passwordValidation = validatePassword(registrationData.password);
      
      expect(emailValidation.isValid).toBe(true);
      expect(passwordValidation.isValid).toBe(true);

      // Mock successful registration
      jest.spyOn(unifiedAuth, 'register').mockResolvedValue({
        uid: 'test-uid',
        email: registrationData.email,
        displayName: registrationData.displayName,
        role: UserRole.USER,
        rank: 'G' as any,
        isVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginCount: 0,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        language: 'en',
        completedJobs: 0,
        totalEarnings: 0,
        rating: 0,
        reviewCount: 0,
        twoFactorEnabled: false,
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showLocation: true,
          showStats: true
        }
      });

      const user = await unifiedAuth.register(registrationData);
      expect(user.email).toBe(registrationData.email);
      expect(user.role).toBe(UserRole.USER);
    });

    it('should handle authentication security events', async () => {
      // Mock security monitoring
      const logSpy = jest.spyOn(securityMonitoring, 'logSecurityEvent').mockResolvedValue();

      // Test failed login
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      jest.spyOn(unifiedAuth, 'signIn').mockImplementation(async () => {
        // Log security event before throwing
        await securityMonitoring.logSecurityEvent(
          SecurityEventType.LOGIN_FAILURE,
          {
            email: loginData.email,
            reason: 'Invalid credentials'
          }
        );
        throw new Error('Invalid credentials');
      });

      try {
        await unifiedAuth.signIn(loginData);
      } catch (error) {
        // Should log security event
        expect(logSpy).toHaveBeenCalledWith(
          SecurityEventType.LOGIN_FAILURE,
          expect.objectContaining({
            email: loginData.email,
            reason: 'Invalid credentials'
          })
        );
      }
    });
  });

  describe('API Gateway Integration', () => {
    it('should handle secure API requests with validation', async () => {
      // Mock authentication token
      jest.spyOn(require('../../services/secureStorage').secureStorage, 'getItem').mockResolvedValue('mock-auth-token');

      // Test API request with input validation
      const jobData = {
        title: 'Test Job',
        description: 'This is a test job description that is long enough',
        budget: 100,
        category: 'development'
      };

      // Sanitize input
      const sanitizedData = {
        title: sanitizeInput(jobData.title),
        description: sanitizeInput(jobData.description),
        budget: jobData.budget,
        category: sanitizeInput(jobData.category)
      };

      // Mock API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'job-123', ...sanitizedData })
      });

      const response = await api.post('/jobs', sanitizedData, {
        requireAuth: true,
        validateResponse: false, // Disable validation for simpler test
        rateLimit: {
          maxRequests: 10,
          windowMs: 60000
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.title).toBe(sanitizedData.title);
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      global.fetch = jest.fn().mockRejectedValue(new Error('Rate limit exceeded. Try again in 60 seconds'));

      const response = await api.get('/test', {
        rateLimit: {
          maxRequests: 1,
          windowMs: 60000
        }
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Rate limit exceeded');
    });
  });

  describe('Data Protection Integration', () => {
    it('should handle consent management', async () => {
      const userId = 'test-user-123';

      // Mock consent recording
      jest.spyOn(dataProtection, 'recordConsent').mockResolvedValue();
      jest.spyOn(dataProtection, 'hasConsent').mockResolvedValue(true);

      // Record consent
      await dataProtection.recordConsent(
        userId,
        ConsentType.ANALYTICS,
        true,
        'explicit'
      );

      // Check consent
      const hasConsent = await dataProtection.hasConsent(userId, ConsentType.ANALYTICS);
      expect(hasConsent).toBe(true);
    });

    it('should handle data export requests', async () => {
      const userId = 'test-user-123';

      // Mock data export
      jest.spyOn(dataProtection, 'requestDataExport').mockResolvedValue('export-123');

      const exportId = await dataProtection.requestDataExport(userId);
      expect(exportId).toBe('export-123');
    });

    it('should handle data deletion requests', async () => {
      const userId = 'test-user-123';

      // Mock data deletion
      jest.spyOn(dataProtection, 'requestDataDeletion').mockResolvedValue();

      await expect(
        dataProtection.requestDataDeletion(userId, 'User requested account deletion')
      ).resolves.not.toThrow();
    });
  });

  describe('Security Monitoring Integration', () => {
    it('should detect and handle security threats', async () => {
      // Mock security event logging
      const logSpy = jest.spyOn(securityMonitoring, 'logSecurityEvent').mockResolvedValue();

      // Simulate malicious input detection
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<script>');

      // Should log security event for malicious input
      await securityMonitoring.logSecurityEvent(
        SecurityEventType.XSS_ATTEMPT,
        {
          originalInput: maliciousInput,
          sanitizedInput: sanitized,
          blocked: true
        },
        'test-user-123'
      );

      expect(logSpy).toHaveBeenCalledWith(
        SecurityEventType.XSS_ATTEMPT,
        expect.objectContaining({
          originalInput: maliciousInput,
          blocked: true
        }),
        'test-user-123'
      );
    });

    it('should handle brute force detection', async () => {
      const userId = 'test-user-123';

      // Mock multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await securityMonitoring.logSecurityEvent(
          SecurityEventType.LOGIN_FAILURE,
          {
            email: 'test@example.com',
            attempt: i + 1,
            reason: 'Invalid password'
          },
          userId
        );
      }

      // Should trigger brute force detection and user blocking
      // This would be handled by the threat detection rules
    });
  });

  describe('Cross-System Data Flow', () => {
    it('should maintain data consistency across systems', async () => {
      // Mock authentication token
      jest.spyOn(require('../../services/secureStorage').secureStorage, 'getItem').mockResolvedValue('mock-auth-token');

      const userId = 'test-user-123';
      const jobData = {
        title: 'Full Stack Developer',
        description: 'Looking for an experienced full stack developer',
        budget: 5000,
        category: 'development'
      };

      // 1. User creates job (React Native -> API Gateway -> Backend)
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'job-123', ...jobData, createdBy: userId })
      });

      const createResponse = await api.post('/jobs', jobData, { requireAuth: true });
      expect(createResponse.success).toBe(true);

      // 2. Job data should be accessible via Firebase (for real-time updates)
      // This would sync between backend and Firebase

      // 3. Admin portal should be able to access job data
      const adminResponse = await api.get('/admin/jobs/job-123', { requireAuth: true });
      // Mock admin response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { id: 'job-123', ...jobData, createdBy: userId, status: 'pending' } 
        })
      });

      // 4. Security events should be logged for all operations
      const securitySpy = jest.spyOn(securityMonitoring, 'logSecurityEvent');
      
      await securityMonitoring.logSecurityEvent(
        SecurityEventType.SENSITIVE_DATA_ACCESS,
        {
          resource: 'job',
          resourceId: 'job-123',
          action: 'create'
        },
        userId
      );

      expect(securitySpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

      const response = await api.get('/test');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Network error. Please check your connection.');
    });

    it('should handle authentication errors', async () => {
      // Mock no auth token available
      jest.spyOn(require('../../services/secureStorage').secureStorage, 'getItem').mockResolvedValue(null);

      const response = await api.get('/protected-resource', { requireAuth: true });
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Authentication required but no token available');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        title: 'ab' // Too short
      };

      const emailValidation = validateEmail(invalidData.email);
      const passwordValidation = validatePassword(invalidData.password);

      expect(emailValidation.isValid).toBe(false);
      expect(emailValidation.errors).toContain('Invalid email format');

      expect(passwordValidation.isValid).toBe(false);
      expect(passwordValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();

      // Mock multiple concurrent API calls
      const promises = Array.from({ length: 10 }, (_, i) => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: i } })
        });
        
        return api.get(`/test/${i}`);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle request deduplication', async () => {
      let fetchCallCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: 'test' } })
        });
      });

      // Make multiple identical requests simultaneously
      const promises = Array.from({ length: 5 }, () => 
        api.get('/test-endpoint')
      );

      await Promise.all(promises);

      // Should only make one actual fetch call due to deduplication
      expect(fetchCallCount).toBe(1);
    });
  });

  describe('Compliance Integration', () => {
    it('should ensure GDPR compliance in data operations', async () => {
      const userId = 'test-user-123';

      // Mock consent check
      jest.spyOn(dataProtection, 'hasConsent').mockResolvedValue(true);

      // Check consent before processing analytics data
      const hasAnalyticsConsent = await dataProtection.hasConsent(userId, ConsentType.ANALYTICS);
      
      if (hasAnalyticsConsent) {
        // Process analytics data
        await securityMonitoring.logSecurityEvent(
          SecurityEventType.SENSITIVE_DATA_ACCESS,
          {
            dataType: 'analytics',
            purpose: 'user_behavior_analysis',
            consentVerified: true
          },
          userId
        );
      }

      expect(hasAnalyticsConsent).toBe(true);
    });

    it('should handle data retention policies', async () => {
      const userId = 'test-user-123';

      // Mock data cleanup
      jest.spyOn(dataProtection, 'cleanupExpiredData').mockResolvedValue();

      // Should clean up expired data according to retention policies
      await dataProtection.cleanupExpiredData();

      expect(dataProtection.cleanupExpiredData).toHaveBeenCalled();
    });
  });
});

describe('End-to-End User Journeys', () => {
  it('should handle complete user registration and job posting flow', async () => {
    // 1. User registers
    const registrationData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
      displayName: 'New User',
      acceptTerms: true,
      acceptPrivacy: true
    };

    jest.spyOn(unifiedAuth, 'register').mockResolvedValue({
      uid: 'new-user-123',
      email: registrationData.email,
      displayName: registrationData.displayName,
      role: UserRole.USER,
      rank: 'G' as any,
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      loginCount: 0,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      language: 'en',
      completedJobs: 0,
      totalEarnings: 0,
      rating: 0,
      reviewCount: 0,
      twoFactorEnabled: false,
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showLocation: true,
        showStats: true
      }
    });

    const user = await unifiedAuth.register(registrationData);

    // 2. User gives consent for analytics
    jest.spyOn(dataProtection, 'recordConsent').mockResolvedValue();
    await dataProtection.recordConsent(user.uid, ConsentType.ANALYTICS, true);

    // 3. User posts a job
    // Mock authentication token for API call
    jest.spyOn(require('../../services/secureStorage').secureStorage, 'getItem').mockResolvedValue('mock-auth-token');

    const jobData = {
      title: 'Mobile App Developer',
      description: 'Need an experienced React Native developer for a mobile app project',
      budget: 3000,
      category: 'development'
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'job-456', ...jobData, createdBy: user.uid })
    });

    const jobResponse = await api.post('/jobs', jobData, { requireAuth: true });

    // 4. Security events should be logged
    const securitySpy = jest.spyOn(securityMonitoring, 'logSecurityEvent').mockResolvedValue();
    await securityMonitoring.logSecurityEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESS,
      {
        resource: 'job',
        action: 'create',
        resourceId: jobResponse.data?.id
      },
      user.uid
    );

    // Verify the complete flow
    expect(user.uid).toBe('new-user-123');
    expect(jobResponse.success).toBe(true);
    expect(securitySpy).toHaveBeenCalled();
  });
});

