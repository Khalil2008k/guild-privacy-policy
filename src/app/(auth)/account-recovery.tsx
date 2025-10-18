import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2, Key, Shield, ChevronLeft, ChevronRight, MailCheck, KeyRound, RotateCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { BackendAPI } from '../../config/backend';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidationRules } from '../../utils/validation';
import { auth } from '../../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const FONT_FAMILY = 'Signika Negative SC';

type RecoveryStep = 'email' | 'verification' | 'newPassword' | 'success';

export default function AccountRecoveryScreen() {
  const { top } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();

  // Advanced Light Mode Colors
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000', // Black text on theme color buttons
  };

  // State management
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Animation
  const slideAnimation = new Animated.Value(0);
  const fadeAnimation = new Animated.Value(0);

  // Form validation
  const { formData, updateField, validateForm, getFieldError, isFormValid } = useFormValidation({
    email: { value: email, rules: ValidationRules.email },
    newPassword: { value: newPassword, rules: ValidationRules.password },
    confirmPassword: { 
      value: confirmPassword, 
      rules: {
        required: true,
        customValidator: (value: string) => {
          if (value !== newPassword) {
            return t('passwordsDoNotMatch');
          }
          return null;
        }
      }
    },
  });

  // Debug and animate on step change
  useEffect(() => {
    console.log('🔑 AccountRecovery: Step changed to:', currentStep);
    console.log('🔑 AccountRecovery: Theme background:', theme.background);
    
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle email submission - SEND VERIFICATION CODE VIA BACKEND
  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      CustomAlertService.showError(t('error'), t('pleaseEnterEmail'));
      return;
    }

    updateField('email', email);
    if (!validateForm()) {
      const emailError = getFieldError('email');
      if (emailError) {
        CustomAlertService.showError(t('error'), emailError);
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log('🔑 Sending verification code to:', email);
      
      // Try backend first for code-based recovery
      try {
        const response = await BackendAPI.post('/auth/password-reset/request', {
          email: email.trim()
        });
        
        if (response && response.success) {
          console.log('✅ Verification code sent via backend');
          
          setCurrentStep('verification');
          setResendTimer(60);
          
          CustomAlertService.showSuccess(
            isRTL ? 'تم الإرسال' : 'Code Sent',
            isRTL 
              ? `تم إرسال رمز التحقق المكون من 6 أرقام إلى ${email}`
              : `A 6-digit verification code has been sent to ${email}`
          );
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend unavailable, falling back to Firebase link method');
      }
      
      // Fallback to Firebase if backend is unavailable
      console.log('🔑 Using Firebase password reset link as fallback');
      await sendPasswordResetEmail(auth, email.trim());
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم الإرسال' : 'Email Sent',
        isRTL 
          ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. يرجى التحقق من بريدك الإلكتروني والنقر على الرابط.`
          : `Password reset link sent to ${email}. Check your email and click the link to reset your password in your browser.`
      );
      
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 4000);
      
    } catch (error: any) {
      console.error('🔑 Error sending recovery email:', error);
      
      let errorMessage = t('failedToSendRecoveryEmail');
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = isRTL 
          ? 'لا يوجد حساب بهذا البريد الإلكتروني'
          : 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = isRTL 
          ? 'البريد الإلكتروني غير صالح'
          : 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = isRTL 
          ? 'تم إرسال الكثير من الطلبات. يرجى المحاولة لاحقًا'
          : 'Too many requests. Please try again later';
      }
      
      CustomAlertService.showError(t('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code input
  const handleCodeInput = (value: string, index: number) => {
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = `codeInput${index + 1}`;
      // Focus next input (would need refs in real implementation)
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerificationSubmit(newCode.join(''));
    }
  };

  // Handle verification code submission
  const handleVerificationSubmit = async (code?: string) => {
    const codeToVerify = code || verificationCode.join('');
    
    if (codeToVerify.length !== 6) {
      CustomAlertService.showError(t('error'), t('pleaseEnterCompleteCode'));
      return;
    }

    setIsLoading(true);
    setAttempts(attempts + 1);

    try {
      console.log('🔑 Verifying recovery code:', codeToVerify);
      
      // Verify code with backend
      const response = await BackendAPI.post('/auth/password-reset/verify', {
        email: email.trim(),
        code: codeToVerify
      });
      
      if (response && response.success) {
        console.log('✅ Recovery code verified successfully');
        setCurrentStep('newPassword');
        
        CustomAlertService.showSuccess(
          isRTL ? 'تم التحقق' : 'Verified',
          isRTL ? 'تم التحقق من الرمز بنجاح' : 'Code verified successfully'
        );
        return;
      }
      
      throw new Error('Invalid verification code');
      
    } catch (error: any) {
      console.error('🔑 Error verifying recovery code:', error);
      
      if (attempts >= 2) {
        CustomAlertService.showError(
          isRTL ? 'محاولات كثيرة' : 'Too Many Attempts',
          isRTL ? 'محاولات فاشلة كثيرة. يرجى طلب رمز جديد' : 'Too many failed attempts. Please request a new code'
        );
        setCurrentStep('email');
        setAttempts(0);
        setVerificationCode(['', '', '', '', '', '']);
      } else {
        CustomAlertService.showError(
          isRTL ? 'رمز خاطئ' : 'Invalid Code',
          isRTL ? `رمز التحقق غير صحيح. المتبقي ${3 - attempts} محاولات` : `Invalid code. ${3 - attempts} attempts remaining`
        );
        setVerificationCode(['', '', '', '', '', '']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    updateField('newPassword', newPassword);
    updateField('confirmPassword', confirmPassword);
    
    if (!validateForm()) {
      const passwordError = getFieldError('newPassword') || getFieldError('confirmPassword');
      if (passwordError) {
        CustomAlertService.showError(t('error'), passwordError);
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      CustomAlertService.showError(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔑 Resetting password...');
      
      // Reset password via backend
      const response = await BackendAPI.post('/auth/password-reset/reset', {
        email: email.trim(),
        code: verificationCode.join(''),
        newPassword: newPassword
      });
      
      if (response && response.success) {
        console.log('✅ Password reset successfully');
        setCurrentStep('success');
        
        CustomAlertService.showSuccess(
          isRTL ? 'نجح!' : 'Success!',
          isRTL ? 'تم إعادة تعيين كلمة المرور بنجاح' : 'Your password has been reset successfully'
        );
        return;
      }
      
      throw new Error('Failed to reset password');
      
    } catch (error: any) {
      console.error('🔑 Error resetting password:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في إعادة تعيين كلمة المرور' : 'Failed to reset password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setResendTimer(60);

    try {
      console.log('🔑 Resending recovery code to:', email);
      
      // Resend verification code via backend
      const response = await BackendAPI.post('/auth/password-reset/request', {
        email: email.trim()
      });
      
      if (response && response.success) {
        console.log('✅ Recovery code resent successfully');
        CustomAlertService.showSuccess(
          isRTL ? 'تم الإرسال' : 'Code Sent',
          isRTL ? `تم إرسال رمز جديد إلى ${email}` : `A new code has been sent to ${email}`
        );
        return;
      }
      
      throw new Error('Failed to resend code');
      
    } catch (error) {
      console.error('🔑 Error resending recovery code:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في إرسال الرمز' : 'Failed to send code. Please try again.'
      );
      setResendTimer(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 'email':
        return t('accountRecovery');
      case 'verification':
        return t('verifyEmail');
      case 'newPassword':
        return t('resetPassword');
      case 'success':
        return t('passwordReset');
      default:
        return t('accountRecovery');
    }
  };

  // Get step description
  const getStepDescription = () => {
    switch (currentStep) {
      case 'email':
        return t('enterEmailForRecovery');
      case 'verification':
        return t('enterVerificationCodeSent');
      case 'newPassword':
        return t('enterNewPassword');
      case 'success':
        return t('passwordResetSuccess');
      default:
        return '';
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Mail size={48} color={theme.primary} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {getStepDescription()}
            </Text>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <Mail size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('emailAddress')}
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handleEmailSubmit}
              disabled={isLoading}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                {isLoading ? t('sending') : t('sendRecoveryEmail')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'verification':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.warning + '20' }]}>
              <MailCheck size={48} color={theme.warning} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {t('codeSentToEmail', { email })}
            </Text>

            <View style={styles.codeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.codeInput,
                    { 
                      borderColor: digit ? theme.primary : theme.border,
                      color: theme.textPrimary,
                      backgroundColor: theme.surface
                    }
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeInput(value, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => handleVerificationSubmit()}
              disabled={isLoading || verificationCode.join('').length !== 6}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                {isLoading ? t('verifying') : t('verifyCode')}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: theme.textSecondary }]}>
                {t('didntReceiveCode')}
              </Text>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={resendTimer > 0 || isLoading}
              >
                <Text style={[
                  styles.resendButton,
                  { 
                    color: resendTimer > 0 ? theme.textSecondary : theme.primary,
                    opacity: resendTimer > 0 ? 0.5 : 1
                  }
                ]}>
                  {resendTimer > 0 ? t('resendIn', { seconds: resendTimer }) : t('resendCode')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'newPassword':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.success + '20' }]}>
              <KeyRound size={48} color={theme.success} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {getStepDescription()}
            </Text>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <Lock size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('newPassword')}
                  placeholderTextColor={theme.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  textAlign={isRTL ? 'right' : 'left'}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <Lock size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('confirmNewPassword')}
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  textAlign={isRTL ? 'right' : 'left'}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handlePasswordReset}
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                {isLoading ? t('resetting') : t('resetPassword')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'success':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.success + '20' }]}>
              <CheckCircle2 size={48} color={theme.success} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t('success')}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {getStepDescription()}
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                {t('backToSignIn')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

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
          {isRTL ? (
            <ChevronRight size={24} color={theme.textPrimary} />
          ) : (
            <ChevronLeft size={24} color={theme.textPrimary} />
          )}
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary || '#FFFFFF' }]}>
          {getStepTitle()}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {['email', 'verification', 'newPassword', 'success'].map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View 
              style={[
                styles.progressDot,
                {
                  backgroundColor: 
                    ['email', 'verification', 'newPassword', 'success'].indexOf(currentStep) >= index
                      ? (theme.primary || '#BCFF31')
                      : (theme.border || '#333333')
                }
              ]}
            />
            {index < 3 && (
              <View 
                style={[
                  styles.progressLine,
                  {
                    backgroundColor: 
                      ['email', 'verification', 'newPassword', 'success'].indexOf(currentStep) > index
                        ? (theme.primary || '#BCFF31')
                        : (theme.border || '#333333')
                  }
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.animatedContent}>
            {renderStepContent()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={[theme.primary + '20', theme.primary + '40']}
            style={styles.loadingContainer}
          >
            <RotateCw size={32} color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
              {currentStep === 'email' && t('sending')}
              {currentStep === 'verification' && t('verifying')}
              {currentStep === 'newPassword' && t('resetting')}
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
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    minHeight: 400,
  },
  animatedContent: {
    flex: 1,
    minHeight: 400,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: 400,
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    fontFamily: FONT_FAMILY,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
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
