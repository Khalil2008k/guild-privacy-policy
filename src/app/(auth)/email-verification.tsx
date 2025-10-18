import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Check, RefreshCw, Edit, Info, MailCheck } from 'lucide-react-native';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

export default function EmailVerificationScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Advanced Light Mode Colors
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000', // Black text on theme color buttons
  };

  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation for email icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      CustomAlertService.showError(t('error'), t('emailVerification.invalidCode'));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      CustomAlertService.showError(
        t('success'),
        t('emailVerification.verificationSuccess'),
        [
          {
            text: t('continue'),
            onPress: () => router.replace('/(main)/home')
          }
        ]
      );
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('emailVerification.verificationError'));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isResendDisabled) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCountdown(60);
      setIsResendDisabled(true);
      setVerificationCode('');
      
      CustomAlertService.showSuccess(t('success'), t('emailVerification.codeResent'));
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('emailVerification.resendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    CustomAlertService.showConfirmation(
      t('emailVerification.changeEmail'),
      t('emailVerification.changeEmailConfirm'),
      () => router.back(),
      undefined,
      isRTL
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            disabled={isLoading}
          >
            <ArrowLeft 
              size={24} 
              color={theme.primary}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MailCheck size={24} color={theme.primary} style={{ marginEnd: isRTL ? 0 : 8, marginStart: isRTL ? 8 : 0 }} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {t('emailVerification.title')}
            </Text>
          </View>
          
          <View style={styles.headerActionButton} />
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Email Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={[styles.emailIcon, { backgroundColor: theme.primary + '20' }]}>
            <Mail size={48} color={theme.primary} />
          </View>
        </Animated.View>

        {/* Main Content */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {t('emailVerification.checkEmail')}
          </Text>
          
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {t('emailVerification.description', { email: user?.email || 'your email' })}
          </Text>

          {/* Verification Code Input */}
          <View style={styles.codeInputContainer}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              {t('emailVerification.enterCode')}
            </Text>
            
            <TextInput
              style={[
                styles.codeInput,
                { 
                  backgroundColor: theme.background, 
                  borderColor: theme.border, 
                  color: theme.textPrimary,
                  textAlign: 'center'
                }
              ]}
              placeholder="000000"
              placeholderTextColor={theme.textSecondary}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              editable={!isLoading}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              { 
                backgroundColor: theme.primary,
                opacity: (isLoading || verificationCode.length !== 6) ? 0.7 : 1
              }
            ]}
            onPress={handleVerifyCode}
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color={adaptiveColors.buttonText} />
            ) : (
              <>
                <Text style={[styles.verifyButtonText, { color: adaptiveColors.buttonText }]}>
                  {t('emailVerification.verify')}
                </Text>
                <Check size={20} color={adaptiveColors.buttonText} style={{ marginEnd: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Resend Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.resendTitle, { color: theme.textPrimary }]}>
            {t('emailVerification.didntReceive')}
          </Text>
          
          <View style={styles.resendActions}>
            <TouchableOpacity
              style={[
                styles.resendButton,
                { 
                  backgroundColor: isResendDisabled ? theme.textSecondary + '20' : theme.info + '20',
                  borderColor: isResendDisabled ? theme.textSecondary : theme.info
                }
              ]}
              onPress={handleResendCode}
              disabled={isResendDisabled || isLoading}
            >
              <RefreshCw 
                size={16} 
                color={isResendDisabled ? theme.textSecondary : theme.info}
                style={{ marginEnd: 8 }}
              />
              <Text style={[
                styles.resendButtonText,
                { color: isResendDisabled ? theme.textSecondary : theme.info }
              ]}>
                {isResendDisabled 
                  ? t('emailVerification.resendIn', { seconds: countdown })
                  : t('emailVerification.resend')
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.changeEmailButton,
                { 
                  backgroundColor: theme.warning + '20',
                  borderColor: theme.warning
                }
              ]}
              onPress={handleChangeEmail}
              disabled={isLoading}
            >
              <Edit size={16} color={theme.warning} style={{ marginEnd: 8 }} />
              <Text style={[styles.changeEmailButtonText, { color: theme.warning }]}>
                {t('emailVerification.changeEmail')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Section */}
        <View style={[styles.helpSection, { backgroundColor: theme.info + '10', borderColor: theme.info + '30' }]}>
          <Info size={20} color={theme.info} style={{ marginEnd: 8 }} />
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            {t('emailVerification.helpText')}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emailIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
    textAlign: 'center',
  },
  codeInput: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    letterSpacing: 8,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  resendTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 16,
  },
  resendActions: {
    gap: 12,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  changeEmailButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
});



