/**
 * Server Status Test
 * 
 * Tests if the backend server is running and accessible
 */

const fetch = require('node-fetch').default;

const BACKEND_URL = 'https://guild-backend.onrender.com';

async function testServerStatus() {
  console.log('🔍 Testing Server Status');
  console.log('═'.repeat(40));
  
  const tests = [
    {
      name: 'Root Endpoint',
      url: '/',
      method: 'GET'
    },
    {
      name: 'Health Check',
      url: '/health',
      method: 'GET'
    },
    {
      name: 'API Root',
      url: '/api',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing ${test.name}...`);
      console.log(`   URL: ${BACKEND_URL}${test.url}`);
      
      const response = await fetch(`${BACKEND_URL}${test.url}`, {
        method: test.method,
        headers: {
          'User-Agent': 'GUILD-Test-Client/1.0'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ ${test.name}: SUCCESS`);
        try {
          const data = await response.json();
          console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        } catch (e) {
          const text = await response.text();
          console.log(`   Response: ${text.substring(0, 200)}...`);
        }
      } else {
        console.log(`   ❌ ${test.name}: FAILED`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      
      if (error.code === 'ENOTFOUND') {
        console.log(`   💡 DNS resolution failed - server might not exist`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Connection refused - server is down`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   💡 Connection timeout - server is slow or down`);
      } else if (error.name === 'AbortError') {
        console.log(`   💡 Request timeout - server is not responding`);
      }
    }
  }

  console.log('\n📊 Server Status Summary:');
  console.log('═'.repeat(40));
  console.log('If all tests fail, the server is likely:');
  console.log('1. Not deployed on Render');
  console.log('2. Failed to start due to errors');
  console.log('3. Running on a different URL');
  console.log('4. Experiencing deployment issues');
  
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Check Render deployment logs');
  console.log('2. Verify environment variables');
  console.log('3. Check for missing dependencies');
  console.log('4. Verify server startup code');
  console.log('5. Check for TypeScript compilation errors');
}

testServerStatus().catch(console.error);













