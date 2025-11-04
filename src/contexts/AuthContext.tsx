import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/secureStorage';
import { auth, db } from '../config/firebase';
import { 
  User, 
  onAuthStateChanged, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from '../config/environment';
import { notificationService } from '../services/notificationService';
import { firebaseInitService } from '../services/firebase/FirebaseInitService';
import { initializeUserSafely } from '../services/userInit';
import { registerPushTokenSafely, configureNotificationHandlers } from '../services/push';
import { authTokenService } from '../services/authTokenService';
import GlobalChatNotificationService from '../services/GlobalChatNotificationService';
import PresenceService from '../services/PresenceService';
import MessageNotificationService from '../services/MessageNotificationService';
import { firebaseSMSService } from '../services/firebaseSMSService';
import { logEnvironmentInfo } from '../utils/environmentDetection';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPhoneVerification: (phoneNumber: string) => Promise<string>;
  verifyPhoneCode: (verificationId: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  sendPhoneVerification: async () => '',
  verifyPhoneCode: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  onReady?: () => void;
}

export default function AuthProvider({ children, onReady }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Handle null auth (when Firebase is bypassed on Android)
    if (!auth) {
      setUser(null);
      setLoading(false);
      if (onReady) {
        onReady();
      }
      return;
    }

      const unsubscribe = onAuthStateChanged(auth as any, async (user) => {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔥 AUTH STATE CHANGED:', {
        hasUser: !!user, 
        userId: user?.uid, 
        email: user?.email,
        loading,
        isInitializing
      });
      
      // Prevent duplicate initialization
      if (user && isInitializing) {
        logger.debug('🔥 AUTH: Already initializing, skipping duplicate event');
        return;
      }
      
      // Check for 72-hour inactivity auto-logout
      if (user) {
        setIsInitializing(true);
        try {
          const lastActivityStr = await AsyncStorage.getItem('lastActivityTime');
          const now = Date.now();
          
          if (lastActivityStr) {
            const lastActivity = parseInt(lastActivityStr, 10);
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
            
            if (hoursSinceActivity >= 72) {
              logger.warn('🔒 AUTO-LOGOUT: 72 hours of inactivity detected');
              
              // COMMENT: Show user-friendly notification before logout
              // Per Deep Root System Audit - Fix for missing 72-hour logout notification
              try {
                const { showAutoLogoutNotification } = await import('@/utils/autoLogoutNotification');
                await showAutoLogoutNotification();
              } catch (notificationError) {
                // Fallback: If notification fails, proceed with logout anyway
                logger.warn('Failed to show auto-logout notification:', notificationError);
              }
              
              await firebaseSignOut(auth as any);
              await AsyncStorage.removeItem('lastActivityTime');
              setUser(null);
              setLoading(false);
              setIsInitializing(false);
              if (onReady) onReady();
              return;
            }
          }
          
          // Update last activity time
          await AsyncStorage.setItem('lastActivityTime', now.toString());
          logger.debug('✅ Last activity time updated:', new Date(now).toISOString());
        } catch (error) {
          logger.error('❌ Error checking activity time:', error);
        }
      } else {
        // User signed out, clear activity time
        await AsyncStorage.removeItem('lastActivityTime');
        setIsInitializing(false);
      }
      
      setUser(user);
      setLoading(false);
      
      // Handle notification token and secure storage when user signs in/out
      if (user) {
        logger.debug('🔥 AUTH: User signed in, calling onUserSignIn');
        
        // Start global chat notification listener
        GlobalChatNotificationService.startListening(user.uid);
        
        // Connect user to presence service
        try {
          await PresenceService.connectUser(user.uid);
          logger.debug('🔥 AUTH: User connected to presence service');
        } catch (error) {
          logger.error('🔥 AUTH: Failed to connect to presence service:', error);
        }
        
        // Register device for push notifications
        try {
          await MessageNotificationService.registerDeviceToken(user.uid);
          logger.debug('🔥 AUTH: Device token registered for push notifications');
        } catch (error) {
          logger.error('🔥 AUTH: Failed to register device token:', error);
        }
        
        // Store auth token securely
        try {
          const token = await user.getIdToken();
          await secureStorage.setItem('auth_token', token);
          logger.debug('🔥 AUTH: Stored auth token securely');
        } catch (tokenError) {
          logger.warn('🔥 AUTH: Failed to store auth token:', tokenError);
        }
        
        // Initialize Firebase structures for user (wallet, profile, etc.) - SAFE VERSION
        try {
          const initializedUserId = await initializeUserSafely();
          if (initializedUserId) {
            logger.info('🔥 AUTH: User bootstrap completed successfully');
            logger.debug('🔥 AUTH: Bootstrap finished for user:', initializedUserId);
            
            // Register push token after user bootstrap
            try {
              const pushToken = await registerPushTokenSafely(user.uid);
              if (pushToken) {
                logger.debug('🔥 AUTH: Push token registered successfully');
              } else {
                logger.debug('🔥 AUTH: Push token registration skipped (not supported/failed)');
              }
            } catch (pushError) {
              logger.warn('🔥 AUTH: Push token registration warning:', pushError);
              // Don't block auth flow, just log the warning
            }
          } else {
            logger.debug('🔥 AUTH: User bootstrap skipped (offline/permission issues)');
          }
        } catch (initError) {
          logger.warn('🔥 AUTH: User bootstrap warning:', initError);
          // Don't block auth flow, just log the warning
        }
       
        setIsInitializing(false);
        
        // User signed in - initialize notifications
        try {
          if (notificationService && typeof notificationService.initialize === 'function') {
            await notificationService.initialize();
          } else {
            logger.warn('⚠️ notificationService.initialize is not available');
          }
        } catch (error) {
          logger.error('❌ Error initializing notifications:', error);
        }
      } else {
        logger.debug('🔥 AUTH: User signed out, calling onUserSignOut');
        // User signed out - clear notification token
        try {
          if (notificationService && typeof notificationService.onUserSignOut === 'function') {
            await notificationService.onUserSignOut();
          } else {
            logger.warn('⚠️ notificationService.onUserSignOut is not available');
          }
        } catch (error) {
          logger.error('❌ Error calling onUserSignOut:', error);
        }
      }
      
      if (onReady) {
        onReady();
      }
    });

    return unsubscribe;
  }, [onReady]);

  // Update activity timestamp when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        const now = Date.now();
        await AsyncStorage.setItem('lastActivityTime', now.toString());
        logger.debug('✅ Activity updated on app resume:', new Date(now).toISOString());
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clean up typing indicators when app goes to background
        PresenceService.forceStopAllTyping();
        logger.debug('🧹 Cleaned up typing indicators on app background');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  const signIn = async () => {
    try {
      // Create a test user with proper structure
      const testUser = {
        uid: 'test-user-' + Date.now(),
        email: 'test@guild.app',
        displayName: 'Test User',
        emailVerified: false,
        isAnonymous: true,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        },
        phoneNumber: null,
        photoURL: null,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        providerId: 'anonymous',
        accessToken: 'test-token-' + Date.now(),
        stsTokenManager: {
          refreshToken: '',
          accessToken: 'test-token',
          expirationTime: Date.now() + 3600000
        }
      } as any;

      // Mock Firebase Auth methods
      testUser.getIdToken = async () => testUser.accessToken;
      testUser.getIdTokenResult = async () => ({
        token: testUser.accessToken,
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        signInProvider: 'anonymous',
        signInSecondFactor: null,
        claims: {}
      });
      testUser.reload = async () => {};
      testUser.toJSON = () => ({});
      testUser.delete = async () => {};

      setUser(testUser);
      logger.info('✅ Test user created successfully');
    } catch (error) {
      logger.error('❌ Error creating test user:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) {
      return;
    }
    try {
      const result = await signInWithEmailAndPassword(auth as any, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    logger.debug('🔥 SIGNUP: Starting signUpWithEmail', { email, displayName });
    if (!auth) {
      logger.warn('🔥 SIGNUP: No auth object available');
      return;
    }
    try {
      logger.debug('🔥 SIGNUP: Creating user with Firebase Auth');
      
      // Firebase Auth automatically handles email uniqueness
      // If email exists, createUserWithEmailAndPassword will throw 'auth/email-already-in-use'
      const result = await createUserWithEmailAndPassword(auth as any, email, password);
      logger.info('🔥 SIGNUP: User created successfully', { uid: result.user.uid });
      
      // Update display name if provided
      if (displayName && result.user) {
        logger.debug('🔥 SIGNUP: Updating display name');
        await updateProfile(result.user, { displayName });
      }

      // Create user document in Firestore
      if (result.user) {
        logger.debug('🔥 SIGNUP: Creating user document in Firestore');
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          displayName: displayName || '',
          status: 'active',
          verificationStatus: 'unverified',
          rank: 'G',
          guild: null,
          guildRole: null,
          completedJobs: 0,
          earnings: 0,
          isOnline: true,
          accountCommitted: true, // Account is committed after creation
          accountCommittedAt: serverTimestamp(), // Timestamp of commitment
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        logger.info('✅ User document created in Firestore:', result.user.uid);

        // Create wallet document for new user
        logger.debug('🔥 SIGNUP: Creating wallet document in Firestore');
        await setDoc(doc(db, 'wallets', result.user.uid), {
          userId: result.user.uid,
          balance: 0,
          pendingEarnings: 0,
          totalEarnings: 0,
          totalWithdrawals: 0,
          currency: 'QAR',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        logger.info('✅ Wallet document created in Firestore:', result.user.uid);

        // Create welcome chat with admin
        logger.debug('🔥 SIGNUP: Creating welcome chat with admin');
        try {
          const AdminChatService = (await import('../services/AdminChatService')).default;
          await AdminChatService.createWelcomeChat(
            result.user.uid,
            displayName || result.user.email?.split('@')[0] || 'User'
          );
          logger.info('✅ Welcome chat created successfully');
        } catch (chatError) {
          logger.warn('⚠️ Failed to create welcome chat (non-critical):', chatError);
          // Don't throw - chat creation failure shouldn't block signup
        }
      }
      
      logger.info('🔥 SIGNUP: signUpWithEmail completed successfully');
    } catch (error) {
      logger.error('🔥 SIGNUP ERROR:', error);
      logger.error('🔥 SIGNUP ERROR DETAILS:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      // If Firebase user was created but Firestore failed, we should still consider it a success
      // The user can complete their profile later
      if (error?.code && error.code.includes('firestore')) {
        logger.warn('🔥 SIGNUP: Firebase Auth succeeded but Firestore failed - continuing anyway');
        return; // Don't throw error for Firestore issues
      }
      
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) {
      return;
    }
    try {
      logger.debug('🔥 AUTH: Starting signOut process');
      setIsInitializing(true);
      
      // Stop global chat notification listener
      GlobalChatNotificationService.stopListening();
      
      // Clean up presence service (typing indicators, etc.)
      PresenceService.cleanup();
      
      // Disconnect from presence service
      try {
        await PresenceService.disconnectUser();
        logger.debug('🔥 AUTH: User disconnected from presence service');
      } catch (error) {
        logger.error('🔥 AUTH: Failed to disconnect from presence service:', error);
      }
      
      // Clear user state immediately
      setUser(null);
      setLoading(false);
      
      // Clear any cached data from both secure and regular storage
      try {
        // Clear auth tokens first
        await authTokenService.clearToken();
        logger.debug('🔥 AUTH: Cleared auth tokens');
        
        // Clear secure storage (tokens, sensitive data)
        await secureStorage.clear();
        logger.debug('🔥 AUTH: Cleared secure storage');
        
        // Clear regular storage (non-sensitive data)
        await AsyncStorage.multiRemove([
          'userProfile',
          'userPreferences',
          'cachedUserData',
          'appSettings'
        ]);
        logger.debug('🔥 AUTH: Cleared regular cached data');
      } catch (storageError) {
        logger.warn('🔥 AUTH: Error clearing storage:', storageError);
      }
      
      // Clean up Firebase SMS service
      firebaseSMSService.cleanup();
      
      // Sign out from Firebase
      await firebaseSignOut(auth as any);
      logger.info('🔥 AUTH: Firebase signOut completed');
      
      // Force navigation to auth screen
      const { router } = await import('expo-router');
      router.replace('/(auth)/splash');
      logger.debug('🔥 AUTH: Navigation to splash completed');
     
      setIsInitializing(false);
      
    } catch (error) {
      logger.error('🔥 AUTH: SignOut error:', error);
      setIsInitializing(false);
      throw error;
    }
  };

  const sendPhoneVerification = async (phoneNumber: string): Promise<string> => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    try {
      logger.debug(`📱 Attempting to send SMS to: ${phoneNumber}`);
      
      // Log environment info for debugging
      logEnvironmentInfo();
      
      // Use the new Firebase SMS service
      const result = await firebaseSMSService.sendVerificationCode(phoneNumber);
      
      logger.info(`✅ SMS sent successfully via ${result.method}`);
      logger.debug(`📱 Verification ID: ${result.verificationId.substring(0, 20)}...`);
      
      return result.verificationId;
    } catch (error: any) {
      logger.error('📱 Phone verification error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many SMS requests. Please try again later.');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('SMS quota exceeded. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(error.message || 'Failed to send SMS. Please try again.');
      }
    }
  };

  const verifyPhoneCode = async (verificationId: string, code: string): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    try {
      logger.debug(`📱 Verifying code with ID ${verificationId.substring(0, 20)}...`);
      
      // Use the new Firebase SMS service
      await firebaseSMSService.verifyCode(verificationId, code);
      
      logger.info('✅ Phone verification successful!');
    } catch (error: any) {
      logger.error('📱 Phone code verification error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid verification code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('Verification code has expired. Please request a new one.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else {
        throw new Error(error.message || 'Verification failed. Please try again.');
      }
    }
  };


  const value = {
    user,
    loading,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    sendPhoneVerification,
    verifyPhoneCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

