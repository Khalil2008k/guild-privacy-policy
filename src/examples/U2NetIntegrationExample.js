/**
 * Real U²-Net Integration Example
 * 
 * Complete example showing how to integrate Real U²-Net
 * background removal into your React Native app
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import RealU2NetBackgroundRemover from '../components/RealU2NetBackgroundRemover';
import productionU2NetService from '../services/ProductionU2NetService';

const U2NetIntegrationExample = () => {
  const [processedImages, setProcessedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageProcessed = (imageUri) => {
    console.log('Image processed:', imageUri);
    setProcessedImages(prev => [...prev, {
      uri: imageUri,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleBatchProcess = async () => {
    try {
      setIsProcessing(true);
      Alert.alert('Batch Processing', 'This would process multiple images in batch mode');
      // Implement batch processing logic here
    } catch (error) {
      Alert.alert('Error', 'Batch processing failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearResults = () => {
    setProcessedImages([]);
    Alert.alert('Cleared', 'All processed images have been cleared');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Real U²-Net Integration Example</Text>
        <Text style={styles.subtitle}>
          Professional background removal using U²-Net AI
        </Text>

        {/* Main U²-Net Component */}
        <RealU2NetBackgroundRemover
          onImageProcessed={handleImageProcessed}
          showAdvancedControls={true}
          autoProcess={false}
          style={styles.removerContainer}
        />

        {/* Additional Controls */}
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsTitle}>Additional Features</Text>
          
          <View style={styles.buttonRow}>
            <Text style={styles.buttonLabel}>Batch Processing:</Text>
            <Text style={styles.buttonText} onPress={handleBatchProcess}>
              Process Multiple Images
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Text style={styles.buttonLabel}>Clear Results:</Text>
            <Text style={styles.buttonText} onPress={handleClearResults}>
              Clear All ({processedImages.length})
            </Text>
          </View>
        </View>

        {/* Processed Images List */}
        {processedImages.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Processed Images ({processedImages.length})
            </Text>
            {processedImages.map((image, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultText}>
                  Image {index + 1}: {image.timestamp}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Service Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>U²-Net Service Info</Text>
          <Text style={styles.infoText}>
            Model Status: {productionU2NetService.getModelInfo().isLoaded ? 'Loaded' : 'Not Loaded'}
          </Text>
          <Text style={styles.infoText}>
            Input Size: {productionU2NetService.getModelInfo().inputSize}x{productionU2NetService.getModelInfo().inputSize}
          </Text>
          <Text style={styles.infoText}>
            Confidence Threshold: {Math.round(productionU2NetService.getModelInfo().confidenceThreshold * 100)}%
          </Text>
        </View>

        {/* Usage Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Use</Text>
          <Text style={styles.instructionText}>
            1. Tap "Select Image" to choose a photo
          </Text>
          <Text style={styles.instructionText}>
            2. Adjust confidence threshold if needed
          </Text>
          <Text style={styles.instructionText}>
            3. Tap "AI Process" to remove background
          </Text>
          <Text style={styles.instructionText}>
            4. Download the processed images
          </Text>
          <Text style={styles.instructionText}>
            5. Use "Reset" to start over
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666666',
    fontWeight: '500',
  },
  removerContainer: {
    marginBottom: 30,
  },
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultText: {
    fontSize: 14,
    color: '#666666',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
  },
  instructionsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  instructionText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default U2NetIntegrationExample;












