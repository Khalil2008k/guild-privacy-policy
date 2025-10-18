import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Moon, Sun, Globe, Bell, Lock, User, ChevronRight, LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

export default function UserSettingsScreen() {
  const { theme, isDarkMode, toggleTheme, accentColor, setAccentColor } = useTheme();
  const { t, language, changeLanguage } = useI18n();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    smsAlerts: false,
    locationServices: true,
    biometricAuth: true,
    autoBackup: true,
    analytics: false,
    crashReports: true,
  });

  const accentColors = [
    { name: 'Neon Green', value: '#BCFF31' },
    { name: 'Electric Blue', value: '#00D4FF' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#FF6B35' },
    { name: 'Pink', value: '#FF1B8D' },
    { name: 'Cyan', value: '#06FFA5' },
  ];

  const handleSettingToggle = (key: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newLang = language === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  const handleSignOut = () => {
    CustomAlertService.showConfirmation(
      'Sign Out',
      'Are you sure you want to sign out?',
      () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        signOut();
      },
      undefined,
      isRTL
    );
  };

  const handleDeleteAccount = () => {
    CustomAlertService.showConfirmation(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      () => {
        CustomAlertService.showInfo('Account Deletion', 'Please contact support to delete your account.');
      },
      undefined,
      isRTL
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onToggle, 
    onPress, 
    showArrow = false,
    danger = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onToggle?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: danger ? theme.error + '20' : theme.primary + '20' }]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={danger ? theme.error : theme.primary} 
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: danger ? theme.error : theme.textPrimary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {onToggle && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: theme.border, true: theme.primary + '40' }}
            thumbColor={value ? theme.primary : theme.textSecondary}
          />
        )}
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="settings" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Settings
            </Text>
          </View>
          
          <View style={styles.headerActionButton} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Account
          </Text>
          
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/(auth)/profile-completion')}
            showArrow
          />
          
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => router.push('/(modals)/privacy-settings')}
            showArrow
          />
          
          <SettingItem
            icon="card-outline"
            title="Payment Methods"
            subtitle="Manage cards and payment options"
            onPress={() => router.push('/(modals)/payment-methods')}
            showArrow
          />
        </View>

        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Appearance
          </Text>
          
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Toggle between light and dark theme"
            value={theme.isDark}
            onToggle={toggleTheme}
          />
          
          <TouchableOpacity
            style={[styles.settingItem, { borderColor: theme.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Show accent color picker
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="color-palette-outline" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                  Accent Color
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Customize your app's accent color
                </Text>
              </View>
            </View>
            <View style={styles.colorPreview}>
              {accentColors.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color.value },
                    accentColor === color.value && styles.selectedColor
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAccentColor(color.value);
                  }}
                />
              ))}
            </View>
          </TouchableOpacity>
          
          <SettingItem
            icon="language-outline"
            title="Language"
            subtitle={`Current: ${language === 'en' ? 'English' : 'العربية'}`}
            onPress={handleLanguageChange}
            showArrow
          />
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Notifications
          </Text>
          
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive notifications on your device"
            value={settings.notifications}
            onToggle={(value) => handleSettingToggle('notifications', value)}
          />
          
          <SettingItem
            icon="mail-outline"
            title="Email Updates"
            subtitle="Get updates via email"
            value={settings.emailUpdates}
            onToggle={(value) => handleSettingToggle('emailUpdates', value)}
          />
          
          <SettingItem
            icon="chatbubble-outline"
            title="SMS Alerts"
            subtitle="Receive important alerts via SMS"
            value={settings.smsAlerts}
            onToggle={(value) => handleSettingToggle('smsAlerts', value)}
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Privacy & Security
          </Text>
          
          <SettingItem
            icon="location-outline"
            title="Location Services"
            subtitle="Allow location-based features"
            value={settings.locationServices}
            onToggle={(value) => handleSettingToggle('locationServices', value)}
          />
          
          <SettingItem
            icon="finger-print-outline"
            title="Biometric Authentication"
            subtitle="Use fingerprint or Face ID"
            value={settings.biometricAuth}
            onToggle={(value) => handleSettingToggle('biometricAuth', value)}
          />
          
          <SettingItem
            icon="cloud-upload-outline"
            title="Auto Backup"
            subtitle="Automatically backup your data"
            value={settings.autoBackup}
            onToggle={(value) => handleSettingToggle('autoBackup', value)}
          />
        </View>

        {/* Data & Analytics Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Data & Analytics
          </Text>
          
          <SettingItem
            icon="analytics-outline"
            title="Usage Analytics"
            subtitle="Help improve the app with usage data"
            value={settings.analytics}
            onToggle={(value) => handleSettingToggle('analytics', value)}
          />
          
          <SettingItem
            icon="bug-outline"
            title="Crash Reports"
            subtitle="Automatically send crash reports"
            value={settings.crashReports}
            onToggle={(value) => handleSettingToggle('crashReports', value)}
          />
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Support
          </Text>
          
          <SettingItem
            icon="help-circle-outline"
            title="Help & FAQ"
            subtitle="Get help and find answers"
            onPress={() => router.push('/(modals)/help-faq')}
            showArrow
          />
          
          <SettingItem
            icon="mail-outline"
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={() => router.push('/(modals)/contact-support')}
            showArrow
          />
          
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="App version and information"
            onPress={() => router.push('/(modals)/about')}
            showArrow
          />
        </View>

        {/* Account Actions */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Account Actions
          </Text>
          
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            showArrow
          />
          
          <SettingItem
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            danger
            showArrow
          />
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});



