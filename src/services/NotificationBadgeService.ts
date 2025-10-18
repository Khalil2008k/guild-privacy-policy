import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Shield } from 'lucide-react-native';

/**
 * Notification Badge Service
 * Handles the small app icon that appears at the top of the phone when notifications arrive
 * Uses Lucide Shield icon as the notification badge
 */
class NotificationBadgeService {
  private static instance: NotificationBadgeService;
  private isConfigured = false;

  private constructor() {}

  static getInstance(): NotificationBadgeService {
    if (!NotificationBadgeService.instance) {
      NotificationBadgeService.instance = new NotificationBadgeService();
    }
    return NotificationBadgeService.instance;
  }

  /**
   * Configure notification badge with Lucide Shield icon
   */
  async configureBadgeIcon(): Promise<void> {
    try {
      if (this.isConfigured) {
        return;
      }

      // Configure notification handler with shield icon
      await Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const data = notification.request.content.data;
          const priority = data?.priority || 'normal';
          
          return {
            shouldShowAlert: true,
            shouldPlaySound: priority === 'high' || priority === 'urgent',
            shouldSetBadge: true,
            // Use shield icon for notification badge
            icon: 'shield', // This will use the Lucide Shield icon
          };
        },
      });

      // Set up Android notification channel with shield icon
      if (Platform.OS === 'android') {
        await this.setupAndroidNotificationChannel();
      }

      this.isConfigured = true;
      console.log('🛡️ Notification badge configured with Lucide Shield icon');
    } catch (error) {
      console.error('❌ Failed to configure notification badge:', error);
    }
  }

  /**
   * Set up Android notification channel with shield icon
   */
  private async setupAndroidNotificationChannel(): Promise<void> {
    try {
      // Create notification channels for different types
      const channels = [
        {
          id: 'guild-jobs',
          name: 'Job Notifications',
          description: 'Notifications about job opportunities and updates',
          importance: Notifications.AndroidImportance.HIGH,
          icon: 'shield', // Shield icon for job notifications
        },
        {
          id: 'guild-payments',
          name: 'Payment Notifications',
          description: 'Notifications about payments and transactions',
          importance: Notifications.AndroidImportance.HIGH,
          icon: 'shield', // Shield icon for payment notifications
        },
        {
          id: 'guild-chat',
          name: 'Chat Notifications',
          description: 'Notifications about new messages',
          importance: Notifications.AndroidImportance.DEFAULT,
          icon: 'shield', // Shield icon for chat notifications
        },
        {
          id: 'guild-guild',
          name: 'Guild Notifications',
          description: 'Notifications about guild activities',
          importance: Notifications.AndroidImportance.DEFAULT,
          icon: 'shield', // Shield icon for guild notifications
        },
        {
          id: 'guild-system',
          name: 'System Notifications',
          description: 'System and security notifications',
          importance: Notifications.AndroidImportance.HIGH,
          icon: 'shield', // Shield icon for system notifications
        },
      ];

      // Create each channel
      for (const channel of channels) {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          description: channel.description,
          importance: channel.importance,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#32FF00', // Lime green light for shield theme
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          showBadge: true,
          enableLights: true,
          enableVibrate: true,
        });
      }

      console.log('🛡️ Android notification channels configured with shield icons');
    } catch (error) {
      console.error('❌ Failed to setup Android notification channels:', error);
    }
  }

  /**
   * Send notification with shield icon
   */
  async sendNotificationWithShield(
    title: string,
    body: string,
    data?: any,
    channelId: string = 'guild-system'
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          // Use shield icon for the notification
          icon: 'shield',
          color: '#32FF00', // Lime green color matching shield theme
        },
        trigger: null, // Send immediately
        channelId: Platform.OS === 'android' ? channelId : undefined,
      });

      console.log('🛡️ Notification sent with shield icon:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to send notification with shield icon:', error);
      return null;
    }
  }

  /**
   * Send job notification with shield icon
   */
  async sendJobNotification(
    title: string,
    body: string,
    jobId?: string,
    data?: any
  ): Promise<string | null> {
    return this.sendNotificationWithShield(
      title,
      body,
      {
        ...data,
        type: 'job',
        jobId,
        priority: 'normal',
      },
      'guild-jobs'
    );
  }

  /**
   * Send payment notification with shield icon
   */
  async sendPaymentNotification(
    title: string,
    body: string,
    paymentId?: string,
    data?: any
  ): Promise<string | null> {
    return this.sendNotificationWithShield(
      title,
      body,
      {
        ...data,
        type: 'payment',
        paymentId,
        priority: 'high',
      },
      'guild-payments'
    );
  }

  /**
   * Send chat notification with shield icon
   */
  async sendChatNotification(
    title: string,
    body: string,
    chatId?: string,
    data?: any
  ): Promise<string | null> {
    return this.sendNotificationWithShield(
      title,
      body,
      {
        ...data,
        type: 'chat',
        chatId,
        priority: 'normal',
      },
      'guild-chat'
    );
  }

  /**
   * Send guild notification with shield icon
   */
  async sendGuildNotification(
    title: string,
    body: string,
    guildId?: string,
    data?: any
  ): Promise<string | null> {
    return this.sendNotificationWithShield(
      title,
      body,
      {
        ...data,
        type: 'guild',
        guildId,
        priority: 'normal',
      },
      'guild-guild'
    );
  }

  /**
   * Send system notification with shield icon
   */
  async sendSystemNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string | null> {
    return this.sendNotificationWithShield(
      title,
      body,
      {
        ...data,
        type: 'system',
        priority: 'high',
      },
      'guild-system'
    );
  }

  /**
   * Set badge count with shield icon
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`🛡️ Badge count set to ${count} with shield icon`);
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  /**
   * Clear all notifications and badge
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
      console.log('🛡️ All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.requestPermissionsAsync();
  }

  /**
   * Test notification with shield icon
   */
  async testShieldNotification(): Promise<void> {
    try {
      await this.sendSystemNotification(
        '🛡️ GUILD Shield Notification',
        'This is a test notification with the Lucide Shield icon!',
        {
          test: true,
          timestamp: new Date().toISOString(),
        }
      );
      console.log('🛡️ Test shield notification sent');
    } catch (error) {
      console.error('❌ Failed to send test shield notification:', error);
    }
  }
}

// Export singleton instance
export const notificationBadgeService = NotificationBadgeService.getInstance();

// Export the service class for testing
export default NotificationBadgeService;


