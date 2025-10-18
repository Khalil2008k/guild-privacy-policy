/**
 * Chat Service - Firebase integration for chat functionality
 * Handles chat operations and persistence
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  serverTimestamp,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BackendAPI } from '../config/backend';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface Chat {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  jobId?: string;
  guildId?: string;
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
  editHistory?: Array<{
    text: string;
    editedAt: Timestamp;
  }>;
  fileMetadata?: {
    originalName: string;
    size: number;
    hash: string;
    storagePath: string;
  };
  evidence?: {
    deviceInfo: string;
    appVersion: string;
    ipAddress?: string;
  };
  uploadStatus?: 'uploading' | 'uploaded' | 'failed';
}

class ChatService {
  private chatListeners: Map<string, () => void> = new Map();

  /**
   * Get user's chats
   */
  async getUserChats(): Promise<Chat[]> {
    try {
      // Try backend first
      const response = await BackendAPI.get('/chat/my-chats');
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for chats:', error);
    }

    // Fallback to Firebase
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn('User not authenticated for chat service - returning empty list');
      return [];
    }

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
  }

  /**
   * Create direct chat
   */
  async createDirectChat(recipientId: string): Promise<Chat> {
    try {
      // Try backend first
      const response = await BackendAPI.post('/chat/direct', { recipientId });
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for direct chat creation:', error);
    }

    // Fallback to Firebase
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn('User not authenticated for chat service - returning empty list');
      return [];
    }

    // Check if chat already exists
    const existingChat = await this.findExistingDirectChat(userId, recipientId);
    if (existingChat) return existingChat;

    // Create new chat
    const chatData = {
      participants: [userId, recipientId],
      participantNames: {}, // Would need to fetch user names
      unreadCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    
    return {
      id: chatRef.id,
      ...chatData,
      unreadCount: 0,
      isActive: true
    } as Chat;
  }

  /**
   * Create job chat
   */
  async createJobChat(jobId: string, participants: string[]): Promise<Chat> {
    try {
      // Try backend first
      const response = await BackendAPI.post('/chat/job', { jobId, participants });
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for job chat creation:', error);
    }

    // Fallback to Firebase
    const chatData = {
      participants,
      jobId,
      participantNames: {},
      unreadCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    
    return {
      id: chatRef.id,
      ...chatData,
      unreadCount: 0,
      isActive: true
    } as Chat;
  }

  /**
   * Get chat messages
   */
  async getChatMessages(
    chatId: string, 
    limitCount: number = 50,
    lastMessageId?: string
  ): Promise<Message[]> {
    try {
      // Try backend first
      const response = await BackendAPI.get(`/chat/${chatId}/messages`, {
        params: { limit: limitCount, lastMessageId }
      });
      if (response && response.data) {
        return response.data.messages;
      }
    } catch (error) {
      console.log('Falling back to Firebase for messages:', error);
    }

    // Fallback to Firebase
    let messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastMessageId) {
      const lastDoc = await getDoc(doc(db, 'chats', chatId, 'messages', lastMessageId));
      if (lastDoc.exists()) {
        messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(limitCount)
        );
      }
    }

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));

    // Return in chronological order
    return messages.reverse();
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
   * Listen to chat messages
   */
  listenToMessages(
    chatId: string,
    callback: (messages: Message[]) => void
  ): () => void {
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
        callback(messages);
      },
      (error) => {
        console.error('Error listening to messages:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Send a text message
   */
  async sendMessage(chatId: string, text: string, senderId: string): Promise<string> {
    try {
      const messageData = {
        chatId,
        senderId,
        text,
        type: 'TEXT' as const,
        status: 'sent' as const,
        readBy: [senderId],
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
          senderId,
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
   * Find existing direct chat
   */
  private async findExistingDirectChat(userId: string, recipientId: string): Promise<Chat | null> {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      where('jobId', '==', null)
    );

    const snapshot = await getDocs(chatsQuery);
    
    for (const doc of snapshot.docs) {
      const chat = doc.data() as Chat;
      if (
        chat.participants.length === 2 &&
        chat.participants.includes(recipientId)
      ) {
        return {
          id: doc.id,
          ...chat
        };
      }
    }

    return null;
  }

  /**
   * Edit a message
   */
  async editMessage(chatId: string, messageId: string, newText: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);
      
      if (!messageSnap.exists()) {
        throw new Error('Message not found');
      }

      const oldMessage = messageSnap.data();
      
      // Create edit history entry
      const editHistoryEntry = {
        text: oldMessage.text,
        editedAt: serverTimestamp(),
      };

      // Update message with new text and edit history
      await updateDoc(messageRef, {
        text: newText,
        editedAt: serverTimestamp(),
        editHistory: [...(oldMessage.editHistory || []), editHistoryEntry],
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Soft delete a message
   */
  async deleteMessage(chatId: string, messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      
      await updateDoc(messageRef, {
        deletedAt: serverTimestamp(),
        deletedBy: userId,
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        unsubscribe();
        resolve(user?.uid || null);
      });
    });
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.chatListeners.forEach(unsubscribe => unsubscribe());
    this.chatListeners.clear();
  }
}

// Export singleton instance
export const chatService = new ChatService();

