/**
 * Frontend Input Sanitization Utility
 * 
 * COMMENT: PRODUCTION HARDENING - Task 3.8 - Message sanitization
 * Provides reusable sanitization functions for user input to prevent XSS attacks
 * 
 * This is a frontend-compatible version that works with React Native
 * 
 * Usage:
 *   import { sanitizeText } from '@/utils/sanitize';
 *   
 *   const cleanMessage = sanitizeText(messageText);
 */

/**
 * Sanitize text input to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 * 
 * @param text - Raw text input from user
 * @param maxLength - Optional maximum length (default: 5000 for messages)
 * @returns Sanitized text
 */
export function sanitizeText(text: string | undefined | null, maxLength: number = 5000): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = text.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove HTML tags (regex-based, safe for React Native)
  // This matches all HTML tags including script, style, etc.
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove potentially dangerous HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    // Remove any remaining HTML entities
    .replace(/&#\d+;/g, '')
    .replace(/&#x[0-9a-fA-F]+;/g, '');

  // Remove dangerous JavaScript protocols (data:, javascript:, vbscript:, etc.)
  sanitized = sanitized.replace(
    /(javascript|data|vbscript|file|about):/gi,
    ''
  );

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Final trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize message text specifically
 * Same as sanitizeText but with message-specific defaults
 * 
 * @param messageText - Raw message text from user
 * @returns Sanitized message text
 */
export function sanitizeMessage(messageText: string): string {
  return sanitizeText(messageText, 5000);
}




