/**
 * Test AI Background Removal Processing
 * 
 * This script tests the AI background removal service directly
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch').default;

const USER_IMAGE_PATH = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const BACKEND_API_URL = 'https://guild-backend.onrender.com';

async function testAIBackgroundRemoval() {
  console.log('🤖 Testing AI Background Removal Service...\n');
  
  try {
    // Check if image exists
    if (!fs.existsSync(USER_IMAGE_PATH)) {
      throw new Error(`Image file not found: ${USER_IMAGE_PATH}`);
    }
    
    console.log('📸 Image file found:', USER_IMAGE_PATH);
    console.log('📏 File size:', (fs.statSync(USER_IMAGE_PATH).size / 1024).toFixed(2), 'KB\n');
    
    // Read image file
    const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test-user-image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('qualityThreshold', '0.7');
    formData.append('backgroundRemovalMethod', 'grabcut');
    formData.append('enableFallback', 'true');
    formData.append('enableCaching', 'true');
    
    console.log('🔄 Sending request to AI service...');
    console.log('   URL:', `${BACKEND_API_URL}/api/profile-picture-ai/process`);
    console.log('   Method: POST');
    console.log('   Content-Type: multipart/form-data\n');
    
    // Make request
    const response = await fetch(`${BACKEND_API_URL}/api/profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token',
        ...formData.getHeaders()
      }
    });
    
    console.log('📡 Response received:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('   Error Body:', errorText);
      throw new Error(`AI service responded with ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('\n🎨 AI PROCESSING RESULTS:');
    console.log('═'.repeat(60));
    console.log('Success:', result.success);
    
    if (result.success && result.result) {
      const aiResult = result.result;
      console.log('Processing Time:', aiResult.processingTime, 'ms');
      console.log('Confidence:', aiResult.confidence);
      console.log('Quality Score:', aiResult.quality?.overall || 'N/A');
      
      if (aiResult.processedImageUrl) {
        console.log('Processed Image URL:', aiResult.processedImageUrl);
        console.log('\n🔍 PROCESSED IMAGE ANALYSIS:');
        console.log('- Background should be removed/transparent');
        console.log('- Face should be clearly visible');
        console.log('- Edges should be smooth and natural');
        console.log('- Quality should be high for profile use');
      }
      
      if (aiResult.face) {
        console.log('\n👤 FACE DETECTION:');
        console.log('- Face detected:', aiResult.face ? 'Yes' : 'No');
        if (aiResult.face) {
          console.log('- Face quality:', aiResult.face.quality || 'N/A');
          console.log('- Face confidence:', aiResult.face.confidence || 'N/A');
        }
      }
      
      if (aiResult.mask) {
        console.log('\n🎭 MASK GENERATION:');
        console.log('- Mask created:', aiResult.mask ? 'Yes' : 'No');
        console.log('- Mask quality:', aiResult.mask.quality || 'N/A');
      }
      
    } else {
      console.log('Error:', result.error);
      console.log('Code:', result.code);
    }
    
    console.log('═'.repeat(60));
    
    // Test different background removal methods
    console.log('\n🧪 TESTING DIFFERENT BACKGROUND REMOVAL METHODS:\n');
    
    const methods = ['grabcut', 'selfie', 'color'];
    
    for (const method of methods) {
      try {
        console.log(`Testing ${method} method...`);
        
        const methodFormData = new FormData();
        methodFormData.append('image', imageBuffer, {
          filename: 'test-user-image.jpg',
          contentType: 'image/jpeg'
        });
        methodFormData.append('backgroundRemovalMethod', method);
        methodFormData.append('qualityThreshold', '0.7');
        
        const methodResponse = await fetch(`${BACKEND_API_URL}/api/profile-picture-ai/process`, {
          method: 'POST',
          body: methodFormData,
          headers: {
            'Authorization': 'Bearer test-token',
            ...methodFormData.getHeaders()
          }
        });
        
        if (methodResponse.ok) {
          const methodResult = await methodResponse.json();
          console.log(`  ✅ ${method}: Success - ${methodResult.result?.processingTime || 0}ms`);
        } else {
          console.log(`  ❌ ${method}: Failed - ${methodResponse.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${method}: Error - ${error.message}`);
      }
    }
    
    console.log('\n🎉 AI TESTING COMPLETED!');
    
  } catch (error) {
    console.error('❌ AI testing failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 TROUBLESHOOTING:');
      console.log('1. Make sure the backend server is running:');
      console.log('   cd backend && npm start');
      console.log('2. Check if port 3001 is available');
      console.log('3. Verify the AI service is properly configured');
    }
  }
}

// Run the test
testAIBackgroundRemoval();
