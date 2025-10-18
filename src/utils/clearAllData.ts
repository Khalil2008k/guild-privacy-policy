import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

export async function clearAllAppData() {
  try {
    // Sign out from Firebase
    await auth.signOut();
    
    // Clear all AsyncStorage
    await AsyncStorage.clear();
    
    // Clear specific keys if needed
    const keysToRemove = [
      'userProfile',
      'userRankingStats',
      'guildData',
      'theme',
      'language',
      'onboardingCompleted',
      'expoPushToken',
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    
    console.log('✅ All app data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing app data:', error);
    return false;
  }
}




