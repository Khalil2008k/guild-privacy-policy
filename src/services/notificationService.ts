import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { BackendAPI } from '../config/backend';
import { logger } from '../utils/logger';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'job' | 'payment' | 'guild' | 'chat' | 'system' | 'dispute';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  userId: string;
  createdAt: Date;
  read: boolean;
}

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  userId: string;
}

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Check if running in Expo Go
      if (isExpoGo) {
        logger.warn('📱 NotificationService: Running in Expo Go - Push notifications disabled');
        this.isInitialized = true;
        return true;
      }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const data = notification.request.content.data;
          const priority = data?.priority || 'normal';
          
          return {
            shouldShowAlert: true,
            shouldPlaySound: priority === 'high' || priority === 'urgent',
            shouldSetBadge: true,
          };
        },
      });

      // Register for push notifications
      const token = await this.registerForPushNotifications();
      
      if (token) {
        this.pushToken = token;
        await this.sendTokenToBackend(token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      logger.info('📱 NotificationService: Initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('❌ NotificationService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Register for push notifications
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      // Skip in Expo Go
      if (isExpoGo) {
        logger.warn('📱 Push notifications disabled in Expo Go');
        return null;
      }

      if (!Device.isDevice) {
        logger.warn('📱 Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('📱 Push notification permissions not granted');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '03fc46b1-43ec-4b63-a1fc-329d0e5f1d1b',
      });

      logger.info('📱 Push token obtained:', tokenData.data);
      return tokenData.data;

    } catch (error) {
      logger.error('❌ Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Send push token to backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // Skip in Expo Go
      if (isExpoGo) {
        logger.warn('📱 Skipping token registration in Expo Go');
        return;
      }

      await BackendAPI.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceId: Device.osInternalBuildId || 'unknown',
      });

      logger.info('📱 Push token registered with backend');
    } catch (error) {
      logger.error('❌ Failed to register push token with backend:', error);
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    // Skip in Expo Go
    if (isExpoGo) {
      logger.warn('📱 Skipping notification listeners in Expo Go');
      return;
    }

    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      logger.info('📱 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener((response) => {
      logger.info('📱 Notification tapped:', response);
      this.handleNotificationTapped(response);
    });
  }

  /**
   * Handle notification received
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const data = notification.request.content.data;
    
    // Update notification badge
    this.updateBadgeCount();
    
    // Emit event for app components to handle
    // You can use EventEmitter or Context for this
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('📱 Notification received:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data,
    });
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTapped(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    this.handleNotificationNavigation(data);
  }

  /**
   * Handle navigation based on notification data
   */
  private handleNotificationNavigation(data: any): void {
    if (!data?.type) return;

    // Import router dynamically to avoid circular dependencies
    import('expo-router').then(({ router }) => {
      switch (data.type) {
        case 'job':
          if (data.jobId) {
            router.push(`/(modals)/job/${data.jobId}`);
          } else {
            router.push('/(main)/jobs');
          }
          break;
          
        case 'chat':
          if (data.chatId) {
            router.push(`/(modals)/chat/${data.chatId}`);
          } else {
            router.push('/(main)/chat');
          }
          break;
          
        case 'payment':
          router.push('/(modals)/wallet');
          break;
          
        case 'guild':
          router.push('/(modals)/guilds');
          break;
          
        case 'dispute':
          router.push('/(modals)/guild-court');
          break;
          
        default:
          router.push('/(main)/home');
      }
    });
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    scheduledTime?: Date
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: scheduledTime ? { date: scheduledTime } : null,
      });

      logger.info('📱 Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      logger.error('❌ Failed to send local notification:', error);
      return null;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info('📱 Notification cancelled:', notificationId);
    } catch (error) {
      logger.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
      logger.info('📱 All notifications cleared');
    } catch (error) {
      logger.error('❌ Failed to clear notifications:', error);
    }
  }

  /**
   * Update badge count
   */
  private async updateBadgeCount(): Promise<void> {
    try {
      // Get unread count from backend
      const response = await BackendAPI.get('/notifications/unread-count');
      const count = response?.count || 0;
      
      await this.setBadgeCount(count);
    } catch (error) {
      logger.error('❌ Failed to update badge count:', error);
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      logger.error('❌ Failed to set badge count:', error);
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
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Refresh push token
   */
  async refreshPushToken(): Promise<string | null> {
    try {
      const token = await this.registerForPushNotifications();
      
      if (token) {
        this.pushToken = token;
        await this.sendTokenToBackend(token);
      }
      
      return token;
    } catch (error) {
      logger.error('❌ Failed to refresh push token:', error);
      return null;
    }
  }

  /**
   * Fetch notifications from backend
   */
  async fetchNotifications(page: number = 1, limit: number = 20): Promise<NotificationData[]> {
    try {
      const response = await BackendAPI.get(`/notifications?page=${page}&limit=${limit}`);
      return response?.notifications || [];
    } catch (error) {
      logger.error('❌ Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await BackendAPI.put(`/notifications/${notificationId}/read`);
      
      if (response?.success) {
        // Update badge count
        await this.updateBadgeCount();
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('❌ Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await BackendAPI.put('/notifications/read-all');
      
      if (response?.success) {
        await this.setBadgeCount(0);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('❌ Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await BackendAPI.delete(`/notifications/${notificationId}`);
      return response?.success || false;
    } catch (error) {
      logger.error('❌ Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * Subscribe to notification types
   */
  async updateNotificationPreferences(preferences: {
    jobs: boolean;
    payments: boolean;
    guilds: boolean;
    chats: boolean;
    disputes: boolean;
    system: boolean;
  }): Promise<boolean> {
    try {
      const response = await BackendAPI.put('/notifications/preferences', preferences);
      return response?.success || false;
    } catch (error) {
      logger.error('❌ Failed to update notification preferences:', error);
      return false;
    }
  }

  /**
   * Handle user sign in - initialize notifications
   */
  async onUserSignIn(): Promise<void> {
    try {
      logger.info('📱 NotificationService: User signed in, initializing notifications');
      await this.initialize();
    } catch (error) {
      logger.error('❌ NotificationService: Failed to handle user sign in:', error);
    }
  }

  /**
   * Handle user sign out - clear notifications
   */
  async onUserSignOut(): Promise<void> {
    try {
      logger.info('📱 NotificationService: User signed out, clearing notifications');
      await this.clearAllNotifications();
      this.pushToken = null;
      this.isInitialized = false;
    } catch (error) {
      logger.error('❌ NotificationService: Failed to handle user sign out:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export types
export type { NotificationData, PushNotificationToken };