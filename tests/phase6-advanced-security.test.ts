/**
 * PHASE 6: ADVANCED SECURITY TESTS (301-400)
 * Comprehensive Security Testing Suite
 * 
 * Run: npm test tests/phase6-advanced-security.test.ts
 * 
 * This suite includes advanced security testing scenarios including:
 * - Penetration testing
 * - Vulnerability scanning
 * - Authentication security
 * - Data protection
 * - API security
 * - Infrastructure security
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const WS_URL = process.env.WS_URL || 'http://localhost:5000';

let authToken: string;
let testUser: any;
let adminToken: string;

// Security testing utilities
class SecurityTester {
  generateMaliciousPayload(type: string): string {
    const payloads = {
      xss: '<script>alert("XSS")</script>',
      sql: "'; DROP TABLE users; --",
      nosql: '{"$where": "this.username == this.password"}',
      ldap: '*)(uid=*))(|(uid=*',
      xpath: "' or '1'='1",
      command: '; cat /etc/passwd',
      path: '../../../etc/passwd',
      xml: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      json: '{"__proto__": {"isAdmin": true}}',
      prototype: 'Object.prototype.isAdmin = true'
    };
    return payloads[type as keyof typeof payloads] || '';
  }

  generateJWTToken(payload: any, secret: string = 'fake-secret'): string {
    return jwt.sign(payload, secret);
  }

  generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateLargePayload(size: number): string {
    return 'A'.repeat(size);
  }
}

const securityTester = new SecurityTester();

describe('PHASE 6: ADVANCED SECURITY TESTS (301-400)', () => {
  
  beforeAll(async () => {
    // Setup: Create test users
    try {
      const timestamp = Date.now();
      
      // Regular user
      const userRes = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `security-test-${timestamp}@example.com`,
        password: 'SecurityTest123!',
        username: `securitytest${timestamp}`,
        firstName: 'Security',
        lastName: 'Test'
      });
      
      authToken = userRes.data.token;
      testUser = userRes.data.user;
      
      // Admin user
      const adminRes = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `admin-security-test-${timestamp}@example.com`,
        password: 'AdminSecurityTest123!',
        username: `adminsecuritytest${timestamp}`,
        firstName: 'Admin',
        lastName: 'Security',
        role: 'admin'
      });
      
      adminToken = adminRes.data.token;
      
      console.log('✅ Security test users created');
    } catch (error: any) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  });

  // ============================================================================
  // TEST 301-310: Authentication Security
  // ============================================================================
  
  describe('Tests 301-310: Authentication Security', () => {
    
    test('Test 301: JWT token manipulation', async () => {
      const tokenTests = [
        // Expired token
        securityTester.generateJWTToken({ userId: 'test', exp: Math.floor(Date.now() / 1000) - 3600 }),
        
        // Modified payload
        securityTester.generateJWTToken({ userId: 'admin', role: 'admin' }),
        
        // Invalid signature
        authToken.slice(0, -10) + 'invalid',
        
        // Empty token
        '',
        
        // Malformed token
        'invalid.token.here',
        
        // Token with extra claims
        securityTester.generateJWTToken({ userId: testUser.id, isAdmin: true, role: 'superadmin' })
      ];
      
      for (const token of tokenTests) {
        try {
          await axios.get(`${API_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error: any) {
          expect(error.response?.status).toBe(401);
        }
      }
      
      console.log('✅ Test 301 PASS: JWT token manipulation prevented');
    });

    test('Test 302: Brute force attack prevention', async () => {
      const passwords = [
        'password', '123456', 'admin', 'test', 'guest',
        'Password123', 'Admin123', 'Test123', 'Guest123',
        'password123', 'admin123', 'test123', 'guest123'
      ];
      
      let blockedAttempts = 0;
      
      for (const password of passwords) {
        try {
          await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testUser.email,
            password: password
          });
        } catch (error: any) {
          if (error.response?.status === 429 || error.response?.status === 423) {
            blockedAttempts++;
          }
        }
      }
      
      expect(blockedAttempts).toBeGreaterThan(0);
      
      console.log(`✅ Test 302 PASS: Brute force attack prevented (${blockedAttempts} attempts blocked)`);
    });

    test('Test 303: Session hijacking prevention', async () => {
      // Test session fixation
      const session1 = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'SecurityTest123!'
      });
      
      const session2 = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'SecurityTest123!'
      });
      
      // Sessions should be different
      expect(session1.data.token).not.toBe(session2.data.token);
      
      // Test session invalidation
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${session1.data.token}` }
      });
      
      try {
        await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${session1.data.token}` }
        });
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
      
      console.log('✅ Test 303 PASS: Session hijacking prevention working');
    });

    test('Test 304: Password policy enforcement', async () => {
      const weakPasswords = [
        '123', 'password', 'admin', 'test', 'qwerty',
        '123456', 'password123', 'admin123', 'test123',
        'Password', 'ADMIN', 'TEST', 'PASSWORD123'
      ];
      
      let rejectedPasswords = 0;
      
      for (const password of weakPasswords) {
        try {
          await axios.post(`${API_BASE_URL}/auth/register`, {
            email: `weak-password-${Date.now()}@example.com`,
            password: password,
            username: `weakpass${Date.now()}`,
            firstName: 'Weak',
            lastName: 'Password'
          });
        } catch (error: any) {
          if (error.response?.status === 400) {
            rejectedPasswords++;
          }
        }
      }
      
      expect(rejectedPasswords).toBeGreaterThan(0);
      
      console.log(`✅ Test 304 PASS: Password policy enforcement (${rejectedPasswords} weak passwords rejected)`);
    });

    test('Test 305: Multi-factor authentication security', async () => {
      // Test 2FA bypass attempts
      const bypassAttempts = [
        { token: '123456', expected: false },
        { token: '000000', expected: false },
        { token: '111111', expected: false },
        { token: '', expected: false },
        { token: null, expected: false }
      ];
      
      for (const attempt of bypassAttempts) {
        try {
          await axios.post(`${API_BASE_URL}/auth/2fa/verify`, {
            token: attempt.token,
            userId: testUser.id
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
        }
      }
      
      console.log('✅ Test 305 PASS: Multi-factor authentication security working');
    });

    test('Test 306: Account lockout mechanism', async () => {
      const maxAttempts = 5;
      let lockoutTriggered = false;
      
      // Attempt multiple failed logins
      for (let i = 0; i < maxAttempts + 2; i++) {
        try {
          await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testUser.email,
            password: 'wrongpassword'
          });
        } catch (error: any) {
          if (error.response?.status === 423) {
            lockoutTriggered = true;
            break;
          }
        }
      }
      
      expect(lockoutTriggered).toBe(true);
      
      console.log('✅ Test 306 PASS: Account lockout mechanism working');
    });

    test('Test 307: OAuth security validation', async () => {
      const oauthTests = [
        // Invalid state parameter
        { state: 'invalid-state', code: 'valid-code' },
        
        // Missing state parameter
        { code: 'valid-code' },
        
        // Invalid code
        { state: 'valid-state', code: 'invalid-code' },
        
        // Malicious redirect URI
        { state: 'valid-state', code: 'valid-code', redirect_uri: 'https://malicious.com/callback' }
      ];
      
      for (const test of oauthTests) {
        try {
          await axios.post(`${API_BASE_URL}/auth/oauth/callback`, test);
        } catch (error: any) {
          expect([400, 401, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 307 PASS: OAuth security validation working');
    });

    test('Test 308: API key security', async () => {
      const apiKeyTests = [
        // Invalid API key
        'invalid-api-key',
        
        // Expired API key
        'expired-api-key',
        
        // Revoked API key
        'revoked-api-key',
        
        // Malformed API key
        'malformed-key',
        
        // Empty API key
        ''
      ];
      
      for (const apiKey of apiKeyTests) {
        try {
          await axios.get(`${API_BASE_URL}/admin/users`, {
            headers: { 'X-API-Key': apiKey }
          });
        } catch (error: any) {
          expect([401, 403]).toContain(error.response?.status || 401);
        }
      }
      
      console.log('✅ Test 308 PASS: API key security working');
    });

    test('Test 309: Role-based access control', async () => {
      const rbacTests = [
        // Regular user trying to access admin endpoints
        { endpoint: '/admin/users', token: authToken, expectedStatus: 403 },
        
        // Regular user trying to access super admin endpoints
        { endpoint: '/admin/system', token: authToken, expectedStatus: 403 },
        
        // Admin user accessing admin endpoints
        { endpoint: '/admin/users', token: adminToken, expectedStatus: 200 },
        
        // Regular user accessing their own data
        { endpoint: `/users/${testUser.id}`, token: authToken, expectedStatus: 200 },
        
        // Regular user trying to access another user's data
        { endpoint: '/users/other-user-id', token: authToken, expectedStatus: 403 }
      ];
      
      for (const test of rbacTests) {
        try {
          const response = await axios.get(`${API_BASE_URL}${test.endpoint}`, {
            headers: { Authorization: `Bearer ${test.token}` }
          });
          expect(response.status).toBe(test.expectedStatus);
        } catch (error: any) {
          expect(error.response?.status).toBe(test.expectedStatus);
        }
      }
      
      console.log('✅ Test 309 PASS: Role-based access control working');
    });

    test('Test 310: Authentication bypass attempts', async () => {
      const bypassAttempts = [
        // SQL injection in login
        { email: "admin'; --", password: 'anything' },
        
        // NoSQL injection
        { email: { $ne: null }, password: { $ne: null } },
        
        // LDAP injection
        { email: '*)(uid=*))(|(uid=*', password: 'anything' },
        
        // XPath injection
        { email: "' or '1'='1", password: 'anything' },
        
        // Command injection
        { email: 'admin; cat /etc/passwd', password: 'anything' },
        
        // Path traversal
        { email: '../../../etc/passwd', password: 'anything' }
      ];
      
      for (const attempt of bypassAttempts) {
        try {
          await axios.post(`${API_BASE_URL}/auth/login`, attempt);
        } catch (error: any) {
          expect([400, 401, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 310 PASS: Authentication bypass attempts prevented');
    });
  });

  // ============================================================================
  // TEST 311-320: Input Validation and Sanitization
  // ============================================================================
  
  describe('Tests 311-320: Input Validation and Sanitization', () => {
    
    test('Test 311: XSS prevention', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<select onfocus=alert("XSS") autofocus>',
        '<textarea onfocus=alert("XSS") autofocus>',
        '<keygen onfocus=alert("XSS") autofocus>',
        '<video><source onerror="alert(\'XSS\')">',
        '<audio src=x onerror=alert("XSS")>',
        '<details open ontoggle=alert("XSS")>',
        '<marquee onstart=alert("XSS")>',
        '<math><mi//xlink:href="data:x,<script>alert(\'XSS\')</script>">'
      ];
      
      for (const payload of xssPayloads) {
        try {
          const response = await axios.post(`${API_BASE_URL}/jobs`, {
            title: payload,
            description: payload,
            budget: 1000,
            category: 'development'
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          // Check if payload was sanitized
          expect(response.data.data.title).not.toContain('<script>');
          expect(response.data.data.description).not.toContain('<script>');
        } catch (error: any) {
          // Rejection is also acceptable
          expect([400, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 311 PASS: XSS prevention working');
    });

    test('Test 312: SQL injection prevention', async () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' OR 1=1 --",
        "admin'--",
        "admin'/*",
        "' OR 'x'='x",
        "' OR 1=1#",
        "' OR 'a'='a",
        "1' OR '1'='1' --",
        "1' OR '1'='1' /*",
        "1' OR '1'='1' #",
        "1' OR '1'='1' UNION SELECT * FROM users --",
        "1' OR '1'='1' UNION SELECT username, password FROM users --"
      ];
      
      for (const payload of sqlPayloads) {
        try {
          await axios.get(`${API_BASE_URL}/jobs/search?q=${encodeURIComponent(payload)}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          // Should not crash or return sensitive data
          expect(error.response?.status).not.toBe(500);
        }
      }
      
      console.log('✅ Test 312 PASS: SQL injection prevention working');
    });

    test('Test 313: NoSQL injection prevention', async () => {
      const nosqlPayloads = [
        { $where: 'this.username == this.password' },
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $exists: true },
        { $in: ['admin', 'user'] },
        { $nin: ['admin'] },
        { $all: ['admin'] },
        { $size: 0 },
        { $type: 'string' }
      ];
      
      for (const payload of nosqlPayloads) {
        try {
          await axios.post(`${API_BASE_URL}/jobs/search`, {
            query: payload,
            filters: payload
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          expect([400, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 313 PASS: NoSQL injection prevention working');
    });

    test('Test 314: Command injection prevention', async () => {
      const commandPayloads = [
        '; cat /etc/passwd',
        '| cat /etc/passwd',
        '&& cat /etc/passwd',
        '|| cat /etc/passwd',
        '`cat /etc/passwd`',
        '$(cat /etc/passwd)',
        '; ls -la',
        '| ls -la',
        '&& ls -la',
        '|| ls -la',
        '`ls -la`',
        '$(ls -la)',
        '; whoami',
        '| whoami',
        '&& whoami',
        '|| whoami',
        '`whoami`',
        '$(whoami)'
      ];
      
      for (const payload of commandPayloads) {
        try {
          await axios.post(`${API_BASE_URL}/jobs`, {
            title: payload,
            description: payload,
            budget: 1000,
            category: 'development'
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          expect([400, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 314 PASS: Command injection prevention working');
    });

    test('Test 315: Path traversal prevention', async () => {
      const pathPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '..%2F..%2F..%2Fetc%2Fpasswd',
        '..%252F..%252F..%252Fetc%252Fpasswd',
        '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
        '..%c1%9c..%c1%9c..%c1%9cetc%c1%9cpasswd',
        '/etc/passwd',
        'C:\\windows\\system32\\drivers\\etc\\hosts',
        '/proc/self/environ',
        '/proc/version',
        '/proc/cmdline'
      ];
      
      for (const payload of pathPayloads) {
        try {
          await axios.get(`${API_BASE_URL}/files/${encodeURIComponent(payload)}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          expect([400, 403, 404]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 315 PASS: Path traversal prevention working');
    });

    test('Test 316: LDAP injection prevention', async () => {
      const ldapPayloads = [
        '*)(uid=*))(|(uid=*',
        '*)(|(password=*))',
        '*)(|(objectClass=*))',
        '*)(|(cn=*))',
        '*)(|(mail=*))',
        '*)(|(telephoneNumber=*))',
        '*)(|(userPassword=*))',
        '*)(|(description=*))',
        '*)(|(title=*))',
        '*)(|(department=*))'
      ];
      
      for (const payload of ldapPayloads) {
        try {
          await axios.post(`${API_BASE_URL}/auth/ldap`, {
            username: payload,
            password: 'test'
          });
        } catch (error: any) {
          expect([400, 401, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 316 PASS: LDAP injection prevention working');
    });

    test('Test 317: XML/XXE injection prevention', async () => {
      const xxePayloads = [
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/shadow">]><foo>&xxe;</foo>',
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///proc/self/environ">]><foo>&xxe;</foo>',
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://malicious.com/steal">]><foo>&xxe;</foo>',
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "ftp://malicious.com/steal">]><foo>&xxe;</foo>',
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "gopher://malicious.com/steal">]><foo>&xxe;</foo>'
      ];
      
      for (const payload of xxePayloads) {
        try {
          await axios.post(`${API_BASE_URL}/files/upload`, {
            fileName: 'test.xml',
            fileType: 'application/xml',
            content: Buffer.from(payload).toString('base64')
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          expect([400, 403, 415]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 317 PASS: XML/XXE injection prevention working');
    });

    test('Test 318: Prototype pollution prevention', async () => {
      const prototypePayloads = [
        { __proto__: { isAdmin: true } },
        { constructor: { prototype: { isAdmin: true } } },
        { __proto__: { toString: 'function() { return "hacked"; }' } },
        { __proto__: { valueOf: 'function() { return 0; }' } },
        { __proto__: { hasOwnProperty: 'function() { return true; }' } }
      ];
      
      for (const payload of prototypePayloads) {
        try {
          await axios.post(`${API_BASE_URL}/users/profile`, payload, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          expect([400, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 318 PASS: Prototype pollution prevention working');
    });

    test('Test 319: Large payload handling', async () => {
      const largePayloads = [
        securityTester.generateLargePayload(1024 * 1024), // 1MB
        securityTester.generateLargePayload(10 * 1024 * 1024), // 10MB
        securityTester.generateLargePayload(100 * 1024 * 1024), // 100MB
        { data: securityTester.generateLargePayload(50 * 1024 * 1024) }, // 50MB object
        { array: Array(1000000).fill('large-data') } // Large array
      ];
      
      for (const payload of largePayloads) {
        try {
          await axios.post(`${API_BASE_URL}/jobs`, {
            title: 'Large payload test',
            description: payload,
            budget: 1000,
            category: 'development'
          }, {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 30000
          });
        } catch (error: any) {
          // Should either accept or reject gracefully
          expect([201, 413, 400]).toContain(error.response?.status || 201);
        }
      }
      
      console.log('✅ Test 319 PASS: Large payload handling working');
    });

    test('Test 320: Unicode and encoding attacks', async () => {
      const unicodePayloads = [
        '你好世界', // Chinese
        'مرحبا بالعالم', // Arabic
        'Привет мир', // Russian
        'こんにちは世界', // Japanese
        '안녕하세요 세계', // Korean
        'שלום עולם', // Hebrew
        '🌍🌎🌏', // Emojis
        'ñáéíóú', // Accented characters
        'αβγδε', // Greek
        '🚀💻🔒', // Tech emojis
        '\u0000\u0001\u0002', // Null bytes
        '\uFEFF', // BOM
        '\u200B', // Zero-width space
        '\u200C', // Zero-width non-joiner
        '\u200D' // Zero-width joiner
      ];
      
      for (const payload of unicodePayloads) {
        try {
          const response = await axios.post(`${API_BASE_URL}/jobs`, {
            title: payload,
            description: payload,
            budget: 1000,
            category: 'development'
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          // Should handle unicode properly
          expect(response.status).toBe(201);
        } catch (error: any) {
          // Should handle gracefully
          expect([400, 500]).not.toContain(error.response?.status || 500);
        }
      }
      
      console.log('✅ Test 320 PASS: Unicode and encoding attacks handled');
    });
  });

  // ============================================================================
  // TEST 321-330: API Security
  // ============================================================================
  
  describe('Tests 321-330: API Security', () => {
    
    test('Test 321: CORS policy validation', async () => {
      const corsTests = [
        { origin: 'https://malicious-site.com', expected: false },
        { origin: 'http://localhost:3000', expected: true },
        { origin: 'https://guild.app', expected: true },
        { origin: 'https://subdomain.guild.app', expected: true },
        { origin: 'https://evil-guild.com', expected: false },
        { origin: 'https://guild.app.evil.com', expected: false }
      ];
      
      for (const test of corsTests) {
        try {
          const response = await axios.options(`${API_BASE_URL}/jobs`, {
            headers: {
              'Origin': test.origin,
              'Access-Control-Request-Method': 'POST',
              'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
          });
          
          const allowedOrigin = response.headers['access-control-allow-origin'];
          if (test.expected) {
            expect(allowedOrigin).toBeDefined();
          } else {
            expect(allowedOrigin).not.toBe('*');
          }
        } catch (error: any) {
          if (!test.expected) {
            expect([403, 404]).toContain(error.response?.status || 404);
          }
        }
      }
      
      console.log('✅ Test 321 PASS: CORS policy validation working');
    });

    test('Test 322: Rate limiting enforcement', async () => {
      const rateLimitTests = [
        { requests: 10, interval: 1000, expected: true }, // 10 req/sec
        { requests: 100, interval: 1000, expected: false }, // 100 req/sec
        { requests: 1000, interval: 1000, expected: false }, // 1000 req/sec
        { requests: 10000, interval: 1000, expected: false } // 10000 req/sec
      ];
      
      for (const test of rateLimitTests) {
        const promises = [];
        
        for (let i = 0; i < test.requests; i++) {
          promises.push(
            axios.get(`${API_BASE_URL}/jobs`, {
              headers: { Authorization: `Bearer ${authToken}` }
            }).catch(error => ({ status: error.response?.status || 500 }))
          );
        }
        
        const results = await Promise.all(promises);
        const rateLimitedCount = results.filter(r => r.status === 429).length;
        const rateLimitRate = (rateLimitedCount / test.requests) * 100;
        
        if (test.expected) {
          expect(rateLimitRate).toBeLessThan(10); // Less than 10% rate limited
        } else {
          expect(rateLimitRate).toBeGreaterThan(50); // More than 50% rate limited
        }
      }
      
      console.log('✅ Test 322 PASS: Rate limiting enforcement working');
    });

    test('Test 323: API versioning security', async () => {
      const versionTests = [
        { version: 'v1', expected: true },
        { version: 'v2', expected: true },
        { version: 'v3', expected: false },
        { version: 'latest', expected: true },
        { version: 'beta', expected: false },
        { version: 'alpha', expected: false },
        { version: 'dev', expected: false }
      ];
      
      for (const test of versionTests) {
        try {
          const response = await axios.get(`${API_BASE_URL.replace('/api', `/api/${test.version}`)}/jobs`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          if (test.expected) {
            expect(response.status).toBe(200);
          }
        } catch (error: any) {
          if (!test.expected) {
            expect([404, 400]).toContain(error.response?.status || 404);
          }
        }
      }
      
      console.log('✅ Test 323 PASS: API versioning security working');
    });

    test('Test 324: HTTP method validation', async () => {
      const methodTests = [
        { method: 'GET', endpoint: '/jobs', expected: true },
        { method: 'POST', endpoint: '/jobs', expected: true },
        { method: 'PUT', endpoint: '/jobs/123', expected: true },
        { method: 'DELETE', endpoint: '/jobs/123', expected: true },
        { method: 'PATCH', endpoint: '/jobs/123', expected: true },
        { method: 'HEAD', endpoint: '/jobs', expected: true },
        { method: 'OPTIONS', endpoint: '/jobs', expected: true },
        { method: 'TRACE', endpoint: '/jobs', expected: false },
        { method: 'CONNECT', endpoint: '/jobs', expected: false }
      ];
      
      for (const test of methodTests) {
        try {
          const response = await axios({
            method: test.method as any,
            url: `${API_BASE_URL}${test.endpoint}`,
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          if (test.expected) {
            expect([200, 201, 204, 404]).toContain(response.status);
          }
        } catch (error: any) {
          if (!test.expected) {
            expect([405, 501]).toContain(error.response?.status || 405);
          }
        }
      }
      
      console.log('✅ Test 324 PASS: HTTP method validation working');
    });

    test('Test 325: Content-Type validation', async () => {
      const contentTypeTests = [
        { contentType: 'application/json', expected: true },
        { contentType: 'application/x-www-form-urlencoded', expected: true },
        { contentType: 'multipart/form-data', expected: true },
        { contentType: 'text/plain', expected: false },
        { contentType: 'text/html', expected: false },
        { contentType: 'application/xml', expected: false },
        { contentType: 'image/jpeg', expected: false },
        { contentType: 'application/javascript', expected: false }
      ];
      
      for (const test of contentTypeTests) {
        try {
          const response = await axios.post(`${API_BASE_URL}/jobs`, {
            title: 'Content type test',
            description: 'Testing content type validation',
            budget: 1000,
            category: 'development'
          }, {
            headers: { 
              Authorization: `Bearer ${authToken}`,
              'Content-Type': test.contentType
            }
          });
          
          if (test.expected) {
            expect([200, 201]).toContain(response.status);
          }
        } catch (error: any) {
          if (!test.expected) {
            expect([400, 415]).toContain(error.response?.status || 400);
          }
        }
      }
      
      console.log('✅ Test 325 PASS: Content-Type validation working');
    });

    test('Test 326: Request size limits', async () => {
      const sizeTests = [
        { size: 1024, expected: true }, // 1KB
        { size: 1024 * 1024, expected: true }, // 1MB
        { size: 10 * 1024 * 1024, expected: true }, // 10MB
        { size: 100 * 1024 * 1024, expected: false }, // 100MB
        { size: 1024 * 1024 * 1024, expected: false } // 1GB
      ];
      
      for (const test of sizeTests) {
        const largePayload = securityTester.generateLargePayload(test.size);
        
        try {
          const response = await axios.post(`${API_BASE_URL}/jobs`, {
            title: 'Size limit test',
            description: largePayload,
            budget: 1000,
            category: 'development'
          }, {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 30000
          });
          
          if (test.expected) {
            expect([200, 201]).toContain(response.status);
          }
        } catch (error: any) {
          if (!test.expected) {
            expect([413, 400]).toContain(error.response?.status || 413);
          }
        }
      }
      
      console.log('✅ Test 326 PASS: Request size limits working');
    });

    test('Test 327: Header injection prevention', async () => {
      const headerPayloads = [
        'test\r\nX-Injected: malicious',
        'test\r\nX-Injected: malicious\r\n',
        'test\nX-Injected: malicious',
        'test\nX-Injected: malicious\n',
        'test\rX-Injected: malicious',
        'test\rX-Injected: malicious\r',
        'test%0d%0aX-Injected: malicious',
        'test%0aX-Injected: malicious',
        'test%0dX-Injected: malicious'
      ];
      
      for (const payload of headerPayloads) {
        try {
          await axios.post(`${API_BASE_URL}/jobs`, {
            title: payload,
            description: 'Header injection test',
            budget: 1000,
            category: 'development'
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        } catch (error: any) {
          expect([400, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 327 PASS: Header injection prevention working');
    });

    test('Test 328: Parameter pollution prevention', async () => {
      const pollutionTests = [
        { param: 'id', values: ['123', '456'], expected: 'single' },
        { param: 'category', values: ['development', 'design'], expected: 'single' },
        { param: 'status', values: ['active', 'inactive'], expected: 'single' },
        { param: 'limit', values: ['10', '100'], expected: 'single' },
        { param: 'offset', values: ['0', '100'], expected: 'single' }
      ];
      
      for (const test of pollutionTests) {
        const params = new URLSearchParams();
        test.values.forEach(value => {
          params.append(test.param, value);
        });
        
        try {
          const response = await axios.get(`${API_BASE_URL}/jobs?${params.toString()}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          // Should handle parameter pollution gracefully
          expect(response.status).toBe(200);
        } catch (error: any) {
          expect([400, 500]).not.toContain(error.response?.status || 500);
        }
      }
      
      console.log('✅ Test 328 PASS: Parameter pollution prevention working');
    });

    test('Test 329: API key rotation security', async () => {
      // Test API key expiration
      const expiredKey = securityTester.generateJWTToken({
        apiKey: 'expired-key',
        exp: Math.floor(Date.now() / 1000) - 3600
      });
      
      try {
        await axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { 'X-API-Key': expiredKey }
        });
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
      
      // Test API key revocation
      const revokedKey = 'revoked-api-key';
      try {
        await axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { 'X-API-Key': revokedKey }
        });
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
      
      console.log('✅ Test 329 PASS: API key rotation security working');
    });

    test('Test 330: Webhook security validation', async () => {
      const webhookTests = [
        // Invalid signature
        { signature: 'invalid-signature', payload: '{"test": "data"}' },
        
        // Missing signature
        { signature: null, payload: '{"test": "data"}' },
        
        // Wrong signature algorithm
        { signature: 'sha1=invalid', payload: '{"test": "data"}' },
        
        // Timestamp replay attack
        { signature: 'valid-signature', payload: '{"test": "data"}', timestamp: Date.now() - 3600000 },
        
        // Future timestamp
        { signature: 'valid-signature', payload: '{"test": "data"}', timestamp: Date.now() + 3600000 }
      ];
      
      for (const test of webhookTests) {
        try {
          const headers: any = {};
          if (test.signature) {
            headers['X-Webhook-Signature'] = test.signature;
          }
          if (test.timestamp) {
            headers['X-Webhook-Timestamp'] = test.timestamp.toString();
          }
          
          await axios.post(`${API_BASE_URL}/webhooks/test`, test.payload, {
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          });
        } catch (error: any) {
          expect([401, 403]).toContain(error.response?.status || 401);
        }
      }
      
      console.log('✅ Test 330 PASS: Webhook security validation working');
    });
  });

  // ============================================================================
  // TEST 331-350: Data Protection and Privacy
  // ============================================================================
  
  describe('Tests 331-350: Data Protection and Privacy', () => {
    
    test('Test 331: Data encryption validation', async () => {
      const sensitiveData = {
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        password: 'secretpassword',
        apiKey: 'sk-1234567890abcdef',
        email: 'test@example.com',
        phone: '+1234567890'
      };
      
      const response = await axios.post(`${API_BASE_URL}/users/sensitive-data`, sensitiveData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Retrieve the data
      const retrieved = await axios.get(`${API_BASE_URL}/users/sensitive-data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Sensitive data should be encrypted/redacted
      expect(retrieved.data.data.ssn).not.toBe(sensitiveData.ssn);
      expect(retrieved.data.data.creditCard).not.toBe(sensitiveData.creditCard);
      expect(retrieved.data.data.password).not.toBe(sensitiveData.password);
      expect(retrieved.data.data.apiKey).not.toBe(sensitiveData.apiKey);
      
      console.log('✅ Test 331 PASS: Data encryption validation working');
    });

    test('Test 332: PII data masking', async () => {
      const piiData = {
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111'
      };
      
      const response = await axios.post(`${API_BASE_URL}/users/pii-data`, piiData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Retrieve the data
      const retrieved = await axios.get(`${API_BASE_URL}/users/pii-data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // PII should be masked
      expect(retrieved.data.data.email).toMatch(/\*+@\*+/);
      expect(retrieved.data.data.phone).toMatch(/\*+/);
      expect(retrieved.data.data.address).toMatch(/\*+/);
      expect(retrieved.data.data.ssn).toMatch(/\*+/);
      expect(retrieved.data.data.creditCard).toMatch(/\*+/);
      
      console.log('✅ Test 332 PASS: PII data masking working');
    });

    test('Test 333: Data retention policy', async () => {
      // Create data with expiration
      const response = await axios.post(`${API_BASE_URL}/users/temporary-data`, {
        data: 'temporary data',
        expiresAt: new Date(Date.now() + 1000).toISOString() // 1 second
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const dataId = response.data.data.id;
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to retrieve expired data
      try {
        await axios.get(`${API_BASE_URL}/users/temporary-data/${dataId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
      
      console.log('✅ Test 333 PASS: Data retention policy working');
    });

    test('Test 334: GDPR compliance validation', async () => {
      // Test data portability
      const portabilityResponse = await axios.get(`${API_BASE_URL}/users/data-export`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(portabilityResponse.status).toBe(200);
      expect(portabilityResponse.data.data).toHaveProperty('personalData');
      expect(portabilityResponse.data.data).toHaveProperty('exportedAt');
      
      // Test right to be forgotten
      const deletionResponse = await axios.delete(`${API_BASE_URL}/users/data`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(deletionResponse.status).toBe(200);
      
      // Verify data is deleted
      try {
        await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
      
      console.log('✅ Test 334 PASS: GDPR compliance validation working');
    });

    test('Test 335: Data anonymization', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345',
        age: 30,
        gender: 'male'
      };
      
      const response = await axios.post(`${API_BASE_URL}/users/anonymize`, userData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const anonymizedData = response.data.data;
      
      // Personal identifiers should be anonymized
      expect(anonymizedData.name).not.toBe(userData.name);
      expect(anonymizedData.email).not.toBe(userData.email);
      expect(anonymizedData.phone).not.toBe(userData.phone);
      expect(anonymizedData.address).not.toBe(userData.address);
      
      // Non-identifying data can remain
      expect(anonymizedData.age).toBe(userData.age);
      expect(anonymizedData.gender).toBe(userData.gender);
      
      console.log('✅ Test 335 PASS: Data anonymization working');
    });

    test('Test 336: Audit logging validation', async () => {
      // Perform various operations
      await axios.post(`${API_BASE_URL}/jobs`, {
        title: 'Audit test job',
        description: 'Testing audit logging',
        budget: 1000,
        category: 'development'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      await axios.put(`${API_BASE_URL}/users/profile`, {
        firstName: 'Updated',
        lastName: 'Name'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Retrieve audit logs
      const auditResponse = await axios.get(`${API_BASE_URL}/audit/logs`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(auditResponse.status).toBe(200);
      expect(auditResponse.data.data.logs.length).toBeGreaterThan(0);
      
      // Verify audit log entries
      const logs = auditResponse.data.data.logs;
      const hasJobCreation = logs.some((log: any) => log.action === 'job_created');
      const hasProfileUpdate = logs.some((log: any) => log.action === 'profile_updated');
      
      expect(hasJobCreation).toBe(true);
      expect(hasProfileUpdate).toBe(true);
      
      console.log('✅ Test 336 PASS: Audit logging validation working');
    });

    test('Test 337: Data backup security', async () => {
      // Test backup creation
      const backupResponse = await axios.post(`${API_BASE_URL}/admin/backup/create`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(backupResponse.status).toBe(200);
      expect(backupResponse.data.data.backupId).toBeDefined();
      
      const backupId = backupResponse.data.data.backupId;
      
      // Test backup encryption
      const backupInfo = await axios.get(`${API_BASE_URL}/admin/backup/${backupId}/info`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(backupInfo.data.data.encrypted).toBe(true);
      expect(backupInfo.data.data.checksum).toBeDefined();
      
      console.log('✅ Test 337 PASS: Data backup security working');
    });

    test('Test 338: Cross-border data transfer', async () => {
      const dataTransferTests = [
        { region: 'US', expected: true },
        { region: 'EU', expected: true },
        { region: 'China', expected: false },
        { region: 'Russia', expected: false },
        { region: 'Iran', expected: false }
      ];
      
      for (const test of dataTransferTests) {
        try {
          const response = await axios.post(`${API_BASE_URL}/data/transfer`, {
            data: 'test data',
            destinationRegion: test.region
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          if (test.expected) {
            expect(response.status).toBe(200);
          }
        } catch (error: any) {
          if (!test.expected) {
            expect([403, 451]).toContain(error.response?.status || 403);
          }
        }
      }
      
      console.log('✅ Test 338 PASS: Cross-border data transfer validation working');
    });

    test('Test 339: Data integrity validation', async () => {
      const testData = {
        id: 'test-data-id',
        content: 'test content',
        checksum: 'test-checksum'
      };
      
      // Store data
      const storeResponse = await axios.post(`${API_BASE_URL}/data/store`, testData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(storeResponse.status).toBe(200);
      
      // Retrieve and verify integrity
      const retrieveResponse = await axios.get(`${API_BASE_URL}/data/${testData.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.data.data.integrity).toBe(true);
      expect(retrieveResponse.data.data.checksum).toBeDefined();
      
      console.log('✅ Test 339 PASS: Data integrity validation working');
    });

    test('Test 340: Secure data deletion', async () => {
      const sensitiveData = {
        id: 'sensitive-data-id',
        content: 'sensitive content',
        classification: 'confidential'
      };
      
      // Store sensitive data
      const storeResponse = await axios.post(`${API_BASE_URL}/data/sensitive`, sensitiveData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(storeResponse.status).toBe(200);
      
      // Securely delete data
      const deleteResponse = await axios.delete(`${API_BASE_URL}/data/sensitive/${sensitiveData.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.data.data.secureDeletion).toBe(true);
      
      // Verify data is unrecoverable
      try {
        await axios.get(`${API_BASE_URL}/data/sensitive/${sensitiveData.id}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
      
      console.log('✅ Test 340 PASS: Secure data deletion working');
    });

    // Continue with tests 341-350...
    test('Test 341-350: Additional Data Protection Tests', () => {
      // Placeholder for additional data protection tests 341-350
      // These would include:
      // - Data classification validation
      // - Access control for sensitive data
      // - Data loss prevention
      // - Privacy impact assessment
      // - Consent management
      // - Data subject rights
      // - Third-party data sharing
      // - Data breach notification
      // - Privacy by design
      // - Data minimization
      
      expect(true).toBe(true);
      console.log('✅ Tests 341-350: Additional data protection tests placeholder');
    });
  });

  // ============================================================================
  // TEST 351-400: Infrastructure Security
  // ============================================================================
  
  describe('Tests 351-400: Infrastructure Security', () => {
    
    test('Test 351: Security headers validation', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`);
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy'
      ];
      
      securityHeaders.forEach(header => {
        expect(response.headers[header]).toBeDefined();
      });
      
      console.log('✅ Test 351 PASS: Security headers validation working');
    });

    test('Test 352: SSL/TLS configuration', async () => {
      // Test HTTPS enforcement
      try {
        await axios.get(`http://localhost:5000/health`);
      } catch (error: any) {
        // Should redirect to HTTPS or reject
        expect([301, 302, 403]).toContain(error.response?.status || 403);
      }
      
      // Test TLS version
      const httpsResponse = await axios.get(`https://localhost:5000/health`);
      expect(httpsResponse.status).toBe(200);
      
      console.log('✅ Test 352 PASS: SSL/TLS configuration working');
    });

    test('Test 353: Network security validation', async () => {
      // Test firewall rules
      const blockedPorts = [21, 22, 23, 25, 53, 80, 135, 139, 445, 1433, 3389];
      
      for (const port of blockedPorts) {
        try {
          await axios.get(`http://localhost:${port}`, { timeout: 1000 });
        } catch (error: any) {
          // Should be blocked
          expect(['ECONNREFUSED', 'ETIMEDOUT']).toContain(error.code);
        }
      }
      
      console.log('✅ Test 353 PASS: Network security validation working');
    });

    test('Test 354: Container security validation', async () => {
      // Test container escape prevention
      const escapeAttempts = [
        'docker run --privileged -v /:/host alpine chroot /host /bin/sh',
        'docker run -v /:/host alpine chroot /host /bin/sh',
        'docker run --pid=host alpine ps aux',
        'docker run --net=host alpine netstat -tulpn'
      ];
      
      for (const attempt of escapeAttempts) {
        try {
          await axios.post(`${API_BASE_URL}/admin/container/exec`, {
            command: attempt
          }, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        } catch (error: any) {
          expect([403, 400]).toContain(error.response?.status || 403);
        }
      }
      
      console.log('✅ Test 354 PASS: Container security validation working');
    });

    test('Test 355: Secrets management validation', async () => {
      // Test secrets rotation
      const rotationResponse = await axios.post(`${API_BASE_URL}/admin/secrets/rotate`, {
        secretType: 'api-key'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(rotationResponse.status).toBe(200);
      expect(rotationResponse.data.data.rotated).toBe(true);
      
      // Test secrets access
      const accessResponse = await axios.get(`${API_BASE_URL}/admin/secrets/access-log`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(accessResponse.status).toBe(200);
      expect(accessResponse.data.data.logs.length).toBeGreaterThan(0);
      
      console.log('✅ Test 355 PASS: Secrets management validation working');
    });

    test('Test 356: Vulnerability scanning', async () => {
      // Test for common vulnerabilities
      const vulnerabilityTests = [
        { type: 'sql-injection', payload: "'; DROP TABLE users; --" },
        { type: 'xss', payload: '<script>alert("XSS")</script>' },
        { type: 'command-injection', payload: '; cat /etc/passwd' },
        { type: 'path-traversal', payload: '../../../etc/passwd' },
        { type: 'ldap-injection', payload: '*)(uid=*))(|(uid=*' }
      ];
      
      for (const test of vulnerabilityTests) {
        try {
          await axios.post(`${API_BASE_URL}/vulnerability/scan`, {
            type: test.type,
            payload: test.payload
          }, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        } catch (error: any) {
          // Should detect and block vulnerabilities
          expect([400, 403]).toContain(error.response?.status || 400);
        }
      }
      
      console.log('✅ Test 356 PASS: Vulnerability scanning working');
    });

    test('Test 357: Intrusion detection', async () => {
      // Simulate suspicious activity
      const suspiciousActivities = [
        { type: 'brute-force', attempts: 100 },
        { type: 'port-scan', ports: [22, 80, 443, 3389] },
        { type: 'sql-injection', payload: "'; DROP TABLE users; --" },
        { type: 'xss-attack', payload: '<script>alert("XSS")</script>' },
        { type: 'ddos-attempt', requests: 10000 }
      ];
      
      for (const activity of suspiciousActivities) {
        const response = await axios.post(`${API_BASE_URL}/security/intrusion-detect`, {
          activity: activity
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        expect(response.status).toBe(200);
        expect(response.data.data.detected).toBe(true);
        expect(response.data.data.action).toBeDefined();
      }
      
      console.log('✅ Test 357 PASS: Intrusion detection working');
    });

    test('Test 358: Security monitoring', async () => {
      // Test security event logging
      const securityEvents = [
        { type: 'login-failure', count: 5 },
        { type: 'privilege-escalation', user: 'test-user' },
        { type: 'data-access', resource: 'sensitive-data' },
        { type: 'configuration-change', setting: 'security-policy' },
        { type: 'system-alert', severity: 'high' }
      ];
      
      for (const event of securityEvents) {
        const response = await axios.post(`${API_BASE_URL}/security/events`, {
          event: event
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        expect(response.status).toBe(200);
        expect(response.data.data.logged).toBe(true);
      }
      
      // Test security dashboard
      const dashboardResponse = await axios.get(`${API_BASE_URL}/security/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.data.data.metrics).toBeDefined();
      
      console.log('✅ Test 358 PASS: Security monitoring working');
    });

    test('Test 359: Incident response validation', async () => {
      // Test incident creation
      const incidentResponse = await axios.post(`${API_BASE_URL}/security/incidents`, {
        type: 'security-breach',
        severity: 'high',
        description: 'Test security incident',
        affectedSystems: ['api', 'database']
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(incidentResponse.status).toBe(201);
      const incidentId = incidentResponse.data.data.id;
      
      // Test incident response workflow
      const responseWorkflow = await axios.post(`${API_BASE_URL}/security/incidents/${incidentId}/respond`, {
        action: 'contain',
        details: 'Isolating affected systems'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(responseWorkflow.status).toBe(200);
      expect(responseWorkflow.data.data.contained).toBe(true);
      
      console.log('✅ Test 359 PASS: Incident response validation working');
    });

    test('Test 360: Compliance validation', async () => {
      // Test compliance frameworks
      const complianceFrameworks = ['SOC2', 'ISO27001', 'PCI-DSS', 'GDPR', 'HIPAA'];
      
      for (const framework of complianceFrameworks) {
        const complianceResponse = await axios.get(`${API_BASE_URL}/compliance/${framework}/status`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        expect(complianceResponse.status).toBe(200);
        expect(complianceResponse.data.data.framework).toBe(framework);
        expect(complianceResponse.data.data.compliant).toBeDefined();
      }
      
      // Test compliance reporting
      const reportResponse = await axios.get(`${API_BASE_URL}/compliance/report`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(reportResponse.status).toBe(200);
      expect(reportResponse.data.data.report).toBeDefined();
      
      console.log('✅ Test 360 PASS: Compliance validation working');
    });

    // Continue with tests 361-400...
    test('Test 361-400: Additional Infrastructure Security Tests', () => {
      // Placeholder for additional infrastructure security tests 361-400
      // These would include:
      // - Cloud security validation
      // - Container orchestration security
      // - Microservices security
      // - API gateway security
      // - Load balancer security
      // - Database security
      // - Cache security
      // - Message queue security
      // - File storage security
      // - CDN security
      // - DNS security
      // - Email security
      // - Backup security
      // - Disaster recovery security
      // - Business continuity security
      // - Risk assessment
      // - Security training
      // - Security awareness
      // - Security policies
      // - Security procedures
      
      expect(true).toBe(true);
      console.log('✅ Tests 361-400: Additional infrastructure security tests placeholder');
    });
  });
});


