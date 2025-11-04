/**
 * Real U²-Net Background Remover Component
 * 
 * Advanced React Native component using the production U²-Net model
 * for professional-grade background removal with real-time processing
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import productionU2NetService from '../services/ProductionU2NetService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RealU2NetBackgroundRemover = ({ 
  onImageProcessed, 
  style, 
  showAdvancedControls = true,
  autoProcess = false 
}) => {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImages, setProcessedImages] = useState({});
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [refineMask, setRefineMask] = useState(true);
  const [error, setError] = useState(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pan responder for confidence threshold adjustment
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (showAdvancedControls) {
          const newThreshold = Math.max(0, Math.min(1, 
            confidenceThreshold + (gestureState.dx / screenWidth) * 0.1
          ));
          setConfidenceThreshold(newThreshold);
          productionU2NetService.setConfidenceThreshold(newThreshold);
        }
      },
    })
  ).current;

  useEffect(() => {
    // Load U²-Net model when component mounts
    loadModel();
    
    // Animate component entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadModel = async () => {
    try {
      console.log('🔄 Loading Real U²-Net Model...');
      setProcessingStep('Loading AI Model...');
      setProcessingProgress(10);
      
      await productionU2NetService.loadModel();
      setIsModelLoaded(true);
      setProcessingProgress(100);
      setProcessingStep('');
      
      console.log('✅ Real U²-Net model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load U²-Net model:', error);
      setError('Failed to load U²-Net model. Please check your connection and try again.');
      Alert.alert(
        'Model Loading Error', 
        'Failed to load U²-Net model. Please check your internet connection and try again.'
      );
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

      // Launch image picker with high quality settings
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 1.0, // Maximum quality for better results
        allowsEditing: true,
        aspect: [1, 1],
        exif: false, // Disable EXIF for better performance
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setOriginalImage(imageUri);
        setProcessedImages({});
        setError(null);
        
        // Auto-process if enabled
        if (autoProcess && isModelLoaded) {
          setTimeout(() => processImage(imageUri), 500);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      setError('Failed to pick image: ' + error.message);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const processImage = async (imageUri = null) => {
    const targetImageUri = imageUri || originalImage;
    
    if (!targetImageUri) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    if (!isModelLoaded) {
      Alert.alert('Model Not Ready', 'U²-Net model is still loading. Please wait.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProcessingProgress(0);
      setProcessingStep('Initializing...');
      
      console.log('🎨 Starting Real U²-Net background removal...');

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      // Step 1: Preprocessing
      setProcessingStep('Preprocessing image...');
      setProcessingProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: AI Processing
      setProcessingStep('Running U²-Net AI inference...');
      setProcessingProgress(50);
      
      const results = await productionU2NetService.removeBackground(targetImageUri, {
        createTransparent: true,
        createWhiteBackground: true,
        refineMask: refineMask,
        confidenceThreshold: confidenceThreshold
      });

      // Step 3: Postprocessing
      setProcessingStep('Finalizing results...');
      setProcessingProgress(80);
      await new Promise(resolve => setTimeout(resolve, 300));

      setProcessedImages(results);
      setProcessingProgress(100);
      setProcessingStep('Complete!');
      
      // Notify parent component
      if (onImageProcessed) {
        onImageProcessed(results.transparent || results.whiteBackground);
      }

      // Reset progress after a delay
      setTimeout(() => {
        setProcessingStep('');
        setProcessingProgress(0);
        progressAnim.setValue(0);
      }, 1000);

      console.log('✅ Real U²-Net background removal completed');
    } catch (error) {
      console.error('U²-Net processing error:', error);
      setError('Failed to remove background: ' + error.message);
      Alert.alert('Error', 'Failed to remove background: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImages = () => {
    setOriginalImage(null);
    setProcessedImages({});
    setError(null);
    setProcessingStep('');
    setProcessingProgress(0);
    progressAnim.setValue(0);
  };

  const downloadImage = async (imageUri, filename) => {
    try {
      if (Platform.OS === 'web') {
        // For web, create download link
        const link = document.createElement('a');
        link.href = imageUri;
        link.download = filename;
        link.click();
      } else {
        // For mobile, save to gallery
        const result = await FileSystem.downloadAsync(
          imageUri,
          FileSystem.documentDirectory + filename
        );
        Alert.alert('Success', `Image saved to ${result.uri}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download image');
    }
  };

  const renderImagePreview = (uri, label, filename) => (
    <View style={styles.imageWrapper}>
      <Text style={styles.imageLabel}>{label}</Text>
      <Image source={{ uri }} style={styles.image} />
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => downloadImage(uri, filename)}
      >
        <Text style={styles.downloadButtonText}>Download</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <Text style={styles.title}>Real U²-Net AI</Text>
      <Text style={styles.subtitle}>Professional Background Removal</Text>
      
      {/* Model Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isModelLoaded ? '#34C759' : '#FF3B30' }]} />
        <Text style={styles.statusText}>
          {isModelLoaded ? 'U²-Net Model Ready' : 'Loading AI Model...'}
        </Text>
        {!isModelLoaded && (
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })}
              ]} 
            />
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Advanced Controls */}
      {showAdvancedControls && isModelLoaded && (
        <View style={styles.advancedControls}>
          <Text style={styles.controlsTitle}>Advanced Settings</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Confidence: {Math.round(confidenceThreshold * 100)}%</Text>
            <View style={styles.sliderContainer} {...panResponder.panHandlers}>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { width: `${confidenceThreshold * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.sliderThumb, 
                    { left: `${confidenceThreshold * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                refineMask && styles.toggleButtonActive
              ]}
              onPress={() => setRefineMask(!refineMask)}
            >
              <Text style={[
                styles.toggleButtonText,
                refineMask && styles.toggleButtonTextActive
              ]}>
                Refine Mask
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Display */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.imageContainer}
      >
        {originalImage && renderImagePreview(originalImage, 'Original', 'original.jpg')}
        
        {processedImages.transparent && renderImagePreview(
          processedImages.transparent, 
          'Transparent', 
          'transparent.png'
        )}
        
        {processedImages.whiteBackground && renderImagePreview(
          processedImages.whiteBackground, 
          'White Background', 
          'white_bg.jpg'
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.pickButton]}
          onPress={pickImage}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Select Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.processButton, 
            (!originalImage || !isModelLoaded) && styles.disabledButton
          ]}
          onPress={() => processImage()}
          disabled={isProcessing || !originalImage || !isModelLoaded}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>AI Process</Text>
          )}
        </TouchableOpacity>

        {(originalImage || Object.keys(processedImages).length > 0) && (
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
          <Text style={styles.processingText}>U²-Net AI Processing...</Text>
          <Text style={styles.processingSubtext}>{processingStep}</Text>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', `${processingProgress}%`]
                })}
              ]} 
            />
          </View>
        </View>
      )}

      {/* Features */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>U²-Net AI Features:</Text>
        <Text style={styles.featureText}>🧠 Advanced Neural Network</Text>
        <Text style={styles.featureText}>🎯 Professional Quality Results</Text>
        <Text style={styles.featureText}>⚡ Real-time Processing</Text>
        <Text style={styles.featureText}>🔧 Adjustable Confidence</Text>
        <Text style={styles.featureText}>🔒 Privacy Protected</Text>
        <Text style={styles.featureText}>💰 Completely Free</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#666666',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
  },
  advancedControls: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 120,
  },
  sliderContainer: {
    flex: 1,
    marginLeft: 15,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#007AFF',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 15,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  imageContainer: {
    marginBottom: 25,
  },
  imageWrapper: {
    alignItems: 'center',
    marginRight: 15,
    minWidth: 150,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333333',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  downloadButton: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 15,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    fontWeight: '700',
    fontSize: 16,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#F0F8FF',
    borderRadius: 15,
    marginBottom: 25,
  },
  processingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '700',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  featuresContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
  },
});

export default RealU2NetBackgroundRemover;







