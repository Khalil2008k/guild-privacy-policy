/**
 * Clear App Cache Script
 * 
 * This script clears the AsyncStorage cache to force the app to reload
 * profile data from Firebase instead of using cached data.
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearAppCache() {
  try {
    console.log('🧹 Clearing app cache...');
    
    // Clear user profile cache
    await AsyncStorage.removeItem('userProfile');
    console.log('✅ Cleared userProfile cache');
    
    // Clear any other relevant caches
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('profileData');
    console.log('✅ Cleared additional profile caches');
    
    // Clear auth cache if needed
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userToken');
    console.log('✅ Cleared auth caches');
    
    console.log('\\n🎉 App cache cleared successfully!');
    console.log('\\n📱 Next steps:');
    console.log('1. Close the app completely');
    console.log('2. Reopen the app');
    console.log('3. Sign in with testuser1@guild.app');
    console.log('4. Check if profile data and image now load correctly');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Note: This script won't work in Node.js environment
// It's meant to be run in the React Native app
console.log('⚠️  This script is for reference only.');
console.log('To clear the cache, you need to:');
console.log('1. Open the app');
console.log('2. Go to Settings or Developer menu');
console.log('3. Clear app data/cache');
console.log('4. Or uninstall and reinstall the app');

clearAppCache();








