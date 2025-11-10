/**
 * AI Service Integration
 * 
 * Integrates professional AI background removal services into the app
 */

import { Platform } from 'react-native';

// AI Service Configuration
const AI_SERVICES = {
  removebg: {
    name: 'Remove.bg',
    apiUrl: 'https://api.remove.bg/v1.0/removebg',
    headers: {
      'X-Api-Key': 'YOUR_REMOVEBG_API_KEY_HERE', // Replace with your API key
    },
    body: {
      size: 'auto',
      format: 'png',
    },
  },
  clipdrop: {
    name: 'Clipdrop',
    apiUrl: 'https://clipdrop-api.co/remove-background/v1',
    headers: {
      'x-api-key': 'YOUR_CLIPDROP_API_KEY_HERE', // Replace with your API key
    },
    body: {},
  },
  photoroom: {
    name: 'PhotoRoom',
    apiUrl: 'https://sdk.photoroom.com/v1/segment',
    headers: {
      'x-api-key': 'YOUR_PHOTOROOM_API_KEY_HERE', // Replace with your API key
    },
    body: {},
  },
};

/**
 * Remove background using Remove.bg API
 */
export const removeBackgroundWithRemoveBG = async (imageUri) => {
  try {
    console.log('🎨 Starting Remove.bg background removal...');
    
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });
    formData.append('size', 'auto');
    formData.append('format', 'png');

    const response = await fetch(AI_SERVICES.removebg.apiUrl, {
      method: 'POST',
      headers: {
        ...AI_SERVICES.removebg.headers,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const processedImageUri = URL.createObjectURL(blob);
      console.log('✅ Remove.bg background removal successful');
      return processedImageUri;
    } else {
      const errorText = await response.text();
      throw new Error(`Remove.bg API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Remove.bg error:', error);
    throw error;
  }
};

/**
 * Remove background using Clipdrop API
 */
export const removeBackgroundWithClipdrop = async (imageUri) => {
  try {
    console.log('🎨 Starting Clipdrop background removal...');
    
    const formData = new FormData();
    formData.append('image_file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    const response = await fetch(AI_SERVICES.clipdrop.apiUrl, {
      method: 'POST',
      headers: {
        ...AI_SERVICES.clipdrop.headers,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const processedImageUri = URL.createObjectURL(blob);
      console.log('✅ Clipdrop background removal successful');
      return processedImageUri;
    } else {
      const errorText = await response.text();
      throw new Error(`Clipdrop API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Clipdrop error:', error);
    throw error;
  }
};

/**
 * Remove background using PhotoRoom API
 */
export const removeBackgroundWithPhotoRoom = async (imageUri) => {
  try {
    console.log('🎨 Starting PhotoRoom background removal...');
    
    const formData = new FormData();
    formData.append('image_file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    const response = await fetch(AI_SERVICES.photoroom.apiUrl, {
      method: 'POST',
      headers: {
        ...AI_SERVICES.photoroom.headers,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const processedImageUri = URL.createObjectURL(blob);
      console.log('✅ PhotoRoom background removal successful');
      return processedImageUri;
    } else {
      const errorText = await response.text();
      throw new Error(`PhotoRoom API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ PhotoRoom error:', error);
    throw error;
  }
};

/**
 * Remove background with fallback to multiple services
 */
export const removeBackgroundWithFallback = async (imageUri) => {
  const services = [
    { name: 'removebg', fn: removeBackgroundWithRemoveBG },
    { name: 'clipdrop', fn: removeBackgroundWithClipdrop },
    { name: 'photoroom', fn: removeBackgroundWithPhotoRoom },
  ];

  for (const service of services) {
    try {
      console.log(`🔄 Trying ${service.name}...`);
      const result = await service.fn(imageUri);
      console.log(`✅ ${service.name} succeeded`);
      return result;
    } catch (error) {
      console.log(`❌ ${service.name} failed: ${error.message}`);
      continue;
    }
  }

  throw new Error('All AI services failed. Please check your API keys and internet connection.');
};

/**
 * Remove background with retry logic
 */
export const removeBackgroundWithRetry = async (imageUri, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      const result = await removeBackgroundWithFallback(imageUri);
      return result;
    } catch (error) {
      lastError = error;
      console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s delay
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Get AI service status
 */
export const getAIServiceStatus = () => {
  return {
    removebg: {
      name: 'Remove.bg',
      configured: AI_SERVICES.removebg.headers['X-Api-Key'] !== 'YOUR_REMOVEBG_API_KEY_HERE',
      cost: 'Free: 50/month, then $0.20/image',
      quality: 'Excellent',
    },
    clipdrop: {
      name: 'Clipdrop',
      configured: AI_SERVICES.clipdrop.headers['x-api-key'] !== 'YOUR_CLIPDROP_API_KEY_HERE',
      cost: 'Free: 100/month, then $0.10/image',
      quality: 'Excellent',
    },
    photoroom: {
      name: 'PhotoRoom',
      configured: AI_SERVICES.photoroom.headers['x-api-key'] !== 'YOUR_PHOTOROOM_API_KEY_HERE',
      cost: 'Free: 50/month, then $0.15/image',
      quality: 'Very Good',
    },
  };
};

export default {
  removeBackgroundWithRemoveBG,
  removeBackgroundWithClipdrop,
  removeBackgroundWithPhotoRoom,
  removeBackgroundWithFallback,
  removeBackgroundWithRetry,
  getAIServiceStatus,
};












