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
  Dimensions,
  Animated,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, Shield, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidationRules } from '../../utils/validation';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'Signika Negative SC';
const { width, height } = Dimensions.get('window');

type RecoveryStep = 'method' | 'verification' | 'security' | 'reset' | 'complete';

interface SecurityQuestion {
  id: string;
  question: string;
  answer: string;
}

export default function CompleteAccountRecoveryScreen() {
  const { top } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // Step management
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('method');
  const [isLoading, setIsLoading] = useState(false);
  const [stepProgress] = useState(new Animated.Value(0));

  // Recovery method selection
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone' | 'security' | null>(null);

  // Verification (Step 2)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Security Questions (Step 3)
  const [securityQuestions] = useState<SecurityQuestion[]>([
    { id: '1', question: "What was your first pet's name?", answer: '' },
    { id: '2', question: 'What city were you born in?', answer: '' },
    { id: '3', question: "What was your mother's maiden name?", answer: '' },
  ]);
  const [selectedQuestions, setSelectedQuestions] = useState<SecurityQuestion[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<{ [key: string]: string }>({});

  // Password Reset (Step 4)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form validation
  const { formData, updateField, validateForm, getFieldError, isFormValid } = useFormValidation({
    email: { value: email, rules: ValidationRules.email },
    phone: { value: phone, rules: ValidationRules.phone },
    newPassword: { value: newPassword, rules: ValidationRules.password },
  });

  useEffect(() => {
    updateField('email', email);
    updateField('phone', phone);
    updateField('newPassword', newPassword);
  }, [email, phone, newPassword]);

  const steps: RecoveryStep[] = ['method', 'verification', 'security', 'reset', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = (currentStepIndex + 1) / steps.length;

  useEffect(() => {
    Animated.timing(stepProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep === 'method') {
      if (!recoveryMethod) {
        CustomAlertService.showError(t('common.error'), 'Please select a recovery method.');
        return;
      }
      setCurrentStep('verification');
    } else if (currentStep === 'verification') {
      if (recoveryMethod === 'email' && !email) {
        CustomAlertService.showError(t('common.error'), 'Please enter your email address.');
        return;
      }
      if (recoveryMethod === 'phone' && !phone) {
        CustomAlertService.showError(t('common.error'), 'Please enter your phone number.');
        return;
      }
      if (!verificationCode) {
        CustomAlertService.showError(t('common.error'), 'Please enter the verification code.');
        return;
      }
      if (recoveryMethod === 'security') {
        setCurrentStep('security');
      } else {
        setCurrentStep('reset');
      }
    } else if (currentStep === 'security') {
      const unansweredQuestions = selectedQuestions.filter(q => !questionAnswers[q.id]?.trim());
      if (unansweredQuestions.length > 0) {
        CustomAlertService.showError(t('common.error'), 'Please answer all security questions.');
        return;
      }
      setCurrentStep('reset');
    } else if (currentStep === 'reset') {
      if (!newPassword || !confirmPassword) {
        CustomAlertService.showError(t('common.error'), 'Please fill in all password fields.');
        return;
      }
      if (newPassword !== confirmPassword) {
        CustomAlertService.showError(t('common.error'), 'Passwords do not match.');
        return;
      }
      if (!isFormValid) {
        CustomAlertService.showError(t('common.error'), 'Please fix the validation errors.');
        return;
      }
      setCurrentStep('complete');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSendCode = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResendTimer(60);
      CustomAlertService.showSuccess('Code Sent', `Verification code sent to your ${recoveryMethod}.`);
    } catch (error) {
      CustomAlertService.showError('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    await handleSendCode();
  };

  const handleCompleteRecovery = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      CustomAlertService.showSuccess(
        'Password Reset Successful',
        'Your password has been reset successfully. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            style: 'default',
            onPress: () => router.replace('/(auth)/sign-in')
          }
        ]
      );
    } catch (error) {
      CustomAlertService.showError('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              width: stepProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: theme.primary
            }
          ]}
        />
      </View>
      <Text style={[styles.stepText, { color: theme.textSecondary }]}>
        Step {currentStepIndex + 1} of {steps.length}
      </Text>
    </View>
  );

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Account Recovery</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Choose how you'd like to recover your account
      </Text>

      <View style={styles.methodsContainer}>
        <TouchableOpacity
          style={[
            styles.methodOption,
            {
              backgroundColor: recoveryMethod === 'email' ? theme.primary + '20' : theme.surface,
              borderColor: recoveryMethod === 'email' ? theme.primary : theme.border,
            }
          ]}
          onPress={() => setRecoveryMethod('email')}
        >
          <Ionicons 
            name="mail" 
            size={24} 
            color={recoveryMethod === 'email' ? theme.primary : theme.textSecondary} 
          />
          <View style={styles.methodContent}>
            <Text style={[
              styles.methodTitle,
              { color: recoveryMethod === 'email' ? theme.primary : theme.textPrimary }
            ]}>
              Email Verification
            </Text>
            <Text style={[styles.methodDescription, { color: theme.textSecondary }]}>
              Receive a verification code via email
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodOption,
            {
              backgroundColor: recoveryMethod === 'phone' ? theme.primary + '20' : theme.surface,
              borderColor: recoveryMethod === 'phone' ? theme.primary : theme.border,
            }
          ]}
          onPress={() => setRecoveryMethod('phone')}
        >
          <Ionicons 
            name="call" 
            size={24} 
            color={recoveryMethod === 'phone' ? theme.primary : theme.textSecondary} 
          />
          <View style={styles.methodContent}>
            <Text style={[
              styles.methodTitle,
              { color: recoveryMethod === 'phone' ? theme.primary : theme.textPrimary }
            ]}>
              SMS Verification
            </Text>
            <Text style={[styles.methodDescription, { color: theme.textSecondary }]}>
              Receive a verification code via SMS
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodOption,
            {
              backgroundColor: recoveryMethod === 'security' ? theme.primary + '20' : theme.surface,
              borderColor: recoveryMethod === 'security' ? theme.primary : theme.border,
            }
          ]}
          onPress={() => setRecoveryMethod('security')}
        >
          <Ionicons 
            name="shield-checkmark" 
            size={24} 
            color={recoveryMethod === 'security' ? theme.primary : theme.textSecondary} 
          />
          <View style={styles.methodContent}>
            <Text style={[
              styles.methodTitle,
              { color: recoveryMethod === 'security' ? theme.primary : theme.textPrimary }
            ]}>
              Security Questions
            </Text>
            <Text style={[styles.methodDescription, { color: theme.textSecondary }]}>
              Answer your security questions
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVerification = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        {recoveryMethod === 'email' ? 'Email Verification' : 'SMS Verification'}
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        {recoveryMethod === 'email' 
          ? 'Enter your email address to receive a verification code'
          : 'Enter your phone number to receive a verification code'
        }
      </Text>

      {recoveryMethod === 'email' ? (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.surface, 
                color: theme.textPrimary, 
                borderColor: getFieldError('email') ? theme.error : theme.border 
              }
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="your.email@example.com"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {getFieldError('email') && (
            <Text style={[styles.errorText, { color: theme.error }]}>{getFieldError('email')}</Text>
          )}
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.surface, 
                color: theme.textPrimary, 
                borderColor: getFieldError('phone') ? theme.error : theme.border 
              }
            ]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+974 1234 5678"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
          {getFieldError('phone') && (
            <Text style={[styles.errorText, { color: theme.error }]}>{getFieldError('phone')}</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.sendButton, { backgroundColor: theme.primary }]}
        onPress={handleSendCode}
        disabled={isLoading || (!email && !phone)}
      >
        <Text style={[styles.sendButtonText, { color: getContrastTextColor(theme.primary) }]}>
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Verification Code</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholder="Enter 6-digit code"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        style={styles.resendContainer}
        onPress={handleResendCode}
        disabled={resendTimer > 0}
      >
        <Text style={[styles.resendText, { color: resendTimer > 0 ? theme.textSecondary : theme.primary }]}>
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecurityQuestions = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Security Questions</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Answer your security questions to verify your identity
      </Text>

      {securityQuestions.slice(0, 2).map((question, index) => (
        <View key={question.id} style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Question {index + 1}
          </Text>
          <Text style={[styles.questionText, { color: theme.textPrimary }]}>
            {question.question}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
            value={questionAnswers[question.id] || ''}
            onChangeText={(text) => setQuestionAnswers(prev => ({ ...prev, [question.id]: text }))}
            placeholder="Your answer"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
          />
        </View>
      ))}
    </View>
  );

  const renderPasswordReset = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Create New Password</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Choose a strong password for your account
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.passwordInput,
              { 
                backgroundColor: theme.surface, 
                color: theme.textPrimary, 
                borderColor: getFieldError('newPassword') ? theme.error : theme.border 
              }
            ]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Create a strong password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {getFieldError('newPassword') && (
          <Text style={[styles.errorText, { color: theme.error }]}>{getFieldError('newPassword')}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.passwordInput,
              { 
                backgroundColor: theme.surface, 
                color: theme.textPrimary, 
                borderColor: newPassword !== confirmPassword && confirmPassword ? theme.error : theme.border 
              }
            ]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {newPassword !== confirmPassword && confirmPassword && (
          <Text style={[styles.errorText, { color: theme.error }]}>Passwords do not match</Text>
        )}
      </View>

      {/* Password Strength Indicator */}
      <View style={styles.passwordStrengthContainer}>
        <Text style={[styles.strengthLabel, { color: theme.textSecondary }]}>Password Strength:</Text>
        <View style={styles.strengthBar}>
          <View style={[
            styles.strengthIndicator,
            { 
              width: `${Math.min((newPassword.length / 8) * 100, 100)}%`,
              backgroundColor: newPassword.length < 4 ? theme.error : 
                            newPassword.length < 8 ? theme.warning : theme.success
            }
          ]} />
        </View>
        <Text style={[
          styles.strengthText,
          { 
            color: newPassword.length < 4 ? theme.error : 
                  newPassword.length < 8 ? theme.warning : theme.success
          }
        ]}>
          {newPassword.length < 4 ? 'Weak' : 
           newPassword.length < 8 ? 'Medium' : 'Strong'}
        </Text>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color={theme.success} />
      </View>
      <Text style={[styles.completeTitle, { color: theme.textPrimary }]}>
        Password Reset Complete!
      </Text>
      <Text style={[styles.completeSubtitle, { color: theme.textSecondary }]}>
        Your password has been successfully reset. You can now sign in with your new password.
      </Text>

      <TouchableOpacity
        style={[styles.completeButton, { backgroundColor: theme.primary }]}
        onPress={handleCompleteRecovery}
        disabled={isLoading}
      >
        <Text style={[styles.buttonText, { color: getContrastTextColor(theme.primary) }]}>
          {isLoading ? 'Completing...' : 'Sign In Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'method': return renderMethodSelection();
      case 'verification': return renderVerification();
      case 'security': return renderSecurityQuestions();
      case 'reset': return renderPasswordReset();
      case 'complete': return renderComplete();
      default: return renderMethodSelection();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingTop: top + 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    stepIndicator: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    progressBarContainer: {
      height: 4,
      backgroundColor: theme.surface,
      borderRadius: 2,
      marginBottom: 8,
    },
    progressBar: {
      height: '100%',
      borderRadius: 2,
    },
    stepText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    stepContainer: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    stepSubtitle: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      marginBottom: 24,
      lineHeight: 24,
    },
    methodsContainer: {
      gap: 16,
    },
    methodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      gap: 16,
    },
    methodContent: {
      flex: 1,
    },
    methodTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    methodDescription: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      paddingRight: 50,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
    },
    eyeButton: {
      position: 'absolute',
      right: 16,
      top: 16,
      padding: 4,
    },
    errorText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      marginTop: 4,
    },
    sendButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: 12,
    },
    resendText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      textDecorationLine: 'underline',
    },
    questionText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
      fontWeight: '500',
    },
    passwordStrengthContainer: {
      marginTop: 12,
    },
    strengthLabel: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    strengthBar: {
      height: 4,
      backgroundColor: theme.surface,
      borderRadius: 2,
      marginBottom: 4,
    },
    strengthIndicator: {
      height: '100%',
      borderRadius: 2,
    },
    strengthText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      textAlign: 'right',
    },
    completeContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    successIcon: {
      marginBottom: 24,
    },
    completeTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      marginBottom: 12,
    },
    completeSubtitle: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    buttonContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 12,
    },
    backButtonStyle: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextButton: {
      flex: 2,
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completeButton: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={styles.header}>
        {currentStepIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Account Recovery</Text>
      </View>

      {/* Progress Indicator */}
      {currentStep !== 'complete' && renderStepIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Buttons */}
      {currentStep !== 'complete' && (
        <View style={styles.buttonContainer}>
          {currentStepIndex > 0 && (
            <TouchableOpacity style={styles.backButtonStyle} onPress={handleBack}>
              <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={[styles.buttonText, { color: getContrastTextColor(theme.primary) }]}>
              {currentStep === 'reset' ? 'Reset Password' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
