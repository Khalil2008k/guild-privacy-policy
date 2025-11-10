/**
 * Add messages to demo chats
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
    console.log('✅ Found service account key at:', p);
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

async function addMessages() {
  try {
    console.log('💬 Adding messages to demo chats...\n');

    // Get demo user
    const demoQuery = await db.collection('users')
      .where('email', '==', 'demo@guild.app')
      .limit(1)
      .get();

    if (demoQuery.empty) {
      console.error('❌ demo@guild.app not found');
      process.exit(1);
    }

    const demoUserId = demoQuery.docs[0].id;
    console.log('✅ Demo User ID:', demoUserId);

    // Get test users
    const testUser1Query = await db.collection('users')
      .where('email', '==', 'testuser1@guild.app')
      .limit(1)
      .get();

    const testUser2Query = await db.collection('users')
      .where('email', '==', 'testuser2@guild.app')
      .limit(1)
      .get();

    const testUser1Id = testUser1Query.docs[0].id;
    const testUser2Id = testUser2Query.docs[0].id;

    console.log('✅ Test User 1 ID:', testUser1Id);
    console.log('✅ Test User 2 ID:', testUser2Id);

    // Find chats
    const chat1Query = await db.collection('chats')
      .where('participants', 'array-contains', testUser1Id)
      .get();

    const chat2Query = await db.collection('chats')
      .where('participants', 'array-contains', testUser2Id)
      .get();

    // Find chat between Test User 1 and Demo User
    let chat1Id = null;
    for (const doc of chat1Query.docs) {
      const chat = doc.data();
      if (chat.participants.includes(demoUserId) && chat.participants.length === 2) {
        chat1Id = doc.id;
        break;
      }
    }

    // Find chat between Test User 2 and Demo User
    let chat2Id = null;
    for (const doc of chat2Query.docs) {
      const chat = doc.data();
      if (chat.participants.includes(demoUserId) && chat.participants.length === 2) {
        chat2Id = doc.id;
        break;
      }
    }

    if (!chat1Id || !chat2Id) {
      console.error('❌ Demo chats not found');
      process.exit(1);
    }

    console.log('✅ Chat 1 ID:', chat1Id);
    console.log('✅ Chat 2 ID:', chat2Id);
    console.log('');

    // Add messages to Chat 1 (Test User 1 ↔ Demo User)
    console.log('💬 Adding messages to Chat 1...');
    
    const chat1Messages = [
      {
        chatId: chat1Id,
        senderId: demoUserId,
        text: 'Hi! Welcome to GUILD! 👋',
        type: 'TEXT',
        status: 'SENT',
        readBy: [demoUserId],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        chatId: chat1Id,
        senderId: demoUserId,
        text: 'I\'m here to help you test the notification system. Try sending me a message!',
        type: 'TEXT',
        status: 'SENT',
        readBy: [demoUserId],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const message of chat1Messages) {
      await db.collection('chats').doc(chat1Id).collection('messages').add(message);
    }

    // Update chat 1 last message
    await db.collection('chats').doc(chat1Id).update({
      lastMessage: {
        text: chat1Messages[chat1Messages.length - 1].text,
        senderId: demoUserId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      [`unreadCount.${testUser1Id}`]: chat1Messages.length
    });

    console.log('✅ Added', chat1Messages.length, 'messages to Chat 1');

    // Add messages to Chat 2 (Test User 2 ↔ Demo User)
    console.log('💬 Adding messages to Chat 2...');
    
    const chat2Messages = [
      {
        chatId: chat2Id,
        senderId: demoUserId,
        text: 'Hello! 👋 Ready to test notifications?',
        type: 'TEXT',
        status: 'SENT',
        readBy: [demoUserId],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        chatId: chat2Id,
        senderId: demoUserId,
        text: 'Send me a message and watch the magic happen! ✨',
        type: 'TEXT',
        status: 'SENT',
        readBy: [demoUserId],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const message of chat2Messages) {
      await db.collection('chats').doc(chat2Id).collection('messages').add(message);
    }

    // Update chat 2 last message
    await db.collection('chats').doc(chat2Id).update({
      lastMessage: {
        text: chat2Messages[chat2Messages.length - 1].text,
        senderId: demoUserId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      [`unreadCount.${testUser2Id}`]: chat2Messages.length
    });

    console.log('✅ Added', chat2Messages.length, 'messages to Chat 2');

    console.log('\n🎉 SUCCESS! Messages added to both chats!');
    console.log('─────────────────────────────────────');
    console.log('Chat 1:', chat1Messages.length, 'messages');
    console.log('Chat 2:', chat2Messages.length, 'messages');
    console.log('─────────────────────────────────────');
    console.log('\n✅ Open the app to see the messages!');
    console.log('✅ Both test users have', chat1Messages.length, 'unread messages from Demo User');

  } catch (error) {
    console.error('❌ Error adding messages:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
addMessages();
















