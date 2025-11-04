import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Text,
  TextInput,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Shield, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Fingerprint,
  Check
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import BiometricAuthService from '../../utils/biometricAuth';
import { CustomAlertService } from '../../services/CustomAlertService';
import { detectAuthInputType, getInputPlaceholder, getInputIcon, AuthInputType } from '../../utils/authInputDetector';
import AsyncStorage from '@react-native-async-storage/async-storage';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const FONT_FAMILY = 'SignikaNegative_400Regular';

export default function SignInScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { signInWithEmail, signIn } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [identifier, setIdentifier] = useState(''); // Unified input: email/phone/GID
  const [detectedType, setDetectedType] = useState<AuthInputType>('unknown');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();

    // Check biometric availability
    checkBiometricAvailability();
    
    // Load saved credentials if "Remember Me" was enabled
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');
      
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔐 Remember Me: Loading saved credentials...', { 
        hasSavedEmail: !!savedEmail, 
        rememberMeEnabled: savedRememberMe === 'true',
        savedEmail: savedEmail || 'none'
      });
      
      if (savedEmail && savedRememberMe === 'true') {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('✅ Remember Me: Auto-filling email:', savedEmail);
        setIdentifier(savedEmail);
        setRememberMe(true);
        const result = detectAuthInputType(savedEmail);
        setDetectedType(result.type);
      } else {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('ℹ️ Remember Me: No saved credentials found', {
          reason: !savedEmail ? 'No email saved' : 'Remember Me was not enabled'
        });
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('❌ Remember Me: Error loading saved credentials:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await BiometricAuthService.isAvailable();
      setBiometricAvailable(isAvailable);
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔒 Biometric availability:', isAvailable);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('🔒 Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  // Enhanced Firebase auth error handling
  const getAuthErrorMessage = (errorCode: string, isRTL: boolean): string => {
    const errorMessages: Record<string, { en: string; ar: string }> = {
      'auth/user-not-found': {
        en: 'No account found with this email address',
        ar: 'لا يوجد حساب بهذا البريد الإلكتروني'
      },
      'auth/wrong-password': {
        en: 'Incorrect password. Please try again',
        ar: 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى'
      },
      'auth/invalid-email': {
        en: 'Invalid email address format',
        ar: 'تنسيق البريد الإلكتروني غير صالح'
      },
      'auth/user-disabled': {
        en: 'This account has been disabled. Please contact support',
        ar: 'تم تعطيل هذا الحساب. يرجى التواصل مع الدعم'
      },
      'auth/too-many-requests': {
        en: 'Too many failed attempts. Please try again later',
        ar: 'محاولات كثيرة فاشلة. يرجى المحاولة لاحقاً'
      },
      'auth/network-request-failed': {
        en: 'Network error. Please check your connection',
        ar: 'خطأ في الشبكة. يرجى التحقق من الاتصال'
      },
      'auth/invalid-credential': {
        en: 'Invalid credentials. Please check your email and password',
        ar: 'بيانات اعتماد غير صحيحة. يرجى التحقق من البريد وكلمة المرور'
      },
      'auth/account-exists-with-different-credential': {
        en: 'An account already exists with this email',
        ar: 'يوجد حساب بالفعل بهذا البريد الإلكتروني'
      },
      'auth/operation-not-allowed': {
        en: 'Sign-in method not enabled. Please contact support',
        ar: 'طريقة تسجيل الدخول غير مفعلة. يرجى التواصل مع الدعم'
      },
      'auth/weak-password': {
        en: 'Password is too weak. Please use a stronger password',
        ar: 'كلمة المرور ضعيفة جداً. يرجى استخدام كلمة مرور أقوى'
      },
      'auth/email-already-in-use': {
        en: 'This email is already registered',
        ar: 'هذا البريد الإلكتروني مسجل بالفعل'
      },
      'auth/requires-recent-login': {
        en: 'Please sign in again to complete this action',
        ar: 'يرجى تسجيل الدخول مرة أخرى لإكمال هذا الإجراء'
      }
    };

    const error = errorMessages[errorCode];
    if (error) {
      return isRTL ? error.ar : error.en;
    }

    // Default fallback message
    return isRTL ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى' : 'An unexpected error occurred. Please try again';
  };

  // Handle identifier input change and detect type
  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    const result = detectAuthInputType(text);
    setDetectedType(result.type);
  };

  const handleSignIn = async () => {
    if (!identifier.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف أو معرّف جيلد' : 'Please enter your email, phone, or Guild ID'
      );
      return;
    }

    const inputResult = detectAuthInputType(identifier);

    // If phone number, navigate to phone verification
    if (inputResult.type === 'phone') {
      if (!inputResult.isValid) {
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          inputResult.errorMessage || (isRTL ? 'رقم هاتف غير صالح' : 'Invalid phone number')
        );
        return;
      }
      
      // Navigate to phone verification with pre-filled number
      router.push({
        pathname: '/(auth)/phone-verification',
        params: { phoneNumber: inputResult.formattedValue }
      });
      return;
    }

    // For email or GID, require password
    if (!password.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال كلمة المرور' : 'Please enter your password'
      );
      return;
    }

    if (!inputResult.isValid) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        inputResult.errorMessage || (isRTL ? 'معلومات غير صالحة' : 'Invalid credentials')
      );
      return;
    }

    setLoading(true);
    try {
      // Save credentials BEFORE sign-in to ensure it completes
      if (rememberMe) {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('💾 Remember Me: Saving email for next time:', inputResult.formattedValue);
        await AsyncStorage.setItem('rememberedEmail', inputResult.formattedValue);
        await AsyncStorage.setItem('rememberMe', 'true');
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('✅ Remember Me: Email saved successfully');
      } else {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('🗑️ Remember Me: Clearing saved credentials');
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberMe');
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('✅ Remember Me: Credentials cleared');
      }
      
      // Now sign in
      await signInWithEmail(inputResult.formattedValue, password);
      
      router.replace('/(main)/home');
    } catch (error: any) {
      // Expected authentication failures (wrong password, etc.) - not actual errors
      const isExpectedAuthFailure = [
        'auth/invalid-credential',
        'auth/wrong-password',
        'auth/user-not-found',
        'auth/invalid-email',
        'auth/user-disabled',
      ].includes(error.code);

      if (isExpectedAuthFailure) {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('🔐 Authentication failed:', error.code);
      } else {
        // Actual unexpected errors (network, server issues)
        // COMMENT: PRIORITY 1 - Replace console.error with logger
        logger.error('🔐 Sign-in error:', error);
      }
      
      const errorMessage = getAuthErrorMessage(error.code || 'unknown', isRTL);
      
      CustomAlertService.showError(isRTL ? 'خطأ في تسجيل الدخول' : 'Sign-in Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔒 Starting biometric authentication...');
      
      // Import LocalAuthentication
      const LocalAuthentication = require('expo-local-authentication');
      
      // Check device capabilities
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔒 Device biometric check:', { hasHardware, isEnrolled });
      
      if (!hasHardware) {
        CustomAlertService.showError(
          isRTL ? 'غير مدعوم' : 'Not Supported',
          isRTL ? 'هذا الجهاز لا يدعم المصادقة البيومترية' : 'This device does not support biometric authentication'
        );
        return;
      }
      
      if (!isEnrolled) {
        CustomAlertService.showError(
          isRTL ? 'غير مُعد' : 'Not Set Up',
          isRTL ? 'لم يتم إعداد المصادقة البيومترية على هذا الجهاز' : 'Biometric authentication is not set up on this device'
        );
        return;
      }
      
      // Authenticate with device
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: isRTL ? 'استخدم بصمة إصبعك لتسجيل الدخول إلى GUILD' : 'Use your fingerprint to sign in to GUILD',
        cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
        fallbackLabel: isRTL ? 'استخدم كلمة المرور' : 'Use Password',
        disableDeviceFallback: false,
      });
      
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('🔒 Biometric result:', result);
      
      if (result.success) {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('✅ Biometric authentication successful!');
        
        // Demo credentials for testing
        const demoEmail = 'demo@guild.app';
        const demoPassword = 'demo123';
        
        try {
          await signInWithEmail(demoEmail, demoPassword);
          router.replace('/(main)/home');
        } catch (firebaseError: any) {
          // COMMENT: PRIORITY 1 - Replace console.log with logger
          logger.debug('Demo account setup needed');
          CustomAlertService.showInfo(
            isRTL ? 'إعداد مطلوب' : 'Setup Required',
            isRTL ? 'للاستخدام الأول، يرجى تسجيل الدخول بالبريد الإلكتروني' : 'For first use, please sign in with email',
            [
              {
                text: isRTL ? 'موافق' : 'OK',
                style: 'default'
              }
            ]
          );
        }
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('🔒 Biometric authentication error:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل المصادقة البيومترية' : 'Biometric authentication failed'
      );
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/account-recovery');
  };


  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top + 12,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          {isRTL ? (
            <ChevronRight size={24} color={theme.textPrimary} />
          ) : (
            <ChevronLeft size={24} color={theme.textPrimary} />
          )}
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Logo */}
        <View style={styles.logoContainer}>
          <Shield size={60} color={theme.primary} />
          <Text style={[styles.logoText, { color: theme.primary }]}>
            GUILD
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isRTL ? 'مرحباً بعودتك' : 'Welcome back'}
          </Text>
        </View>

        {/* Unified Input: Email / Phone / Guild ID */}
        <View style={styles.inputContainer}>
          {/* Options Label */}
          <Text style={[styles.optionsLabel, { 
            color: theme.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
            marginBottom: 8,
          }]}>
            {isRTL ? 'البريد / الهاتف / GID' : 'Email / Phone / GID'}
          </Text>
          <TextInput
            placeholder={getInputPlaceholder(detectedType, isRTL)}
            placeholderTextColor={theme.textSecondary}
            value={identifier}
            onChangeText={handleIdentifierChange}
            keyboardType={detectedType === 'phone' ? 'phone-pad' : 'email-address'}
            autoCapitalize={detectedType === 'gid' ? 'characters' : 'none'}
            autoComplete={detectedType === 'email' ? 'email' : detectedType === 'phone' ? 'tel' : 'off'}
            style={[styles.textInput, { 
              backgroundColor: theme.surface, 
              borderColor: theme.border, 
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left'
            }]}
          />
          {detectedType !== 'unknown' && (
            <View style={[styles.typeIndicator, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
              <Text style={[styles.typeIndicatorText, { color: theme.primary }]}>
                {detectedType === 'email' && (isRTL ? 'بريد' : 'Email')}
                {detectedType === 'phone' && (isRTL ? 'هاتف' : 'Phone')}
                {detectedType === 'gid' && (isRTL ? 'معرّف' : 'GID')}
              </Text>
            </View>
          )}
        </View>

        {/* Password Input (only for email/GID, not phone) */}
        {detectedType !== 'phone' && (
          <View style={styles.inputContainer}>
            <TextInput
              placeholder={isRTL ? 'كلمة المرور' : 'Password'}
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={[styles.textInput, { 
                backgroundColor: theme.surface, 
                borderColor: theme.border, 
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left'
              }]}
            />
            <TouchableOpacity
              style={[styles.eyeButton, { right: isRTL ? undefined : 12, left: isRTL ? 12 : undefined }]}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.textSecondary} />
              ) : (
                <Eye size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phone hint */}
        {detectedType === 'phone' && (
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>
            {isRTL ? '📱 سنرسل لك رمز التحقق عبر الرسائل القصيرة' : '📱 We\'ll send you a verification code via SMS'}
          </Text>
        )}

          {/* Remember Me & Forgot Password */}
          <View style={[styles.rememberForgotContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Remember Me Checkbox */}
            <TouchableOpacity
              style={[styles.rememberMeContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                { 
                  backgroundColor: rememberMe ? theme.primary : 'transparent',
                  borderColor: rememberMe ? theme.primary : theme.border
                }
              ]}>
                {rememberMe && <Check size={16} color="#000000" strokeWidth={3} />}
              </View>
              <Text style={[styles.rememberMeText, { color: theme.textPrimary }]}>
                {isRTL ? 'تذكرني' : 'Remember Me'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
          </View>

        {/* Fingerprint Option */}
          {biometricAvailable && (
        <TouchableOpacity
          style={[styles.fingerprintButton, { 
            backgroundColor: theme.surface, 
            borderColor: theme.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }]}
          onPress={handleBiometricAuth}
          activeOpacity={0.8}
        >
              <Fingerprint size={24} color={theme.primary} />
          <Text style={[styles.fingerprintText, { 
            color: theme.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }]}>
            {isRTL ? 'تسجيل الدخول ببصمة الإصبع' : 'Sign in with Fingerprint'}
          </Text>
        </TouchableOpacity>
          )}

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: theme.primary }]}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
              <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text style={styles.buttonText}>
              {detectedType === 'phone' 
                ? (isRTL ? 'متابعة' : 'Continue') 
                : (isRTL ? 'تسجيل الدخول' : 'Sign In')
              }
            </Text>
          )}
        </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={[styles.signUpContainer, {
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }]}>
            <Text style={[styles.signUpText, { 
              color: theme.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }]}>
              {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}
          </Text>
            <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
              <Text style={[styles.signUpLink, { 
                color: theme.primary,
                textAlign: isRTL ? 'right' : 'left',
              }]}>
                {isRTL ? ' إنشاء حساب' : ' Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
            
        </Animated.View>
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  typeIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  typeIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  optionsLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginTop: -8,
    marginBottom: 12,
    textAlign: 'center',
  },
  textInput: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  eyeButton: {
    position: 'absolute',
    top: 8,
    padding: 8,
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  forgotPasswordButton: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  fingerprintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 12,
  },
  fingerprintText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  devBypassButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  devBypassText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
  },
  signUpLink: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
});
