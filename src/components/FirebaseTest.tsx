/**
 * Firebase Test Component
 * 
 * This component tests Firebase connection and data loading
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

export const FirebaseTest: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState(false);

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🧪 Testing Firebase connection...');
      logger.debug('🧪 User ID:', user?.uid);
      
      if (!user?.uid) {
        setTestResult('❌ No user ID');
        return;
      }
      
      // Test Firebase connection by reading userProfiles
      const userProfilesRef = doc(db, 'userProfiles', user.uid);
      const userProfilesSnap = await getDoc(userProfilesRef);
      
      if (userProfilesSnap.exists()) {
        const data = userProfilesSnap.data();
        setTestResult(`✅ Firebase OK - Found profile: ${data.fullName || 'No name'}`);
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('✅ Firebase test successful:', data);
      } else {
        setTestResult('❌ No profile found in Firebase');
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('❌ No profile found for user:', user.uid);
      }
    } catch (error) {
      setTestResult(`❌ Firebase Error: ${error.message}`);
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('❌ Firebase test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Test</Text>
      <Text style={styles.info}>User ID: {user?.uid || 'Not logged in'}</Text>
      <Text style={styles.info}>Result: {testResult}</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testFirebaseConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Firebase'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    maxWidth: 200,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default FirebaseTest;





