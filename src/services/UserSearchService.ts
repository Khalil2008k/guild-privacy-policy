/**
 * User Search Service
 * Find users by GID, phone number, or name
 */

import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  limit,
  orderBy,
  startAt,
  endAt,
} from 'firebase/firestore';

export interface UserSearchResult {
  uid: string;
  gid: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  lastSeen?: Date;
  online?: boolean;
}

class UserSearchServiceClass {
  /**
   * Search users by GID (exact match)
   */
  async searchByGID(gid: string): Promise<UserSearchResult | null> {
    try {
      console.log('🔍 Searching user by GID:', gid);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('gid', '==', gid), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('❌ No user found with GID:', gid);
        return null;
      }

      const userData = snapshot.docs[0].data();
      console.log('✅ User found:', userData.displayName);

      return this.formatUserResult(snapshot.docs[0].id, userData);
    } catch (error) {
      console.error('Error searching by GID:', error);
      return null;
    }
  }

  /**
   * Search users by phone number (exact match)
   */
  async searchByPhone(phoneNumber: string): Promise<UserSearchResult | null> {
    try {
      console.log('🔍 Searching user by phone:', phoneNumber);

      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', normalizedPhone), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('❌ No user found with phone:', phoneNumber);
        return null;
      }

      const userData = snapshot.docs[0].data();
      console.log('✅ User found:', userData.displayName);

      return this.formatUserResult(snapshot.docs[0].id, userData);
    } catch (error) {
      console.error('Error searching by phone:', error);
      return null;
    }
  }

  /**
   * Search users by name (partial match)
   */
  async searchByName(name: string): Promise<UserSearchResult[]> {
    try {
      console.log('🔍 Searching users by name:', name);

      if (!name || name.trim().length < 2) {
        return [];
      }

      const usersRef = collection(db, 'users');
      const searchTerm = name.toLowerCase();

      // Search by displayName
      const q = query(
        usersRef,
        orderBy('displayNameLower'),
        startAt(searchTerm),
        endAt(searchTerm + '\uf8ff'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      console.log(`✅ Found ${snapshot.docs.length} users`);

      return snapshot.docs.map(doc => this.formatUserResult(doc.id, doc.data()));
    } catch (error) {
      console.error('Error searching by name:', error);
      return [];
    }
  }

  /**
   * Universal search (tries GID, phone, then name)
   */
  async universalSearch(searchTerm: string): Promise<UserSearchResult[]> {
    try {
      console.log('🔍 Universal search:', searchTerm);

      const results: UserSearchResult[] = [];
      const trimmed = searchTerm.trim();

      if (!trimmed) return [];

      // 1. Try GID (if it looks like a GID - alphanumeric)
      if (/^[A-Z0-9]{6,}$/i.test(trimmed)) {
        const gidResult = await this.searchByGID(trimmed);
        if (gidResult) {
          results.push(gidResult);
          return results; // Exact GID match, return immediately
        }
      }

      // 2. Try phone number (if it looks like a phone - starts with + or digits)
      if (/^[\+\d]/.test(trimmed)) {
        const phoneResult = await this.searchByPhone(trimmed);
        if (phoneResult) {
          results.push(phoneResult);
          return results; // Exact phone match, return immediately
        }
      }

      // 3. Try name search (partial match)
      const nameResults = await this.searchByName(trimmed);
      results.push(...nameResults);

      console.log(`✅ Universal search found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('Error in universal search:', error);
      return [];
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUID(uid: string): Promise<UserSearchResult | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      return this.formatUserResult(userDoc.id, userDoc.data());
    } catch (error) {
      console.error('Error getting user by UID:', error);
      return null;
    }
  }

  /**
   * Format user data to search result
   */
  private formatUserResult(uid: string, userData: any): UserSearchResult {
    return {
      uid,
      gid: userData.gid || 'N/A',
      displayName: userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      avatar: userData.avatar || userData.photoURL,
      bio: userData.bio,
      isVerified: userData.isVerified || false,
      lastSeen: userData.lastSeen?.toDate?.() || new Date(),
      online: userData.online || false,
    };
  }

  /**
   * Get recent contacts (users you've chatted with)
   */
  async getRecentContacts(currentUserId: string, limitCount: number = 10): Promise<UserSearchResult[]> {
    try {
      console.log('🔍 Getting recent contacts for:', currentUserId);

      // Get chats where user is a participant
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUserId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const userIds = new Set<string>();

      // Extract other participants
      snapshot.docs.forEach(doc => {
        const participants = doc.data().participants || [];
        participants.forEach((id: string) => {
          if (id !== currentUserId) {
            userIds.add(id);
          }
        });
      });

      // Get user details
      const users: UserSearchResult[] = [];
      for (const userId of userIds) {
        const user = await this.getUserByUID(userId);
        if (user) {
          users.push(user);
        }
      }

      console.log(`✅ Found ${users.length} recent contacts`);
      return users;
    } catch (error) {
      console.error('Error getting recent contacts:', error);
      return [];
    }
  }

  /**
   * Get suggested users (popular, verified, etc.)
   * 
   * NOTE: Temporarily disabled isVerified query due to missing Firestore index
   * TODO: Add index or move to backend with proper indexing
   */
  async getSuggestedUsers(currentUserId: string, limitCount: number = 10): Promise<UserSearchResult[]> {
    try {
      console.log('🔍 Getting suggested users');

      // TEMPORARY FIX: Get recent users instead of verified users
      // This avoids the permission error from missing isVerified index
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        limit(limitCount * 2) // Get more to filter out current user
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .filter(doc => doc.id !== currentUserId)
        .slice(0, limitCount) // Limit after filtering
        .map(doc => this.formatUserResult(doc.id, doc.data()));

      console.log(`✅ Found ${users.length} suggested users`);
      return users;
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return [];
    }
  }
}

export const UserSearchService = new UserSearchServiceClass();
export default UserSearchService;

