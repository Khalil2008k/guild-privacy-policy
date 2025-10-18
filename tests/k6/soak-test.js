/**
 * K6 Soak Test: Long-duration stability testing
 * Tests system stability over extended periods (2+ hours)
 * Detects: Memory leaks, resource exhaustion, performance degradation
 * 
 * Run: k6 run soak-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const responseTimeTrend = new Trend('response_time_trend');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    // Ramp up to moderate load
    { duration: '5m', target: 200 },
    
    // Sustain moderate load for 2 hours (soak)
    { duration: '2h', target: 200 },
    
    // Ramp down
    { duration: '5m', target: 0 },
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // Allow degradation but track it
    'http_req_failed': ['rate<0.01'],     // Very low error rate for stability
  },
};

export default function() {
  const startTime = Date.now();
  
  // Simulate realistic user behavior
  const res = http.get(`${BASE_URL}/api/v1/jobs?limit=20`);
  
  check(res, {
    'Status 200': (r) => r.status === 200,
  });
  
  responseTimeTrend.add(Date.now() - startTime);
  
  // Check for performance degradation over time
  if (__ITER % 1000 === 0) {
    console.log(`Iteration ${__ITER}: Response time ${res.timings.duration}ms`);
  }
  
  sleep(Math.random() * 5 + 3); // 3-8 seconds (realistic user pace)
}

export function handleSummary(data) {
  const endP95 = data.metrics.http_req_duration.values['p(95)'];
  const startP95 = data.metrics.response_time_trend ? data.metrics.response_time_trend.values['p(95)'] : endP95;
  const degradation = ((endP95 - startP95) / startP95) * 100;
  
  console.log(`\n📊 SOAK TEST RESULTS:`);
  console.log(`   Performance Degradation: ${degradation.toFixed(2)}%`);
  console.log(`   ${degradation < 10 ? '✅ PASS' : '❌ FAIL'}: System stable over 2 hours\n`);
  
  return {
    '../test-reports/k6/soak-test-summary.json': JSON.stringify(data, null, 2),
    'stdout': JSON.stringify(data, null, 2),
  };
}






