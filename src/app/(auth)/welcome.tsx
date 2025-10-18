import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, UserPlus, LogIn } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFonts, SignikaNegative_400Regular, SignikaNegative_700Bold } from '@expo-google-fonts/signika-negative';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';
const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();

  // Advanced Light Mode Colors
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    // Sign Up button: theme color background → black text
    signUpButtonText: '#000000',
    // Sign In button: gray/white background → theme color or black text
    signInButtonBg: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
    signInButtonText: isDarkMode ? '#FFFFFF' : theme.primary,
    signInButtonBorder: isDarkMode ? theme.primary : '#E5E7EB',
  };
  
  const [fontsLoaded] = useFonts({
    SignikaNegative_400Regular,
    SignikaNegative_700Bold,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
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
      ]),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/sign-in');
  };

  const handleSignUp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/signup-complete');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: adaptiveColors.background,
    },
    content: {
      flex: 1,
      paddingTop: top + 40,
      paddingBottom: bottom + 40,
      paddingHorizontal: 24,
      justifyContent: 'space-between',
    },
    logoSection: {
      alignItems: 'center',
      marginTop: height * 0.1,
    },
    logoContainer: {
      width: 220, // Increased for larger logo
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 50, // Increased proportionally
    },
    shieldIcon: {
      marginBottom: 8, // Adjusted spacing for larger icon
    },
    logoText: {
      fontSize: 42, // Increased from 32 for larger appearance
      fontWeight: '900', // Extra bold like in image
      fontFamily: fontsLoaded ? 'SignikaNegative_700Bold' : 'System', // Use font if loaded, fallback to system
      color: theme.primary, // Use theme primary color
      letterSpacing: 2, // Tighter spacing like in image
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.text,
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: 2,
    },
    subtitleText: {
      fontSize: 18,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.textSecondary,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 8,
    },
    taglineText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      color: theme.primary,
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 1,
    },
    buttonsSection: {
      marginTop: 'auto',
    },
    buttonContainer: {
      gap: 16,
      marginBottom: 32,
    },
    signUpButton: {
      backgroundColor: theme.primary,
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 12,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    signUpButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.signUpButtonText, // Black text on theme color
      letterSpacing: 1,
    },
    signInButton: {
      backgroundColor: adaptiveColors.signInButtonBg,
      borderWidth: 2,
      borderColor: adaptiveColors.signInButtonBorder,
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    signInButtonText: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.signInButtonText, // White in dark, theme color in light
      letterSpacing: 1,
    },
    footerText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      color: adaptiveColors.textSecondary,
      textAlign: 'center',
      opacity: 0.7,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      


      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideUpAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Shield 
              size={70} 
              color={theme.primary} 
              style={styles.shieldIcon}
            />
            <Text style={styles.logoText}>GUILD</Text>
          </View>

          <Text style={styles.welcomeText}>
            {isRTL ? 'مرحباً بك في جيلد' : 'Welcome to Guild'}
          </Text>
          <Text style={styles.subtitleText}>
            {isRTL ? 'انضم إلى مجتمع العمل الحر الأفضل' : 'Join the ultimate freelancing community'}
          </Text>
          <Text style={styles.taglineText}>
            {isRTL ? 'تواصل • تعاون • انجح' : 'Connect • Collaborate • Conquer'}
          </Text>
        </Animated.View>

        {/* Buttons Section */}
        <Animated.View 
          style={[
            styles.buttonsSection,
            {
              opacity: buttonFadeAnim,
              transform: [{ translateY: Animated.multiply(slideUpAnim, 0.5) }]
            }
          ]}
        >
          <View style={styles.buttonContainer}>
            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              activeOpacity={0.8}
            >
              <UserPlus 
                size={20} 
                color={getContrastTextColor(theme.primary)}
                style={{ marginEnd: 8 }}
              />
              <Text style={[styles.signUpButtonText, { color: getContrastTextColor(theme.primary) }]}>
                {isRTL ? 'إنشاء حساب' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.7}
            >
              <LogIn 
                size={20} 
                color={theme.textPrimary}
                style={{ marginEnd: 8 }}
              />
              <Text style={styles.signInButtonText}>
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            {isRTL ? 'بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية' : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
