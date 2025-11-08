/**
 * Local Chat Storage Service
 * Stores personal chat messages locally on device (WhatsApp-style)
 * Job discussions are stored in Firestore only
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, Chat } from './chatService';

const STORAGE_KEYS = {
  CHATS: '@guild_local_chats',
  MESSAGES: '@guild_local_messages_',
  CHAT_METADATA: '@guild_chat_metadata_',
  SYNC_STATUS: '@guild_sync_status',
};

export interface LocalMessage extends Message {
  localId: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  localTimestamp: number;
}

export interface LocalChat extends Chat {
  localId: string;
  isJobChat: boolean;
  messageCount: number;
  lastSyncedAt?: number;
}

export interface SyncStatus {
  lastSyncTimestamp: number;
  pendingMessages: number;
  failedMessages: number;
}

class LocalChatStorageService {
  private messageCache: Map<string, LocalMessage[]> = new Map();
  private chatCache: Map<string, LocalChat> = new Map();

  /**
   * Initialize storage (call on app start)
   */
  async initialize(): Promise<void> {
    try {
      console.log('💾 Initializing local chat storage...');
      
      // Load chats into cache
      const chats = await this.getAllChats();
      chats.forEach(chat => this.chatCache.set(chat.id, chat));
      
      console.log(`✅ Loaded ${chats.length} chats into cache`);
    } catch (error) {
      console.error('Error initializing local storage:', error);
    }
  }

  /**
   * Check if a chat is a job discussion (should be stored in Firestore only)
   */
  isJobChat(chat: Chat): boolean {
    return !!(chat.jobId || chat.type === 'job');
  }

  /**
   * Save a message locally (for personal chats only)
   */
  async saveMessage(chatId: string, message: Message, isJobChat: boolean = false): Promise<void> {
    // Job chats are stored in Firestore only
    if (isJobChat) {
      console.log('📤 Job chat message - storing in Firestore only');
      return;
    }

    try {
      const localMessage: LocalMessage = {
        ...message,
        localId: message.id || `local_${Date.now()}_${Math.random()}`,
        syncStatus: message.id ? 'synced' : 'pending',
        localTimestamp: Date.now(),
      };

      // Get existing messages
      const messages = await this.getMessages(chatId);
      
      // Check if message already exists
      const existingIndex = messages.findIndex(m => 
        m.id === localMessage.id || m.localId === localMessage.localId
      );

      if (existingIndex >= 0) {
        // Update existing message
        messages[existingIndex] = localMessage;
      } else {
        // Add new message
        messages.push(localMessage);
      }

      // Sort by timestamp
      messages.sort((a, b) => {
        const aTime = a.timestamp?.toMillis?.() || a.localTimestamp || 0;
        const bTime = b.timestamp?.toMillis?.() || b.localTimestamp || 0;
        return aTime - bTime;
      });

      // Save to storage
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.MESSAGES}${chatId}`,
        JSON.stringify(messages)
      );

      // Update cache
      this.messageCache.set(chatId, messages);

      // Update chat metadata
      await this.updateChatMetadata(chatId, {
        lastMessage: message,
        updatedAt: new Date(),
        messageCount: messages.length,
      });

      console.log(`💾 Saved message locally: ${chatId}`);
    } catch (error) {
      console.error('Error saving message locally:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat (from local storage)
   */
  async getMessages(chatId: string, limit?: number, offset: number = 0): Promise<LocalMessage[]> {
    try {
      // Check cache first
      if (this.messageCache.has(chatId)) {
        const cached = this.messageCache.get(chatId)!;
        if (limit) {
          return cached.slice(offset, offset + limit);
        }
        return cached;
      }

      // Load from storage
      const stored = await AsyncStorage.getItem(`${STORAGE_KEYS.MESSAGES}${chatId}`);
      if (!stored) {
        return [];
      }

      const messages: LocalMessage[] = JSON.parse(stored);
      
      // Update cache
      this.messageCache.set(chatId, messages);

      // Apply pagination
      if (limit) {
        return messages.slice(offset, offset + limit);
      }

      return messages;
    } catch (error) {
      console.error('Error getting messages from local storage:', error);
      return [];
    }
  }

  /**
   * Get message count for a chat
   */
  async getMessageCount(chatId: string): Promise<number> {
    const messages = await this.getMessages(chatId);
    return messages.length;
  }

  /**
   * Delete a message locally
   */
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    try {
      const messages = await this.getMessages(chatId);
      const filtered = messages.filter(m => m.id !== messageId && m.localId !== messageId);

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.MESSAGES}${chatId}`,
        JSON.stringify(filtered)
      );

      this.messageCache.set(chatId, filtered);

      console.log(`🗑️ Deleted message locally: ${messageId}`);
    } catch (error) {
      console.error('Error deleting message locally:', error);
      throw error;
    }
  }

  /**
   * Update a message locally (for editing)
   */
  async updateMessage(chatId: string, messageId: string, updates: Partial<Message>): Promise<void> {
    try {
      const messages = await this.getMessages(chatId);
      const index = messages.findIndex(m => m.id === messageId || m.localId === messageId);

      if (index >= 0) {
        messages[index] = {
          ...messages[index],
          ...updates,
          editedAt: new Date(),
        };

        await AsyncStorage.setItem(
          `${STORAGE_KEYS.MESSAGES}${chatId}`,
          JSON.stringify(messages)
        );

        this.messageCache.set(chatId, messages);

        console.log(`✏️ Updated message locally: ${messageId}`);
      }
    } catch (error) {
      console.error('Error updating message locally:', error);
      throw error;
    }
  }

  /**
   * Save a chat locally
   */
  async saveChat(chat: Chat): Promise<void> {
    try {
      const localChat: LocalChat = {
        ...chat,
        localId: chat.id || `local_chat_${Date.now()}`,
        isJobChat: this.isJobChat(chat),
        messageCount: await this.getMessageCount(chat.id),
        lastSyncedAt: Date.now(),
      };

      const chats = await this.getAllChats();
      const existingIndex = chats.findIndex(c => c.id === localChat.id);

      if (existingIndex >= 0) {
        chats[existingIndex] = localChat;
      } else {
        chats.unshift(localChat);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
      this.chatCache.set(localChat.id, localChat);

      console.log(`💾 Saved chat locally: ${chat.id}`);
    } catch (error) {
      console.error('Error saving chat locally:', error);
      throw error;
    }
  }

  /**
   * Get all chats from local storage
   */
  async getAllChats(): Promise<LocalChat[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);
      if (!stored) {
        return [];
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Error getting chats from local storage:', error);
      return [];
    }
  }

  /**
   * Get a specific chat
   */
  async getChat(chatId: string): Promise<LocalChat | null> {
    try {
      // Check cache first
      if (this.chatCache.has(chatId)) {
        return this.chatCache.get(chatId)!;
      }

      // Load from storage
      const chats = await this.getAllChats();
      const chat = chats.find(c => c.id === chatId);

      if (chat) {
        this.chatCache.set(chatId, chat);
      }

      return chat || null;
    } catch (error) {
      console.error('Error getting chat from local storage:', error);
      return null;
    }
  }

  /**
   * Update chat metadata (last message, unread count, etc.)
   */
  async updateChatMetadata(chatId: string, updates: Partial<LocalChat>): Promise<void> {
    try {
      const chats = await this.getAllChats();
      const index = chats.findIndex(c => c.id === chatId);

      if (index >= 0) {
        chats[index] = {
          ...chats[index],
          ...updates,
          lastSyncedAt: Date.now(),
        };

        await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
        this.chatCache.set(chatId, chats[index]);
      }
    } catch (error) {
      console.error('Error updating chat metadata:', error);
      throw error;
    }
  }

  /**
   * Delete a chat and all its messages
   */
  async deleteChat(chatId: string): Promise<void> {
    try {
      // Delete messages
      await AsyncStorage.removeItem(`${STORAGE_KEYS.MESSAGES}${chatId}`);
      this.messageCache.delete(chatId);

      // Delete chat
      const chats = await this.getAllChats();
      const filtered = chats.filter(c => c.id !== chatId);
      await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(filtered));
      this.chatCache.delete(chatId);

      console.log(`🗑️ Deleted chat locally: ${chatId}`);
    } catch (error) {
      console.error('Error deleting chat locally:', error);
      throw error;
    }
  }

  /**
   * Search messages locally
   */
  async searchMessages(query: string, chatId?: string): Promise<LocalMessage[]> {
    try {
      const searchQuery = query.toLowerCase().trim();
      if (!searchQuery) return [];

      let allMessages: LocalMessage[] = [];

      if (chatId) {
        // Search in specific chat
        allMessages = await this.getMessages(chatId);
      } else {
        // Search in all chats
        const chats = await this.getAllChats();
        for (const chat of chats) {
          if (!chat.isJobChat) {
            const messages = await this.getMessages(chat.id);
            allMessages.push(...messages);
          }
        }
      }

      // Filter messages by query
      return allMessages.filter(msg => 
        msg.text?.toLowerCase().includes(searchQuery) ||
        msg.senderName?.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Get pending messages (not synced to cloud)
   */
  async getPendingMessages(): Promise<LocalMessage[]> {
    try {
      const chats = await this.getAllChats();
      const pending: LocalMessage[] = [];

      for (const chat of chats) {
        if (!chat.isJobChat) {
          const messages = await this.getMessages(chat.id);
          pending.push(...messages.filter(m => m.syncStatus === 'pending'));
        }
      }

      return pending;
    } catch (error) {
      console.error('Error getting pending messages:', error);
      return [];
    }
  }

  /**
   * Mark message as synced
   */
  async markMessageAsSynced(chatId: string, localId: string, cloudId: string): Promise<void> {
    try {
      const messages = await this.getMessages(chatId);
      const index = messages.findIndex(m => m.localId === localId);

      if (index >= 0) {
        messages[index].id = cloudId;
        messages[index].syncStatus = 'synced';

        await AsyncStorage.setItem(
          `${STORAGE_KEYS.MESSAGES}${chatId}`,
          JSON.stringify(messages)
        );

        this.messageCache.set(chatId, messages);
      }
    } catch (error) {
      console.error('Error marking message as synced:', error);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      if (stored) {
        return JSON.parse(stored);
      }

      return {
        lastSyncTimestamp: 0,
        pendingMessages: 0,
        failedMessages: 0,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSyncTimestamp: 0,
        pendingMessages: 0,
        failedMessages: 0,
      };
    }
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      const current = await this.getSyncStatus();
      const updated = { ...current, ...status };
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  /**
   * Clear all local storage (for logout or data reset)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const guildKeys = keys.filter(key => key.startsWith('@guild_'));
      await AsyncStorage.multiRemove(guildKeys);

      this.messageCache.clear();
      this.chatCache.clear();

      console.log('🗑️ Cleared all local chat storage');
    } catch (error) {
      console.error('Error clearing local storage:', error);
      throw error;
    }
  }

  /**
   * Get storage size (for user info)
   */
  async getStorageSize(): Promise<{ chats: number; messages: number; total: number }> {
    try {
      const chats = await this.getAllChats();
      let totalMessages = 0;

      for (const chat of chats) {
        const messages = await this.getMessages(chat.id);
        totalMessages += messages.length;
      }

      return {
        chats: chats.length,
        messages: totalMessages,
        total: chats.length + totalMessages,
      };
    } catch (error) {
      console.error('Error getting storage size:', error);
      return { chats: 0, messages: 0, total: 0 };
    }
  }

  /**
   * Export chat data (for backup)
   */
  async exportChatData(chatId: string): Promise<string> {
    try {
      const chat = await this.getChat(chatId);
      const messages = await this.getMessages(chatId);

      const exportData = {
        chat,
        messages,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting chat data:', error);
      throw error;
    }
  }

  /**
   * Import chat data (from backup)
   */
  async importChatData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.chat) {
        await this.saveChat(data.chat);
      }

      if (data.messages && Array.isArray(data.messages)) {
        for (const message of data.messages) {
          await this.saveMessage(data.chat.id, message, false);
        }
      }

      console.log('✅ Imported chat data successfully');
    } catch (error) {
      console.error('Error importing chat data:', error);
      throw error;
    }
  }
}

export const LocalChatStorage = new LocalChatStorageService();
export default LocalChatStorage;















