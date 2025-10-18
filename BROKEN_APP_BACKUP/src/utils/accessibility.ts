// Accessibility utilities for React Native components

import { AccessibilityRole, AccessibilityState, AccessibilityValue } from 'react-native';

/**
 * Accessibility roles for different UI elements
 */
export const AccessibilityRoles = {
  BUTTON: 'button' as AccessibilityRole,
  LINK: 'link' as AccessibilityRole,
  TEXT: 'text' as AccessibilityRole,
  HEADER: 'header' as AccessibilityRole,
  IMAGE: 'image' as AccessibilityRole,
  SEARCH: 'search' as AccessibilityRole,
  TAB: 'tab' as AccessibilityRole,
  TAB_LIST: 'tablist' as AccessibilityRole,
  LIST: 'list' as AccessibilityRole,
  LIST_ITEM: 'button' as AccessibilityRole,
  MENU: 'menu' as AccessibilityRole,
  MENU_ITEM: 'menuitem' as AccessibilityRole,
  SWITCH: 'switch' as AccessibilityRole,
  CHECKBOX: 'checkbox' as AccessibilityRole,
  RADIO: 'radio' as AccessibilityRole,
  TEXTBOX: 'textbox' as AccessibilityRole,
  COMBOBOX: 'combobox' as AccessibilityRole,
  ALERT: 'alert' as AccessibilityRole,
  DIALOG: 'dialog' as AccessibilityRole,
  MODAL: 'modal' as AccessibilityRole,
  PROGRESSBAR: 'progressbar' as AccessibilityRole,
  SLIDER: 'slider' as AccessibilityRole,
  SPINBUTTON: 'spinbutton' as AccessibilityRole,
  TOOLBAR: 'toolbar' as AccessibilityRole,
  GRID: 'grid' as AccessibilityRole,
  CELL: 'cell' as AccessibilityRole,
} as const;

/**
 * Common accessibility traits
 */
export const AccessibilityTraits = {
  NONE: 'none',
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  SEARCH: 'search',
  IMAGE: 'image',
  SELECTED: 'selected',
  PLAYS_SOUND: 'playsSound',
  KEYBOARD_KEY: 'keyboardKey',
  STATIC_TEXT: 'staticText',
  SUMMARY_ELEMENT: 'summaryElement',
  NOT_ENABLED: 'notEnabled',
  UPDATES_FREQUENTLY: 'updatesFrequently',
  STARTS_MEDIA_SESSION: 'startsMediaSession',
  ADJUSTABLE: 'adjustable',
  ALLOWS_DIRECT_INTERACTION: 'allowsDirectInteraction',
  CAUSES_PAGE_TURN: 'causesPageTurn',
} as const;

/**
 * Creates accessibility props for buttons
 */
export const createButtonAccessibility = (
  label: string,
  hint?: string,
  disabled?: boolean,
  selected?: boolean
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.BUTTON,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: {
    disabled: disabled || false,
    selected: selected || false,
  } as AccessibilityState,
});

/**
 * Creates accessibility props for text inputs
 */
export const createTextInputAccessibility = (
  label: string,
  placeholder?: string,
  required?: boolean,
  invalid?: boolean,
  hint?: string
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.TEXTBOX,
  accessibilityLabel: label,
  accessibilityHint: hint || placeholder,
  accessibilityState: {
    disabled: false,
  } as AccessibilityState,
  accessibilityRequired: required,
  accessibilityInvalid: invalid,
});

/**
 * Creates accessibility props for headers
 */
export const createHeaderAccessibility = (
  text: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.HEADER,
  accessibilityLabel: text,
  accessibilityLevel: level,
});

/**
 * Creates accessibility props for images
 */
export const createImageAccessibility = (
  description: string,
  decorative: boolean = false
) => ({
  accessible: !decorative,
  accessibilityRole: decorative ? undefined : AccessibilityRoles.IMAGE,
  accessibilityLabel: decorative ? undefined : description,
});

/**
 * Creates accessibility props for links
 */
export const createLinkAccessibility = (
  label: string,
  hint?: string,
  visited?: boolean
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.LINK,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: {
    visited: visited || false,
  } as AccessibilityState,
});

/**
 * Creates accessibility props for switches/toggles
 */
export const createSwitchAccessibility = (
  label: string,
  value: boolean,
  hint?: string,
  disabled?: boolean
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.SWITCH,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: {
    checked: value,
    disabled: disabled || false,
  } as AccessibilityState,
});

/**
 * Creates accessibility props for checkboxes
 */
export const createCheckboxAccessibility = (
  label: string,
  checked: boolean,
  hint?: string,
  disabled?: boolean
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.CHECKBOX,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: {
    checked,
    disabled: disabled || false,
  } as AccessibilityState,
});

/**
 * Creates accessibility props for radio buttons
 */
export const createRadioAccessibility = (
  label: string,
  selected: boolean,
  hint?: string,
  disabled?: boolean
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.RADIO,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: {
    selected,
    disabled: disabled || false,
  } as AccessibilityState,
});

/**
 * Creates accessibility props for sliders
 */
export const createSliderAccessibility = (
  label: string,
  value: number,
  min: number,
  max: number,
  hint?: string
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.SLIDER,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityValue: {
    min,
    max,
    now: value,
  } as AccessibilityValue,
});

/**
 * Creates accessibility props for progress bars
 */
export const createProgressBarAccessibility = (
  label: string,
  value: number,
  min: number = 0,
  max: number = 100,
  hint?: string
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.PROGRESSBAR,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityValue: {
    min,
    max,
    now: value,
  } as AccessibilityValue,
});

