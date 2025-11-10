/**
 * Test Profile Loading Script
 * 
 * This script tests if the profile data is properly structured
 * and can be loaded by the UserProfileContext.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'guild-4f46b'
  });
}

const db = admin.firestore();

async function testProfileLoading() {
  console.log('🧪 Testing Profile Loading...\n');
  
  // Test testuser1
  console.log('👤 Testing testuser1...');
  const user1Query = await db.collection('users').where('email', '==', 'testuser1@guild.app').get();
  
  if (!user1Query.empty) {
    const user1 = user1Query.docs[0];
    const userId1 = user1.id;
    const userData1 = user1.data();
    
    console.log('📋 User ID:', userId1);
    console.log('📋 Email:', userData1.email);
    console.log('📋 Display Name:', userData1.displayName);
    
    // Check userProfiles
    const userProfiles1 = await db.collection('userProfiles').doc(userId1).get();
    if (userProfiles1.exists) {
      const profileData1 = userProfiles1.data();
      console.log('\\n✅ USERPROFILES DATA:');
      console.log('  firstName:', profileData1.firstName);
      console.log('  lastName:', profileData1.lastName);
      console.log('  fullName:', profileData1.fullName);
      console.log('  idNumber:', profileData1.idNumber);
      console.log('  profileImage:', profileData1.profileImage ? 'Has image' : 'No image');
      console.log('  bio:', profileData1.bio);
      console.log('  phoneNumber:', profileData1.phoneNumber);
      
      // Test what the UI expects
      console.log('\\n🎯 UI EXPECTS:');
      console.log('  NAME display:', profileData1.firstName && profileData1.lastName 
        ? `${profileData1.firstName.toLowerCase()} ${profileData1.lastName.toLowerCase()}`
        : 'khalil ahmed ali');
      console.log('  ID display:', profileData1.idNumber || '12356555');
      console.log('  GID display:', profileData1.idNumber || '12356555');
      console.log('  Image display:', profileData1.profileImage ? 'Will show image' : 'Will show placeholder');
      
    } else {
      console.log('❌ No userProfiles document found');
    }
  } else {
    console.log('❌ testuser1 not found');
  }
  
  console.log('\\n' + '='.repeat(50));
  
  // Test testuser2
  console.log('👤 Testing testuser2...');
  const user2Query = await db.collection('users').where('email', '==', 'testuser2@guild.app').get();
  
  if (!user2Query.empty) {
    const user2 = user2Query.docs[0];
    const userId2 = user2.id;
    const userData2 = user2.data();
    
    console.log('📋 User ID:', userId2);
    console.log('📋 Email:', userData2.email);
    console.log('📋 Display Name:', userData2.displayName);
    
    // Check userProfiles
    const userProfiles2 = await db.collection('userProfiles').doc(userId2).get();
    if (userProfiles2.exists) {
      const profileData2 = userProfiles2.data();
      console.log('\\n✅ USERPROFILES DATA:');
      console.log('  firstName:', profileData2.firstName);
      console.log('  lastName:', profileData2.lastName);
      console.log('  fullName:', profileData2.fullName);
      console.log('  idNumber:', profileData2.idNumber);
      console.log('  profileImage:', profileData2.profileImage ? 'Has image' : 'No image');
      console.log('  bio:', profileData2.bio);
      console.log('  phoneNumber:', profileData2.phoneNumber);
      
      // Test what the UI expects
      console.log('\\n🎯 UI EXPECTS:');
      console.log('  NAME display:', profileData2.firstName && profileData2.lastName 
        ? `${profileData2.firstName.toLowerCase()} ${profileData2.lastName.toLowerCase()}`
        : 'khalil ahmed ali');
      console.log('  ID display:', profileData2.idNumber || '12356555');
      console.log('  GID display:', profileData2.idNumber || '12356555');
      console.log('  Image display:', profileData2.profileImage ? 'Will show image' : 'Will show placeholder');
      
    } else {
      console.log('❌ No userProfiles document found');
    }
  } else {
    console.log('❌ testuser2 not found');
  }
  
  console.log('\\n🎉 Test completed!');
  console.log('\\n📱 Next steps:');
  console.log('1. Open the app');
  console.log('2. Sign in with testuser1@guild.app');
  console.log('3. Use the debugger to check profile data');
  console.log('4. Try "Clear Cache & Reload" button');
  console.log('5. Check console logs for detailed info');
}

testProfileLoading().then(() => process.exit(0)).catch(console.error);













