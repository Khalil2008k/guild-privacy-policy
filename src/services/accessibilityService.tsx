
// Advanced Accessibility Implementation with WCAG 2.2 Compliance
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { logger } from '../utils/logger';

export interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceOverEnabled: boolean;
  talkBackEnabled: boolean;
  colorBlindSupport: boolean;
  focusManagement: boolean;
}

export interface AccessibilityAudit {
  componentName: string;
  violations: AccessibilityViolation[];
  score: number;
  recommendations: string[];
}

export interface AccessibilityViolation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  element: string;
  fix: string;
}

export class AccessibilityService {
  private config: AccessibilityConfig = {
    screenReaderEnabled: false,
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    voiceOverEnabled: false,
    talkBackEnabled: false,
    colorBlindSupport: false,
    focusManagement: true
  };

  private auditResults: Map<string, AccessibilityAudit> = new Map();

  constructor() {
    this.initializeAccessibility();
  }

  private async initializeAccessibility() {
    try {
      // Check screen reader status
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.config.screenReaderEnabled = screenReaderEnabled;

      // Check for high contrast
      const highContrast = await AccessibilityInfo.isHighContrastEnabled();
      this.config.highContrast = highContrast;

      // Check for large text
      const largeText = await AccessibilityInfo.isLargeTextEnabled();
      this.config.largeText = largeText;

      // Check for reduced motion
      const reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
      this.config.reducedMotion = reducedMotion;

      // Platform-specific checks
      if (Platform.OS === 'ios') {
        this.config.voiceOverEnabled = screenReaderEnabled;
      } else if (Platform.OS === 'android') {
        this.config.talkBackEnabled = screenReaderEnabled;
      }

      logger.info('Accessibility initialized', this.config);
    } catch (error: any) {
      logger.error('Failed to initialize accessibility', { error: error.message });
    }
  }

  // Get accessibility config
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // Update accessibility config
  updateConfig(updates: Partial<AccessibilityConfig>) {
    this.config = { ...this.config, ...updates };
    logger.info('Accessibility config updated', this.config);
  }

