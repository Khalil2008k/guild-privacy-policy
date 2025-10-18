import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  boldTextEnabled: boolean;
  grayscaleEnabled: boolean;
  invertColorsEnabled: boolean;
  reduceTransparencyEnabled: boolean;
  highContrastEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  announceNotifications: boolean;
  hapticFeedback: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  announce: (message: string, options?: { queue?: boolean }) => void;
  focusElement: (element: any) => void;
  isScreenReaderActive: boolean;
}

const defaultSettings: AccessibilitySettings = {
  screenReaderEnabled: false,
  reduceMotionEnabled: false,
  boldTextEnabled: false,
  grayscaleEnabled: false,
  invertColorsEnabled: false,
  reduceTransparencyEnabled: false,
  highContrastEnabled: false,
  fontSize: 'medium',
  announceNotifications: true,
  hapticFeedback: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(
  undefined
);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

const STORAGE_KEY = '@guild_accessibility_settings';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Monitor system accessibility settings
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let screenReaderSubscription: any;
    let reduceMotionSubscription: any;
    let boldTextSubscription: any;
    let grayscaleSubscription: any;
    let invertColorsSubscription: any;
    let reduceTransparencySubscription: any;

    const setupListeners = async () => {
      // Check initial states
      const [
        screenReaderEnabled,
        reduceMotionEnabled,
        boldTextEnabled,
        grayscaleEnabled,
        invertColorsEnabled,
        reduceTransparencyEnabled,
      ] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled?.() ?? false,
        AccessibilityInfo.isBoldTextEnabled?.() ?? false,
        AccessibilityInfo.isGrayscaleEnabled?.() ?? false,
        AccessibilityInfo.isInvertColorsEnabled?.() ?? false,
        AccessibilityInfo.isReduceTransparencyEnabled?.() ?? false,
      ]);

      setIsScreenReaderActive(screenReaderEnabled);
      
      setSettings(prev => ({
        ...prev,
        screenReaderEnabled,
        reduceMotionEnabled,
        boldTextEnabled,
        grayscaleEnabled,
        invertColorsEnabled,
        reduceTransparencyEnabled,
      }));

      // Set up listeners
      screenReaderSubscription = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        (enabled) => {
          setIsScreenReaderActive(enabled);
          updateSetting('screenReaderEnabled', enabled);
        }
      );

      if (AccessibilityInfo.addEventListener) {
        reduceMotionSubscription = AccessibilityInfo.addEventListener(
          'reduceMotionChanged',
          (enabled) => updateSetting('reduceMotionEnabled', enabled)
        );

        boldTextSubscription = AccessibilityInfo.addEventListener(
          'boldTextChanged',
          (enabled) => updateSetting('boldTextEnabled', enabled)
        );

        grayscaleSubscription = AccessibilityInfo.addEventListener(
          'grayscaleChanged',
          (enabled) => updateSetting('grayscaleEnabled', enabled)
        );

        invertColorsSubscription = AccessibilityInfo.addEventListener(
          'invertColorsChanged',
          (enabled) => updateSetting('invertColorsEnabled', enabled)
        );

        reduceTransparencySubscription = AccessibilityInfo.addEventListener(
          'reduceTransparencyChanged',
          (enabled) => updateSetting('reduceTransparencyEnabled', enabled)
        );
      }
    };

    setupListeners();

    return () => {
      screenReaderSubscription?.remove();
      reduceMotionSubscription?.remove();
      boldTextSubscription?.remove();
      grayscaleSubscription?.remove();
      invertColorsSubscription?.remove();
      reduceTransparencySubscription?.remove();
    };
  }, []);

  const updateSetting = async <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Save to storage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const announce = (message: string, options?: { queue?: boolean }) => {
    if (Platform.OS === 'web') {
      // Web accessibility announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', options?.queue ? 'polite' : 'assertive');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    } else {
      // Native accessibility announcement
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const focusElement = (element: any) => {
    if (Platform.OS === 'web') {
      element?.focus();
    } else {
      AccessibilityInfo.setAccessibilityFocus(element);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        announce,
        focusElement,
        isScreenReaderActive,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessibility hooks
export const useAnnounce = () => {
  const { announce } = useAccessibility();
  return announce;
};

export const useScreenReader = () => {
  const { isScreenReaderActive } = useAccessibility();
  return isScreenReaderActive;
};

export const useFontScale = () => {
  const { settings } = useAccessibility();
  
  const scales = {
    small: 0.85,
    medium: 1,
    large: 1.15,
    xlarge: 1.3,
  };
  
  return scales[settings.fontSize];
};

