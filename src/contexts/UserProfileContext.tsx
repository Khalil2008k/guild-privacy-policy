import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

interface UserProfile {
  fullName: string;
  firstName?: string;
  lastName?: string;
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
  aiProcessed: boolean;
  completedAt: string | null;
  isProfileComplete: boolean;
  isVerified?: boolean;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  isLoading: boolean;
  getFirstName: () => string;
}

const defaultProfile: UserProfile = {
  fullName: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  dateOfBirth: '',
  bio: '',
  idNumber: '',
  profileImage: null,
  idFrontImage: null,
  idBackImage: null,
  location: null,
  skills: [],
  faceDetected: false,
  aiProcessed: false,
  completedAt: null,
  isProfileComplete: false,
  isVerified: false,
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from storage on mount and when user changes
  useEffect(() => {
    loadProfile();
  }, [auth?.currentUser?.uid]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('👤 UserProfile: Auth state changed:', user ? user.uid : 'No user');
      if (user) {
        loadProfile();
      } else {
        setProfile(defaultProfile);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async () => {
    // COMMENT: PRIORITY 1 - Replace console statements with logger
    try {
      setIsLoading(true);
      logger.debug('🔄 UserProfile: Starting profile load...');
      logger.debug('🔄 UserProfile: Auth current user:', auth?.currentUser?.uid || 'No user');
      
      // First try to load from Firebase if user is authenticated
      if (auth?.currentUser) {
        try {
          logger.debug('🔄 UserProfile: Attempting Firebase load...');
          const userProfilesRef = doc(db, 'userProfiles', auth.currentUser.uid);
          const userProfilesSnap = await getDoc(userProfilesRef);
          
          logger.debug('🔄 UserProfile: Firebase query result:', userProfilesSnap.exists());
          
          if (userProfilesSnap.exists()) {
            const firebaseProfile = userProfilesSnap.data();
            const profileData = { ...defaultProfile, ...firebaseProfile };
            setProfile(profileData);
            
            // Also save to local storage for offline access
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
            logger.debug('✅ UserProfile: Loaded profile from Firebase:', {
              fullName: profileData.fullName,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              idNumber: profileData.idNumber,
              profileImage: profileData.profileImage ? 'Has image' : 'No image',
              userId: auth.currentUser.uid
            });
            return;
          } else {
            logger.debug('❌ UserProfile: No Firebase profile found for user:', auth.currentUser.uid);
          }
        } catch (firebaseError) {
          logger.error('❌ UserProfile: Firebase load failed:', firebaseError);
        }
      } else {
        logger.debug('❌ UserProfile: No authenticated user');
      }
      
      // Fallback to local storage
      logger.debug('🔄 UserProfile: Trying local storage fallback...');
      const storedProfile = await AsyncStorage.getItem('userProfile');
      
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile({ ...defaultProfile, ...parsedProfile });
        logger.debug('✅ UserProfile: Loaded profile from local storage');
      } else {
        logger.debug('❌ UserProfile: No stored profile found, using defaults');
        setProfile(defaultProfile);
      }
    } catch (error) {
      logger.error('❌ UserProfile: Error loading profile:', error);
      setProfile(defaultProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = { ...profile, ...updates };
      
      // Check if profile is complete
      const isComplete = !!(
        updatedProfile.fullName &&
        updatedProfile.phoneNumber &&
        updatedProfile.idNumber &&
        updatedProfile.profileImage &&
        updatedProfile.idFrontImage &&
        updatedProfile.idBackImage &&
        updatedProfile.faceDetected
      );
      
      updatedProfile.isProfileComplete = isComplete;
      
      setProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      // Save to Firebase Firestore for admin portal access
      try {
        if (auth?.currentUser) {
          await setDoc(doc(db, 'userProfiles', auth.currentUser.uid), {
            ...updatedProfile,
            userId: auth.currentUser.uid,
            updatedAt: serverTimestamp(),
          }, { merge: true });

          // COMMENT: PRIORITY 1 - Replace console.log with logger
          logger.debug('✅ Profile saved to Firestore for admin portal');
        }
      } catch (firestoreError) {
        // COMMENT: PRIORITY 1 - Replace console.warn with logger
        logger.warn('⚠️ Could not save to Firestore:', firestoreError);
        // Continue with local storage even if Firestore fails
      }
      
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('👤 UserProfile: Profile updated:', {
        isComplete,
        hasProfileImage: !!updatedProfile.profileImage,
        hasIdImages: !!(updatedProfile.idFrontImage && updatedProfile.idBackImage),
        faceDetected: updatedProfile.faceDetected,
      });
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('👤 UserProfile: Error updating profile:', error);
    }
  };

  const clearProfile = async () => {
    // COMMENT: PRIORITY 1 - Replace console statements with logger
    try {
      setProfile(defaultProfile);
      await AsyncStorage.removeItem('userProfile');
      logger.debug('👤 UserProfile: Profile cleared');
    } catch (error) {
      logger.error('👤 UserProfile: Error clearing profile:', error);
    }
  };

  const reloadProfile = async () => {
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('🔄 UserProfile: Manual reload triggered');
    // Clear local storage first to force Firebase reload
    await AsyncStorage.removeItem('userProfile');
    await loadProfile();
  };

  const getFirstName = (): string => {
    if (!profile.fullName) return '';
    const nameParts = profile.fullName.trim().split(' ');
    return nameParts[0] || '';
  };

  const value: UserProfileContextType = {
    profile,
    updateProfile,
    clearProfile,
    reloadProfile,
    isLoading,
    getFirstName,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export default UserProfileContext;





