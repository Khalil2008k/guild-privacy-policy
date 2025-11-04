/**
 * Profile Debugger Component
 * 
 * COMMENT: PRODUCTION HARDENING - Task 5.4 - Disabled in production builds
 * This component can be temporarily added to the profile screen
 * to debug and manually reload profile data.
 * 
 * NOTE: This component should NEVER be used in production builds.
 * It is automatically disabled when __DEV__ is false.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';

export const ProfileDebugger: React.FC = () => {
  // COMMENT: PRODUCTION HARDENING - Task 5.4 - Disable debugger in production
  if (!__DEV__) {
    return null; // Do not render in production builds
  }
  const { profile, reloadProfile, isLoading } = useUserProfile();
  const { user } = useAuth();

  const handleReload = async () => {
    logger.debug('🔄 Manual profile reload triggered');
    await reloadProfile();
  };

  const handleClearCache = async () => {
    logger.debug('🧹 Clearing profile cache');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('userProfile');
    await reloadProfile();
  };

  const handleLogProfile = () => {
    logger.debug('📋 Current profile data:', JSON.stringify(profile, null, 2));
    logger.debug('📋 User auth data:', JSON.stringify(user, null, 2));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Debugger</Text>
      
      <Text style={styles.info}>User ID: {user?.uid || 'Not logged in'}</Text>
      <Text style={styles.info}>Full Name: {profile.fullName || 'Not set'}</Text>
      <Text style={styles.info}>First Name: {profile.firstName || 'Not set'}</Text>
      <Text style={styles.info}>Last Name: {profile.lastName || 'Not set'}</Text>
      <Text style={styles.info}>ID Number: {profile.idNumber || 'Not set'}</Text>
      <Text style={styles.info}>Profile Image: {profile.profileImage ? 'Has image' : 'No image'}</Text>
      <Text style={styles.info}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleReload}>
        <Text style={styles.buttonText}>Reload Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClearCache}>
        <Text style={styles.buttonText}>Clear Cache & Reload</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.logButton]} onPress={handleLogProfile}>
        <Text style={styles.buttonText}>Log Profile Data</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
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
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  logButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default ProfileDebugger;
