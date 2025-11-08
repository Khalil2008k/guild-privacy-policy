/**
 * U²-Net Service for React Native
 * 
 * Offline background removal using U²-Net model
 * Based on: https://github.com/xuebinqin/U-2-Net
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-platform-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

class U2NetService {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.modelPath = 'https://your-cdn.com/models/u2net/model.json'; // Replace with your CDN
  }

  async loadModel() {
    try {
      console.log('🔄 Loading U²-Net model...');
      
      // Load model from CDN or local bundle
      this.model = await tf.loadLayersModel(this.modelPath);
      this.isLoaded = true;
      
      console.log('✅ U²-Net model loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load U²-Net model:', error.message);
      throw error;
    }
  }

  async preprocessImage(imageUri, targetSize = 320) {
    try {
      // Load image as tensor
      const response = await fetch(imageUri);
      const imageData = await response.arrayBuffer();
      const imageTensor = tf.node.decodeImage(new Uint8Array(imageData), 3);
      
      // Resize to 320x320 (U²-Net input size)
      const resized = tf.image.resizeBilinear(imageTensor, [targetSize, targetSize]);
      
      // Normalize to 0-1 range
      const normalized = resized.div(255.0);
      
      // Add batch dimension
      const batched = normalized.expandDims(0);
      
      // Clean up intermediate tensors
      imageTensor.dispose();
      resized.dispose();
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

  async removeBackground(imageUri) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    try {
      console.log('🎨 Processing image with U²-Net...');
      
      // Get original image dimensions
      const imageInfo = await this.getImageInfo(imageUri);
      
      // Preprocess image
      const inputTensor = await this.preprocessImage(imageUri);
      
      // Run inference
      console.log('🔄 Running U²-Net inference...');
      const prediction = this.model.predict(inputTensor);
      
      // Postprocess mask
      const maskData = await this.postprocessMask(prediction, imageInfo);
      
      // Create processed image
      const processedImageUri = await this.createProcessedImage(imageUri, maskData, imageInfo);
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      console.log('✅ U²-Net background removal completed');
      return processedImageUri;
      
    } catch (error) {
      console.error('❌ U²-Net background removal failed:', error.message);
      throw error;
    }
  }

  async getImageInfo(imageUri) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      img.onerror = reject;
      img.src = imageUri;
    });
  }

  async createProcessedImage(imageUri, maskData, imageInfo) {
    try {
      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imageInfo.width;
      canvas.height = imageInfo.height;
      
      // Load original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply mask
          for (let i = 0; i < data.length; i += 4) {
            const maskValue = maskData[i / 4];
            data[i + 3] = maskValue; // Set alpha channel
          }
          
          // Put modified image data back
          ctx.putImageData(imageData, 0, 0);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            const processedImageUri = URL.createObjectURL(blob);
            resolve(processedImageUri);
          }, 'image/png');
        };
        
        img.onerror = reject;
        img.src = imageUri;
      });
    } catch (error) {
      console.error('❌ Processed image creation failed:', error.message);
      throw error;
    }
  }

  async createWhiteBackground(imageUri, maskData, imageInfo) {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imageInfo.width;
      canvas.height = imageInfo.height;
      
      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply mask to blend with white background
          for (let i = 0; i < data.length; i += 4) {
            const maskValue = maskData[i / 4] / 255;
            data[i] = data[i] * maskValue + 255 * (1 - maskValue);     // Red
            data[i + 1] = data[i + 1] * maskValue + 255 * (1 - maskValue); // Green
            data[i + 2] = data[i + 2] * maskValue + 255 * (1 - maskValue); // Blue
            data[i + 3] = 255; // Full opacity
          }
          
          // Put modified image data back
          ctx.putImageData(imageData, 0, 0);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            const whiteBackgroundUri = URL.createObjectURL(blob);
            resolve(whiteBackgroundUri);
          }, 'image/jpeg');
        };
        
        img.onerror = reject;
        img.src = imageUri;
      });
    } catch (error) {
      console.error('❌ White background creation failed:', error.message);
      throw error;
    }
  }

  async processImage(imageUri, options = {}) {
    try {
      const { createWhiteBackground = false } = options;
      
      if (!this.isLoaded) {
        await this.loadModel();
      }
      
      // Get original image dimensions
      const imageInfo = await this.getImageInfo(imageUri);
      
      // Preprocess image
      const inputTensor = await this.preprocessImage(imageUri);
      
      // Run inference
      const prediction = this.model.predict(inputTensor);
      
      // Postprocess mask
      const maskData = await this.postprocessMask(prediction, imageInfo);
      
      let result;
      if (createWhiteBackground) {
        result = await this.createWhiteBackground(imageUri, maskData, imageInfo);
      } else {
        result = await this.createProcessedImage(imageUri, maskData, imageInfo);
      }
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      return result;
    } catch (error) {
      console.error('❌ Image processing failed:', error.message);
      throw error;
    }
  }

  // Clean up resources
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isLoaded = false;
  }
}

// Export singleton instance
const u2netService = new U2NetService();

export default u2netService;











