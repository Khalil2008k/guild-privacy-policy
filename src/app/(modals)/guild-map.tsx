import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../contexts/I18nProvider';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
});

export default function GuildMapScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={adaptiveColors.background}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: adaptiveColors.cardBackground, borderBottomColor: adaptiveColors.cardBorder }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/(main)/home')}
          style={[styles.backButton, { backgroundColor: adaptiveColors.cardBackground }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: adaptiveColors.primaryText }]}>{t('guildMap')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Coming Soon Content */}
      <View style={styles.comingSoonContainer}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="map" size={64} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: adaptiveColors.primaryText }]}>
          {isRTL ? 'خريطة GUILD' : 'GUILD Map'}
        </Text>
        <Text style={[styles.subtitle, { color: adaptiveColors.secondaryText }]}>
          {t('comingSoon')}
        </Text>
        <Text style={[styles.description, { color: adaptiveColors.secondaryText }]}>
          {isRTL
            ? 'ميزة خريطة GUILD ستكون متاحة قريباً! تابعونا للحصول على تتبع موقع الوظائف في الوقت الفعلي.'
            : 'The GUILD Map feature is coming soon! Stay tuned for real-time job location tracking.'
          }
        </Text>
        <TouchableOpacity
          style={[styles.backButtonStyle, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(main)/home')}
        >
          <Text style={[styles.backButtonText, { color: theme.buttonText }]}>
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  backButtonStyle: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
