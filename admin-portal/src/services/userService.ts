import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, collections, functions } from '../utils/firebase';

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
  joinDate: Date | Timestamp;
  lastActive: Date | Timestamp;
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
}

class UserService {
  private usersCollection = collection(db, collections.users);

  async getUsers(
    filters: UserFilters = {}, 
    pageSize: number = 20, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ users: UserProfile[], lastDoc: DocumentSnapshot | null, hasMore: boolean }> {
    try {
      let q = query(this.usersCollection, orderBy('createdAt', 'desc'));

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.verificationStatus) {
        q = query(q, where('verificationStatus', '==', filters.verificationStatus));
      }
      if (filters.rank) {
        q = query(q, where('rank', '==', filters.rank));
      }

      // Pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      q = query(q, firestoreLimit(pageSize + 1)); // Get one extra to check if there are more

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      const hasMore = docs.length > pageSize;
      const usersToReturn = hasMore ? docs.slice(0, pageSize) : docs;
      const newLastDoc = usersToReturn.length > 0 ? usersToReturn[usersToReturn.length - 1] : null;

      const users: UserProfile[] = await Promise.all(
        usersToReturn.map(async (docSnapshot) => {
          const userData = docSnapshot.data();
          
          // Get additional profile data
          const profileDoc = await getDoc(doc(db, collections.userProfiles, docSnapshot.id));
          const profileData = profileDoc.exists() ? profileDoc.data() as any : {};

          return {
            id: docSnapshot.id,
            fullName: (profileData?.fullName as string) || (userData?.displayName as string) || 'Unknown User',
            email: (userData?.email as string) || '',
            phoneNumber: (profileData?.phoneNumber as string) || '',
            dateOfBirth: (profileData?.dateOfBirth as string) || '',
            bio: (profileData?.bio as string) || '',
            idNumber: (profileData?.idNumber as string) || '',
            profileImage: (profileData?.profileImage as string) || null,
            idFrontImage: (profileData?.idFrontImage as string) || null,
            idBackImage: (profileData?.idBackImage as string) || null,
            location: profileData?.location || null,
            skills: (profileData?.skills as string[]) || [],
            faceDetected: (profileData?.faceDetected as boolean) || false,
            completedAt: (profileData?.completedAt as string) || null,
            isProfileComplete: (profileData?.isProfileComplete as boolean) || false,
            status: (userData?.status as UserProfile['status']) || 'active',
            verificationStatus: (userData?.verificationStatus as UserProfile['verificationStatus']) || 'unverified',
            rank: (userData?.rank as string) || 'G',
            guild: (userData?.guild as string) || null,
            guildRole: (userData?.guildRole as UserProfile['guildRole']) || null,
            completedJobs: (userData?.completedJobs as number) || 0,
            earnings: (userData?.earnings as number) || 0,
            joinDate: userData?.createdAt || userData?.joinDate || new Date(),
            lastActive: userData?.lastActive || new Date(),
            isOnline: (userData?.isOnline as boolean) || false,
          } as UserProfile;
        })
      );

      // Apply search filter (client-side for simplicity)
      let filteredUsers = users;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredUsers = users.filter(user => 
          user.fullName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.phoneNumber.includes(searchTerm)
        );
      }

      return {
        users: filteredUsers,
        lastDoc: newLastDoc,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(this.usersCollection, userId));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      const profileDoc = await getDoc(doc(db, collections.userProfiles, userId));
      const profileData = profileDoc.exists() ? profileDoc.data() as any : {};

      return {
        id: userId,
        fullName: (profileData?.fullName as string) || (userData?.displayName as string) || 'Unknown User',
        email: (userData?.email as string) || '',
        phoneNumber: (profileData?.phoneNumber as string) || '',
        dateOfBirth: (profileData?.dateOfBirth as string) || '',
        bio: (profileData?.bio as string) || '',
        idNumber: (profileData?.idNumber as string) || '',
        profileImage: (profileData?.profileImage as string) || null,
        idFrontImage: (profileData?.idFrontImage as string) || null,
        idBackImage: (profileData?.idBackImage as string) || null,
        location: profileData?.location || null,
        skills: (profileData?.skills as string[]) || [],
        faceDetected: (profileData?.faceDetected as boolean) || false,
        completedAt: (profileData?.completedAt as string) || null,
        isProfileComplete: (profileData?.isProfileComplete as boolean) || false,
        status: (userData?.status as UserProfile['status']) || 'active',
        verificationStatus: (userData?.verificationStatus as UserProfile['verificationStatus']) || 'unverified',
        rank: (userData?.rank as string) || 'G',
        guild: (userData?.guild as string) || null,
        guildRole: (userData?.guildRole as UserProfile['guildRole']) || null,
        completedJobs: (userData?.completedJobs as number) || 0,
        earnings: (userData?.earnings as number) || 0,
        joinDate: userData?.createdAt || userData?.joinDate || new Date(),
        lastActive: userData?.lastActive || new Date(),
        isOnline: (userData?.isOnline as boolean) || false,
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: UserProfile['status'], reason?: string): Promise<void> {
    try {
      // Use Cloud Function for admin actions
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../utils/firebase');
      
      const updateUserStatusFunction = httpsCallable(functions, 'updateUserStatus');
      const result = await updateUserStatusFunction({ userId, status, reason });
      
      if (!(result.data as any).success) {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateVerificationStatus(userId: string, verificationStatus: UserProfile['verificationStatus'], reason?: string): Promise<void> {
    try {
      // Use Cloud Function for admin actions
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../utils/firebase');
      
      const updateUserVerificationFunction = httpsCallable(functions, 'updateUserVerification');
      const result = await updateUserVerificationFunction({ userId, verificationStatus, reason });
      
      if (!(result.data as any).success) {
        throw new Error('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      // Get all users
      const allUsersSnapshot = await getDocs(this.usersCollection);
      const totalUsers = allUsersSnapshot.size;

      // Calculate stats
      let activeUsers = 0;
      let verifiedUsers = 0;
      let bannedUsers = 0;
      let pendingVerification = 0;
      let newUsersToday = 0;
      let newUsersThisWeek = 0;
      let newUsersThisMonth = 0;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      allUsersSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.status === 'active') activeUsers++;
        if (data.verificationStatus === 'verified') verifiedUsers++;
        if (data.status === 'banned') bannedUsers++;
        if (data.verificationStatus === 'pending') pendingVerification++;

        const joinDate = data.createdAt?.toDate() || data.joinDate?.toDate() || new Date(0);
        if (joinDate >= today) newUsersToday++;
        if (joinDate >= weekAgo) newUsersThisWeek++;
        if (joinDate >= monthAgo) newUsersThisMonth++;
      });

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
        bannedUsers,
        pendingVerification,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      // For now, get all users and filter client-side
      // In production, you'd want to use Algolia or similar for better search
      const { users } = await this.getUsers({}, limit * 2);
      
      const filtered = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
      ).slice(0, limit);

      return filtered;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;
