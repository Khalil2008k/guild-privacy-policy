/**
 * Frontend Input Sanitization Utility
 * 
 * Provides client-side sanitization for user inputs
 * Created per GUILD Stability Task 7
 * 
 * Date: November 9, 2025
 * Version: 1.1.0
 * 
 * NOTE: This is client-side sanitization for UX purposes.
 * Backend sanitization is the primary security layer.
 * 
 * React Native compatible - does not use DOMPurify (requires DOM)
 */

/**
 * Remove HTML tags from text (React Native compatible)
 * @param text - Text with potential HTML
 * @returns Text without HTML tags
 */
function stripHTML(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]+>/g, '') // Remove all other HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/**
 * Sanitize text input to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 * 
 * @param text - Raw text input from user
 * @param maxLength - Optional maximum length (default: 5000)
 * @returns Sanitized text
 */
export function sanitizeInput(text: string | undefined | null, maxLength: number = 5000): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = text.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove HTML tags (React Native compatible)
  sanitized = stripHTML(sanitized);

  // Remove dangerous characters
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script/gi, '')
    .replace(/<iframe/gi, '');

  return sanitized.trim();
}

/**
 * Sanitize HTML content while preserving safe tags
 * Used for rich text content (e.g., job descriptions, guild descriptions)
 * 
 * NOTE: For React Native, we strip all HTML for safety.
 * Backend will handle proper HTML sanitization.
 * 
 * @param html - Raw HTML input from user
 * @param allowedTags - Array of allowed HTML tags (ignored in React Native)
 * @returns Sanitized HTML (all tags removed for safety)
 */
export function sanitizeHTML(
  html: string | undefined | null,
  allowedTags: string[] = ['b', 'i', 'u', 'p', 'br', 'strong', 'em']
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // For React Native, we strip all HTML for safety
  // Backend will handle proper HTML sanitization with DOMPurify
  return stripHTML(html);
}

/**
 * Sanitize job data before submission
 * 
 * @param jobData - Job data object
 * @returns Sanitized job data
 */
export function sanitizeJobData(jobData: {
  title?: string;
  description?: string;
  skills?: string[];
  location?: string;
  [key: string]: any;
}): typeof jobData {
  return {
    ...jobData,
    title: jobData.title ? sanitizeInput(jobData.title, 200) : '',
    description: jobData.description ? sanitizeHTML(jobData.description) : '',
    skills: jobData.skills ? jobData.skills.map(skill => sanitizeInput(skill, 50)) : [],
    location: jobData.location ? sanitizeInput(jobData.location, 200) : ''
  };
}

/**
 * Sanitize user profile data before submission
 * 
 * @param profileData - User profile data object
 * @returns Sanitized profile data
 */
export function sanitizeUserProfile(profileData: {
  name?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  [key: string]: any;
}): typeof profileData {
  return {
    ...profileData,
    name: profileData.name ? sanitizeInput(profileData.name, 100) : '',
    bio: profileData.bio ? sanitizeHTML(profileData.bio) : '',
    location: profileData.location ? sanitizeInput(profileData.location, 200) : '',
    skills: profileData.skills ? profileData.skills.map(skill => sanitizeInput(skill, 50)) : []
  };
}

/**
 * Sanitize guild data before submission
 * 
 * @param guildData - Guild data object
 * @returns Sanitized guild data
 */
export function sanitizeGuildData(guildData: {
  name?: string;
  description?: string;
  tags?: string[];
  [key: string]: any;
}): typeof guildData {
  return {
    ...guildData,
    name: guildData.name ? sanitizeInput(guildData.name, 200) : '',
    description: guildData.description ? sanitizeHTML(guildData.description) : '',
    tags: guildData.tags ? guildData.tags.map(tag => sanitizeInput(tag, 50)) : []
  };
}

/**
 * Sanitize chat message before sending
 * 
 * @param message - Chat message text
 * @returns Sanitized message
 */
export function sanitizeChatMessage(message: string | undefined | null): string {
  return sanitizeInput(message, 5000);
}

/**
 * Sanitize search query
 * 
 * @param query - Search query string
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: string | undefined | null): string {
  return sanitizeInput(query, 200);
}

/**
 * Check if text contains potential XSS
 * Returns true if dangerous patterns are detected
 * 
 * @param text - Text to check
 * @returns True if XSS detected
 */
export function containsXSS(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /<iframe/i,
    /<svg.*onload/i,
    /<img.*onerror/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(text));
}

/**
 * Validate and sanitize email
 * 
 * @param email - Email address
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Remove HTML tags
  const sanitized = sanitizeInput(email, 254); // Max email length per RFC

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized.toLowerCase();
}

/**
 * Validate and sanitize phone number
 * 
 * @param phone - Phone number
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(phone: string | undefined | null): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
}

export default {
  sanitizeInput,
  sanitizeHTML,
  sanitizeJobData,
  sanitizeUserProfile,
  sanitizeGuildData,
  sanitizeChatMessage,
  sanitizeSearchQuery,
  containsXSS,
  sanitizeEmail,
  sanitizePhoneNumber
};
