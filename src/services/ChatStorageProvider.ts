/**
 * Chat Storage Provider
 * Single routing interface for all chat operations
 * 
 * STORAGE POLICY: Personal=Local, Job/Admin/System=Firestore
 * 
 * UNIFIED ROUTING LOGIC:
 * - Job chats (chatId contains 'job-' prefix): Use Firestore
 * - Admin chats (chatId contains 'admin-' prefix): Use Firestore  
 * - System chats (chatId contains 'system-' prefix): Use Firestore
 * - All other chatIds (personal conversations): Use LocalChatStorage
 * 
 * HYBRID MODEL SCHEMA:
 * - Firestore: chats/{chatId}/messages/{messageId} for job/admin/system chats
 * - LocalStorage: AsyncStorage keys for personal chats
 * - Chat metadata: Always in Firestore for all chat types (unread counts, last message)
 * 
 * This ensures job discussions are always stored in cloud for legal/compliance,
 * while personal chats use local storage for privacy and performance.
 * 
 * SCHEMA COMMENT BLOCK:
 * ────────────────────────────────────────────────────────────────────────────────
 * STORAGE POLICY ENFORCEMENT:
 * • job-* chats → Firestore (for disputes & admin access)
 * • admin-* chats → Firestore
 * • system-* chats → Firestore
 * • all other chats → LocalChatStorage (on-device only)
 * ────────────────────────────────────────────────────────────────────────────────
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import LocalChatStorage from './LocalChatStorage';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  readBy?: Record<string, Timestamp>;
}

export interface MessageOptions {
  limit?: number;
  startAfterId?: string;
}

class ChatStorageProviderClass {
  /**
   * Determine if chat should use Firestore or LocalStorage
   * UNIFIED ROUTING RULE: job-*, admin-*, system-* → Firestore, all others → LocalStorage
   */
  shouldUseFirestore(chatId: string): boolean {
    // Job chats, admin chats, and system chats use Firestore
    return chatId.includes('job-') || chatId.includes('admin-') || chatId.includes('system-');
  }

  /**
   * Get messages from appropriate storage
   */
  async getMessages(chatId: string, opts?: MessageOptions): Promise<ChatMessage[]> {
    const useFirestore = this.shouldUseFirestore(chatId);
    console.log(`Storage → ${useFirestore ? 'Firestore' : 'Local'}`, chatId);
    
    if (useFirestore) {
      return this.getMessagesFromFirestore(chatId, opts);
    } else {
      return this.getMessagesFromLocal(chatId, opts);
    }
  }

  /**
   * Send message to appropriate storage
   */
  async sendMessage(chatId: string, payload: any): Promise<string> {
    const useFirestore = this.shouldUseFirestore(chatId);
    console.log(`Storage → ${useFirestore ? 'Firestore' : 'Local'}`, chatId);
    
    if (useFirestore) {
      return this.sendMessageToFirestore(chatId, payload);
    } else {
      return this.sendMessageToLocal(chatId, payload);
    }
  }

  /**
   * Update message in appropriate storage
   */
  async updateMessage(chatId: string, id: string, patch: Partial<ChatMessage>): Promise<void> {
    const useFirestore = this.shouldUseFirestore(chatId);
    console.log(`Storage → ${useFirestore ? 'Firestore' : 'Local'}`, chatId);
    
    if (useFirestore) {
      return this.updateMessageInFirestore(chatId, id, patch);
    } else {
      return this.updateMessageInLocal(chatId, id, patch);
    }
  }

  /**
   * Delete message from appropriate storage
   */
  async deleteMessage(chatId: string, id: string): Promise<void> {
    const useFirestore = this.shouldUseFirestore(chatId);
    console.log(`Storage → ${useFirestore ? 'Firestore' : 'Local'}`, chatId);
    
    if (useFirestore) {
      return this.deleteMessageFromFirestore(chatId, id);
    } else {
      return this.deleteMessageFromLocal(chatId, id);
    }
  }

  // Firestore implementations
  private async getMessagesFromFirestore(chatId: string, opts?: MessageOptions): Promise<ChatMessage[]> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    let q = query(messagesRef, orderBy('createdAt', 'desc'));
    
    if (opts?.limit) {
      q = query(q, limit(opts.limit));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage)).reverse(); // Reverse to get chronological order
  }

  private async sendMessageToFirestore(chatId: string, payload: any): Promise<string> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const docRef = await addDoc(messagesRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  private async updateMessageInFirestore(chatId: string, id: string, patch: Partial<ChatMessage>): Promise<void> {
    const messageRef = doc(db, 'chats', chatId, 'messages', id);
    await updateDoc(messageRef, {
      ...patch,
      updatedAt: serverTimestamp()
    });
  }

  private async deleteMessageFromFirestore(chatId: string, id: string): Promise<void> {
    const messageRef = doc(db, 'chats', chatId, 'messages', id);
    await deleteDoc(messageRef);
  }

  // LocalStorage implementations
  private async getMessagesFromLocal(chatId: string, opts?: MessageOptions): Promise<ChatMessage[]> {
    const messages = await LocalChatStorage.getMessages(chatId, opts?.limit);
    return messages.map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      text: msg.text,
      type: msg.type as 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE',
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      readBy: msg.readBy
    }));
  }

  private async sendMessageToLocal(chatId: string, payload: any): Promise<string> {
    const messageId = await LocalChatStorage.saveMessage(chatId, {
      id: '', // Will be generated
      chatId,
      senderId: payload.senderId,
      text: payload.text,
      type: payload.type || 'TEXT',
      createdAt: new Date(),
      updatedAt: new Date(),
      readBy: {}
    }, false);
    return messageId;
  }

  private async updateMessageInLocal(chatId: string, id: string, patch: Partial<ChatMessage>): Promise<void> {
    await LocalChatStorage.updateMessage(chatId, id, {
      ...patch,
      updatedAt: new Date()
    });
  }

  private async deleteMessageFromLocal(chatId: string, id: string): Promise<void> {
    await LocalChatStorage.deleteMessage(chatId, id);
  }
}

export const ChatStorageProvider = new ChatStorageProviderClass();
export default ChatStorageProvider;
