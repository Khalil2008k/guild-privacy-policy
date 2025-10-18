// Input validation and sanitization utilities

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // If input is a javascript: URL, return empty (security)
  if (/^\s*javascript:/i.test(input)) return '';
  
  return input
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove HTML tags (basic sanitization)
    .replace(/<[^>]*>/g, '')
    // Trim whitespace
    .trim();
};

/**
 * Validates job title
 * @param title - Job title to validate
 * @returns Validation result
 */
export const validateJobTitle = (title: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(title);
  
  if (!sanitized) {
    return { isValid: false, error: 'Job title is required' };
  }
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Job title must be at least 3 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Job title must be less than 100 characters' };
  }
  
  // Check for valid characters (letters, numbers, spaces, common punctuation)
  const validPattern = /^[a-zA-Z0-9\u0600-\u06FF\s\-\.\,\(\)\/]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: 'Job title contains invalid characters' };
  }
  
  return { isValid: true };
};

/**
 * Validates company name
 * @param company - Company name to validate
 * @returns Validation result
 */
export const validateCompanyName = (company: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(company);
  
  if (!sanitized) {
    return { isValid: false, error: 'Company name is required' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Company name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 80) {
    return { isValid: false, error: 'Company name must be less than 80 characters' };
  }
  
  return { isValid: true };
};

/**
 * Validates job description
 * @param description - Job description to validate
 * @returns Validation result
 */
export const validateJobDescription = (description: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(description);
  
  if (!sanitized) {
    return { isValid: false, error: 'Job description is required' };
  }
  
  if (sanitized.length < 10) {
    return { isValid: false, error: 'Job description must be at least 10 characters long' };
  }
  
  if (sanitized.length > 2000) {
    return { isValid: false, error: 'Job description must be less than 2000 characters' };
  }
  
  return { isValid: true };
};

/**
 * Validates salary range
 * @param salary - Salary string to validate
 * @returns Validation result
 */
export const validateSalary = (salary: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(salary);
  
  if (!sanitized) {
    return { isValid: false, error: 'Salary information is required' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Salary information is too long' };
  }
  
  return { isValid: true };
};

/**
 * Validates location
 * @param location - Location string to validate
 * @returns Validation result
 */
export const validateLocation = (location: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(location);
  
  if (!sanitized) {
    return { isValid: false, error: 'Location is required' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Location must be at least 2 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Location must be less than 100 characters' };
  }
  
  return { isValid: true };
};

/**
 * Validates skills array
 * @param skills - Array of skills to validate
 * @returns Validation result
 */
export const validateSkills = (skills: string[]): { isValid: boolean; error?: string } => {
  if (!Array.isArray(skills)) {
    return { isValid: false, error: 'Skills must be an array' };
  }
  
  if (skills.length === 0) {
    return { isValid: false, error: 'At least one skill is required' };
  }
  
  if (skills.length > 20) {
    return { isValid: false, error: 'Maximum 20 skills allowed' };
  }
  
  for (const skill of skills) {
    const sanitized = sanitizeInput(skill);
    if (!sanitized) {
      return { isValid: false, error: 'All skills must be non-empty' };
    }
    
    if (sanitized.length > 50) {
      return { isValid: false, error: 'Each skill must be less than 50 characters' };
    }
  }
  
  return { isValid: true };
};

/**
 * Validates email address
 * @param email - Email to validate
 * @returns Validation result
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(email);
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  return { isValid: true };
};

/**
 * Validates phone number
 * @param phone - Phone number to validate
 * @returns Validation result
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(phone);
  
  if (!sanitized) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters for validation
  const digitsOnly = sanitized.replace(/\D/g, '');
  
  if (digitsOnly.length < 8) {
    return { isValid: false, error: 'Phone number must be at least 8 digits' };
  }
  
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number must be less than 15 digits' };
  }
  
  return { isValid: true };
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Validation result
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters' };
  }
  
  // Check for at least one letter and one number for basic security
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Password must contain at least one letter and one number' };
  }
  
  return { isValid: true };
};

/**
 * Validates a complete job form
 * @param jobData - Job form data to validate
 * @returns Validation result with all errors
 */
export interface JobFormData {
  title: string;
  company: string;
  description: string;
  salary: string;
  location: string;
  skills: string[];
}

export const validateJobForm = (jobData: JobFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const titleValidation = validateJobTitle(jobData.title);
  if (!titleValidation.isValid) {
    errors.title = titleValidation.error!;
  }
  
  const companyValidation = validateCompanyName(jobData.company);
  if (!companyValidation.isValid) {
    errors.company = companyValidation.error!;
  }
  
  const descriptionValidation = validateJobDescription(jobData.description);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error!;
  }
  
  const salaryValidation = validateSalary(jobData.salary);
  if (!salaryValidation.isValid) {
    errors.salary = salaryValidation.error!;
  }
  
  const locationValidation = validateLocation(jobData.location);
  if (!locationValidation.isValid) {
    errors.location = locationValidation.error!;
  }
  
  const skillsValidation = validateSkills(jobData.skills);
  if (!skillsValidation.isValid) {
    errors.skills = skillsValidation.error!;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitizes and validates search query
 * @param query - Search query to validate
 * @returns Sanitized and validated query
 */
export const validateSearchQuery = (query: string): { isValid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeInput(query);
  
  if (sanitized.length > 200) {
    return { isValid: false, sanitized: '', error: 'Search query is too long' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Rate limiting utility for form submissions
 */
export class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  static canAttempt(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if under limit
    if (record.count < maxAttempts) {
      record.count++;
      record.lastAttempt = now;
      return true;
    }
    
    return false;
  }
  
  static getRemainingTime(key: string, windowMs: number = 300000): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, windowMs - elapsed);
  }
}

// Validation Rules Interface
export interface ValidationRulesInterface {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => { isValid: boolean; message?: string };
}

// Validation Result Interface
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Predefined validation rules
export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    customValidator: (value: string) => {
      const result = validateEmail(value);
      return { isValid: result.isValid, message: result.error };
    }
  },
  password: {
    required: true,
    minLength: 6,
    customValidator: (value: string) => {
      const result = validatePassword(value);
      return { isValid: result.isValid, message: result.error };
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\u0600-\u06FF\s]+$/
  },
  phone: {
    required: false,
    pattern: /^\+?[\d\s\-\(\)]+$/
  }
};

// Validation Service
export class ValidationService {
  static validate(value: string, rules: ValidationRulesInterface): ValidationResult {
    // Required check
    if (rules.required && (!value || value.trim() === '')) {
      return { isValid: false, message: 'This field is required' };
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return { isValid: true };
    }

    // Length checks
    if (rules.minLength && value.length < rules.minLength) {
      return { isValid: false, message: `Minimum length is ${rules.minLength} characters` };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, message: `Maximum length is ${rules.maxLength} characters` };
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, message: 'Invalid format' };
    }

    // Custom validator
    if (rules.customValidator) {
      return rules.customValidator(value);
    }

    return { isValid: true };
  }

  static validateForm(formData: { [key: string]: { value: string; rules: ValidationRulesInterface } }): {
    isValid: boolean;
    errors: { [key: string]: string };
  } {
    const errors: { [key: string]: string } = {};

    Object.keys(formData).forEach(fieldName => {
      const field = formData[fieldName];
      const result = this.validate(field.value, field.rules);
      
      if (!result.isValid && result.message) {
        errors[fieldName] = result.message;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}