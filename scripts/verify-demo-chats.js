/**
 * Verify demo chats exist and are properly configured
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Find service account key
const possiblePaths = [
  path.join(__dirname, '..', 'serviceAccountKey.json'),
  path.join(__dirname, '..', '..', 'serviceAccountKey.json'),
  'C:\\Users\\Admin\\Downloads\\guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json'
];

let serviceAccountPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    break;
  }
}

if (!serviceAccountPath) {
  console.error('❌ Could not find serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'guild-4f46b'
});

const db = admin.firestore();

async function verifyChats() {
  try {
    console.log('🔍 Verifying demo chats...\n');

    // Get test user IDs
    const testUser1Query = await db.collection('users')
      .where('email', '==', 'testuser1@guild.app')
      .limit(1)
      .get();

    const testUser2Query = await db.collection('users')
      .where('email', '==', 'testuser2@guild.app')
      .limit(1)
      .get();

    if (testUser1Query.empty || testUser2Query.empty) {
      console.error('❌ Test users not found');
      process.exit(1);
    }

    const testUser1Id = testUser1Query.docs[0].id;
    const testUser2Id = testUser2Query.docs[0].id;

    console.log('Test User 1 ID:', testUser1Id);
    console.log('Test User 2 ID:', testUser2Id);
    console.log('');

    // Check chats for Test User 1
    console.log('📋 Chats for Test User 1:');
    console.log('─────────────────────────────────────');
    const user1Chats = await db.collection('chats')
      .where('participants', 'array-contains', testUser1Id)
      .get();

    if (user1Chats.empty) {
      console.log('❌ No chats found for Test User 1');
    } else {
      user1Chats.forEach(doc => {
        const chat = doc.data();
        console.log('Chat ID:', doc.id);
        console.log('Participants:', chat.participants);
        console.log('Participant Names:', chat.participantNames);
        console.log('Last Message:', chat.lastMessage);
        console.log('Unread Count:', chat.unreadCount);
        console.log('Type:', chat.type);
        console.log('Is Active:', chat.isActive);
        console.log('Created At:', chat.createdAt?.toDate());
        console.log('Updated At:', chat.updatedAt?.toDate());
        console.log('─────────────────────────────────────');
      });
    }

    // Check chats for Test User 2
    console.log('\n📋 Chats for Test User 2:');
    console.log('─────────────────────────────────────');
    const user2Chats = await db.collection('chats')
      .where('participants', 'array-contains', testUser2Id)
      .get();

    if (user2Chats.empty) {
      console.log('❌ No chats found for Test User 2');
    } else {
      user2Chats.forEach(doc => {
        const chat = doc.data();
        console.log('Chat ID:', doc.id);
        console.log('Participants:', chat.participants);
        console.log('Participant Names:', chat.participantNames);
        console.log('Last Message:', chat.lastMessage);
        console.log('Unread Count:', chat.unreadCount);
        console.log('Type:', chat.type);
        console.log('Is Active:', chat.isActive);
        console.log('Created At:', chat.createdAt?.toDate());
        console.log('Updated At:', chat.updatedAt?.toDate());
        console.log('─────────────────────────────────────');
      });
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error verifying chats:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
verifyChats();











