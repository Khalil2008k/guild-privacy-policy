import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Share, ActivityIndicator, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Share2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import CustomAlert from '@/app/components/CustomAlert';

const FONT_FAMILY = 'Signika Negative SC';

interface LocalSettingsState {
  pushNotifications: boolean;
  emailNotifications: boolean;
  showBalance: boolean;
  biometricEnabled: boolean;
  darkMode: boolean;
  dataUsage: 'low' | 'medium' | 'high';
  language: 'en' | 'ar';
}

const defaultSettings: LocalSettingsState = {
  pushNotifications: true,
  emailNotifications: false,
  showBalance: true,
  biometricEnabled: false,
  darkMode: true,
  dataUsage: 'medium',
  language: 'en',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, changeLanguage, t, isRTL } = useI18n();
  const [settings, setSettings] = useState<LocalSettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom Alert States
  const [showLanguageAlert, setShowLanguageAlert] = useState(false);
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);
  const [showBiometricAlert, setShowBiometricAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showSupportAlert, setShowSupportAlert] = useState(false);
  const [showPrivacyAlert, setShowPrivacyAlert] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [showRateAlert, setShowRateAlert] = useState(false);
  const [showAboutAlert, setShowAboutAlert] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('userSettings');
        if (saved) setSettings({ ...settings, ...JSON.parse(saved) });
      } catch {}
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async (partial: Partial<LocalSettingsState>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    await AsyncStorage.setItem('userSettings', JSON.stringify(next));
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(main)/home');
    }
  };

  const handleLanguageChange = async (newLanguage: 'en' | 'ar') => {
    console.log('Language change requested:', newLanguage);
    console.log('Current language:', language);
    try {
      await changeLanguage(newLanguage);
      saveSettings({ language: newLanguage });
      console.log('Language change completed');
    } catch (error) {
      console.error('Language change failed:', error);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    saveSettings({ darkMode: !isDarkMode });
  };

  const handleNotificationToggle = (type: 'pushNotifications' | 'emailNotifications') => {
    const newValue = !settings[type];
    saveSettings({ [type]: newValue });
    
    if (type === 'pushNotifications' && newValue) {
      setShowNotificationAlert(true);
    }
  };

  const handleBiometricToggle = () => {
    if (!settings.biometricEnabled) {
      setShowBiometricAlert(true);
    } else {
      saveSettings({ biometricEnabled: false });
    }
  };
  
  const handleBiometricEnable = () => {
    setShowBiometricAlert(false);
    saveSettings({ biometricEnabled: true });
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };
  
  const handleLogoutConfirm = () => {
    setShowLogoutAlert(false);
    // Implement logout logic
    router.push('/(auth)/signin');
  };

  const handleShareApp = () => {
    Share.share({
      message: 'Check out Guild - the best platform for freelancers in Qatar! Download now.',
      title: 'Guild App'
    });
  };

  const handleSupport = () => {
    setShowSupportAlert(true);
  };
  
  const handleEmailSupport = () => {
    setShowSupportAlert(false);
    // Email support logic would go here
  };
  
  const handleLiveChat = () => {
    setShowSupportAlert(false);
    router.push('/(main)/chat');
  };

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: isDarkMode ? '#000000' : theme.background },
    headerWrap: { 
      paddingTop: top + 12, 
      paddingBottom: 16, 
      paddingHorizontal: 18, 
      backgroundColor: theme.primary, 
      flexDirection: 'row', 
      alignItems: 'center',
      borderBottomLeftRadius: 26
    },
    backBtn: { 
      width: 44, 
      height: 44, 
      borderRadius: 12, 
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0'
    },
    title: { 
      color: isDarkMode ? '#000000' : '#000000', 
      fontSize: 24, 
      fontWeight: '900', 
      marginLeft: 12, 
      fontFamily: FONT_FAMILY 
    },

    content: { flex: 1, backgroundColor: isDarkMode ? '#111111' : theme.surface },
    section: { marginTop: 16, paddingHorizontal: 16 },
    sectionTitle: { 
      color: theme.textPrimary, 
      fontSize: 16, 
      fontWeight: '900', 
      marginBottom: 12, 
      fontFamily: FONT_FAMILY 
    },
    card: { 
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, 
      borderRadius: 18, 
      borderWidth: 1, 
      borderColor: isDarkMode ? '#262626' : theme.border, 
      overflow: 'hidden', 
      shadowColor: '#000000', 
      shadowOffset: { width: 0, height: 8 }, 
      shadowOpacity: 0.4, 
      shadowRadius: 12, 
      elevation: 12,
      marginBottom: 16
    },
    item: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight 
    },
    iconWrap: { 
      width: 44, 
      height: 44, 
      borderRadius: 12, 
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 16, 
      borderWidth: 1, 
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight 
    },
    itemText: { 
      color: theme.textPrimary, 
      fontSize: 16, 
      fontWeight: '800', 
      fontFamily: FONT_FAMILY,
      flex: 1
    },
    subText: { 
      color: theme.textSecondary, 
      fontSize: 12, 
      marginTop: 2, 
      fontFamily: FONT_FAMILY 
    },
    right: { marginLeft: 'auto' },
    spacer: { height: 100 },
    loadingWrap: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingTop: top, 
      paddingBottom: bottom, 
      backgroundColor: isDarkMode ? '#000000' : theme.background 
    },
    loadingText: { 
      color: theme.textSecondary, 
      marginTop: 16, 
      fontSize: 16,
      fontFamily: FONT_FAMILY 
    },
    languageButton: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
      marginRight: 8,
    },
    languageButtonText: {
      color: theme.primary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '800',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });

  const Item = ({ icon, title, subtitle, right, onPress }: { icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconWrap}>{icon}</View>
      <View>
        <Text style={styles.itemText}>{title}</Text>
        {subtitle ? <Text style={styles.subText}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={[styles.right]}>{right}</View> : <Ionicons name="chevron-forward" size={16} color="#888" style={styles.right} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar 
        barStyle={isDarkMode ? "dark-content" : "dark-content"} 
        backgroundColor={theme.primary} 
      />
      
      <View style={styles.headerWrap}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings') || 'Settings'}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications')}</Text>
          <View style={styles.card}>
            <Item
              icon={<Ionicons name="notifications-outline" size={20} color={theme.primary} />}
              title={t('pushNotifications')}
              subtitle={t('receiveJobAlerts')}
              right={
                <Switch 
                  value={settings.pushNotifications} 
                  onValueChange={() => handleNotificationToggle('pushNotifications')}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={settings.pushNotifications ? theme.primary : theme.textSecondary}
                />
              }
            />
            <Item
              icon={<Ionicons name="notifications-outline" size={20} color={theme.primary} />}
              title={t('emailNotifications')}
              subtitle={t('getUpdatesViaEmail')}
              right={
                <Switch 
                  value={settings.emailNotifications} 
                  onValueChange={() => handleNotificationToggle('emailNotifications')}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={settings.emailNotifications ? theme.primary : theme.textSecondary}
                />
              }
            />
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacySecurity')}</Text>
          <View style={styles.card}>
            <Item
              icon={<Ionicons name="eye-outline" size={20} color={theme.primary} />}
              title={t('showBalance')}
              subtitle={t('displayWalletBalance')}
              right={
                <Switch 
                  value={settings.showBalance} 
                  onValueChange={() => saveSettings({ showBalance: !settings.showBalance })}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={settings.showBalance ? theme.primary : theme.textSecondary}
                />
              }
            />
            <Item
              icon={<MaterialIcons name="security" size={20} color={theme.primary} />}
              title={t('biometricAuthentication')}
              subtitle={t('useFingerprintFace')}
              right={
                <Switch 
                  value={settings.biometricEnabled} 
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={settings.biometricEnabled ? theme.primary : theme.textSecondary}
                />
              }
            />
            <Item
              icon={<Ionicons name="lock-closed-outline" size={20} color={theme.primary} />}
              title={t('privacySettings')}
              subtitle={t('manageDataPrivacy')}
              onPress={() => setShowPrivacyAlert(true)}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('appearance')}</Text>
          <View style={styles.card}>
            <Item
              icon={<Ionicons name="globe-outline" size={20} color={theme.primary} />}
              title={t('language')}
              subtitle={`${language === 'ar' ? 'العربية' : 'English'} ${isRTL ? '(RTL)' : '(LTR)'}`}
              right={
                <View style={styles.switchContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.languageButton,
                      language === 'en' && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => handleLanguageChange('en')}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      language === 'en' && { color: '#000000' }
                    ]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.languageButton,
                      language === 'ar' && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => handleLanguageChange('ar')}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      language === 'ar' && { color: '#000000' }
                    ]}>AR</Text>
                  </TouchableOpacity>
                </View>
              }
            />
            <Item
              icon={isDarkMode ? <Ionicons name="moon-outline" size={20} color={theme.primary} /> : <Ionicons name="sunny-outline" size={20} color={theme.primary} />}
              title={t('theme')}
              subtitle={isDarkMode ? t('darkMode') : (isRTL ? 'الوضع الفاتح' : 'Light Mode')}
              right={
                <Switch 
                  value={isDarkMode} 
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={isDarkMode ? theme.primary : theme.textSecondary}
                />
              }
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          <View style={styles.card}>
            <Item
              icon={<Ionicons name="person-outline" size={20} color={theme.primary} />}
              title={t('profileSettings')}
              subtitle={t('manageProfileInfo')}
              onPress={() => router.push('/(modals)/profile-settings')}
            />
            <Item
              icon={<Ionicons name="card-outline" size={20} color={theme.primary} />}
              title={t('paymentMethods')}
              subtitle={t('managePaymentOptions')}
              onPress={() => setShowPaymentAlert(true)}
            />
            <Item
              icon={<Ionicons name="document-text-outline" size={20} color={theme.primary} />}
              title={t('transactionHistory')}
              subtitle={t('viewPaymentHistory')}
              onPress={() => router.push('/(modals)/wallet')}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <Item
              icon={<Ionicons name="help-circle-outline" size={20} color={theme.primary} />}
              title={t('helpCenter')}
              subtitle="FAQ and support articles"
              onPress={handleSupport}
            />
            <Item
              icon={<Ionicons name="star-outline" size={20} color={theme.primary} />}
              title={t('rateApp')}
              subtitle={t('shareYourFeedback')}
              onPress={() => setShowRateAlert(true)}
            />
            <Item
              icon={<Share2 size={20} color={theme.primary} />}
              title={t('shareApp')}
              subtitle={t('inviteFriendsToGuild')}
              onPress={handleShareApp}
            />
            <Item
              icon={<Ionicons name="information-circle-outline" size={20} color={theme.primary} />}
              title={t('about')}
              subtitle={t('appVersionAndInfo')}
              onPress={() => setShowAboutAlert(true)}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FF6B6B' }]}>Danger Zone</Text>
          <View style={styles.card}>
            <Item
              icon={<Ionicons name="log-out-outline" size={20} color="#FF6B6B" />}
              title={t('signOut')}
              subtitle={t('signOutOfAccount')}
              onPress={handleLogout}
            />
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Custom Alerts */}
      <CustomAlert
        visible={showLanguageAlert}
        title="Language Changed"
        message="The app language has been updated. Some changes may require restarting the app."
        buttons={[{ text: 'OK', onPress: () => setShowLanguageAlert(false) }]}
        onDismiss={() => setShowLanguageAlert(false)}
      />

      <CustomAlert
        visible={showNotificationAlert}
        title="Push Notifications"
        message="Push notifications have been enabled. You will receive job alerts and updates."
        buttons={[{ text: 'OK', onPress: () => setShowNotificationAlert(false) }]}
        onDismiss={() => setShowNotificationAlert(false)}
      />

      <CustomAlert
        visible={showBiometricAlert}
        title="Enable Biometric Authentication"
        message="Use your fingerprint or face recognition to secure your account?"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setShowBiometricAlert(false) },
          { text: 'Enable', onPress: handleBiometricEnable }
        ]}
        onDismiss={() => setShowBiometricAlert(false)}
      />

      <CustomAlert
        visible={showLogoutAlert}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setShowLogoutAlert(false) },
          { text: 'Sign Out', style: 'destructive', onPress: handleLogoutConfirm }
        ]}
        onDismiss={() => setShowLogoutAlert(false)}
      />

      <CustomAlert
        visible={showSupportAlert}
        title="Contact Support"
        message="Need help? Choose how you'd like to contact our support team."
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setShowSupportAlert(false) },
          { text: 'Email Support', onPress: handleEmailSupport },
          { text: 'Live Chat', onPress: handleLiveChat }
        ]}
        onDismiss={() => setShowSupportAlert(false)}
      />

      <CustomAlert
        visible={showPrivacyAlert}
        title="Privacy Settings"
        message="Advanced privacy settings would be implemented here. This would include data export, account deletion, and privacy controls."
        buttons={[{ text: 'OK', onPress: () => setShowPrivacyAlert(false) }]}
        onDismiss={() => setShowPrivacyAlert(false)}
      />

      <CustomAlert
        visible={showPaymentAlert}
        title="Payment Methods"
        message="Payment management would be implemented here. You can add, remove, and manage your credit cards and payment options."
        buttons={[{ text: 'OK', onPress: () => setShowPaymentAlert(false) }]}
        onDismiss={() => setShowPaymentAlert(false)}
      />

      <CustomAlert
        visible={showRateAlert}
        title="Rate App"
        message="App store rating would be implemented here. This would redirect you to the App Store or Google Play Store to rate the Guild app."
        buttons={[{ text: 'OK', onPress: () => setShowRateAlert(false) }]}
        onDismiss={() => setShowRateAlert(false)}
      />

      <CustomAlert
        visible={showAboutAlert}
        title="Guild v1.0.0"
        message="The best freelancing platform in Qatar.

Built with ❤️ by the Guild team."
        buttons={[{ text: 'OK', onPress: () => setShowAboutAlert(false) }]}
        onDismiss={() => setShowAboutAlert(false)}
      />
    </View>
  );
}


