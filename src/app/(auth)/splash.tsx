import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Shield, Search, Home } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  // Advanced Light Mode Colors
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    primaryText: isDarkMode ? theme.primary : theme.primary,
    secondaryText: isDarkMode ? theme.textSecondary : '#666666',
  };

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return;

    // Auto navigate after 6-8 seconds (your preference)
    const timer = setTimeout(() => {
      if (user) {
        // User is authenticated, go to main app
        router.replace('/(main)/home');
      } else {
        // User is not authenticated, show onboarding first
        router.replace('/(auth)/onboarding/1');
      }
    }, 7000); // 7 seconds - perfect middle of 6-8 range

    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background }]}>
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Shield
              size={80}
              color={adaptiveColors.primaryText}
              style={styles.shieldIcon}
            />
            <Text style={[styles.logoText, { color: adaptiveColors.primaryText }]}>
              GUILD
            </Text>
          </View>
        </View>


        {/* Powered By Text */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.poweredByText, { color: adaptiveColors.secondaryText }]}>
            {t('poweredBy')} {t('blackEnergyTech')}
          </Text>
          <Text style={[styles.versionText, { color: adaptiveColors.secondaryText }]}>
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
