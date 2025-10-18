
// Advanced i18n with RTL Support, Pluralization, and Gender-Specific Translations
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { logger } from '../utils/logger';

export interface I18nConfig {
  lng: string;
  fallbackLng: string;
  debug: boolean;
  interpolation: {
    escapeValue: boolean;
  };
  backend: {
    loadPath: string;
  };
  detection: {
    order: string[];
    caches: string[];
  };
}

export interface TranslationOptions {
  count?: number;
  gender?: 'male' | 'female' | 'neutral';
  context?: string;
  defaultValue?: string;
}

export class AdvancedI18nService {
  private config: I18nConfig;

  constructor() {
    this.config = {
      lng: 'en',
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false
      },
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage']
      }
    };

    this.initializeI18n();
  }

  private initializeI18n() {
    i18n
      .use(Backend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init(this.config);

    logger.info('I18n initialized', { lng: this.config.lng });
  }

  // Change language
  changeLanguage(lng: string): Promise<void> {
    return i18n.changeLanguage(lng);
  }

  // Get current language
  getCurrentLanguage(): string {
    return i18n.language;
  }

  // Get available languages
  getAvailableLanguages(): string[] {
    return ['en', 'ar', 'fr', 'es', 'de'];
  }

  // Get translation with advanced options
  getTranslation(key: string, options: TranslationOptions = {}): string {
    return i18n.t(key, {
      count: options.count,
      context: options.context,
      defaultValue: options.defaultValue,
      interpolation: {
        escapeValue: false
      }
    });
  }

  // Get translation with pluralization
  getTranslationWithPlural(key: string, count: number, options: Omit<TranslationOptions, 'count'> = {}): string {
    return i18n.t(key, { count, ...options });
  }

  // Get translation with gender
  getTranslationWithGender(key: string, gender: 'male' | 'female' | 'neutral', options: Omit<TranslationOptions, 'gender'> = {}): string {
    return i18n.t(key, { gender, ...options });
  }

  // Get translation with context
  getTranslationWithContext(key: string, context: string, options: Omit<TranslationOptions, 'context'> = {}): string {
    return i18n.t(key, { context, ...options });
  }

  // Format date with locale
  formatDate(date: Date, lng?: string, options?: Intl.DateTimeFormatOptions): string {
    const language = lng || this.getCurrentLanguage();
    return new Intl.DateTimeFormat(language, options).format(date);
  }

  // Format number with locale
  formatNumber(number: number, lng?: string, options?: Intl.NumberFormatOptions): string {
    const language = lng || this.getCurrentLanguage();
    return new Intl.NumberFormat(language, options).format(number);
  }

  // Format currency with locale
  formatCurrency(amount: number, currency: string, lng?: string): string {
    const language = lng || this.getCurrentLanguage();
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency
    }).format(amount);
  }

  // Format relative time
  formatRelativeTime(date: Date, lng?: string): string {
    const language = lng || this.getCurrentLanguage();
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second');
    } else if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    } else if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    } else {
      return rtf.format(diffInDays, 'day');
    }
  }

  // Get RTL direction
  getRTLDirection(lng?: string): 'ltr' | 'rtl' {
    const language = lng || this.getCurrentLanguage();
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  }

  // Get text direction
  getTextDirection(lng?: string): 'ltr' | 'rtl' {
    return this.getRTLDirection(lng);
  }

  // Get language name
  getLanguageName(lng: string): string {
    const languageNames: Record<string, string> = {
      en: 'English',
      ar: 'العربية',
      fr: 'Français',
      es: 'Español',
      de: 'Deutsch'
    };

    return languageNames[lng] || lng;
  }

  // Get language flag
  getLanguageFlag(lng: string): string {
    const flags: Record<string, string> = {
      en: '🇺🇸',
      ar: '🇸🇦',
      fr: '🇫🇷',
      es: '🇪🇸',
      de: '🇩🇪'
    };

    return flags[lng] || '🌐';
  }

  // Get language info
  getLanguageInfo(lng: string): {
    name: string;
    flag: string;
    direction: 'ltr' | 'rtl';
    nativeName: string;
    isRTL: boolean;
  } {
    return {
      name: this.getLanguageName(lng),
      flag: this.getLanguageFlag(lng),
      direction: this.getRTLDirection(lng),
      nativeName: this.getLanguageName(lng),
      isRTL: this.getRTLDirection(lng) === 'rtl'
    };
  }

  // Check if language supports gender
  supportsGender(lng?: string): boolean {
    const language = lng || this.getCurrentLanguage();
    const genderSupportingLanguages = ['ar', 'fr', 'es', 'de'];
    return genderSupportingLanguages.includes(language);
  }

  // Check if language supports pluralization
  supportsPluralization(lng?: string): boolean {
    const language = lng || this.getCurrentLanguage();
    // Most languages support pluralization
    return true;
  }
}

// Language selector component
export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);
  const [isOpen, setIsOpen] = React.useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <View style={styles.languageSelector}>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.languageText}>
          {languages.find(l => l.code === currentLanguage)?.flag} {languages.find(l => l.code === currentLanguage)?.name}
        </Text>
        <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.languageDropdown}>
          {languages.map(language => (
            <TouchableOpacity
              key={language.code}
              style={styles.languageOption}
              onPress={() => handleLanguageChange(language.code)}
            >
              <Text style={styles.languageOptionText}>
                {language.flag} {language.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  languageSelector: {
    position: 'relative',
    zIndex: 1000
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  languageText: {
    flex: 1,
    fontSize: 16
  },
  arrow: {
    fontSize: 12,
    color: '#666'
  },
  languageDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  languageOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  languageOptionText: {
    fontSize: 16
  }
});

// Export i18n service instance
export const advancedI18nService = new AdvancedI18nService();
