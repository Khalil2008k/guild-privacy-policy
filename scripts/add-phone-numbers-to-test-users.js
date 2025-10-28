/**
 * Add phone numbers to test users
 * Run: node scripts/add-phone-numbers-to-test-users.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try to find service account key
const possiblePaths = [
  path.join(__dirname, '../serviceAccountKey.json'),
  path.join(__dirname, '../../Downloads/guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json'),
  'C:\\Users\\Admin\\Downloads\\guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json',
];

let serviceAccount = null;
for (const keyPath of possiblePaths) {
  if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
    console.log(`✅ Found service account key at: ${keyPath}\n`);
    break;
  }
}

if (!serviceAccount) {
  console.error('❌ Service account key not found!');
  console.error('Tried paths:', possiblePaths);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addPhoneNumbers() {
  console.log('🔥 Adding phone numbers to test users...\n');

  const testUsers = [
    {
      email: 'testuser1@guild.app',
      phoneNumber: '+97450123456', // Qatar number
      displayName: 'Test User 1',
    },
    {
      email: 'testuser2@guild.app',
      phoneNumber: '+97450987654', // Qatar number
      displayName: 'Test User 2',
    },
  ];

  for (const testUser of testUsers) {
    try {
      console.log(`📱 Processing ${testUser.email}...`);

      // Find user by email
      const usersSnapshot = await db
        .collection('users')
        .where('email', '==', testUser.email)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        console.log(`❌ User not found: ${testUser.email}\n`);
        continue;
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Update user document
      await db.collection('users').doc(userId).update({
        phoneNumber: testUser.phoneNumber,
        displayName: testUser.displayName,
        displayNameLower: testUser.displayName.toLowerCase(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Updated ${testUser.email}`);
      console.log(`   - UID: ${userId}`);
      console.log(`   - GID: ${userData.gid}`);
      console.log(`   - Phone: ${testUser.phoneNumber}`);
      console.log(`   - Name: ${testUser.displayName}\n`);
    } catch (error) {
      console.error(`❌ Error updating ${testUser.email}:`, error.message, '\n');
    }
  }

  console.log('✅ Done!');
  process.exit(0);
}

addPhoneNumbers().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

