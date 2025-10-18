/**
 * Firebase Notification Service - Production-Grade Notification Management
 * 
 * Handles all notification operations with Firebase Firestore:
 * - CRUD operations for notifications
 * - Real-time listeners
 * - Badge count management
 * - Device token storage
 * - Notification preferences
 * - Action logging for analytics
 */

import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type NotificationType = 
  | 'offer' 
  | 'payment' 
  | 'job' 
  | 'message' 
  | 'achievement' 
  | 'system' 
  | 'promotion'
  | 'guild'
  | 'dispute';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  metadata?: {
    amount?: number;
    jobId?: string;
    userId?: string;
    badgeName?: string;
    chatId?: string;
    guildId?: string;
    [key: string]: any;
  };
  createdAt: Timestamp | Date;
  readAt?: Timestamp | Date;
}

export interface NotificationPreferences {
  userId: string;
  // Push Notifications
  pushEnabled: boolean;
  jobAlerts: boolean;
  messageAlerts: boolean;
  guildUpdates: boolean;
  paymentAlerts: boolean;
  
  // Email Notifications
  emailEnabled: boolean;
  weeklyDigest: boolean;
  jobRecommendations: boolean;
  guildInvitations: boolean;
  
  // SMS Notifications
  smsEnabled: boolean;
  urgentOnly: boolean;
  paymentConfirmations: boolean;
  
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  
  // Frequency Settings
  instantNotifications: boolean;
  batchNotifications: boolean;
  dailySummary: boolean;
  
  updatedAt: Timestamp | Date;
}

export interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  deviceName?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  isActive: boolean;
}

export interface NotificationActionLog {
  notificationId: string;
  userId: string;
  action: 'opened' | 'dismissed' | 'clicked' | 'deleted';
  timestamp: Timestamp | Date;
  metadata?: any;
}

class FirebaseNotificationService {
  private notificationsCollection = collection(db, 'notifications');
  private preferencesCollection = collection(db, 'notificationPreferences');
  private deviceTokensCollection = collection(db, 'deviceTokens');
  private actionLogsCollection = collection(db, 'notificationActionLogs');
  
