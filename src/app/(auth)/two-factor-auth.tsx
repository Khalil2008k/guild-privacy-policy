import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Lock, Check, X, Key, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { BackendAPI } from '../../config/backend';
import { useAuth } from '../../contexts/AuthContext';

const FONT_FAMILY = 'Signika Negative SC';

interface TwoFactorAuthProps {
  method?: 'sms' | 'email';
  phoneNumber?: string;
  email?: string;
}

export default function TwoFactorAuthScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // State management
  const [method, setMethod] = useState<'sms' | 'email'>('sms');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Refs for OTP inputs
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Mock data - replace with actual user data
  const phoneNumber = '+974 5555 1234';
  const email = 'user@example.com';

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus next input
  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields are filled
    if (newCode.every(digit => digit !== '') && !isLoading) {
      handleVerifyCode(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Shake animation for wrong code
  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Verify the entered code
  const handleVerifyCode = async (enteredCode: string) => {
    setIsLoading(true);
    
    try {
      // Real backend verification via SMS
      const response = await BackendAPI.post('/auth/sms/verify-2fa', {
        code: enteredCode
      });
      
      let isValid = response && response.success;
      
      // Fallback to demo mode if backend not available
      if (!response) {
        console.log('Backend not available, using demo verification');
        isValid = enteredCode === '123456'; // Demo fallback
      }
      
      if (isValid) {
        // Success - navigate to main app
        CustomAlertService.showSuccess(
          t('success'),
          t('twoFactorVerified'),
          [{ text: t('continue'), style: 'default', onPress: () => router.replace('/(main)/home') }]
        );
      } else {
        // Failed verification
        setAttempts(prev => prev + 1);
        setCode(['', '', '', '', '', '']);
        shakeInputs();
        
        if (attempts >= 2) {
          CustomAlertService.showError(
            t('tooManyAttempts'),
            t('accountTemporarilyLocked'),
            [{ text: t('ok'), onPress: () => router.back() }]
          );
        } else {
          CustomAlertService.showError(t('invalidCode'), t('pleaseCheckAndTryAgain'));
        }
        
        // Focus first input
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      CustomAlertService.showError(t('error'), t('verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    
    try {
      // Mock resend - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCountdown(60); // 60 second countdown
      setCode(['', '', '', '', '', '']);
      setAttempts(0);
      
      CustomAlertService.showSuccess(
        t('codeSent'),
        method === 'sms' 
          ? t('newCodeSentToPhone', { phone: phoneNumber })
          : t('newCodeSentToEmail', { email })
      );
      
      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (error) {
      CustomAlertService.showError(t('error'), t('failedToSendCode'));
    } finally {
      setIsResending(false);
    }
  };

  // Switch verification method
  const switchMethod = () => {
    const newMethod = method === 'sms' ? 'email' : 'sms';
    setMethod(newMethod);
    setCode(['', '', '', '', '', '']);
    setAttempts(0);
    setCountdown(0);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle={theme.background === '#000000' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background} 
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
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('twoFactorAuthentication')}
        </Text>
        
        <TouchableOpacity 
          style={styles.methodSwitch}
          onPress={switchMethod}
        >
          <MaterialIcons 
            name={method === 'sms' ? 'email' : 'sms'} 
            size={20} 
            color={theme.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Security Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
          <MaterialIcons name="security" size={48} color={theme.primary} />
        </View>

        {/* Title and Description */}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('enterVerificationCode')}
        </Text>
        
        <Text style={[styles.description, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
          {method === 'sms' 
            ? t('codeSentToPhone', { phone: phoneNumber })
            : t('codeSentToEmail', { email })
          }
        </Text>

        {/* OTP Input */}
        <Animated.View 
          style={[
            styles.otpContainer,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[
                styles.otpInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: digit ? theme.primary : theme.border,
                  color: theme.textPrimary,
                }
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value.slice(-1), index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </Animated.View>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.textSecondary }]}>
            {t('didntReceiveCode')}
          </Text>
          
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendCode}
            disabled={countdown > 0 || isResending}
          >
            <Text style={[
              styles.resendButtonText,
              { 
                color: countdown > 0 || isResending ? theme.textSecondary : theme.primary 
              }
            ]}>
              {isResending 
                ? t('sending') 
                : countdown > 0 
                  ? t('resendIn', { seconds: countdown })
                  : t('resendCode')
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Attempts Warning */}
        {attempts > 0 && (
          <View style={[styles.warningContainer, { backgroundColor: theme.error + '20' }]}>
            <Ionicons name="warning" size={16} color={theme.error} />
            <Text style={[styles.warningText, { color: theme.error }]}>
              {t('attemptsRemaining', { remaining: 3 - attempts })}
            </Text>
          </View>
        )}
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={[theme.primary + '20', theme.primary + '40']}
            style={styles.loadingContainer}
          >
            <MaterialIcons name="security" size={32} color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
              {t('verifying')}
            </Text>
          </LinearGradient>
        </View>
      )}
    </KeyboardAvoidingView>
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
  methodSwitch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: 40,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginHorizontal: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
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
