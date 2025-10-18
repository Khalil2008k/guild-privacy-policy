/**
 * Firebase Firestore Load Test
 * Real 10,000+ document inserts, query performance, concurrent writes
 * Tests: Write throughput, read latency, index performance, transaction atomicity
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  path.join(__dirname, '../../backend/serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account key not found!');
  console.error(`   Looking for: ${serviceAccountPath}`);
  console.error('   Set FIREBASE_SERVICE_ACCOUNT environment variable');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Test configuration
const CONFIG = {
  jobsToCreate: 10000,
  batchSize: 500,          // Firestore batch limit
  concurrentBatches: 10,
  usersToCreate: 1000,
  offersPerJob: 3,
  transactionsToTest: 500
};

// Metrics
const metrics = {
  startTime: Date.now(),
  writeOperations: 0,
  readOperations: 0,
  writeTimes: [],
  readTimes: [],
  batchTimes: [],
  queryTimes: [],
  transactionSuccesses: 0,
  transactionFailures: 0,
  errors: []
};

/**
 * Generate random job data
 */
function generateJob(id, userId) {
  return {
    id: `loadtest-job-${id}`,
    posterId: userId,
    title: `Load Test Job ${id} - ${Math.random().toString(36).substring(7)}`,
    description: `This is a load test job description with enough content to simulate real-world data. Job ID: ${id}. Created at: ${new Date().toISOString()}. This helps test database performance under realistic conditions.`,
    category: ['Development', 'Design', 'Writing', 'Marketing'][Math.floor(Math.random() * 4)],
    budget: Math.floor(Math.random() * 5000) + 100,
    duration: ['1 week', '2 weeks', '1 month'][Math.floor(Math.random() * 3)],
    status: 'OPEN',
    skills: ['skill1', 'skill2', 'skill3'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    viewCount: 0,
    offerCount: 0
  };
}

/**
 * Test 1: Bulk Insert - 10,000 Jobs
 */
async function testBulkInsert() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TEST 1: BULK INSERT - 10,000 JOBS                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  const totalJobs = CONFIG.jobsToCreate;
  const batchSize = CONFIG.batchSize;
  const concurrentBatches = CONFIG.concurrentBatches;
  
  console.log(`📊 Configuration:`);
  console.log(`   Total Jobs: ${totalJobs}`);
  console.log(`   Batch Size: ${batchSize}`);
  console.log(`   Concurrent Batches: ${concurrentBatches}\n`);
  
  let completedJobs = 0;
  
  // Create batches
  const batches = [];
  for (let i = 0; i < totalJobs; i += batchSize) {
    const batch = db.batch();
    const batchEnd = Math.min(i + batchSize, totalJobs);
    
    for (let j = i; j < batchEnd; j++) {
      const jobRef = db.collection('jobs').doc();
      const jobData = generateJob(j, `user-${Math.floor(Math.random() * 100)}`);
      batch.set(jobRef, jobData);
    }
    
    batches.push(batch);
  }
  
  console.log(`📦 Created ${batches.length} batches\n`);
  console.log('⏳ Writing to Firestore...');
  
  // Execute batches concurrently
  const batchPromises = [];
  for (let i = 0; i < batches.length; i += concurrentBatches) {
    const batchGroup = batches.slice(i, i + concurrentBatches);
    
    const batchGroupStart = Date.now();
    const promises = batchGroup.map(async (batch, index) => {
      try {
        await batch.commit();
        completedJobs += batchSize;
        metrics.writeOperations += batchSize;
        
        // Progress indicator
        if (completedJobs % 1000 === 0) {
          console.log(`   ✅ ${completedJobs}/${totalJobs} jobs written`);
        }
      } catch (error) {
        metrics.errors.push({ operation: 'batch_write', error: error.message });
        console.error(`   ❌ Batch ${index} failed:`, error.message);
      }
    });
    
    await Promise.all(promises);
    
    const batchGroupTime = Date.now() - batchGroupStart;
    metrics.batchTimes.push(batchGroupTime);
  }
  
  const totalTime = Date.now() - startTime;
  const throughput = (totalJobs / (totalTime / 1000)).toFixed(2);
  
  console.log(`\n✅ Bulk insert complete:`);
  console.log(`   Jobs Written: ${completedJobs}`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   Throughput: ${throughput} writes/second\n`);
  
  return { completedJobs, totalTime, throughput };
}

/**
 * Test 2: Query Performance
 */
async function testQueryPerformance() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TEST 2: QUERY PERFORMANCE                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const queries = [
    { name: 'Simple query (limit 20)', fn: () => db.collection('jobs').limit(20).get() },
    { name: 'Filtered query (category)', fn: () => db.collection('jobs').where('category', '==', 'Development').limit(20).get() },
    { name: 'Sorted query (createdAt)', fn: () => db.collection('jobs').orderBy('createdAt', 'desc').limit(20).get() },
    { name: 'Complex query (category + sort)', fn: () => db.collection('jobs').where('category', '==', 'Development').orderBy('createdAt', 'desc').limit(20).get() },
    { name: 'Large result set (limit 100)', fn: () => db.collection('jobs').limit(100).get() },
  ];
  
  for (const query of queries) {
    const times = [];
    const iterations = 10;
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        const snapshot = await query.fn();
        const time = Date.now() - start;
        times.push(time);
        metrics.readOperations++;
        metrics.queryTimes.push(time);
        
        if (i === 0) {
          console.log(`📊 ${query.name}:`);
          console.log(`   Documents: ${snapshot.size}`);
        }
      } catch (error) {
        console.error(`   ❌ Query failed:`, error.message);
        metrics.errors.push({ operation: 'query', query: query.name, error: error.message });
      }
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`   Avg: ${avg.toFixed(2)}ms | Min: ${min}ms | Max: ${max}ms`);
    
    if (avg > 1000) {
      console.log(`   ⚠️  WARNING: Slow query detected! Consider adding index.\n`);
    } else {
      console.log(`   ✅ Performance OK\n`);
    }
  }
}

/**
 * Test 3: Concurrent Writes (Race Condition Test)
 */
async function testConcurrentWrites() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TEST 3: CONCURRENT WRITES & TRANSACTIONS              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const testDocRef = db.collection('test_concurrency').doc('counter');
  
  // Initialize counter
  await testDocRef.set({ count: 0, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
  
  console.log('📊 Testing 100 concurrent increments...\n');
  
  const concurrentIncrements = 100;
  const promises = [];
  
  for (let i = 0; i < concurrentIncrements; i++) {
    promises.push(
      db.runTransaction(async (transaction) => {
        const doc = await transaction.get(testDocRef);
        const currentCount = doc.data().count || 0;
        transaction.update(testDocRef, { 
          count: currentCount + 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        metrics.transactionSuccesses++;
      }).catch(error => {
        metrics.transactionFailures++;
        metrics.errors.push({ operation: 'transaction', error: error.message });
      })
    );
  }
  
  await Promise.all(promises);
  
  // Verify final count
  const finalDoc = await testDocRef.get();
  const finalCount = finalDoc.data().count;
  
  console.log(`📊 Results:`);
  console.log(`   Expected: ${concurrentIncrements}`);
  console.log(`   Actual: ${finalCount}`);
  console.log(`   Successes: ${metrics.transactionSuccesses}`);
  console.log(`   Failures: ${metrics.transactionFailures}\n`);
  
  if (finalCount === concurrentIncrements) {
    console.log('✅ Transaction atomicity verified - no race conditions\n');
  } else {
    console.log('❌ Race condition detected! Expected count mismatch\n');
  }
  
  // Cleanup
  await testDocRef.delete();
}

/**
 * Test 4: Read Latency Under Load
 */
async function testReadLatency() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TEST 4: READ LATENCY UNDER LOAD                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const concurrentReads = 100;
  const iterations = 5;
  
  console.log(`📊 Configuration:`);
  console.log(`   Concurrent Reads: ${concurrentReads}`);
  console.log(`   Iterations: ${iterations}\n`);
  
  for (let iter = 0; iter < iterations; iter++) {
    const start = Date.now();
    const readPromises = [];
    
    for (let i = 0; i < concurrentReads; i++) {
      readPromises.push(
        db.collection('jobs').limit(10).get()
          .then(() => metrics.readOperations++)
          .catch(error => metrics.errors.push({ operation: 'concurrent_read', error: error.message }))
      );
    }
    
    await Promise.all(readPromises);
    
    const time = Date.now() - start;
    metrics.readTimes.push(time);
    
    console.log(`   Iteration ${iter + 1}: ${concurrentReads} reads in ${time}ms (${(concurrentReads / (time / 1000)).toFixed(2)} reads/sec)`);
  }
  
  const avgReadTime = metrics.readTimes.reduce((a, b) => a + b, 0) / metrics.readTimes.length;
  console.log(`\n✅ Average: ${avgReadTime.toFixed(2)}ms for ${concurrentReads} concurrent reads\n`);
}

/**
 * Test 5: Cleanup
 */
async function cleanup() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         CLEANUP: REMOVING TEST DATA                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🗑️  Deleting test jobs...');
  
  // Delete in batches
  const batchSize = 500;
  let deletedCount = 0;
  
  while (true) {
    const snapshot = await db.collection('jobs')
      .where('id', '>=', 'loadtest-job-')
      .where('id', '<=', 'loadtest-job-~')
      .limit(batchSize)
      .get();
    
    if (snapshot.empty) break;
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    deletedCount += snapshot.size;
    console.log(`   Deleted ${deletedCount} jobs...`);
  }
  
  console.log(`\n✅ Cleanup complete: ${deletedCount} jobs deleted\n`);
}

/**
 * Generate final report
 */
function generateReport() {
  const totalTime = Date.now() - metrics.startTime;
  
  const avgWriteTime = metrics.writeTimes.length > 0
    ? metrics.writeTimes.reduce((a, b) => a + b, 0) / metrics.writeTimes.length
    : 0;
  
  const avgQueryTime = metrics.queryTimes.length > 0
    ? metrics.queryTimes.reduce((a, b) => a + b, 0) / metrics.queryTimes.length
    : 0;
  
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${(totalTime / 1000).toFixed(2)}s`,
    configuration: CONFIG,
    results: {
      writeOperations: metrics.writeOperations,
      readOperations: metrics.readOperations,
      avgWriteTime: `${avgWriteTime.toFixed(2)}ms`,
      avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
      transactionSuccesses: metrics.transactionSuccesses,
      transactionFailures: metrics.transactionFailures,
      errors: metrics.errors.length
    },
    verdict: metrics.errors.length === 0 && metrics.transactionFailures === 0 ? 'PASS' : 'FAIL'
  };
  
  const reportPath = path.join(__dirname, '../../test-reports/database/firestore-load-test.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         FIRESTORE LOAD TEST - FINAL REPORT                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Performance Metrics:`);
  console.log(`   Total Time: ${report.duration}`);
  console.log(`   Write Operations: ${report.results.writeOperations}`);
  console.log(`   Read Operations: ${report.results.readOperations}`);
  console.log(`   Avg Write Time: ${report.results.avgWriteTime}`);
  console.log(`   Avg Query Time: ${report.results.avgQueryTime}`);
  console.log(`   Transaction Success Rate: ${metrics.transactionSuccesses}/${metrics.transactionSuccesses + metrics.transactionFailures}`);
  console.log(`   Errors: ${report.results.errors}\n`);
  
  console.log(`📄 Report saved: ${reportPath}\n`);
  
  if (report.verdict === 'PASS') {
    console.log('✅ FIRESTORE LOAD TEST PASSED\n');
  } else {
    console.log('❌ FIRESTORE LOAD TEST FAILED\n');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function runLoadTest() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         FIRESTORE DATABASE LOAD TEST                          ║');
  console.log('║         Real 10,000+ Document Operations                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  try {
    await testBulkInsert();
    await testQueryPerformance();
    await testConcurrentWrites();
    await testReadLatency();
    await cleanup();
    generateReport();
  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  runLoadTest();
}

module.exports = { runLoadTest };






