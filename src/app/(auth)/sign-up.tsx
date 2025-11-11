import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Text,
  ActivityIndicator,
  Linking
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  CheckCircle,
  ExternalLink
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import RTLText from '../components/primitives/RTLText';
import RTLInput from '../components/primitives/RTLInput';

const FONT_FAMILY = 'SignikaNegative_400Regular';

export default function SignUpScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { signUpWithEmail } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { displayName, email, password, confirmPassword } = formData;

    if (!displayName.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الاسم' : 'Please enter your name'
      );
      return false;
    }

    if (!email.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email'
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'البريد الإلكتروني غير صالح' : 'Invalid email address'
      );
      return false;
    }

    if (password.length < 8) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters'
      );
      return false;
    }

    if (password !== confirmPassword) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'
      );
      return false;
    }

    if (!agreedToPrivacy) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى الموافقة على سياسة الخصوصية' : 'Please agree to the Privacy Policy'
      );
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUpWithEmail(
        formData.email.trim(),
        formData.password,
        formData.displayName.trim()
      );
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح!' : 'Success!',
        isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(main)/home')
          }
        ]
      );
    } catch (error: any) {
      let errorMessage = isRTL ? 'فشل إنشاء الحساب' : 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = isRTL ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = isRTL ? 'البريد الإلكتروني غير صالح' : 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = isRTL ? 'كلمة المرور ضعيفة' : 'Password is too weak';
      }
      
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return null;
    if (password.length < 6) return { color: theme.error, text: isRTL ? 'ضعيف' : 'Weak' };
    if (password.length < 8) return { color: theme.warning, text: isRTL ? 'متوسط' : 'Medium' };
    return { color: theme.success, text: isRTL ? 'قوي' : 'Strong' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          {isRTL ? 'إنشاء حساب' : 'Sign Up'}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { 
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }]}>
            <Shield size={48} color="#000000" fill="#000000" fillOpacity={0.1} />
          </View>
          <Text style={[styles.logoText, { color: theme.textPrimary }]}>
            GUILD
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isRTL ? 'انضم إلى المجتمع' : 'Join the community'}
          </Text>
        </View>

        {/* Name Input */}
        <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.inputIconContainer, { backgroundColor: theme.primary + '15' }]}>
            <User size={20} color={theme.primary} />
          </View>
          <View style={styles.inputContainer}>
            <RTLInput
              placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'}
              value={formData.displayName}
              onChangeText={(value) => updateFormData('displayName', value)}
              autoCapitalize="words"
              autoComplete="name"
              style={[styles.textInput, { 
                backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, 
                borderColor: isDarkMode ? '#262626' : theme.border, 
                color: theme.textPrimary 
              }]}
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.inputIconContainer, { backgroundColor: theme.primary + '15' }]}>
            <Mail size={20} color={theme.primary} />
          </View>
          <View style={styles.inputContainer}>
            <RTLInput
              placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={[styles.textInput, { 
                backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, 
                borderColor: isDarkMode ? '#262626' : theme.border, 
                color: theme.textPrimary 
              }]}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.inputIconContainer, { backgroundColor: theme.primary + '15' }]}>
            <Lock size={20} color={theme.primary} />
          </View>
          <View style={styles.inputContainer}>
            <RTLInput
              placeholder={isRTL ? 'كلمة المرور' : 'Password'}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              style={[styles.textInput, { 
                backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, 
                borderColor: isDarkMode ? '#262626' : theme.border, 
                color: theme.textPrimary 
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
        </View>

        {/* Password Strength Indicator */}
        {passwordStrength && (
          <View style={[styles.strengthContainer, { 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            backgroundColor: passwordStrength.color + '20',
            borderColor: passwordStrength.color,
          }]}>
            <CheckCircle size={16} color={passwordStrength.color} />
            <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
              {isRTL ? 'قوة كلمة المرور: ' : 'Password strength: '}{passwordStrength.text}
            </Text>
          </View>
        )}

        {/* Confirm Password Input */}
        <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.inputIconContainer, { backgroundColor: theme.primary + '15' }]}>
            <Lock size={20} color={theme.primary} />
          </View>
          <View style={styles.inputContainer}>
            <RTLInput
              placeholder={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              style={[styles.textInput, { 
                backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, 
                borderColor: isDarkMode ? '#262626' : theme.border, 
                color: theme.textPrimary 
              }]}
            />
            <TouchableOpacity
              style={[styles.eyeButton, { right: isRTL ? undefined : 12, left: isRTL ? 12 : undefined }]}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              activeOpacity={0.7}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={theme.textSecondary} />
              ) : (
                <Eye size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements Card */}
        <View style={[styles.requirementsCard, { 
          backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
          borderColor: isDarkMode ? '#262626' : theme.border,
        }]}>
          <Text style={[styles.requirementsTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'متطلبات كلمة المرور:' : 'Password requirements:'}
          </Text>
          <View style={styles.requirementsList}>
            <View style={[styles.requirementItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.requirementDot, { backgroundColor: formData.password.length >= 8 ? theme.success : theme.textSecondary }]} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                {isRTL ? '8 أحرف على الأقل' : 'At least 8 characters'}
              </Text>
            </View>
            <View style={[styles.requirementItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.requirementDot, { backgroundColor: formData.password === formData.confirmPassword && formData.password.length > 0 ? theme.success : theme.textSecondary }]} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                {isRTL ? 'يجب أن تتطابق كلمات المرور' : 'Passwords must match'}
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Policy Consent */}
        <TouchableOpacity
          style={[styles.privacyContainer, { 
            flexDirection: isRTL ? 'row-reverse' : 'row',
            backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
            borderColor: agreedToPrivacy ? theme.primary : (isDarkMode ? '#262626' : theme.border),
          }]}
          onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, { 
            borderColor: agreedToPrivacy ? theme.primary : theme.textSecondary,
            backgroundColor: agreedToPrivacy ? theme.primary : 'transparent',
          }]}>
            {agreedToPrivacy && <CheckCircle size={16} color="#000000" />}
          </View>
          <View style={styles.privacyTextContainer}>
            <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
              {isRTL ? 'أوافق على ' : 'I agree to the '}
              <Text 
                style={[styles.privacyLink, { color: theme.primary }]}
                onPress={(e) => {
                  e.stopPropagation();
                  Linking.openURL('https://khalil2008k.github.io/guild-privacy-policy/');
                }}
              >
                {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Text>
              {isRTL ? '' : ' and understand that GUILD collects basic personal information (name, phone, email) for account creation and authentication only.'}
              {isRTL ? ' وأفهم أن GUILD يجمع معلومات شخصية أساسية (الاسم، الهاتف، البريد الإلكتروني) لإنشاء الحساب والمصادقة فقط.' : ''}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signUpButton, { 
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Shield size={20} color="#000000" />
              <Text style={styles.buttonText}>
                {isRTL ? 'إنشاء حساب' : 'Sign Up'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={[styles.signInContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.signInText, { color: theme.textSecondary }]}>
            {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
            <Text style={[styles.signInLink, { color: theme.primary }]}>
              {isRTL ? ' تسجيل الدخول' : ' Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
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
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontFamily: FONT_FAMILY,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '400',
  },
  inputWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIconContainer: {
    width: 48,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  eyeButton: {
    position: 'absolute',
    top: 18,
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    marginLeft: 60, // Align with input (icon width + gap)
  },
  strengthText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  requirementsCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    marginLeft: 60, // Align with input
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  requirementText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  privacyLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
  },
  signInLink: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
});
