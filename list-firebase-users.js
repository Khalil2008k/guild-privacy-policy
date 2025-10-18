/**
 * List All Firebase Users
 */

const admin = require('firebase-admin');
const serviceAccount = require('./backend/config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'guild-4f46b'
});

const auth = admin.auth();

async function listUsers() {
  console.log('📋 Listing all Firebase users...\n');
  
  try {
    const listUsersResult = await auth.listUsers(100);
    
    console.log(`Total users: ${listUsersResult.users.length}\n`);
    console.log('═'.repeat(80));
    
    listUsersResult.users.forEach((userRecord, index) => {
      console.log(`\n${index + 1}. ${userRecord.displayName || 'No Name'}`);
      console.log(`   Email:    ${userRecord.email || 'No email'}`);
      console.log(`   UID:      ${userRecord.uid}`);
      console.log(`   Phone:    ${userRecord.phoneNumber || 'No phone'}`);
      console.log(`   Verified: ${userRecord.emailVerified ? '✅' : '❌'}`);
      console.log(`   Created:  ${new Date(userRecord.metadata.creationTime).toLocaleDateString()}`);
      console.log(`   Last:     ${new Date(userRecord.metadata.lastSignInTime).toLocaleDateString()}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error('Error listing users:', error);
  }
  
  process.exit(0);
}

listUsers();

