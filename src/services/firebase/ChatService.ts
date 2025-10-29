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
  onSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BackendAPI } from '../../config/backend';

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
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  deletedBy?: string;
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
      console.error('Error creating guild private chat:', error);
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
      console.error('Error creating guild group chat:', error);
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
      console.error('Error creating direct chat:', error);
      
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
      console.log('Falling back to Firebase for chats:', error);
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
      console.error('Error fetching chats:', error);
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
      console.log('Falling back to Firebase for guild chats:', error);
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
      console.error('Error fetching guild chats:', error);
      return [];
    }
  }

  /**
   * Get chat messages
   */
  async getChatMessages(
    chatId: string,
    limitCount: number = 50
  ): Promise<Message[]> {
    try {
      const response = await BackendAPI.get(`/chats/${chatId}/messages`, {
        params: { limit: limitCount }
      });
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for messages:', error);
    }

    // Fallback to Firebase
    try {
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(messagesQuery);
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      return messages.reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Send a message
   */
  async sendMessage(chatId: string, text: string): Promise<string> {
    try {
      const response = await BackendAPI.post(`/chats/${chatId}/messages`, { text });
      if (response && response.data && response.data.messageId) {
        return response.data.messageId;
      }
    } catch (error) {
      console.log('Falling back to Firebase for sending message:', error);
    }

    // Fallback to Firebase
    try {
      const messageData = {
        chatId,
        text,
        type: 'TEXT' as const,
        status: 'sent' as const,
        readBy: [],
        createdAt: serverTimestamp(),
      };

      const messageRef = await addDoc(
        collection(db, 'chats', chatId, 'messages'),
        messageData
      );

      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Listen to chat messages in real-time
   */
  listenToMessages(
    chatId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    // Maintain last good state to prevent UI clearing on errors
    let lastGood: Message[] = [];
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'asc')
      ),
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        lastGood = messages; // Update last good state
        callback(messages);
      },
      (error) => {
        console.error('Error listening to messages:', error);
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
        console.error('Error listening to chat:', error);
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
   */
  async markMessagesAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      await BackendAPI.post(`/chats/${chatId}/mark-read`, { messageIds });
    } catch (error) {
      console.error('Error marking messages as read:', error);
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





