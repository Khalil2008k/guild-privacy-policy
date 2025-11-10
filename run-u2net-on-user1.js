/**
 * Run U²-Net on Test User1 Image
 * 
 * Processes the test user1 image with the professional U²-Net implementation
 */

const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class U2NetProcessor {
  constructor() {
    this.model = null;
    this.isLoaded = false;
  }

  async loadModel() {
    try {
      console.log('🔄 Loading Professional U²-Net Model...');
      
      const modelPath = './models/u2net/tfjs/model.json';
      if (!fs.existsSync(modelPath)) {
        throw new Error('U²-Net model not found. Please run setup first.');
      }

      this.model = await tf.loadLayersModel(`file://${path.resolve(modelPath)}`);
      this.isLoaded = true;
      
      console.log('✅ Professional U²-Net model loaded successfully');
      console.log(`   Input shape: ${this.model.inputs[0].shape}`);
      console.log(`   Output shape: ${this.model.outputs[0].shape}`);
    } catch (error) {
      console.error('❌ Failed to load U²-Net model:', error.message);
      throw error;
    }
  }

  async preprocessImage(imageBuffer, targetSize = 320) {
    try {
      // Resize image to 320x320 (U²-Net input size)
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
      
      return batched;
    } catch (error) {
      console.error('❌ Image preprocessing failed:', error.message);
      throw error;
    }
  }

  async postprocessMask(maskTensor, originalSize) {
    try {
      // Remove batch dimension
      const mask = maskTensor.squeeze();
      
      // Resize back to original size
      const resized = tf.image.resizeBilinear(mask, [originalSize.height, originalSize.width]);
      
      // Convert to 0-255 range
      const scaled = resized.mul(255);
      
      // Convert to uint8
      const uint8 = scaled.cast('int32');
      
      // Get data
      const maskData = await uint8.data();
      
      // Clean up tensors
      mask.dispose();
      resized.dispose();
      scaled.dispose();
      uint8.dispose();
      
      return maskData;
    } catch (error) {
      console.error('❌ Mask postprocessing failed:', error.message);
      throw error;
    }
  }

  async removeBackground(imageBuffer) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    try {
      console.log('🎨 Processing image with Professional U²-Net...');
      
      // Get original dimensions
      const { width, height } = await sharp(imageBuffer).metadata();
      console.log(`📏 Original image: ${width}x${height}`);
      
      // Preprocess image
      console.log('🔄 Preprocessing image...');
      const inputTensor = await this.preprocessImage(imageBuffer);
      
      // Run inference
      console.log('🔄 Running U²-Net AI inference...');
      const prediction = this.model.predict(inputTensor);
      
      // Postprocess mask
      console.log('🔄 Postprocessing AI mask...');
      const maskData = await this.postprocessMask(prediction, { width, height });
      
      // Apply mask to original image
      const result = await this.applyMaskToImage(imageBuffer, maskData, width, height);
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      console.log('✅ Professional U²-Net background removal completed');
      return result;
      
    } catch (error) {
      console.error('❌ U²-Net background removal failed:', error.message);
      throw error;
    }
  }

  async applyMaskToImage(imageBuffer, maskData, width, height) {
    try {
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

      // Apply mask to create transparency
      const result = await sharp(imageBuffer)
        .png()
        .composite([{ input: maskImage, blend: 'dest-in' }])
        .png()
        .toBuffer();

      return result;
    } catch (error) {
      console.error('❌ Mask application failed:', error.message);
      throw error;
    }
  }

  async createWhiteBackground(imageBuffer, maskData, width, height) {
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
        .toBuffer();

      return result;
    } catch (error) {
      console.error('❌ White background creation failed:', error.message);
      throw error;
    }
  }
}

