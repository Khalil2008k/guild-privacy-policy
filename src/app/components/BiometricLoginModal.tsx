import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import BiometricAuthService from '../../utils/biometricAuth';

const FONT_FAMILY = 'Signika Negative SC';

interface BiometricLoginModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onError?: (error: string) => void;
  title?: string;
  subtitle?: string;
  operation?: string;
}

export default function BiometricLoginModal({
  visible,
  onSuccess,
  onCancel,
  onError,
  title,
  subtitle,
  operation = 'authenticate'
}: BiometricLoginModalProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  // State management
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('biometric');
  const [authAttempted, setAuthAttempted] = useState(false);

  // Animation
  const pulseAnimation = new Animated.Value(1);
  const fadeAnimation = new Animated.Value(0);

  // Check biometric type on mount
  useEffect(() => {
    if (visible) {
      checkBiometricType();
      setAuthAttempted(false);
      
      // Fade in animation
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-start authentication after a brief delay
      setTimeout(() => {
        handleAuthenticate();
      }, 500);
    } else {
      fadeAnimation.setValue(0);
    }
  }, [visible]);

  // Pulse animation for biometric icon
  useEffect(() => {
    if (visible && !authAttempted) {
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
        ]).start(() => {
          if (visible && !authAttempted) pulse();
        });
      };
      pulse();
    }
  }, [visible, authAttempted]);

  // Check biometric type
  const checkBiometricType = async () => {
    try {
      const type = await BiometricAuthService.getBiometricType();
      setBiometricType(type || 'biometric');
    } catch (error) {
      console.error('Error checking biometric type:', error);
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
    if (title) return title;
    
    switch (biometricType) {
      case 'face':
        return t('authenticateWithFaceId');
      case 'fingerprint':
        return t('authenticateWithFingerprint');
      case 'iris':
        return t('authenticateWithIris');
      default:
        return t('authenticateWithBiometric');
    }
  };

  // Get biometric subtitle based on type
  const getBiometricSubtitle = () => {
    if (subtitle) return subtitle;
    
    switch (biometricType) {
      case 'face':
        return t('lookAtCameraToAuthenticate');
      case 'fingerprint':
        return t('touchSensorToAuthenticate');
      case 'iris':
        return t('lookAtSensorToAuthenticate');
      default:
        return t('useBiometricToAuthenticate');
    }
  };

  // Handle authentication
  const handleAuthenticate = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setAuthAttempted(true);

    try {
      // First check if biometric is available
      const isAvailable = await BiometricAuthService.isAvailable();
      if (!isAvailable) {
        console.log('🔒 Biometric not available, showing fallback message');
        setIsAuthenticating(false);
        
        // Show a user-friendly message for emulators/unsupported devices
        CustomAlertService.showConfirmation(
          t('biometricNotAvailable'),
          t('biometricEmulatorMessage'),
          () => onSuccess(),
          () => onCancel(),
          isRTL
        );
        return;
      }

      const promptMessage = `${t('authenticateTo')} ${operation}`;
      const result = await BiometricAuthService.authenticate(promptMessage);

      if (result.success) {
        console.log('✅ Biometric authentication successful in modal');
        onSuccess();
      } else {
        console.log('❌ Biometric authentication failed in modal:', result.error);
        
        // Handle different error types
        if (result.error === 'user_cancel') {
          onCancel();
        } else {
          const errorMessage = getErrorMessage(result.error || 'authentication_failed');
          onError?.(errorMessage);
        }
      }
    } catch (error) {
      console.error('🔒 Biometric authentication error in modal:', error);
      onError?.(t('biometricAuthError'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Get error message based on error type
  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'user_cancel':
        return t('biometricCancelled');
      case 'user_fallback':
        return t('biometricFallback');
      case 'biometric_not_available':
        return t('biometricNotAvailable');
      case 'biometric_not_enrolled':
        return t('biometricNotEnrolled');
      case 'authentication_failed':
        return t('biometricAuthFailed');
      default:
        return t('biometricAuthError');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container, 
            { 
              backgroundColor: theme.background,
              opacity: fadeAnimation
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onCancel}
            >
              <MaterialIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Biometric Icon */}
            <Animated.View 
              style={[
                styles.iconContainer, 
                { 
                  backgroundColor: theme.primaryLight,
                  transform: [{ scale: pulseAnimation }]
                }
              ]}
            >
              <MaterialIcons 
                name={getBiometricIcon()} 
                size={48} 
                color={theme.primary} 
              />
            </Animated.View>

            {/* Title and Subtitle */}
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {getBiometricTitle()}
            </Text>
            
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {getBiometricSubtitle()}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.primaryButton, 
                  { 
                    backgroundColor: theme.primary,
                    opacity: isAuthenticating ? 0.7 : 1
                  }
                ]}
                onPress={handleAuthenticate}
                disabled={isAuthenticating}
              >
                <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                  {isAuthenticating ? t('authenticating') : t('tryAgain')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={onCancel}
                disabled={isAuthenticating}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading Overlay */}
          {isAuthenticating && (
            <View style={styles.loadingOverlay}>
              <LinearGradient
                colors={[theme.primary + '20', theme.primary + '40']}
                style={styles.loadingContainer}
              >
                <MaterialIcons name={getBiometricIcon()} size={32} color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
                  {t('authenticating')}
                </Text>
              </LinearGradient>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  loadingContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginTop: 8,
  },
});
