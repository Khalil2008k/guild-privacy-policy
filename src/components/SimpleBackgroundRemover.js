/**
 * Simple Background Remover Component
 * 
 * React Native component for background removal using TensorFlow.js
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import workingBackgroundRemovalService from '../services/workingBackgroundRemoval';

const SimpleBackgroundRemover = ({ onImageProcessed, style }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [whiteBackgroundImage, setWhiteBackgroundImage] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize TensorFlow.js when component mounts
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      console.log('🔄 Initializing background removal service...');
      await workingBackgroundRemovalService.initialize();
      setIsInitialized(true);
      console.log('✅ Background removal service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize service:', error);
      Alert.alert('Initialization Error', 'Failed to initialize background removal service.');
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to select images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setOriginalImage(imageUri);
        setProcessedImage(null);
        setWhiteBackgroundImage(null);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const processImage = async () => {
    if (!originalImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    if (!isInitialized) {
      Alert.alert('Service Not Ready', 'Background removal service is still initializing. Please wait.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('🎨 Starting background removal...');

      // Process image with transparent background
      const processedImageUri = await workingBackgroundRemovalService.processImage(originalImage, {
        createWhiteBackground: false
      });

      // Process image with white background
      const whiteBackgroundUri = await workingBackgroundRemovalService.processImage(originalImage, {
        createWhiteBackground: true
      });

      setProcessedImage(processedImageUri);
      setWhiteBackgroundImage(whiteBackgroundUri);
      
      // Notify parent component
      if (onImageProcessed) {
        onImageProcessed(processedImageUri);
      }

      Alert.alert('Success', 'Background removed successfully!');
    } catch (error) {
      console.error('Background removal error:', error);
      Alert.alert('Error', 'Failed to remove background: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImages = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setWhiteBackgroundImage(null);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>AI Background Remover</Text>
      <Text style={styles.subtitle}>Powered by TensorFlow.js</Text>
      
      {/* Service Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isInitialized ? '#34C759' : '#FF3B30' }]} />
        <Text style={styles.statusText}>
          {isInitialized ? 'Service Ready' : 'Initializing...'}
        </Text>
      </View>

      {/* Image Display */}
      <View style={styles.imageContainer}>
        {originalImage && (
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>Original</Text>
            <Image source={{ uri: originalImage }} style={styles.image} />
          </View>
        )}
        
        {processedImage && (
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>Transparent</Text>
            <Image source={{ uri: processedImage }} style={styles.image} />
          </View>
        )}
        
        {whiteBackgroundImage && (
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>White BG</Text>
            <Image source={{ uri: whiteBackgroundImage }} style={styles.image} />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.pickButton]}
          onPress={pickImage}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Pick Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.processButton, 
            (!originalImage || !isInitialized) && styles.disabledButton
          ]}
          onPress={processImage}
          disabled={isProcessing || !originalImage || !isInitialized}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Remove Background</Text>
          )}
        </TouchableOpacity>

        {(originalImage || processedImage) && (
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetImages}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Processing Status */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Processing with AI...</Text>
          <Text style={styles.processingSubtext}>This may take a few seconds</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoText}>✅ Free & Offline</Text>
        <Text style={styles.infoText}>✅ Privacy Protected</Text>
        <Text style={styles.infoText}>✅ High Quality Results</Text>
        <Text style={styles.infoText}>✅ Easy Integration</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666666',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666666',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginBottom: 10,
  },
  pickButton: {
    backgroundColor: '#007AFF',
  },
  processButton: {
    backgroundColor: '#34C759',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    marginBottom: 20,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  processingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666666',
  },
  infoContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
});

export default SimpleBackgroundRemover;











