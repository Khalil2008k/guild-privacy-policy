/**
 * Check if messages exist in demo chats
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

async function checkMessages() {
  try {
    console.log('🔍 Checking messages in demo chats...\n');

    const chatIds = ['GiNSFhwjJA9ccqvXUglL', 'bWZ4FfGHGujTuK9aDCjz'];

    for (const chatId of chatIds) {
      console.log('📋 Chat ID:', chatId);
      console.log('─────────────────────────────────────');

      // Get messages
      const messagesSnapshot = await db.collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      if (messagesSnapshot.empty) {
        console.log('❌ No messages found');
      } else {
        console.log('✅ Found', messagesSnapshot.size, 'messages:');
        messagesSnapshot.forEach((doc, index) => {
          const message = doc.data();
          console.log(`\nMessage ${index + 1}:`);
          console.log('  ID:', doc.id);
          console.log('  Sender:', message.senderId);
          console.log('  Text:', message.text);
          console.log('  Type:', message.type);
          console.log('  Status:', message.status);
          console.log('  Created:', message.createdAt?.toDate());
        });
      }
      console.log('─────────────────────────────────────\n');
    }

    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error checking messages:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
checkMessages();














