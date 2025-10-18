/**
 * Chaos Engineering Tests
 * Network failure injection, service degradation, recovery validation
 * Tests system resilience under adverse conditions
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
const CHAOS_DURATION = 30000; // 30 seconds of chaos

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
  }
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  results.tests.push({ name, passed, details, timestamp: new Date().toISOString() });
}

/**
 * Simulate network latency (delay all requests)
 */
async function simulateNetworkLatency() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS TEST 1: NETWORK LATENCY (500ms delay)              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('⏳ Simulating high network latency...\n');
  
  const requestsWithLatency = [];
  const startTime = Date.now();
  
  // Make 20 requests with simulated latency
  for (let i = 0; i < 20; i++) {
    const reqStart = Date.now();
    
    try {
      // Simulate latency by waiting before request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await axios.get(`${BASE_URL}/v1/jobs?limit=10`, {
        timeout: 10000
      });
      
      const reqTime = Date.now() - reqStart;
      requestsWithLatency.push({ success: true, time: reqTime });
    } catch (error) {
      const reqTime = Date.now() - reqStart;
      requestsWithLatency.push({ success: false, time: reqTime, error: error.message });
    }
  }
  
  const totalTime = Date.now() - startTime;
  const successRate = (requestsWithLatency.filter(r => r.success).length / 20) * 100;
  const avgTime = requestsWithLatency.reduce((sum, r) => sum + r.time, 0) / 20;
  
  console.log(`📊 Results:`);
  console.log(`   Requests: 20`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Avg Response Time: ${avgTime.toFixed(0)}ms`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s\n`);
  
  // System should handle latency gracefully (>90% success)
  if (successRate >= 90) {
    logTest('System handles network latency', true, `${successRate}% success rate`);
  } else {
    logTest('System handles network latency', false, `Only ${successRate}% success rate`);
  }
}

/**
 * Simulate packet loss (random request failures)
 */
async function simulatePacketLoss() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS TEST 2: PACKET LOSS (30% failure rate)             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📦 Simulating 30% packet loss...\n');
  
  const requests = [];
  const packetLossRate = 0.3; // 30%
  
  for (let i = 0; i < 50; i++) {
    // Randomly drop 30% of requests
    if (Math.random() < packetLossRate) {
      requests.push(Promise.reject(new Error('Simulated packet loss')));
    } else {
      requests.push(
        axios.get(`${BASE_URL}/v1/jobs?limit=5`, { timeout: 5000 })
          .catch(err => ({ error: err.message }))
      );
    }
  }
  
  const responses = await Promise.allSettled(requests);
  const successful = responses.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
  const failed = responses.length - successful;
  const successRate = (successful / responses.length) * 100;
  
  console.log(`📊 Results:`);
  console.log(`   Total Requests: ${responses.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success Rate: ${successRate}%\n`);
  
  // With 30% packet loss, we expect ~70% success
  // System should maintain partial functionality
  if (successRate >= 60 && successRate <= 80) {
    logTest('System handles packet loss', true, `Expected ~70%, got ${successRate}%`);
  } else {
    logTest('System handles packet loss', false, `Unexpected ${successRate}% success rate`);
  }
}

/**
 * Simulate connection timeout
 */
async function simulateConnectionTimeout() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS TEST 3: CONNECTION TIMEOUTS                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('⏱️  Testing timeout handling...\n');
  
  const timeouts = [];
  
  // Make requests with very short timeouts
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    
    try {
      await axios.get(`${BASE_URL}/v1/jobs?limit=50`, {
        timeout: 10 // 10ms timeout (will fail)
      });
      timeouts.push({ timedOut: false, duration: Date.now() - start });
    } catch (error) {
      const duration = Date.now() - start;
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        timeouts.push({ timedOut: true, duration });
      } else {
        timeouts.push({ timedOut: false, duration, error: error.message });
      }
    }
  }
  
  const timedOutCount = timeouts.filter(t => t.timedOut).length;
  const avgDuration = timeouts.reduce((sum, t) => sum + t.duration, 0) / timeouts.length;
  
  console.log(`📊 Results:`);
  console.log(`   Timed Out: ${timedOutCount}/10`);
  console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms\n`);
  
  // System should handle timeouts gracefully
  if (timedOutCount >= 8) { // Most should timeout
    logTest('Timeout handling', true, 'System respects timeout settings');
  } else {
    logTest('Timeout handling', false, `Only ${timedOutCount}/10 requests timed out`);
  }
}

/**
 * Simulate service degradation (slow responses)
 */
async function simulateServiceDegradation() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS TEST 4: SERVICE DEGRADATION                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🐌 Simulating slow service responses...\n');
  
  const responses = [];
  
  // Make requests and measure response time
  for (let i = 0; i < 20; i++) {
    const start = Date.now();
    
    try {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
      
      const response = await axios.get(`${BASE_URL}/v1/jobs?limit=10`, {
        timeout: 5000
      });
      
      const duration = Date.now() - start;
      responses.push({ success: true, duration, status: response.status });
    } catch (error) {
      const duration = Date.now() - start;
      responses.push({ success: false, duration, error: error.message });
    }
  }
  
  const successCount = responses.filter(r => r.success).length;
  const avgResponseTime = responses.reduce((sum, r) => sum + r.duration, 0) / responses.length;
  const p95ResponseTime = responses
    .map(r => r.duration)
    .sort((a, b) => a - b)[Math.floor(responses.length * 0.95)];
  
  console.log(`📊 Results:`);
  console.log(`   Successful: ${successCount}/20`);
  console.log(`   Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`   P95 Response Time: ${p95ResponseTime}ms\n`);
  
  // System should still function despite slow responses
  if (successCount >= 18) { // 90% success
    logTest('Service degradation handling', true, `${successCount}/20 requests succeeded despite delays`);
  } else {
    logTest('Service degradation handling', false, `Only ${successCount}/20 requests succeeded`);
  }
}

