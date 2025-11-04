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
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BackendAPI } from '../config/backend';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import ChatStorageProvider from './ChatStorageProvider';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

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
  archivedUsers?: string[]; // Users who archived this chat
  pinnedUsers?: string[]; // Users who pinned this chat
  disappearingMessageDuration?: number; // Duration in seconds for disappearing messages (0 = off)
  theme?: {
    id: string;
    name: string;
    type: 'color' | 'gradient' | 'image';
    value: string | string[] | { uri: string };
    thumbnail?: string;
    isCustom?: boolean;
  }; // Chat theme/wallpaper
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
  isPinned?: boolean; // Pin message in chat
  pinnedBy?: string; // User who pinned the message
  pinnedAt?: Timestamp; // When message was pinned
  isStarred?: boolean; // Star message (per user)
  starredBy?: string[]; // Users who starred the message
  // Advanced features from reference system
  reactions?: Record<string, string[]>; // Reactions: { emoji: [userId1, userId2] }
  replyTo?: {
    id: string;
    text?: string;
    user?: { name?: string; _id?: string };
    image?: string;
    audio?: string;
    video?: string;
    type?: string;
  }; // Reply to message
  quote?: {
    id: string;
    text?: string;
    user?: { name?: string; _id?: string };
  }; // Quote message (different from reply)
  // Disappearing messages
  disappearingDuration?: number; // Duration in seconds (30, 60, 300, 3600, 86400, 604800)
  expiresAt?: Timestamp; // When message expires
  isDisappearing?: boolean; // Whether message should disappear
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
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('Falling back to Firebase for chats:', error);
    }

    // Fallback to Firebase
    const userId = await this.getCurrentUserId();
    if (!userId) {
      // COMMENT: PRIORITY 1 - Replace console.warn with logger
      logger.warn('User not authenticated for chat service - returning empty list');
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
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('Falling back to Firebase for direct chat creation:', error);
    }

    // Fallback to Firebase
    const userId = await this.getCurrentUserId();
    if (!userId) {
      // COMMENT: PRIORITY 1 - Replace console.warn with logger
      logger.warn('User not authenticated for chat service - throwing error');
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
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('Falling back to Firebase for job chat creation:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error getting chat messages:', error);
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
        // COMMENT: PRIORITY 1 - Replace console.error with logger
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
   * Listen to chat messages (never clears UI on error, maintains last good state)
   */
  listenToMessages(
    chatId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug(`📱 Storage → ${useFirestore ? 'Firestore' : 'Local'} (listenToMessages: ${chatId})`);
    
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
          // COMMENT: PRIORITY 1 - Replace console.error with logger
          logger.error('messages onSnapshot error', error.code, error.message);
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
          // COMMENT: PRIORITY 1 - Replace console.error with logger
          logger.error('Error polling local messages:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('✅ Chat marked as read:', chatId);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error marking chat as read:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error sending message:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error editing message:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error deleting message:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('📖 markAsRead: No message IDs or UID provided');
      return;
    }

    const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug(`📱 Storage → ${useFirestore ? 'Firestore' : 'Local'} (markAsRead: ${chatId})`);

    try {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug(`📖 markAsRead: Marking ${messageIds.length} messages as read for user ${uid}`);
      
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
              // COMMENT: PRIORITY 1 - Replace console.log with logger
              logger.debug(`📖 markAsRead: Message ${messageId} already read by ${uid}`);
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
          // COMMENT: PRIORITY 1 - Replace console.log with logger
          logger.debug(`📖 markAsRead: Successfully marked ${updatedCount} messages as read`);
        } else {
          // COMMENT: PRIORITY 1 - Replace console.log with logger
          logger.debug('📖 markAsRead: No messages needed updating');
        }
      } else {
        // LocalStorage update (simplified - just log for now)
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug(`📖 markAsRead: LocalStorage read receipts not implemented yet`);
        logger.debug(`📖 markAsRead: Would mark ${messageIds.length} messages as read for user ${uid}`);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('📖 markAsRead: Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Pin or unpin a message
   */
  async pinMessage(chatId: string, messageId: string, userId: string, pin: boolean = true): Promise<void> {
    try {
      const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
      logger.debug(`📌 ${pin ? 'Pin' : 'Unpin'} message ${messageId} in chat ${chatId}`);

      if (useFirestore) {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        
        if (pin) {
          await updateDoc(messageRef, {
            isPinned: true,
            pinnedBy: userId,
            pinnedAt: serverTimestamp()
          });
          logger.debug(`📌 Message ${messageId} pinned successfully`);
        } else {
          await updateDoc(messageRef, {
            isPinned: false,
            pinnedBy: null,
            pinnedAt: null
          });
          logger.debug(`📌 Message ${messageId} unpinned successfully`);
        }
      } else {
        logger.debug(`📌 Pin/unpin: LocalStorage not supported, use Firestore`);
      }
    } catch (error) {
      logger.error('📌 Error pinning/unpinning message:', error);
      throw error;
    }
  }

  /**
   * Star or unstar a message
   */
  async starMessage(chatId: string, messageId: string, userId: string, star: boolean = true): Promise<void> {
    try {
      const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
      logger.debug(`⭐ ${star ? 'Star' : 'Unstar'} message ${messageId} by user ${userId}`);

      if (useFirestore) {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        const messageDoc = await getDoc(messageRef);
        
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          const starredBy = Array.isArray(messageData.starredBy) ? [...messageData.starredBy] : [];
          
          if (star) {
            // Add user to starredBy array if not already present
            if (!starredBy.includes(userId)) {
              starredBy.push(userId);
              await updateDoc(messageRef, {
                starredBy,
                isStarred: starredBy.length > 0
              });
              logger.debug(`⭐ Message ${messageId} starred by user ${userId}`);
            }
          } else {
            // Remove user from starredBy array
            const filteredStarredBy = starredBy.filter((id: string) => id !== userId);
            await updateDoc(messageRef, {
              starredBy: filteredStarredBy,
              isStarred: filteredStarredBy.length > 0
            });
            logger.debug(`⭐ Message ${messageId} unstarred by user ${userId}`);
          }
        }
      } else {
        logger.debug(`⭐ Star/unstar: LocalStorage not supported, use Firestore`);
      }
    } catch (error) {
      logger.error('⭐ Error starring/unstarring message:', error);
      throw error;
    }
  }

  /**
   * Get pinned messages for a chat
   */
  async getPinnedMessages(chatId: string): Promise<Message[]> {
    try {
      const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
      logger.debug(`📌 Getting pinned messages for chat ${chatId}`);

      if (useFirestore) {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(
          messagesRef,
          where('isPinned', '==', true),
          orderBy('pinnedAt', 'desc'),
          limit(50)
        );
        
        try {
          const snapshot = await getDocs(q);
          const pinnedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Message));
          
          logger.debug(`📌 Found ${pinnedMessages.length} pinned messages`);
          return pinnedMessages;
        } catch (error: any) {
          // If orderBy fails (no index), try without it
          if (error.code === 'failed-precondition') {
            const q2 = query(
              messagesRef,
              where('isPinned', '==', true),
              limit(50)
            );
            const snapshot2 = await getDocs(q2);
            const pinnedMessages = snapshot2.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Message));
            
            // Sort manually by pinnedAt
            pinnedMessages.sort((a, b) => {
              const aTime = a.pinnedAt?.toMillis?.() || 0;
              const bTime = b.pinnedAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
            
            logger.debug(`📌 Found ${pinnedMessages.length} pinned messages (sorted manually)`);
            return pinnedMessages;
          }
          throw error;
        }
      } else {
        logger.debug(`📌 Get pinned messages: LocalStorage not supported, use Firestore`);
        return [];
      }
    } catch (error) {
      logger.error('📌 Error getting pinned messages:', error);
      throw error;
    }
  }

  /**
   * Get starred messages for a user
   */
  async getStarredMessages(userId: string): Promise<Message[]> {
    try {
      logger.debug(`⭐ Getting starred messages for user ${userId}`);

      // Query all chats the user is part of
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        limit(100)
      );
      
      const chatsSnapshot = await getDocs(chatsQuery);
      const starredMessages: Message[] = [];

      // For each chat, get messages starred by the user
      for (const chatDoc of chatsSnapshot.docs) {
        const chatId = chatDoc.id;
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('starredBy', 'array-contains', userId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        try {
          const messagesSnapshot = await getDocs(messagesQuery);
          messagesSnapshot.docs.forEach(msgDoc => {
            starredMessages.push({
              id: msgDoc.id,
              chatId,
              ...msgDoc.data()
            } as Message);
          });
        } catch (error: any) {
          // If orderBy fails (no index), try without it
          if (error.code === 'failed-precondition') {
            const messagesRef2 = collection(db, 'chats', chatId, 'messages');
            const messagesQuery2 = query(
              messagesRef2,
              where('starredBy', 'array-contains', userId),
              limit(50)
            );
            
            const messagesSnapshot2 = await getDocs(messagesQuery2);
            messagesSnapshot2.docs.forEach(msgDoc => {
              starredMessages.push({
                id: msgDoc.id,
                chatId,
                ...msgDoc.data()
              } as Message);
            });
          } else {
            logger.error(`⭐ Error getting starred messages for chat ${chatId}:`, error);
          }
        }
      }

      // Sort by creation date (most recent first)
      starredMessages.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      logger.debug(`⭐ Found ${starredMessages.length} starred messages`);
      return starredMessages;
    } catch (error) {
      logger.error('⭐ Error getting starred messages:', error);
      throw error;
    }
  }

  /**
   * Add or toggle reaction on a message
   * COMMENT: ADVANCED FEATURE - Copied from reference system
   */
  async addReaction(chatId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
    logger.debug(`🔥 Storage → ${useFirestore ? 'Firestore' : 'Local'} (addReaction: ${chatId})`);

    try {
      if (useFirestore) {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        const messageDoc = await getDoc(messageRef);
        
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          const reactions = messageData.reactions || {};
          const currentUserReactions = reactions[userId] || [];
          
          // Toggle: if user already reacted with this emoji, remove it; otherwise add it
          const newUserReactions = currentUserReactions.includes(emoji)
            ? currentUserReactions.filter((e: string) => e !== emoji)
            : [...currentUserReactions, emoji];
          
          await updateDoc(messageRef, {
            [`reactions.${userId}`]: newUserReactions.length > 0 ? newUserReactions : deleteField(),
          });
          
          logger.debug(`🔥 Reaction ${currentUserReactions.includes(emoji) ? 'removed' : 'added'}: ${emoji} by ${userId}`);
        }
      } else {
        logger.debug(`🔥 LocalStorage reactions not implemented yet`);
      }
    } catch (error) {
      logger.error('🔥 Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(chatId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
    logger.debug(`🔥 Storage → ${useFirestore ? 'Firestore' : 'Local'} (removeReaction: ${chatId})`);

    try {
      if (useFirestore) {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        const messageDoc = await getDoc(messageRef);
        
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          const reactions = messageData.reactions || {};
          const currentUserReactions = reactions[userId] || [];
          
          const newUserReactions = currentUserReactions.filter((e: string) => e !== emoji);
          
          await updateDoc(messageRef, {
            [`reactions.${userId}`]: newUserReactions.length > 0 ? newUserReactions : deleteField(),
          });
          
          logger.debug(`🔥 Reaction removed: ${emoji} by ${userId}`);
        }
      }
    } catch (error) {
      logger.error('🔥 Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Archive a chat for a user
   */
  async archiveChat(chatId: string, userId: string): Promise<void> {
    try {
      logger.debug(`📦 Archiving chat ${chatId} for user ${userId}`);
      
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }
      
      const chatData = chatDoc.data();
      const archivedUsers = chatData.archivedUsers || [];
      
      if (!archivedUsers.includes(userId)) {
        await updateDoc(chatRef, {
          archivedUsers: [...archivedUsers, userId],
          updatedAt: serverTimestamp(),
        });
        logger.debug(`✅ Chat ${chatId} archived for user ${userId}`);
      } else {
        logger.debug(`ℹ️ Chat ${chatId} already archived for user ${userId}`);
      }
    } catch (error) {
      logger.error('📦 Error archiving chat:', error);
      throw error;
    }
  }

  /**
   * Unarchive a chat for a user
   */
  async unarchiveChat(chatId: string, userId: string): Promise<void> {
    try {
      logger.debug(`📦 Unarchiving chat ${chatId} for user ${userId}`);
      
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }
      
      const chatData = chatDoc.data();
      const archivedUsers = chatData.archivedUsers || [];
      
      if (archivedUsers.includes(userId)) {
        await updateDoc(chatRef, {
          archivedUsers: archivedUsers.filter((uid: string) => uid !== userId),
          updatedAt: serverTimestamp(),
        });
        logger.debug(`✅ Chat ${chatId} unarchived for user ${userId}`);
      } else {
        logger.debug(`ℹ️ Chat ${chatId} not archived for user ${userId}`);
      }
    } catch (error) {
      logger.error('📦 Error unarchiving chat:', error);
      throw error;
    }
  }

  /**
   * Pin a chat for a user
   */
  async pinChat(chatId: string, userId: string): Promise<void> {
    try {
      logger.debug(`📌 Pinning chat ${chatId} for user ${userId}`);
      
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }
      
      const chatData = chatDoc.data();
      const pinnedUsers = chatData.pinnedUsers || [];
      
      if (!pinnedUsers.includes(userId)) {
        await updateDoc(chatRef, {
          pinnedUsers: [...pinnedUsers, userId],
          updatedAt: serverTimestamp(),
        });
        logger.debug(`✅ Chat ${chatId} pinned for user ${userId}`);
      } else {
        logger.debug(`ℹ️ Chat ${chatId} already pinned for user ${userId}`);
      }
    } catch (error) {
      logger.error('📌 Error pinning chat:', error);
      throw error;
    }
  }

  /**
   * Unpin a chat for a user
   */
  async unpinChat(chatId: string, userId: string): Promise<void> {
    try {
      logger.debug(`📌 Unpinning chat ${chatId} for user ${userId}`);
      
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }
      
      const chatData = chatDoc.data();
      const pinnedUsers = chatData.pinnedUsers || [];
      
      if (pinnedUsers.includes(userId)) {
        await updateDoc(chatRef, {
          pinnedUsers: pinnedUsers.filter((uid: string) => uid !== userId),
          updatedAt: serverTimestamp(),
        });
        logger.debug(`✅ Chat ${chatId} unpinned for user ${userId}`);
      } else {
        logger.debug(`ℹ️ Chat ${chatId} not pinned for user ${userId}`);
      }
    } catch (error) {
      logger.error('📌 Error unpinning chat:', error);
      throw error;
    }
  }

  /**
   * Load more messages (pagination) - loads older messages before a given timestamp
   */
  async loadMoreMessages(
    chatId: string,
    beforeTimestamp: any,
    limitCount: number = 50
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const useFirestore = ChatStorageProvider.shouldUseFirestore(chatId);
      logger.debug(`📱 Storage → ${useFirestore ? 'Firestore' : 'Local'} (loadMoreMessages: ${chatId})`);

      if (useFirestore) {
        // Convert timestamp if needed
        let timestamp: any = beforeTimestamp;
        if (timestamp?.toMillis) {
          // Already a Firestore Timestamp
          timestamp = timestamp;
        } else if (typeof timestamp === 'number') {
          const { Timestamp } = await import('firebase/firestore');
          timestamp = Timestamp.fromMillis(timestamp);
        } else if (timestamp instanceof Date) {
          const { Timestamp } = await import('firebase/firestore');
          timestamp = Timestamp.fromDate(timestamp);
        }

        // Query messages before the given timestamp
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(
          messagesRef,
          orderBy('createdAt', 'desc'),
          where('createdAt', '<', timestamp),
          limit(limitCount + 1) // Get one extra to check if there are more
        );

        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        // Check if there are more messages
        const hasMore = docs.length > limitCount;

        // Get the requested number of messages and reverse to oldest first
        const messages = docs
          .slice(0, limitCount)
          .reverse()
          .map(doc => ({
            id: doc.id,
            chatId,
            ...doc.data()
          } as Message));

        logger.debug(`📥 Loaded ${messages.length} older messages, hasMore: ${hasMore}`);
        return { messages, hasMore };
      } else {
        // LocalStorage pagination (simplified for now)
        logger.debug(`📥 LoadMoreMessages: LocalStorage pagination not fully implemented`);
        return { messages: [], hasMore: false };
      }
    } catch (error) {
      logger.error('Error loading more messages:', error);
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
    // COMMENT: PRIORITY 1 - Replace console.error with logger
    logger.error("listenMessages error", err.code, err.message);
    onNext(lastGood); // keep UI
  });
}

export const chatService = new ChatService();

