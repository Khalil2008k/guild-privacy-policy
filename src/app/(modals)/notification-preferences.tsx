import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Save, RotateCcw, X, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseNotificationService, NotificationPreferences } from '../../services/firebaseNotificationService';

const defaultSettings: Omit<NotificationPreferences, 'userId' | 'updatedAt'> = {
  pushEnabled: true,
  jobAlerts: true,
  messageAlerts: true,
  guildUpdates: true,
  paymentAlerts: true,
  
  emailEnabled: true,
  weeklyDigest: true,
  jobRecommendations: true,
  guildInvitations: true,
  
  smsEnabled: false,
  urgentOnly: true,
  paymentConfirmations: true,
  
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  
  instantNotifications: true,
  batchNotifications: false,
  dailySummary: true,
};

export default function NotificationPreferencesScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Omit<NotificationPreferences, 'userId' | 'updatedAt'>>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerType, setTimePickerType] = useState<'start' | 'end'>('start');

  // Load saved settings from Firebase
  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const preferences = await firebaseNotificationService.getPreferences(user.uid);
      
      if (preferences) {
        const { userId, updatedAt, ...prefs } = preferences;
        setSettings(prefs);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      CustomAlertService.showError(
        t('common.error'),
        isRTL ? 'فشل تحميل التفضيلات' : 'Failed to load preferences'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await firebaseNotificationService.updatePreferences(user.uid, settings);
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم الحفظ' : 'Saved',
        isRTL ? 'تم حفظ التفضيلات ومزامنتها على جميع الأجهزة' : 'Preferences saved and synced across all devices'
      );
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      CustomAlertService.showError(
        t('common.error'),
        isRTL ? 'فشل حفظ التفضيلات' : 'Failed to save preferences'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleResetToDefault = () => {
    CustomAlertService.showConfirmation(
      isRTL ? 'إعادة التعيين' : 'Reset Settings',
      isRTL ? 'هل أنت متأكد أنك تريد إعادة تعيين جميع الإعدادات إلى الافتراضية؟' : 'Are you sure you want to reset all settings to default?',
      () => {
        setSettings(defaultSettings);
        CustomAlertService.showSuccess(
          isRTL ? 'تم' : 'Reset',
          isRTL ? 'تم إعادة تعيين الإعدادات' : 'Settings reset to default'
        );
      },
      undefined,
      isRTL
    );
  };

  const openTimePicker = (type: 'start' | 'end') => {
    setTimePickerType(type);
    setShowTimePicker(true);
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    updateSetting(timePickerType === 'start' ? 'quietStart' : 'quietEnd', timeString);
    setShowTimePicker(false);
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );

  const renderToggle = (
    key: keyof typeof settings,
    label: string,
    description?: string,
    disabled?: boolean
  ) => (
    <View style={[styles.toggleRow, disabled && styles.disabledRow]}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: disabled ? theme.textSecondary : theme.textPrimary }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(value) => updateSetting(key, value)}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={settings[key] ? '#FFFFFF' : theme.textSecondary}
        disabled={disabled}
      />
    </View>
  );

  const renderTimeSelector = (
    key: 'quietStart' | 'quietEnd',
    label: string,
    disabled?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.timeRow, disabled && styles.disabledRow]}
      disabled={disabled}
      onPress={() => openTimePicker(key === 'quietStart' ? 'start' : 'end')}
    >
      <View style={[styles.timeRowContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Clock size={20} color={disabled ? theme.textSecondary : theme.textPrimary} />
        <Text style={[styles.timeLabel, { color: disabled ? theme.textSecondary : theme.textPrimary, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
          {label}
        </Text>
      </View>
      <View style={styles.timeValue}>
        <Text style={[styles.timeText, { color: disabled ? theme.textSecondary : theme.primary }]}>
          {settings[key] as string}
        </Text>
        {isRTL ? (
          <ChevronLeft size={20} color={disabled ? theme.textSecondary : theme.textSecondary} />
        ) : (
          <ChevronRight size={20} color={disabled ? theme.textSecondary : theme.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textPrimary, marginTop: 16 }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading preferences...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          {isRTL ? (
            <ChevronRight size={24} color="#000000" />
          ) : (
            <ChevronLeft size={24} color="#000000" />
          )}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'إعدادات الإشعارات' : 'Notification Settings'}
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.savingButton]}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Save size={24} color="#000000" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        {renderSection(isRTL ? 'إشعارات الدفع' : 'Push Notifications', (
          <>
            {renderToggle('pushEnabled', isRTL ? 'تفعيل إشعارات الدفع' : 'Enable Push Notifications', isRTL ? 'تلقي الإشعارات على جهازك' : 'Receive notifications on your device')}
            {renderToggle('jobAlerts', isRTL ? 'تنبيهات الوظائف' : 'Job Alerts', isRTL ? 'إشعارات الوظائف الجديدة والعروض' : 'Notifications for new jobs and offers', !settings.pushEnabled)}
            {renderToggle('messageAlerts', isRTL ? 'تنبيهات الرسائل' : 'Message Alerts', isRTL ? 'إشعارات الرسائل الجديدة' : 'Notifications for new messages', !settings.pushEnabled)}
            {renderToggle('guildUpdates', isRTL ? 'تحديثات النقابة' : 'Guild Updates', isRTL ? 'إشعارات أنشطة النقابة' : 'Notifications for guild activities', !settings.pushEnabled)}
            {renderToggle('paymentAlerts', isRTL ? 'تنبيهات الدفع' : 'Payment Alerts', isRTL ? 'إشعارات المدفوعات والمعاملات' : 'Notifications for payments and transactions', !settings.pushEnabled)}
          </>
        ))}

        {/* Email Notifications */}
        {renderSection(isRTL ? 'إشعارات البريد الإلكتروني' : 'Email Notifications', (
          <>
            {renderToggle('emailEnabled', isRTL ? 'تفعيل إشعارات البريد' : 'Enable Email Notifications', isRTL ? 'تلقي الإشعارات عبر البريد الإلكتروني' : 'Receive notifications via email')}
            {renderToggle('weeklyDigest', isRTL ? 'ملخص أسبوعي' : 'Weekly Digest', isRTL ? 'ملخص أسبوعي لأنشطتك' : 'Weekly summary of your activity', !settings.emailEnabled)}
            {renderToggle('jobRecommendations', isRTL ? 'توصيات الوظائف' : 'Job Recommendations', isRTL ? 'وظائف موصى بها بناءً على ملفك' : 'Recommended jobs based on your profile', !settings.emailEnabled)}
            {renderToggle('guildInvitations', isRTL ? 'دعوات النقابة' : 'Guild Invitations', isRTL ? 'دعوات للانضمام إلى النقابات' : 'Invitations to join guilds', !settings.emailEnabled)}
          </>
        ))}

        {/* SMS Notifications */}
        {renderSection(isRTL ? 'إشعارات الرسائل القصيرة' : 'SMS Notifications', (
          <>
            {renderToggle('smsEnabled', isRTL ? 'تفعيل الرسائل القصيرة' : 'Enable SMS Notifications', isRTL ? 'تلقي الإشعارات عبر الرسائل القصيرة' : 'Receive notifications via SMS')}
            {renderToggle('urgentOnly', isRTL ? 'العاجل فقط' : 'Urgent Only', isRTL ? 'فقط الإشعارات العاجلة عبر الرسائل' : 'Only urgent notifications via SMS', !settings.smsEnabled)}
            {renderToggle('paymentConfirmations', isRTL ? 'تأكيدات الدفع' : 'Payment Confirmations', isRTL ? 'تأكيدات المدفوعات عبر الرسائل' : 'Payment confirmations via SMS', !settings.smsEnabled)}
          </>
        ))}

        {/* Quiet Hours */}
        {renderSection(isRTL ? 'الساعات الهادئة' : 'Quiet Hours', (
          <>
            {renderToggle('quietHoursEnabled', isRTL ? 'تفعيل الساعات الهادئة' : 'Enable Quiet Hours', isRTL ? 'عدم الإزعاج خلال ساعات معينة' : 'Do not disturb during specific hours')}
            {renderTimeSelector('quietStart', isRTL ? 'وقت البدء' : 'Start Time', !settings.quietHoursEnabled)}
            {renderTimeSelector('quietEnd', isRTL ? 'وقت الانتهاء' : 'End Time', !settings.quietHoursEnabled)}
          </>
        ))}

        {/* Frequency Settings */}
        {renderSection(isRTL ? 'إعدادات التكرار' : 'Frequency Settings', (
          <>
            {renderToggle('instantNotifications', isRTL ? 'إشعارات فورية' : 'Instant Notifications', isRTL ? 'تلقي الإشعارات فوراً' : 'Receive notifications instantly')}
            {renderToggle('batchNotifications', isRTL ? 'إشعارات مجمعة' : 'Batch Notifications', isRTL ? 'تجميع الإشعارات وإرسالها دفعة واحدة' : 'Group notifications and send in batches')}
            {renderToggle('dailySummary', isRTL ? 'ملخص يومي' : 'Daily Summary', isRTL ? 'ملخص يومي لجميع الإشعارات' : 'Daily summary of all notifications')}
          </>
        ))}

        {/* Reset Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.resetButton, { borderColor: theme.error }]}
            onPress={handleResetToDefault}
          >
            <RotateCcw size={20} color={theme.error} />
            <Text style={[styles.resetText, { color: theme.error }]}>
              {isRTL ? 'إعادة التعيين إلى الافتراضي' : 'Reset to Default'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cloud Sync Indicator */}
        <View style={[styles.syncIndicator, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
          <Text style={[styles.syncText, { color: theme.primary }]}>
            ☁️ {isRTL ? 'تم المزامنة عبر جميع الأجهزة' : 'Synced across all devices'}
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {timePickerType === 'start' 
                  ? (isRTL ? 'وقت البدء' : 'Start Time')
                  : (isRTL ? 'وقت الانتهاء' : 'End Time')}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTimePicker(false)}
              >
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timePickerScroll}>
              {Array.from({ length: 24 }, (_, hour) => (
                <View key={hour}>
                  {[0, 30].map((minute) => {
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const currentTime = timePickerType === 'start' ? settings.quietStart : settings.quietEnd;
                    const isSelected = currentTime === timeString;

                    return (
                      <TouchableOpacity
                        key={`${hour}-${minute}`}
                        style={[
                          styles.timeOption,
                          { borderBottomColor: theme.border },
                          isSelected && { backgroundColor: theme.primary + '20' }
                        ]}
                        onPress={() => handleTimeSelect(hour, minute)}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          { color: isSelected ? theme.primary : theme.textPrimary }
                        ]}>
                          {timeString}
                        </Text>
                        {isSelected && (
                          <Text style={{ color: theme.primary }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
    color: '#000000',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1.5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  disabledRow: {
    opacity: 0.5,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    fontFamily: 'Signika Negative SC',
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  timeRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeLabel: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderRadius: 16,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetText: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
    marginLeft: 8,
    fontWeight: '600',
  },
  syncIndicator: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  syncText: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Signika Negative SC',
  },
  closeButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  timePickerScroll: {
    maxHeight: 400,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  timeOptionText: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
    fontWeight: '600',
  },
});
