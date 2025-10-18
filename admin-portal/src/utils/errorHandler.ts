/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the admin portal
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

/**
 * Parse Firebase errors into user-friendly messages
 */
export function parseFirebaseError(error: any): ErrorResponse {
  const errorCode = error.code || '';
  const defaultMessage = 'An unexpected error occurred. Please try again.';

  const errorMessages: Record<string, string> = {
    // Auth errors
    'auth/user-not-found': 'User not found. Please check your email.',
    'auth/wrong-password': 'Invalid password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    
    // Firestore errors
    'permission-denied': 'You don\'t have permission to access this resource.',
    'unavailable': 'Service is temporarily unavailable. Please try again.',
    'not-found': 'The requested resource was not found.',
    'already-exists': 'This resource already exists.',
    'resource-exhausted': 'Quota exceeded. Please try again later.',
    'failed-precondition': 'Operation cannot be completed at this time.',
    'aborted': 'Operation was aborted. Please try again.',
    'out-of-range': 'Operation was out of valid range.',
    'unauthenticated': 'You must be logged in to perform this action.',
    'deadline-exceeded': 'Operation timed out. Please try again.',
  };

  const message = errorMessages[errorCode] || error.message || defaultMessage;

  return {
    message,
    code: errorCode,
    statusCode: error.statusCode || 500,
    details: process.env.NODE_ENV === 'development' ? error : undefined
  };
}

/**
 * Handle errors consistently across the app
 */
export function handleError(error: any, context?: string): ErrorResponse {
  console.error(`[${context || 'Error'}]:`, error);

  // Firebase errors
  if (error.code && error.code.includes('auth/')) {
    return parseFirebaseError(error);
  }

  if (error.code && error.code.includes('/')) {
    return parseFirebaseError(error);
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'network-error',
      statusCode: 0
    };
  }

  // App errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }

  // Unknown errors
  return {
    message: error.message || 'An unexpected error occurred. Please try again.',
    code: 'unknown-error',
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? error : undefined
  };
}

/**
 * Show error notification to user
 */
export function showErrorNotification(error: any, context?: string) {
  const errorResponse = handleError(error, context);
  
  // In a real app, this would trigger a toast/notification system
  // For now, we'll use alert (should be replaced with proper UI notification)
  if (typeof window !== 'undefined') {
    console.error('Error:', errorResponse.message);
  }
  
  return errorResponse;
}

/**
 * Validate input and throw AppError if invalid
 */
export function validateRequired(value: any, fieldName: string) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new AppError(`${fieldName} is required`, 'validation-error', 400);
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email address', 'validation-error', 400);
  }
}

export function validatePhone(phone: string) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError('Invalid phone number', 'validation-error', 400);
  }
}

export function validateURL(url: string) {
  try {
    new URL(url);
  } catch {
    throw new AppError('Invalid URL', 'validation-error', 400);
  }
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  let currentDelay = initialDelay;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = currentDelay;
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        currentDelay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

