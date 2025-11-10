/**
 * Disappearing Message Service
 * 
 * Handles automatic deletion of messages after expiration
 */

import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { logger } from '../utils/logger';

class DisappearingMessageService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Check every minute

  /**
   * Start background cleanup service
   */
  startCleanupService(): void {
    if (this.cleanupInterval) {
      logger.debug('🕐 Disappearing message cleanup service already running');
      return;
    }

    logger.debug('🕐 Starting disappearing message cleanup service');
    
    // Run immediately
    this.cleanupExpiredMessages();
    
    // Then run periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredMessages();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop background cleanup service
   */
  stopCleanupService(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.debug('🕐 Stopped disappearing message cleanup service');
    }
  }

  /**
   * Clean up expired messages across all chats
   */
  async cleanupExpiredMessages(): Promise<void> {
    try {
      const now = Timestamp.now();
      
      // Query all messages that are disappearing and expired
      // Note: This is a broad query, in production you might want to optimize this
      const q = query(
        collection(db, 'chats'),
        where('disappearingMessageDuration', '>', 0) // Only chats with disappearing messages enabled
      );

      const chatsSnapshot = await getDocs(q);
      const batch = writeBatch(db);
      let deletedCount = 0;

      for (const chatDoc of chatsSnapshot.docs) {
        const chatId = chatDoc.id;
        const messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          where('isDisappearing', '==', true),
          where('expiresAt', '<=', now)
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        messagesSnapshot.docs.forEach(messageDoc => {
          const messageRef = doc(db, 'chats', chatId, 'messages', messageDoc.id);
          batch.update(messageRef, {
            deletedAt: serverTimestamp(),
            deletedBy: 'system',
            text: '', // Clear message text
            attachments: [], // Clear attachments
          });
          deletedCount++;
        });
      }

      if (deletedCount > 0) {
        await batch.commit();
        logger.debug(`🕐 Deleted ${deletedCount} expired disappearing messages`);
      }
    } catch (error) {
      logger.error('🕐 Error cleaning up expired messages:', error);
    }
  }

  /**
   * Set disappearing message duration for a chat
   */
  async setDisappearingDuration(
    chatId: string,
    duration: number // Duration in seconds, 0 = off
  ): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        disappearingMessageDuration: duration,
        updatedAt: serverTimestamp(),
      });

      logger.debug(`🕐 Set disappearing message duration to ${duration} seconds for chat ${chatId}`);
    } catch (error) {
      logger.error('🕐 Error setting disappearing message duration:', error);
      throw error;
    }
  }

  /**
   * Calculate expiration timestamp for a message
   */
  calculateExpiration(duration: number): Timestamp {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + duration);
    return Timestamp.fromDate(expiresAt);
  }

  /**
   * Mark a message as disappearing
   */
  async markMessageAsDisappearing(
    chatId: string,
    messageId: string,
    duration: number
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const expiresAt = this.calculateExpiration(duration);

      await updateDoc(messageRef, {
        isDisappearing: true,
        disappearingDuration: duration,
        expiresAt: expiresAt,
      });

      logger.debug(`🕐 Marked message ${messageId} as disappearing (expires at ${expiresAt.toDate().toISOString()})`);
    } catch (error) {
      logger.error('🕐 Error marking message as disappearing:', error);
      throw error;
    }
  }
}

export const disappearingMessageService = new DisappearingMessageService();

// Auto-start cleanup service
if (typeof window !== 'undefined') {
  disappearingMessageService.startCleanupService();
}








