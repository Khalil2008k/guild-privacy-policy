
/**
 * Real U²-Net Implementation
 * 
 * Working implementation for actual background removal
 */

const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class RealU2Net {
  constructor() {
    this.model = null;
    this.isLoaded = false;
  }

  async loadModel() {
    try {
      console.log('🔄 Loading Real U²-Net Model...');
      
      const modelPath = './models/u2net/tfjs/model.json';
      if (!fs.existsSync(modelPath)) {
        throw new Error('U²-Net model not found. Please run setup first.');
      }

      this.model = await tf.loadLayersModel(`file://${path.resolve(modelPath)}`);
      this.isLoaded = true;
      
      console.log('✅ Real U²-Net model loaded successfully');
      return true;
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
      console.log('🎨 Processing image with Real U²-Net...');
      
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
      
      console.log('✅ Real U²-Net background removal completed');
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

// Export singleton instance
const realU2Net = new RealU2Net();
module.exports = realU2Net;
