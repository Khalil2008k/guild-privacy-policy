/**
 * FIREBASE EMULATOR REAL-TIME TEST
 * Tests actual Firebase operations using emulator
 * 
 * Setup:
 * 1. npm install -g firebase-tools
 * 2. firebase init emulators
 * 3. firebase emulators:start
 * 4. Run this script
 */

const admin = require('firebase-admin');
const { performance } = require('perf_hooks');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║       FIREBASE EMULATOR TEST - REAL-TIME OPERATIONS              ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Initialize Firebase Admin with emulator
try {
  admin.initializeApp({
    projectId: 'demo-test-project',
  });
} catch (error) {
  // App may already be initialized
  console.log('Using existing Firebase app');
}

// Connect to emulator
if (process.env.FIRESTORE_EMULATOR_HOST === undefined) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  console.log('🔥 Connecting to Firestore Emulator at localhost:8080\n');
}

const db = admin.firestore();

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  totalTests++;
  const startTime = performance.now();
  
  try {
    await fn();
    const duration = performance.now() - startTime;
    passedTests++;
    console.log(`  ✅ ${name} (${Math.round(duration)}ms)`);
  } catch (error) {
    const duration = performance.now() - startTime;
    failedTests++;
    console.log(`  ❌ ${name} (${Math.round(duration)}ms)`);
    console.log(`     Error: ${error.message}`);
  }
}

// ============================================================================
// SUITE 1: FIRESTORE BASIC OPERATIONS
// ============================================================================
async function testBasicOperations() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 1: FIRESTORE BASIC OPERATIONS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let testDocId;

  await test('Write document to Firestore', async () => {
    const docRef = await db.collection('test_collection').add({
      message: 'Test message',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      count: 1
    });
    testDocId = docRef.id;
  });

  await test('Read document from Firestore', async () => {
    if (!testDocId) throw new Error('No test doc to read');
    const doc = await db.collection('test_collection').doc(testDocId).get();
    if (!doc.exists) throw new Error('Document not found');
  });

  await test('Update document in Firestore', async () => {
    if (!testDocId) throw new Error('No test doc to update');
    await db.collection('test_collection').doc(testDocId).update({
      count: admin.firestore.FieldValue.increment(1)
    });
  });

  await test('Delete document from Firestore', async () => {
    if (!testDocId) throw new Error('No test doc to delete');
    await db.collection('test_collection').doc(testDocId).delete();
  });

  await test('Query documents from Firestore', async () => {
    const snapshot = await db.collection('test_collection')
      .where('count', '>=', 0)
      .limit(10)
      .get();
    // Query should work even if empty
  });
}

