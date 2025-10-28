/**
 * Global Chat Notification Service
 * Listens to ALL chats and sends notifications for new messages
 * Works app-wide, not just in chat screen
 */

import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import MessageNotificationService from './MessageNotificationService';

class GlobalChatNotificationServiceClass {
  private unsubscribe: (() => void) | null = null;
  private currentUserId: string | null = null;
  private lastMessageTimestamps: Map<string, number> = new Map();

  /**
   * Start listening to all user's chats for new messages
   */
  startListening(userId: string) {
    if (this.unsubscribe) {
      this.stopListening();
    }

    this.currentUserId = userId;
    console.log('🔔 Starting global chat notification listener for user:', userId);

    // Listen to all chats where user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );

    this.unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'modified') {
          const chat = change.doc.data();
          const chatId = change.doc.id;

          // Check if there's a new message
          if (chat.lastMessage) {
            const lastMessageTime = chat.lastMessage.timestamp?.toMillis?.() || 0;
            const previousTime = this.lastMessageTimestamps.get(chatId) || 0;

            // New message detected
            if (lastMessageTime > previousTime && chat.lastMessage.senderId !== userId) {
              console.log('🔔 New message detected in chat:', chatId);
              
              // Update timestamp
              this.lastMessageTimestamps.set(chatId, lastMessageTime);

              // Get sender name
              const senderName = await this.getSenderName(chat.lastMessage.senderId);

              // Send notification
              await MessageNotificationService.sendMessageNotification(
                chatId,
                chat.lastMessage.senderId,
                senderName,
                chat.lastMessage.text || 'Sent a file',
                userId
              );
            }
          }
        }
      });
    }, (error) => {
      console.error('🔔 GlobalChatNotificationService error:', error);
      // Don't stop listening on error, just log it
      // The service will continue to work for other chats
    });
  }

  /**
   * Stop listening to chats
   */
  stopListening() {
    if (this.unsubscribe) {
      console.log('🔕 Stopping global chat notification listener');
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.lastMessageTimestamps.clear();
  }

  /**
   * Get sender name from Firestore
   */
  private async getSenderName(senderId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'users', senderId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.displayName || userData.name || userData.email?.split('@')[0] || 'Someone';
      }
      return 'Someone';
    } catch (error) {
      console.error('Error getting sender name:', error);
      return 'Someone';
    }
  }
}

export const GlobalChatNotificationService = new GlobalChatNotificationServiceClass();
export default GlobalChatNotificationService;


