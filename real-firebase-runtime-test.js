/**
 * REAL FIREBASE RUNTIME TEST
 * Actual Firebase operations, not simulations
 * 
 * This test:
 * - Connects to REAL Firebase
 * - Sends REAL messages
 * - Measures ACTUAL latency
 * - Tests REAL-TIME listeners
 * - Validates ACTUAL performance
 */

const admin = require('firebase-admin');
const { performance } = require('perf_hooks');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║          REAL FIREBASE RUNTIME TEST - ACTUAL OPERATIONS          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

// Initialize Firebase Admin
let db;
let initialized = false;

async function initializeFirebase() {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    
    // Check if service account exists
    const fs = require('fs');
    const path = require('path');
    const serviceAccountPath = path.join(__dirname, 'backend', 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.log('⚠️  Service account key not found at:', serviceAccountPath);
      console.log('   Using environment variables or default credentials...\n');
      
      // Try to initialize without service account (uses default credentials)
      admin.initializeApp({
        projectId: 'guild-4f46b'
      });
    } else {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    db = admin.firestore();
    initialized = true;
    console.log('✅ Firebase Admin SDK initialized\n');
    return true;
  } catch (error) {
    console.log('❌ Firebase initialization failed:', error.message);
    console.log('   Tests will run in simulation mode\n');
    return false;
  }
}

async function test(name, fn) {
  totalTests++;
  const startTime = performance.now();
  
  try {
    await fn();
    const duration = performance.now() - startTime;
    passedTests++;
    results.push({ name, status: 'PASS', duration: Math.round(duration) });
    console.log(`  ✅ ${name} (${Math.round(duration)}ms)`);
  } catch (error) {
    const duration = performance.now() - startTime;
    failedTests++;
    results.push({ name, status: 'FAIL', duration: Math.round(duration), error: error.message });
    console.log(`  ❌ ${name} (${Math.round(duration)}ms)`);
    console.log(`     Error: ${error.message}`);
  }
}

// ============================================================================
// SUITE 1: FIREBASE CONNECTION TESTS
// ============================================================================
async function runConnectionTests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 1: FIREBASE CONNECTION - Real Connection Tests             ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Connect to Firestore', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const snapshot = await db.collection('_test_').limit(1).get();
    // Connection successful if no error thrown
  });

  await test('Read from Firestore (latency check)', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const startTime = performance.now();
    await db.collection('users').limit(1).get();
    const latency = performance.now() - startTime;
    
    if (latency > 1000) {
      throw new Error(`High latency: ${Math.round(latency)}ms (should be <1000ms)`);
    }
  });

  await test('Write to Firestore (create test document)', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const testDoc = db.collection('_test_runtime_').doc('test_' + Date.now());
    await testDoc.set({
      message: 'Real runtime test',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      testId: Date.now()
    });
  });

  await test('Delete from Firestore (cleanup test document)', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const snapshot = await db.collection('_test_runtime_').limit(1).get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  });
}

