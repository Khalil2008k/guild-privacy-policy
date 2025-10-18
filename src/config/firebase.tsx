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

if (Platform.OS === 'web') {
  // Web initialization
  try {
    auth = getAuth(app);
  } catch (error) {
    auth = null;
  }
} else {
  // React Native initialization with proper AsyncStorage persistence
  try {
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    try {
      auth = getAuth(app);
    } catch (fallbackError) {
      auth = getAuth();
    }
  }
}

export { app, auth, db, storage };

