/**
 * Authentication Input Detector
 * Detects whether user entered email, phone, or GID
 */

export type AuthInputType = 'email' | 'phone' | 'gid' | 'unknown';

export interface AuthInputResult {
  type: AuthInputType;
  value: string;
  formattedValue: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Detect the type of authentication input
 */
export function detectAuthInputType(input: string): AuthInputResult {
  const trimmedInput = input.trim();

  // Check for phone number (starts with + or digits, contains mostly digits)
  if (isPhoneNumber(trimmedInput)) {
    return {
      type: 'phone',
      value: trimmedInput,
      formattedValue: formatPhoneNumber(trimmedInput),
      isValid: validatePhoneNumber(trimmedInput),
      errorMessage: validatePhoneNumber(trimmedInput) ? undefined : 'Invalid phone number format',
    };
  }

  // Check for GID (starts with GUILD-, followed by alphanumeric)
  if (isGuildId(trimmedInput)) {
    return {
      type: 'gid',
      value: trimmedInput.toUpperCase(),
      formattedValue: trimmedInput.toUpperCase(),
      isValid: validateGuildId(trimmedInput),
      errorMessage: validateGuildId(trimmedInput) ? undefined : 'Invalid Guild ID format',
    };
  }

  // Check for email (contains @)
  if (isEmail(trimmedInput)) {
    return {
      type: 'email',
      value: trimmedInput.toLowerCase(),
      formattedValue: trimmedInput.toLowerCase(),
      isValid: validateEmail(trimmedInput),
      errorMessage: validateEmail(trimmedInput) ? undefined : 'Invalid email format',
    };
  }

  return {
    type: 'unknown',
    value: trimmedInput,
    formattedValue: trimmedInput,
    isValid: false,
    errorMessage: 'Please enter a valid email, phone number, or Guild ID',
  };
}

/**
 * Check if input looks like a phone number
 */
function isPhoneNumber(input: string): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = input.replace(/[\s\-\(\)]/g, '');
  
  // Starts with + or digit, and contains mostly digits
  const phoneRegex = /^[+]?[\d]{7,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate phone number
 */
function validatePhoneNumber(input: string): boolean {
  const cleaned = input.replace(/[\s\-\(\)]/g, '');
  
  // Must start with + for international format
  // Or be 7-15 digits
  const phoneRegex = /^(\+[\d]{7,15}|[\d]{7,15})$/;
  return phoneRegex.test(cleaned);
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(input: string): string {
  const cleaned = input.replace(/[\s\-\(\)]/g, '');
  
  // If doesn't start with +, assume it needs country code
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Check if input looks like a Guild ID
 */
function isGuildId(input: string): boolean {
  const gidRegex = /^GUILD[-_]?[\dA-Z]{4,10}$/i;
  return gidRegex.test(input);
}

/**
 * Validate Guild ID
 */
function validateGuildId(input: string): boolean {
  const gidRegex = /^GUILD[-_][\dA-Z]{4,10}$/i;
  return gidRegex.test(input);
}

/**
 * Check if input looks like an email
 */
function isEmail(input: string): boolean {
  return input.includes('@');
}

/**
 * Validate email format
 */
function validateEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
}

/**
 * Get placeholder text based on detected type
 */
export function getInputPlaceholder(type: AuthInputType, isRTL: boolean): string {
  switch (type) {
    case 'email':
      return isRTL ? 'البريد الإلكتروني' : 'Email';
    case 'phone':
      return isRTL ? 'رقم الهاتف' : 'Phone Number';
    case 'gid':
      return isRTL ? 'معرّف جيلد' : 'Guild ID';
    default:
      return isRTL ? 'البريد / الهاتف / معرّف جيلد' : 'Email / Phone / Guild ID';
  }
}

/**
 * Get input icon based on detected type
 */
export function getInputIcon(type: AuthInputType): string {
  switch (type) {
    case 'email':
      return '✉️';
    case 'phone':
      return '📱';
    case 'gid':
      return '🆔';
    default:
      return '👤';
  }
}

