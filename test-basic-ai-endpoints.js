/**
 * Basic AI Service Endpoint Test
 * 
 * Simple test to verify AI service endpoints are working
 */

const fetch = require('node-fetch').default;

const BACKEND_API_URL = 'https://guild-backend.onrender.com';

async function testBasicEndpoints() {
  console.log('🧪 Testing Basic AI Service Endpoints');
  console.log('═'.repeat(50));
  
  const tests = [
    {
      name: 'Health Check',
      url: '/api/advanced-profile-picture-ai/health',
      method: 'GET'
    },
    {
      name: 'Configuration',
      url: '/api/advanced-profile-picture-ai/config',
      method: 'GET'
    },
    {
      name: 'Metrics',
      url: '/api/advanced-profile-picture-ai/metrics',
      method: 'GET'
    },
    {
      name: 'Original AI Service',
      url: '/api/profile-picture-ai/health',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing ${test.name}...`);
      console.log(`   URL: ${BACKEND_API_URL}${test.url}`);
      
      const response = await fetch(`${BACKEND_API_URL}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${test.name}: Success`);
        if (data.status) {
          console.log(`   Status: ${data.status}`);
        }
        if (data.success !== undefined) {
          console.log(`   Success: ${data.success}`);
        }
      } else {
        console.log(`   ❌ ${test.name}: Failed`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: Error - ${error.message}`);
    }
  }
  
  console.log('\n📋 Test Summary:');
  console.log('If you see 404 errors, the advanced AI service needs to be deployed.');
  console.log('If you see 200 responses, the service is working correctly.');
}

testBasicEndpoints().catch(console.error);











