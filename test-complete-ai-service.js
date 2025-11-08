/**
 * Complete AI Service Test Suite
 * 
 * Tests all AI endpoints and functionality
 * 
 * Author: Senior AI Engineer
 * Version: 1.0.0
 */

const fetch = require('node-fetch').default;
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BACKEND_API_URL = 'https://guild-backend.onrender.com';

async function testCompleteAIService() {
  console.log('🚀 Complete AI Service Test Suite');
  console.log('═'.repeat(60));
  
  const tests = [
    {
      name: 'Backend Health Check',
      url: '/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Simple AI Health Check',
      url: '/api/simple-profile-picture-ai/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Advanced AI Health Check',
      url: '/api/advanced-profile-picture-ai/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Simple AI Metrics',
      url: '/api/simple-profile-picture-ai/metrics',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Advanced AI Metrics',
      url: '/api/advanced-profile-picture-ai/metrics',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Advanced AI Configuration',
      url: '/api/advanced-profile-picture-ai/config',
      method: 'GET',
      expectedStatus: 200
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

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
      
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ ${test.name}: PASSED`);
        passedTests++;
        
        if (response.status === 200) {
          try {
            const data = await response.json();
            console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
          } catch (e) {
            console.log(`   Response: ${await response.text()}`);
          }
        }
      } else {
        console.log(`   ❌ ${test.name}: FAILED (Expected ${test.expectedStatus}, got ${response.status})`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('═'.repeat(40));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The AI service is fully operational.');
  } else if (passedTests > 0) {
    console.log('\n⚠️  Some tests passed. The service is partially operational.');
  } else {
    console.log('\n❌ All tests failed. The service may not be deployed or running.');
  }

  console.log('\n🔧 Next Steps:');
  if (passedTests === 0) {
    console.log('1. Check if the backend is deployed on Render');
    console.log('2. Verify the deployment logs for any errors');
    console.log('3. Ensure all dependencies are installed');
    console.log('4. Check if the server is running on the correct port');
  } else if (passedTests < totalTests) {
    console.log('1. Check the failed endpoints for specific issues');
    console.log('2. Verify route registration in server.ts');
    console.log('3. Check middleware configuration');
  } else {
    console.log('1. Test image processing with actual image upload');
    console.log('2. Verify background removal functionality');
    console.log('3. Test with different image types and sizes');
  }
}

// Test image processing if service is available
async function testImageProcessing() {
  console.log('\n🖼️  Testing Image Processing...');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);

    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('method', 'auto');
    formData.append('userId', 'test-user-123');

    console.log('   Testing Simple AI Service...');
    const simpleResponse = await fetch(`${BACKEND_API_URL}/api/simple-profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token' // Mock token for testing
      }
    });

    console.log(`   Simple AI Status: ${simpleResponse.status}`);
    if (simpleResponse.ok) {
      const result = await simpleResponse.json();
      console.log(`   ✅ Simple AI: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.success) {
        console.log(`   Processed Image URL: ${result.result?.processedImageUrl}`);
        console.log(`   Confidence: ${result.result?.confidence}`);
        console.log(`   Quality: ${result.result?.quality?.overall}`);
      }
    } else {
      console.log(`   ❌ Simple AI: ${simpleResponse.status} ${simpleResponse.statusText}`);
    }

    console.log('   Testing Advanced AI Service...');
    const advancedResponse = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token' // Mock token for testing
      }
    });

    console.log(`   Advanced AI Status: ${advancedResponse.status}`);
    if (advancedResponse.ok) {
      const result = await advancedResponse.json();
      console.log(`   ✅ Advanced AI: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.success) {
        console.log(`   Processed Image URL: ${result.result?.processedImageUrl}`);
        console.log(`   Confidence: ${result.result?.confidence}`);
        console.log(`   Quality: ${result.result?.quality?.overall}`);
        console.log(`   Method: ${result.result?.method}`);
      }
    } else {
      console.log(`   ❌ Advanced AI: ${advancedResponse.status} ${advancedResponse.statusText}`);
    }

  } catch (error) {
    console.log(`   ❌ Image Processing Test Failed: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  await testCompleteAIService();
  await testImageProcessing();
  
  console.log('\n🏁 Test Suite Complete!');
  console.log('═'.repeat(60));
}

runAllTests().catch(console.error);












