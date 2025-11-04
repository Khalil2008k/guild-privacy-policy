/**
 * Chat Service - Frontend chat management
 * Handles guild chats, direct messages, and real-time messaging
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  onSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BackendAPI } from '../../config/backend';
import MessageAnalyticsService from '../MessageAnalyticsService';
import MessageQueueService from '../MessageQueueService';
import { logger } from '../../utils/logger';
// COMMENT: PRIORITY 1 - Logger already imported
import { sanitizeMessage } from '../../utils/sanitize';

export interface Chat {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  jobId?: string;
  guildId?: string;
  chatType?: 'PRIVATE' | 'GUILD_PRIVATE' | 'GUILD_GROUP' | 'JOB_CHAT';
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  attachments?: string[];
  // COMMENT: PRODUCTION HARDENING - Task 3.4 - Added message delivery states (sending, delivered, failed)
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: string[];
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  deletedBy?: string;
  // COMMENT: PRODUCTION HARDENING - Task 3.4 - Delivery timestamps
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
  failedAt?: Timestamp;
  failureReason?: string;
}

export interface CreateChatData {
  participants: string[];
  jobId?: string;
  guildId?: string;
  chatType?: 'PRIVATE' | 'GUILD_PRIVATE' | 'GUILD_GROUP' | 'JOB_CHAT';
}

class ChatService {
  private chatListeners: Map<string, () => void> = new Map();
  private messageListeners: Map<string, () => void> = new Map();

  /**
   * Create guild private chat (one-on-one between guild members)
   */
  async createGuildPrivateChat(guildId: string, participant1Id: string, participant2Id: string): Promise<Chat> {
    try {
      const response = await BackendAPI.post('/chats/guild-private', {
        guildId,
        participants: [participant1Id, participant2Id]
      });
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to create guild private chat');
    } catch (error) {
      logger.error('Error creating guild private chat:', error);
      throw error;
    }
  }

  /**
   * Create guild group chat (all guild members)
   */
  async createGuildGroupChat(guildId: string): Promise<Chat> {
    try {
      const response = await BackendAPI.post('/chats/guild-group', { guildId });
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to create guild group chat');
    } catch (error) {
      logger.error('Error creating guild group chat:', error);
      throw error;
    }
  }

  /**
   * Create direct chat between users
   */
  async createDirectChat(recipientId: string): Promise<Chat> {
    try {
      const response = await BackendAPI.post('/chats/direct', { recipientId });
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to create direct chat');
    } catch (error) {
      logger.error('Error creating direct chat:', error);
      
      // Fallback to Firebase
      const chatData: Partial<Chat> = {
        participants: [recipientId],
        chatType: 'PRIVATE',
        unreadCount: 0,
        isActive: true,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      return {
        id: chatRef.id,
        ...chatData,
        unreadCount: 0,
        isActive: true,
        participants: [recipientId]
      } as Chat;
    }
  }

  /**
   * Get user's chats
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const response = await BackendAPI.get(`/users/${userId}/chats`);
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      logger.debug('Falling back to Firebase for chats:', error);
    }

    // Fallback to Firebase
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(chatsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
    } catch (error) {
      logger.error('Error fetching chats:', error);
      return [];
    }
  }

  /**
   * Get guild chats
   */
  async getGuildChats(guildId: string): Promise<Chat[]> {
    try {
      const response = await BackendAPI.get(`/guilds/${guildId}/chats`);
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      logger.debug('Falling back to Firebase for guild chats:', error);
    }

    // Fallback to Firebase
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('guildId', '==', guildId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(chatsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
    } catch (error) {
      logger.error('Error fetching guild chats:', error);
      return [];
    }
  }

  /**
   * Get chat messages with pagination support
   * COMMENT: PRODUCTION HARDENING - Task 3.6 - Added pagination support for loading more messages
   */
  async getChatMessages(
    chatId: string,
    limitCount: number = 50,
    lastMessageId?: string,
    lastMessageTimestamp?: Timestamp
  ): Promise<{ messages: Message[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
    try {
      const response = await BackendAPI.get(`/chats/${chatId}/messages`, {
        params: { 
          limit: limitCount,
          ...(lastMessageId && { lastMessageId }),
          ...(lastMessageTimestamp && { lastMessageTimestamp: lastMessageTimestamp.toMillis() })
        }
      });
      if (response && response.data) {
        // Backend API response should include hasMore flag
        return {
          messages: response.data.messages || response.data,
          lastDoc: null, // Backend API doesn't return Firestore docs
          hasMore: response.data.hasMore || false,
        };
      }
    } catch (error) {
      logger.debug('Falling back to Firebase for messages:', error);
    }

    // Fallback to Firebase
    try {
      let messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(limitCount + 1) // Get one extra to check if there are more
      );

      // COMMENT: PRODUCTION HARDENING - Task 3.6 - Pagination with cursor support
      // If lastMessageTimestamp is provided, start after that timestamp
      if (lastMessageTimestamp) {
        // First, get the document at the cursor position
        const cursorQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          where('createdAt', '<=', lastMessageTimestamp),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const cursorSnapshot = await getDocs(cursorQuery);
        
        if (!cursorSnapshot.empty) {
          const lastDoc = cursorSnapshot.docs[0];
          messagesQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(limitCount + 1)
          );
        }
      }

      const snapshot = await getDocs(messagesQuery);
      const docs = snapshot.docs;
      const hasMore = docs.length > limitCount;
      
      // If we got an extra doc, remove it from the results
      const messagesToReturn = hasMore ? docs.slice(0, limitCount) : docs;
      
      const messages = messagesToReturn.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message)).reverse(); // Reverse to show oldest first (for scroll up)

      const lastDoc = messagesToReturn.length > 0 ? messagesToReturn[messagesToReturn.length - 1] : null;

      return {
        messages,
        lastDoc,
        hasMore,
      };
    } catch (error) {
      logger.error('Error fetching messages:', error);
      return {
        messages: [],
        lastDoc: null,
        hasMore: false,
      };
    }
  }

  /**
   * Send a message
   * COMMENT: PRODUCTION HARDENING - Task 3.3, 3.4 & 3.8 - MessageAnalyticsService integrated + message delivery states + sanitization
   * COMMENT: PRODUCTION HARDENING - Task 5.3 - Performance benchmarking added
   */
  async sendMessage(chatId: string, text: string, senderId?: string): Promise<string> {
    // COMMENT: PRODUCTION HARDENING - Task 5.3 - Benchmark sendMessage operation
    const { performanceBenchmark } = await import('../../utils/performanceBenchmark');
    return performanceBenchmark.measureAsync(
      'chat:sendMessage',
      async () => {
    // COMMENT: PRODUCTION HARDENING - Task 3.8 - Sanitize message text before processing
    const sanitizedText = sanitizeMessage(text);
    
    // Validate that sanitized text is not empty
    if (!sanitizedText || sanitizedText.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }

    // COMMENT: PRODUCTION HARDENING - Task 3.4 - Create temporary message with 'sending' status
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // COMMENT: PRODUCTION HARDENING - Task 3.3 - Analyze message sentiment and analytics (using sanitized text)
      const sentiment = MessageAnalyticsService.analyzeSentiment(sanitizedText);
      const isUrgent = MessageAnalyticsService.isUrgent(sanitizedText);
      const messageType = MessageAnalyticsService.detectMessageType(sanitizedText);
      const language = MessageAnalyticsService.detectLanguage(sanitizedText);
      const readingTime = MessageAnalyticsService.calculateReadingTime(sanitizedText);
      
      const messageData = {
        text: sanitizedText, // COMMENT: PRODUCTION HARDENING - Task 3.8 - Use sanitized text
        sentiment,
        isUrgent,
        language,
        readingTime,
        analytics: {
          hasLink: messageType.hasLink,
          hasEmail: messageType.hasEmail,
          hasPhone: messageType.hasPhone,
          hasLocation: messageType.hasLocation,
          hasDate: messageType.hasDate,
          hasTime: messageType.hasTime,
          hasMention: messageType.hasMention,
          hasHashtag: messageType.hasHashtag,
        },
        ...(senderId && { senderId }),
      };

      const response = await BackendAPI.post(`/chats/${chatId}/messages`, messageData);
      if (response && response.data && response.data.messageId) {
        // COMMENT: PRODUCTION HARDENING - Task 3.4 - Message sent successfully, status updated to 'sent'
        return response.data.messageId;
      }
    } catch (error) {
      logger.debug('Falling back to Firebase for sending message:', error);
    }

    // Fallback to Firebase
    try {
      // COMMENT: PRODUCTION HARDENING - Task 3.3 & 3.8 - Analyze message sentiment and analytics for Firestore (using sanitized text)
      const sentiment = MessageAnalyticsService.analyzeSentiment(sanitizedText);
      const isUrgent = MessageAnalyticsService.isUrgent(sanitizedText);
      const messageType = MessageAnalyticsService.detectMessageType(sanitizedText);
      const language = MessageAnalyticsService.detectLanguage(sanitizedText);
      const readingTime = MessageAnalyticsService.calculateReadingTime(sanitizedText);
      
      const messageData = {
        chatId,
        text: sanitizedText, // COMMENT: PRODUCTION HARDENING - Task 3.8 - Use sanitized text
        type: 'TEXT' as const,
        // COMMENT: PRODUCTION HARDENING - Task 3.4 - Start with 'sending' status, update to 'sent' after successful save
        status: 'sending' as const,
        readBy: senderId ? [senderId] : [],
        // COMMENT: PRODUCTION HARDENING - Task 3.3 - Store sentiment and analytics data
        sentiment,
        isUrgent,
        language,
        readingTime,
        analytics: {
          hasLink: messageType.hasLink,
          hasEmail: messageType.hasEmail,
          hasPhone: messageType.hasPhone,
          hasLocation: messageType.hasLocation,
          hasDate: messageType.hasDate,
          hasTime: messageType.hasTime,
          hasMention: messageType.hasMention,
          hasHashtag: messageType.hasHashtag,
        },
        ...(senderId && { senderId }),
        createdAt: serverTimestamp(),
      };

      const messageRef = await addDoc(
        collection(db, 'chats', chatId, 'messages'),
        messageData
      );

      // COMMENT: PRODUCTION HARDENING - Task 3.4 - Update status to 'sent' after successful save
      await updateDoc(messageRef, {
        status: 'sent' as const,
        sentAt: serverTimestamp(),
      });

      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text: sanitizedText, // COMMENT: PRODUCTION HARDENING - Task 3.8 - Use sanitized text
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      return messageRef.id;
    } catch (error: any) {
      // COMMENT: PRODUCTION HARDENING - Task 3.5 - Add failed message to offline queue for retry
      logger.error('Error sending message:', error);
      
      // Add to offline queue for retry
      if (senderId) {
        try {
          await MessageQueueService.addToQueue({
            chatId,
            text: sanitizedText, // COMMENT: PRODUCTION HARDENING - Task 3.8 - Use sanitized text
            senderId,
            type: 'TEXT',
            status: 'pending',
            failureReason: error?.message || 'Failed to send message',
            metadata: {
              errorCode: error?.code,
              errorName: error?.name,
            },
          });
          logger.info(`📥 Added failed message to queue for retry`);
        } catch (queueError) {
          logger.error('Error adding message to queue:', queueError);
        }
      }
      
      throw error;
    }
      },
      { chatId, hasSender: !!senderId }
    );
  }

  /**
   * Listen to chat messages in real-time
   * COMMENT: PRODUCTION HARDENING - Task 3.4 & 3.6 - Messages include delivery states + pagination support
   * 
   * Note: For large chats, consider using pagination with initial load limit
   * This method loads all messages which may be inefficient for very large chats
   */
  listenToMessages(
    chatId: string,
    callback: (messages: Message[]) => void,
    initialLimit?: number
  ): () => void {
    // Maintain last good state to prevent UI clearing on errors
    let lastGood: Message[] = [];
    
    // COMMENT: PRODUCTION HARDENING - Task 3.6 - Support initial limit for pagination
    // If initialLimit is provided, only listen to the most recent messages
    let messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    if (initialLimit && initialLimit > 0) {
      // For initial load, only listen to the most recent messages
      // This allows pagination by loading older messages separately
      messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(initialLimit)
      );
    }
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          // COMMENT: PRODUCTION HARDENING - Task 3.4 - Ensure message has delivery state
          // Default to 'sent' if status is missing (for backward compatibility)
          const message: Message = {
            id: doc.id,
            ...data,
            status: data.status || 'sent',
          } as Message;
          return message;
        });
        
        // COMMENT: PRODUCTION HARDENING - Task 3.6 - Reverse if ordered desc (for initial limit)
        const orderedMessages = initialLimit ? messages.reverse() : messages;
        
        lastGood = orderedMessages; // Update last good state
        callback(orderedMessages);
      },
      (error) => {
        // COMMENT: PRIORITY 1 - Use logger instead of console.error
        logger.error('Error listening to messages:', error);
        // Don't clear UI - maintain last good state
        callback(lastGood);
      }
    );

    this.messageListeners.set(chatId, unsubscribe);

    return () => {
      unsubscribe();
      this.messageListeners.delete(chatId);
    };
  }

  /**
   * Load more messages (older messages) for pagination
   * COMMENT: PRODUCTION HARDENING - Task 3.6 - Load older messages for pagination
   */
  async loadMoreMessages(
    chatId: string,
    lastMessageTimestamp: Timestamp,
    limitCount: number = 50
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const result = await this.getChatMessages(chatId, limitCount, undefined, lastMessageTimestamp);
      return {
        messages: result.messages,
        hasMore: result.hasMore,
      };
    } catch (error) {
      logger.error('Error loading more messages:', error);
      return {
        messages: [],
        hasMore: false,
      };
    }
  }

  /**
   * Listen to chat updates
   */
  listenToChat(chatId: string, callback: (chat: Chat | null) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'chats', chatId),
      (doc) => {
        if (doc.exists()) {
          callback({
            id: doc.id,
            ...doc.data()
          } as Chat);
        } else {
          callback(null);
        }
      },
      (error) => {
        // COMMENT: PRIORITY 1 - Use logger instead of console.error
        logger.error('Error listening to chat:', error);
      }
    );

    this.chatListeners.set(chatId, unsubscribe);

    return () => {
      unsubscribe();
      this.chatListeners.delete(chatId);
    };
  }

  /**
   * Mark messages as read
   * COMMENT: PRODUCTION HARDENING - Task 3.4 - Update message status to 'read' when marked as read
   */
  async markMessagesAsRead(chatId: string, messageIds: string[], userId: string): Promise<void> {
    try {
      // COMMENT: PRODUCTION HARDENING - Task 3.4 - Update message status to 'read' in Firestore
      const batch = writeBatch(db);
      
      messageIds.forEach(messageId => {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        batch.update(messageRef, {
          status: 'read' as const,
          readBy: arrayUnion(userId),
          readAt: serverTimestamp(),
        });
      });
      
      await batch.commit();
      
      // Also try backend API if available
      try {
        await BackendAPI.post(`/chats/${chatId}/mark-read`, { messageIds });
      } catch (backendError) {
        // Backend API is optional, Firestore update is primary
        if (__DEV__) {
          logger.warn('Backend API mark-read failed (non-critical):', backendError);
        }
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Use logger instead of console.error
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Update message status to delivered
   * COMMENT: PRODUCTION HARDENING - Task 3.4 - Update message status when delivered
   */
  async markMessageAsDelivered(chatId: string, messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        status: 'delivered' as const,
        deliveredAt: serverTimestamp(),
      });
    } catch (error) {
      if (__DEV__) {
        logger.error('Error marking message as delivered:', error);
      }
    }
  }

  /**
   * Update message status to failed
   * COMMENT: PRODUCTION HARDENING - Task 3.4 - Update message status when send fails
   */
  async markMessageAsFailed(chatId: string, messageId: string, reason?: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        status: 'failed' as const,
        failedAt: serverTimestamp(),
        ...(reason && { failureReason: reason }),
      });
    } catch (error) {
      if (__DEV__) {
        logger.error('Error marking message as failed:', error);
      }
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.chatListeners.forEach(unsubscribe => unsubscribe());
    this.messageListeners.forEach(unsubscribe => unsubscribe());
    this.chatListeners.clear();
    this.messageListeners.clear();
  }
}

// Export singleton instance
export const chatService = new ChatService();





