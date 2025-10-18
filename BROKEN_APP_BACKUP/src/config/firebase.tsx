import { initializeApp, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required Firebase environment variables: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
};

const hasValidConfig = validateFirebaseConfig();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || (__DEV__ ? "demo-api-key" : undefined),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || (__DEV__ ? "demo.firebaseapp.com" : undefined),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || (__DEV__ ? "demo-project" : undefined),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || (__DEV__ ? "demo-project.appspot.com" : undefined),
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || (__DEV__ ? "123456789" : undefined),
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || (__DEV__ ? "1:123456789:web:abcdef123456" : undefined)
};

// Ensure no undefined values in production
if (process.env.NODE_ENV === 'production') {
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Firebase configuration error: ${key} is not defined in production`);
    }
  });
}

console.log(`🔥 Firebase: Initializing app on ${Platform.OS}...`);
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log(`🔥 Firebase: App initialized successfully on ${Platform.OS}`);
} catch (error) {
  // App might already be initialized
  console.log('🔥 Firebase: App already initialized, getting existing app');
  app = getApp();
}

// Initialize Firestore
console.log(`🔥 Firebase: Initializing Firestore on ${Platform.OS}...`);
const db = getFirestore(app);
console.log(`🔥 Firebase: Firestore initialized successfully on ${Platform.OS}`);

// Initialize auth with platform-specific persistence
console.log(`🔥 Firebase: Platform detected as "${Platform.OS}"`);
let auth;

if (Platform.OS === 'web') {
  // Web initialization
  try {
    console.log('🔥 Firebase: Using web auth initialization...');
    auth = getAuth(app);
    console.log('🔥 Firebase: Web auth initialized successfully');
  } catch (error) {
    console.warn('🔥 Firebase: Web auth error:', error);
    auth = null;
  }
} else {
  // React Native initialization with proper AsyncStorage persistence
  try {
    console.log('🔥 Firebase: Using React Native auth initialization with AsyncStorage...');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('🔥 Firebase: React Native auth initialized successfully');
  } catch (error) {
    console.warn('🔥 Firebase: Auth initialization error:', error);
    console.log('🔥 Firebase: Attempting fallback auth initialization...');
    try {
      auth = getAuth(app);
      console.log('🔥 Firebase: Fallback auth initialized successfully');
    } catch (fallbackError) {
      console.warn('🔥 Firebase: Fallback auth error:', fallbackError);
      console.log('🔥 Firebase: Using default auth as last resort...');
      auth = getAuth();
    }
  }
}

export { app, auth, db };

