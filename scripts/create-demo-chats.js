/**
 * Create chats between test users and demo@guild.app
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

async function createDemoChats() {
  try {
    console.log('🔥 Starting demo chat creation...\n');

    // Step 1: Find or create demo@guild.app user
    console.log('📧 Looking for demo@guild.app...');
    const demoQuery = await db.collection('users')
      .where('email', '==', 'demo@guild.app')
      .limit(1)
      .get();

    let demoUserId;
    let demoUserName;

    if (demoQuery.empty) {
      console.log('❌ demo@guild.app not found. Creating...');
      
      // Create demo user
      const demoUserRef = db.collection('users').doc();
      demoUserId = demoUserRef.id;
      demoUserName = 'Demo User';
      
      await demoUserRef.set({
        email: 'demo@guild.app',
        displayName: demoUserName,
        name: demoUserName,
        phoneNumber: '+97412345678',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isVerified: true,
        role: 'user'
      });
      
      console.log('✅ Created demo@guild.app with ID:', demoUserId);
    } else {
      const demoDoc = demoQuery.docs[0];
      demoUserId = demoDoc.id;
      const demoData = demoDoc.data();
      demoUserName = demoData.displayName || demoData.name || 'Demo User';
      console.log('✅ Found demo@guild.app with ID:', demoUserId);
      console.log('   Name:', demoUserName);
    }

    // Step 2: Find test users
    console.log('\n📧 Looking for test users...');
    const testUser1Query = await db.collection('users')
      .where('email', '==', 'testuser1@guild.app')
      .limit(1)
      .get();

    const testUser2Query = await db.collection('users')
      .where('email', '==', 'testuser2@guild.app')
      .limit(1)
      .get();

    if (testUser1Query.empty || testUser2Query.empty) {
      console.error('❌ Test users not found. Please create them first.');
      process.exit(1);
    }

    const testUser1Doc = testUser1Query.docs[0];
    const testUser1Id = testUser1Doc.id;
    const testUser1Data = testUser1Doc.data();
    const testUser1Name = testUser1Data.displayName || testUser1Data.name || 'Test User 1';

    const testUser2Doc = testUser2Query.docs[0];
    const testUser2Id = testUser2Doc.id;
    const testUser2Data = testUser2Doc.data();
    const testUser2Name = testUser2Data.displayName || testUser2Data.name || 'Test User 2';

    console.log('✅ Found testuser1@guild.app:', testUser1Id, '-', testUser1Name);
    console.log('✅ Found testuser2@guild.app:', testUser2Id, '-', testUser2Name);

    // Step 3: Create chat between Test User 1 and Demo User
    console.log('\n💬 Creating chat: Test User 1 ↔ Demo User...');
    const chat1Ref = db.collection('chats').doc();
    await chat1Ref.set({
      participants: [testUser1Id, demoUserId],
      participantNames: {
        [testUser1Id]: testUser1Name,
        [demoUserId]: demoUserName
      },
      type: 'direct',
      lastMessage: {
        text: 'Welcome! This is a test chat.',
        senderId: demoUserId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      unreadCount: {
        [testUser1Id]: 1,
        [demoUserId]: 0
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add initial message
    await chat1Ref.collection('messages').add({
      chatId: chat1Ref.id,
      senderId: demoUserId,
      text: 'Welcome! This is a test chat.',
      type: 'TEXT',
      status: 'SENT',
      readBy: [demoUserId],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created chat:', chat1Ref.id);

    // Step 4: Create chat between Test User 2 and Demo User
    console.log('\n💬 Creating chat: Test User 2 ↔ Demo User...');
    const chat2Ref = db.collection('chats').doc();
    await chat2Ref.set({
      participants: [testUser2Id, demoUserId],
      participantNames: {
        [testUser2Id]: testUser2Name,
        [demoUserId]: demoUserName
      },
      type: 'direct',
      lastMessage: {
        text: 'Hello! Ready to test notifications?',
        senderId: demoUserId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      unreadCount: {
        [testUser2Id]: 1,
        [demoUserId]: 0
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add initial message
    await chat2Ref.collection('messages').add({
      chatId: chat2Ref.id,
      senderId: demoUserId,
      text: 'Hello! Ready to test notifications?',
      type: 'TEXT',
      status: 'SENT',
      readBy: [demoUserId],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Created chat:', chat2Ref.id);

    console.log('\n🎉 SUCCESS! Demo chats created!\n');
    console.log('📊 Summary:');
    console.log('─────────────────────────────────────');
    console.log('Demo User:', demoUserName, `(${demoUserId})`);
    console.log('Test User 1:', testUser1Name, `(${testUser1Id})`);
    console.log('Test User 2:', testUser2Name, `(${testUser2Id})`);
    console.log('Chat 1 ID:', chat1Ref.id);
    console.log('Chat 2 ID:', chat2Ref.id);
    console.log('─────────────────────────────────────');
    console.log('\n✅ Both test users can now chat with demo@guild.app!');
    console.log('✅ Each chat has 1 unread message from Demo User');
    console.log('✅ Open the app to see the chats and test notifications!');

  } catch (error) {
    console.error('❌ Error creating demo chats:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
createDemoChats();
















