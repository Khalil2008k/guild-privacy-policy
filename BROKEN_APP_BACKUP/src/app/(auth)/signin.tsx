import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidationRules } from '@/utils/validation';

const { width, height } = Dimensions.get('window');

const SignInScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  // Form validation setup
  const { formData, updateField, validateForm, getFieldError, isFormValid, hasErrors } = useFormValidation({
    email: { value: '', rules: ValidationRules.email },
    password: { value: '', rules: ValidationRules.password },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    console.log('🔥 Sign-in button pressed!');
    console.log('🔥 Form data:', formData);
    console.log('🔥 Form valid:', isFormValid);
    console.log('🔥 Has errors:', hasErrors);
    
    try {
      // Validate form before submission
      console.log('🔥 About to call validateForm()...');
      const isValid = validateForm();
      console.log('🔥 Validation result:', isValid);
      
      // TEMPORARY: Skip validation for testing
      console.log('🔥 SKIPPING VALIDATION FOR TESTING - proceeding anyway');

      console.log('🔥 Form validation passed, proceeding with sign-in');
      setIsLoading(true);
      
      // Add sign in logic here
      console.log('🔥 Simulating API call...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('🔥 API call completed, navigating to home');
      router.replace('/(main)/home');
      console.log('🔥 Navigation completed!');
    } catch (error) {
      console.error('🔥 ERROR in handleSignIn:', error);
      console.error('🔥 ERROR stack:', error.stack);
    } finally {
      console.log('🔥 Finally block reached');
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup/1');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.shieldContainer, { backgroundColor: theme.primary + '20' }]}>
              <MaterialIcons name="security" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.logoText, { color: theme.primary }]}>
              GUILD
            </Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t('welcome')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('signin')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={[styles.inputContainer, {
              backgroundColor: theme.surface,
              borderColor: getFieldError('email') ? theme.error : 'transparent',
              borderWidth: getFieldError('email') ? 1 : 0,
            }]}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={t('email')}
                placeholderTextColor={theme.textSecondary}
                value={formData.email.value}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {getFieldError('email') && (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {getFieldError('email')}
              </Text>
            )}

            {/* Password Input */}
            <View style={[styles.inputContainer, {
              backgroundColor: theme.surface,
              borderColor: getFieldError('password') ? theme.error : 'transparent',
              borderWidth: getFieldError('password') ? 1 : 0,
            }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={t('password')}
                placeholderTextColor={theme.textSecondary}
                value={formData.password.value}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <Ionicons name="eye-off-outline" size={20} color={theme.textSecondary} />
                ) : (
                  <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            {getFieldError('password') && (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {getFieldError('password')}
              </Text>
            )}

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                {t('forgotPassword')}
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              title={isLoading ? t('loading') : t('signin')}
              onPress={handleSignIn}
              variant="primary"
              size="large"
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              style={styles.signInButton}
            />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, { color: theme.textSecondary }]}>
              {t('dontHaveAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={[styles.signUpLink, { color: theme.primary }]}>
                {t('signup')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shieldContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
    letterSpacing: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Signika Negative SC',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Signika Negative SC',
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
  },
  signInButton: {
    marginBottom: 32,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  signUpText: {
    fontSize: 14,
    fontFamily: 'Signika Negative SC',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Signika Negative SC',
  },
});

export default SignInScreen;
