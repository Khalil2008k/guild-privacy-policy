import { apiService } from './apiService';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  bio: string;
  idNumber: string;
  profileImage: string | null;
  idFrontImage: string | null;
  idBackImage: string | null;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
  skills: string[];
  faceDetected: boolean;
  completedAt: string | null;
  isProfileComplete: boolean;
  status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  rank: string;
  guild: string | null;
  guildRole: 'Guild Master' | 'Vice Master' | 'Member' | null;
  completedJobs: number;
  earnings: number;
  joinDate: Date | string;
  lastActive: Date | string;
  isOnline: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
  pendingVerification: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export interface UserFilters {
  status?: string;
  verificationStatus?: string;
  rank?: string;
  guild?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class UserServiceV2 {
  /**
   * Get users with filters and pagination
   */
  async getUsers(filters: UserFilters = {}): Promise<{
    users: UserProfile[];
    total: number;
    page: number;
    pages: number;
    hasMore: boolean;
  }> {
    try {
      const response = await apiService.getUsers(filters);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch users');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<UserProfile> {
    try {
      const response = await apiService.get(`/admin/users/${userId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiService.get('/admin/users/stats');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user stats');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Update user status (active, suspended, banned)
   */
  async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      const response = await apiService.updateUserStatus(userId, status);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Update user role (admin, moderator, user)
   */
  async updateUserRole(userId: string, role: string): Promise<void> {
    try {
      const response = await apiService.updateUserRole(userId, role);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string, duration?: number): Promise<void> {
    try {
      const response = await apiService.banUser(userId, reason, duration);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<void> {
    try {
      const response = await apiService.unbanUser(userId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to unban user');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  }

  /**
   * Verify user identity
   */
  async verifyUser(userId: string): Promise<void> {
    try {
      const response = await apiService.post(`/admin/users/${userId}/verify`, {});
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to verify user');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  }

  /**
   * Reject user verification
   */
  async rejectVerification(userId: string, reason: string): Promise<void> {
    try {
      const response = await apiService.post(`/admin/users/${userId}/reject-verification`, { reason });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      throw error;
    }
  }

  /**
   * Export users data
   */
  async exportUsers(filters: UserFilters = {}, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const params = { ...filters, format };
      // Convert all values to strings for URLSearchParams
      const stringParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>);
      
      const response = await fetch(`${apiService['baseUrl']}/admin/users/export?${new URLSearchParams(stringParams)}`, {
        method: 'GET',
        headers: await apiService['getAuthHeaders'](),
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }
}

export const userServiceV2 = new UserServiceV2();
