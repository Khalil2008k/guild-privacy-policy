/**
 * Test Real User Image Processing
 * 
 * Tests the deployed AI service with the actual user image
 */

const fetch = require('node-fetch').default;
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const RENDER_URL = 'https://guild-yf7q.onrender.com';
const USER_IMAGE_PATH = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';

async function testRealUserImage() {
  console.log('🖼️ Testing Real User Image Processing');
  console.log('═'.repeat(60));
  console.log(`📍 AI Service URL: ${RENDER_URL}`);
  console.log(`📍 User Image: ${USER_IMAGE_PATH}`);

  try {
    // Check if the user image exists
    if (!fs.existsSync(USER_IMAGE_PATH)) {
      console.log('❌ User image not found at the specified path');
      console.log('💡 Please make sure the image exists at:');
      console.log(`   ${USER_IMAGE_PATH}`);
      return;
    }

    console.log('✅ User image found!');
    
    // Read the image file
    const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
    console.log(`📏 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Test with Simple AI Service
    console.log('\n🔍 Testing Simple AI Service...');
    await testImageProcessing('simple', imageBuffer, 'Screenshot 2025-10-30 075058.png');

    // Test with Advanced AI Service
    console.log('\n🔍 Testing Advanced AI Service...');
    await testImageProcessing('advanced', imageBuffer, 'Screenshot 2025-10-30 075058.png');

  } catch (error) {
    console.error('❌ Error processing user image:', error.message);
  }
}

async function testImageProcessing(serviceType, imageBuffer, filename) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: filename,
      contentType: 'image/png'
    });

    const serviceUrl = serviceType === 'simple' 
      ? `${RENDER_URL}/api/simple-profile-picture-ai/process`
      : `${RENDER_URL}/api/advanced-profile-picture-ai/process`;

    console.log(`   📤 Uploading to ${serviceType.toUpperCase()} AI service...`);
    console.log(`   🔗 URL: ${serviceUrl}`);

    const startTime = Date.now();
    const response = await fetch(serviceUrl, {
      method: 'POST',
      body: formData,
      timeout: 30000 // 30 second timeout for image processing
    });

    const processingTime = Date.now() - startTime;
    console.log(`   ⏱️ Processing time: ${processingTime}ms`);
    console.log(`   📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ ${serviceType.toUpperCase()} AI: SUCCESS!`);
      console.log(`   🎯 Confidence: ${result.result?.confidence || 'N/A'}`);
      console.log(`   ⭐ Quality Score: ${result.result?.quality?.overall || 'N/A'}`);
      console.log(`   🔧 Method: ${result.result?.method || 'N/A'}`);
      console.log(`   🖼️ Processed Image URL: ${result.result?.processedImageUrl || 'N/A'}`);
      
      if (result.metadata) {
        console.log(`   📏 Original Size: ${result.metadata.originalFileSize} bytes`);
        console.log(`   🎨 MIME Type: ${result.metadata.originalMimeType}`);
        console.log(`   ⚡ Processing Method: ${result.metadata.processingMethod}`);
      }

      // Additional details for advanced AI
      if (serviceType === 'advanced' && result.result) {
        if (result.result.face) {
          console.log(`   👤 Face Detection: ${result.result.face.detected ? 'YES' : 'NO'}`);
          if (result.result.face.confidence) {
            console.log(`   🎯 Face Confidence: ${result.result.face.confidence}`);
          }
        }
        if (result.result.mask) {
          console.log(`   🎭 Mask Generated: ${result.result.mask.generated ? 'YES' : 'NO'}`);
          if (result.result.mask.quality) {
            console.log(`   🎨 Mask Quality: ${result.result.mask.quality}`);
          }
        }
      }

      console.log(`   🎉 Background removal completed successfully!`);
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${serviceType.toUpperCase()} AI: FAILED`);
      console.log(`   📝 Error: ${errorText.substring(0, 200)}...`);
    }

  } catch (error) {
    console.log(`   ❌ ${serviceType.toUpperCase()} AI: ERROR`);
    console.log(`   📝 Error: ${error.message}`);
    
    if (error.code === 'ETIMEDOUT') {
      console.log(`   💡 The image might be too large or the service is slow`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`   💡 The service might be down or unreachable`);
    }
  }
}

// Run the test
testRealUserImage().catch(console.error);











