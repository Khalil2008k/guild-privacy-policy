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
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier
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
      console.log('🔥 AUTH STATE CHANGED:', { 
        hasUser: !!user, 
        userId: user?.uid, 
        email: user?.email,
        loading 
      });
      
      // Check for 72-hour inactivity auto-logout
      if (user) {
        try {
          const lastActivityStr = await AsyncStorage.getItem('lastActivityTime');
          const now = Date.now();
          
          if (lastActivityStr) {
            const lastActivity = parseInt(lastActivityStr, 10);
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
            
            if (hoursSinceActivity >= 72) {
              console.log('🔒 AUTO-LOGOUT: 72 hours of inactivity detected');
              await firebaseSignOut(auth as any);
              await AsyncStorage.removeItem('lastActivityTime');
              setUser(null);
              setLoading(false);
              if (onReady) onReady();
              return;
            }
          }
          
          // Update last activity time
          await AsyncStorage.setItem('lastActivityTime', now.toString());
          console.log('✅ Last activity time updated:', new Date(now).toISOString());
        } catch (error) {
          console.error('❌ Error checking activity time:', error);
        }
      } else {
        // User signed out, clear activity time
        await AsyncStorage.removeItem('lastActivityTime');
      }
      
      setUser(user);
      setLoading(false);
      
      // Handle notification token and secure storage when user signs in/out
      if (user) {
        console.log('🔥 AUTH: User signed in, calling onUserSignIn');
        
        // Start global chat notification listener
        GlobalChatNotificationService.startListening(user.uid);
        
        // Connect user to presence service
        try {
          await PresenceService.connectUser(user.uid);
          console.log('🔥 AUTH: User connected to presence service');
        } catch (error) {
          console.error('🔥 AUTH: Failed to connect to presence service:', error);
        }
        
        // Register device for push notifications
        try {
          await MessageNotificationService.registerDeviceToken(user.uid);
          console.log('🔥 AUTH: Device token registered for push notifications');
        } catch (error) {
          console.error('🔥 AUTH: Failed to register device token:', error);
        }
        
        // Store auth token securely
        try {
          const token = await user.getIdToken();
          await secureStorage.setItem('auth_token', token);
          console.log('🔥 AUTH: Stored auth token securely');
        } catch (tokenError) {
          console.warn('🔥 AUTH: Failed to store auth token:', tokenError);
        }
        
        // Initialize Firebase structures for user (wallet, profile, etc.) - SAFE VERSION
        try {
          const initializedUserId = await initializeUserSafely();
          if (initializedUserId) {
            console.log('🔥 AUTH: User bootstrap completed successfully');
            
            // Register push token after user bootstrap
            try {
              const pushToken = await registerPushTokenSafely(user.uid);
              if (pushToken) {
                console.log('🔥 AUTH: Push token registered successfully');
              } else {
                console.log('🔥 AUTH: Push token registration skipped (not supported/failed)');
              }
            } catch (pushError) {
              console.warn('🔥 AUTH: Push token registration warning:', pushError);
              // Don't block auth flow, just log the warning
            }
          } else {
            console.log('🔥 AUTH: User bootstrap skipped (offline/permission issues)');
          }
        } catch (initError) {
          console.warn('🔥 AUTH: User bootstrap warning:', initError);
          // Don't block auth flow, just log the warning
        }
        
        // User signed in - initialize notifications
        try {
          if (notificationService && typeof notificationService.initialize === 'function') {
            await notificationService.initialize();
          } else {
            console.warn('⚠️ notificationService.initialize is not available');
          }
        } catch (error) {
          console.error('❌ Error initializing notifications:', error);
        }
      } else {
        console.log('🔥 AUTH: User signed out, calling onUserSignOut');
        // User signed out - clear notification token
        try {
          if (notificationService && typeof notificationService.onUserSignOut === 'function') {
            await notificationService.onUserSignOut();
          } else {
            console.warn('⚠️ notificationService.onUserSignOut is not available');
          }
        } catch (error) {
          console.error('❌ Error calling onUserSignOut:', error);
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
        console.log('✅ Activity updated on app resume:', new Date(now).toISOString());
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clean up typing indicators when app goes to background
        PresenceService.forceStopAllTyping();
        console.log('🧹 Cleaned up typing indicators on app background');
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
      console.log('✅ Test user created successfully');
    } catch (error) {
      console.error('❌ Error creating test user:', error);
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
    console.log('🔥 SIGNUP: Starting signUpWithEmail', { email, displayName });
    if (!auth) {
      console.log('🔥 SIGNUP: No auth object available');
      return;
    }
    try {
      console.log('🔥 SIGNUP: Creating user with Firebase Auth');
      
      // Firebase Auth automatically handles email uniqueness
      // If email exists, createUserWithEmailAndPassword will throw 'auth/email-already-in-use'
      const result = await createUserWithEmailAndPassword(auth as any, email, password);
      console.log('🔥 SIGNUP: User created successfully', { uid: result.user.uid });
      
      // Update display name if provided
      if (displayName && result.user) {
        console.log('🔥 SIGNUP: Updating display name');
        await updateProfile(result.user, { displayName });
      }

      // Create user document in Firestore
      if (result.user) {
        console.log('🔥 SIGNUP: Creating user document in Firestore');
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

        console.log('✅ User document created in Firestore:', result.user.uid);

        // Create wallet document for new user
        console.log('🔥 SIGNUP: Creating wallet document in Firestore');
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

        console.log('✅ Wallet document created in Firestore:', result.user.uid);

        // Create welcome chat with admin
        console.log('🔥 SIGNUP: Creating welcome chat with admin');
        try {
          const AdminChatService = (await import('../services/AdminChatService')).default;
          await AdminChatService.createWelcomeChat(
            result.user.uid,
            displayName || result.user.email?.split('@')[0] || 'User'
          );
          console.log('✅ Welcome chat created successfully');
        } catch (chatError) {
          console.error('⚠️ Failed to create welcome chat (non-critical):', chatError);
          // Don't throw - chat creation failure shouldn't block signup
        }
      }
      
      console.log('🔥 SIGNUP: signUpWithEmail completed successfully');
    } catch (error) {
      console.error('🔥 SIGNUP ERROR:', error);
      console.error('🔥 SIGNUP ERROR DETAILS:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      // If Firebase user was created but Firestore failed, we should still consider it a success
      // The user can complete their profile later
      if (error?.code && error.code.includes('firestore')) {
        console.log('🔥 SIGNUP: Firebase Auth succeeded but Firestore failed - continuing anyway');
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
      console.log('🔥 AUTH: Starting signOut process');
      
      // Stop global chat notification listener
      GlobalChatNotificationService.stopListening();
      
      // Clean up presence service (typing indicators, etc.)
      PresenceService.cleanup();
      
      // Disconnect from presence service
      try {
        await PresenceService.disconnectUser();
        console.log('🔥 AUTH: User disconnected from presence service');
      } catch (error) {
        console.error('🔥 AUTH: Failed to disconnect from presence service:', error);
      }
      
      // Clear user state immediately
      setUser(null);
      setLoading(false);
      
      // Clear any cached data from both secure and regular storage
      try {
        // Clear auth tokens first
        await authTokenService.clearToken();
        console.log('🔥 AUTH: Cleared auth tokens');
        
        // Clear secure storage (tokens, sensitive data)
        await secureStorage.clear();
        console.log('🔥 AUTH: Cleared secure storage');
        
        // Clear regular storage (non-sensitive data)
        await AsyncStorage.multiRemove([
          'userProfile',
          'userPreferences',
          'cachedUserData',
          'appSettings'
        ]);
        console.log('🔥 AUTH: Cleared regular cached data');
      } catch (storageError) {
        console.warn('🔥 AUTH: Error clearing storage:', storageError);
      }
      
      // Sign out from Firebase
      await firebaseSignOut(auth as any);
      console.log('🔥 AUTH: Firebase signOut completed');
      
      // Force navigation to auth screen
      const { router } = await import('expo-router');
      router.replace('/(auth)/splash');
      console.log('🔥 AUTH: Navigation to splash completed');
      
    } catch (error) {
      console.error('🔥 AUTH: SignOut error:', error);
      throw error;
    }
  };

  const sendPhoneVerification = async (phoneNumber: string): Promise<string> => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    try {
      console.log(`📱 Attempting to send SMS to: ${phoneNumber}`);
      
      // Check if we're in React Native environment
      const isReactNative = typeof window === 'undefined' || !window.document;
      
      if (isReactNative) {
        // React Native implementation
        console.log('📱 React Native environment detected');
        
        try {
          // Use @react-native-firebase/auth for real SMS delivery
          const rnFirebaseAuth = require('@react-native-firebase/auth').default;
          console.log('📱 Using React Native Firebase for REAL SMS delivery');
          console.log('📱 Sending SMS to:', phoneNumber);
          
          const confirmation = await rnFirebaseAuth().signInWithPhoneNumber(phoneNumber);
          console.log('✅ Real SMS sent via Firebase! Check your phone.');
          
          // Store phone number for later
          await AsyncStorage.setItem('pending_phone_verification', phoneNumber);
          
          return confirmation.verificationId;
        } catch (firebaseError: any) {
          console.log('📱 React Native Firebase error:', firebaseError.message);
          console.log('📱 Falling back to Backend SMS API');
          
          // Use our backend SMS API
          try {
            console.log('📱 Calling backend SMS API...');
            const response = await fetch(`${config.apiUrl}/v1/auth/sms/send-verification-code`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phoneNumber: phoneNumber,
                userId: user?.uid || `temp_user_${Date.now()}`
              })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
              console.log('✅ SMS sent via backend API');
              
              // Store phone number for verification
              await AsyncStorage.setItem('pending_phone_verification', phoneNumber);
              
              // Handle demo mode
              if (result.demoMode && result.demoCode) {
                console.log('🧪 DEMO MODE: Use code:', result.demoCode);
                // Store demo code for easy access
                global.demoVerificationCode = result.demoCode;
              }
              
              return `backend_verification_${Date.now()}`;
            } else {
              console.log('❌ Backend SMS API failed:', result.error);
              throw new Error(result.error || 'Backend SMS failed');
            }
          } catch (backendError) {
            console.log('📱 Backend SMS API not available, using simulation');
            console.error('Backend error:', backendError);
            // Final fallback to simulation
            await new Promise(resolve => setTimeout(resolve, 1500));
            return `rn_verification_${Date.now()}`;
          }
        }
      } else {
        // Web implementation with reCAPTCHA
        console.log('📱 Web environment detected');
        
        try {
          const provider = new PhoneAuthProvider(auth as any);
          const { RecaptchaVerifier } = await import('firebase/auth');
          
          // Create reCAPTCHA verifier
          const recaptchaVerifier = new RecaptchaVerifier(auth as any, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              console.log('📱 reCAPTCHA solved');
            },
            'expired-callback': () => {
              console.log('📱 reCAPTCHA expired');
            }
          });
          
          console.log('📱 Sending SMS via Firebase Web SDK');
          const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
          console.log('📱 SMS sent successfully, verification ID:', verificationId);
          
          return verificationId;
        } catch (webError) {
          console.error('📱 Web SMS error:', webError);
          throw new Error(`SMS sending failed: ${webError.message}`);
        }
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      throw error;
    }
  };

  const verifyPhoneCode = async (verificationId: string, code: string): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    try {
      console.log(`📱 Verifying code with ID ${verificationId}`);
      
      // Handle backend verification
      if (verificationId.startsWith('backend_verification_')) {
        console.log('📱 Using backend SMS verification');
        
        try {
          // Get the stored phone number
          const storedPhoneNumber = await AsyncStorage.getItem('pending_phone_verification');
          console.log('📱 Stored phone number for verification:', storedPhoneNumber);
          
          if (!storedPhoneNumber) {
            throw new Error('Phone number not found for verification');
          }
          
          const requestBody = {
            phoneNumber: storedPhoneNumber,
            code: code
          };
          console.log('📱 Sending verification request:', requestBody);
          console.log('📱 API URL:', `${config.apiUrl}/auth/sms/verify-phone-code`);
          
          const response = await fetch(`${config.apiUrl}/auth/sms/verify-phone-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log('📱 Response status:', response.status);
          console.log('📱 Response ok:', response.ok);
          
          const result = await response.json();
          console.log('📱 Response body:', result);
          
          if (response.ok && result.success) {
            console.log('✅ Backend SMS verification successful!');
            
            // Clean up stored phone number
            await AsyncStorage.removeItem('pending_phone_verification');
            
            // Store verification success in AsyncStorage for the app to handle
            await AsyncStorage.setItem('phone_verification_success', JSON.stringify({
              phoneNumber: result.phoneNumber,
              verifiedAt: new Date().toISOString(),
              success: true
            }));
            
            console.log('📱 Verification process completed successfully - phone verified!');
            console.log('📱 Phone verification stored for app to handle sign-in flow');
            return;
          } else {
            console.log('❌ Backend SMS verification failed:', result.error || result.message);
            throw new Error(result.error || result.message || 'Verification failed');
          }
        } catch (backendError) {
          console.error('Backend verification error:', backendError);
          console.error('Error details:', {
            name: backendError.name,
            message: backendError.message,
            stack: backendError.stack
          });
          throw new Error(`Backend verification failed: ${backendError.message}`);
        }
      }
      
      // ✅ SECURITY FIX: Only allow simulation in development with proper validation
      if (verificationId.startsWith('rn_verification_')) {
        // Only allow simulation in development environment
        if (__DEV__ && process.env.NODE_ENV === 'development') {
          console.log('📱 DEV SIMULATION: React Native verification');
          
          // Simulate verification delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // ✅ SECURITY: Validate code format and use specific test codes
          if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            throw new Error('Invalid verification code format');
          }
          
          // ✅ SECURITY: Only accept specific test codes in development
          const validTestCodes = ['123456', '000000', '999999'];
          if (!validTestCodes.includes(code)) {
            throw new Error('Invalid verification code');
          }
          
          console.log('📱 DEV SIMULATION: Phone verification successful');
          return;
        } else {
          // ✅ SECURITY: Block simulation in production
          throw new Error('Phone verification simulation not allowed in production');
        }
      }
      
      // Real Firebase verification
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth as any, credential);
      
      console.log('📱 REAL VERIFICATION: Phone verification successful!');
    } catch (error) {
      console.error('Phone code verification error:', error);
      throw error;
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