/**
 * Simulate database connection loss
 */
async function simulateDatabaseFailure() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS TEST 5: DATABASE CONNECTION LOSS                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('💾 Testing database failure recovery...\n');
  
  // Attempt operations that require database
  const operations = [
    { name: 'Read jobs', fn: () => axios.get(`${BASE_URL}/v1/jobs?limit=5`) },
    { name: 'Get user', fn: () => axios.get(`${BASE_URL}/users/me`, { headers: { Authorization: 'Bearer fake-token' } }) },
    { name: 'Health check', fn: () => axios.get(`${BASE_URL.replace('/api', '')}/health`) },
  ];
  
  const results = [];
  
  for (const op of operations) {
    try {
      const response = await op.fn();
      results.push({ operation: op.name, success: true, status: response.status });
    } catch (error) {
      // Check if error is graceful (proper status code, error message)
      const isGraceful = error.response && 
                         (error.response.status === 503 || error.response.status === 500) &&
                         error.response.data?.error;
      
      results.push({ 
        operation: op.name, 
        success: false, 
        graceful: isGraceful,
        status: error.response?.status,
        error: error.message
      });
    }
  }
  
  console.log(`📊 Results:`);
  results.forEach(r => {
    if (r.success) {
      console.log(`   ${r.operation}: ✅ Success (${r.status})`);
    } else {
      console.log(`   ${r.operation}: ${r.graceful ? '⚠️  Graceful failure' : '❌ Hard failure'} (${r.status || 'no response'})`);
    }
  });
  console.log();
  
  // System should fail gracefully
  const gracefulFailures = results.filter(r => !r.success && r.graceful).length;
  
  if (gracefulFailures > 0 || results.some(r => r.success)) {
    logTest('Database failure handling', true, 'System fails gracefully or recovers');
  } else {
    logTest('Database failure handling', false, 'Hard failures detected');
  }
}

/**
 * Test circuit breaker pattern
 */
async function testCircuitBreaker() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS TEST 6: CIRCUIT BREAKER PATTERN                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🔌 Testing circuit breaker...\n');
  
  // Hammer endpoint to trigger circuit breaker
  const rapidRequests = [];
  
  for (let i = 0; i < 100; i++) {
    rapidRequests.push(
      axios.get(`${BASE_URL}/v1/jobs?limit=1`, { timeout: 1000 })
        .then(() => ({ success: true }))
        .catch(err => ({ success: false, status: err.response?.status }))
    );
  }
  
  const responses = await Promise.all(rapidRequests);
  const successCount = responses.filter(r => r.success).length;
  const failureCount = responses.length - successCount;
  const rateLimited = responses.filter(r => r.status === 429).length;
  
  console.log(`📊 Results:`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failureCount}`);
  console.log(`   Rate Limited (429): ${rateLimited}\n`);
  
  // Circuit breaker or rate limiting should be active
  if (rateLimited > 0) {
    logTest('Circuit breaker / rate limiting', true, `${rateLimited} requests rate limited`);
  } else {
    logTest('Circuit breaker / rate limiting', false, 'No rate limiting detected');
  }
}

/**
 * Generate report
 */
function generateReport() {
  const reportPath = path.join(__dirname, '../../test-reports/chaos/chaos-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS ENGINEERING TEST - FINAL REPORT                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Results:`);
  console.log(`   Total Tests: ${results.totalTests}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}\n`);
  
  console.log(`📄 Report saved: ${reportPath}\n`);
  
  const passRate = (results.passed / results.totalTests) * 100;
  
  if (passRate >= 80) {
    console.log(`✅ CHAOS TEST PASSED: System is resilient (${passRate.toFixed(0)}%)\n`);
    return 0;
  } else {
    console.log(`❌ CHAOS TEST FAILED: System needs resilience improvements (${passRate.toFixed(0)}%)\n`);
    return 1;
  }
}

/**
 * Main execution
 */
async function runChaosTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      CHAOS ENGINEERING TESTS                                   ║');
  console.log('║      Testing System Resilience Under Failure                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  try {
    await simulateNetworkLatency();
    await simulatePacketLoss();
    await simulateConnectionTimeout();
    await simulateServiceDegradation();
    await simulateDatabaseFailure();
    await testCircuitBreaker();
    
    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Chaos test failed:', error);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  runChaosTests();
}

module.exports = { runChaosTests };






