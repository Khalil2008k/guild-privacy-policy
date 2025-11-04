/**
 * Batch User Service
 * Efficiently fetch multiple users at once (fixes N+1 query problem)
 */

import { db } from '../config/firebase';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';

export interface BatchUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  online?: boolean;
  isVerified?: boolean;
}

class BatchUserServiceClass {
  private cache: Map<string, BatchUser> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get multiple users by UIDs (batched)
   * Firestore limit: 10 UIDs per query
   */
  async getUsersByUIDs(uids: string[]): Promise<Map<string, BatchUser>> {
    const result = new Map<string, BatchUser>();
    const now = Date.now();

    // Filter out cached users
    const uncachedUIDs: string[] = [];
    uids.forEach(uid => {
      const cached = this.cache.get(uid);
      const expiry = this.cacheExpiry.get(uid) || 0;

      if (cached && expiry > now) {
        result.set(uid, cached);
      } else {
        uncachedUIDs.push(uid);
      }
    });

    if (uncachedUIDs.length === 0) {
      console.log(`✅ All ${uids.length} users loaded from cache`);
      return result;
    }

    console.log(`📥 Fetching ${uncachedUIDs.length} users from Firestore...`);

    // Split into batches of 10 (Firestore limit)
    const batches = this.chunkArray(uncachedUIDs, 10);
    const fetchPromises = batches.map(batch => this.fetchBatch(batch));

    try {
      const batchResults = await Promise.all(fetchPromises);
      
      // Merge results and update cache
      batchResults.forEach(batchMap => {
        batchMap.forEach((user, uid) => {
          result.set(uid, user);
          this.cache.set(uid, user);
          this.cacheExpiry.set(uid, now + this.CACHE_TTL);
        });
      });

      console.log(`✅ Fetched ${uncachedUIDs.length} users in ${batches.length} batches`);
      return result;
    } catch (error) {
      console.error('Error fetching users in batches:', error);
      return result;
    }
  }

  /**
   * Fetch a single batch of users
   */
  private async fetchBatch(uids: string[]): Promise<Map<string, BatchUser>> {
    const result = new Map<string, BatchUser>();

    if (uids.length === 0) return result;

    try {
      const q = query(
        collection(db, 'users'),
        where(documentId(), 'in', uids)
      );

      const snapshot = await getDocs(q);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        result.set(doc.id, {
          uid: doc.id,
          name: data.name || data.displayName || 'Unknown',
          email: data.email || '',
          photoURL: data.photoURL || data.avatar,
          online: data.online || false,
          isVerified: data.isVerified || false,
        });
      });

      // Add placeholder for missing users
      uids.forEach(uid => {
        if (!result.has(uid)) {
          result.set(uid, {
            uid,
            name: 'Unknown User',
            email: '',
            online: false,
            isVerified: false,
          });
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching batch:', error);
      return result;
    }
  }

  /**
   * Get a single user (uses cache if available)
   */
  async getUserByUID(uid: string): Promise<BatchUser | null> {
    const users = await this.getUsersByUIDs([uid]);
    return users.get(uid) || null;
  }

  /**
   * Prefetch users for a list of chats
   */
  async prefetchChatUsers(chats: any[]): Promise<void> {
    const allUIDs = new Set<string>();

    chats.forEach(chat => {
      if (chat.participants && Array.isArray(chat.participants)) {
        chat.participants.forEach((uid: string) => allUIDs.add(uid));
      }
    });

    if (allUIDs.size > 0) {
      console.log(`🔄 Prefetching ${allUIDs.size} users...`);
      await this.getUsersByUIDs(Array.from(allUIDs));
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🗑️ User cache cleared');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;

    this.cacheExpiry.forEach((expiry, uid) => {
      if (expiry <= now) {
        this.cache.delete(uid);
        this.cacheExpiry.delete(uid);
        cleared++;
      }
    });

    if (cleared > 0) {
      console.log(`🗑️ Cleared ${cleared} expired cache entries`);
    }
  }

  /**
   * Utility: Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    this.cacheExpiry.forEach(expiry => {
      if (expiry <= now) expired++;
    });

    return {
      size: this.cache.size,
      expired,
    };
  }
}

export const BatchUserService = new BatchUserServiceClass();
export default BatchUserService;