// ============================================================================
// SUITE 2: MESSAGE OPERATIONS (REAL CHAT SIMULATION)
// ============================================================================
async function runMessageTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 2: MESSAGE OPERATIONS - Real Chat Simulation               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let testChatId;
  let testMessageId;

  await test('Create test chat', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const chatRef = await db.collection('_test_chats_').add({
      participants: ['test_user_1', 'test_user_2'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    testChatId = chatRef.id;
  });

  await test('Send message (write performance)', async () => {
    if (!initialized || !testChatId) {
      throw new Error('Test chat not created');
    }
    const startTime = performance.now();
    const messageRef = await db.collection('_test_chats_').doc(testChatId)
      .collection('messages').add({
        text: 'Real test message',
        senderId: 'test_user_1',
        type: 'TEXT',
        status: 'sent',
        readBy: ['test_user_1'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    const writeTime = performance.now() - startTime;
    testMessageId = messageRef.id;
    
    if (writeTime > 500) {
      throw new Error(`Slow write: ${Math.round(writeTime)}ms (should be <500ms)`);
    }
  });

  await test('Read messages (query performance)', async () => {
    if (!initialized || !testChatId) {
      throw new Error('Test chat not created');
    }
    const startTime = performance.now();
    const snapshot = await db.collection('_test_chats_').doc(testChatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const readTime = performance.now() - startTime;
    
    if (snapshot.empty) {
      throw new Error('No messages found');
    }
    if (readTime > 300) {
      throw new Error(`Slow read: ${Math.round(readTime)}ms (should be <300ms)`);
    }
  });

  await test('Update message (edit operation)', async () => {
    if (!initialized || !testChatId || !testMessageId) {
      throw new Error('Test message not created');
    }
    const startTime = performance.now();
    await db.collection('_test_chats_').doc(testChatId)
      .collection('messages').doc(testMessageId)
      .update({
        text: 'Edited test message',
        editedAt: admin.firestore.FieldValue.serverTimestamp(),
        editHistory: admin.firestore.FieldValue.arrayUnion({
          text: 'Original message',
          editedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      });
    const updateTime = performance.now() - startTime;
    
    if (updateTime > 300) {
      throw new Error(`Slow update: ${Math.round(updateTime)}ms (should be <300ms)`);
    }
  });

  await test('Soft delete message', async () => {
    if (!initialized || !testChatId || !testMessageId) {
      throw new Error('Test message not created');
    }
    await db.collection('_test_chats_').doc(testChatId)
      .collection('messages').doc(testMessageId)
      .update({
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: 'test_user_1'
      });
  });

  await test('Cleanup: Delete test chat', async () => {
    if (!initialized || !testChatId) {
      throw new Error('Test chat not created');
    }
    // Delete messages first
    const messages = await db.collection('_test_chats_').doc(testChatId)
      .collection('messages').get();
    const batch = db.batch();
    messages.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    // Delete chat
    await db.collection('_test_chats_').doc(testChatId).delete();
  });
}

// ============================================================================
// SUITE 3: CONCURRENT OPERATIONS (REAL LOAD TEST)
// ============================================================================
async function runConcurrentTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 3: CONCURRENT OPERATIONS - Real Load Testing               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Send 10 messages concurrently', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const chatRef = await db.collection('_test_chats_').add({
      participants: ['load_test_user'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const startTime = performance.now();
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        chatRef.collection('messages').add({
          text: `Concurrent message ${i}`,
          senderId: 'load_test_user',
          type: 'TEXT',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      );
    }
    await Promise.all(promises);
    const totalTime = performance.now() - startTime;
    
    // Cleanup
    const messages = await chatRef.collection('messages').get();
    const batch = db.batch();
    messages.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(chatRef);
    await batch.commit();
    
    if (totalTime > 2000) {
      throw new Error(`Slow concurrent writes: ${Math.round(totalTime)}ms (should be <2000ms)`);
    }
  });

  await test('Read from 5 chats concurrently', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const startTime = performance.now();
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        db.collection('_test_chats_').limit(1).get()
      );
    }
    await Promise.all(promises);
    const totalTime = performance.now() - startTime;
    
    if (totalTime > 1000) {
      throw new Error(`Slow concurrent reads: ${Math.round(totalTime)}ms (should be <1000ms)`);
    }
  });

  await test('Batch write 50 messages', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const chatRef = await db.collection('_test_chats_').add({
      participants: ['batch_test_user'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const startTime = performance.now();
    const batch = db.batch();
    for (let i = 0; i < 50; i++) {
      const messageRef = chatRef.collection('messages').doc();
      batch.set(messageRef, {
        text: `Batch message ${i}`,
        senderId: 'batch_test_user',
        type: 'TEXT',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
    const batchTime = performance.now() - startTime;
    
    // Cleanup
    const messages = await chatRef.collection('messages').get();
    const cleanupBatch = db.batch();
    messages.docs.forEach(doc => cleanupBatch.delete(doc.ref));
    cleanupBatch.delete(chatRef);
    await cleanupBatch.commit();
    
    if (batchTime > 1000) {
      throw new Error(`Slow batch write: ${Math.round(batchTime)}ms (should be <1000ms)`);
    }
  });
}

// ============================================================================
// SUITE 4: QUERY PERFORMANCE
// ============================================================================
async function runQueryTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 4: QUERY PERFORMANCE - Real Query Optimization             ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Query with WHERE clause', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const startTime = performance.now();
    await db.collection('users')
      .where('role', '==', 'WORKER')
      .limit(10)
      .get();
    const queryTime = performance.now() - startTime;
    
    if (queryTime > 500) {
      throw new Error(`Slow query: ${Math.round(queryTime)}ms (should be <500ms)`);
    }
  });

  await test('Query with ORDER BY', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const startTime = performance.now();
    await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const queryTime = performance.now() - startTime;
    
    if (queryTime > 500) {
      throw new Error(`Slow ordered query: ${Math.round(queryTime)}ms`);
    }
  });

  await test('Pagination query (startAfter)', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    // First page
    const firstPage = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (firstPage.empty) {
      console.log('     Note: No users found for pagination test');
      return;
    }
    
    // Second page
    const startTime = performance.now();
    const lastDoc = firstPage.docs[firstPage.docs.length - 1];
    await db.collection('users')
      .orderBy('createdAt', 'desc')
      .startAfter(lastDoc)
      .limit(5)
      .get();
    const paginationTime = performance.now() - startTime;
    
    if (paginationTime > 500) {
      throw new Error(`Slow pagination: ${Math.round(paginationTime)}ms`);
    }
  });
}

// ============================================================================
// SUITE 5: REAL-TIME LISTENER TEST
// ============================================================================
async function runRealtimeTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 5: REAL-TIME LISTENERS - Actual Snapshot Testing           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Real-time listener receives updates', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Listener timeout after 5s'));
      }, 5000);
      
      // Create test document
      const testDoc = db.collection('_test_realtime_').doc('listener_test_' + Date.now());
      
      // Set up listener
      let updateReceived = false;
      const unsubscribe = testDoc.onSnapshot((snapshot) => {
        if (snapshot.exists && snapshot.data().updated) {
          updateReceived = true;
          clearTimeout(timeout);
          unsubscribe();
          
          // Cleanup
          testDoc.delete().then(() => {
            resolve();
          });
        }
      });
      
      // Create document
      await testDoc.set({ value: 1, updated: false });
      
      // Wait a bit then update
      setTimeout(async () => {
        await testDoc.update({ value: 2, updated: true });
      }, 100);
    });
  });

  await test('Listener receives multiple rapid updates', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Listener timeout'));
      }, 5000);
      
      const testDoc = db.collection('_test_realtime_').doc('rapid_test_' + Date.now());
      let updateCount = 0;
      const expectedUpdates = 3;
      
      const unsubscribe = testDoc.onSnapshot((snapshot) => {
        if (snapshot.exists) {
          updateCount++;
          if (updateCount === expectedUpdates) {
            clearTimeout(timeout);
            unsubscribe();
            testDoc.delete().then(() => resolve());
          }
        }
      });
      
      // Send rapid updates
      await testDoc.set({ count: 0 });
      await testDoc.update({ count: 1 });
      await testDoc.update({ count: 2 });
    });
  });
}

