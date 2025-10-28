/**
 * Chat Service - Firebase integration for chat functionality
 * Handles chat operations and persistence
 * 
 * SCHEMA:
 * chats/{chatId}/messages/{messageId} has map: readBy: { [uid]: Timestamp }
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
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BackendAPI } from '../config/backend';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import ChatStorageProvider from './ChatStorageProvider';

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
  unreadCount: Record<string, number> | number; // Support both old (number) and new (map) formats
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'voice' | 'video';
  attachments?: string[];
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  deletedBy?: string;
  duration?: number; // For voice/video messages
  thumbnailUrl?: string; // For video messages
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
      where('participants', 'array-contains', userId)
    );

    const snapshot = await getDocs(chatsQuery);
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Chat));
    
    // Filter active chats and sort by updatedAt
    return chats
      .filter(chat => chat.isActive !== false)
      .sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
  }

  /**
   * Listen to user's chats in real-time
   */
  listenToUserChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
      
      // Filter active chats and sort by updatedAt
      const activeChats = chats
        .filter(chat => chat.isActive !== false)
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() || 0;
          const bTime = b.updatedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      
      callback(activeChats);
    });

    return unsubscribe;
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
      console.warn('User not authenticated for chat service - throwing error');
      throw new Error('User not authenticated');
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
      // Use ChatStorageProvider to get messages
      const messages = await ChatStorageProvider.getMessages(chatId, {
        limit: limitCount,
        startAfterId: lastMessageId
      });

      // Convert to Message format expected by the rest of the app
      return messages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        text: msg.text,
        type: msg.type,
        status: 'sent' as const,
        createdAt: msg.createdAt instanceof Date ? Timestamp.fromDate(msg.createdAt) : msg.createdAt,
        updatedAt: msg.updatedAt instanceof Date ? Timestamp.fromDate(msg.updatedAt) : msg.updatedAt,
        readBy: Array.isArray(msg.readBy) ? msg.readBy : Object.keys(msg.readBy || {})
      } as Message));
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
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
   * Listen to chat messages (never clears UI on error, maintains last good state)
   */
  listenToMessages(
    chatId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
    console.log(`📱 Storage → ${useFirestore ? 'Firestore' : 'Local'} (listenToMessages: ${chatId})`);
    
    if (useFirestore) {
      // Firestore real-time listener with error resilience
      let lastGood: Message[] = [];
      
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('createdAt', 'asc'),
          limit(200)
        ),
        (snapshot) => {
          lastGood = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Message));
          callback(lastGood);
        },
        (error) => {
          console.error('messages onSnapshot error', error.code, error.message);
          // Don't nuke UI - keep showing last good state
          callback(lastGood);
        }
      );
      return unsubscribe;
    } else {
      // LocalStorage polling (simplified for now)
      let lastGood: Message[] = [];
      
      const pollInterval = setInterval(async () => {
        try {
          const messages = await ChatStorageProvider.getMessages(chatId);
          lastGood = messages.map(msg => ({
            id: msg.id,
            chatId: msg.chatId,
            senderId: msg.senderId,
            text: msg.text,
            type: msg.type,
            createdAt: msg.createdAt instanceof Date ? Timestamp.fromDate(msg.createdAt) : msg.createdAt,
            updatedAt: msg.updatedAt instanceof Date ? Timestamp.fromDate(msg.updatedAt) : msg.updatedAt,
            readBy: Array.isArray(msg.readBy) ? msg.readBy : Object.keys(msg.readBy || {}),
            status: 'sent' as const
          }));
          callback(lastGood);
        } catch (error) {
          console.error('Error polling local messages:', error);
          // Don't nuke UI - keep showing last good state
          callback(lastGood);
        }
      }, 1000);
      
      return () => clearInterval(pollInterval);
    }
  }

  /**
   * Mark chat as read for current user
   */
  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`unreadCount.${userId}`]: 0,
      });
      console.log('✅ Chat marked as read:', chatId);
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
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
      };

      // Use ChatStorageProvider to send message
      const messageId = await ChatStorageProvider.sendMessage(chatId, messageData);

      // Update chat metadata (this stays in Firestore for all chats)
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      const chatData = chatDoc.data();
      
      // Update unread count for other participants
      const unreadUpdate: any = {};
      if (chatData?.participants) {
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== senderId) {
            const currentUnread = chatData.unreadCount?.[participantId] || 0;
            unreadUpdate[`unreadCount.${participantId}`] = currentUnread + 1;
          }
        });
      }

      // Update chat's last message and unread counts
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text,
          senderId,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
        ...unreadUpdate,
      });

      return messageId;
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
      // Use ChatStorageProvider to update message
      await ChatStorageProvider.updateMessage(chatId, messageId, {
        text: newText,
        updatedAt: new Date()
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
      // Use ChatStorageProvider to delete message
      await ChatStorageProvider.deleteMessage(chatId, messageId);
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
   * Get current user ID
   */
  getMyUid(): string | null {
    return auth.currentUser?.uid || null;
  }

  /**
   * Mark messages as read by user
   */
  async markAsRead(chatId: string, messageIds: string[], uid: string): Promise<void> {
    if (!messageIds.length || !uid) {
      console.log('📖 markAsRead: No message IDs or UID provided');
      return;
    }

    const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
    console.log(`📱 Storage → ${useFirestore ? 'Firestore' : 'Local'} (markAsRead: ${chatId})`);

    try {
      console.log(`📖 markAsRead: Marking ${messageIds.length} messages as read for user ${uid}`);
      
      if (useFirestore) {
        // Firestore batch update
        const batch = writeBatch(db);
        let updatedCount = 0;

        for (const messageId of messageIds) {
          const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
          
          // Get current message data to check if already read
          const messageDoc = await getDoc(messageRef);
          if (messageDoc.exists()) {
            const messageData = messageDoc.data();
            const readBy = messageData.readBy || {};
            
            // Skip if already read by this user
            if (readBy[uid]) {
              console.log(`📖 markAsRead: Message ${messageId} already read by ${uid}`);
              continue;
            }
            
            // Add read receipt
            batch.update(messageRef, {
              [`readBy.${uid}`]: serverTimestamp()
            });
            updatedCount++;
          }
        }

        if (updatedCount > 0) {
          await batch.commit();
          console.log(`📖 markAsRead: Successfully marked ${updatedCount} messages as read`);
        } else {
          console.log('📖 markAsRead: No messages needed updating');
        }
      } else {
        // LocalStorage update (simplified - just log for now)
        console.log(`📖 markAsRead: LocalStorage read receipts not implemented yet`);
        console.log(`📖 markAsRead: Would mark ${messageIds.length} messages as read for user ${uid}`);
      }
    } catch (error) {
      console.error('📖 markAsRead: Error marking messages as read:', error);
      throw error;
    }
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
// Standalone defensive listener function
export function listenMessages(chatId: string, onNext: (msgs: any[]) => void) {
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(200));
  let lastGood: any[] = [];
  return onSnapshot(q, (snap) => {
    lastGood = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onNext(lastGood);
  }, (err) => {
    console.error("listenMessages error", err.code, err.message);
    onNext(lastGood); // keep UI
  });
}

export const chatService = new ChatService();

