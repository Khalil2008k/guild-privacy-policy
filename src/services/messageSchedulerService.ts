/**
 * Message Scheduler Service
 * 
 * Handles scheduling messages to be sent at a specific date/time
 */

import { db } from '../config/firebase';
import { collection, addDoc, doc, query, where, getDocs, deleteDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { logger } from '../utils/logger';
import { chatService } from './chatService';
import * as Notifications from 'expo-notifications';

export interface ScheduledMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  scheduledDate: Timestamp;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: Timestamp;
  sentAt?: Timestamp;
  cancelledAt?: Timestamp;
}

class MessageSchedulerService {
  /**
   * Schedule a message to be sent at a specific date/time
   */
  async scheduleMessage(
    chatId: string,
    senderId: string,
    text: string,
    scheduledDate: Date
  ): Promise<string> {
    try {
      logger.debug(`📅 Scheduling message for ${scheduledDate.toISOString()}`);

      // Create scheduled message document
      const scheduledMessageRef = await addDoc(collection(db, 'scheduled_messages'), {
        chatId,
        senderId,
        text,
        scheduledDate: Timestamp.fromDate(scheduledDate),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Schedule local notification as backup (in case backend service fails)
      await this.scheduleLocalNotification(
        scheduledMessageRef.id,
        scheduledDate,
        text
      );

      logger.debug(`✅ Message scheduled with ID: ${scheduledMessageRef.id}`);
      return scheduledMessageRef.id;
    } catch (error) {
      logger.error('❌ Error scheduling message:', error);
      throw error;
    }
  }

  /**
   * Schedule local notification as backup
   */
  private async scheduleLocalNotification(
    messageId: string,
    scheduledDate: Date,
    messageText: string
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Scheduled Message',
          body: messageText.substring(0, 100),
          data: { messageId, type: 'scheduled_message' },
        },
        trigger: scheduledDate,
      });

      logger.debug(`📱 Local notification scheduled for message ${messageId}`);
    } catch (error) {
      logger.warn('Failed to schedule local notification:', error);
      // Non-critical, continue even if notification fails
    }
  }

  /**
   * Cancel a scheduled message
   */
  async cancelScheduledMessage(messageId: string): Promise<void> {
    try {
      logger.debug(`❌ Cancelling scheduled message: ${messageId}`);

      const messageRef = doc(db, 'scheduled_messages', messageId);
      await updateDoc(messageRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
      });

      // Cancel local notification
      await Notifications.cancelScheduledNotificationAsync(messageId);

      logger.debug(`✅ Scheduled message cancelled: ${messageId}`);
    } catch (error) {
      logger.error('❌ Error cancelling scheduled message:', error);
      throw error;
    }
  }

  /**
   * Get scheduled messages for a user
   */
  async getScheduledMessages(userId: string, chatId?: string): Promise<ScheduledMessage[]> {
    try {
      let q = query(
        collection(db, 'scheduled_messages'),
        where('senderId', '==', userId),
        where('status', '==', 'pending')
      );

      if (chatId) {
        q = query(q, where('chatId', '==', chatId));
      }

      const querySnapshot = await getDocs(q);
      const messages: ScheduledMessage[] = [];

      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        } as ScheduledMessage);
      });

      return messages.sort((a, b) => {
        const aTime = a.scheduledDate?.toMillis?.() || 0;
        const bTime = b.scheduledDate?.toMillis?.() || 0;
        return aTime - bTime;
      });
    } catch (error) {
      logger.error('❌ Error fetching scheduled messages:', error);
      throw error;
    }
  }

  /**
   * Send a scheduled message (called by backend service or local notification handler)
   */
  async sendScheduledMessage(messageId: string): Promise<void> {
    try {
      logger.debug(`📤 Sending scheduled message: ${messageId}`);

      const messageRef = doc(db, 'scheduled_messages', messageId);
      const { getDoc } = await import('firebase/firestore');
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error(`Scheduled message ${messageId} not found`);
      }

      const messageData = messageDoc.data() as ScheduledMessage;

      if (messageData.status !== 'pending') {
        logger.warn(`⚠️ Scheduled message ${messageId} is not pending (status: ${messageData.status})`);
        return;
      }

      // Send the message using chatService
      await chatService.sendMessage(
        messageData.chatId,
        messageData.text,
        messageData.senderId
      );

      // Update scheduled message status
      await updateDoc(messageRef, {
        status: 'sent',
        sentAt: serverTimestamp(),
      });

      // Cancel local notification
      await Notifications.cancelScheduledNotificationAsync(messageId);

      logger.debug(`✅ Scheduled message sent: ${messageId}`);
    } catch (error) {
      logger.error('❌ Error sending scheduled message:', error);
      throw error;
    }
  }

  /**
   * Check and send any pending scheduled messages (should be called periodically)
   */
  async checkAndSendPendingMessages(): Promise<void> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, 'scheduled_messages'),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      const promises: Promise<void>[] = [];

      querySnapshot.forEach((doc) => {
        const messageData = doc.data() as ScheduledMessage;
        const scheduledTime = messageData.scheduledDate?.toMillis?.() || 0;
        const nowTime = now.toMillis();

        // Send if scheduled time has passed (with 1 minute grace period)
        if (scheduledTime <= nowTime + 60000) {
          promises.push(this.sendScheduledMessage(doc.id));
        }
      });

      await Promise.all(promises);

      if (promises.length > 0) {
        logger.debug(`✅ Processed ${promises.length} scheduled messages`);
      }
    } catch (error) {
      logger.error('❌ Error checking scheduled messages:', error);
      throw error;
    }
  }
}

export const messageSchedulerService = new MessageSchedulerService();






