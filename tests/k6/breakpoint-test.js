/**
 * K6 Breakpoint Test: Find system limits
 * Gradually increases load until system breaks
 * Goal: Identify maximum capacity
 * 
 * Run: k6 run breakpoint-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const requests = new Counter('total_requests');
const errors = new Counter('total_errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  executor: 'ramping-arrival-rate',
  startRate: 10,
  timeUnit: '1s',
  preAllocatedVUs: 500,
  maxVUs: 5000,
  stages: [
    { duration: '2m', target: 50 },    // 50 req/s
    { duration: '2m', target: 100 },   // 100 req/s
    { duration: '2m', target: 200 },   // 200 req/s
    { duration: '2m', target: 400 },   // 400 req/s
    { duration: '2m', target: 800 },   // 800 req/s
    { duration: '2m', target: 1600 },  // 1600 req/s
    { duration: '2m', target: 3200 },  // 3200 req/s (breaking point)
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<5000'], // Very lenient to find true breakpoint
  },
};

export default function() {
  requests.add(1);
  
  const res = http.get(`${BASE_URL}/api/health`);
  
  const passed = check(res, {
    'Status 200': (r) => r.status === 200,
    'Response received': (r) => r.body && r.body.length > 0,
  });
  
  if (!passed) {
    errors.add(1);
  }
  
  // Log breakpoint indicators
  if (requests.count % 1000 === 0) {
    const errorRate = (errors.count / requests.count) * 100;
    const responseTime = res.timings.duration;
    
    console.log(`Requests: ${requests.count}, Errors: ${errorRate.toFixed(2)}%, Response: ${responseTime.toFixed(0)}ms`);
    
    if (errorRate > 50 || responseTime > 10000) {
      console.log('⚠️  SYSTEM BREAKING POINT DETECTED!');
    }
  }
  
  sleep(0.1);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.total_requests ? data.metrics.total_requests.values.count : 0;
  const totalErrs = data.metrics.total_errors ? data.metrics.total_errors.values.count : 0;
  const finalErrorRate = (totalErrs / totalReqs) * 100;
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  
  // Estimate capacity based on when error rate exceeded 10%
  const estimatedCapacity = Math.floor(totalReqs / 14); // 14 minutes of test
  
  console.log(`\n💥 BREAKPOINT TEST RESULTS:`);
  console.log(`   Total Requests: ${totalReqs}`);
  console.log(`   Total Errors: ${totalErrs} (${finalErrorRate.toFixed(2)}%)`);
  console.log(`   P95 Response Time: ${p95.toFixed(0)}ms`);
  console.log(`   Estimated Capacity: ~${estimatedCapacity} req/min`);
  console.log(`\n🎯 System Limit: ${finalErrorRate > 10 ? 'REACHED' : 'NOT REACHED'}\n`);
  
  return {
    '../test-reports/k6/breakpoint-test-summary.json': JSON.stringify(data, null, 2),
  };
}






