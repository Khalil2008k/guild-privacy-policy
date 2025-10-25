import { initializeApp, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeEnvironment, config } from './environment';

// Initialize environment configuration
initializeEnvironment();

// Use Firebase config from environment
const firebaseConfig = config.firebaseConfig;

// Note: Firebase cache clearing is now handled in _layout.tsx
// before this module is imported, ensuring clean initialization

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // App might already be initialized
  app = getApp();
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize auth with platform-specific persistence
let auth;

try {
  if (Platform.OS === 'web') {
    // Web initialization
    auth = getAuth(app);
  } else {
    // React Native initialization with proper AsyncStorage persistence
    try {
      const { getReactNativePersistence } = require('firebase/auth');
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } catch (error) {
      // Fallback to default auth
      auth = getAuth(app);
    }
  }
} catch (error) {
  console.warn('⚠️ Firebase Auth initialization failed, using fallback:', error);
  try {
    auth = getAuth();
  } catch (fallbackError) {
    console.error('❌ Firebase Auth fallback failed:', fallbackError);
    auth = null;
  }
}

export { app, auth, db, storage };

