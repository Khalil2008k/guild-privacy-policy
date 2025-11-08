/**
 * Translation Service
 * 
 * Handles message translation using Google Translate API or similar service
 */

import { logger } from '../utils/logger';

interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

class TranslationService {
  private readonly GOOGLE_TRANSLATE_API_URL = 'https://translate.googleapis.com/translate_a/single';
  private readonly FALLBACK_API_URL = 'https://api.mymemory.translated.net/get';

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return 'unknown';
    }

    try {
      // Simple detection based on character ranges
      // This is a basic implementation - in production you'd use a proper language detection library
      
      // Check for Arabic characters
      if (/[\u0600-\u06FF]/.test(text)) {
        return 'ar';
      }
      
      // Check for Chinese characters
      if (/[\u4E00-\u9FFF]/.test(text)) {
        return 'zh';
      }
      
      // Check for Japanese characters
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
        return 'ja';
      }
      
      // Check for Korean characters
      if (/[\uAC00-\uD7AF]/.test(text)) {
        return 'ko';
      }
      
      // Check for Russian/Cyrillic characters
      if (/[\u0400-\u04FF]/.test(text)) {
        return 'ru';
      }
      
      // Default to English for Latin characters
      if (/^[a-zA-Z0-9\s.,!?;:'"()-]+$/.test(text)) {
        return 'en';
      }
      
      return 'auto'; // Unknown language
    } catch (error) {
      logger.error('Error detecting language:', error);
      return 'auto';
    }
  }

  /**
   * Translate text using Google Translate API (free, no API key required)
   */
  async translateMessage(
    text: string,
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'en'
  ): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // If source and target are the same, return original text
    if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        detectedLanguage: sourceLanguage,
        sourceLanguage,
        targetLanguage,
      };
    }

    try {
      // Try Google Translate API first (free, no API key)
      const googleUrl = `${this.GOOGLE_TRANSLATE_API_URL}?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(googleUrl);
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Google Translate returns nested arrays
      let translatedText = '';
      if (data[0] && Array.isArray(data[0])) {
        translatedText = data[0]
          .map((item: any[]) => item[0])
          .filter(Boolean)
          .join('');
      } else if (typeof data[0] === 'string') {
        translatedText = data[0];
      }

      if (!translatedText) {
        throw new Error('No translation returned');
      }

      const detectedLang = data[2] || sourceLanguage;

      return {
        translatedText,
        detectedLanguage: detectedLang,
        sourceLanguage: sourceLanguage === 'auto' ? detectedLang : sourceLanguage,
        targetLanguage,
      };
    } catch (error) {
      logger.error('Error translating with Google Translate:', error);
      
      // Fallback to MyMemory API
      try {
        const fallbackUrl = `${this.FALLBACK_API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`;
        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackData = await fallbackResponse.json();

        if (fallbackData.responseStatus === 200 && fallbackData.responseData?.translatedText) {
          return {
            translatedText: fallbackData.responseData.translatedText,
            detectedLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
            sourceLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
            targetLanguage,
          };
        }
      } catch (fallbackError) {
        logger.error('Error translating with fallback API:', fallbackError);
      }

      throw new Error('Translation service unavailable. Please try again later.');
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<{ code: string; name: string; nameNative: string }> {
    return [
      { code: 'en', name: 'English', nameNative: 'English' },
      { code: 'ar', name: 'Arabic', nameNative: 'العربية' },
      { code: 'es', name: 'Spanish', nameNative: 'Español' },
      { code: 'fr', name: 'French', nameNative: 'Français' },
      { code: 'de', name: 'German', nameNative: 'Deutsch' },
      { code: 'it', name: 'Italian', nameNative: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nameNative: 'Português' },
      { code: 'ru', name: 'Russian', nameNative: 'Русский' },
      { code: 'zh', name: 'Chinese', nameNative: '中文' },
      { code: 'ja', name: 'Japanese', nameNative: '日本語' },
      { code: 'ko', name: 'Korean', nameNative: '한국어' },
      { code: 'hi', name: 'Hindi', nameNative: 'हिन्दी' },
      { code: 'tr', name: 'Turkish', nameNative: 'Türkçe' },
      { code: 'pl', name: 'Polish', nameNative: 'Polski' },
      { code: 'nl', name: 'Dutch', nameNative: 'Nederlands' },
      { code: 'sv', name: 'Swedish', nameNative: 'Svenska' },
      { code: 'th', name: 'Thai', nameNative: 'ไทย' },
      { code: 'vi', name: 'Vietnamese', nameNative: 'Tiếng Việt' },
      { code: 'id', name: 'Indonesian', nameNative: 'Bahasa Indonesia' },
      { code: 'he', name: 'Hebrew', nameNative: 'עברית' },
    ];
  }

  /**
   * Get language name by code
   */
  getLanguageName(code: string): string {
    const languages = this.getSupportedLanguages();
    const language = languages.find(lang => lang.code === code);
    return language?.name || code.toUpperCase();
  }
}

export const translationService = new TranslationService();

// Export convenience functions
export async function translateMessage(
  text: string,
  sourceLanguage: string = 'auto',
  targetLanguage: string = 'en'
): Promise<TranslationResult> {
  return translationService.translateMessage(text, sourceLanguage, targetLanguage);
}

export async function detectLanguage(text: string): Promise<string> {
  return translationService.detectLanguage(text);
}







