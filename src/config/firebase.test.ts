// Firebase configuration for testing with emulators
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "test-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "test.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "test-project",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "test.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators in development/test environment
if (__DEV__ || process.env.NODE_ENV === 'test') {
  // Determine the host based on platform
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  
  try {
    // Connect Auth emulator
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    
    // Connect Firestore emulator
    connectFirestoreEmulator(db, host, 8080);
    
    // Connect Storage emulator
    connectStorageEmulator(storage, host, 9199);
    
    // Connect Functions emulator
    connectFunctionsEmulator(functions, host, 5001);
    
    if (__DEV__) {
      console.log('🔥 Connected to Firebase emulators');
    }
  } catch (error) {
    // Emulators might already be connected
    if (__DEV__) {
      console.log('🔥 Firebase emulators already connected or error:', error);
    }
  }
}

export { app, auth, db, storage, functions };

// Helper function to clear emulator data
export async function clearEmulatorData() {
  if (__DEV__ || process.env.NODE_ENV === 'test') {
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    
    try {
      // Clear Firestore
      await fetch(`http://${host}:8080/emulator/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`, {
        method: 'DELETE',
      });
      
      // Clear Auth
      await fetch(`http://${host}:9099/emulator/v1/projects/${firebaseConfig.projectId}/accounts`, {
        method: 'DELETE',
      });
      
      console.log('✅ Emulator data cleared');
    } catch (error) {
      console.error('❌ Error clearing emulator data:', error);
    }
  }
}

// Helper function to seed test data
export async function seedTestData() {
  if (__DEV__ || process.env.NODE_ENV === 'test') {
    try {
      // Add test users
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      await createUserWithEmailAndPassword(auth, 'john@example.com', 'password123');
      
      // Add test data to Firestore
      const { collection, doc, setDoc } = require('firebase/firestore');
      
      // Add test jobs
      const jobsRef = collection(db, 'jobs');
      await setDoc(doc(jobsRef, 'job1'), {
        title: 'Senior React Native Developer',
        description: 'Looking for experienced RN developer',
        budget: 5000,
        clientId: 'test-client',
        status: 'open',
        createdAt: new Date(),
      });
      
      await setDoc(doc(jobsRef, 'job2'), {
        title: 'UI/UX Designer',
        description: 'Need designer for mobile app',
        budget: 3000,
        clientId: 'test-client',
        status: 'open',
        createdAt: new Date(),
      });
      
      console.log('✅ Test data seeded');
    } catch (error) {
      console.error('❌ Error seeding test data:', error);
    }
  }
}




