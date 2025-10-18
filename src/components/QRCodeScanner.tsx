import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { CustomAlertService } from '../services/CustomAlertService';
// import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isVisible: boolean;
  scanType?: 'JOB_START' | 'JOB_COMPLETE' | 'VERIFICATION' | 'PROFILE_VIEW';
}

export default function QRCodeScanner({ 
  onScan, 
  onClose, 
  isVisible, 
  scanType = 'PROFILE_VIEW' 
}: QRCodeScannerProps) {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  const [scanned, setScanned] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  
  // Animation values
  const scanLineAnimation = useState(new Animated.Value(0))[0];
  const pulseAnimation = useState(new Animated.Value(1))[0];
  const glowAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isVisible) {
      startAnimations();
    }
  }, [isVisible]);

  const startAnimations = () => {
    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for corners
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned) return;
    
    console.log('QR Code scanned:', { type, data });
    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate QR code format
    try {
      const parsedData = JSON.parse(data);
      console.log('Parsed QR data:', parsedData);
      if (parsedData.gid || parsedData.name) {
        onScan(data);
      } else {
        CustomAlertService.showError(
          isRTL ? 'رمز QR غير صالح' : 'Invalid QR Code',
          isRTL ? 'هذا ليس رمز GUILD صالح' : 'This is not a valid GUILD QR code',
          [
            {
              text: isRTL ? 'حاول مرة أخرى' : 'Try Again',
              onPress: () => setScanned(false)
            }
          ]
        );
      }
    } catch (error) {
      console.error('QR parsing error:', error);
      CustomAlertService.showError(
        isRTL ? 'رمز QR غير صالح' : 'Invalid QR Code',
        isRTL ? 'تعذر قراءة رمز QR' : 'Could not read QR code',
        [
          {
            text: isRTL ? 'حاول مرة أخرى' : 'Try Again',
            onPress: () => setScanned(false)
          }
        ]
      );
    }
  };

  const handleTestScan = () => {
    // Test QR code data (same as profile screen)
    const testData = JSON.stringify({
      name: 'John Doe',
      guild: 'GUILD',
      gid: '12345678',
      userId: 'test123',
      timestamp: Date.now()
    });
    handleBarCodeScanned({ type: 'qr', data: testData });
  };

  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getScanTypeTitle = () => {
    switch (scanType) {
      case 'JOB_START':
        return isRTL ? 'مسح لبدء المهمة' : 'Scan to Start Job';
      case 'JOB_COMPLETE':
        return isRTL ? 'مسح لإكمال المهمة' : 'Scan to Complete Job';
      case 'VERIFICATION':
        return isRTL ? 'مسح للتحقق' : 'Scan to Verify';
      default:
        return isRTL ? 'مسح رمز GUILD' : 'Scan GUILD QR Code';
    }
  };

  const getScanTypeDescription = () => {
    switch (scanType) {
      case 'JOB_START':
        return isRTL ? 'امسح رمز QR الخاص بالعامل لبدء المهمة' : 'Scan worker\'s QR code to start the job';
      case 'JOB_COMPLETE':
        return isRTL ? 'امسح رمز QR الخاص بالعامل لإكمال المهمة' : 'Scan worker\'s QR code to complete the job';
      case 'VERIFICATION':
        return isRTL ? 'امسح رمز QR للتحقق من الهوية' : 'Scan QR code to verify identity';
      default:
        return isRTL ? 'وجه الكاميرا نحو رمز GUILD QR' : 'Point camera at GUILD QR code';
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
             {/* Camera View */}
             <View style={styles.camera}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {getScanTypeTitle()}
            </Text>
            <Text style={styles.headerSubtitle}>
              {getScanTypeDescription()}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.flashButton}
            onPress={toggleFlash}
          >
            <MaterialIcons 
              name={isFlashOn ? "flash-on" : "flash-off"} 
              size={28} 
              color={isFlashOn ? theme.primary : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Scanning Area */}
        <View style={styles.scanningArea}>
          {/* Animated Glow Effect */}
          <Animated.View
            style={[
              styles.scanFrame,
              {
                shadowOpacity: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                shadowRadius: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 30],
                }),
              }
            ]}
          >
            {/* Corner Indicators */}
            <Animated.View 
              style={[
                styles.corner, 
                styles.topLeft,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            />
            <Animated.View 
              style={[
                styles.corner, 
                styles.topRight,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            />
            <Animated.View 
              style={[
                styles.corner, 
                styles.bottomLeft,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            />
            <Animated.View 
              style={[
                styles.corner, 
                styles.bottomRight,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            />

            {/* Scanning Line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanLineAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -240],
                    })
                  }]
                }
              ]}
            />
          </Animated.View>
          
          {/* Test Button */}
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primary }]}
            onPress={handleTestScan}
          >
            <Text style={[styles.testButtonText, { color: theme.buttonText }]}>
              {isRTL ? 'اختبار المسح' : 'Test Scan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Instructions */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.footer}
        >
          <View style={styles.instructionsContainer}>
            <MaterialIcons name="qr-code-scanner" size={32} color={theme.primary} />
            <Text style={styles.instructionTitle}>
              {isRTL ? 'وجه الكاميرا نحو رمز QR' : 'Point camera at QR code'}
            </Text>
            <Text style={styles.instructionSubtitle}>
              {isRTL 
                ? 'سيتم المسح تلقائياً عند اكتشاف الرمز'
                : 'Scanning will happen automatically'
              }
            </Text>
          </View>
        </LinearGradient>
             </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONT_FAMILY,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    shadowColor: '#BCFF31',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#BCFF31',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: '#BCFF31',
    shadowColor: '#BCFF31',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 20,
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONT_FAMILY,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  testButton: {
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});
