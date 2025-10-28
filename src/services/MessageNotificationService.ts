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

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class MessageNotificationServiceClass {
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification listeners
   */
  async initialize() {
    // Request permissions
    await this.requestPermissions();

    // Listen for notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📬 Notification tapped:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data.chatId) {
        // Navigate to chat (you can use router here)
        console.log('Navigate to chat:', data.chatId);
      }
    });
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(userId: string): Promise<void> {
    try {
      console.log('📱 Registering device token for user:', userId);
      
      // Get EAS projectId from config
      const projectId =
        (Constants.expoConfig?.extra as any)?.eas?.projectId ||
        (Constants as any)?.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('EAS projectId missing - check app.config.js extra.eas.projectId');
      }
      
      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      
      console.log('📱 Expo push token:', token.data);
      
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
      
      console.log('✅ Device token registered successfully');
      
      // Also store in backend for FCM
      try {
        await BackendAPI.post('/notifications/register-token', {
          userId,
          token: token.data,
          deviceId,
          platform: Platform.OS
        });
        console.log('✅ Token registered with backend');
      } catch (backendError) {
        console.warn('⚠️ Failed to register token with backend:', backendError);
      }
      
    } catch (error) {
      console.error('❌ Failed to register device token:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
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

      console.log('✅ Notification sent for message from:', senderName);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Trigger backend push notification for new message
   */
  async triggerBackendNotification(chatId: string, senderId: string, messageText: string): Promise<void> {
    try {
      console.log('📤 Triggering backend notification for chat:', chatId);
      
      await BackendAPI.post('/notifications/send-message-notification', {
        chatId,
        senderId,
        messageText: messageText.substring(0, 40), // First 40 chars
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Backend notification triggered successfully');
    } catch (error) {
      console.error('❌ Failed to trigger backend notification:', error);
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
      console.error('Error getting sender name:', error);
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

