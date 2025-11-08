/**
 * Support Chat Service
 * Service for managing AI-powered support chats
 */

import { chatService } from './chatService';
import { logger } from '../utils/logger';
import { auth, db } from '../config/firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const SUPPORT_BOT_ID = 'support_bot';
export const SUPPORT_CHAT_PREFIX = 'support_';

export class SupportChatService {
  /**
   * Get or create support chat for current user
   */
  static async getOrCreateSupportChat(): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = currentUser.uid;
      const chatId = `${SUPPORT_CHAT_PREFIX}${userId}`;

      // Check if support chat exists
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        logger.info(`Support chat already exists for user ${userId}`);
        return chatId;
      }

      // Create support chat
      await setDoc(chatRef, {
        participants: [userId, SUPPORT_BOT_ID],
        participantNames: {
          [userId]: currentUser.displayName || currentUser.email || 'User',
          [SUPPORT_BOT_ID]: 'GUILD Support'
        },
        pinned: true,
        undeletable: true,
        type: 'support',
        ai_agent: 'IDE_AI',
        isActive: true,
        unreadCount: {
          [userId]: 1, // User has 1 unread (welcome message)
          [SUPPORT_BOT_ID]: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: 'Welcome to GUILD Support 👋',
          senderId: SUPPORT_BOT_ID,
          timestamp: serverTimestamp()
        }
      });

      // Create welcome message
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await setDoc(doc(messagesRef), {
        chatId,
        senderId: SUPPORT_BOT_ID,
        text: `Hey ${currentUser.displayName || 'there'}, welcome to GUILD! 👋\n\nI'm your personal AI assistant. How can I help you today?`,
        type: 'ai',
        status: 'SENT',
        readBy: [],
        meta: {
          confidenceScore: 1.0,
          handledBy: 'AI',
          stream: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      logger.info(`✅ Support chat created for user ${userId}`);
      return chatId;

    } catch (error: any) {
      logger.error('Error getting or creating support chat:', error);
      throw error;
    }
  }

  /**
   * Check if chat is a support chat
   */
  static isSupportChat(chatId: string): boolean {
    return chatId.startsWith(SUPPORT_CHAT_PREFIX);
  }

  /**
   * Check if chat is pinned
   */
  static async isPinned(chatId: string): Promise<boolean> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        return false;
      }

      const chatData = chatDoc.data();
      return chatData?.pinned === true || chatData?.type === 'support';
    } catch (error: any) {
      logger.error('Error checking if chat is pinned:', error);
      return false;
    }
  }

  /**
   * Check if chat is undeletable
   */
  static async isUndeletable(chatId: string): Promise<boolean> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        return false;
      }

      const chatData = chatDoc.data();
      return chatData?.undeletable === true || chatData?.type === 'support';
    } catch (error: any) {
      logger.error('Error checking if chat is undeletable:', error);
      return false;
    }
  }
}

