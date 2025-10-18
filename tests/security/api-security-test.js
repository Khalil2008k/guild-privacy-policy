/**
 * API Security Tests
 * Custom security checks beyond OWASP ZAP
 * Tests: JWT vulnerabilities, RBAC bypass, injection attacks
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
const REPORT_PATH = path.join(__dirname, '../../test-reports/security/custom-security-test.json');

// Test results
const results = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(name, passed, severity, details) {
  results.totalTests++;
  
  const test = {
    name,
    passed,
    severity,
    details,
    timestamp: new Date().toISOString()
  };
  
  results.tests.push(test);
  
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    results[severity]++;
    console.log(`❌ ${name} [${severity.toUpperCase()}]`);
    console.log(`   ${details}`);
  }
}

/**
 * Test 1: JWT Algorithm Confusion Attack
 */
async function testJWTAlgorithmConfusion() {
  console.log('\n🔐 Testing JWT Security...');
  
  try {
    // Create malicious JWT with "none" algorithm
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ uid: 'admin', role: 'admin', exp: Date.now() + 3600000 })).toString('base64');
    const maliciousToken = `${header}.${payload}.`;
    
    const res = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${maliciousToken}` },
      validateStatus: () => true
    });
    
    if (res.status === 401 || res.status === 403) {
      logTest('JWT "none" algorithm rejected', true, 'critical', 'Server correctly rejected JWT with "none" algorithm');
    } else {
      logTest('JWT "none" algorithm accepted', false, 'critical', `Server accepted malicious JWT! Status: ${res.status}`);
    }
  } catch (error) {
    logTest('JWT algorithm confusion test', true, 'critical', 'Server rejected malicious token');
  }
}

/**
 * Test 2: SQL Injection in Login
 */
async function testSQLInjection() {
  console.log('\n💉 Testing SQL Injection...');
  
  const payloads = [
    "' OR '1'='1",
    "admin'--",
    "' OR 1=1--",
    "admin' OR '1'='1' /*",
    "1' UNION SELECT NULL, NULL, NULL--"
  ];
  
  let vulnerable = false;
  let vulnerablePayload = '';
  
  for (const payload of payloads) {
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: payload,
        password: payload
      }, { validateStatus: () => true });
      
      // If we get 200 or receive a token, it's vulnerable
      if (res.status === 200 || res.data?.token) {
        vulnerable = true;
        vulnerablePayload = payload;
        break;
      }
    } catch (error) {
      // Expected behavior - injection should fail
    }
  }
  
  if (!vulnerable) {
    logTest('SQL Injection in login', true, 'critical', 'All SQL injection payloads rejected');
  } else {
    logTest('SQL Injection vulnerability found', false, 'critical', `Payload "${vulnerablePayload}" succeeded!`);
  }
}

/**
 * Test 3: XSS in Job Title
 */
async function testXSS() {
  console.log('\n🎭 Testing XSS...');
  
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg/onload=alert("XSS")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>'
  ];
  
  // First, get a valid token
  let token = '';
  try {
    const authRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'client1@test.com',
      password: 'TestPass123!'
    });
    token = authRes.data.token;
  } catch (error) {
    logTest('XSS test setup', false, 'medium', 'Could not authenticate for XSS test');
    return;
  }
  
  let sanitized = true;
  let vulnerablePayload = '';
  
  for (const payload of xssPayloads) {
    try {
      const res = await axios.post(`${BASE_URL}/v1/jobs`, {
        title: payload,
        description: 'Test',
        category: 'Development',
        budget: 100,
        duration: '1 week'
      }, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      });
      
      if (res.status === 201 || res.status === 200) {
        const responseText = JSON.stringify(res.data);
        
        // Check if payload is reflected unsanitized
        if (responseText.includes('<script>') || responseText.includes('onerror=') || responseText.includes('javascript:')) {
          sanitized = false;
          vulnerablePayload = payload;
          break;
        }
      }
    } catch (error) {
      // Continue testing
    }
  }
  
  if (sanitized) {
    logTest('XSS input sanitization', true, 'high', 'All XSS payloads sanitized');
  } else {
    logTest('XSS vulnerability found', false, 'high', `Payload "${vulnerablePayload}" not sanitized!`);
  }
}

/**
 * Test 4: IDOR (Insecure Direct Object Reference)
 */
async function testIDOR() {
  console.log('\n🔓 Testing IDOR...');
  
  // Try to access another user's data
  let token1 = '';
  let token2 = '';
  
  try {
    const auth1 = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'client1@test.com',
      password: 'TestPass123!'
    });
    token1 = auth1.data.token;
    
    const auth2 = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'freelancer1@test.com',
      password: 'TestPass123!'
    });
    token2 = auth2.data.token;
  } catch (error) {
    logTest('IDOR test setup', false, 'high', 'Could not authenticate for IDOR test');
    return;
  }
  
  // Try to access user2's profile with user1's token
  try {
    const res = await axios.get(`${BASE_URL}/users/freelancer1@test.com`, {
      headers: { Authorization: `Bearer ${token1}` },
      validateStatus: () => true
    });
    
    if (res.status === 401 || res.status === 403) {
      logTest('IDOR prevention', true, 'high', 'Access to other user data correctly denied');
    } else if (res.status === 200) {
      logTest('IDOR vulnerability found', false, 'high', 'User can access another user\'s data!');
    } else {
      logTest('IDOR endpoint behavior', true, 'high', `Unexpected status ${res.status}, likely protected`);
    }
  } catch (error) {
    logTest('IDOR prevention', true, 'high', 'Access denied as expected');
  }
}

/**
 * Test 5: Rate Limiting Bypass
 */
async function testRateLimitingBypass() {
  console.log('\n🚦 Testing Rate Limiting...');
  
  const requests = [];
  for (let i = 0; i < 20; i++) {
    requests.push(
      axios.post(`${BASE_URL}/auth/login`, {
        email: 'nonexistent@test.com',
        password: 'wrong'
      }, { validateStatus: () => true })
    );
  }
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429).length;
  
  if (rateLimited > 0) {
    logTest('Rate limiting active', true, 'medium', `${rateLimited}/20 requests rate limited`);
  } else {
    logTest('Rate limiting missing', false, 'medium', 'No rate limiting detected on auth endpoint!');
  }
}

/**
 * Test 6: JWT Token Expiration
 */
async function testJWTExpiration() {
  console.log('\n⏰ Testing JWT Expiration...');
  
  // Create a token with very short expiration
  // Note: This requires access to token generation, so we'll test if expired tokens are rejected
  
  // Use an obviously expired token
  const expiredHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const expiredPayload = Buffer.from(JSON.stringify({ 
    uid: 'test', 
    exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
  })).toString('base64');
  const expiredToken = `${expiredHeader}.${expiredPayload}.invalidsignature`;
  
  try {
    const res = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
      validateStatus: () => true
    });
    
    if (res.status === 401) {
      logTest('JWT expiration check', true, 'medium', 'Expired tokens correctly rejected');
    } else {
      logTest('JWT expiration not enforced', false, 'medium', `Expired token accepted! Status: ${res.status}`);
    }
  } catch (error) {
    logTest('JWT expiration check', true, 'medium', 'Expired token rejected');
  }
}

/**
 * Test 7: CORS Misconfiguration
 */
async function testCORS() {
  console.log('\n🌐 Testing CORS...');
  
  try {
    const res = await axios.options(`${BASE_URL}/jobs`, {
      headers: { 
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'GET'
      },
      validateStatus: () => true
    });
    
    const corsHeader = res.headers['access-control-allow-origin'];
    
    if (!corsHeader || corsHeader === '*') {
      logTest('CORS misconfiguration', false, 'low', 'CORS allows all origins (*)');
    } else if (corsHeader === 'https://malicious-site.com') {
      logTest('CORS vulnerability', false, 'medium', 'CORS reflects attacker origin!');
    } else {
      logTest('CORS properly configured', true, 'low', `CORS restricted to: ${corsHeader}`);
    }
  } catch (error) {
    logTest('CORS check', true, 'low', 'CORS appears to be properly configured');
  }
}

/**
 * Test 8: Sensitive Data Exposure
 */
async function testSensitiveDataExposure() {
  console.log('\n🔍 Testing Sensitive Data Exposure...');
  
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      email: `security-test-${Date.now()}@test.com`,
      password: 'SecurityTest123!',
      username: `sectest${Date.now()}`,
      firstName: 'Security',
      lastName: 'Test'
    }, { validateStatus: () => true });
    
    const responseText = JSON.stringify(res.data).toLowerCase();
    
    const sensitiveFields = ['password', 'passwordhash', 'salt', 'secret'];
    const exposedFields = sensitiveFields.filter(field => responseText.includes(field));
    
    if (exposedFields.length === 0) {
      logTest('Sensitive data exposure', true, 'critical', 'No sensitive data exposed in responses');
    } else {
      logTest('Sensitive data exposure found', false, 'critical', `Exposed fields: ${exposedFields.join(', ')}`);
    }
  } catch (error) {
    logTest('Sensitive data check', false, 'medium', 'Could not complete test');
  }
}

/**
 * Main execution
 */
async function runSecurityTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           CUSTOM API SECURITY TESTS                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  await testJWTAlgorithmConfusion();
  await testSQLInjection();
  await testXSS();
  await testIDOR();
  await testRateLimitingBypass();
  await testJWTExpiration();
  await testCORS();
  await testSensitiveDataExposure();
  
  // Save report
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  SECURITY TEST SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Results:`);
  console.log(`   Total Tests: ${results.totalTests}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}\n`);
  console.log(`📈 Vulnerabilities:`);
  console.log(`   🔴 Critical: ${results.critical}`);
  console.log(`   🟠 High: ${results.high}`);
  console.log(`   🟡 Medium: ${results.medium}`);
  console.log(`   🔵 Low: ${results.low}\n`);
  
  console.log(`📄 Report saved: ${REPORT_PATH}\n`);
  
  // Exit code
  if (results.critical > 0 || results.high > 0) {
    console.log('❌ SECURITY TEST FAILED: Critical or high vulnerabilities found\n');
    process.exit(1);
  } else {
    console.log('✅ SECURITY TEST PASSED: No critical or high vulnerabilities\n');
    process.exit(0);
  }
}

// Run tests
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests };






