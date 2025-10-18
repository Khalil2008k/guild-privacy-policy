import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { ArrowLeft, Shield, Lock, Check, X, Copy, Key } from 'lucide-react-native';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface TwoFactorMethod {
  id: string;
  type: 'sms' | 'email' | 'authenticator';
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export default function TwoFactorSetupScreen() {
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
  const insets = useSafeAreaInsets();

  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email' | 'authenticator'>('sms');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [countdown, setCountdown] = useState(0);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

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
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const twoFactorMethods: TwoFactorMethod[] = [
    {
      id: 'sms',
      type: 'sms',
      title: t('twoFactor.sms.title'),
      description: t('twoFactor.sms.description'),
      icon: 'chatbubble-outline',
      enabled: !!phoneNumber
    },
    {
      id: 'email',
      type: 'email',
      title: t('twoFactor.email.title'),
      description: t('twoFactor.email.description'),
      icon: 'mail-outline',
      enabled: !!email
    },
    {
      id: 'authenticator',
      type: 'authenticator',
      title: t('twoFactor.authenticator.title'),
      description: t('twoFactor.authenticator.description'),
      icon: 'shield-checkmark-outline',
      enabled: true
    }
  ];

  const handleSendCode = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('verify');
      setCountdown(60);
      
      CustomAlertService.showSuccess(
        t('success'),
        selectedMethod === 'sms' 
          ? t('twoFactor.sms.codeSent', { phone: phoneNumber })
          : t('twoFactor.email.codeSent', { email: email })
      );
    } catch (error) {
      CustomAlertService.showError(t('error'), t('twoFactor.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      CustomAlertService.showError(t('error'), t('twoFactor.invalidCode'));
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep('complete');
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.replace('/(main)/home');
      }, 2000);
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('twoFactor.verifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCountdown(60);
    
    // Simulate resend
    CustomAlertService.showSuccess(t('success'), t('twoFactor.codeResent'));
  };

  const validateInput = () => {
    if (selectedMethod === 'sms' && !phoneNumber.trim()) {
      CustomAlertService.showError(t('error'), t('twoFactor.phoneRequired'));
      return false;
    }
    if (selectedMethod === 'email' && !email.trim()) {
      CustomAlertService.showError(t('error'), t('twoFactor.emailRequired'));
      return false;
    }
    return true;
  };

  const renderSetupStep = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Method Selection */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {t('twoFactor.chooseMethod')}
        </Text>
        
        {twoFactorMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodOption,
              { 
                backgroundColor: selectedMethod === method.type ? theme.primary + '15' : theme.background,
                borderColor: selectedMethod === method.type ? theme.primary : theme.border,
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedMethod(method.type);
            }}
            disabled={!method.enabled}
          >
            <View style={styles.methodLeft}>
              <View style={[
                styles.methodIcon,
                { backgroundColor: selectedMethod === method.type ? theme.primary + '20' : theme.textSecondary + '20' }
              ]}>
                <Ionicons 
                  name={method.icon as any} 
                  size={24} 
                  color={selectedMethod === method.type ? theme.primary : theme.textSecondary} 
                />
              </View>
              
              <View style={styles.methodContent}>
                <Text style={[
                  styles.methodTitle,
                  { color: method.enabled ? theme.textPrimary : theme.textSecondary }
                ]}>
                  {method.title}
                </Text>
                <Text style={[styles.methodDescription, { color: theme.textSecondary }]}>
                  {method.description}
                </Text>
              </View>
            </View>

            <View style={[
              styles.radioButton,
              { borderColor: selectedMethod === method.type ? theme.primary : theme.border },
              selectedMethod === method.type && { backgroundColor: theme.primary }
            ]}>
              {selectedMethod === method.type && (
                <Ionicons name="checkmark" size={16} color={theme.buttonText} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Fields */}
      {(selectedMethod === 'sms' || selectedMethod === 'email') && (
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {selectedMethod === 'sms' ? t('twoFactor.phoneNumber') : t('twoFactor.emailAddress')}
          </Text>
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.background, 
                borderColor: theme.border, 
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}
            placeholder={selectedMethod === 'sms' ? t('twoFactor.phonePlaceholder') : t('twoFactor.emailPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={selectedMethod === 'sms' ? phoneNumber : email}
            onChangeText={selectedMethod === 'sms' ? setPhoneNumber : setEmail}
            keyboardType={selectedMethod === 'sms' ? 'phone-pad' : 'email-address'}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
      )}

      {/* Authenticator Instructions */}
      {selectedMethod === 'authenticator' && (
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('twoFactor.authenticator.setup')}
          </Text>
          
          <View style={styles.instructionStep}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <Text style={[styles.stepNumberText, { color: theme.buttonText }]}>1</Text>
            </View>
            <Text style={[styles.instructionText, { color: theme.textPrimary }]}>
              {t('twoFactor.authenticator.step1')}
            </Text>
          </View>
          
          <View style={styles.instructionStep}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <Text style={[styles.stepNumberText, { color: theme.buttonText }]}>2</Text>
            </View>
            <Text style={[styles.instructionText, { color: theme.textPrimary }]}>
              {t('twoFactor.authenticator.step2')}
            </Text>
          </View>
          
          <View style={styles.instructionStep}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <Text style={[styles.stepNumberText, { color: theme.buttonText }]}>3</Text>
            </View>
            <Text style={[styles.instructionText, { color: theme.textPrimary }]}>
              {t('twoFactor.authenticator.step3')}
            </Text>
          </View>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { 
            backgroundColor: theme.primary,
            opacity: isLoading ? 0.7 : 1
          }
        ]}
        onPress={selectedMethod === 'authenticator' ? () => setStep('verify') : handleSendCode}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.buttonText} />
        ) : (
          <>
            <Text style={[styles.continueButtonText, { color: theme.buttonText }]}>
              {selectedMethod === 'authenticator' ? t('twoFactor.continue') : t('twoFactor.sendCode')}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={theme.buttonText} />
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderVerifyStep = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Verification Code Input */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {t('twoFactor.enterCode')}
        </Text>
        
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          {selectedMethod === 'sms' 
            ? t('twoFactor.sms.codeDescription', { phone: phoneNumber })
            : selectedMethod === 'email'
            ? t('twoFactor.email.codeDescription', { email: email })
            : t('twoFactor.authenticator.codeDescription')
          }
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

      {/* Resend Code */}
      {selectedMethod !== 'authenticator' && (
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.textSecondary }]}>
            {t('twoFactor.didntReceive')}
          </Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={countdown > 0}
          >
            <Text style={[
              styles.resendButton,
              { color: countdown > 0 ? theme.textSecondary : theme.primary }
            ]}>
              {countdown > 0 
                ? t('twoFactor.resendIn', { seconds: countdown })
                : t('twoFactor.resend')
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { 
            backgroundColor: theme.primary,
            opacity: (isLoading || verificationCode.length !== 6) ? 0.7 : 1
          }
        ]}
        onPress={handleVerifyCode}
        disabled={isLoading || verificationCode.length !== 6}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.buttonText} />
        ) : (
          <>
            <Text style={[styles.continueButtonText, { color: theme.buttonText }]}>
              {t('twoFactor.verify')}
            </Text>
            <Ionicons name="checkmark" size={20} color={theme.buttonText} />
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCompleteStep = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        styles.completeContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={[styles.successIcon, { backgroundColor: theme.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.success} />
      </View>
      
      <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
        {t('twoFactor.setupComplete')}
      </Text>
      
      <Text style={[styles.successDescription, { color: theme.textSecondary }]}>
        {t('twoFactor.setupCompleteDescription')}
      </Text>
    </Animated.View>
  );

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
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="security" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {t('twoFactor.title')}
            </Text>
          </View>
          
          <View style={styles.headerActionButton} />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {step === 'setup' && renderSetupStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'complete' && renderCompleteStep()}
      </ScrollView>
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
  },
  stepContainer: {
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
    marginBottom: 16,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
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
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  resendContainer: {
    alignItems: 'center',
    gap: 4,
  },
  resendText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
  },
});



