/**
 * Artillery Custom Processor
 * Advanced request/response hooks for validation and monitoring
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Metrics collection
const metrics = {
  authTokens: new Set(),
  jobsCreated: [],
  errors: [],
  responseTimes: [],
  memorySnapshots: [],
  concurrentUsers: 0,
  peakConcurrentUsers: 0
};

// Log file setup
const logDir = path.join(__dirname, '../../test-reports/artillery');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const timestamp = Date.now();
const errorLogPath = path.join(logDir, `errors-${timestamp}.log`);
const metricsLogPath = path.join(logDir, `metrics-${timestamp}.json`);

/**
 * Hook: Before scenario starts
 */
function beforeScenario(context, events, done) {
  metrics.concurrentUsers++;
  if (metrics.concurrentUsers > metrics.peakConcurrentUsers) {
    metrics.peakConcurrentUsers = metrics.concurrentUsers;
  }
  
  // Generate unique test ID
  context.vars.testId = `test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  context.vars.startTime = Date.now();
  
  return done();
}

/**
 * Hook: After scenario completes
 */
function afterScenario(context, events, done) {
  metrics.concurrentUsers--;
  
  const duration = Date.now() - context.vars.startTime;
  metrics.responseTimes.push(duration);
  
  // Memory snapshot every 100 scenarios
  if (metrics.responseTimes.length % 100 === 0) {
    const memUsage = process.memoryUsage();
    metrics.memorySnapshots.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    });
    
    // Check for memory leaks (heap growth > 50%)
    if (metrics.memorySnapshots.length > 2) {
      const initial = metrics.memorySnapshots[0].heapUsed;
      const current = memUsage.heapUsed;
      const growth = ((current - initial) / initial) * 100;
      
      if (growth > 50) {
        console.warn(`⚠️  MEMORY LEAK DETECTED: ${growth.toFixed(2)}% heap growth`);
        fs.appendFileSync(errorLogPath, 
          `[MEMORY LEAK] ${new Date().toISOString()}: ${growth.toFixed(2)}% heap growth\n`
        );
      }
    }
  }
  
  return done();
}

/**
 * Hook: After response received
 */
function afterResponse(requestParams, response, context, events, done) {
  const { statusCode, headers, body } = response;
  const url = requestParams.url;
  
  // Log errors
  if (statusCode >= 400) {
    const error = {
      timestamp: new Date().toISOString(),
      url,
      statusCode,
      method: requestParams.method || 'GET',
      body: body ? body.substring(0, 500) : 'No body',
      testId: context.vars.testId
    };
    
    metrics.errors.push(error);
    
    // Write to error log
    fs.appendFileSync(errorLogPath, 
      `[ERROR] ${error.timestamp} | ${error.method} ${url} | ${statusCode} | ${error.body}\n`
    );
  }
  
  // Validate response structure based on endpoint
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    validateAuthResponse(response, context, events);
  } else if (url.includes('/jobs')) {
    validateJobResponse(response, context, events);
  }
  
  return done();
}

/**
 * Custom function: Capture auth metrics
 */
function captureAuthMetrics(context, events, done) {
  if (context.vars.authToken) {
    metrics.authTokens.add(context.vars.authToken);
    
    // Validate JWT format
    const tokenParts = context.vars.authToken.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid JWT format:', context.vars.authToken.substring(0, 20));
      events.emit('error', 'Invalid JWT format');
    }
    
    // Check token uniqueness (no duplicates)
    if (metrics.authTokens.size % 1000 === 0) {
      console.log(`✅ Generated ${metrics.authTokens.size} unique auth tokens`);
    }
  }
  
  return done();
}

/**
 * Custom function: Validate token format
 */
function validateTokenFormat(context, events, done) {
  const token = context.vars.authToken;
  
  if (!token) {
    console.error('❌ No auth token received');
    events.emit('error', 'Missing auth token');
    return done();
  }
  
  // JWT validation
  try {
    const [header, payload, signature] = token.split('.');
    
    if (!header || !payload || !signature) {
      throw new Error('Invalid JWT structure');
    }
    
    // Decode payload (base64)
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64').toString()
    );
    
    // Validate expiration
    if (!decodedPayload.exp) {
      throw new Error('Token missing expiration');
    }
    
    const expiresIn = decodedPayload.exp - Math.floor(Date.now() / 1000);
    if (expiresIn < 0) {
      throw new Error('Token already expired');
    }
    
    if (expiresIn > 86400) {
      console.warn(`⚠️  Token expires in ${expiresIn}s (>24h, security risk)`);
    }
    
    // Store for analysis
    context.vars.tokenExpiry = decodedPayload.exp;
    context.vars.userId = decodedPayload.uid || decodedPayload.sub;
    
  } catch (error) {
    console.error('❌ Token validation failed:', error.message);
    events.emit('error', `Token validation: ${error.message}`);
  }
  
  return done();
}

/**
 * Validate authentication response
 */
function validateAuthResponse(response, context, events) {
  try {
    const data = typeof response.body === 'string' 
      ? JSON.parse(response.body) 
      : response.body;
    
    // Check required fields
    const requiredFields = ['token', 'user'];
    for (const field of requiredFields) {
      if (!data[field]) {
        events.emit('error', `Missing field in auth response: ${field}`);
      }
    }
    
    // Validate user object
    if (data.user) {
      if (!data.user.id && !data.user.uid) {
        events.emit('error', 'User object missing ID');
      }
      if (!data.user.email) {
        events.emit('error', 'User object missing email');
      }
    }
    
    // Check for sensitive data leaks
    const sensitiveFields = ['password', 'passwordHash', 'salt'];
    for (const field of sensitiveFields) {
      if (data[field] || (data.user && data.user[field])) {
        console.error(`❌ SECURITY: Sensitive field "${field}" exposed in response`);
        events.emit('error', `Sensitive data leak: ${field}`);
      }
    }
    
  } catch (error) {
    console.error('Auth response validation error:', error.message);
  }
}

/**
 * Validate job response
 */
function validateJobResponse(response, context, events) {
  try {
    const data = typeof response.body === 'string' 
      ? JSON.parse(response.body) 
      : response.body;
    
    // Track job creation
    if (response.statusCode === 201 && data.data?.id) {
      metrics.jobsCreated.push({
        id: data.data.id,
        timestamp: Date.now(),
        testId: context.vars.testId
      });
      
      // Report every 1000 jobs
      if (metrics.jobsCreated.length % 1000 === 0) {
        console.log(`✅ Created ${metrics.jobsCreated.length} jobs`);
      }
    }
    
    // Validate job data structure
    if (data.data) {
      const job = data.data;
      
      // Required job fields
      if (job.budget && job.budget < 10) {
        events.emit('error', `Invalid job budget: ${job.budget} (min: 10)`);
      }
      
      if (job.status && !['DRAFT', 'PENDING_APPROVAL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].includes(job.status)) {
        events.emit('error', `Invalid job status: ${job.status}`);
      }
    }
    
  } catch (error) {
    console.error('Job response validation error:', error.message);
  }
}

/**
 * Hook: Test complete - save metrics
 */
function afterTest(context, events, done) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              ARTILLERY LOAD TEST - FINAL METRICS               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  // Calculate statistics
  const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length || 0;
  const sortedTimes = metrics.responseTimes.sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  const finalMetrics = {
    timestamp: new Date().toISOString(),
    concurrency: {
      peak: metrics.peakConcurrentUsers,
      final: metrics.concurrentUsers
    },
    performance: {
      totalScenarios: metrics.responseTimes.length,
      avgResponseTime: Math.round(avgResponseTime),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99)
    },
    resources: {
      uniqueAuthTokens: metrics.authTokens.size,
      jobsCreated: metrics.jobsCreated.length,
      errors: metrics.errors.length,
      errorRate: ((metrics.errors.length / metrics.responseTimes.length) * 100).toFixed(2) + '%'
    },
    memory: {
      snapshots: metrics.memorySnapshots.length,
      finalHeapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      finalHeapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  // Console output
  console.log('📊 Concurrency:');
  console.log(`   Peak: ${finalMetrics.concurrency.peak} concurrent users`);
  console.log(`\n⏱️  Performance:`);
  console.log(`   Total Scenarios: ${finalMetrics.performance.totalScenarios}`);
  console.log(`   Avg Response: ${finalMetrics.performance.avgResponseTime}ms`);
  console.log(`   P50: ${finalMetrics.performance.p50}ms`);
  console.log(`   P95: ${finalMetrics.performance.p95}ms`);
  console.log(`   P99: ${finalMetrics.performance.p99}ms`);
  console.log(`\n📦 Resources:`);
  console.log(`   Auth Tokens: ${finalMetrics.resources.uniqueAuthTokens}`);
  console.log(`   Jobs Created: ${finalMetrics.resources.jobsCreated}`);
  console.log(`   Errors: ${finalMetrics.resources.errors} (${finalMetrics.resources.errorRate})`);
  console.log(`\n💾 Memory:`);
  console.log(`   Heap Used: ${finalMetrics.memory.finalHeapUsed}`);
  console.log(`   Heap Total: ${finalMetrics.memory.finalHeapTotal}\n`);
  
  // Verdict
  const verdict = 
    finalMetrics.performance.p95 < 500 && 
    parseFloat(finalMetrics.resources.errorRate) < 1 &&
    metrics.memorySnapshots.length === 0 || 
    metrics.memorySnapshots[metrics.memorySnapshots.length - 1]?.heapUsed < 500 * 1024 * 1024;
  
  if (verdict) {
    console.log('✅ LOAD TEST PASSED: System performed within thresholds\n');
  } else {
    console.log('❌ LOAD TEST FAILED: Performance degradation detected\n');
  }
  
  // Save to file
  fs.writeFileSync(metricsLogPath, JSON.stringify(finalMetrics, null, 2));
  console.log(`📄 Metrics saved: ${metricsLogPath}`);
  console.log(`📄 Errors logged: ${errorLogPath}\n`);
  
  return done();
}

// Export hooks
module.exports = {
  beforeScenario,
  afterScenario,
  afterResponse,
  captureAuthMetrics,
  validateTokenFormat,
  afterTest
};






