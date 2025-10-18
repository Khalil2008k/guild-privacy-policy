/**
 * Guild Service - Frontend guild management
 * Integrates with backend API and Firebase for guild operations
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BackendAPI } from '../../config/backend';

export interface GuildMember {
  userId: string;
  username: string;
  avatar?: string;
  role: 'GUILD_MASTER' | 'VICE_MASTER' | 'MEMBER';
  level: 1 | 2 | 3;
  userRank?: string;
  joinedAt: Timestamp;
  contributedEarnings: number;
  completedGuildJobs: number;
  lastActiveAt: Timestamp;
  permissions: {
    canInvite: boolean;
    canKick: boolean;
    canPostJobs: boolean;
    canManageRoles: boolean;
    canEditGuild: boolean;
  };
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  logo?: string;
  guildMasterId: string;
  viceMasterIds: string[];
  memberCount: number;
  maxMembers: number;
  totalEarnings: number;
  totalJobs: number;
  successRate: number;
  guildRank: 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
  isActive: boolean;
  isPublic: boolean;
  requiresApproval: boolean;
  settings?: {
    isPublic: boolean;
    requiresApproval: boolean;
    minimumRank: string;
    maxMembers: number;
    guildRules: string[];
    autoApprovalEnabled: boolean;
    memberRemovalPolicy: 'MASTER_ONLY' | 'VOTE_REQUIRED' | 'ADMIN_OVERRIDE';
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GuildInvitation {
  id?: string;
  guildId: string;
  guildName: string;
  invitedBy: string;
  invitedByName: string;
  invitedUserId: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface GuildApplication {
  id?: string;
  guildId: string;
  userId: string;
  username: string;
  userRank: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface CreateGuildData {
  name: string;
  description: string;
  logo?: string;
  category?: string;
  location?: string;
  settings?: {
    isPublic?: boolean;
    requiresApproval?: boolean;
    minimumRank?: string;
    maxMembers?: number;
    guildRules?: string[];
    autoApprovalEnabled?: boolean;
    memberRemovalPolicy?: 'MASTER_ONLY' | 'VOTE_REQUIRED' | 'ADMIN_OVERRIDE';
  };
}

class GuildService {
  private guildListeners: Map<string, () => void> = new Map();

  /**
   * Get guild by ID
   */
  async getGuildById(guildId: string): Promise<Guild | null> {
    try {
      // Try backend API first
      const response = await BackendAPI.get(`/guilds/${guildId}`);
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for guild:', error);
    }

    // Fallback to Firebase
    try {
      const guildDoc = await getDoc(doc(db, 'guilds', guildId));
      if (guildDoc.exists()) {
        return {
          id: guildDoc.id,
          ...guildDoc.data()
        } as Guild;
      }
      return null;
    } catch (error) {
      console.error('Error fetching guild:', error);
      return null;
    }
  }

  /**
   * Get guild members
   */
  async getGuildMembers(guildId: string): Promise<GuildMember[]> {
    try {
      // Try backend API first
      const response = await BackendAPI.get(`/guilds/${guildId}/members`);
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for guild members:', error);
    }

    // Fallback to Firebase
    try {
      const membersQuery = query(
        collection(db, 'guilds', guildId, 'members'),
        orderBy('joinedAt', 'desc')
      );
      const snapshot = await getDocs(membersQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data()
      } as GuildMember));
    } catch (error) {
      console.error('Error fetching guild members:', error);
      return [];
    }
  }

  /**
   * Get user's guilds
   */
  async getUserGuilds(userId: string): Promise<Guild[]> {
    try {
      // Try backend API first
      const response = await BackendAPI.get(`/users/${userId}/guilds`);
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for user guilds:', error);
    }

    // Fallback to Firebase - check membership collection
    try {
      const membershipQuery = query(
        collection(db, 'guildMemberships'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(membershipQuery);
      
      const guildPromises = snapshot.docs.map(async (doc) => {
        const membership = doc.data();
        return this.getGuildById(membership.guildId);
      });

      const guilds = await Promise.all(guildPromises);
      return guilds.filter(g => g !== null) as Guild[];
    } catch (error) {
      console.error('Error fetching user guilds:', error);
      return [];
    }
  }

  /**
   * Create a new guild
   */
  async createGuild(data: CreateGuildData): Promise<Guild> {
    try {
      const response = await BackendAPI.post('/guilds', data);
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to create guild');
    } catch (error) {
      console.error('Error creating guild:', error);
      throw error;
    }
  }

  /**
   * Search for guilds
   */
  async searchGuilds(searchTerm: string, filters?: {
    category?: string;
    location?: string;
    minRank?: string;
  }): Promise<Guild[]> {
    try {
      // Try backend API first
      const response = await BackendAPI.get('/guilds/search', {
        params: { q: searchTerm, ...filters }
      });
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for guild search:', error);
    }

    // Fallback to Firebase
    try {
      let guildsQuery = query(
        collection(db, 'guilds'),
        where('isPublic', '==', true),
        where('isActive', '==', true),
        orderBy('memberCount', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(guildsQuery);
      let guilds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Guild));

      // Client-side filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        guilds = guilds.filter(g => 
          g.name.toLowerCase().includes(searchLower) ||
          g.description.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.category) {
        guilds = guilds.filter(g => g.category === filters.category);
      }

      if (filters?.location) {
        guilds = guilds.filter(g => g.location === filters.location);
      }

      return guilds;
    } catch (error) {
      console.error('Error searching guilds:', error);
      return [];
    }
  }

  /**
   * Apply to join a guild
   */
  async applyToGuild(guildId: string, message: string): Promise<GuildApplication> {
    try {
      const response = await BackendAPI.post(`/guilds/${guildId}/apply`, { message });
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to apply to guild');
    } catch (error) {
      console.error('Error applying to guild:', error);
      throw error;
    }
  }

  /**
   * Accept guild invitation
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      await BackendAPI.post(`/guilds/invitations/${invitationId}/accept`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Reject guild invitation
   */
  async rejectInvitation(invitationId: string): Promise<void> {
    try {
      await BackendAPI.post(`/guilds/invitations/${invitationId}/reject`);
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      throw error;
    }
  }

  /**
   * Get user's pending invitations
   */
  async getUserInvitations(userId: string): Promise<GuildInvitation[]> {
    try {
      const response = await BackendAPI.get(`/users/${userId}/guild-invitations`);
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.log('Falling back to Firebase for invitations:', error);
    }

    // Fallback to Firebase
    try {
      const invitationsQuery = query(
        collection(db, 'guildInvitations'),
        where('invitedUserId', '==', userId),
        where('status', '==', 'PENDING'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(invitationsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GuildInvitation));
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }
  }

  /**
   * Listen to guild updates
   */
  listenToGuild(guildId: string, callback: (guild: Guild | null) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'guilds', guildId),
      (doc) => {
        if (doc.exists()) {
          callback({
            id: doc.id,
            ...doc.data()
          } as Guild);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to guild:', error);
      }
    );

    this.guildListeners.set(guildId, unsubscribe);

    return () => {
      unsubscribe();
      this.guildListeners.delete(guildId);
    };
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.guildListeners.forEach(unsubscribe => unsubscribe());
    this.guildListeners.clear();
  }
}

// Export singleton instance
export const guildService = new GuildService();





