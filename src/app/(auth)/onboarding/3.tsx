import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Shield, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Button from '../../../components/Button';

const { width, height } = Dimensions.get('window');

const OnboardingScreen3: React.FC = () => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    router.replace('/(auth)/welcome');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top + 20,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }]}>
        <Button
          onPress={handleBack}
          variant="ghost"
          size="small"
          leftIcon={isRTL ? <ChevronRight size={24} color={theme.textSecondary} /> : <ChevronLeft size={24} color={theme.textSecondary} />}
          style={styles.backButton}
        />
        <View style={[styles.logoHeader, {
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }]}>
          <Shield size={24} color={theme.primary} />
          <Text style={[styles.logoText, { color: theme.primary }]}>GUILD</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MessageCircle size={80} color={theme.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('connectAndCollaborate')}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t('chatDirectly')}
        </Text>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, { backgroundColor: theme.surface }]} />
          <View style={[styles.dot, { backgroundColor: theme.surface }]} />
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title={t('getStarted')}
          onPress={handleGetStarted}
          variant="primary"
          size="large"
          rightIcon={isRTL ? <ChevronLeft size={20} color={theme.buttonText} /> : <ChevronRight size={20} color={theme.buttonText} />}
          style={styles.getStartedButton}
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
  backButton: {
    // Button component handles its own styling
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
  getStartedButton: {
    width: '100%',
    maxWidth: 300,
  },
});

export default OnboardingScreen3;
