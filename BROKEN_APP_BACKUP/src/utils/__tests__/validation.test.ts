// Tests for validation utilities

import {
  sanitizeInput,
  validateJobTitle,
  validateCompanyName,
  validateJobDescription,
  validateSalary,
  validateLocation,
  validateSkills,
  validateEmail,
  validatePhoneNumber,
  validateJobForm,
  validateSearchQuery,
  RateLimiter,
} from '../validation';

describe('Validation Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should remove javascript: URLs', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      expect(result).toBe('');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      const result = sanitizeInput(null as any);
      expect(result).toBe('');
    });
  });

  describe('validateJobTitle', () => {
    it('should validate correct job title', () => {
      const result = validateJobTitle('Senior React Native Developer');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty title', () => {
      const result = validateJobTitle('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Job title is required');
    });

    it('should reject title too short', () => {
      const result = validateJobTitle('AB');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Job title must be at least 3 characters long');
    });

    it('should reject title too long', () => {
      const longTitle = 'A'.repeat(101);
      const result = validateJobTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Job title must be less than 100 characters');
    });

    it('should accept Arabic text', () => {
      const result = validateJobTitle('مطور React Native أول');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCompanyName', () => {
    it('should validate correct company name', () => {
      const result = validateCompanyName('TechCorp Inc.');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty company name', () => {
      const result = validateCompanyName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Company name is required');
    });

    it('should reject company name too short', () => {
      const result = validateCompanyName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Company name must be at least 2 characters long');
    });
  });

  describe('validateJobDescription', () => {
    it('should validate correct description', () => {
      const result = validateJobDescription('Looking for an experienced developer to join our team.');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty description', () => {
      const result = validateJobDescription('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Job description is required');
    });

    it('should reject description too short', () => {
      const result = validateJobDescription('Short');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Job description must be at least 10 characters long');
    });

    it('should reject description too long', () => {
      const longDescription = 'A'.repeat(2001);
      const result = validateJobDescription(longDescription);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Job description must be less than 2000 characters');
    });
  });

  describe('validateSkills', () => {
    it('should validate correct skills array', () => {
      const result = validateSkills(['React', 'TypeScript', 'Node.js']);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty skills array', () => {
      const result = validateSkills([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least one skill is required');
    });

    it('should reject non-array input', () => {
      const result = validateSkills('React' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Skills must be an array');
    });

    it('should reject too many skills', () => {
      const manySkills = Array(21).fill('Skill');
      const result = validateSkills(manySkills);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum 20 skills allowed');
    });

    it('should reject empty skill in array', () => {
      const result = validateSkills(['React', '', 'TypeScript']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('All skills must be non-empty');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number', () => {
      const result = validatePhoneNumber('+1-555-123-4567');
      expect(result.isValid).toBe(true);
    });

    it('should reject phone number too short', () => {
      const result = validatePhoneNumber('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number must be at least 8 digits');
    });

    it('should reject phone number too long', () => {
      const result = validatePhoneNumber('1234567890123456');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number must be less than 15 digits');
    });
  });

  describe('validateJobForm', () => {
    const validJobData = {
      title: 'Senior Developer',
      company: 'TechCorp',
      description: 'Looking for an experienced developer to join our team.',
      salary: '$100k - $120k',
      location: 'New York, NY',
      skills: ['React', 'TypeScript'],
    };

    it('should validate correct job form', () => {
      const result = validateJobForm(validJobData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should return multiple errors for invalid form', () => {
      const invalidJobData = {
        title: '',
        company: '',
        description: '',
        salary: '',
        location: '',
        skills: [],
      };
      const result = validateJobForm(invalidJobData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });

  describe('validateSearchQuery', () => {
    it('should validate correct search query', () => {
      const result = validateSearchQuery('React Developer');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('React Developer');
    });

    it('should sanitize search query', () => {
      const result = validateSearchQuery('<script>alert("xss")</script>React');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('React');
    });

    it('should reject query too long', () => {
      const longQuery = 'A'.repeat(201);
      const result = validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Search query is too long');
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      // Clear rate limiter state before each test
      (RateLimiter as any).attempts.clear();
    });

    it('should allow first attempt', () => {
      const result = RateLimiter.canAttempt('test-key');
      expect(result).toBe(true);
    });

    it('should block after max attempts', () => {
      const key = 'test-key';
      const maxAttempts = 3;
      
      // Make max attempts
      for (let i = 0; i < maxAttempts; i++) {
        expect(RateLimiter.canAttempt(key, maxAttempts, 60000)).toBe(true);
      }
      
      // Next attempt should be blocked
      expect(RateLimiter.canAttempt(key, maxAttempts, 60000)).toBe(false);
    });

    it('should reset after time window', () => {
      const key = 'test-key';
      const maxAttempts = 1;
      const windowMs = 100;
      
      // Make first attempt
      expect(RateLimiter.canAttempt(key, maxAttempts, windowMs)).toBe(true);
      
      // Should be blocked immediately
      expect(RateLimiter.canAttempt(key, maxAttempts, windowMs)).toBe(false);
      
      // Wait for window to pass
      return new Promise(resolve => {
        setTimeout(() => {
          expect(RateLimiter.canAttempt(key, maxAttempts, windowMs)).toBe(true);
          resolve(undefined);
        }, windowMs + 10);
      });
    });

    it('should return remaining time', () => {
      const key = 'test-key';
      const windowMs = 60000;
      
      RateLimiter.canAttempt(key, 1, windowMs);
      const remainingTime = RateLimiter.getRemainingTime(key, windowMs);
      
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(windowMs);
    });
  });
});
