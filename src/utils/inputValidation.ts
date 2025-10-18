/**
 * Enterprise Input Validation System
 * Security-focused validation following OWASP guidelines
 */

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

// Common regex patterns
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  username: /^[a-zA-Z0-9_-]{3,30}$/,
  name: /^[a-zA-Z\s'-]{1,50}$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Security patterns
  noScript: /^(?!.*<script).*$/i,
  noSql: /^(?!.*(union|select|insert|update|delete|drop|create|alter|exec|execute)).*$/i,
  noXss: /^(?!.*(javascript:|data:|vbscript:|onload|onerror|onclick)).*$/i,
  safeText: /^[a-zA-Z0-9\s.,!?'"()-]+$/
};

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove dangerous patterns
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '');

  return sanitized.trim();
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(email);

  if (!email) {
    errors.push('Email is required');
  } else if (!ValidationPatterns.email.test(sanitized)) {
    errors.push('Invalid email format');
  } else if (sanitized.length > 254) {
    errors.push('Email is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized.toLowerCase()
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password is too long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: password
  };
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(username);

  if (!username) {
    errors.push('Username is required');
  } else if (!ValidationPatterns.username.test(sanitized)) {
    errors.push('Username must be 3-30 characters, letters, numbers, underscore, or hyphen only');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validate name (first/last name)
 */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(name);

  if (!name) {
    errors.push('Name is required');
  } else if (!ValidationPatterns.name.test(sanitized)) {
    errors.push('Name can only contain letters, spaces, apostrophes, and hyphens');
  } else if (sanitized.length > 50) {
    errors.push('Name is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validate job title
 */
export function validateJobTitle(title: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(title);

  if (!title) {
    errors.push('Job title is required');
  } else if (sanitized.length < 5) {
    errors.push('Job title must be at least 5 characters');
  } else if (sanitized.length > 100) {
    errors.push('Job title is too long');
  } else if (!ValidationPatterns.noScript.test(sanitized) || 
             !ValidationPatterns.noSql.test(sanitized)) {
    errors.push('Job title contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validate job description
 */
export function validateJobDescription(description: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(description);

  if (!description) {
    errors.push('Job description is required');
  } else if (sanitized.length < 20) {
    errors.push('Job description must be at least 20 characters');
  } else if (sanitized.length > 5000) {
    errors.push('Job description is too long');
  } else if (!ValidationPatterns.noScript.test(sanitized) || 
             !ValidationPatterns.noXss.test(sanitized)) {
    errors.push('Job description contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validate budget amount
 */
export function validateBudget(budget: number | string): ValidationResult {
  const errors: string[] = [];
  const numBudget = typeof budget === 'string' ? parseFloat(budget) : budget;

  if (isNaN(numBudget)) {
    errors.push('Budget must be a valid number');
  } else if (numBudget < 1) {
    errors.push('Budget must be at least $1');
  } else if (numBudget > 1000000) {
    errors.push('Budget cannot exceed $1,000,000');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: numBudget
  };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(phone);

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!ValidationPatterns.phone.test(sanitized)) {
    errors.push('Invalid phone number format');
  } else if (sanitized.length > 20) {
    errors.push('Phone number is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validate message content
 */
export function validateMessage(message: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(message);

  if (!message) {
    errors.push('Message is required');
  } else if (sanitized.length > 2000) {
    errors.push('Message is too long');
  } else if (!ValidationPatterns.noScript.test(sanitized) || 
             !ValidationPatterns.noXss.test(sanitized)) {
    errors.push('Message contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(query);

  if (sanitized.length > 100) {
    errors.push('Search query is too long');
  } else if (sanitized && !ValidationPatterns.safeText.test(sanitized)) {
    errors.push('Search query contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Check if input contains dangerous content
 */
export function isDangerous(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+=/i,
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate multiple fields at once
 */
export function validateFields(data: Record<string, any>, rules: Record<string, (value: any) => ValidationResult>): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
} {
  const errors: Record<string, string[]> = {};
  const sanitizedData: Record<string, any> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
    
    sanitizedData[field] = result.sanitizedValue;
  }

  return { isValid, errors, sanitizedData };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File | { name: string; size: number; type: string }): ValidationResult {
  const errors: string[] = [];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    errors.push('File is required');
  } else {
    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed. Only JPEG, PNG, GIF, WebP, and PDF files are allowed');
    }
    
    if (file.size > maxSize) {
      errors.push('File size too large. Maximum size is 10MB');
    }
    
    // Check for dangerous file names
    if (isDangerous(file.name)) {
      errors.push('File name contains invalid characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: file
  };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeInput(url);

  if (!url) {
    errors.push('URL is required');
  } else {
    try {
      const urlObj = new URL(sanitized);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('Only HTTP and HTTPS URLs are allowed');
      }
      
      // Check for dangerous patterns in URL
      if (isDangerous(sanitized)) {
        errors.push('URL contains invalid characters');
      }
      
    } catch {
      errors.push('Invalid URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowKey = `${key}_${Math.floor(now / windowMs)}`;
  
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(windowKey);
    const count = stored ? parseInt(stored) : 0;
    
    if (count >= maxRequests) {
      return false;
    }
    
    localStorage.setItem(windowKey, (count + 1).toString());
    
    // Clean up old entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${key}_`) && key !== windowKey) {
        localStorage.removeItem(key);
      }
    }
  }
  
  return true;
}

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validateName,
  validatePhoneNumber,
  validateJobTitle,
  validateJobDescription,
  validateBudget,
  validateMessage,
  validateSearchQuery,
  validateFileUpload,
  validateUrl,
  validateRateLimit,
  sanitizeInput,
  isDangerous,
  validateFields
};

