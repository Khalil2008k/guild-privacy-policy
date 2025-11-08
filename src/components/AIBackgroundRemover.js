/**
 * AI Background Remover Component
 * 
 * React Native component for AI background removal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { removeBackgroundWithRetry } from '../services/aiService';

const AIBackgroundRemover = ({ onImageProcessed, style }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);

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

    try {
      setIsProcessing(true);
      console.log('🎨 Starting AI background removal...');

      // Process image with AI service
      const processedImageUri = await removeBackgroundWithRetry(originalImage);

      setProcessedImage(processedImageUri);
      
      // Notify parent component
      if (onImageProcessed) {
        onImageProcessed(processedImageUri);
      }

      Alert.alert('Success', 'Background removed successfully!');
    } catch (error) {
      console.error('AI processing error:', error);
      Alert.alert('Error', 'Failed to remove background: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImages = () => {
    setOriginalImage(null);
    setProcessedImage(null);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>AI Background Remover</Text>
      
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
            <Text style={styles.imageLabel}>Processed</Text>
            <Image source={{ uri: processedImage }} style={styles.image} />
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
          style={[styles.button, styles.processButton, !originalImage && styles.disabledButton]}
          onPress={processImage}
          disabled={isProcessing || !originalImage}
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

      {/* Status */}
      {isProcessing && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusText}>Processing with AI...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageWrapper: {
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666666',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
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
  statusContainer: {
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default AIBackgroundRemover;











