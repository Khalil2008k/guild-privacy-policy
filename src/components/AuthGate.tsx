import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { useAuth } from '../contexts/AuthContext';
import RTLText from '../app/components/primitives/RTLText';

const FONT_FAMILY = 'SignikaNegative_400Regular';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  // Show loading while checking auth state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Ionicons name="shield" size={40} color="white" />
          </View>
          <RTLText style={[styles.logoText, { color: theme.textPrimary }]}>
            GUILD
          </RTLText>
          <RTLText style={[styles.loadingText, { color: theme.textSecondary }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </RTLText>
        </View>
      </View>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.authContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: 'transparent' }]}>
              <Ionicons name="shield" size={60} color="white" />
            </View>
            <RTLText style={[styles.logoText, { color: theme.textPrimary }]}>
              GUILD
            </RTLText>
            <RTLText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isRTL ? 'منصة العمل الحر الرائدة' : 'The leading freelance platform'}
            </RTLText>
          </View>

          {/* Welcome Message */}
          <View style={styles.welcomeContainer}>
            <RTLText style={[styles.welcomeTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'مرحباً بك في GUILD' : 'Welcome to GUILD'}
            </RTLText>
            <RTLText style={[styles.welcomeText, { color: theme.textSecondary }]}>
              {isRTL 
                ? 'انضم إلى آلاف المحترفين واكتشف فرص عمل مذهلة'
                : 'Join thousands of professionals and discover amazing opportunities'
              }
            </RTLText>
          </View>

          {/* Auth Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.signUpButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.8}
            >
              <RTLText style={styles.signUpButtonText}>
                {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
              </RTLText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.8}
            >
              <RTLText style={[styles.signInButtonText, { color: theme.textPrimary }]}>
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </RTLText>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="briefcase-outline" size={20} color={theme.primary} />
              <RTLText style={[styles.featureText, { color: theme.textSecondary }]}>
                {isRTL ? 'آلاف الوظائف' : 'Thousands of jobs'}
              </RTLText>
            </View>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
              <RTLText style={[styles.featureText, { color: theme.textSecondary }]}>
                {isRTL ? 'دفع آمن' : 'Secure payments'}
              </RTLText>
            </View>
            <View style={styles.feature}>
              <Ionicons name="people-outline" size={20} color={theme.primary} />
              <RTLText style={[styles.featureText, { color: theme.textSecondary }]}>
                {isRTL ? 'مجتمع محترف' : 'Professional community'}
              </RTLText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // User is authenticated, show the app
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 400,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  signUpButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  signInButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  signInButtonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    flexWrap: 'wrap',
    gap: 20,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 100,
  },
  featureText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginTop: 16,
  },
});