// ============================================================================
// SUITE 2: REAL-TIME CHAT SIMULATION
// ============================================================================
async function testRealTimeChat() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 2: REAL-TIME CHAT SIMULATION                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let chatId;
  let messageId;

  await test('Create chat room', async () => {
    const chatRef = await db.collection('chats').add({
      participants: ['user1', 'user2'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    chatId = chatRef.id;
  });

  await test('Send message to chat', async () => {
    if (!chatId) throw new Error('No chat created');
    const messageRef = await db.collection('chats').doc(chatId)
      .collection('messages').add({
        text: 'Hello, this is a test message!',
        senderId: 'user1',
        type: 'TEXT',
        status: 'sent',
        readBy: ['user1'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    messageId = messageRef.id;
  });

  await test('Listen to messages (real-time)', async () => {
    if (!chatId) throw new Error('No chat created');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Listener timeout'));
      }, 5000);

      const unsubscribe = db.collection('chats').doc(chatId)
        .collection('messages')
        .onSnapshot((snapshot) => {
          if (!snapshot.empty) {
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          }
        }, (error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  });

  await test('Edit message', async () => {
    if (!chatId || !messageId) throw new Error('No message to edit');
    await db.collection('chats').doc(chatId)
      .collection('messages').doc(messageId)
      .update({
        text: 'Edited message',
        editedAt: admin.firestore.FieldValue.serverTimestamp(),
        editHistory: admin.firestore.FieldValue.arrayUnion({
          text: 'Original message',
          editedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      });
  });

  await test('Soft delete message', async () => {
    if (!chatId || !messageId) throw new Error('No message to delete');
    await db.collection('chats').doc(chatId)
      .collection('messages').doc(messageId)
      .update({
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: 'user1'
      });
  });

  await test('Query messages with filters', async () => {
    if (!chatId) throw new Error('No chat created');
    const snapshot = await db.collection('chats').doc(chatId)
      .collection('messages')
      .where('status', '==', 'sent')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    // Should work even if empty
  });
}

// ============================================================================
// SUITE 3: CONCURRENT OPERATIONS
// ============================================================================
async function testConcurrentOperations() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 3: CONCURRENT OPERATIONS                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Write 10 documents concurrently', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        db.collection('concurrent_test').add({
          index: i,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        })
      );
    }
    await Promise.all(promises);
  });

  await test('Batch write 50 documents', async () => {
    const batch = db.batch();
    for (let i = 0; i < 50; i++) {
      const docRef = db.collection('batch_test').doc(`doc_${i}`);
      batch.set(docRef, {
        index: i,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
  });

  await test('Transaction update', async () => {
    const docRef = db.collection('transaction_test').doc('counter');
    await docRef.set({ count: 0 });
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const newCount = (doc.data()?.count || 0) + 1;
      transaction.update(docRef, { count: newCount });
    });
  });
}

// ============================================================================
// SUITE 4: PERFORMANCE TESTING
// ============================================================================
async function testPerformance() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 4: PERFORMANCE TESTING                                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Write latency < 100ms', async () => {
    const start = performance.now();
    await db.collection('perf_test').add({ data: 'test' });
    const duration = performance.now() - start;
    if (duration > 100) {
      throw new Error(`Slow write: ${Math.round(duration)}ms`);
    }
  });

  await test('Read latency < 50ms', async () => {
    const docRef = await db.collection('perf_test').add({ data: 'test' });
    const start = performance.now();
    await docRef.get();
    const duration = performance.now() - start;
    if (duration > 50) {
      throw new Error(`Slow read: ${Math.round(duration)}ms`);
    }
  });

  await test('Query latency < 100ms', async () => {
    const start = performance.now();
    await db.collection('perf_test').limit(10).get();
    const duration = performance.now() - start;
    if (duration > 100) {
      throw new Error(`Slow query: ${Math.round(duration)}ms`);
    }
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runAllTests() {
  const startTime = performance.now();
  
  console.log('🚀 Starting Firebase Emulator Tests...\n');
  console.log('Prerequisites:');
  console.log('  ✓ Firebase CLI installed');
  console.log('  ✓ Emulators initialized');
  console.log('  ✓ Emulators running (firebase emulators:start)\n');
  console.log('═'.repeat(70) + '\n');
  
  try {
    await testBasicOperations();
    await testRealTimeChat();
    await testConcurrentOperations();
    await testPerformance();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
  
  const totalTime = performance.now() - startTime;
  
  // Print Results
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              FIREBASE EMULATOR TEST RESULTS                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Tests:     ${totalTests}`);
  console.log(`✅ Passed:       ${passedTests}`);
  console.log(`❌ Failed:       ${failedTests}`);
  console.log(`Success Rate:   ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`Total Time:     ${Math.round(totalTime)}ms\n`);
  
  console.log('═'.repeat(70) + '\n');
  
  if (failedTests === 0) {
    console.log('🎉🎉🎉 ALL FIREBASE TESTS PASSED! 🎉🎉🎉\n');
    console.log('✅ Firestore operations working');
    console.log('✅ Real-time listeners functional');
    console.log('✅ Concurrent operations handled');
    console.log('✅ Performance acceptable\n');
    console.log('🚀 FIREBASE INTEGRATION READY!\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED\n');
    console.log(`Fix ${failedTests} test(s) before proceeding.\n`);
  }
  
  // Cleanup
  await admin.app().delete();
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Check if emulator is running
console.log('Checking Firebase Emulator connection...');
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.log('\n💡 Make sure Firebase Emulator is running:');
  console.log('   firebase emulators:start\n');
  process.exit(1);
});







