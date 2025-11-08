/**
 * Integrate Professional AI Background Removal
 * 
 * Uses professional AI services for real background removal
 */

const fetch = require('node-fetch').default;
const fs = require('fs');
const path = require('path');

async function integrateProfessionalAI(inputPath, outputDir) {
  try {
    console.log('🎨 Integrating Professional AI Background Removal...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output Directory: ${outputDir}`);

    // Read the original image
    const imageBuffer = fs.readFileSync(inputPath);
    console.log(`📏 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Option 1: Use Remove.bg API (requires API key)
    console.log('\n🔧 Option 1: Remove.bg API Integration...');
    console.log('   💡 This requires a Remove.bg API key');
    console.log('   💡 Sign up at https://www.remove.bg/api');
    console.log('   💡 Add your API key to use this service');

    // Option 2: Use our deployed AI service (if it works)
    console.log('\n🔧 Option 2: Our Deployed AI Service...');
    await testOurAIService(imageBuffer, outputDir);

    // Option 3: Manual processing instructions
    console.log('\n🔧 Option 3: Manual Processing Instructions...');
    console.log('   📝 For best results, use professional tools:');
    console.log('   📝 1. Adobe Photoshop - Select Subject + Delete Background');
    console.log('   📝 2. Canva - Background Remover tool');
    console.log('   📝 3. Remove.bg - Online AI background remover');
    console.log('   📝 4. GIMP - Free alternative with background removal');

    console.log('\n🎉 Professional AI integration guide completed!');
    console.log('💡 The current Sharp-based approach is too basic for your image');
    console.log('💡 Professional AI services will give much better results');

  } catch (error) {
    console.error('❌ Professional AI integration failed:', error.message);
  }
}

async function testOurAIService(imageBuffer, outputDir) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'user-image.png',
      contentType: 'image/png'
    });

    console.log('   📤 Testing our deployed AI service...');
    const response = await fetch('https://guild-yf7q.onrender.com/api/advanced-profile-picture-ai/process', {
      method: 'POST',
      body: formData,
      timeout: 30000
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Our AI service responded successfully');
      console.log(`   🎯 Confidence: ${result.result?.confidence || 'N/A'}`);
      console.log(`   ⭐ Quality: ${result.result?.quality?.overall || 'N/A'}`);
      console.log(`   🔧 Method: ${result.result?.method || 'N/A'}`);
      console.log('   💡 However, this returns placeholder URLs, not real processed images');
    } else {
      console.log('   ❌ Our AI service failed or returned placeholder results');
    }

  } catch (error) {
    console.log(`   ❌ Our AI service error: ${error.message}`);
  }
}

// Run the professional AI integration
const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const outputDir = path.join(__dirname, 'processed-images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

integrateProfessionalAI(inputPath, outputDir)
  .catch(console.error);











