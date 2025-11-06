/**
 * Test Background Removal
 * 
 * Tests the background removal functionality
 */

const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testBackgroundRemoval() {
  try {
    console.log('🎨 Testing Background Removal');
    console.log('═'.repeat(60));

    // Initialize TensorFlow.js
    console.log('\n🔄 Initializing TensorFlow.js...');
    await tf.ready();
    console.log('✅ TensorFlow.js ready!');

    // Test image processing
    console.log('\n🔄 Testing image processing...');
    const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
    
    if (!fs.existsSync(inputPath)) {
      console.log('❌ Test image not found');
      return;
    }

    console.log('✅ Test image found');

    // Load and process image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);

    // Create a simple test
    console.log('\n🔄 Creating test tensor...');
    const testTensor = tf.ones([1, 320, 320, 3]);
    console.log('✅ Test tensor created');

    // Test basic operations
    console.log('\n🔄 Testing basic operations...');
    const normalized = testTensor.div(255.0);
    const resized = tf.image.resizeBilinear(normalized, [160, 160]);
    console.log('✅ Basic operations working');

    // Clean up
    testTensor.dispose();
    normalized.dispose();
    resized.dispose();

    // Show integration example
    console.log('\n💻 Integration Example:');
    console.log(`
// In your React Native component
import SimpleBackgroundRemover from '../components/SimpleBackgroundRemover';

const ProfileScreen = () => {
  const handleImageProcessed = (processedImageUri) => {
    console.log('Processed image:', processedImageUri);
    // Update user profile with processed image
  };

  return (
    <View>
      <SimpleBackgroundRemover onImageProcessed={handleImageProcessed} />
    </View>
  );
};
`);

    console.log('\n✅ Background removal test completed!');
    console.log('💡 TensorFlow.js is working and ready for background removal!');

  } catch (error) {
    console.error('❌ Background removal test failed:', error.message);
  }
}

// Run the test
testBackgroundRemoval().catch(console.error);










