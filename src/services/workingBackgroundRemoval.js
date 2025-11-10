/**
 * Working Background Removal Service
 * 
 * A working implementation that can be easily upgraded to U²-Net later
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

class WorkingBackgroundRemovalService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing TensorFlow.js...');
      
      // Initialize TensorFlow.js
      await tf.ready();
      
      this.isInitialized = true;
      console.log('✅ TensorFlow.js initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize TensorFlow.js:', error.message);
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

  async createSimpleMask(imageTensor) {
    try {
      // Create a simple mask based on image characteristics
      // This is a placeholder - in production you'd use U²-Net
      
      // Convert to grayscale
      const grayscale = tf.image.rgbToGrayscale(imageTensor);
      
      // Create a simple threshold-based mask
      const threshold = 0.5;
      const mask = grayscale.greater(threshold);
      
      // Convert to float
      const maskFloat = mask.cast('float32');
      
      // Clean up
      grayscale.dispose();
      mask.dispose();
      
      return maskFloat;
    } catch (error) {
      console.error('❌ Mask creation failed:', error.message);
      throw error;
    }
  }

  async removeBackground(imageUri) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🎨 Processing image for background removal...');
      
      // Preprocess image
      const inputTensor = await this.preprocessImage(imageUri);
      
      // Create mask
      const mask = await this.createSimpleMask(inputTensor);
      
      // Apply mask to create transparency
      const processedTensor = inputTensor.mul(mask);
      
      // Convert back to image
      const processedImageUri = await this.tensorToImageUri(processedTensor);
      
      // Clean up tensors
      inputTensor.dispose();
      mask.dispose();
      processedTensor.dispose();
      
      console.log('✅ Background removal completed');
      return processedImageUri;
      
    } catch (error) {
      console.error('❌ Background removal failed:', error.message);
      throw error;
    }
  }

  async tensorToImageUri(tensor) {
    try {
      // Remove batch dimension
      const squeezed = tensor.squeeze();
      
      // Convert to 0-255 range
      const scaled = squeezed.mul(255);
      
      // Convert to uint8
      const uint8 = scaled.cast('int32');
      
      // Get data
      const data = await uint8.data();
      
      // Create image data
      const imageData = new ImageData(
        new Uint8ClampedArray(data),
        tensor.shape[2],
        tensor.shape[1]
      );
      
      // Create canvas and convert to blob
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = tensor.shape[2];
      canvas.height = tensor.shape[1];
      
      ctx.putImageData(imageData, 0, 0);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const imageUri = URL.createObjectURL(blob);
          resolve(imageUri);
        }, 'image/png');
      });
      
    } catch (error) {
      console.error('❌ Tensor to image conversion failed:', error.message);
      throw error;
    }
  }

  async processImage(imageUri, options = {}) {
    try {
      const { createWhiteBackground = false } = options;
      
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Process image
      const processedImageUri = await this.removeBackground(imageUri);
      
      if (createWhiteBackground) {
        // Create white background version
        return await this.createWhiteBackground(processedImageUri);
      }
      
      return processedImageUri;
    } catch (error) {
      console.error('❌ Image processing failed:', error.message);
      throw error;
    }
  }

  async createWhiteBackground(imageUri) {
    try {
      // Load image
      const response = await fetch(imageUri);
      const imageData = await response.arrayBuffer();
      const imageTensor = tf.node.decodeImage(new Uint8Array(imageData), 4);
      
      // Create white background
      const whiteBackground = tf.ones([imageTensor.shape[0], imageTensor.shape[1], 3]);
      
      // Composite image onto white background
      const alpha = imageTensor.slice([0, 0, 3], [-1, -1, 1]);
      const rgb = imageTensor.slice([0, 0, 0], [-1, -1, 3]);
      
      const composite = rgb.mul(alpha).add(whiteBackground.mul(1 - alpha));
      
      // Convert to image URI
      const resultUri = await this.tensorToImageUri(composite);
      
      // Clean up
      imageTensor.dispose();
      whiteBackground.dispose();
      alpha.dispose();
      rgb.dispose();
      composite.dispose();
      
      return resultUri;
    } catch (error) {
      console.error('❌ White background creation failed:', error.message);
      throw error;
    }
  }

  // Clean up resources
  dispose() {
    this.isInitialized = false;
  }
}

// Export singleton instance
const workingBackgroundRemovalService = new WorkingBackgroundRemovalService();

export default workingBackgroundRemovalService;












