import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Briefcase, Users, Shield, Zap } from 'lucide-react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export default function WelcomeTutorialScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const progressAnim = useState(new Animated.Value(0))[0];
  const stepTranslateX = useRef(new Animated.Value(0)).current;

  // Tutorial steps data
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      icon: 'rocket',
      title: t('tutorial.welcome.title'),
      description: t('tutorial.welcome.description'),
      features: [
        t('tutorial.welcome.feature1'),
        t('tutorial.welcome.feature2'),
        t('tutorial.welcome.feature3'),
      ]
    },
    {
      id: 'jobs',
      icon: 'briefcase',
      title: t('tutorial.jobs.title'),
      description: t('tutorial.jobs.description'),
      features: [
        t('tutorial.jobs.feature1'),
        t('tutorial.jobs.feature2'),
        t('tutorial.jobs.feature3'),
      ]
    },
    {
      id: 'guilds',
      icon: 'people',
      title: t('tutorial.guilds.title'),
      description: t('tutorial.guilds.description'),
      features: [
        t('tutorial.guilds.feature1'),
        t('tutorial.guilds.feature2'),
        t('tutorial.guilds.feature3'),
      ]
    },
    {
      id: 'ranking',
      icon: 'trophy',
      title: t('tutorial.ranking.title'),
      description: t('tutorial.ranking.description'),
      features: [
        t('tutorial.ranking.feature1'),
        t('tutorial.ranking.feature2'),
        t('tutorial.ranking.feature3'),
      ]
    },
    {
      id: 'ready',
      icon: 'checkmark-circle',
      title: t('tutorial.ready.title'),
      description: t('tutorial.ready.description'),
      features: [
        t('tutorial.ready.feature1'),
        t('tutorial.ready.feature2'),
        t('tutorial.ready.feature3'),
      ]
    }
  ];

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / tutorialSteps.length,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Slide animation
      Animated.sequence([
        Animated.timing(stepTranslateX, {
          toValue: -SCREEN_WIDTH,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: SCREEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Slide animation
      Animated.sequence([
        Animated.timing(stepTranslateX, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: -SCREEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 200);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    CustomAlertService.showConfirmation(
      t('tutorial.skipTitle'),
      t('tutorial.skipMessage'),
      () => router.replace('/(main)/home'),
      undefined,
      isRTL
    );
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Simulate saving tutorial completion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      CustomAlertService.showSuccess(
        t('tutorial.completeTitle'),
        t('tutorial.completeMessage'),
        [
          {
            text: t('tutorial.getStarted'),
            style: 'default',
            onPress: () => router.replace('/(main)/home')
          }
        ]
      );
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('tutorial.completeError'));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDotPress = (index: number) => {
    if (index !== currentStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(index);
    }
  };

  const currentStepData = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isCompleting}
        >
          <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
            {t('tutorial.skip')}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <MaterialIcons name="explore" size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('tutorial.title')}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={[styles.stepCounter, { color: theme.textSecondary }]}>
            {currentStep + 1}/{tutorialSteps.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: theme.surface }]}>
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              backgroundColor: theme.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              })
            }
          ]} 
        />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Step Content */}
        <Animated.View 
          style={[
            styles.stepContainer,
            { transform: [{ translateX: stepTranslateX }] }
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons 
              name={currentStepData.icon as any} 
              size={64} 
              color={theme.primary} 
            />
          </View>

          {/* Content */}
          <View style={[styles.stepContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
              {currentStepData.title}
            </Text>
            
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              {currentStepData.description}
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {currentStepData.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureBullet, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={12} color={theme.buttonText} />
                  </View>
                  <Text style={[
                    styles.featureText, 
                    { 
                      color: theme.textSecondary,
                      textAlign: isRTL ? 'right' : 'left'
                    }
                  ]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Navigation Dots */}
        <View style={styles.dotsContainer}>
          {tutorialSteps.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentStep ? theme.primary : theme.border,
                  width: index === currentStep ? 24 : 8,
                }
              ]}
              onPress={() => handleDotPress(index)}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.previousButton,
              { 
                backgroundColor: currentStep === 0 ? theme.textSecondary + '20' : theme.surface,
                borderColor: currentStep === 0 ? theme.textSecondary : theme.border,
                opacity: currentStep === 0 ? 0.5 : 1
              }
            ]}
            onPress={handlePrevious}
            disabled={currentStep === 0 || isCompleting}
          >
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={20} 
              color={currentStep === 0 ? theme.textSecondary : theme.textPrimary} 
            />
            <Text style={[
              styles.previousButtonText, 
              { color: currentStep === 0 ? theme.textSecondary : theme.textPrimary }
            ]}>
              {t('tutorial.previous')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: theme.primary }
            ]}
            onPress={handleNext}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <>
                <Text style={[styles.nextButtonText, { color: theme.buttonText }]}>
                  {isLastStep ? t('tutorial.getStarted') : t('tutorial.next')}
                </Text>
                <Ionicons 
                  name={isLastStep ? "checkmark" : (isRTL ? "arrow-back" : "arrow-forward")} 
                  size={20} 
                  color={theme.buttonText} 
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  headerRight: {
    padding: 8,
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  progressContainer: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepContent: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  previousButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});



