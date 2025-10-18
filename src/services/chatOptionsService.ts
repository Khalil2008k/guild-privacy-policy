import { doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ChatMuteSettings {
  isMuted: boolean;
  mutedUntil?: Date | null; // null = muted forever
  mutedAt?: Date;
}

export interface BlockedUser {
  userId: string;
  blockedAt: Date;
  reason?: string;
}

export class ChatOptionsService {
  /**
   * Mute chat notifications
   */
  async muteChat(
    chatId: string,
    userId: string,
    duration?: 'hour' | 'day' | 'week' | 'forever'
  ): Promise<void> {
    try {
      console.log('[ChatOptionsService] Muting chat:', { chatId, userId, duration });
      
      let mutedUntil: Date | null = null;

      if (duration && duration !== 'forever') {
        const now = new Date();
        switch (duration) {
          case 'hour':
            mutedUntil = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case 'day':
            mutedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'week':
            mutedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      const chatRef = doc(db, 'chats', chatId);
      
      // Check if chat exists first
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        console.error('[ChatOptionsService] Chat document does not exist!');
        // Create the chat document with mute data
        await setDoc(chatRef, {
          participants: [],
          mutedBy: {
            [userId]: {
              isMuted: true,
              mutedUntil: mutedUntil,
              mutedAt: serverTimestamp(),
            }
          },
          createdAt: serverTimestamp(),
          isActive: true,
        }, { merge: true });
        console.log('[ChatOptionsService] Chat document created with mute data');
      } else {
        // Update existing chat document
        const muteData: any = {};
        muteData[`mutedBy.${userId}`] = {
          isMuted: true,
          mutedUntil: mutedUntil,
          mutedAt: serverTimestamp(),
        };
        
        await updateDoc(chatRef, muteData);
        console.log('[ChatOptionsService] Chat muted successfully');
      }
    } catch (error) {
      console.error('[ChatOptionsService] Error muting chat:', error);
      throw error;
    }
  }

  /**
   * Unmute chat notifications
   */
  async unmuteChat(chatId: string, userId: string): Promise<void> {
    try {
      console.log('[ChatOptionsService] Unmuting chat:', { chatId, userId });
      
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        console.log('[ChatOptionsService] Chat does not exist, nothing to unmute');
        return;
      }
      
      const unmuteData: any = {};
      unmuteData[`mutedBy.${userId}`] = {
        isMuted: false,
        mutedUntil: null,
        unmutedAt: serverTimestamp(),
      };
      
      await updateDoc(chatRef, unmuteData);
      console.log('[ChatOptionsService] Chat unmuted successfully');
    } catch (error) {
      console.error('[ChatOptionsService] Error unmuting chat:', error);
      throw error;
    }
  }

  /**
   * Check if chat is muted
   */
  async isChatMuted(chatId: string, userId: string): Promise<boolean> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) return false;

      const chatData = chatSnap.data();
      const muteSettings = chatData.mutedBy?.[userId];

      if (!muteSettings || !muteSettings.isMuted) return false;

      // Check if mute has expired
      if (muteSettings.mutedUntil) {
        const mutedUntil = muteSettings.mutedUntil.toDate();
        if (new Date() > mutedUntil) {
          // Auto-unmute
          await this.unmuteChat(chatId, userId);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking mute status:', error);
      return false;
    }
  }

  /**
   * Block user
   */
  async blockUser(blockerId: string, blockedUserId: string, reason?: string): Promise<void> {
    try {
      console.log('[ChatOptionsService] Blocking user:', { blockerId, blockedUserId, reason });
      
      const blockRef = doc(db, 'users', blockerId, 'blockedUsers', blockedUserId);
      await setDoc(blockRef, {
        userId: blockedUserId,
        blockedAt: serverTimestamp(),
        reason: reason || '',
      });

      console.log('[ChatOptionsService] Block record created in subcollection');

      // Also update user's blocked list
      const userRef = doc(db, 'users', blockerId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const currentBlocked = userSnap.data().blockedUsers || [];
        await updateDoc(userRef, {
          blockedUsers: [...currentBlocked, blockedUserId],
          updatedAt: serverTimestamp(),
        });
        console.log('[ChatOptionsService] User blocked list updated');
      } else {
        console.log('[ChatOptionsService] User document does not exist, creating it');
        await setDoc(userRef, {
          blockedUsers: [blockedUserId],
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      
      console.log('[ChatOptionsService] User blocked successfully');
    } catch (error) {
      console.error('[ChatOptionsService] Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      const blockRef = doc(db, 'users', blockerId, 'blockedUsers', blockedUserId);
      await deleteDoc(blockRef);

      // Update user's blocked list
      const userRef = doc(db, 'users', blockerId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const currentBlocked = userSnap.data().blockedUsers || [];
        await updateDoc(userRef, {
          blockedUsers: currentBlocked.filter((id: string) => id !== blockedUserId),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    try {
      const blockRef = doc(db, 'users', blockerId, 'blockedUsers', blockedUserId);
      const blockSnap = await getDoc(blockRef);
      return blockSnap.exists();
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  }

  /**
   * Delete chat for user (soft delete)
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    try {
      console.log('[ChatOptionsService] Deleting chat:', { chatId, userId });
      
      const chatRef = doc(db, 'chats', chatId);
      
      // Check if chat exists first
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        console.log('[ChatOptionsService] Chat does not exist, creating soft delete record');
        await setDoc(chatRef, {
          deletedBy: {
            [userId]: serverTimestamp()
          },
          isActive: false,
          createdAt: serverTimestamp(),
        }, { merge: true });
        console.log('[ChatOptionsService] Soft delete record created');
        return;
      }
      
      const deleteData: any = {};
      deleteData[`deletedBy.${userId}`] = serverTimestamp();
      deleteData['isActive'] = false;
      
      await updateDoc(chatRef, deleteData);
      
      console.log('[ChatOptionsService] Chat deleted successfully');
    } catch (error) {
      console.error('[ChatOptionsService] Error deleting chat:', error);
      throw error;
    }
  }

  /**
   * Clear chat history for user
   */
  async clearChatHistory(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`clearedBy.${userId}`]: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }

  /**
   * Pin chat
   */
  async pinChat(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`pinnedBy.${userId}`]: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error pinning chat:', error);
      throw error;
    }
  }

  /**
   * Unpin chat
   */
  async unpinChat(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`pinnedBy.${userId}`]: null,
      });
    } catch (error) {
      console.error('Error unpinning chat:', error);
      throw error;
    }
  }

  /**
   * Archive chat
   */
  async archiveChat(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`archivedBy.${userId}`]: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error archiving chat:', error);
      throw error;
    }
  }

  /**
   * Unarchive chat
   */
  async unarchiveChat(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`archivedBy.${userId}`]: null,
      });
    } catch (error) {
      console.error('Error unarchiving chat:', error);
      throw error;
    }
  }

  /**
   * Export chat history
   */
  async exportChatHistory(chatId: string): Promise<string> {
    try {
      // This would generate a downloadable file with chat history
      // For now, return a placeholder
      return `Chat history for ${chatId} exported successfully`;
    } catch (error) {
      console.error('Error exporting chat history:', error);
      throw error;
    }
  }
}

export const chatOptionsService = new ChatOptionsService();
