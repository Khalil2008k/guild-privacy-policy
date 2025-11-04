import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Text, 
  Switch,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Ionicons } from '@expo/vector-icons';
import { Shield, Bell, Lock, Eye, Download, Trash2 } from 'lucide-react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const { width } = Dimensions.get('window');

const SETTINGS_KEY = '@wallet_settings';

export default function WalletSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    if (!loading) {
      saveSettings();
    }
  }, [notifications, biometric, autoBackup, showBalance]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setBiometric(settings.biometric ?? false);
        setAutoBackup(settings.autoBackup ?? true);
        setShowBalance(settings.showBalance ?? true);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading wallet settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const settings = {
        notifications,
        biometric,
        autoBackup,
        showBalance,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error saving wallet settings:', error);
      CustomAlertService.showError('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    CustomAlertService.showInfo(
      'Export Data',
      'This feature will be available after beta testing.'
    );
  };

  const handleClearHistory = () => {
    CustomAlertService.showConfirmation(
      'Clear History',
      'Are you sure you want to clear transaction history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            CustomAlertService.showSuccess('Success', 'Transaction history cleared');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.primary }]}>
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#000000" />
          </TouchableOpacity>
          
          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Shield size={24} color="#000000" />
            <Text style={[styles.headerTitle, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
              {isRTL ? 'إعدادات المحفظة' : 'Wallet Settings'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {saving && <ActivityIndicator size="small" color="#000000" />}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, textAlign: 'center' }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading settings...'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'الإشعارات' : 'Notifications'}
          </Text>

          <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.settingItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.settingLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Bell size={20} color={theme.primary} />
                </View>
                <View style={[styles.settingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'تنبيهات المعاملات' : 'Transaction Alerts'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'احصل على إشعار لجميع المعاملات' : 'Get notified for all transactions'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'الأمان' : 'Security'}
          </Text>

          <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.settingItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.settingLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Lock size={20} color={theme.primary} />
                </View>
                <View style={[styles.settingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'المصادقة البيومترية' : 'Biometric Authentication'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'استخدام البصمة أو معرف الوجه' : 'Use fingerprint or face ID'}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={[styles.settingItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.settingLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Eye size={20} color={theme.primary} />
                </View>
                <View style={[styles.settingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'إظهار الرصيد' : 'Show Balance'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'عرض الرصيد على الشاشة الرئيسية' : 'Display balance on home screen'}
                  </Text>
                </View>
              </View>
              <Switch
                value={showBalance}
                onValueChange={setShowBalance}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Backup Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'النسخ الاحتياطي والبيانات' : 'Backup & Data'}
          </Text>

          <View style={[styles.settingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.settingItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.settingLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Download size={20} color={theme.primary} />
                </View>
                <View style={[styles.settingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'النسخ الاحتياطي التلقائي' : 'Auto Backup'}
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'النسخ الاحتياطي التلقائي لبيانات المحفظة' : 'Automatically backup wallet data'}
                  </Text>
                </View>
              </View>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="cloud-download-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
                    Export Transaction Data
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Download your transaction history
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FF6B6B' }]}>
            Danger Zone
          </Text>

          <TouchableOpacity 
            style={[styles.dangerCard, { backgroundColor: theme.surface, borderColor: '#FF6B6B' }]}
            onPress={handleClearHistory}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FF6B6B' + '20' }]}>
                <Trash2 size={20} color="#FF6B6B" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: '#FF6B6B' }]}>
                  Clear Transaction History
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Permanently delete all transaction records
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 8,
  },
  headerRight: {
    padding: 8,
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dangerCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
});
