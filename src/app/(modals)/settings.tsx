import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Share, ActivityIndicator, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  ArrowRight,
  Bell,
  Mail,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Globe,
  Moon,
  Sun,
  CreditCard,
  FileText,
  Megaphone,
  MessageCircle,
  BookOpen,
  HelpCircle,
  Star,
  Share2,
  Info,
  LogOut,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { CustomAlert } from '../../components/CustomAlert';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

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
  const { signOut } = useAuth();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const [settings, setSettings] = useState<LocalSettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showRateAlert, setShowRateAlert] = useState(false);
  const [showAboutAlert, setShowAboutAlert] = useState(false);
  const [showLanguageAlert, setShowLanguageAlert] = useState(false);
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);
  const [showBiometricAlert, setShowBiometricAlert] = useState(false);
  const [showSupportAlert, setShowSupportAlert] = useState(false);
  const [showPrivacyAlert, setShowPrivacyAlert] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('userSettings');
        if (saved) {
          const savedSettings = JSON.parse(saved);
          setSettings(prev => ({ ...prev, ...savedSettings }));
        }
      } catch (error) {
        // COMMENT: PRIORITY 1 - Replace console.error with logger
        logger.error('Error loading settings:', error);
      }
      setIsLoading(false);
    })();
  }, []);

  const saveSettings = async (partial: Partial<LocalSettingsState>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      // Save to AsyncStorage asynchronously without blocking
      AsyncStorage.setItem('userSettings', JSON.stringify(next)).catch(error => {
        // COMMENT: PRIORITY 1 - Replace console.error with logger
        logger.error('Error saving settings:', error);
      });
      return next;
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(main)/home');
    }
  };

  const handleLanguageChange = async (newLanguage: 'en' | 'ar') => {
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('Language change requested:', newLanguage);
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('Current language:', language);
    try {
      await changeLanguage(newLanguage);
      saveSettings({ language: newLanguage });
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('Language change completed');
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Language change failed:', error);
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
  
  const handleLogoutConfirm = async () => {
    try {
      setShowLogoutAlert(false);
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔥 SETTINGS: Starting logout process...');
      
      // Actually call signOut from AuthContext
      await signOut();
      
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔥 SETTINGS: Sign out completed, navigating to splash');
      router.replace('/(auth)/splash');
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('🔥 SETTINGS: Logout error:', error);
      // Force navigation even if sign-out fails
      router.replace('/(auth)/splash');
    }
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
    screen: { flex: 1, backgroundColor: adaptiveColors.background },
    headerWrap: { 
      paddingTop: top + 12, 
      paddingBottom: 16, 
      paddingHorizontal: 16, 
      backgroundColor: adaptiveColors.background, 
      flexDirection: 'row', 
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.border
    },
    backBtn: { 
      width: 40, 
      height: 40, 
      borderRadius: 12, 
      backgroundColor: adaptiveColors.cardBackground, 
      alignItems: 'center', 
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2
    },
    title: { 
      color: adaptiveColors.primaryText, 
      fontSize: 24, 
      fontWeight: '700', 
      marginLeft: 12, 
      fontFamily: FONT_FAMILY 
    },

    content: { flex: 1, backgroundColor: theme.background },
    section: { marginTop: 16, paddingHorizontal: 16 },
    sectionTitle: { 
      color: adaptiveColors.primaryText, 
      fontSize: 18, 
      fontWeight: '700', 
      marginBottom: 12, 
      fontFamily: FONT_FAMILY 
    },
    card: { 
      backgroundColor: adaptiveColors.cardBackground, 
      borderRadius: 16, 
      borderWidth: 1, 
      borderColor: adaptiveColors.cardBorder, 
      overflow: 'hidden', 
      shadowColor: '#000000', 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 8, 
      elevation: 4,
      marginBottom: 16
    },
    item: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: theme.border 
    },
    iconWrap: { 
      width: 40, 
      height: 40, 
      borderRadius: 12, 
      backgroundColor: theme.primary + '20', 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 12
    },
    itemText: { 
      color: adaptiveColors.primaryText, 
      fontSize: 16, 
      fontWeight: '600', 
      fontFamily: FONT_FAMILY,
      flex: 1
    },
    subText: { 
      color: adaptiveColors.secondaryText, 
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
      color: adaptiveColors.secondaryText, 
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
    <TouchableOpacity style={[styles.item, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
        <Text style={[styles.itemText, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subText, { textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={[styles.right]}>{right}</View> : <ChevronRight size={16} color="#888" style={styles.right} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={theme.iconActive} size="large" />
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
      
      <View style={[styles.headerWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          {isRTL ? <ArrowRight size={20} color={theme.iconPrimary} /> : <ArrowLeft size={20} color={theme.iconPrimary} />}
        </TouchableOpacity>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>{isRTL ? 'الإعدادات' : 'Settings'}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('notifications')}</Text>
          <View style={styles.card}>
            <Item
              icon={<Bell size={20} color={theme.iconPrimary} />}
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
              icon={<Mail size={20} color={theme.iconPrimary} />}
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
            <Item
              icon={<SettingsIcon size={20} color={theme.iconPrimary} />}
              title={t('notifications')}
              subtitle={t('settings.receiveNotifications')}
              right={<ChevronRight size={20} color={theme.textSecondary} />}
              onPress={() => router.push('/(modals)/notification-preferences')}
            />
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacySecurity')}</Text>
          <View style={styles.card}>
            <Item
              icon={settings.showBalance ? <Eye size={20} color={theme.iconPrimary} /> : <EyeOff size={20} color={theme.iconPrimary} />}
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
              icon={<Fingerprint size={20} color={theme.iconPrimary} />}
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
              icon={<Lock size={20} color={theme.iconPrimary} />}
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
              icon={<Globe size={20} color={theme.iconPrimary} />}
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
              icon={isDarkMode ? <Moon size={20} color={theme.iconPrimary} /> : <Sun size={20} color={theme.iconPrimary} />}
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
              icon={<CreditCard size={20} color={theme.iconPrimary} />}
              title={t('paymentMethods')}
              subtitle={t('managePaymentOptions')}
              onPress={() => setShowPaymentAlert(true)}
            />
            <Item
              icon={<FileText size={20} color={theme.iconPrimary} />}
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
              icon={<Megaphone size={20} color={theme.iconPrimary} />}
              title={isRTL ? 'مركز الإعلانات' : 'Announcement Center'}
              subtitle={isRTL ? 'التحديثات والإشعارات المهمة' : 'Important updates and system notifications'}
              onPress={() => router.push('/(modals)/announcement-center')}
            />
            <Item
              icon={<MessageCircle size={20} color={theme.iconPrimary} />}
              title={isRTL ? 'نظام الملاحظات' : 'Feedback System'}
              subtitle={isRTL ? 'شارك أفكارك واقتراحاتك' : 'Share your thoughts and suggestions'}
              onPress={() => router.push('/(modals)/feedback-system')}
            />
            <Item
              icon={<BookOpen size={20} color={theme.iconPrimary} />}
              title={isRTL ? 'قاعدة المعرفة' : 'Knowledge Base'}
              subtitle={isRTL ? 'مقالات المساعدة والأسئلة الشائعة' : 'Help articles and FAQs'}
              onPress={() => router.push('/(modals)/knowledge-base')}
            />
            <Item
              icon={<HelpCircle size={20} color={theme.iconPrimary} />}
              title={t('helpCenter')}
              subtitle={isRTL ? 'الأسئلة الشائعة ومقالات الدعم' : 'FAQ and support articles'}
              onPress={handleSupport}
            />
            <Item
              icon={<Star size={20} color={theme.iconPrimary} />}
              title={t('rateApp')}
              subtitle={t('shareYourFeedback')}
              onPress={() => setShowRateAlert(true)}
            />
            <Item
              icon={<Share2 size={20} color={theme.iconPrimary} />}
              title={t('shareApp')}
              subtitle={t('inviteFriendsToGuild')}
              onPress={handleShareApp}
            />
            <Item
              icon={<Info size={20} color={theme.iconPrimary} />}
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
              icon={<LogOut size={20} color="#FF6B6B" />}
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
        title={isRTL ? 'تم تغيير اللغة' : 'Language Changed'}
        message={isRTL ? 'تم تحديث لغة التطبيق. قد تتطلب بعض التغييرات إعادة تشغيل التطبيق.' : 'The app language has been updated. Some changes may require restarting the app.'}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', onPress: () => setShowLanguageAlert(false) }]}
        onDismiss={() => setShowLanguageAlert(false)}
      />

      <CustomAlert
        visible={showNotificationAlert}
        title={t('settings.pushNotifications')}
        message={isRTL ? 'تم تفعيل الإشعارات الفورية. سوف تتلقى تنبيهات الوظائف والتحديثات.' : 'Push notifications have been enabled. You will receive job alerts and updates.'}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', onPress: () => setShowNotificationAlert(false) }]}
        onDismiss={() => setShowNotificationAlert(false)}
      />

      <CustomAlert
        visible={showBiometricAlert}
        title={isRTL ? 'تفعيل المصادقة البيومترية' : 'Enable Biometric Authentication'}
        message={isRTL ? 'استخدام بصمة الإصبع أو التعرف على الوجه لتأمين حسابك؟' : 'Use your fingerprint or face recognition to secure your account?'}
        buttons={[
          { text: t('cancel'), style: 'cancel', onPress: () => setShowBiometricAlert(false) },
          { text: isRTL ? 'تفعيل' : 'Enable', onPress: handleBiometricEnable }
        ]}
        onDismiss={() => setShowBiometricAlert(false)}
      />

      <CustomAlert
        visible={showLogoutAlert}
        title={t('signOut')}
        message={t('signOutOfAccount')}
        buttons={[
          { text: t('cancel'), style: 'cancel', onPress: () => setShowLogoutAlert(false) },
          { text: t('signOut'), style: 'destructive', onPress: handleLogoutConfirm }
        ]}
        onDismiss={() => setShowLogoutAlert(false)}
      />

      <CustomAlert
        visible={showSupportAlert}
        title={t('settings.contactSupport')}
        message={isRTL ? 'هل تحتاج إلى مساعدة؟ اختر كيف تريد التواصل مع فريق الدعم.' : 'Need help? Choose how you\'d like to contact our support team.'}
        buttons={[
          { text: t('cancel'), style: 'cancel', onPress: () => setShowSupportAlert(false) },
          { text: isRTL ? 'البريد الإلكتروني' : 'Email Support', onPress: handleEmailSupport },
          { text: isRTL ? 'الدردشة المباشرة' : 'Live Chat', onPress: handleLiveChat }
        ]}
        onDismiss={() => setShowSupportAlert(false)}
      />

      <CustomAlert
        visible={showPrivacyAlert}
        title={isRTL ? 'إعدادات الخصوصية' : 'Privacy Settings'}
        message={isRTL ? 'سيتم تطبيق إعدادات الخصوصية المتقدمة هنا. سيشمل ذلك تصدير البيانات وحذف الحساب وضوابط الخصوصية.' : 'Advanced privacy settings would be implemented here. This would include data export, account deletion, and privacy controls.'}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', onPress: () => setShowPrivacyAlert(false) }]}
        onDismiss={() => setShowPrivacyAlert(false)}
      />

      <CustomAlert
        visible={showPaymentAlert}
        title={t('settings.paymentMethods')}
        message={isRTL ? 'سيتم تطبيق إدارة الدفع هنا. يمكنك إضافة وإزالة وإدارة بطاقات الائتمان وخيارات الدفع الخاصة بك.' : 'Payment management would be implemented here. You can add, remove, and manage your credit cards and payment options.'}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', onPress: () => setShowPaymentAlert(false) }]}
        onDismiss={() => setShowPaymentAlert(false)}
      />

      <CustomAlert
        visible={showRateAlert}
        title={t('rateApp')}
        message={isRTL ? 'سيتم تطبيق تقييم متجر التطبيقات هنا. سيتم إعادة توجيهك إلى App Store أو Google Play لتقييم تطبيق Guild.' : 'App store rating would be implemented here. This would redirect you to the App Store or Google Play Store to rate the Guild app.'}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', onPress: () => setShowRateAlert(false) }]}
        onDismiss={() => setShowRateAlert(false)}
      />

      <CustomAlert
        visible={showAboutAlert}
        title={isRTL ? 'Guild الإصدار 1.0.0' : 'Guild v1.0.0'}
        message={isRTL ? 'أفضل منصة للعمل الحر في قطر.\n\nمصنوع بـ ❤️ من فريق Guild.' : 'The best freelancing platform in Qatar.\n\nBuilt with ❤️ by the Guild team.'}
        buttons={[{ text: isRTL ? 'حسناً' : 'OK', onPress: () => setShowAboutAlert(false) }]}
        onDismiss={() => setShowAboutAlert(false)}
      />
    </View>
  );
}


