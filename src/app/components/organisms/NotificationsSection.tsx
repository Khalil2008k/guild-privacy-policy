import React, { useState, useEffect } from 'react';
import { View, Text, Linking, Platform } from 'react-native';
import { CustomAlertService } from '@/services/CustomAlertService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SettingItem } from '../molecules/SettingItem';
import { SettingsSwitch } from '../atoms/SettingsSwitch';
import { ReminderTimeModal } from '../molecules/ReminderTimeModal';
// import * as Notifications from 'expo-notifications'; // Disabled due to Expo Go SDK 53 limitations
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

// Mock Notifications object for Expo Go compatibility
const Notifications = {
  getPermissionsAsync: async () => ({ status: 'denied' }),
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  setNotificationChannelAsync: async () => {},
  cancelAllScheduledNotificationsAsync: async () => {},
  scheduleNotificationAsync: async () => {},
  AndroidImportance: { NONE: 0, HIGH: 4 }
};

interface NotificationsSectionProps {
  pushEnabled: boolean;
  onPushChange: (value: boolean) => void;
  reminderEnabled: boolean;
  onReminderChange: (value: boolean) => void;
  configureNotifications?: () => Promise<boolean>;
}

/**
 * Notifications section component that groups all notification-related settings
 * 
 * @param {NotificationsSectionProps} props - Component props
 * @returns {React.ReactElement} Notifications section component
 */
export function NotificationsSection({
  pushEnabled,
  onPushChange,
  reminderEnabled,
  onReminderChange,
  configureNotifications,
}: NotificationsSectionProps) {
  const { isDarkMode } = useTheme();
  const [testPermissionsToggle, setTestPermissionsToggle] = useState(false);
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const { t } = useI18n();

  // Cleanup scheduled notifications on component unmount
  useEffect(() => {
    return () => {
      // Cancel all scheduled notifications when component unmounts
      // This prevents memory leaks from orphaned notifications
      console.log('📱 Would cancel notifications on unmount (disabled in Expo Go)');
      // Notifications.cancelAllScheduledNotificationsAsync().catch(error => {
      //   console.warn('Failed to cancel notifications on unmount:', error);
      // });
    };
  }, []);

  const handleTestPermissions = async () => {
    try {
      const { status: currentStatus } = await Notifications.getPermissionsAsync();

      if (currentStatus === 'granted') {
        if (Platform.OS === 'ios') {
          Linking.openURL('app-settings:NOTIFICATIONS_SETTINGS');
        } else {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Disabled Channel',
            importance: Notifications.AndroidImportance.NONE,
          });
        }

        CustomAlertService.showError(
          'Notification Permissions', 
          Platform.OS === 'ios' 
            ? 'Please manually revoke notifications in Settings' 
            : 'Notification permissions have been revoked.'
        );
      } else {
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== 'granted') {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:NOTIFICATIONS_SETTINGS');
          } else {
            Linking.openSettings();
          }
        } else {
          CustomAlertService.showSuccess(
            'Notification Permissions', 
            'Notification permissions have been successfully requested.'
          );
        }
      }


      setTestPermissionsToggle(false);

      if (configureNotifications) {
        await configureNotifications();
      }
    } catch (error) {
      CustomAlertService.showError('Error', 'Failed to manage notification permissions');
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      setIsReminderModalVisible(true);
    } else {
      onReminderChange(false);
      setReminderTime(null);
      
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const handleReminderTimeSave = (selectedTime: Date) => {
    setReminderTime(selectedTime);
    onReminderChange(true);
    setIsReminderModalVisible(false);

    scheduleReminderNotification(selectedTime);
  };

  const scheduleReminderNotification = async (time: Date) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        CustomAlertService.showError('Permission needed', 'Please grant notification permissions');
        return;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Daily Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          enableVibrate: true,
          enableLights: true,
        });
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setHours(time.getHours());
      scheduledTime.setMinutes(time.getMinutes());
      scheduledTime.setSeconds(0);
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const trigger = Platform.OS === 'ios' 
        ? {
            type: 'calendar',
            hour: time.getHours(),
            minute: time.getMinutes(),
            repeats: true,
          } as Notifications.CalendarTriggerInput
        : {
            type: 'daily',
            hour: time.getHours(),
            minute: time.getMinutes(),
          } as Notifications.DailyTriggerInput;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Daily Reminder",
          body: "Your scheduled reminder is here!",
          sound: true,
          ...(Platform.OS === 'android' && {
            channelId: 'reminders',
          }),
        },
        trigger,
      });

      CustomAlertService.showSuccess('Success', `Reminder set for ${time.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      CustomAlertService.showError('Error', 'Failed to schedule reminder. Please try again.');
    }
  };

  return (
    <View className="overflow-hidden">
      <SettingItem
        icon={BellIcon}
        label={t('pushNotifications')}
        description={t('pushNotificationsDesc')}
        control={
          <SettingsSwitch
            value={pushEnabled}
            onValueChange={onPushChange}
            testID="push-notifications-switch"
          />
        }
      />
      
      <View className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      
      <SettingItem
        icon={CalendarIcon}
        label={t('reminderNotifications')}
        description={
          reminderTime 
            ? `${t('reminderSetFor')} ${reminderTime.toLocaleTimeString()}` 
            : t('reminderNotificationsDesc')
        }
        control={
          <SettingsSwitch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            testID="reminder-notifications-switch"
          />
        }
      />
      
      <View className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      
      <SettingItem
        icon={ShieldCheckIcon}
        label={t('testPermissions')}
        description={t('testPermissionsDesc')}
        control={
          <SettingsSwitch
            value={false}
            onValueChange={() => {
              handleTestPermissions();
            }}
            testID="test-permissions-switch"
          />
        }
      />

      <ReminderTimeModal
        isVisible={isReminderModalVisible}
        onClose={() => setIsReminderModalVisible(false)}
        onSave={handleReminderTimeSave}
      />
    </View>
  );
} 

export default NotificationsSection;