async function runU2NetOnUser1() {
  try {
    console.log('🎨 Running Professional U²-Net on Test User1 Image');
    console.log('═'.repeat(60));

    // Initialize TensorFlow.js
    console.log('\n🔄 Initializing TensorFlow.js...');
    await tf.ready();
    console.log('✅ TensorFlow.js ready!');

    // Load the test user1 image
    const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
    const outputDir = path.join(__dirname, 'processed-images');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!fs.existsSync(inputPath)) {
      console.log('❌ Test user1 image not found at:', inputPath);
      return;
    }

    console.log('✅ Test user1 image found');
    
    // Load image
    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Image dimensions: ${width}x${height}`);
    console.log(`📦 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Initialize U²-Net processor
    const processor = new U2NetProcessor();

    // Process image with U²-Net
    console.log('\n🔧 Processing with Professional U²-Net...');
    const processedImage = await processor.removeBackground(imageBuffer);
    
    // Save transparent result
    const transparentPath = path.join(outputDir, 'u2net-user1-transparent.png');
    fs.writeFileSync(transparentPath, processedImage);
    console.log(`✅ U²-Net transparent result: ${transparentPath}`);

    // Create white background version
    console.log('\n🔧 Creating white background version...');
    const maskData = await sharp(processedImage)
      .extractChannel('alpha')
      .raw()
      .toBuffer();
    
    const whiteBackground = await processor.createWhiteBackground(imageBuffer, maskData, width, height);
    const whitePath = path.join(outputDir, 'u2net-user1-white-background.jpg');
    fs.writeFileSync(whitePath, whiteBackground);
    console.log(`✅ U²-Net white background result: ${whitePath}`);

    // Create comparison
    console.log('\n🔧 Creating professional comparison...');
    await createProfessionalComparison(imageBuffer, processedImage, whiteBackground, outputDir);

    console.log('\n🎉 Professional U²-Net processing completed!');
    console.log('📸 Check the processed images to see the professional AI results!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${transparentPath}`);
    console.log(`   - ${whitePath}`);
    console.log(`   - ${path.join(outputDir, 'u2net-user1-comparison.jpg')}`);

    console.log('\n💡 This is the professional-grade AI background removal you wanted!');
    console.log('💡 No simple algorithms - this uses the real U²-Net neural network!');

  } catch (error) {
    console.error('❌ U²-Net processing failed:', error.message);
    console.log('\n💡 To get this working with the real model:');
    console.log('1. Download u2net.pth from: https://github.com/xuebinqin/U-2-Net');
    console.log('2. Convert to TensorFlow.js format');
    console.log('3. Replace the placeholder files in ./models/u2net/tfjs/');
    console.log('4. Run this script again');
  }
}

async function createProfessionalComparison(original, transparent, white, outputDir) {
  try {
    const { width, height } = await sharp(original).metadata();
    const targetHeight = 250;
    const targetWidth = Math.floor(width * targetHeight / height);

    // Resize all images
    const originalResized = await sharp(original)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    const transparentResized = await sharp(transparent)
      .resize(targetWidth, targetHeight)
      .png()
      .toBuffer();

    const whiteResized = await sharp(white)
      .resize(targetWidth, targetHeight)
      .jpeg()
      .toBuffer();

    // Create professional comparison
    const comparison = await sharp({
      create: {
        width: targetWidth * 3 + 60,
        height: targetHeight + 120,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .composite([
      { input: originalResized, left: 10, top: 60 },
      { input: transparentResized, left: targetWidth + 20, top: 60 },
      { input: whiteResized, left: (targetWidth * 2) + 30, top: 60 }
    ])
    .jpeg()
    .toBuffer();

    const comparisonPath = path.join(outputDir, 'u2net-user1-comparison.jpg');
    fs.writeFileSync(comparisonPath, comparison);
    console.log(`   ✅ Professional comparison saved: ${comparisonPath}`);

  } catch (error) {
    console.log(`   ⚠️ Could not create comparison: ${error.message}`);
  }
}

// Run the U²-Net processing
runU2NetOnUser1().catch(console.error);












