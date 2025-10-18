/**
 * K6 Spike Test: Sudden traffic surge handling
 * Tests system behavior under sudden extreme load
 * Simulates: Black Friday, viral marketing, DDoS-like traffic
 * 
 * Run: k6 run spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    // Normal load
    { duration: '2m', target: 100 },
    
    // SPIKE 1: Sudden 10x increase
    { duration: '10s', target: 1000 },
    { duration: '1m', target: 1000 },
    { duration: '10s', target: 100 },
    
    // Recovery period
    { duration: '2m', target: 100 },
    
    // SPIKE 2: Even bigger
    { duration: '10s', target: 2000 },
    { duration: '1m', target: 2000 },
    { duration: '10s', target: 100 },
    
    // Cool down
    { duration: '2m', target: 0 },
  ],
  
  thresholds: {
    'http_req_duration': ['p(99)<3000'], // Allow more time during spikes
    'errors': ['rate<0.10'],              // Up to 10% errors acceptable during spike
    'http_req_failed': ['rate<0.10'],
  },
};

export default function() {
  const res = http.get(`${BASE_URL}/api/v1/jobs?limit=10`);
  
  const passed = check(res, {
    'Status 200': (r) => r.status === 200,
    'Response time < 5s': (r) => r.timings.duration < 5000,
  });
  
  if (!passed) {
    errorRate.add(1);
  }
  
  sleep(Math.random() + 0.5); // 0.5-1.5 seconds
}

export function handleSummary(data) {
  const p99 = data.metrics.http_req_duration.values['p(99)'];
  const errRate = data.metrics.errors ? data.metrics.errors.values.rate : 0;
  
  console.log(`\n⚡ SPIKE TEST RESULTS:`);
  console.log(`   P99 Response Time: ${p99.toFixed(0)}ms`);
  console.log(`   Error Rate: ${(errRate * 100).toFixed(2)}%`);
  console.log(`   ${p99 < 3000 && errRate < 0.10 ? '✅ PASS' : '❌ FAIL'}: System handled spikes\n`);
  
  return {
    '../test-reports/k6/spike-test-summary.json': JSON.stringify(data, null, 2),
  };
}






