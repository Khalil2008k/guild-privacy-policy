/**
 * Local AI Service Test
 * 
 * Tests the local simple AI server
 */

const fetch = require('node-fetch').default;
const FormData = require('form-data');
const fs = require('fs');

const LOCAL_URL = 'http://localhost:4000';

async function testLocalAIService() {
  console.log('🚀 Local AI Service Test Suite');
  console.log('═'.repeat(50));

  const tests = [
    {
      name: 'Health Check',
      url: '/health',
      method: 'GET'
    },
    {
      name: 'Simple AI Health',
      url: '/api/simple-profile-picture-ai/health',
      method: 'GET'
    },
    {
      name: 'Advanced AI Health',
      url: '/api/advanced-profile-picture-ai/health',
      method: 'GET'
    },
    {
      name: 'Simple AI Metrics',
      url: '/api/simple-profile-picture-ai/metrics',
      method: 'GET'
    },
    {
      name: 'Advanced AI Metrics',
      url: '/api/advanced-profile-picture-ai/metrics',
      method: 'GET'
    },
    {
      name: 'Advanced AI Config',
      url: '/api/advanced-profile-picture-ai/config',
      method: 'GET'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing ${test.name}...`);
      console.log(`   URL: ${LOCAL_URL}${test.url}`);
      
      const response = await fetch(`${LOCAL_URL}${test.url}`, {
        method: test.method,
        headers: {
          'User-Agent': 'GUILD-Test-Client/1.0'
        },
        timeout: 5000
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ ${test.name}: SUCCESS`);
        const data = await response.json();
        console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        passed++;
      } else {
        console.log(`   ❌ ${test.name}: FAILED`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${passed}/${passed + failed}`);
  console.log(`❌ Failed: ${failed}/${passed + failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Local AI service is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the server logs for details.');
  }

  // Test image processing if we have a test image
  console.log('\n🖼️ Testing Image Processing...');
  
  try {
    // Create a simple test image using Sharp
    const sharp = require('sharp');
    const testImageBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toBuffer();

    console.log('   Created test image (200x200 red square)');

    // Test simple AI processing
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });

    console.log('   Testing Simple AI Service...');
    const simpleResponse = await fetch(`${LOCAL_URL}/api/simple-profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      timeout: 10000
    });

    console.log(`   Simple AI Status: ${simpleResponse.status}`);
    
    if (simpleResponse.ok) {
      const simpleData = await simpleResponse.json();
      console.log('   ✅ Simple AI: SUCCESS');
      console.log(`   Confidence: ${simpleData.result?.confidence}`);
      console.log(`   Quality: ${simpleData.result?.quality?.overall}`);
    } else {
      const errorText = await simpleResponse.text();
      console.log('   ❌ Simple AI: FAILED');
      console.log(`   Error: ${errorText.substring(0, 100)}...`);
    }

    // Test advanced AI processing
    console.log('   Testing Advanced AI Service...');
    const advancedResponse = await fetch(`${LOCAL_URL}/api/advanced-profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      timeout: 10000
    });

    console.log(`   Advanced AI Status: ${advancedResponse.status}`);
    
    if (advancedResponse.ok) {
      const advancedData = await advancedResponse.json();
      console.log('   ✅ Advanced AI: SUCCESS');
      console.log(`   Confidence: ${advancedData.result?.confidence}`);
      console.log(`   Quality: ${advancedData.result?.quality?.overall}`);
    } else {
      const errorText = await advancedResponse.text();
      console.log('   ❌ Advanced AI: FAILED');
      console.log(`   Error: ${errorText.substring(0, 100)}...`);
    }

  } catch (error) {
    console.log('   ❌ Image Processing Test Failed:', error.message);
  }

  console.log('\n🏁 Test Suite Complete!');
  console.log('═'.repeat(50));
}

testLocalAIService().catch(console.error);












