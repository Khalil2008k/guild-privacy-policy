import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';

// Import translation files
import en from '../locales/en.json';
import ar from '../locales/ar.json';

const STORAGE_KEY = 'user_language';

// Language detector that checks AsyncStorage first, then device locale
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // First check if user has a saved preference
      const storedLang = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLang && (storedLang === 'ar' || storedLang === 'en')) {
        callback(storedLang);
        return;
      }

      // Fall back to device locale
      const deviceLang = Localization.locale.split('-')[0];
      const supportedLang = deviceLang === 'ar' ? 'ar' : 'en';
      callback(supportedLang);
    } catch (error) {
      console.error('Language detection error:', error);
      callback('en'); // Default fallback
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

// Initialize i18next
console.log(`🔍 i18n module [${Platform.OS}]: Starting initialization...`);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    lng: 'en', // Set default language immediately
    debug: false, // Disable debug to reduce noise
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v3', // Required for React Native
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  })
  .then(() => {
    console.log(`✅ i18n [${Platform.OS}] initialized successfully`);
  })
  .catch((error) => {
    console.error(`❌ i18n [${Platform.OS}] initialization failed:`, error);
  });

console.log('i18n setup complete (async initialization in progress)');

// Function to change language with smooth RTL switching
export const changeLanguage = async (lang: 'en' | 'ar'): Promise<void> => {
  try {
    // Change the language
    await i18n.changeLanguage(lang);
    
    // Save to storage
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    
    // Update RTL settings
    const isRTL = lang === 'ar';
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(true);
    
    console.log(`Language changed to: ${lang}, RTL: ${isRTL}`);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  return getCurrentLanguage() === 'ar';
};

// Initialize RTL on app start
export const initializeRTL = async (): Promise<void> => {
  try {
    const currentLang = i18n.language || 'en';
    const shouldBeRTL = currentLang === 'ar';
    I18nManager.forceRTL(shouldBeRTL);
    I18nManager.allowRTL(true);
    console.log('RTL initialized:', { language: currentLang, isRTL: shouldBeRTL });
  } catch (error) {
    console.error('Error initializing RTL:', error);
  }
};

export default i18n;
