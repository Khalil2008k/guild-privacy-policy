import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

  // Load profile from storage on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const storedProfile = await AsyncStorage.getItem('userProfile');
      
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile({ ...defaultProfile, ...parsedProfile });
        console.log('👤 UserProfile: Loaded profile from storage');
      } else {
        console.log('👤 UserProfile: No stored profile found, using defaults');
      }
    } catch (error) {
      console.error('👤 UserProfile: Error loading profile:', error);
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

          console.log('✅ Profile saved to Firestore for admin portal');
        }
      } catch (firestoreError) {
        console.warn('⚠️ Could not save to Firestore:', firestoreError);
        // Continue with local storage even if Firestore fails
      }
      
      console.log('👤 UserProfile: Profile updated:', {
        isComplete,
        hasProfileImage: !!updatedProfile.profileImage,
        hasIdImages: !!(updatedProfile.idFrontImage && updatedProfile.idBackImage),
        faceDetected: updatedProfile.faceDetected,
      });
    } catch (error) {
      console.error('👤 UserProfile: Error updating profile:', error);
    }
  };

  const clearProfile = async () => {
    try {
      setProfile(defaultProfile);
      await AsyncStorage.removeItem('userProfile');
      console.log('👤 UserProfile: Profile cleared');
    } catch (error) {
      console.error('👤 UserProfile: Error clearing profile:', error);
    }
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