  /**
   * Fetch user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    limitCount: number = 50,
    filterType?: NotificationType,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      if (filterType) {
        q = query(q, where('type', '==', filterType));
      }

      if (unreadOnly) {
        q = query(q, where('isRead', '==', false));
      }

      const snapshot = await getDocs(q);
      const notifications: Notification[] = [];

      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as Notification);
      });

      logger.info(`📱 Fetched ${notifications.length} notifications for user ${userId}`);
      return notifications;
    } catch (error) {
      logger.error('❌ Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Set up real-time listener for notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifications: Notification[] = [];
          snapshot.forEach((doc) => {
            notifications.push({
              id: doc.id,
              ...doc.data(),
            } as Notification);
          });
          callback(notifications);
          logger.info(`📱 Real-time notification update: ${notifications.length} notifications`);
        },
        (error) => {
          logger.error('❌ Error in notification listener:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      logger.error('❌ Error setting up notification listener:', error);
      return () => {};
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notifRef = doc(this.notificationsCollection, notificationId);
      const notifSnap = await getDoc(notifRef);

      if (!notifSnap.exists() || notifSnap.data().userId !== userId) {
        logger.warn(`Notification ${notificationId} not found or unauthorized`);
        return false;
      }

      await updateDoc(notifRef, {
        isRead: true,
        readAt: serverTimestamp(),
      });

      // Log action
      await this.logAction(notificationId, userId, 'opened');

      logger.info(`📱 Marked notification ${notificationId} as read`);
      return true;
    } catch (error) {
      logger.error('❌ Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      const updates: Promise<void>[] = [];

      snapshot.forEach((docSnap) => {
        updates.push(
          updateDoc(doc(this.notificationsCollection, docSnap.id), {
            isRead: true,
            readAt: serverTimestamp(),
          })
        );
      });

      await Promise.all(updates);

      logger.info(`📱 Marked all notifications as read for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('❌ Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      logger.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notifRef = doc(this.notificationsCollection, notificationId);
      const notifSnap = await getDoc(notifRef);

      if (!notifSnap.exists() || notifSnap.data().userId !== userId) {
        logger.warn(`Notification ${notificationId} not found or unauthorized`);
        return false;
      }

      await deleteDoc(notifRef);

      // Log action
      await this.logAction(notificationId, userId, 'deleted');

      logger.info(`📱 Deleted notification ${notificationId}`);
      return true;
    } catch (error) {
      logger.error('❌ Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Create notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    description: string,
    priority: NotificationPriority = 'medium',
    actionUrl?: string,
    metadata?: any
  ): Promise<string | null> {
    try {
      const docRef = await addDoc(this.notificationsCollection, {
        userId,
        type,
        title,
        description,
        isRead: false,
        priority,
        actionUrl,
        metadata: metadata || {},
        createdAt: serverTimestamp(),
      });

      logger.info(`📱 Created notification ${docRef.id} for user ${userId}`);
      return docRef.id;
    } catch (error) {
      logger.error('❌ Error creating notification:', error);
      return null;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const prefRef = doc(this.preferencesCollection, userId);
      const prefSnap = await getDoc(prefRef);

      if (!prefSnap.exists()) {
        // Return default preferences
        return this.getDefaultPreferences(userId);
      }

      return prefSnap.data() as NotificationPreferences;
    } catch (error) {
      logger.error('❌ Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const prefRef = doc(this.preferencesCollection, userId);
      
      await setDoc(
        prefRef,
        {
          ...preferences,
          userId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      logger.info(`📱 Updated notification preferences for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('❌ Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web'
  ): Promise<boolean> {
    try {
      const deviceId = Device.osInternalBuildId || 'unknown';
      const deviceName = Device.deviceName || 'Unknown Device';

      // Use token as document ID to prevent duplicates
      const tokenRef = doc(this.deviceTokensCollection, token);

      await setDoc(tokenRef, {
        userId,
        token,
        platform,
        deviceId,
        deviceName,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      logger.info(`📱 Registered device token for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('❌ Error registering device token:', error);
      return false;
    }
  }

  /**
   * Deactivate device token
   */
  async deactivateDeviceToken(token: string): Promise<boolean> {
    try {
      const tokenRef = doc(this.deviceTokensCollection, token);
      await updateDoc(tokenRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      logger.info(`📱 Deactivated device token`);
      return true;
    } catch (error) {
      logger.error('❌ Error deactivating device token:', error);
      return false;
    }
  }

  /**
   * Get active device tokens for user
   */
  async getUserDeviceTokens(userId: string): Promise<string[]> {
    try {
      const q = query(
        this.deviceTokensCollection,
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const tokens: string[] = [];

      snapshot.forEach((doc) => {
        tokens.push(doc.data().token);
      });

      return tokens;
    } catch (error) {
      logger.error('❌ Error getting device tokens:', error);
      return [];
    }
  }

  /**
   * Log notification action for analytics
   */
  async logAction(
    notificationId: string,
    userId: string,
    action: 'opened' | 'dismissed' | 'clicked' | 'deleted',
    metadata?: any
  ): Promise<void> {
    try {
      await addDoc(this.actionLogsCollection, {
        notificationId,
        userId,
        action,
        metadata: metadata || {},
        timestamp: serverTimestamp(),
      });

      logger.info(`📱 Logged notification action: ${action} for ${notificationId}`);
    } catch (error) {
      logger.error('❌ Error logging notification action:', error);
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
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
      updatedAt: new Date(),
    };
  }

  /**
   * Clean up old read notifications (for scheduled tasks)
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const q = query(
        this.notificationsCollection,
        where('userId', '==', userId),
        where('isRead', '==', true),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];

      snapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(this.notificationsCollection, docSnap.id)));
      });

      await Promise.all(deletePromises);

      logger.info(`📱 Cleaned up ${snapshot.size} old notifications`);
      return snapshot.size;
    } catch (error) {
      logger.error('❌ Error cleaning up old notifications:', error);
      return 0;
    }
  }
}

export const firebaseNotificationService = new FirebaseNotificationService();


