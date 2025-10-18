import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import i18n from '../i18n/index';

interface I18nContextType {
  language: string;
  isRTL: boolean;
  changeLanguage: (lang: 'en' | 'ar') => Promise<void>;
  t: (key: string, options?: any) => string;
  appKey: number; // For forcing re-renders
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode | ((context: I18nContextType) => ReactNode);
  onReady?: () => void;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, onReady }) => {
  console.log(`🚀 I18nProvider [${Platform.OS}]: Component function called`);
  console.log(`🚀 I18nProvider [${Platform.OS}]: i18n object check:`, { 
    type: typeof i18n, 
    isInitialized: i18n?.isInitialized,
    language: i18n?.language,
    hasChangeLanguage: typeof i18n?.changeLanguage === 'function'
  });
  
  const [appKey, setAppKey] = useState(0);
  const [language, setLanguage] = useState('en'); // Start with default
  const [isRTL, setIsRTL] = useState(false); // Start with default
  const [isReady, setIsReady] = useState(false);
  
  console.log('🚀 I18nProvider render:', { language, isRTL, isReady });

  // Initialize i18n and RTL on mount - EMERGENCY FAST INIT
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('I18nProvider: EMERGENCY FAST initialization...');
        
        // EMERGENCY: Don't wait, initialize immediately
        const currentLang = i18n.language || 'en';
        const currentRTL = currentLang === 'ar';
        
        console.log('I18nProvider: Setting initial language:', { currentLang, currentRTL });
        
        setLanguage(currentLang);
        setIsRTL(currentRTL);
        
        // Initialize RTL without calling external functions
        try {
          const { I18nManager } = require('react-native');
          I18nManager.forceRTL(currentRTL);
          I18nManager.allowRTL(true);
          console.log('I18nProvider: RTL initialized:', { isRTL: currentRTL });
        } catch (rtlError) {
          console.warn('I18nProvider: RTL initialization failed:', rtlError);
        }
        
        // EMERGENCY: Mark as ready immediately
        setIsReady(true);
        console.log('I18nProvider: EMERGENCY initialization complete');
        
        // Notify parent that provider is ready
        if (onReady) {
          onReady();
        }
      } catch (error) {
        console.error('I18nProvider: Initialization error:', error);
        // Set defaults and mark as ready to prevent blocking
        setLanguage('en');
        setIsRTL(false);
        setIsReady(true);
        
        // Notify parent even on error to prevent blocking
        if (onReady) {
          onReady();
        }
      }
    };

    initialize();
  }, [onReady]);

  // Update language state when i18n language changes
  useEffect(() => {
    const currentLang = i18n.language || 'en';
    if (currentLang !== language) {
      console.log('Syncing language state:', currentLang);
      setLanguage(currentLang);
      setIsRTL(currentLang === 'ar');
    }
  }, [language]);

  const handleChangeLanguage = async (lang: 'en' | 'ar') => {
    console.log('I18nProvider: Changing language to:', lang);
    try {
      // Change the i18n language
      await i18n.changeLanguage(lang);
      
      // Save to AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('user_language', lang);
      } catch (storageError) {
        console.warn('Failed to save language preference:', storageError);
      }
      
      // Update RTL settings
      const isRTL = lang === 'ar';
      try {
        const { I18nManager } = require('react-native');
        I18nManager.forceRTL(isRTL);
        I18nManager.allowRTL(true);
      } catch (rtlError) {
        console.warn('Failed to update RTL settings:', rtlError);
      }
      
      // Update state
      setLanguage(lang);
      setIsRTL(isRTL);
      setAppKey(prev => prev + 1); // Force re-render
      
      console.log('I18nProvider: Language change completed:', { lang, isRTL });
    } catch (error) {
      console.error('I18nProvider: Language change failed:', error);
    }
  };

  const contextValue: I18nContextType = {
    language,
    isRTL,
    changeLanguage: handleChangeLanguage,
    t: (key: string, options?: any) => i18n.t(key, options),
    appKey,
  };

  // Provide context even during initialization with default values
  if (!isReady) {
    const loadingContextValue: I18nContextType = {
      language: 'en',
      isRTL: false,
      changeLanguage: async () => {},
      t: (key: string) => key,
      appKey: 0,
    };
    
    return (
      <I18nextProvider i18n={i18n}>
        <I18nContext.Provider value={loadingContextValue}>
          {typeof children === 'function' ? children(loadingContextValue) : children}
        </I18nContext.Provider>
      </I18nextProvider>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={contextValue}>
        {typeof children === 'function' ? children(contextValue) : children}
      </I18nContext.Provider>
    </I18nextProvider>
  );
};

// Hook to use the I18n context
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    console.warn('useI18n called outside I18nProvider, using fallback values');
    // Return fallback values to prevent crashes during initialization
    return {
      language: 'en',
      isRTL: false,
      changeLanguage: async () => {
        console.warn('changeLanguage called but I18nProvider not available');
      },
      t: (key: string) => {
        console.warn(`Translation requested for "${key}" but I18nProvider not available`);
        return key; // Return the key as fallback
      },
      appKey: 0,
    };
  }
  return context;
};

// Alternative hook using react-i18next directly (for components that don't need RTL info)
export const useI18nTranslation = () => {
  const { t, i18n } = useTranslation();
  return {
    t,
    language: i18n.language,
    changeLanguage: (lang: 'en' | 'ar') => i18n.changeLanguage(lang),
    isRTL: i18n.language === 'ar',
  };
};
