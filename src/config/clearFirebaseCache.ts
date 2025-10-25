/**
 * 🔥 CRITICAL: This file MUST be imported BEFORE firebase.tsx
 * 
 * This ensures the Firebase Auth cache is cleared from AsyncStorage
 * BEFORE Firebase is initialized, preventing the app from using
 * tokens from the old Firebase project (guild-4f46b).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

let cacheCleared = false;

export const ensureFirebaseCacheCleared = async (): Promise<void> => {
  if (cacheCleared) {
    console.log('✅ Firebase cache already cleared in this session');
    return;
  }

  try {
    console.log('🔥🔥🔥 NUCLEAR OPTION: CLEARING ALL FIREBASE AUTH CACHE...');
    
    // Step 1: Try to sign out any existing Firebase Auth session
    try {
      const { getAuth, signOut } = await import('firebase/auth');
      const { getApp } = await import('firebase/app');
      
      try {
        const app = getApp();
        const auth = getAuth(app);
        if (auth.currentUser) {
          console.log('🔥 Found existing Firebase user, signing out...');
          await signOut(auth);
          console.log('✅ Firebase user signed out');
        }
      } catch (e) {
        // App not initialized yet, that's fine
        console.log('ℹ️ No existing Firebase app to sign out from');
      }
    } catch (e) {
      console.log('ℹ️ Firebase not yet loaded, skipping sign out');
    }
    
    // Step 2: Clear ALL AsyncStorage keys related to Firebase
    console.log('🔥 Clearing AsyncStorage...');
    const allKeys = await AsyncStorage.getAllKeys();
    const firebaseKeys = allKeys.filter(key => 
      key.startsWith('firebase:') || 
      key.includes('auth') || 
      key.includes('Auth') ||
      key.includes('Firebase') ||
      key.includes('guild_auth') ||
      key.includes('user') ||
      key.includes('token')
    );
    
    if (firebaseKeys.length > 0) {
      console.log('🔥 Found keys to clear:', firebaseKeys);
      await AsyncStorage.multiRemove(firebaseKeys);
      console.log('✅ AsyncStorage cleared!');
    } else {
      console.log('✅ No Firebase keys found in AsyncStorage');
    }
    
    // Step 3: Clear any IndexedDB/WebSQL (for web compatibility)
    if (typeof indexedDB !== 'undefined') {
      try {
        console.log('🔥 Clearing IndexedDB...');
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && (db.name.includes('firebase') || db.name.includes('firebaseLocalStorage'))) {
            console.log(`🔥 Deleting database: ${db.name}`);
            indexedDB.deleteDatabase(db.name);
          }
        }
        console.log('✅ IndexedDB cleared!');
      } catch (e) {
        console.log('ℹ️ IndexedDB not available or already cleared');
      }
    }
    
    console.log('✅✅✅ FIREBASE CACHE COMPLETELY CLEARED!');
    cacheCleared = true;
  } catch (error) {
    console.error('❌ Error clearing Firebase Auth cache:', error);
    throw error;
  }
};

// Export a flag to check if cache was cleared
export const isCacheCleared = () => cacheCleared;