/**
 * Creates accessibility props for lists
 */
export const createListAccessibility = (
  label: string,
  itemCount?: number
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.LIST,
  accessibilityLabel: label,
  accessibilityHint: itemCount ? `List with ${itemCount} items` : undefined,
});

/**
 * Creates accessibility props for list items
 */
export const createListItemAccessibility = (
  label: string,
  position?: number,
  total?: number,
  hint?: string
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.LIST_ITEM,
  accessibilityLabel: label,
  accessibilityHint: hint || (position && total ? `Item ${position} of ${total}` : undefined),
});

/**
 * Creates accessibility props for modals/dialogs
 */
export const createModalAccessibility = (
  title: string,
  hint?: string
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.DIALOG,
  accessibilityLabel: title,
  accessibilityHint: hint,
  accessibilityViewIsModal: true,
});

/**
 * Creates accessibility props for alerts
 */
export const createAlertAccessibility = (
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.ALERT,
  accessibilityLabel: `${type}: ${message}`,
  accessibilityLiveRegion: 'assertive' as const,
});

/**
 * Creates accessibility props for tabs
 */
export const createTabAccessibility = (
  label: string,
  selected: boolean,
  position: number,
  total: number,
  hint?: string
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.TAB,
  accessibilityLabel: label,
  accessibilityHint: hint || `Tab ${position} of ${total}`,
  accessibilityState: {
    selected,
  } as AccessibilityState,
});

/**
 * Creates accessibility props for search inputs
 */
export const createSearchAccessibility = (
  placeholder: string,
  value?: string,
  hint?: string
) => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.SEARCH,
  accessibilityLabel: value || placeholder,
  accessibilityHint: hint || 'Search field',
});

/**
 * Utility to announce messages to screen readers
 */
export const announceForAccessibility = (message: string) => {
  // This would use AccessibilityInfo.announceForAccessibility in React Native
  // For now, we'll log it for development
  if (__DEV__) {
    console.log(`[Accessibility Announcement]: ${message}`);
  }
  
  // In a real implementation:
  // import { AccessibilityInfo } from 'react-native';
  // AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Utility to check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  // This would use AccessibilityInfo.isScreenReaderEnabled in React Native
  // For now, return false for development
  if (__DEV__) {
    return false;
  }
  
  // In a real implementation:
  // import { AccessibilityInfo } from 'react-native';
  // return await AccessibilityInfo.isScreenReaderEnabled();
  return false;
};

/**
 * Utility to focus on an element for accessibility
 */
export const setAccessibilityFocus = (ref: any) => {
  if (ref && ref.current) {
    // This would use AccessibilityInfo.setAccessibilityFocus in React Native
    if (__DEV__) {
      console.log('[Accessibility]: Setting focus on element');
    }
    
    // In a real implementation:
    // import { AccessibilityInfo } from 'react-native';
    // AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
};

/**
 * Common accessibility guidelines and best practices
 */
export const AccessibilityGuidelines = {
  // Minimum touch target size (44x44 points on iOS, 48x48 dp on Android)
  MIN_TOUCH_TARGET_SIZE: 44,
  
  // Color contrast ratios (WCAG 2.1)
  CONTRAST_RATIOS: {
    AA_NORMAL: 4.5,
    AA_LARGE: 3,
    AAA_NORMAL: 7,
    AAA_LARGE: 4.5,
  },
  
  // Font size recommendations
  FONT_SIZES: {
    MIN_READABLE: 12,
    RECOMMENDED_MIN: 16,
    LARGE_TEXT: 18,
  },
  
  // Animation duration limits
  ANIMATION: {
    MAX_DURATION_MS: 5000, // Maximum 5 seconds for animations
    REDUCED_MOTION_DURATION_MS: 200, // Reduced motion preference
  },
} as const;

/**
 * Utility to validate accessibility compliance
 */
export const validateAccessibility = (props: any) => {
  const warnings: string[] = [];
  
  // Check for accessibility label
  if (props.accessible && !props.accessibilityLabel) {
    warnings.push('Accessible element missing accessibilityLabel');
  }
  
  // Check for button role without onPress
  if (props.accessibilityRole === 'button' && !props.onPress) {
    warnings.push('Button role without onPress handler');
  }
  
  // Check for minimum touch target size
  if (props.style && (props.style.width < AccessibilityGuidelines.MIN_TOUCH_TARGET_SIZE || 
                     props.style.height < AccessibilityGuidelines.MIN_TOUCH_TARGET_SIZE)) {
    warnings.push(`Touch target smaller than ${AccessibilityGuidelines.MIN_TOUCH_TARGET_SIZE}px`);
  }
  
  if (__DEV__ && warnings.length > 0) {
    console.warn('[Accessibility Warnings]:', warnings);
  }
  
  return warnings;
};

export default {
  AccessibilityRoles,
  AccessibilityTraits,
  createButtonAccessibility,
  createTextInputAccessibility,
  createHeaderAccessibility,
  createImageAccessibility,
  createLinkAccessibility,
  createSwitchAccessibility,
  createCheckboxAccessibility,
  createRadioAccessibility,
  createSliderAccessibility,
  createProgressBarAccessibility,
  createListAccessibility,
  createListItemAccessibility,
  createModalAccessibility,
  createAlertAccessibility,
  createTabAccessibility,
  createSearchAccessibility,
  announceForAccessibility,
  isScreenReaderEnabled,
  setAccessibilityFocus,
  AccessibilityGuidelines,
  validateAccessibility,
};
