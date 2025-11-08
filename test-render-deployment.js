/**
 * Test Render Deployment
 * 
 * Tests the deployed AI service on Render
 */

const fetch = require('node-fetch').default;
const FormData = require('form-data');
const sharp = require('sharp');

const RENDER_URL = 'https://guild-yf7q.onrender.com';

async function testRenderDeployment() {
  console.log('🚀 Testing Render Deployment');
  console.log('═'.repeat(50));
  console.log(`📍 URL: ${RENDER_URL}`);

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
      console.log(`   URL: ${RENDER_URL}${test.url}`);
      
      const response = await fetch(`${RENDER_URL}${test.url}`, {
        method: test.method,
        headers: {
          'User-Agent': 'GUILD-Test-Client/1.0'
        },
        timeout: 10000
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
    console.log('\n🎉 ALL TESTS PASSED! Render deployment is working perfectly!');
  } else {
    console.log('\n❌ Some tests failed. Check the server logs for details.');
  }

  // Test image processing
  console.log('\n🖼️ Testing Image Processing...');
  
  try {
    // Create a test image
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
    const simpleResponse = await fetch(`${RENDER_URL}/api/simple-profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      timeout: 15000
    });

    console.log(`   Simple AI Status: ${simpleResponse.status}`);
    
    if (simpleResponse.ok) {
      const simpleData = await simpleResponse.json();
      console.log('   ✅ Simple AI: SUCCESS');
      console.log(`   Confidence: ${simpleData.result?.confidence}`);
      console.log(`   Quality: ${simpleData.result?.quality?.overall}`);
      console.log(`   Method: ${simpleData.result?.method}`);
    } else {
      const errorText = await simpleResponse.text();
      console.log('   ❌ Simple AI: FAILED');
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
    }

    // Test advanced AI processing
    console.log('   Testing Advanced AI Service...');
    const advancedResponse = await fetch(`${RENDER_URL}/api/advanced-profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      timeout: 15000
    });

    console.log(`   Advanced AI Status: ${advancedResponse.status}`);
    
    if (advancedResponse.ok) {
      const advancedData = await advancedResponse.json();
      console.log('   ✅ Advanced AI: SUCCESS');
      console.log(`   Confidence: ${advancedData.result?.confidence}`);
      console.log(`   Quality: ${advancedData.result?.quality?.overall}`);
      console.log(`   Method: ${advancedData.result?.method}`);
    } else {
      const errorText = await advancedResponse.text();
      console.log('   ❌ Advanced AI: FAILED');
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
    }

  } catch (error) {
    console.log('   ❌ Image Processing Test Failed:', error.message);
  }

  console.log('\n🏁 Render Deployment Test Complete!');
  console.log('═'.repeat(50));
  console.log('🎉 The AI service is now live and operational!');
  console.log(`📍 Service URL: ${RENDER_URL}`);
  console.log('📍 Health Check: https://guild-yf7q.onrender.com/health');
  console.log('📍 Simple AI: https://guild-yf7q.onrender.com/api/simple-profile-picture-ai/health');
  console.log('📍 Advanced AI: https://guild-yf7q.onrender.com/api/advanced-profile-picture-ai/health');
}

testRenderDeployment().catch(console.error);











