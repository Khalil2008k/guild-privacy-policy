import React, { ReactNode } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useI18n } from '@/contexts/I18nProvider';

interface AccessibilityWrapperProps {
  children: ReactNode;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'header' | 'link' | 'text' | 'image' | 'adjustable' | 'alert';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
    busy?: boolean;
  };
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  testID?: string;
}

interface FocusableButtonProps extends AccessibilityWrapperProps {
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  style?: any;
}

// Enhanced TouchableOpacity with better accessibility
export function AccessibleTouchable(props: FocusableButtonProps) {
  const { t } = useI18n();

  const {
    children,
    accessible = true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole = 'button',
    accessibilityState,
    importantForAccessibility = 'yes',
    testID,
    onPress,
    onFocus,
    onBlur,
    disabled = false,
    style,
    ...otherProps
  } = props;

  return (
    <TouchableOpacity
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      importantForAccessibility={importantForAccessibility}
      testID={testID}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      style={style}
      {...otherProps}
    >
      {children}
    </TouchableOpacity>
  );
}

// Enhanced Text with accessibility features
export function AccessibleText(props: {
  children: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'text' | 'header';
  importantForAccessibility?: 'auto' | 'yes' | 'no';
  style?: any;
}) {
  const {
    children,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole = 'text',
    importantForAccessibility = 'yes',
    style,
    ...otherProps
  } = props;

  return (
    <Text
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      importantForAccessibility={importantForAccessibility}
      style={style}
      {...otherProps}
    >
      {children}
    </Text>
  );
}

// Screen reader announcement utility
export function announceForAccessibility(message: string, priority: 'polite' | 'assertive' = 'polite') {
  // This would integrate with React Native's AccessibilityInfo
  // For now, we'll use a basic implementation
  if (typeof window !== 'undefined') {
    // Web implementation
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    // Clean up after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }
}

// Skip link component for web accessibility
export function SkipLink({ href, children }: { href: string; children: ReactNode }) {
  if (typeof window === 'undefined') return null;

  return (
    <a
      href={href}
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 999,
        backgroundColor: '#000',
        color: '#fff',
        padding: '8px',
        textDecoration: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '10px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px';
      }}
    >
      {children}
    </a>
  );
}

// Focus trap utility for modals and dialogs
export function useFocusTrap(ref: React.RefObject<any>, isActive: boolean = true) {
  React.useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;

    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    function handleEscapeKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Handle escape key for closing modal
        // This would be passed as a prop to the component
      }
    }

    element.addEventListener('keydown', handleTabKey);
    element.addEventListener('keydown', handleEscapeKey);

    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      element.removeEventListener('keydown', handleTabKey);
      element.removeEventListener('keydown', handleEscapeKey);
    };
  }, [ref, isActive]);
}

// High contrast mode detector
export function useHighContrastMode(): boolean {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

// Reduced motion preference detector
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Color scheme preference detector
export function useColorScheme(): 'light' | 'dark' | null {
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark' | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
}