  // Announce to screen reader
  announceForAccessibility(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (this.config.screenReaderEnabled) {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: priority === 'assertive'
      });
    }
  }

  // Set accessibility focus
  setAccessibilityFocus(reactTag: number) {
    if (this.config.screenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }

  // Perform accessibility audit
  async performAccessibilityAudit(componentName: string, componentTree: any): Promise<AccessibilityAudit> {
    const violations: AccessibilityViolation[] = [];

    // Check for common accessibility issues
    await this.checkAltText(componentTree, violations);
    await this.checkKeyboardNavigation(componentTree, violations);
    await this.checkColorContrast(componentTree, violations);
    await this.checkFocusManagement(componentTree, violations);
    await this.checkScreenReaderSupport(componentTree, violations);
    await this.checkMotionPreferences(componentTree, violations);

    const score = this.calculateAccessibilityScore(violations);
    const recommendations = this.generateRecommendations(violations);

    const audit: AccessibilityAudit = {
      componentName,
      violations,
      score,
      recommendations
    };

    this.auditResults.set(componentName, audit);

    logger.info('Accessibility audit completed', {
      componentName,
      score,
      violationsCount: violations.length
    });

    return audit;
  }

  private async checkAltText(componentTree: any, violations: AccessibilityViolation[]) {
    // Check for images without alt text
    const imagesWithoutAlt = this.findComponentsWithoutProp(componentTree, 'Image', 'alt');
    imagesWithoutAlt.forEach(() => {
      violations.push({
        rule: 'alt-text-required',
        severity: 'error',
        description: 'Images must have alt text for screen readers',
        element: 'Image',
        fix: 'Add alt prop with descriptive text'
      });
    });
  }

  private async checkKeyboardNavigation(componentTree: any, violations: AccessibilityViolation[]) {
    // Check for interactive elements without keyboard support
    const interactiveElements = ['TouchableOpacity', 'Button', 'Pressable'];
    interactiveElements.forEach(element => {
      const elementsWithoutKeyHandlers = this.findComponentsWithoutProp(componentTree, element, 'onKeyPress');
      elementsWithoutKeyHandlers.forEach(() => {
        violations.push({
          rule: 'keyboard-navigation',
          severity: 'warning',
          description: 'Interactive elements should support keyboard navigation',
          element,
          fix: 'Add onKeyPress handler or make element focusable'
        });
      });
    });
  }

  private async checkColorContrast(componentTree: any, violations: AccessibilityViolation[]) {
    // Check for insufficient color contrast
    const lowContrastElements = this.findLowContrastElements(componentTree);
    lowContrastElements.forEach(() => {
      violations.push({
        rule: 'color-contrast',
        severity: 'error',
        description: 'Text must have sufficient contrast ratio (4.5:1 minimum)',
        element: 'Text',
        fix: 'Increase contrast or use different colors'
      });
    });
  }

  private async checkFocusManagement(componentTree: any, violations: AccessibilityViolation[]) {
    // Check for proper focus management
    const focusableElements = this.findFocusableElements(componentTree);
    if (focusableElements.length === 0) {
      violations.push({
        rule: 'focus-management',
        severity: 'warning',
        description: 'No focusable elements found',
        element: 'Component',
        fix: 'Add focusable elements or focus management'
      });
    }
  }

  private async checkScreenReaderSupport(componentTree: any, violations: AccessibilityViolation[]) {
    // Check for screen reader compatibility
    const elementsWithoutLabels = this.findComponentsWithoutProp(componentTree, 'View', 'accessibilityLabel');
    elementsWithoutLabels.forEach(() => {
      violations.push({
        rule: 'screen-reader-support',
        severity: 'warning',
        description: 'Interactive elements should have accessibility labels',
        element: 'Interactive Element',
        fix: 'Add accessibilityLabel prop'
      });
    });
  }

  private async checkMotionPreferences(componentTree: any, violations: AccessibilityViolation[]) {
    // Check for motion preference handling
    const animatedElements = this.findAnimatedElements(componentTree);
    animatedElements.forEach(() => {
      violations.push({
        rule: 'motion-preferences',
        severity: 'info',
        description: 'Consider reducing motion for users with motion sensitivity',
        element: 'Animation',
        fix: 'Add prefers-reduced-motion support'
      });
    });
  }

  private findComponentsWithoutProp(componentTree: any, componentType: string, propName: string): any[] {
    // Simplified implementation - in reality this would traverse the component tree
    return [];
  }

  private findLowContrastElements(componentTree: any): any[] {
    // Simplified implementation - would check actual color contrast ratios
    return [];
  }

  private findFocusableElements(componentTree: any): any[] {
    // Find elements that can receive focus
    return [];
  }

  private findAnimatedElements(componentTree: any): any[] {
    // Find elements with animations
    return [];
  }

  private calculateAccessibilityScore(violations: AccessibilityViolation[]): number {
    let score = 100;

    violations.forEach(violation => {
      switch (violation.severity) {
        case 'error':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }

  private generateRecommendations(violations: AccessibilityViolation[]): string[] {
    return violations.map(violation => violation.fix);
  }

  // Get audit results
  getAuditResults(componentName: string): AccessibilityAudit | undefined {
    return this.auditResults.get(componentName);
  }

  // Get overall accessibility score
  getOverallAccessibilityScore(): {
    score: number;
    componentsAudited: number;
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
  } {
    const audits = Array.from(this.auditResults.values());

    if (audits.length === 0) {
      return {
        score: 0,
        componentsAudited: 0,
        totalViolations: 0,
        violationsBySeverity: {}
      };
    }

    const totalScore = audits.reduce((sum, audit) => sum + audit.score, 0);
    const averageScore = totalScore / audits.length;

    const totalViolations = audits.reduce((sum, audit) => sum + audit.violations.length, 0);

    const violationsBySeverity: Record<string, number> = {};
    audits.forEach(audit => {
      audit.violations.forEach(violation => {
        violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
      });
    });

    return {
      score: Math.round(averageScore),
      componentsAudited: audits.length,
      totalViolations,
      violationsBySeverity
    };
  }
}

// Accessible component wrapper
export function AccessibleComponent({
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  onAccessibilityTap,
  onMagicTap,
  testID
}: {
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: any;
  onAccessibilityTap?: () => void;
  onMagicTap?: () => void;
  testID?: string;
}) {
  return (
    <View
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      onAccessibilityTap={onAccessibilityTap}
      onMagicTap={onMagicTap}
      testID={testID}
    >
      {children}
    </View>
  );
}

// High contrast theme support
export const useHighContrastTheme = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  useEffect(() => {
    const checkHighContrast = async () => {
      try {
        const highContrast = await AccessibilityInfo.isHighContrastEnabled();
        setIsHighContrast(highContrast);
      } catch (error) {
        console.error('Failed to check high contrast:', error);
      }
    };

    checkHighContrast();

    const subscription = AccessibilityInfo.addEventListener(
      'highContrastChanged',
      setIsHighContrast
    );

    return () => subscription?.remove();
  }, []);

  return isHighContrast;
};

// Reduced motion support
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const motion = await AccessibilityInfo.isReduceMotionEnabled();
        setReducedMotion(motion);
      } catch (error) {
        console.error('Failed to check reduced motion:', error);
      }
    };

    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    return () => subscription?.remove();
  }, []);

  return reducedMotion;
};

// Screen reader testing component
export function ScreenReaderTestComponent() {
  const [announcements, setAnnouncements] = React.useState<string[]>([]);

  const announce = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    AccessibilityInfo.announceForAccessibility(message);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Screen Reader Test
      </Text>

      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginBottom: 10 }}
        onPress={() => announce('Button pressed')}
        accessibilityLabel="Test button"
        accessibilityHint="Press to test screen reader announcement"
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Test Announcement
        </Text>
      </TouchableOpacity>

      <View>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>Announcements:</Text>
        {announcements.map((announcement, index) => (
          <Text key={index} style={{ marginBottom: 5 }}>
            {announcement}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Export accessibility service instance
export const accessibilityService = new AccessibilityService();
