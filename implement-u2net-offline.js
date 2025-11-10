/**
 * U²-Net Offline Background Removal Implementation
 * 
 * Implements U²-Net model for free, offline background removal
 * Based on: https://github.com/xuebinqin/U-2-Net
 */

const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class U2NetBackgroundRemover {
  constructor() {
    this.model = null;
    this.modelPath = './models/u2net/model.json';
    this.isLoaded = false;
  }

  async loadModel() {
    try {
      console.log('🔄 Loading U²-Net model...');
      
      if (!fs.existsSync(this.modelPath)) {
        throw new Error('U²-Net model not found. Please download the model first.');
      }

      this.model = await tf.loadLayersModel(`file://${path.resolve(this.modelPath)}`);
      this.isLoaded = true;
      console.log('✅ U²-Net model loaded successfully');
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
      console.log('🎨 Processing image with U²-Net...');
      
      // Get original dimensions
      const { width, height } = await sharp(imageBuffer).metadata();
      
      // Preprocess image
      const inputTensor = await this.preprocessImage(imageBuffer);
      
      // Run inference
      console.log('🔄 Running U²-Net inference...');
      const prediction = this.model.predict(inputTensor);
      
      // Postprocess mask
      const maskData = await this.postprocessMask(prediction, { width, height });
      
      // Create mask buffer
      const maskBuffer = Buffer.from(maskData);
      
      // Apply mask to original image
      const result = await this.applyMaskToImage(imageBuffer, maskBuffer, width, height);
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      console.log('✅ U²-Net background removal completed');
      return result;
      
    } catch (error) {
      console.error('❌ U²-Net background removal failed:', error.message);
      throw error;
    }
  }

  async applyMaskToImage(imageBuffer, maskBuffer, width, height) {
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
        .toBuffer();

      return result;
    } catch (error) {
      console.error('❌ Mask application failed:', error.message);
      throw error;
    }
  }

  async createWhiteBackground(imageBuffer, maskBuffer, width, height) {
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
      const maskImage = await sharp(maskBuffer, {
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

// Usage example
async function demonstrateU2Net() {
  try {
    console.log('🎨 U²-Net Offline Background Removal Demo');
    console.log('═'.repeat(60));

    const remover = new U2NetBackgroundRemover();
    
    // Load model
    await remover.loadModel();
    
    // Process image
    const inputPath = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
    const outputDir = path.join(__dirname, 'processed-images');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const imageBuffer = fs.readFileSync(inputPath);
    const { width, height } = await sharp(imageBuffer).metadata();
    
    console.log(`📏 Processing image: ${width}x${height}`);
    
    // Remove background
    const processedImage = await remover.removeBackground(imageBuffer);
    
    // Save results
    const transparentPath = path.join(outputDir, 'u2net-transparent.png');
    fs.writeFileSync(transparentPath, processedImage);
    console.log(`✅ Transparent result: ${transparentPath}`);
    
    // Create white background version
    const maskBuffer = await sharp(processedImage)
      .extractChannel('alpha')
      .raw()
      .toBuffer();
    
    const whiteBackground = await remover.createWhiteBackground(imageBuffer, maskBuffer, width, height);
    const whitePath = path.join(outputDir, 'u2net-white-background.jpg');
    fs.writeFileSync(whitePath, whiteBackground);
    console.log(`✅ White background result: ${whitePath}`);
    
    console.log('\n🎉 U²-Net processing completed!');
    console.log('💡 This is completely free and offline!');
    
  } catch (error) {
    console.error('❌ U²-Net demo failed:', error.message);
  }
}

// Run demo
demonstrateU2Net().catch(console.error);












