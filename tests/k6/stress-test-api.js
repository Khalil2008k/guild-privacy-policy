/**
 * K6 Stress Test: API Endpoints
 * Advanced performance testing with k6
 * 
 * Run: k6 run stress-test-api.js
 * Or: k6 run --vus 1000 --duration 5m stress-test-api.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Custom metrics
const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const jobCreateDuration = new Trend('job_create_duration');
const jobListDuration = new Trend('job_list_duration');
const walletDuration = new Trend('wallet_duration');
const failedRequests = new Counter('failed_requests');
const successfulRequests = new Counter('successful_requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Test stages (advanced load pattern)
export const options = {
  stages: [
    // 1. Ramp-up: 0 → 100 users in 30s
    { duration: '30s', target: 100 },
    
    // 2. Steady load: 100 users for 2 minutes
    { duration: '2m', target: 100 },
    
    // 3. Spike: 100 → 500 users in 30s
    { duration: '30s', target: 500 },
    
    // 4. Stress: 500 users for 2 minutes
    { duration: '2m', target: 500 },
    
    // 5. Extreme spike: 500 → 1000 users in 1 minute
    { duration: '1m', target: 1000 },
    
    // 6. Breaking point: Hold 1000 users for 3 minutes
    { duration: '3m', target: 1000 },
    
    // 7. Recovery: 1000 → 0 users in 1 minute
    { duration: '1m', target: 0 },
  ],
  
  // Thresholds (test fails if exceeded)
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.05'],                  // Error rate < 5%
    errors: ['rate<0.05'],
    auth_duration: ['p(95)<300'],
    job_create_duration: ['p(95)<800'],
    job_list_duration: ['p(95)<400'],
  },
  
  // Advanced settings
  noConnectionReuse: false,
  userAgent: 'K6StressTest/1.0',
  insecureSkipTLSVerify: true,
  
  // Graceful stop
  gracefulStop: '30s',
};

// Setup: Run once at start
export function setup() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              K6 STRESS TEST - STARTING                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`📊 Max VUs: 1000`);
  console.log(`⏱️  Duration: ~10 minutes`);
  console.log(`🔥 Test: Breaking point analysis\n`);
  
  // Pre-create test users for realistic scenarios
  const testUsers = [];
  for (let i = 0; i < 100; i++) {
    const user = {
      email: `k6test${i}@loadtest.com`,
      password: 'K6Test123!',
      username: `k6user${i}`,
      firstName: 'K6',
      lastName: `Test${i}`
    };
    testUsers.push(user);
  }
  
  return { testUsers };
}

// Main test scenario
export default function(data) {
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  
  // Group 1: Authentication Flow
  group('Authentication', () => {
    const startAuth = Date.now();
    
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' }
    });
    
    const authSuccess = check(loginRes, {
      'Login status 200': (r) => r.status === 200,
      'Has token': (r) => r.json('token') !== undefined,
      'Response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    if (!authSuccess) {
      errorRate.add(1);
      failedRequests.add(1);
      return; // Stop scenario on auth failure
    }
    
    successfulRequests.add(1);
    const token = loginRes.json('token');
    authDuration.add(Date.now() - startAuth);
    
    // Simulate user activity
    sleep(Math.random() * 2 + 1); // 1-3 seconds
    
    // Group 2: Job Operations
    group('Job Operations', () => {
      // List jobs
      const startList = Date.now();
      const listRes = http.get(`${BASE_URL}/api/v1/jobs?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { name: 'ListJobs' }
      });
      
      check(listRes, {
        'List jobs status 200': (r) => r.status === 200,
        'Has jobs array': (r) => Array.isArray(r.json('data') || r.json('jobs')),
        'Response time < 600ms': (r) => r.timings.duration < 600,
      }) || errorRate.add(1);
      
      jobListDuration.add(Date.now() - startList);
      
      sleep(Math.random() + 0.5); // 0.5-1.5 seconds
      
      // Create job (30% of users)
      if (Math.random() < 0.3) {
        const startCreate = Date.now();
        const jobData = {
          title: `K6 Stress Test Job ${Date.now()}`,
          description: 'Comprehensive job description for stress testing purposes with detailed requirements and expectations.',
          category: ['Development', 'Design', 'Writing'][Math.floor(Math.random() * 3)],
          budget: Math.floor(Math.random() * 2000) + 100,
          duration: ['1 week', '2 weeks', '1 month'][Math.floor(Math.random() * 3)],
          skills: ['skill1', 'skill2']
        };
        
        const createRes = http.post(`${BASE_URL}/api/v1/jobs`, JSON.stringify(jobData), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          tags: { name: 'CreateJob' }
        });
        
        check(createRes, {
          'Create job status 201': (r) => r.status === 200 || r.status === 201,
          'Has job ID': (r) => r.json('data.id') !== undefined || r.json('id') !== undefined,
          'Response time < 1s': (r) => r.timings.duration < 1000,
        }) || errorRate.add(1);
        
        jobCreateDuration.add(Date.now() - startCreate);
        
        // If job created, submit an offer (simulate freelancer)
        const jobId = createRes.json('data.id') || createRes.json('id');
        if (jobId && Math.random() < 0.5) {
          sleep(Math.random() * 2);
          
          const offerRes = http.post(`${BASE_URL}/api/v1/jobs/${jobId}/offers`, JSON.stringify({
            budget: Math.floor(Math.random() * 1500) + 150,
            timeline: '1 week',
            message: 'I am interested in this job and can deliver quality work.'
          }), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            tags: { name: 'SubmitOffer' }
          });
          
          check(offerRes, {
            'Submit offer status 201 or 400': (r) => r.status === 201 || r.status === 400,
          }) || errorRate.add(1);
        }
      }
    });
    
    sleep(Math.random() + 0.5);
    
    // Group 3: Wallet Operations
    group('Wallet Operations', () => {
      const startWallet = Date.now();
      
      const balanceRes = http.get(`${BASE_URL}/api/v1/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { name: 'WalletBalance' }
      });
      
      check(balanceRes, {
        'Wallet balance status 200': (r) => r.status === 200,
        'Has balance': (r) => r.json('data.balance') !== undefined || r.json('balance') !== undefined,
        'Response time < 400ms': (r) => r.timings.duration < 400,
      }) || errorRate.add(1);
      
      walletDuration.add(Date.now() - startWallet);
      
      // Get transactions
      const txRes = http.get(`${BASE_URL}/api/v1/wallet/transactions?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { name: 'WalletTransactions' }
      });
      
      check(txRes, {
        'Transactions status 200': (r) => r.status === 200,
      }) || errorRate.add(1);
    });
    
    sleep(Math.random() * 2);
    
    // Group 4: Notifications
    group('Notifications', () => {
      const notifRes = http.get(`${BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
        tags: { name: 'GetNotifications' }
      });
      
      check(notifRes, {
        'Notifications status 200': (r) => r.status === 200,
      }) || errorRate.add(1);
    });
    
  });
  
  // Think time between iterations
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Teardown: Run once at end
export function teardown(data) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              K6 STRESS TEST - COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// Generate HTML report
export function handleSummary(data) {
  return {
    '../test-reports/k6/stress-test-summary.html': htmlReport(data),
    '../test-reports/k6/stress-test-summary.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}






