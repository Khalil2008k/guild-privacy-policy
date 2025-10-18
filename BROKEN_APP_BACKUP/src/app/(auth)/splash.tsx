import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return;

    // Auto navigate to onboarding after 4000ms
    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding/1');
    }, 4000);

    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <MaterialIcons
              name="security"
              size={80}
              color={theme.primary}
              style={styles.shieldIcon}
            />
            <Text style={[styles.logoText, { color: theme.primary }]}>
              GUILD
            </Text>
          </View>
        </View>

        {/* Powered By Text */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.poweredByText, { color: theme.textSecondary }]}>
            {t('poweredBy')} {t('blackEnergyTech')}
          </Text>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>
            {t('v1')}
          </Text>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 100,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
    letterSpacing: 4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  poweredByText: {
    fontSize: 12,
    fontFamily: 'Signika Negative SC',
    textAlign: 'center',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    fontFamily: 'Signika Negative SC',
    textAlign: 'center',
  },
});

export default SplashScreen;
