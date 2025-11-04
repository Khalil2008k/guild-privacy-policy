
/**
 * Real U²-Net TensorFlow.js Integration
 * 
 * Professional-grade background removal using the actual U²-Net model
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

class RealU2NetService {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.modelPath = './models/u2net/tfjs/model.json';
  }

  async loadModel() {
    try {
      console.log('🔄 Loading Real U²-Net Model...');
      
      this.model = await tf.loadLayersModel(this.modelPath);
      this.isLoaded = true;
      
      console.log('✅ Real U²-Net model loaded successfully');
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
      
      // Resize to target size
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
      console.log('🎨 Processing image with Real U²-Net...');
      
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
      
      console.log('✅ Real U²-Net background removal completed');
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
const realU2NetService = new RealU2NetService();

export default realU2NetService;
