/**
 * Firebase Emulator Integration Tests
 * Tests Firestore rules, Cloud Functions, real-time listeners
 * Runs against local Firebase emulators (no cloud costs)
 */

const admin = require('firebase-admin');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Test configuration
const PROJECT_ID = 'guild-test';
const FIRESTORE_PORT = 8080;
const AUTH_PORT = 9099;
const FUNCTIONS_PORT = 5001;

let testEnv;
let adminApp;
let authenticatedContext;
let unauthenticatedContext;

// Test results
const results = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(name, passed, details) {
  results.totalTests++;
  
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    console.log(`   ${details}`);
  }
  
  results.tests.push({ name, passed, details, timestamp: new Date().toISOString() });
}

/**
 * Setup Firebase Emulators
 */
async function setupEmulators() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      FIREBASE EMULATOR INTEGRATION TESTS                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🔧 Setting up Firebase emulators...\n');
  
  // Load Firestore rules
  const rulesPath = path.join(__dirname, '../../firestore.rules');
  const rules = fs.existsSync(rulesPath) 
    ? fs.readFileSync(rulesPath, 'utf8')
    : `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
`;
  
  // Initialize test environment
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: 'localhost',
      port: FIRESTORE_PORT
    },
    auth: {
      host: 'localhost',
      port: AUTH_PORT
    }
  });
  
  // Clear data before tests
  await testEnv.clearFirestore();
  
  // Create test contexts
  authenticatedContext = testEnv.authenticatedContext('test-user-1', {
    email: 'test@example.com',
    uid: 'test-user-1'
  });
  
  unauthenticatedContext = testEnv.unauthenticatedContext();
  
  console.log('✅ Emulators ready\n');
}

/**
 * Test 1: Firestore Security Rules - Authentication Required
 */
async function testFirestoreSecurityRules() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      TEST 1: FIRESTORE SECURITY RULES                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  // Test 1.1: Unauthenticated read should fail
  try {
    await assertFails(
      unauthenticatedContext.firestore().collection('jobs').doc('test-job').get()
    );
    logTest('Unauthenticated read blocked', true, 'Security rules working');
  } catch (error) {
    logTest('Unauthenticated read blocked', false, error.message);
  }
  
  // Test 1.2: Unauthenticated write should fail
  try {
    await assertFails(
      unauthenticatedContext.firestore().collection('jobs').doc('test-job').set({ title: 'Test' })
    );
    logTest('Unauthenticated write blocked', true, 'Security rules working');
  } catch (error) {
    logTest('Unauthenticated write blocked', false, error.message);
  }
  
  // Test 1.3: Authenticated read should succeed
  try {
    await assertSucceeds(
      authenticatedContext.firestore().collection('jobs').doc('test-job').get()
    );
    logTest('Authenticated read allowed', true, 'Security rules working');
  } catch (error) {
    logTest('Authenticated read allowed', false, error.message);
  }
  
  // Test 1.4: Authenticated write should succeed
  try {
    await assertSucceeds(
      authenticatedContext.firestore().collection('jobs').doc('test-job').set({
        title: 'Test Job',
        posterId: 'test-user-1',
        budget: 100,
        createdAt: new Date()
      })
    );
    logTest('Authenticated write allowed', true, 'Security rules working');
  } catch (error) {
    logTest('Authenticated write allowed', false, error.message);
  }
  
  // Test 1.5: User can only modify their own data
  try {
    await assertFails(
      authenticatedContext.firestore().collection('jobs').doc('other-user-job').set({
        title: 'Test',
        posterId: 'other-user',  // Different user
        budget: 100
      })
    );
    logTest('Cannot modify other user data', true, 'Ownership check working');
  } catch (error) {
    logTest('Cannot modify other user data', false, error.message);
  }
  
  console.log();
}

/**
 * Test 2: Real-time Listeners
 */
async function testRealtimeListeners() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      TEST 2: REAL-TIME LISTENERS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const jobsRef = authenticatedContext.firestore().collection('jobs');
  
  // Test 2.1: Listener receives initial data
  try {
    let dataReceived = false;
    
    const unsubscribe = jobsRef.onSnapshot((snapshot) => {
      dataReceived = true;
      unsubscribe();
    });
    
    // Wait for listener to fire
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (dataReceived) {
      logTest('Real-time listener receives data', true, 'Listener fired correctly');
    } else {
      logTest('Real-time listener receives data', false, 'Listener did not fire');
    }
  } catch (error) {
    logTest('Real-time listener receives data', false, error.message);
  }
  
  // Test 2.2: Listener detects new documents
  try {
    let changeDetected = false;
    
    const unsubscribe = jobsRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          changeDetected = true;
        }
      });
    });
    
    // Add a new document
    await jobsRef.doc('realtime-test').set({
      title: 'Real-time Test Job',
      posterId: 'test-user-1',
      budget: 200
    });
    
    // Wait for change detection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    unsubscribe();
    
    if (changeDetected) {
      logTest('Listener detects new documents', true, 'Real-time updates working');
    } else {
      logTest('Listener detects new documents', false, 'Change not detected');
    }
  } catch (error) {
    logTest('Listener detects new documents', false, error.message);
  }
  
  // Test 2.3: Listener detects updates
  try {
    let updateDetected = false;
    
    const docRef = jobsRef.doc('update-test');
    await docRef.set({ title: 'Original', budget: 100, posterId: 'test-user-1' });
    
    const unsubscribe = docRef.onSnapshot((snapshot) => {
      if (snapshot.exists && snapshot.data().title === 'Updated') {
        updateDetected = true;
      }
    });
    
    // Update document
    await docRef.update({ title: 'Updated' });
    
    // Wait for update detection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    unsubscribe();
    
    if (updateDetected) {
      logTest('Listener detects document updates', true, 'Update notifications working');
    } else {
      logTest('Listener detects document updates', false, 'Update not detected');
    }
  } catch (error) {
    logTest('Listener detects document updates', false, error.message);
  }
  
  console.log();
}

