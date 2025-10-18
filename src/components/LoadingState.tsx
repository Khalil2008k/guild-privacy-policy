import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { useAccessibility } from '../contexts/AccessibilityContext';

const { width } = Dimensions.get('window');

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  progress?: number; // 0-1
  showProgress?: boolean;
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  fullScreen?: boolean;
}

/**
 * Comprehensive loading state component with multiple styles
 * Supports progress tracking, skeleton screens, and accessibility
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  subMessage,
  progress,
  showProgress = false,
  type = 'spinner',
  fullScreen = false,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { announce, settings } = useAccessibility();
  
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const dotsAnimation = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Announce loading state to screen readers
  useEffect(() => {
    const loadingMessage = message || t('loading');
    announce(loadingMessage);
    
    // Announce progress updates
    if (showProgress && progress !== undefined) {
      const progressPercentage = Math.round(progress * 100);
      announce(`${progressPercentage}% ${t('complete')}`, { queue: true });
    }
  }, [message, progress, showProgress]);

  // Spinner animation
  useEffect(() => {
    if (type !== 'spinner') return;

    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: settings.reduceMotionEnabled ? 3000 : 1000,
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => spin.stop();
  }, [type, spinValue, settings.reduceMotionEnabled]);

  // Pulse animation
  useEffect(() => {
    if (type !== 'pulse') return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: settings.reduceMotionEnabled ? 2000 : 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: settings.reduceMotionEnabled ? 2000 : 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [type, pulseValue, settings.reduceMotionEnabled]);

  // Dots animation
  useEffect(() => {
    if (type !== 'dots') return;

    const animations = dotsAnimation.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: settings.reduceMotionEnabled ? 800 : 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: settings.reduceMotionEnabled ? 800 : 400,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach(anim => anim.start());

    return () => animations.forEach(anim => anim.stop());
  }, [type, dotsAnimation, settings.reduceMotionEnabled]);

  const renderSpinner = () => {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.spinner,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <View style={[styles.spinnerOuter, { borderColor: theme.primary }]} />
        <View
          style={[
            styles.spinnerInner,
            { borderTopColor: theme.primary, borderRightColor: theme.primary },
          ]}
        />
      </Animated.View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(3)].map((_, index) => (
        <LinearGradient
          key={index}
          colors={[theme.surface, theme.background, theme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.skeletonItem,
            { opacity: 0.7 - index * 0.1 },
          ]}
        />
      ))}
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {dotsAnimation.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: theme.primary,
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderPulse = () => (
    <Animated.View
      style={[
        styles.pulse,
        {
          backgroundColor: theme.primary,
          opacity: pulseValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
          transform: [
            {
              scale: pulseValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            },
          ],
        },
      ]}
    />
  );

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'skeleton':
        return renderSkeleton();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  const containerStyle = fullScreen
    ? [styles.fullScreenContainer, { backgroundColor: theme.background }]
    : styles.inlineContainer;

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message || t('loading')}
      accessibilityValue={
        showProgress && progress !== undefined
          ? { now: progress * 100, min: 0, max: 100 }
          : undefined
      }
    >
      <View style={styles.content}>
        {renderLoader()}

        {message && (
          <Text style={[styles.message, { color: theme.text }]}>
            {message}
          </Text>
        )}

        {subMessage && (
          <Text style={[styles.subMessage, { color: theme.textSecondary }]}>
            {subMessage}
          </Text>
        )}

        {showProgress && progress !== undefined && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.surface },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${progress * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  // Spinner styles
  spinner: {
    width: 48,
    height: 48,
    marginBottom: 16,
  },
  spinnerOuter: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    opacity: 0.3,
  },
  spinnerInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  // Skeleton styles
  skeletonContainer: {
    width: width * 0.8,
    maxWidth: 300,
  },
  skeletonItem: {
    height: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  // Dots styles
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Pulse styles
  pulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  // Text styles
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  // Progress styles
  progressContainer: {
    width: '100%',
    maxWidth: 200,
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default LoadingState;

