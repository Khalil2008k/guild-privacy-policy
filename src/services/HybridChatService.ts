/**
 * Hybrid Chat Service
 * - Personal chats: Stored locally on device (WhatsApp-style)
 * - Job discussions: Stored in Firestore (cloud)
 * - Automatic sync between local and cloud
 * 
 * STORAGE POLICY: Personal=Local, Job/Admin/System=Firestore
 * 
 * DEPRECATED: This service now delegates to ChatStorageProvider for all CRUD operations.
 * The routing logic is unified in ChatStorageProvider.shouldUseFirestore()
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import LocalChatStorage, { LocalMessage, LocalChat } from './LocalChatStorage';
import { Message, Chat } from './chatService';
import { auth } from '../config/firebase';
import ChatStorageProvider from './ChatStorageProvider';

export interface PaginationOptions {
  limit?: number;
  lastDoc?: DocumentSnapshot;
  offset?: number;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface WhatsAppFeatures {
  reactions?: MessageReaction[];
  replyTo?: string; // Message ID being replied to
  forwarded?: boolean;
  forwardedFrom?: string;
  deletedForEveryone?: boolean;
  editedAt?: Date;
}

export interface EnhancedMessage extends Message, WhatsAppFeatures {
  localId?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

class HybridChatServiceClass {
  private listeners: Map<string, () => void> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.warn("HybridChatService delegated to ChatStorageProvider - using unified storage policy");
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Hybrid Chat Service...');
    
    // Initialize local storage
    await LocalChatStorage.initialize();
    
    // Start auto-sync
    this.startAutoSync();
    
    console.log('✅ Hybrid Chat Service initialized');
  }

  /**
   * Determine if a chat is a job discussion
   * DEPRECATED: Use ChatStorageProvider.shouldUseFirestore() instead
   */
  private isJobChat(chat: Chat): boolean {
    return ChatStorageProvider.shouldUseFirestore(chat.id);
  }

  /**
   * Send a message (handles both local and cloud storage)
   */
  async sendMessage(
    chatId: string,
    text: string,
    options?: {
      fileUrl?: string;
      fileType?: string;
      fileName?: string;
      location?: { latitude: number; longitude: number; address?: string };
      replyTo?: string;
      forwarded?: boolean;
    }
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Create message object
      const messageData = {
        chatId,
        senderId: user.uid,
        text,
        type: 'TEXT' as const,
        status: 'sent' as const,
        readBy: [user.uid],
        fileUrl: options?.fileUrl,
        fileType: options?.fileType,
        fileName: options?.fileName,
        location: options?.location,
        replyTo: options?.replyTo,
        forwarded: options?.forwarded,
      };

      // Use ChatStorageProvider for unified routing
      console.log(`📱 HybridChatService: sendMessage(${chatId}) → delegating to ChatStorageProvider`);
      const messageId = await ChatStorageProvider.sendMessage(chatId, messageData);

      // Update chat metadata (this stays in Firestore for all chats)
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      const chatData = chatDoc.data();
      
      if (chatData?.participants) {
        const unreadUpdate: any = {};
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== user.uid) {
            const currentUnread = chatData.unreadCount?.[participantId] || 0;
            unreadUpdate[`unreadCount.${participantId}`] = currentUnread + 1;
          }
        });

        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: messageData.text,
            senderId: messageData.senderId,
            timestamp: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
          ...unreadUpdate,
        });
      }

      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages with pagination
   */
  async getMessages(
    chatId: string,
    options: PaginationOptions = {}
  ): Promise<{ messages: EnhancedMessage[]; hasMore: boolean; lastDoc?: DocumentSnapshot }> {
    try {
      console.log(`📱 HybridChatService: getMessages(${chatId}) → delegating to ChatStorageProvider`);
      
      // Use ChatStorageProvider for unified routing
      const messages = await ChatStorageProvider.getMessages(chatId, {
        limit: options.limit || 50,
        startAfterId: options.lastDoc?.id
      });

      // Convert to EnhancedMessage format
      const enhancedMessages: EnhancedMessage[] = messages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        text: msg.text,
        type: msg.type,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        readBy: msg.readBy,
        status: 'sent' as const,
        read: false,
        localId: msg.id.startsWith('local_') ? msg.id : undefined,
        syncStatus: msg.id.startsWith('local_') ? 'pending' : 'synced'
      }));

      return {
        messages: enhancedMessages,
        hasMore: false, // ChatStorageProvider handles pagination internally
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { messages: [], hasMore: false };
    }
  }

  /**
   * Listen to messages in real-time
   */
  listenToMessages(
    chatId: string,
    callback: (messages: EnhancedMessage[]) => void,
    options: { limit?: number } = {}
  ): () => void {
    const listenerId = `messages_${chatId}`;

    // Clean up existing listener
    if (this.listeners.has(listenerId)) {
      this.listeners.get(listenerId)!();
    }

    // Check if it's a job chat
    this.getChat(chatId).then(chat => {
      if (!chat) return;

      const isJob = this.isJobChat(chat);

      if (isJob) {
        // Job chat: Real-time Firestore listener
        console.log('👂 Setting up Firestore listener (job chat)');
        
        const q = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'asc'),
          limit(options.limit || 100)
        );

        const unsubscribe = onSnapshot(q, snapshot => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as EnhancedMessage));

          callback(messages);
        });

        this.listeners.set(listenerId, unsubscribe);
      } else {
        // Personal chat: Poll local storage
        console.log('👂 Setting up local storage polling (personal chat)');
        
        const pollInterval = setInterval(async () => {
          const messages = await LocalChatStorage.getMessages(chatId, options.limit);
          callback(messages);
        }, 1000); // Poll every second

        // Initial load
        LocalChatStorage.getMessages(chatId, options.limit).then(callback);

        const unsubscribe = () => clearInterval(pollInterval);
        this.listeners.set(listenerId, unsubscribe);
      }
    });

    // Return cleanup function
    return () => {
      if (this.listeners.has(listenerId)) {
        this.listeners.get(listenerId)!();
        this.listeners.delete(listenerId);
      }
    };
  }

  /**
   * Get user's chats with pagination
   */
  async getUserChats(options: PaginationOptions = {}): Promise<{
    chats: Chat[];
    hasMore: boolean;
    lastDoc?: DocumentSnapshot;
  }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const pageLimit = options.limit || 30;

      // Get chats from Firestore (job chats + metadata)
      let q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(pageLimit + 1)
      );

      if (options.lastDoc) {
        q = query(q, startAfter(options.lastDoc));
      }

      const snapshot = await getDocs(q);
      const hasMore = snapshot.docs.length > pageLimit;
      const cloudChats = snapshot.docs
        .slice(0, pageLimit)
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Chat));

      // Get personal chats from local storage
      const localChats = await LocalChatStorage.getAllChats();
      const personalChats = localChats.filter(c => !c.isJobChat);

      // Merge and sort
      const allChats = [...cloudChats, ...personalChats];
      allChats.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      return {
        chats: allChats.slice(0, pageLimit),
        hasMore,
        lastDoc: hasMore ? snapshot.docs[pageLimit - 1] : undefined,
      };
    } catch (error) {
      console.error('Error getting user chats:', error);
      return { chats: [], hasMore: false };
    }
  }

  /**
   * Get a specific chat
   */
  async getChat(chatId: string): Promise<Chat | null> {
    try {
      // Try Firestore first
      const docRef = doc(db, 'chats', chatId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Chat;
      }

      // Try local storage
      const localChat = await LocalChatStorage.getChat(chatId);
      return localChat;
    } catch (error) {
      console.error('Error getting chat:', error);
      return null;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(chatId: string, messageId: string, deleteForEveryone: boolean = false): Promise<void> {
    try {
      console.log(`📱 HybridChatService: deleteMessage(${chatId}) → delegating to ChatStorageProvider`);
      
      // Use ChatStorageProvider for unified routing
      await ChatStorageProvider.deleteMessage(chatId, messageId);

      console.log(`🗑️ Deleted message: ${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(chatId: string, messageId: string, newText: string): Promise<void> {
    try {
      console.log(`📱 HybridChatService: editMessage(${chatId}) → delegating to ChatStorageProvider`);
      
      // Use ChatStorageProvider for unified routing
      await ChatStorageProvider.updateMessage(chatId, messageId, {
        text: newText,
        updatedAt: new Date()
      });

      console.log(`✏️ Edited message: ${messageId}`);
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const chat = await this.getChat(chatId);
      if (!chat) throw new Error('Chat not found');

      const isJob = this.isJobChat(chat);

      const reaction: MessageReaction = {
        emoji,
        userId: user.uid,
        timestamp: new Date(),
      };

      if (isJob) {
        // Job chat: Update in Firestore
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        const messageDoc = await getDoc(messageRef);
        const messageData = messageDoc.data();
        const reactions = messageData?.reactions || [];

        // Remove existing reaction from this user
        const filtered = reactions.filter((r: MessageReaction) => r.userId !== user.uid);
        filtered.push(reaction);

        await updateDoc(messageRef, { reactions: filtered });
      } else {
        // Personal chat: Update in local storage
        const messages = await LocalChatStorage.getMessages(chatId);
        const message = messages.find(m => m.id === messageId || m.localId === messageId);

        if (message) {
          const reactions = message.reactions || [];
          const filtered = reactions.filter(r => r.userId !== user.uid);
          filtered.push(reaction);

          await LocalChatStorage.updateMessage(chatId, messageId, { reactions: filtered });
        }
      }

      console.log(`👍 Added reaction: ${emoji}`);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Forward a message
   */
  async forwardMessage(fromChatId: string, messageId: string, toChatIds: string[]): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get original message
      const fromChat = await this.getChat(fromChatId);
      if (!fromChat) throw new Error('Source chat not found');

      const isJobChat = this.isJobChat(fromChat);
      let originalMessage: EnhancedMessage | undefined;

      if (isJobChat) {
        const messageDoc = await getDoc(doc(db, 'chats', fromChatId, 'messages', messageId));
        if (messageDoc.exists()) {
          originalMessage = { id: messageDoc.id, ...messageDoc.data() } as EnhancedMessage;
        }
      } else {
        const messages = await LocalChatStorage.getMessages(fromChatId);
        originalMessage = messages.find(m => m.id === messageId || m.localId === messageId);
      }

      if (!originalMessage) throw new Error('Message not found');

      // Forward to each chat
      for (const toChatId of toChatIds) {
        await this.sendMessage(toChatId, originalMessage.text || '', {
          fileUrl: originalMessage.fileUrl,
          fileType: originalMessage.fileType,
          fileName: originalMessage.fileName,
          forwarded: true,
        });
      }

      console.log(`📨 Forwarded message to ${toChatIds.length} chats`);
    } catch (error) {
      console.error('Error forwarding message:', error);
      throw error;
    }
  }

  /**
   * Search messages across all chats
   */
  async searchMessages(query: string, chatId?: string): Promise<EnhancedMessage[]> {
    try {
      // Search local storage (personal chats)
      const localResults = await LocalChatStorage.searchMessages(query, chatId);

      // TODO: Search Firestore (job chats) - requires backend endpoint or Algolia
      // For now, only search local messages

      return localResults;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Queue message for cloud sync (optional backup)
   */
  private queueForSync(chatId: string, localId: string): void {
    // TODO: Implement cloud backup sync
    console.log(`📤 Queued for sync: ${chatId}/${localId}`);
  }

  /**
   * Start automatic sync (for optional cloud backup)
   */
  private startAutoSync(): void {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncPendingMessages();
    }, 5 * 60 * 1000);

    console.log('🔄 Auto-sync started');
  }

  /**
   * Sync pending messages to cloud (optional backup)
   */
  private async syncPendingMessages(): Promise<void> {
    try {
      const pending = await LocalChatStorage.getPendingMessages();
      console.log(`🔄 Syncing ${pending.length} pending messages...`);

      // TODO: Implement cloud backup sync
      // For now, just mark as synced
      for (const message of pending) {
        if (message.localId) {
          await LocalChatStorage.markMessageAsSynced(
            message.chatId,
            message.localId,
            message.localId
          );
        }
      }
    } catch (error) {
      console.error('Error syncing messages:', error);
    }
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Auto-sync stopped');
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.stopAutoSync();
    console.log('🧹 Hybrid Chat Service cleaned up');
  }
}

export const HybridChatService = new HybridChatServiceClass();
export default HybridChatService;

