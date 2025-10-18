import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Phone, Check, ChevronDown, Shield, ArrowRight, MessageSquare, Edit3, CheckCircle2, Smartphone, RefreshCw, Edit } from 'lucide-react-native';

const FONT_FAMILY = 'Signika Negative SC';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export default function PhoneVerificationScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Advanced Light Mode Colors
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    cardBackground: isDarkMode ? theme.card : '#F8F9FA',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    border: isDarkMode ? theme.border : '#E5E7EB',
    inputBackground: isDarkMode ? theme.card : '#FFFFFF',
    success: isDarkMode ? '#10B981' : '#059669',
    buttonText: isDarkMode ? theme.buttonText : '#000000', // Black text on theme color in light mode
  };

  const [step, setStep] = useState<'phone' | 'verify' | 'complete'>('phone');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>({ code: '+974', country: 'Qatar', flag: '🇶🇦' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Common country codes
  const countryCodes: CountryCode[] = [
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  ];

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

    // Start pulse animation for phone icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
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
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      CustomAlertService.showError(t('error'), t('phoneVerification.phoneRequired'));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (phoneNumber.length < 8) {
      CustomAlertService.showError(t('error'), t('phoneVerification.phoneInvalid'));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('verify');
      setCountdown(60);
      
      CustomAlertService.showError(
        t('success'),
        t('phoneVerification.codeSent', { phone: `${selectedCountry.code} ${phoneNumber}` })
      );
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('phoneVerification.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      CustomAlertService.showError(t('error'), t('phoneVerification.invalidCode'));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('complete');
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.replace('/(main)/home');
      }, 2000);
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('phoneVerification.verifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCountdown(60);
      setVerificationCode('');
      
      CustomAlertService.showSuccess(t('success'), t('phoneVerification.codeResent'));
      
    } catch (error) {
      CustomAlertService.showError(t('error'), t('phoneVerification.resendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on Qatar phone number pattern
    if (selectedCountry.code === '+974') {
      if (cleaned.length <= 4) return cleaned;
      if (cleaned.length <= 8) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)}`;
    }
    
    // Default formatting for other countries
    return cleaned;
  };

  const renderPhoneStep = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Phone Icon */}
      <Animated.View 
        style={[
          styles.iconContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <View style={[styles.phoneIcon, { backgroundColor: adaptiveColors.primary + '20' }]}>
          <Phone size={48} color={adaptiveColors.primary} />
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('phoneVerification.enterPhone')}
        </Text>
        
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t('phoneVerification.description')}
        </Text>

        {/* Country Code Selector */}
        <TouchableOpacity
          style={[
            styles.countrySelector,
            { 
              backgroundColor: theme.background, 
              borderColor: theme.border 
            }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCountryPicker(!showCountryPicker);
          }}
        >
          <Text style={[styles.countryFlag, { fontSize: 24 }]}>
            {selectedCountry.flag}
          </Text>
          <Text style={[styles.countryCode, { color: theme.textPrimary }]}>
            {selectedCountry.code}
          </Text>
          <Text style={[styles.countryName, { color: theme.textSecondary }]}>
            {selectedCountry.country}
          </Text>
          <ChevronDown 
            size={20} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>

        {/* Country Picker */}
        {showCountryPicker && (
          <View style={[styles.countryPicker, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ScrollView style={styles.countryList} nestedScrollEnabled>
              {countryCodes.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    { borderColor: theme.border },
                    selectedCountry.code === country.code && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={[styles.countryName, { color: theme.textPrimary }]}>
                    {country.country}
                  </Text>
                  <Text style={[styles.countryCode, { color: theme.textSecondary }]}>
                    {country.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Phone Number Input */}
        <View style={styles.phoneInputContainer}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            {t('phoneVerification.phoneNumber')}
          </Text>
          
          <View style={[styles.phoneInputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.phonePrefix, { color: theme.textSecondary }]}>
              {selectedCountry.code}
            </Text>
            <TextInput
              style={[
                styles.phoneInput,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              placeholder={selectedCountry.code === '+974' ? '1234 5678' : '123456789'}
              placeholderTextColor={theme.textSecondary}
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
              keyboardType="phone-pad"
              maxLength={selectedCountry.code === '+974' ? 9 : 15}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Send Code Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: theme.primary,
              opacity: (isLoading || !phoneNumber.trim()) ? 0.7 : 1
            }
          ]}
          onPress={handleSendCode}
          disabled={isLoading || !phoneNumber.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color={adaptiveColors.buttonText} />
          ) : (
            <>
              <Text style={[styles.sendButtonText, { color: adaptiveColors.buttonText }]}>
                {t('phoneVerification.sendCode')}
              </Text>
              <ArrowRight size={20} color={adaptiveColors.buttonText} style={{ marginStart: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
      {/* Phone Icon */}
      <View style={styles.iconContainer}>
        <View style={[styles.phoneIcon, { backgroundColor: theme.success + '20' }]}>
          <MessageSquare size={48} color={theme.success} />
        </View>
      </View>

      {/* Verification Content */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t('phoneVerification.enterCode')}
        </Text>
        
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t('phoneVerification.codeDescription', { 
            phone: `${selectedCountry.code} ${phoneNumber}` 
          })}
        </Text>

        {/* Verification Code Input */}
        <View style={styles.codeInputContainer}>
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
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <>
              <Text style={[styles.verifyButtonText, { color: theme.buttonText }]}>
                {t('phoneVerification.verify')}
              </Text>
              <Check size={20} color={theme.buttonText} style={{ marginStart: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Resend Section */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.resendTitle, { color: theme.textPrimary }]}>
          {t('phoneVerification.didntReceive')}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.resendButton,
            { 
              backgroundColor: countdown > 0 ? theme.textSecondary + '20' : theme.info + '20',
              borderColor: countdown > 0 ? theme.textSecondary : theme.info
            }
          ]}
          onPress={handleResendCode}
          disabled={countdown > 0 || isLoading}
        >
          <RefreshCw 
            size={16} 
            color={countdown > 0 ? theme.textSecondary : theme.info} 
            style={{ marginEnd: 8 }}
          />
          <Text style={[
            styles.resendButtonText,
            { color: countdown > 0 ? theme.textSecondary : theme.info }
          ]}>
            {countdown > 0 
              ? t('phoneVerification.resendIn', { seconds: countdown })
              : t('phoneVerification.resend')
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.changePhoneButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setStep('phone');
          }}
          disabled={isLoading}
        >
          <Edit size={16} color={theme.warning} style={{ marginEnd: 8 }} />
          <Text style={[styles.changePhoneButtonText, { color: theme.warning }]}>
            {t('phoneVerification.changePhone')}
          </Text>
        </TouchableOpacity>
      </View>
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
        <CheckCircle2 size={64} color={theme.success} />
      </View>
      
      <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
        {t('phoneVerification.verificationComplete')}
      </Text>
      
      <Text style={[styles.successDescription, { color: theme.textSecondary }]}>
        {t('phoneVerification.verificationCompleteDescription')}
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
            <ArrowLeft 
              size={24} 
              color={theme.primary}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Smartphone size={24} color={theme.primary} style={{ marginEnd: 8 }} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {t('phoneVerification.title')}
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
        {step === 'phone' && renderPhoneStep()}
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
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  phoneIcon: {
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
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  countryPicker: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    maxHeight: 200,
  },
  countryList: {
    maxHeight: 180,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  phoneInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  codeInputContainer: {
    marginBottom: 24,
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
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  changePhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  changePhoneButtonText: {
    fontSize: 14,
    fontWeight: '500',
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