/**
 * Test 3: Transactions and Batches
 */
async function testTransactionsAndBatches() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      TEST 3: TRANSACTIONS & BATCHES                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const db = authenticatedContext.firestore();
  
  // Test 3.1: Transaction atomicity
  try {
    const counterRef = db.collection('counters').doc('test-counter');
    await counterRef.set({ count: 0 });
    
    // Run 10 concurrent transactions
    const promises = Array(10).fill(null).map(() =>
      db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        const currentCount = doc.data().count;
        transaction.update(counterRef, { count: currentCount + 1 });
      })
    );
    
    await Promise.all(promises);
    
    const finalDoc = await counterRef.get();
    const finalCount = finalDoc.data().count;
    
    if (finalCount === 10) {
      logTest('Transaction atomicity', true, 'All 10 increments succeeded');
    } else {
      logTest('Transaction atomicity', false, `Expected 10, got ${finalCount}`);
    }
  } catch (error) {
    logTest('Transaction atomicity', false, error.message);
  }
  
  // Test 3.2: Batch writes
  try {
    const batch = db.batch();
    
    for (let i = 0; i < 10; i++) {
      const docRef = db.collection('batch-test').doc(`doc-${i}`);
      batch.set(docRef, { value: i, timestamp: new Date() });
    }
    
    await batch.commit();
    
    const snapshot = await db.collection('batch-test').get();
    
    if (snapshot.size === 10) {
      logTest('Batch writes', true, 'All 10 documents written');
    } else {
      logTest('Batch writes', false, `Expected 10 docs, got ${snapshot.size}`);
    }
  } catch (error) {
    logTest('Batch writes', false, error.message);
  }
  
  console.log();
}

/**
 * Test 4: Complex Queries
 */
async function testComplexQueries() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      TEST 4: COMPLEX QUERIES                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const db = authenticatedContext.firestore();
  const jobsRef = db.collection('jobs');
  
  // Seed test data
  const testJobs = [
    { title: 'Job 1', category: 'Development', budget: 1000, status: 'OPEN' },
    { title: 'Job 2', category: 'Development', budget: 2000, status: 'OPEN' },
    { title: 'Job 3', category: 'Design', budget: 1500, status: 'OPEN' },
    { title: 'Job 4', category: 'Design', budget: 500, status: 'CLOSED' },
  ];
  
  for (let i = 0; i < testJobs.length; i++) {
    await jobsRef.doc(`query-test-${i}`).set({
      ...testJobs[i],
      posterId: 'test-user-1',
      createdAt: new Date(Date.now() + i * 1000)
    });
  }
  
  // Test 4.1: Where clause
  try {
    const snapshot = await jobsRef.where('category', '==', 'Development').get();
    
    if (snapshot.size === 2) {
      logTest('Where clause filtering', true, 'Correct number of results');
    } else {
      logTest('Where clause filtering', false, `Expected 2, got ${snapshot.size}`);
    }
  } catch (error) {
    logTest('Where clause filtering', false, error.message);
  }
  
  // Test 4.2: Compound query
  try {
    const snapshot = await jobsRef
      .where('category', '==', 'Development')
      .where('budget', '>', 1500)
      .get();
    
    if (snapshot.size === 1) {
      logTest('Compound query', true, 'Filtered correctly');
    } else {
      logTest('Compound query', false, `Expected 1, got ${snapshot.size}`);
    }
  } catch (error) {
    logTest('Compound query', false, error.message);
  }
  
  // Test 4.3: OrderBy + Limit
  try {
    const snapshot = await jobsRef
      .orderBy('budget', 'desc')
      .limit(2)
      .get();
    
    const budgets = snapshot.docs.map(doc => doc.data().budget);
    
    if (budgets[0] === 2000 && budgets[1] === 1500) {
      logTest('OrderBy and Limit', true, 'Sorted and limited correctly');
    } else {
      logTest('OrderBy and Limit', false, `Unexpected order: ${budgets.join(', ')}`);
    }
  } catch (error) {
    logTest('OrderBy and Limit', false, error.message);
  }
  
  console.log();
}

/**
 * Cleanup
 */
async function cleanup() {
  console.log('🧹 Cleaning up...\n');
  
  if (testEnv) {
    await testEnv.cleanup();
  }
}

/**
 * Generate report
 */
function generateReport() {
  const reportPath = path.join(__dirname, '../../test-reports/firebase/emulator-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      FIREBASE EMULATOR TEST - FINAL REPORT                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Results:`);
  console.log(`   Total Tests: ${results.totalTests}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}\n`);
  
  console.log(`📄 Report saved: ${reportPath}\n`);
  
  if (results.failed === 0) {
    console.log('✅ ALL FIREBASE EMULATOR TESTS PASSED\n');
    return 0;
  } else {
    console.log('❌ SOME TESTS FAILED\n');
    return 1;
  }
}

/**
 * Main execution
 */
async function runEmulatorTests() {
  try {
    await setupEmulators();
    await testFirestoreSecurityRules();
    await testRealtimeListeners();
    await testTransactionsAndBatches();
    await testComplexQueries();
    await cleanup();
    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Emulator test failed:', error);
    await cleanup();
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  console.log('⚠️  Make sure Firebase emulators are running:');
  console.log('   firebase emulators:start\n');
  
  runEmulatorTests();
}

module.exports = { runEmulatorTests };






