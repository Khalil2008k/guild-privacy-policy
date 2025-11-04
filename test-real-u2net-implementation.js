/**
 * Real U²-Net Implementation Test
 * 
 * Comprehensive test script for the production U²-Net background removal
 */

const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class RealU2NetTester {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.testResults = [];
    this.modelPath = './models/u2net/tfjs/model.json';
  }

  async loadModel() {
    try {
      console.log('🔄 Loading Real U²-Net Model for testing...');
      
      if (!fs.existsSync(this.modelPath)) {
        throw new Error('U²-Net model not found. Please run setup first.');
      }

      this.model = await tf.loadLayersModel(`file://${path.resolve(this.modelPath)}`);
      this.isLoaded = true;
      
      console.log('✅ Real U²-Net model loaded successfully');
      console.log(`   Input shape: ${this.model.inputs[0].shape}`);
      console.log(`   Output shape: ${this.model.outputs[0].shape}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load U²-Net model:', error.message);
      throw error;
    }
  }

  async preprocessImage(imageBuffer, targetSize = 320) {
    try {
      console.log(`🔄 Preprocessing image to ${targetSize}x${targetSize}...`);
      
      // Resize image to target size
      const resized = await sharp(imageBuffer)
        .resize(targetSize, targetSize)
        .removeAlpha()
        .jpeg()
        .toBuffer();

      // Convert to tensor
      const tensor = tf.node.decodeImage(resized, 3);
      const normalized = tensor.div(255.0);
      const batched = normalized.expandDims(0);
      
      // Clean up intermediate tensors
      tensor.dispose();
      normalized.dispose();
      
      console.log('✅ Image preprocessing completed');
      return batched;
    } catch (error) {
      console.error('❌ Image preprocessing failed:', error.message);
      throw error;
    }
  }

  async postprocessMask(maskTensor, originalSize, confidenceThreshold = 0.5) {
    try {
      console.log('🔄 Postprocessing U²-Net mask...');
      
      // Remove batch dimension
      const mask = maskTensor.squeeze();
      
      // Apply confidence threshold
      const thresholded = mask.greater(confidenceThreshold);
      
      // Resize back to original size
      const resized = tf.image.resizeBilinear(thresholded, [originalSize.height, originalSize.width]);
      
      // Convert to 0-255 range
      const scaled = resized.mul(255);
      
      // Convert to uint8
      const uint8 = scaled.cast('int32');
      
      // Get mask data
      const maskData = await uint8.data();
      
      // Clean up tensors
      mask.dispose();
      thresholded.dispose();
      resized.dispose();
      scaled.dispose();
      uint8.dispose();
      
      console.log('✅ Mask postprocessing completed');
      return Array.from(maskData);
    } catch (error) {
      console.error('❌ Mask postprocessing failed:', error.message);
      throw error;
    }
  }

  async testBackgroundRemoval(imagePath, outputDir) {
    try {
      console.log(`\n🎨 Testing Real U²-Net on: ${path.basename(imagePath)}`);
      
      // Load and process image
      const imageBuffer = fs.readFileSync(imagePath);
      const { width, height } = await sharp(imageBuffer).metadata();
      
      console.log(`📏 Original image: ${width}x${height}`);
      
      // Preprocess image
      const inputTensor = await this.preprocessImage(imageBuffer);
      
      // Run U²-Net inference
      console.log('🔄 Running U²-Net AI inference...');
      const prediction = this.model.predict(inputTensor);
      
      // Postprocess mask
      const maskData = await this.postprocessMask(prediction, { width, height });
      
      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save mask
      const maskPath = path.join(outputDir, `${path.basename(imagePath, path.extname(imagePath))}_mask.png`);
      await this.saveMask(maskData, width, height, maskPath);
      
      // Create transparent background image
      const transparentPath = path.join(outputDir, `${path.basename(imagePath, path.extname(imagePath))}_transparent.png`);
      await this.createTransparentImage(imageBuffer, maskData, width, height, transparentPath);
      
      // Create white background image
      const whitePath = path.join(outputDir, `${path.basename(imagePath, path.extname(imagePath))}_white.png`);
      await this.createWhiteBackgroundImage(imageBuffer, maskData, width, height, whitePath);
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      const result = {
        input: imagePath,
        mask: maskPath,
        transparent: transparentPath,
        whiteBackground: whitePath,
        success: true,
        processingTime: Date.now()
      };
      
      this.testResults.push(result);
      console.log('✅ Real U²-Net test completed successfully');
      
      return result;
    } catch (error) {
      console.error('❌ U²-Net test failed:', error.message);
      const result = {
        input: imagePath,
        success: false,
        error: error.message,
        processingTime: Date.now()
      };
      this.testResults.push(result);
      return result;
    }
  }

  async saveMask(maskData, width, height, outputPath) {
    try {
      // Create mask image using Sharp
      const maskBuffer = Buffer.from(maskData);
      
      await sharp(maskBuffer, {
        raw: {
          width,
          height,
          channels: 1
        }
      })
      .png()
      .toFile(outputPath);
      
      console.log(`✅ Mask saved: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to save mask:', error.message);
      throw error;
    }
  }

  async createTransparentImage(imageBuffer, maskData, width, height, outputPath) {
    try {
      // Create mask image
      const maskImage = await sharp(maskBuffer, {
        raw: {
          width,
          height,
          channels: 1
        }
      })
      .png()
      .toBuffer();

      // Apply mask to create transparency
      const result = await sharp(imageBuffer)
        .png()
        .composite([{ input: maskImage, blend: 'dest-in' }])
        .png()
        .toFile(outputPath);

      console.log(`✅ Transparent image saved: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to create transparent image:', error.message);
      throw error;
    }
  }

  async createWhiteBackgroundImage(imageBuffer, maskData, width, height, outputPath) {
    try {
      // Create white background
      const whiteBackground = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .jpeg()
      .toBuffer();

      // Create mask image
      const maskImage = await sharp(maskData, {
        raw: {
          width,
          height,
          channels: 1
        }
      })
      .png()
      .toBuffer();

      // Composite image onto white background
      const result = await sharp(whiteBackground)
        .composite([{ input: imageBuffer, blend: 'over' }])
        .jpeg({ quality: 95 })
        .toFile(outputPath);

      console.log(`✅ White background image saved: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to create white background image:', error.message);
      throw error;
    }
  }

  async runComprehensiveTest() {
    try {
      console.log('🚀 Starting Real U²-Net Comprehensive Test');
      console.log('=' .repeat(50));
      
      // Load model
      await this.loadModel();
      
      // Test with sample images
      const testImages = [
        './test-images/person1.jpg',
        './test-images/person2.jpg',
        './test-images/object1.jpg',
        './test-images/object2.jpg'
      ];
      
      const outputDir = './test-output/real-u2net';
      
      for (const imagePath of testImages) {
        if (fs.existsSync(imagePath)) {
          await this.testBackgroundRemoval(imagePath, outputDir);
        } else {
          console.log(`⚠️  Test image not found: ${imagePath}`);
        }
      }
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Comprehensive test failed:', error.message);
    }
  }

  generateTestReport() {
    console.log('\n📊 Real U²-Net Test Report');
    console.log('=' .repeat(50));
    
    const successful = this.testResults.filter(r => r.success);
    const failed = this.testResults.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successful.length}`);
    console.log(`❌ Failed tests: ${failed.length}`);
    console.log(`📈 Success rate: ${((successful.length / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (successful.length > 0) {
      console.log('\n🎯 Successful Results:');
      successful.forEach((result, index) => {
        console.log(`   ${index + 1}. ${path.basename(result.input)}`);
        console.log(`      - Mask: ${result.mask}`);
        console.log(`      - Transparent: ${result.transparent}`);
        console.log(`      - White BG: ${result.whiteBackground}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Results:');
      failed.forEach((result, index) => {
        console.log(`   ${index + 1}. ${path.basename(result.input)}`);
        console.log(`      - Error: ${result.error}`);
      });
    }
    
    // Save detailed report
    const reportPath = './test-output/real-u2net/test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / this.testResults.length) * 100,
      results: this.testResults
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }

  // Clean up resources
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isLoaded = false;
    console.log('🧹 Real U²-Net tester disposed');
  }
}

// Run the test
async function runTest() {
  const tester = new RealU2NetTester();
  
  try {
    await tester.runComprehensiveTest();
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    tester.dispose();
  }
}

// Export for use in other modules
module.exports = { RealU2NetTester, runTest };

// Run if called directly
if (require.main === module) {
  runTest();
}







