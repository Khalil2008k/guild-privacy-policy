import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Fingerprint, Check, X, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';

const FONT_FAMILY = 'Signika Negative SC';

export default function BiometricSetupScreen() {
  const { top } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();

  // Advanced Light Mode Colors
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Animation
  const pulseAnimation = new Animated.Value(1);
  const fadeAnimation = new Animated.Value(0);

  // Check biometric capabilities on mount
  useEffect(() => {
    console.log('🔒 BiometricSetup: Component mounted');
    console.log('🔒 BiometricSetup: Theme background:', theme.background);
    console.log('🔒 BiometricSetup: Theme textPrimary:', theme.textPrimary);
    
    checkBiometricSupport();
    
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation for biometric icon
  useEffect(() => {
    if (isSupported && !setupComplete) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [isSupported, setupComplete]);

  // Check if biometric authentication is supported
  const checkBiometricSupport = async () => {
    try {
      console.log('🔒 BiometricSetup: Checking biometric support...');
      
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('🔒 BiometricSetup: Hardware compatible:', compatible);
      console.log('🔒 BiometricSetup: Biometric enrolled:', enrolled);
      console.log('🔒 BiometricSetup: Supported types:', supportedTypes);
      
      setIsSupported(compatible);
      setIsEnrolled(enrolled);
      
      console.log('🔒 BiometricSetup: State updated - isSupported:', compatible, 'isEnrolled:', enrolled);
      
      // Determine biometric type
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
        console.log('🔒 BiometricSetup: Detected Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
        console.log('🔒 BiometricSetup: Detected Fingerprint');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('iris');
        console.log('🔒 BiometricSetup: Detected Iris');
      } else {
        setBiometricType('biometric');
        console.log('🔒 BiometricSetup: Generic biometric type');
      }
    } catch (error) {
      console.error('🔒 BiometricSetup: Error checking biometric support:', error);
      setIsSupported(false);
    }
  };

  // Get biometric icon based on type
  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'face':
        return Platform.OS === 'ios' ? 'face-id' : 'face-recognition';
      case 'fingerprint':
        return 'fingerprint';
      case 'iris':
        return 'remove-red-eye';
      default:
        return 'security';
    }
  };

  // Get biometric title based on type
  const getBiometricTitle = () => {
    switch (biometricType) {
      case 'face':
        return t('faceIdSetup');
      case 'fingerprint':
        return t('fingerprintSetup');
      case 'iris':
        return t('irisSetup');
      default:
        return t('biometricSetup');
    }
  };

  // Get biometric description based on type
  const getBiometricDescription = () => {
    switch (biometricType) {
      case 'face':
        return t('faceIdDescription');
      case 'fingerprint':
        return t('fingerprintDescription');
      case 'iris':
        return t('irisDescription');
      default:
        return t('biometricDescription');
    }
  };

  // Enable biometric authentication
  const enableBiometric = async () => {
    if (!isSupported) {
      CustomAlertService.showError(t('notSupported'), t('biometricNotSupported'));
      return;
    }

    if (!isEnrolled) {
      CustomAlertService.showError(
        t('notEnrolled'), 
        t('biometricNotEnrolled'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('settings'), onPress: () => LocalAuthentication.openSettingsAsync() }
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Configure authentication options based on biometric type
      const authOptions = {
        promptMessage: t('authenticateToEnable'),
        cancelLabel: t('cancel'),
        fallbackLabel: t('usePassword'),
        disableDeviceFallback: false,
        requireConfirmation: true,
      };

      // Add platform-specific configurations
      if (Platform.OS === 'ios') {
        authOptions.fallbackLabel = t('usePasscode');
      }

      console.log('🔒 Starting biometric authentication...');
      const result = await LocalAuthentication.authenticateAsync(authOptions);

      console.log('🔒 Biometric authentication result:', result);

      if (result.success) {
        console.log('✅ Biometric authentication successful!');
        
        // Save biometric preference with additional metadata
        const biometricData = {
          enabled: true,
          type: biometricType,
          setupDate: new Date().toISOString(),
          deviceId: Platform.OS + '_' + Date.now(),
        };

        await AsyncStorage.setItem('biometricEnabled', 'true');
        await AsyncStorage.setItem('biometricType', biometricType);
        await AsyncStorage.setItem('biometricData', JSON.stringify(biometricData));
        
        setSetupComplete(true);
        
        // Success animation and navigation
        setTimeout(() => {
          CustomAlertService.showSuccess(
            t('success'),
            t('biometricEnabledSuccess'),
            [{ 
              text: t('continue'), 
              style: 'default',
              onPress: () => router.replace('/(main)/home') 
            }]
          );
        }, 1000);
      } else {
        // Handle different failure reasons
        let errorMessage = t('biometricAuthFailed');
        
        if (result.error === 'user_cancel') {
          errorMessage = t('biometricCancelled');
        } else if (result.error === 'user_fallback') {
          errorMessage = t('biometricFallback');
        } else if (result.error === 'biometric_not_available') {
          errorMessage = t('biometricNotAvailable');
        } else if (result.error === 'biometric_not_enrolled') {
          errorMessage = t('biometricNotEnrolled');
        }

        console.log('❌ Biometric authentication failed:', result.error);
        CustomAlertService.showError(t('authenticationFailed'), errorMessage);
      }
    } catch (error) {
      console.error('🔒 Biometric authentication error:', error);
      
      let errorMessage = t('biometricSetupError');
      if (error.message?.includes('not available')) {
        errorMessage = t('biometricNotAvailable');
      } else if (error.message?.includes('not enrolled')) {
        errorMessage = t('biometricNotEnrolled');
      }
      
      CustomAlertService.showError(t('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip biometric setup
  const skipSetup = () => {
    CustomAlertService.showConfirmation(
      t('skipBiometric'),
      t('skipBiometricConfirm'),
      async () => {
        await AsyncStorage.setItem('biometricEnabled', 'false');
        router.replace('/(main)/home');
      },
      undefined,
      isRTL
    );
  };

  // Render not supported state
  if (!isSupported) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar 
          barStyle={theme.background === '#000000' ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.background} 
        />
        
        <View style={[styles.header, { paddingTop: top + 16 }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name={isRTL ? "chevron-forward" : "chevron-back"} 
              size={24} 
              color={theme.textPrimary} 
            />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('biometricAuthentication')}
          </Text>
          
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
            <MaterialIcons name="error-outline" size={48} color={theme.error} />
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {t('notSupported')}
          </Text>
          
          <Text style={[styles.description, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('biometricNotSupported')}
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.replace('/(main)/home')}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
              {t('continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background || '#000000' }]}>
      <StatusBar 
        barStyle={(theme.background || '#000000') === '#000000' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background || '#000000'} 
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color={theme.textPrimary} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary || '#FFFFFF' }]}>
          {t('biometricAuthentication')}
        </Text>
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={skipSetup}
        >
          <Text style={[styles.skipButtonText, { color: theme.textSecondary || '#CCCCCC' }]}>
            {t('skip')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Biometric Icon */}
        <Animated.View 
          style={[
            styles.iconContainer, 
            { 
              backgroundColor: setupComplete ? (theme.success || '#00FF00') + '20' : (theme.primaryLight || theme.primary || '#BCFF31') + '20',
              transform: [{ scale: pulseAnimation }]
            }
          ]}
        >
          <MaterialIcons 
            name={setupComplete ? 'check-circle' : getBiometricIcon()} 
            size={48} 
            color={setupComplete ? (theme.success || '#00FF00') : (theme.primary || '#BCFF31')} 
          />
        </Animated.View>

        {/* Title and Description */}
        <Text style={[styles.title, { color: theme.textPrimary || '#FFFFFF' }]}>
          {setupComplete ? t('setupComplete') : getBiometricTitle()}
        </Text>
        
        <Text style={[styles.description, { color: theme.textSecondary || '#CCCCCC', textAlign: isRTL ? 'right' : 'left' }]}>
          {setupComplete ? t('biometricSetupCompleteDesc') : getBiometricDescription()}
        </Text>

        {/* Setup Status */}
        {!setupComplete && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusItem, { borderColor: theme.border || '#333333' }]}>
              <MaterialIcons 
                name={isSupported ? 'check-circle' : 'cancel'} 
                size={20} 
                color={isSupported ? (theme.success || '#00FF00') : (theme.error || '#FF0000')} 
              />
              <Text style={[styles.statusText, { color: theme.textSecondary || '#CCCCCC' }]}>
                {t('deviceSupported')}
              </Text>
            </View>
            
            <View style={[styles.statusItem, { borderColor: theme.border || '#333333' }]}>
              <MaterialIcons 
                name={isEnrolled ? 'check-circle' : 'warning'} 
                size={20} 
                color={isEnrolled ? (theme.success || '#00FF00') : (theme.warning || '#FFA500')} 
              />
              <Text style={[styles.statusText, { color: theme.textSecondary || '#CCCCCC' }]}>
                {t('biometricEnrolled')}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!setupComplete ? (
            <>
              <TouchableOpacity
                style={[
                  styles.primaryButton, 
                  { 
                    backgroundColor: theme.primary || '#BCFF31',
                    opacity: (!isSupported || !isEnrolled || isLoading) ? 0.5 : 1
                  }
                ]}
                onPress={enableBiometric}
                disabled={!isSupported || !isEnrolled || isLoading}
              >
                <Text style={[styles.primaryButtonText, { color: theme.buttonText || '#000000' }]}>
                  {isLoading ? t('setting') : t('enableBiometric')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border || '#333333' }]}
                onPress={skipSetup}
                disabled={isLoading}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.textSecondary || '#CCCCCC' }]}>
                  {t('skipForNow')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary || '#BCFF31' }]}
              onPress={() => router.replace('/(main)/home')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText || '#000000' }]}>
                {t('continue')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={[theme.primary + '20', theme.primary + '40']}
            style={styles.loadingContainer}
          >
            <MaterialIcons name={getBiometricIcon()} size={32} color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
              {t('settingUpBiometric')}
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  statusContainer: {
    width: '100%',
    marginBottom: 32,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 12,
    fontFamily: FONT_FAMILY,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginTop: 12,
  },
});
