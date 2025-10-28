/**
 * Message Analytics Service
 * AI-powered message analysis, sentiment detection, and smart summaries
 */

import { AISummary } from '../types/EnhancedChat';

class MessageAnalyticsServiceClass {
  /**
   * Analyze message sentiment (positive/neutral/negative)
   */
  analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    if (!text || text.trim().length === 0) return 'neutral';

    const lowerText = text.toLowerCase();

    // Positive indicators
    const positiveWords = [
      'great', 'awesome', 'excellent', 'love', 'happy', 'thanks', 'thank you',
      'perfect', 'amazing', 'wonderful', 'fantastic', 'good', 'nice', 'best',
      '😊', '😃', '😄', '❤️', '👍', '🎉', '✨', '💯', '🔥'
    ];

    // Negative indicators
    const negativeWords = [
      'bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'disappointed',
      'worst', 'horrible', 'poor', 'issue', 'problem', 'error', 'wrong',
      '😞', '😢', '😠', '😡', '👎', '💔', '😭'
    ];

    // Urgent indicators
    const urgentWords = [
      'urgent', 'asap', 'emergency', 'critical', 'important', 'now',
      'immediately', 'help', 'quick', 'hurry', '!!!', '🚨'
    ];

    let positiveCount = 0;
    let negativeCount = 0;
    let urgentCount = 0;

    // Count matches
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    urgentWords.forEach(word => {
      if (lowerText.includes(word)) urgentCount++;
    });

    // Urgent messages are treated as neutral but flagged
    if (urgentCount > 0) return 'neutral';

    // Determine sentiment
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Detect if message is urgent
   */
  isUrgent(text: string): boolean {
    if (!text) return false;

    const lowerText = text.toLowerCase();
    const urgentWords = [
      'urgent', 'asap', 'emergency', 'critical', 'important', 'now',
      'immediately', 'help', 'quick', 'hurry', '🚨', '⚠️'
    ];

    return urgentWords.some(word => lowerText.includes(word)) || 
           (text.match(/!/g) || []).length >= 2;
  }

  /**
   * Generate AI summary of message (simplified version)
   */
  generateSummary(text: string, maxLength: number = 50): AISummary {
    if (!text || text.trim().length === 0) {
      return {
        text: 'No message',
        confidence: 1,
        keywords: [],
      };
    }

    // If message is short enough, return as is
    if (text.length <= maxLength) {
      return {
        text,
        confidence: 1,
        keywords: this.extractKeywords(text),
      };
    }

    // Extract first sentence or truncate
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length <= maxLength) {
      return {
        text: firstSentence + '...',
        confidence: 0.9,
        keywords: this.extractKeywords(firstSentence),
      };
    }

    // Truncate with ellipsis
    return {
      text: text.substring(0, maxLength - 3) + '...',
      confidence: 0.7,
      keywords: this.extractKeywords(text.substring(0, maxLength)),
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    // Remove common words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'them', 'their', 'this', 'that', 'these',
      'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Get unique words and limit to top 5
    return [...new Set(words)].slice(0, 5);
  }

  /**
   * Detect message type from content
   */
  detectMessageType(text: string): {
    hasLink: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
    hasLocation: boolean;
    hasDate: boolean;
    hasTime: boolean;
    hasMention: boolean;
    hasHashtag: boolean;
  } {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const mentionRegex = /@[\w]+/g;
    const hashtagRegex = /#[\w]+/g;
    const dateRegex = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g;
    const timeRegex = /\b\d{1,2}:\d{2}\s?(am|pm|AM|PM)?\b/g;

    return {
      hasLink: urlRegex.test(text),
      hasEmail: emailRegex.test(text),
      hasPhone: phoneRegex.test(text),
      hasLocation: /\b(location|address|map|coordinates)\b/i.test(text),
      hasDate: dateRegex.test(text),
      hasTime: timeRegex.test(text),
      hasMention: mentionRegex.test(text),
      hasHashtag: hashtagRegex.test(text),
    };
  }

  /**
   * Extract links from message
   */
  extractLinks(text: string): string[] {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Extract mentions from message
   */
  extractMentions(text: string): string[] {
    if (!text) return [];
    const mentionRegex = /@([\w]+)/g;
    const matches = text.matchAll(mentionRegex);
    return Array.from(matches, m => m[1]);
  }

  /**
   * Calculate reading time in seconds
   */
  calculateReadingTime(text: string): number {
    if (!text) return 0;
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil((words / wordsPerMinute) * 60);
  }

  /**
   * Detect language (simplified)
   */
  detectLanguage(text: string): 'en' | 'ar' | 'unknown' {
    if (!text) return 'unknown';
    
    // Check for Arabic characters
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(text)) return 'ar';
    
    // Default to English
    return 'en';
  }
}

export const MessageAnalyticsService = new MessageAnalyticsServiceClass();
export default MessageAnalyticsService;


