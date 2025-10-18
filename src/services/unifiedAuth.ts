/**
 * Unified Authentication Service
 * Enterprise-grade authentication system that works across all platforms
 * (React Native, Admin Portal, Backend API)
 */

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  getIdTokenResult
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// User roles and permissions
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum UserRank {
  G = 'G',
  F = 'F',
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
  SS = 'SS',
  SSS = 'SSS'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  rank: UserRank;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
  
  // Profile details
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language: string;
  
  // Guild information
  guildId?: string;
  guildRole?: 'master' | 'vice_master' | 'member';
  guildLevel?: number;
  
  // Statistics
  completedJobs: number;
  totalEarnings: number;
  rating: number;
  reviewCount: number;
  
  // Security
  twoFactorEnabled: boolean;
  lastPasswordChange?: Date;
  securityQuestions?: string[];
  
  // Preferences
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  
  // Privacy settings
  privacy: {
    profileVisibility: 'public' | 'guild' | 'private';
    showEmail: boolean;
    showLocation: boolean;
    showStats: boolean;
  };
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
  language?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

// Permission definitions
const PERMISSIONS = {
  [UserRole.USER]: [
    'profile.read',
    'profile.update',
    'jobs.browse',
    'jobs.apply',
    'guilds.browse',
    'guilds.join',
    'chat.send',
    'chat.receive'
  ],
  [UserRole.MODERATOR]: [
    'profile.read',
    'profile.update',
    'jobs.browse',
    'jobs.apply',
    'jobs.moderate',
    'guilds.browse',
    'guilds.join',
    'guilds.moderate',
    'chat.send',
    'chat.receive',
    'chat.moderate',
    'users.view',
    'reports.view',
    'reports.handle'
  ],
  [UserRole.ADMIN]: [
    '*', // All permissions except super admin actions
    '!system.manage',
    '!users.delete',
    '!admin.manage'
  ],
  [UserRole.SUPER_ADMIN]: ['*'] // All permissions
};

class UnifiedAuthService {
  private authState: AuthState = {
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  };

  private listeners: ((state: AuthState) => void)[] = [];
  private unsubscribeAuth: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the authentication service
   */
  private async initialize(): Promise<void> {
    try {
      // Set up Firebase auth state listener
      this.unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        await this.handleAuthStateChange(firebaseUser);
      });

      // Load cached user data if available
      await this.loadCachedUser();

    } catch (error: any) {
      logger.error('Failed to initialize auth service', { error: error.message });
      this.updateAuthState({ 
        loading: false, 
        error: 'Authentication service initialization failed' 
      });
    }
  }

  /**
   * Handle Firebase auth state changes
   */
  private async handleAuthStateChange(firebaseUser: FirebaseUser | null): Promise<void> {
    try {
      if (firebaseUser) {
        // User is signed in, load their profile
        const userProfile = await this.loadUserProfile(firebaseUser);
        
        if (userProfile && userProfile.isActive) {
          // Update last login
          await this.updateLastLogin(userProfile.uid);
          
          // Cache user data
          await this.cacheUserData(userProfile);
          
          this.updateAuthState({
            user: userProfile,
            loading: false,
            error: null,
            isAuthenticated: true
          });
        } else {
          // User exists but is inactive or profile not found
          await this.signOut();
          this.updateAuthState({
            user: null,
            loading: false,
            error: userProfile ? 'Account is inactive' : 'User profile not found',
            isAuthenticated: false
          });
        }
      } else {
        // User is signed out
        await this.clearCachedUser();
        this.updateAuthState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false
        });
      }
    } catch (error: any) {
      logger.error('Auth state change error', { error: error.message });
      this.updateAuthState({
        user: null,
        loading: false,
        error: 'Authentication error occurred',
        isAuthenticated: false
      });
    }
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        logger.warn('User profile not found in Firestore', { uid: firebaseUser.uid });
        return null;
      }

      const userData = userDoc.data();
      const idTokenResult = await getIdTokenResult(firebaseUser);
      
      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || userData.displayName || '',
        photoURL: firebaseUser.photoURL || userData.photoURL,
        role: (idTokenResult.claims.role as UserRole) || UserRole.USER,
        rank: userData.rank || UserRank.G,
        isVerified: firebaseUser.emailVerified,
        isActive: userData.isActive !== false,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate(),
        loginCount: userData.loginCount || 0,
        
        // Profile details
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        bio: userData.bio || '',
        location: userData.location || '',
        timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: userData.language || 'en',
        
        // Guild information
        guildId: userData.guildId,
        guildRole: userData.guildRole,
        guildLevel: userData.guildLevel,
        
        // Statistics
        completedJobs: userData.completedJobs || 0,
        totalEarnings: userData.totalEarnings || 0,
        rating: userData.rating || 0,
        reviewCount: userData.reviewCount || 0,
        
        // Security
        twoFactorEnabled: userData.twoFactorEnabled || false,
        lastPasswordChange: userData.lastPasswordChange?.toDate(),
        securityQuestions: userData.securityQuestions || [],
        
        // Preferences
        notifications: {
          email: userData.notifications?.email !== false,
          push: userData.notifications?.push !== false,
          sms: userData.notifications?.sms || false,
          marketing: userData.notifications?.marketing || false
        },
        
        // Privacy settings
        privacy: {
          profileVisibility: userData.privacy?.profileVisibility || 'public',
          showEmail: userData.privacy?.showEmail || false,
          showLocation: userData.privacy?.showLocation !== false,
          showStats: userData.privacy?.showStats !== false
        }
      };

      return userProfile;
    } catch (error: any) {
      logger.error('Failed to load user profile', { 
        uid: firebaseUser.uid, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<UserProfile> {
    try {
      this.updateAuthState({ loading: true, error: null });

      const { email, password, rememberMe } = credentials;
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Sign in with Firebase
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result.user.emailVerified) {
        await firebaseSignOut(auth);
        throw new Error('Please verify your email address before signing in');
      }

      // Check if user has required role for admin portal (if applicable)
      const idTokenResult = await getIdTokenResult(result.user);
      const role = idTokenResult.claims.role as UserRole;
      
      // The user profile will be loaded by the auth state change listener
      // Return a promise that resolves when the user is loaded
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Sign in timeout'));
        }, 10000);

        const unsubscribe = this.subscribe((state) => {
          if (!state.loading) {
            clearTimeout(timeout);
            unsubscribe();
            
            if (state.user) {
              resolve(state.user);
            } else {
              reject(new Error(state.error || 'Sign in failed'));
            }
          }
        });
      });

    } catch (error: any) {
      logger.error('Sign in failed', { email, error: error.message });
      this.updateAuthState({ 
        loading: false, 
        error: this.getErrorMessage(error) 
      });
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<UserProfile> {
    try {
      this.updateAuthState({ loading: true, error: null });

      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        displayName, 
        language = 'en',
        acceptTerms,
        acceptPrivacy
      } = data;

      // Validate input
      if (!email || !password || !firstName || !lastName || !displayName) {
        throw new Error('All required fields must be filled');
      }

      if (!acceptTerms || !acceptPrivacy) {
        throw new Error('You must accept the terms of service and privacy policy');
      }

      // Create Firebase user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile
      await updateProfile(result.user, {
        displayName: displayName
      });

      // Create user profile in Firestore
      const userProfile: Partial<UserProfile> = {
        uid: result.user.uid,
        email: result.user.email || email,
        displayName: displayName,
        role: UserRole.USER,
        rank: UserRank.G,
        isVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginCount: 0,
        
        firstName,
        lastName,
        language,
        
        completedJobs: 0,
        totalEarnings: 0,
        rating: 0,
        reviewCount: 0,
        
        twoFactorEnabled: false,
        
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false
        },
        
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showLocation: true,
          showStats: true
        }
      };

      await setDoc(doc(db, 'users', result.user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send email verification
      await sendEmailVerification(result.user);

      // Log registration event
      logger.info('User registered successfully', { 
        uid: result.user.uid, 
        email: email 
      });

      // Return the created user profile
      return userProfile as UserProfile;

    } catch (error: any) {
      logger.error('Registration failed', { email: data.email, error: error.message });
      this.updateAuthState({ 
        loading: false, 
        error: this.getErrorMessage(error) 
      });
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      await this.clearCachedUser();
      
      logger.info('User signed out successfully');
    } catch (error: any) {
      logger.error('Sign out failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      logger.info('Password reset email sent', { email });
    } catch (error: any) {
      logger.error('Password reset failed', { email, error: error.message });
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      if (!this.authState.user) {
        throw new Error('User not authenticated');
      }

      const uid = this.authState.user.uid;
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const updatedUser = { ...this.authState.user, ...updates };
      await this.cacheUserData(updatedUser);
      
      this.updateAuthState({
        user: updatedUser
      });

      logger.info('User profile updated', { uid, updates: Object.keys(updates) });
    } catch (error: any) {
      logger.error('Profile update failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    try {
      if (!this.authState.user || !auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const user = auth.currentUser;
      const uid = user.uid;

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', uid));

      // Delete Firebase user
      await deleteUser(user);

      logger.info('User account deleted', { uid });
    } catch (error: any) {
      logger.error('Account deletion failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    if (!this.authState.user) return false;

    const userPermissions = PERMISSIONS[this.authState.user.role] || [];
    
    // Super admin has all permissions
    if (userPermissions.includes('*')) return true;
    
    // Check if permission is explicitly denied
    if (userPermissions.includes(`!${permission}`)) return false;
    
    // Check if user has the specific permission
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the given roles
   */
  hasRole(...roles: UserRole[]): boolean {
    if (!this.authState.user) return false;
    return roles.includes(this.authState.user.role);
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current state
    callback(this.getAuthState());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update auth state and notify listeners
   */
  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.listeners.forEach(callback => callback(this.getAuthState()));
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLoginAt: serverTimestamp(),
        loginCount: increment(1)
      });
    } catch (error: any) {
      logger.error('Failed to update last login', { uid, error: error.message });
    }
  }

  /**
   * Cache user data locally
   */
  private async cacheUserData(user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem('cached_user', JSON.stringify(user));
    } catch (error: any) {
      logger.error('Failed to cache user data', { error: error.message });
    }
  }

  /**
   * Load cached user data
   */
  private async loadCachedUser(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem('cached_user');
      if (cachedData) {
        const user = JSON.parse(cachedData) as UserProfile;
        this.updateAuthState({ user, isAuthenticated: true });
      }
    } catch (error: any) {
      logger.error('Failed to load cached user', { error: error.message });
    }
  }

  /**
   * Clear cached user data
   */
  private async clearCachedUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cached_user');
    } catch (error: any) {
      logger.error('Failed to clear cached user', { error: error.message });
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    const errorCode = error.code || error.message;
    
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password is too weak. Please choose a stronger password',
      'auth/requires-recent-login': 'Please sign in again to complete this action',
      'auth/network-request-failed': 'Network error. Please check your connection'
    };

    return errorMessages[errorCode] || error.message || 'An unexpected error occurred';
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const unifiedAuth = new UnifiedAuthService();
export default unifiedAuth;

