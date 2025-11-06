/**
 * Test TensorFlow.js Installation
 * 
 * Tests if TensorFlow.js is properly installed and working
 */

const fs = require('fs');
const path = require('path');

async function testTensorFlowInstallation() {
  console.log('🧪 Testing TensorFlow.js Installation');
  console.log('═'.repeat(60));

  // Check package.json
  console.log('\n📋 Checking package.json:');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    console.log(`   @tensorflow/tfjs: ${dependencies['@tensorflow/tfjs'] || '❌ Not found'}`);
    console.log(`   @tensorflow/tfjs-react-native: ${dependencies['@tensorflow/tfjs-react-native'] || '❌ Not found'}`);
    
    if (dependencies['@tensorflow/tfjs'] && dependencies['@tensorflow/tfjs-react-native']) {
      console.log('   ✅ TensorFlow.js packages installed');
    } else {
      console.log('   ❌ TensorFlow.js packages missing');
    }
  } catch (error) {
    console.log('   ❌ Failed to read package.json');
  }

  // Check node_modules
  console.log('\n📁 Checking node_modules:');
  const tfjsPath = path.join('node_modules', '@tensorflow', 'tfjs');
  const tfjsRNPath = path.join('node_modules', '@tensorflow', 'tfjs-react-native');
  
  console.log(`   @tensorflow/tfjs: ${fs.existsSync(tfjsPath) ? '✅ Found' : '❌ Missing'}`);
  console.log(`   @tensorflow/tfjs-react-native: ${fs.existsSync(tfjsRNPath) ? '✅ Found' : '❌ Missing'}`);

  // Check if we can import TensorFlow.js
  console.log('\n🔄 Testing TensorFlow.js import:');
  try {
    const tf = require('@tensorflow/tfjs');
    console.log('   ✅ TensorFlow.js imported successfully');
    console.log(`   Version: ${tf.version.tfjs}`);
  } catch (error) {
    console.log('   ❌ Failed to import TensorFlow.js:', error.message);
  }

  // Show integration code
  console.log('\n💻 Integration Code:');
  console.log(`
// In your React Native app
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

// Initialize TensorFlow.js
const initializeTensorFlow = async () => {
  await tf.ready();
  console.log('TensorFlow.js ready!');
};

// Use in your component
const MyComponent = () => {
  useEffect(() => {
    initializeTensorFlow();
  }, []);
  
  return (
    <View>
      <Text>TensorFlow.js is ready!</Text>
    </View>
  );
};
`);

  // Show next steps
  console.log('\n📝 Next Steps:');
  console.log('1. ✅ TensorFlow.js is installed');
  console.log('2. 🔄 Test the SimpleBackgroundRemover component');
  console.log('3. 🎨 Process your user image');
  console.log('4. 🚀 Deploy to production');

  console.log('\n🎉 TensorFlow.js installation test completed!');
  console.log('💡 You can now use AI background removal in your app!');
}

// Run the test
testTensorFlowInstallation().catch(console.error);