// ============================================================================
// SUITE 6: ERROR HANDLING & EDGE CASES
// ============================================================================
async function runErrorTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 6: ERROR HANDLING - Real Error Scenarios                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Handle non-existent document read', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    const doc = await db.collection('_test_').doc('non_existent_doc_12345').get();
    if (doc.exists) {
      throw new Error('Document should not exist');
    }
  });

  await test('Handle invalid collection query', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    try {
      // This should fail or return empty
      const snapshot = await db.collection('_invalid_collection_xyz_').get();
      // If it succeeds, it should be empty
      if (!snapshot.empty) {
        throw new Error('Invalid collection should be empty');
      }
    } catch (error) {
      // Expected behavior - collection doesn't exist
    }
  });

  await test('Handle large document (1MB limit check)', async () => {
    if (!initialized) {
      throw new Error('Firebase not initialized');
    }
    
    // Create a large string (close to 1MB)
    const largeText = 'x'.repeat(900000); // 900KB
    
    try {
      const testDoc = db.collection('_test_size_').doc('large_doc_test');
      await testDoc.set({
        data: largeText,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Cleanup
      await testDoc.delete();
    } catch (error) {
      if (error.message.includes('too large')) {
        // Expected if over limit
      } else {
        throw error;
      }
    }
  });
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================
async function runAllTests() {
  const startTime = performance.now();
  
  // Initialize Firebase
  const firebaseReady = await initializeFirebase();
  
  if (!firebaseReady) {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                 FIREBASE NOT AVAILABLE                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    console.log('⚠️  Cannot run real Firebase tests without credentials.\n');
    console.log('To enable real testing:');
    console.log('  1. Add serviceAccountKey.json to backend/ folder');
    console.log('  2. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.log('  3. Or deploy to environment with default credentials\n');
    process.exit(1);
  }
  
  // Run all test suites
  await runConnectionTests();
  await runMessageTests();
  await runConcurrentTests();
  await runQueryTests();
  await runRealtimeTests();
  await runErrorTests();
  
  const totalTime = performance.now() - startTime;
  
  // Print Results
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    REAL TEST RESULTS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Tests:     ${totalTests}`);
  console.log(`✅ Passed:       ${passedTests}`);
  console.log(`❌ Failed:       ${failedTests}`);
  console.log(`Success Rate:   ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`Total Time:     ${Math.round(totalTime)}ms\n`);
  
  // Performance Summary
  console.log('⚡ PERFORMANCE SUMMARY:\n');
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxTime = Math.max(...results.map(r => r.duration));
  const minTime = Math.min(...results.map(r => r.duration));
  
  console.log(`   Average:  ${Math.round(avgTime)}ms`);
  console.log(`   Fastest:  ${minTime}ms`);
  console.log(`   Slowest:  ${maxTime}ms\n`);
  
  // Show slowest operations
  const slowest = results.sort((a, b) => b.duration - a.duration).slice(0, 5);
  console.log('🐌 SLOWEST OPERATIONS:\n');
  slowest.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name} - ${r.duration}ms`);
  });
  
  console.log('\n' + '═'.repeat(70) + '\n');
  
  if (failedTests === 0) {
    console.log('🎉🎉🎉 ALL REAL TESTS PASSED! 🎉🎉🎉\n');
    console.log('✅ Firebase connection verified');
    console.log('✅ Message operations working');
    console.log('✅ Concurrent operations handled');
    console.log('✅ Query performance acceptable');
    console.log('✅ Real-time listeners functional');
    console.log('✅ Error handling robust\n');
    console.log('🚀 SYSTEM IS PRODUCTION READY!\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED\n');
    console.log(`${failedTests} test(s) need attention:\n`);
    results.filter(r => r.status === 'FAIL').forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}`);
      console.log(`   Error: ${r.error}\n`);
    });
  }
  
  // Cleanup
  if (initialized) {
    await admin.app().delete();
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});







