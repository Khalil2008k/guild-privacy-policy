/**
 * Real-Time Presence Service
 * Handles user online/offline status, typing indicators, and activity tracking
 * 
 * SCHEMA:
 * chats/{chatId} has field `typing`: { [uid: string]: boolean }
 * 
 * PRESENCE SCHEMA (Firestore fallback):
 * presence/{uid} = { state: 'online'|'offline', lastSeen: Timestamp }
 */

import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc,
  getDoc,
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { PresenceStatus, PresenceData, TypingIndicator } from '../types/EnhancedChat';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

class PresenceServiceClass {
  private presenceListeners: Map<string, () => void> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private typingListeners: Map<string, () => void> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  /**
   * Subscribe to user presence updates
   */
  subscribeToPresence(
    userId: string,
    callback: (presence: PresenceData) => void
  ): () => void {
    const presenceRef = doc(db, 'presence', userId);
    
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          status: data.status || 'offline',
          lastSeen: data.lastSeen?.toDate() || new Date(),
          isTyping: data.isTyping || false,
          typingPreview: data.typingPreview,
        });
      } else {
        callback({
          status: 'offline',
          lastSeen: new Date(),
          isTyping: false,
        });
      }
    });

    this.presenceListeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Update current user's presence status
   */
  async updatePresence(userId: string, status: PresenceStatus): Promise<void> {
    try {
      const presenceRef = doc(db, 'presence', userId);
      await setDoc(presenceRef, {
        status,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      logger.error('Error updating presence:', error);
    }
  }

  /**
   * Get current user ID
   */
  getMyUid(): string | null {
    return auth.currentUser?.uid || null;
  }

  /**
   * Start typing in a chat with TTL
   */
  async startTyping(chatId: string): Promise<void> {
    const uid = this.getMyUid();
    if (!uid) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`typing.${uid}`]: true,
        [`typingUpdated.${uid}`]: serverTimestamp()
      });

      // Clear existing timeout
      const timeoutKey = `${uid}-${chatId}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      }

      // Auto-stop typing after 3 seconds (increased for better UX)
      const timeout = setTimeout(() => {
        this.stopTyping(chatId);
      }, 3000);

      this.typingTimeouts.set(timeoutKey, timeout);
      logger.debug('✅ Typing indicator started for chat:', chatId);
    } catch (error) {
      logger.error('Error starting typing:', error);
    }
  }

  /**
   * Stop typing in a chat
   */
  async stopTyping(chatId: string): Promise<void> {
    const uid = this.getMyUid();
    if (!uid) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      
      // Stop typing with timestamp
      await updateDoc(chatRef, {
        [`typing.${uid}`]: false,
        [`typingUpdated.${uid}`]: serverTimestamp()
      }).catch(() => {}); // Silent fail for better UX

      // Clear timeout
      const timeoutKey = `${uid}-${chatId}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey)!);
        this.typingTimeouts.delete(timeoutKey);
      }
      logger.debug('✅ Typing indicator stopped for chat:', chatId);
    } catch (error) {
      logger.error('Error stopping typing:', error);
    }
  }

  /**
   * Hard cleanup on sign-out/unmount (removes fields entirely)
   */
  async clearTyping(chatId: string, uid?: string): Promise<void> {
    const targetUid = uid || this.getMyUid();
    if (!targetUid) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`typing.${targetUid}`]: deleteField(),
        [`typingUpdated.${targetUid}`]: deleteField()
      }).catch(() => {});
      logger.debug('✅ Typing fields cleared for chat:', chatId);
    } catch (error) {
      // Silent fail - cleanup is best-effort
    }
  }

  /**
   * Check if typing indicator is fresh (TTL check)
   */
  isTypingFresh(tsMillis?: number, ttlMs: number = 4500): boolean {
    if (!tsMillis) return false;
    return (Date.now() - tsMillis) < ttlMs;
  }

  /**
   * Subscribe to typing indicators in a chat with TTL filtering
   */
  subscribeTyping(
    chatId: string,
    callback: (typingUids: string[]) => void
  ): () => void {
    const listenerKey = `typing-${chatId}`;
    
    // Clean up existing listener
    if (this.typingListeners.has(listenerKey)) {
      this.typingListeners.get(listenerKey)!();
    }

    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const typing = data.typing || {};
        const typingUpdated = data.typingUpdated || {};
        const myUid = this.getMyUid();
        
        // Convert to array of UIDs (excluding current user) with TTL check
        const typingUids = Object.keys(typing).filter(uid => {
          if (uid === myUid) return false;
          if (typing[uid] !== true) return false;
          
          // Check TTL - only show if typing indicator is fresh
          const timestamp = typingUpdated[uid]?.toMillis?.();
          return this.isTypingFresh(timestamp);
        });
        
        callback(typingUids);
      } else {
        callback([]);
      }
    }, (error) => {
      logger.error('Error in typing subscription:', error);
      callback([]);
    });

    this.typingListeners.set(listenerKey, unsubscribe);
    logger.debug('✅ Real-time typing subscription active for chat:', chatId);
    return unsubscribe;
  }

  /**
   * Get user's last seen time
   */
  async getLastSeen(userId: string): Promise<Date> {
    try {
      const presenceRef = doc(db, 'presence', userId);
      const snapshot = await presenceRef.get();
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        return data.lastSeen?.toDate() || new Date();
      }
      
      return new Date();
    } catch (error) {
      logger.error('Error getting last seen:', error);
      return new Date();
    }
  }

  /**
   * Force stop typing for all chats (emergency cleanup)
   */
  async forceStopAllTyping(): Promise<void> {
    const uid = this.getMyUid();
    if (!uid) return;

    try {
      // Clear all timeouts
      this.typingTimeouts.forEach((timeout, key) => {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      });

      logger.debug('🧹 Force stopped all typing indicators');
    } catch (error) {
      logger.error('Error force stopping typing:', error);
    }
  }

  /**
   * Connect user and set online status with retry logic
   */
  async connectUser(uid: string): Promise<void> {
    const operationKey = `connect_${uid}`;
    const attempt = this.retryAttempts.get(operationKey) || 0;
    
    try {
      logger.debug(`🟢 Presence: Connecting user ${uid} (attempt ${attempt + 1})`);
      
      const presenceRef = doc(db, 'presence', uid);
      await setDoc(presenceRef, {
        state: 'online',
        lastSeen: serverTimestamp()
      });
      
      logger.info('✅ Presence: User connected successfully');
      this.retryAttempts.delete(operationKey); // Clear retry count on success
    } catch (error: any) {
      logger.error(`❌ Presence: Error connecting user (attempt ${attempt + 1}):`, error);
      
      // Check if it's a permission error and we haven't exceeded max retries
      if (error?.code === 'permission-denied' && attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[attempt] || 4000;
        logger.debug(`🔄 Presence: Retrying connection in ${delay}ms...`);
        
        this.retryAttempts.set(operationKey, attempt + 1);
        setTimeout(() => {
          this.connectUser(uid).catch(() => {
            // Final attempt failed, emit explicit error
            logger.error(`❌ Presence: Failed to connect user ${uid} after ${this.MAX_RETRIES} attempts`);
          });
        }, delay);
        return;
      }
      
      // Emit explicit error for non-retryable cases
      logger.error(`❌ Presence: Failed to connect user ${uid} - ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Disconnect user and set offline status
   */
  async disconnectUser(): Promise<void> {
    const uid = this.getMyUid();
    if (!uid) return;

    try {
      logger.debug('🔴 Presence: Disconnecting user', uid);
      
      const presenceRef = doc(db, 'presence', uid);
      await setDoc(presenceRef, {
        state: 'offline',
        lastSeen: serverTimestamp()
      });
      
      // Clean up all listeners
      this.cleanup();
      
      logger.info('✅ Presence: User disconnected successfully');
    } catch (error) {
      logger.error('❌ Presence: Error disconnecting user:', error);
      throw error;
    }
  }

  /**
   * Subscribe to multiple users' presence
   */
  subscribeUsersPresence(
    uids: string[],
    callback: (presenceMap: Record<string, { state: 'online' | 'offline', lastSeen: number }>) => void
  ): () => void {
    // COMMENT: PRIORITY 1 - Use logger instead of console.log
    logger.debug('👥 Presence: Subscribing to users', uids);
    
    const presenceMap: Record<string, { state: 'online' | 'offline', lastSeen: number }> = {};
    const unsubscribes: (() => void)[] = [];
    
    uids.forEach(uid => {
      const presenceRef = doc(db, 'presence', uid);
      const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          presenceMap[uid] = {
            state: data.state || 'offline',
            lastSeen: data.lastSeen?.toDate?.()?.getTime() || Date.now()
          };
        } else {
          presenceMap[uid] = {
            state: 'offline',
            lastSeen: Date.now()
          };
        }
        
        // Call callback with updated map
        callback({ ...presenceMap });
      }, (error) => {
        // COMMENT: PRIORITY 1 - Use logger instead of console.error
        logger.error('❌ Presence: Error in presence subscription:', error);
        presenceMap[uid] = {
          state: 'offline',
          lastSeen: Date.now()
        };
        callback({ ...presenceMap });
      });
      
      unsubscribes.push(unsubscribe);
    });
    
    // Return cleanup function
    return () => {
      if (__DEV__) {
        logger.debug('🧹 Presence: Unsubscribing from users', uids);
      }
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    this.presenceListeners.forEach((unsubscribe) => unsubscribe());
    this.presenceListeners.clear();
    
    this.typingListeners.forEach((unsubscribe) => unsubscribe());
    this.typingListeners.clear();
    
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * Calculate presence status based on last seen
   */
  calculateStatus(lastSeen: Date): PresenceStatus {
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;

    if (diffMinutes < 1) return 'online';
    if (diffMinutes < 5) return 'away';
    return 'offline';
  }
}

// Standalone functions for direct use
export async function startTyping(chatId: string, uid: string) {
  await updateDoc(doc(db, "chats", chatId), {
    [`typing.${uid}`]: true,
    [`typingUpdated.${uid}`]: serverTimestamp()
  });
}

export async function stopTyping(chatId: string, uid: string) {
  await updateDoc(doc(db, "chats", chatId), {
    [`typing.${uid}`]: false,
    [`typingUpdated.${uid}`]: serverTimestamp()
  }).catch(() => {});
}

export async function clearTyping(chatId: string, uid: string) {
  await updateDoc(doc(db, "chats", chatId), {
    [`typing.${uid}`]: deleteField(),
    [`typingUpdated.${uid}`]: deleteField()
  }).catch(() => {});
}

/**
 * Typing freshness check (UI utility)
 * @param tsMillis - Timestamp in milliseconds
 * @param ttlMs - Time to live in milliseconds (default: 4500ms)
 * @returns true if typing indicator is fresh
 */
export function isTypingFresh(tsMillis?: number, ttlMs = 4500): boolean {
  if (!tsMillis) return false;
  return (Date.now() - tsMillis) < ttlMs;
}

export const PresenceService = new PresenceServiceClass();
export default PresenceService;

