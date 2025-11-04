/**
 * Message Notification Service
 * Sends push notifications when new messages are received
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { BackendAPI } from '../config/backend';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

// COMMENT: PRODUCTION HARDENING - Expo Go Compatibility - Check if running in Expo Go
// Expo Go doesn't support push notifications in SDK 53+
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure notifications (skip in Expo Go)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} else {
  // COMMENT: PRODUCTION HARDENING - Expo Go Compatibility - Skip notification handler in Expo Go
  if (__DEV__) {
    logger.debug('⚠️ [Notifications] Running in Expo Go - push notifications disabled');
  }
}

class MessageNotificationServiceClass {
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification listeners
   */
  async initialize() {
    // COMMENT: PRODUCTION HARDENING - Expo Go Compatibility - Skip initialization in Expo Go
    if (isExpoGo) {
      if (__DEV__) {
        logger.debug('⚠️ [Notifications] Skipping initialization in Expo Go');
      }
      return;
    }

    try {
      // Request permissions
      await this.requestPermissions();

      // Listen for notifications
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        logger.debug('📬 Notification received:', notification);
      });

      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        logger.debug('📬 Notification tapped:', response);
        // Handle navigation based on notification data
        const data = response.notification.request.content.data;
        if (data.chatId) {
          // Navigate to chat (you can use router here)
          logger.debug('Navigate to chat:', data.chatId);
        }
      });
    } catch (error) {
      logger.warn('⚠️ [Notifications] Failed to initialize:', error);
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(userId: string): Promise<void> {
    // COMMENT: PRODUCTION HARDENING - Expo Go Compatibility - Skip registration in Expo Go
    if (isExpoGo) {
      if (__DEV__) {
        logger.debug('⚠️ [Notifications] Skipping device token registration in Expo Go');
      }
      return;
    }

    try {
      logger.debug('📱 Registering device token for user:', userId);
      
      // Get EAS projectId from config
      const projectId =
        (Constants.expoConfig?.extra as any)?.eas?.projectId ||
        (Constants as any)?.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('EAS projectId missing - check app.config.js extra.eas.projectId');
      }
      
      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      
      logger.debug('📱 Expo push token:', token.data);
      
      // Generate device ID (use device ID or create unique identifier)
      const deviceId = Device.osInternalBuildId || 'unknown-device';
      
      // Store token in Firestore
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        [`notificationTokens.${deviceId}`]: {
          token: token.data,
          updatedAt: serverTimestamp(),
          platform: Platform.OS,
          isActive: true
        }
      }, { merge: true });
      
      logger.info('✅ Device token registered successfully');
      
      // Also store in backend for FCM
      try {
        await BackendAPI.post('/notifications/register-token', {
          userId,
          token: token.data,
          deviceId,
          platform: Platform.OS
        });
        logger.info('✅ Token registered with backend');
      } catch (backendError) {
        logger.warn('⚠️ Failed to register token with backend:', backendError);
      }
      
    } catch (error) {
      logger.error('❌ Failed to register device token:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    // COMMENT: PRODUCTION HARDENING - Expo Go Compatibility - Skip in Expo Go
    if (isExpoGo) {
      if (__DEV__) {
        logger.debug('⚠️ [Notifications] Skipping permission request in Expo Go');
      }
      return false;
    }

    if (!Device.isDevice) {
      logger.warn('Must use physical device for push notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Failed to get push notification permissions');
      return false;
    }

    return true;
  }

  /**
   * Send local notification for new message
   */
  async sendMessageNotification(
    chatId: string,
    senderId: string,
    senderName: string,
    messageText: string,
    currentUserId: string
  ) {
    try {
      // Don't notify if sender is current user
      if (senderId === currentUserId) {
        return;
      }

      // Don't notify if app is in foreground and chat is open
      // (This check would need to be passed from the chat screen)

      // Send local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: senderName,
          body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
          data: { chatId, senderId },
          sound: true,
          badge: 1,
        },
        trigger: null, // Show immediately
      });

      logger.info('✅ Notification sent for message from:', senderName);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Trigger backend push notification for new message
   */
  async triggerBackendNotification(chatId: string, senderId: string, messageText: string): Promise<void> {
    try {
      logger.debug('📤 Triggering backend notification for chat:', chatId);
      
      await BackendAPI.post('/notifications/send-message-notification', {
        chatId,
        senderId,
        messageText: messageText.substring(0, 40), // First 40 chars
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ Backend notification triggered successfully');
    } catch (error) {
      logger.error('❌ Failed to trigger backend notification:', error);
      // Don't throw - this shouldn't break message sending
    }
  }

  /**
   * Get sender name from user document
   */
  async getSenderName(senderId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'users', senderId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.displayName || userData.email?.split('@')[0] || 'Someone';
      }
      return 'Someone';
    } catch (error) {
      logger.error('Error getting sender name:', error);
      return 'Someone';
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Clear notifications for specific chat
   */
  async clearChatNotifications(chatId: string) {
    const notifications = await Notifications.getPresentedNotificationsAsync();
    for (const notification of notifications) {
      if (notification.request.content.data.chatId === chatId) {
        await Notifications.dismissNotificationAsync(notification.request.identifier);
      }
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const MessageNotificationService = new MessageNotificationServiceClass();
export default MessageNotificationService;

