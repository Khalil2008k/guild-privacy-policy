/**
 * Create Test Users & Chats for Comprehensive Testing
 * 
 * Creates:
 * - User A: testuser-a@guild.app
 * - User B: testuser-b@guild.app
 * - Personal Chat: direct-userA-userB (Local storage)
 * - Job Chat: job-1234 (Firestore)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'guild-4f46b'
  });
}

const db = admin.firestore();

async function createTestUsers() {
  console.log('🔧 Creating test users...');
  
  const users = [
    {
      uid: 'test-user-a',
      email: 'testuser-a@guild.app',
      displayName: 'Test User A',
      phoneNumber: '+1234567890',
      isVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      status: 'online'
    },
    {
      uid: 'test-user-b', 
      email: 'testuser-b@guild.app',
      displayName: 'Test User B',
      phoneNumber: '+1234567891',
      isVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      status: 'online'
    }
  ];

  for (const user of users) {
    try {
      // Create user document
      await db.collection('users').doc(user.uid).set(user);
      console.log(`✅ Created user: ${user.displayName} (${user.email})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error);
    }
  }

  return users;
}

async function createTestChats(users) {
  console.log('🔧 Creating test chats...');
  
  const userA = users[0];
  const userB = users[1];
  
  // 1. Personal Chat (Local Storage)
  const personalChat = {
    id: 'direct-userA-userB',
    participants: [userA.uid, userB.uid],
    participantNames: {
      [userA.uid]: userA.displayName,
      [userB.uid]: userB.displayName
    },
    chatType: 'direct',
    isActive: true,
    unreadCount: {
      [userA.uid]: 0,
      [userB.uid]: 0
    },
    lastMessage: {
      text: 'Test personal chat created',
      senderId: userA.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // 2. Job Chat (Firestore)
  const jobChat = {
    id: 'job-1234',
    participants: [userA.uid, userB.uid],
    participantNames: {
      [userA.uid]: userA.displayName,
      [userB.uid]: userB.displayName
    },
    chatType: 'job',
    jobId: '1234',
    isActive: true,
    unreadCount: {
      [userA.uid]: 0,
      [userB.uid]: 0
    },
    lastMessage: {
      text: 'Test job chat created',
      senderId: userA.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    // Create personal chat
    await db.collection('chats').doc(personalChat.id).set(personalChat);
    console.log(`✅ Created personal chat: ${personalChat.id}`);
    
    // Create job chat
    await db.collection('chats').doc(jobChat.id).set(jobChat);
    console.log(`✅ Created job chat: ${jobChat.id}`);
    
    // Add initial test messages
    await addTestMessages(personalChat.id, userA.uid, userB.uid, 'personal');
    await addTestMessages(jobChat.id, userA.uid, userB.uid, 'job');
    
  } catch (error) {
    console.error('❌ Failed to create chats:', error);
  }
}

async function addTestMessages(chatId, userA, userB, chatType) {
  console.log(`🔧 Adding test messages to ${chatId}...`);
  
  const messages = [
    {
      chatId,
      senderId: userA,
      text: `Hello! This is a test ${chatType} chat.`,
      type: 'TEXT',
      status: 'sent',
      readBy: [userA],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      chatId,
      senderId: userB,
      text: `Hi! Testing ${chatType} chat functionality.`,
      type: 'TEXT', 
      status: 'sent',
      readBy: [userB],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      chatId,
      senderId: userA,
      text: `This message tests the ${chatType === 'personal' ? 'local storage' : 'Firestore'} routing.`,
      type: 'TEXT',
      status: 'sent',
      readBy: [userA],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const message of messages) {
    try {
      const docRef = await db.collection('chats').doc(chatId).collection('messages').add(message);
      console.log(`✅ Added test message: ${docRef.id}`);
    } catch (error) {
      console.error(`❌ Failed to add test message:`, error);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting test setup...');
    
    const users = await createTestUsers();
    await createTestChats(users);
    
    console.log('\n🎉 Test setup complete!');
    console.log('\n📋 Test Credentials:');
    console.log('User A: testuser-a@guild.app (test-user-a)');
    console.log('User B: testuser-b@guild.app (test-user-b)');
    console.log('\n💬 Test Chats:');
    console.log('Personal: direct-userA-userB (Local Storage)');
    console.log('Job: job-1234 (Firestore)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
}

main();
