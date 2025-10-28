import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Shield, Users, ChevronRight } from 'lucide-react-native';
import Button from '../../../components/Button';

const { width, height } = Dimensions.get('window');

const OnboardingScreen1: React.FC = () => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    router.push('/(auth)/onboarding/2');
  };

  const handleSkip = () => {
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top + 20,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }]}>
        <View style={[styles.logoHeader, {
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }]}>
          <Shield size={24} color={theme.primary} />
          <Text style={[styles.logoText, { color: theme.primary }]}>GUILD</Text>
        </View>
        <Button
          title={t('skip')}
          onPress={handleSkip}
          variant="ghost"
          size="small"
          style={styles.skipButton}
        />
      </View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Users size={80} color={theme.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('welcomeToGuild')}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t('connectWithProfessionals')}
        </Text>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <View style={[styles.dot, { backgroundColor: theme.surface }]} />
          <View style={[styles.dot, { backgroundColor: theme.surface }]} />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={t('next')}
          onPress={handleNext}
          variant="primary"
          size="large"
          rightIcon={<ChevronRight size={20} color={theme.buttonText} />}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Signika Negative SC',
    letterSpacing: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    maxWidth: 300,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  nextButton: {
    width: '100%',
    maxWidth: 300,
  },
});

export default OnboardingScreen1;
