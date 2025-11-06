/**
 * Fix demo@guild.app user ID in chats
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

async function fixDemoUserId() {
  try {
    console.log('🔧 Fixing demo@guild.app user ID in chats...\n');

    const OLD_DEMO_ID = '1TwSrYTugUSF7V0B31jXkTlMKgr1';
    const NEW_DEMO_ID = 'B6T41TJDq4Qfo0OFuuDkNlbtMLq2';

    console.log('Old Demo ID:', OLD_DEMO_ID);
    console.log('New Demo ID:', NEW_DEMO_ID);
    console.log('');

    // Find all chats with the old demo ID
    const chatsQuery = await db.collection('chats')
      .where('participants', 'array-contains', OLD_DEMO_ID)
      .get();

    if (chatsQuery.empty) {
      console.log('❌ No chats found with old demo ID');
      process.exit(1);
    }

    console.log(`✅ Found ${chatsQuery.size} chats to fix\n`);

    for (const chatDoc of chatsQuery.docs) {
      const chatId = chatDoc.id;
      const chat = chatDoc.data();

      console.log('📝 Fixing chat:', chatId);
      console.log('   Old participants:', chat.participants);

      // Replace old ID with new ID in participants array
      const newParticipants = chat.participants.map(id => 
        id === OLD_DEMO_ID ? NEW_DEMO_ID : id
      );

      // Update participant names
      const newParticipantNames = { ...chat.participantNames };
      if (newParticipantNames[OLD_DEMO_ID]) {
        newParticipantNames[NEW_DEMO_ID] = newParticipantNames[OLD_DEMO_ID];
        delete newParticipantNames[OLD_DEMO_ID];
      }

      // Update unread counts
      const newUnreadCount = { ...chat.unreadCount };
      if (newUnreadCount[OLD_DEMO_ID] !== undefined) {
        newUnreadCount[NEW_DEMO_ID] = newUnreadCount[OLD_DEMO_ID];
        delete newUnreadCount[OLD_DEMO_ID];
      }

      // Update lastMessage sender if needed
      const newLastMessage = { ...chat.lastMessage };
      if (newLastMessage.senderId === OLD_DEMO_ID) {
        newLastMessage.senderId = NEW_DEMO_ID;
      }

      // Update the chat document
      await db.collection('chats').doc(chatId).update({
        participants: newParticipants,
        participantNames: newParticipantNames,
        unreadCount: newUnreadCount,
        lastMessage: newLastMessage
      });

      console.log('   New participants:', newParticipants);
      console.log('   ✅ Chat updated');

      // Update messages in this chat
      const messagesQuery = await db.collection('chats')
        .doc(chatId)
        .collection('messages')
        .where('senderId', '==', OLD_DEMO_ID)
        .get();

      if (!messagesQuery.empty) {
        console.log(`   📨 Updating ${messagesQuery.size} messages...`);
        
        const batch = db.batch();
        messagesQuery.docs.forEach(messageDoc => {
          batch.update(messageDoc.ref, { senderId: NEW_DEMO_ID });
        });
        await batch.commit();
        
        console.log('   ✅ Messages updated');
      }

      console.log('');
    }

    console.log('🎉 SUCCESS! All chats and messages updated!');
    console.log('─────────────────────────────────────');
    console.log(`Updated ${chatsQuery.size} chats`);
    console.log('Demo user ID fixed in:');
    console.log('  - participants arrays');
    console.log('  - participantNames maps');
    console.log('  - unreadCount maps');
    console.log('  - lastMessage senderIds');
    console.log('  - message senderIds');
    console.log('─────────────────────────────────────');
    console.log('\n✅ Open the app - messages should load now!');

  } catch (error) {
    console.error('❌ Error fixing demo user ID:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixDemoUserId();














