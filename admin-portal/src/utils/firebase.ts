import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration - MUST be set via environment variables
// SECURITY: Never hardcode these values in production
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate that all required config values are present
// In development, provide fallback to actual values for easier setup
const isDevelopment = process.env.NODE_ENV === 'development';

if (!firebaseConfig.apiKey && !isDevelopment) {
  console.error('❌ Missing required Firebase configuration');
  console.error('Please ensure all REACT_APP_FIREBASE_* environment variables are set.');
  throw new Error('Firebase configuration incomplete. Check environment variables.');
}

// Use fallback values in development if env vars are missing
if (isDevelopment && !firebaseConfig.apiKey) {
  console.warn('⚠️ Using fallback Firebase configuration for development');
  console.warn('⚠️ For production, set environment variables in .env.local');
  
  // Fallback configuration for development
  firebaseConfig.apiKey = "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w";
  firebaseConfig.authDomain = "guild-dev-7f06e.firebaseapp.com";
  firebaseConfig.projectId = "guild-dev-7f06e";
  firebaseConfig.storageBucket = "guild-dev-7f06e.firebasestorage.app";
  firebaseConfig.messagingSenderId = "654144998705";
  firebaseConfig.appId = "1:654144998705:web:9c49a52bd633a436853410";
  firebaseConfig.measurementId = "G-MQX879CXFY";
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export app for other services that need it
export { app };

// Guild App Firestore collections (matching main app structure)
export const collections = {
  users: 'users',
  userProfiles: 'userProfiles',
  guilds: 'guilds',
  jobs: 'jobs',
  offers: 'offers',
  escrow: 'escrow',
  transactions: 'transactions',
  wallets: 'wallets',
  reports: 'reports',
  notifications: 'notifications',
  adminLogs: 'adminLogs',
  systemSettings: 'systemSettings',
};

