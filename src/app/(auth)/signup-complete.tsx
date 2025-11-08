import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidationRules } from '../../utils/validation';
import { getContrastTextColor } from '../../utils/colorUtils';
import { CustomAlertService } from '../../services/CustomAlertService';

const FONT_FAMILY = 'Signika Negative SC';
const { width, height } = Dimensions.get('window');

type SignupStep = 'personal' | 'account' | 'verification' | 'skills' | 'complete';

interface Skill {
  id: string;
  name: string;
  category: string;
  selected: boolean;
}

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe'
];

const COUNTRY_CODES = [
  { country: 'Qatar', code: '+974', flag: '🇶🇦' },
  { country: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { country: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { country: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { country: 'Bahrain', code: '+973', flag: '🇧🇭' },
  { country: 'Oman', code: '+968', flag: '🇴🇲' },
  { country: 'United States', code: '+1', flag: '🇺🇸' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { country: 'Germany', code: '+49', flag: '🇩🇪' },
  { country: 'France', code: '+33', flag: '🇫🇷' },
  { country: 'Italy', code: '+39', flag: '🇮🇹' },
  { country: 'Spain', code: '+34', flag: '🇪🇸' },
  { country: 'Canada', code: '+1', flag: '🇨🇦' },
  { country: 'Australia', code: '+61', flag: '🇦🇺' },
  { country: 'India', code: '+91', flag: '🇮🇳' },
  { country: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { country: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { country: 'Egypt', code: '+20', flag: '🇪🇬' },
  { country: 'Jordan', code: '+962', flag: '🇯🇴' },
  { country: 'Lebanon', code: '+961', flag: '🇱🇧' },
  { country: 'Turkey', code: '+90', flag: '🇹🇷' },
  { country: 'Iran', code: '+98', flag: '🇮🇷' },
  { country: 'Iraq', code: '+964', flag: '🇮🇶' },
  { country: 'Syria', code: '+963', flag: '🇸🇾' },
  { country: 'Morocco', code: '+212', flag: '🇲🇦' },
  { country: 'Tunisia', code: '+216', flag: '🇹🇳' },
  { country: 'Algeria', code: '+213', flag: '🇩🇿' },
  { country: 'Libya', code: '+218', flag: '🇱🇾' },
  { country: 'Sudan', code: '+249', flag: '🇸🇩' },
  { country: 'Somalia', code: '+252', flag: '🇸🇴' },
  { country: 'Ethiopia', code: '+251', flag: '🇪🇹' },
  { country: 'Kenya', code: '+254', flag: '🇰🇪' },
  { country: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { country: 'South Africa', code: '+27', flag: '🇿🇦' },
  { country: 'China', code: '+86', flag: '🇨🇳' },
  { country: 'Japan', code: '+81', flag: '🇯🇵' },
  { country: 'South Korea', code: '+82', flag: '🇰🇷' },
  { country: 'Philippines', code: '+63', flag: '🇵🇭' },
  { country: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { country: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { country: 'Thailand', code: '+66', flag: '🇹🇭' },
  { country: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬' },
  { country: 'Russia', code: '+7', flag: '🇷🇺' },
  { country: 'Brazil', code: '+55', flag: '🇧🇷' },
  { country: 'Argentina', code: '+54', flag: '🇦🇷' },
  { country: 'Mexico', code: '+52', flag: '🇲🇽' },
  { country: 'Chile', code: '+56', flag: '🇨🇱' },
  { country: 'Colombia', code: '+57', flag: '🇨🇴' },
  { country: 'Peru', code: '+51', flag: '🇵🇪' },
  { country: 'Venezuela', code: '+58', flag: '🇻🇪' },
].sort((a, b) => a.country.localeCompare(b.country));

// Helper function to calculate age
const getAge = (birthDate: Date): number => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
};

export default function CompleteSignupScreen() {
  const { top } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { profile, updateProfile } = useUserProfile();
  const { sendPhoneVerification, verifyPhoneCode, signUpWithEmail, user } = useAuth();

  // Step management
  const [currentStep, setCurrentStep] = useState<SignupStep>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [stepProgress] = useState(new Animated.Value(0));

  // Personal Info (Step 1)
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Professional date picker - no custom state needed
  
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState('');

  // Account Info (Step 2)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+974'); // Default to Qatar
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phone Verification
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationId, setVerificationId] = useState('');

  // User ID Generation
  const [generatedUserId, setGeneratedUserId] = useState('');

  // Verification (Step 3)
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [idFrontImage, setIdFrontImage] = useState<string | null>(null);
  const [idBackImage, setIdBackImage] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');


  // Skills (Step 5)
  const [availableSkills] = useState<Skill[]>([
    { id: '1', name: 'React Native', category: 'Mobile Development', selected: false },
    { id: '2', name: 'JavaScript', category: 'Programming', selected: false },
    { id: '3', name: 'TypeScript', category: 'Programming', selected: false },
    { id: '4', name: 'Node.js', category: 'Backend', selected: false },
    { id: '5', name: 'UI/UX Design', category: 'Design', selected: false },
    { id: '6', name: 'Graphic Design', category: 'Design', selected: false },
    { id: '7', name: 'Digital Marketing', category: 'Marketing', selected: false },
    { id: '8', name: 'Content Writing', category: 'Content', selected: false },
    { id: '9', name: 'Project Management', category: 'Management', selected: false },
    { id: '10', name: 'Data Analysis', category: 'Analytics', selected: false },
  ]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customSkills, setCustomSkills] = useState<string[]>([]);

  // Form validation
  const { formData, updateField, validateForm, getFieldError, isFormValid } = useFormValidation({
    email: { value: email, rules: ValidationRules.email },
    password: { value: password, rules: ValidationRules.password },
    phone: { value: phone, rules: ValidationRules.phone },
  });

  useEffect(() => {
    updateField('email', email);
    updateField('password', password);
    updateField('phone', phone);
  }, [email, password, phone]);

  const steps: SignupStep[] = ['personal', 'account', 'verification', 'skills', 'complete'];
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

  // Close dropdown when step changes
  useEffect(() => {
    setShowNationalityDropdown(false);
    setNationalitySearch('');
  }, [currentStep]);

  // Professional date picker handles everything internally

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep === 'personal') {
      // 🍎 Apple Guideline 5.1.1(v): Data Minimization - Nationality is optional
      if (!fullName || !dateOfBirth || !gender) {
        CustomAlertService.showInfo(
          'Missing Information',
          'Please fill in all required personal information fields.'
        );
        return;
      }
      
      // Validate full name has at least 3 names
      const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length < 3) {
        CustomAlertService.showInfo(
          'Invalid Name',
          'Please enter your full name (at least 3 names: First Middle Last).'
        );
        return;
      }
      setCurrentStep('account');
    } else if (currentStep === 'account') {
      if (!email || !phone || !password || !confirmPassword) {
        CustomAlertService.showInfo(
          'Missing Information',
          'Please fill in all account information fields.'
        );
        return;
      }
      if (password !== confirmPassword) {
        CustomAlertService.showError(
          'Password Mismatch',
          'Passwords do not match. Please check and try again.'
        );
        return;
      }
      if (!isFormValid) {
        CustomAlertService.showInfo(
          'Validation Error',
          'Please fix the validation errors before continuing.'
        );
        return;
      }
      
      // Show phone verification popup
      if (!isPhoneVerified) {
        handleSendSMS();
        return;
      }
      
      setCurrentStep('verification');
    } else if (currentStep === 'verification') {
      if (!profileImage || !idFrontImage || !idBackImage) {
        CustomAlertService.showInfo(
          'Documents Required',
          'Please upload all required documents to continue.'
        );
        return;
      }
      setCurrentStep('skills');
    } else if (currentStep === 'skills') {
      if (selectedSkills.length === 0 && customSkills.length === 0) {
        CustomAlertService.showInfo(
          'Skills Required',
          'Please select or add at least one skill to showcase your expertise.'
        );
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

  const handleImagePicker = async (type: 'profile' | 'idFront' | 'idBack') => {
    // Profile photos must be taken with camera for face recognition
    if (type === 'profile') {
      CustomAlertService.showConfirmation(
        'Profile Photo Required',
        'Please take a photo with your camera. Make sure your face is clearly visible for verification.',
        () => handleCamera(type),
        () => {}
      );
      return;
    }

    // For ID documents, allow gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (type === 'idFront') setIdFrontImage(imageUri);
      else if (type === 'idBack') setIdBackImage(imageUri);
    }
  };

  const handleCamera = async (type: 'profile' | 'idFront' | 'idBack') => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (type === 'profile') setProfileImage(imageUri);
      else if (type === 'idFront') setIdFrontImage(imageUri);
      else if (type === 'idBack') setIdBackImage(imageUri);
    }
  };


  const handleSendSMS = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Validate phone number first
      if (!phone || phone.trim().length < 7) {
        throw new Error('Please enter a valid phone number (at least 7 digits)');
      }
      
      // Format phone number with selected country code
      const cleanedPhone = phone.replace(/[^\d]/g, '').replace(/^0+/, ''); // Remove non-digits and leading zeros
      const formattedPhone = `${countryCode}${cleanedPhone}`;
      
      console.log('📱 Debug info:');
      console.log('  - Country code:', countryCode);
      console.log('  - Original phone:', phone);
      console.log('  - Cleaned phone:', cleanedPhone);
      console.log('  - Final formatted:', formattedPhone);
      
      // Send verification SMS using Firebase
      const verificationIdResult = await sendPhoneVerification(formattedPhone);
      setVerificationId(verificationIdResult);
      setResendTimer(60);
      
      // Check if this is simulation mode
      const isSimulation = verificationIdResult.startsWith('rn_verification_');
      const isBackendVerification = verificationIdResult.startsWith('backend_verification_');
      
      if (isSimulation) {
        CustomAlertService.showInfo(
        'SMS Sent',
          '📱 DEMO MODE: No real SMS sent. For testing, enter any 6-digit code (e.g., 123456).'
        );
      } else {
        CustomAlertService.showSuccess(
          'SMS Sent',
          `Verification code sent to ${phone}. Please check your messages.`
        );
      }
      // Show verification modal
            setTimeout(() => {
              setShowPhoneVerification(true);
            }, 300);
    } catch (error: any) {
      console.error('SMS sending error:', error);
      
      let errorMessage = 'Failed to send SMS. Please check your phone number and try again.';
      
      if (error.message) {
        if (error.message.includes('reCAPTCHA')) {
          errorMessage = 'reCAPTCHA verification failed. Please try again.';
        } else if (error.message.includes('invalid-phone-number')) {
          errorMessage = 'Invalid phone number format. Please check your number.';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many SMS requests. Please wait before trying again.';
        } else if (error.message.includes('quota-exceeded')) {
          errorMessage = 'SMS quota exceeded. Please try again later.';
        }
      }
      
      CustomAlertService.showError(
        'SMS Error',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneVerificationCode || phoneVerificationCode.length !== 6) {
      CustomAlertService.showInfo(
        'Invalid Code',
        'Please enter the complete 6-digit verification code.'
      );
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Verify phone code using Firebase
      await verifyPhoneCode(verificationId, phoneVerificationCode);
      
      setIsPhoneVerified(true);
      setShowPhoneVerification(false);
      setCurrentStep('verification');
      CustomAlertService.showSuccess(
        'Phone Verified',
        'Your phone number has been verified successfully!'
      );
    } catch (error) {
      console.error('Phone verification error:', error);
      CustomAlertService.showError(
        'Verification Failed',
        'Invalid verification code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    const skill = availableSkills.find(s => s.id === skillId);
    if (!skill) return;

    if (selectedSkills.find(s => s.id === skillId)) {
      setSelectedSkills(prev => prev.filter(s => s.id !== skillId));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addCustomSkill = () => {
    if (!customSkill.trim()) return;
    
    const trimmedSkill = customSkill.trim();
    if (customSkills.includes(trimmedSkill)) {
      CustomAlertService.showInfo(
        'Duplicate Skill',
        'This skill has already been added to your list.'
      );
      return;
    }
    
    setCustomSkills(prev => [...prev, trimmedSkill]);
    setCustomSkill('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeCustomSkill = (skillToRemove: string) => {
    setCustomSkills(prev => prev.filter(skill => skill !== skillToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const generateUserId = () => {
    // Generate a unique User ID: GLD + 8 digits
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `GLD${timestamp}${random}`;
  };

  const handleCompleteSignup = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('🔥 COMPLETE SIGNUP: Starting complete signup process');
      
      // Check if user is already authenticated
      if (user) {
        console.log('🔥 COMPLETE SIGNUP: User already authenticated, skipping Firebase creation');
        
        // Update profile context for existing user
        console.log('🔥 COMPLETE SIGNUP: Updating profile context for existing user');
        await updateProfile({
          userId: user.uid,
          fullName,
          email,
          phone,
          dateOfBirth: dateOfBirth?.toISOString(),
          gender,
          nationality,
          skills: [...selectedSkills.map(s => s.name), ...customSkills],
          profileImage,
          isVerified: true,
        });
        
        // Show success and navigate
        CustomAlertService.showSuccess(
          'Welcome back to Guild!',
          'Your profile has been updated successfully!'
        );
                console.log('🔥 SIGNUP COMPLETE: Continue button pressed');
        setTimeout(() => {
                router.replace('/(main)/home');
        }, 1500);
        return;
      }
      
      // Generate User ID for new users
      const userId = generateUserId();
      setGeneratedUserId(userId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create Firebase user account first
      console.log('🔥 COMPLETE SIGNUP: Creating Firebase user account');
      await signUpWithEmail(email, password, fullName);
      console.log('🔥 COMPLETE SIGNUP: Firebase user created successfully');
      
      // Update profile context
      console.log('🔥 COMPLETE SIGNUP: Updating profile context');
      await updateProfile({
        userId,
        fullName,
        email,
        phone,
        dateOfBirth: dateOfBirth?.toISOString(),
        gender,
        nationality,
        skills: [...selectedSkills.map(s => s.name), ...customSkills],
        profileImage,
        isVerified: true,
      });
      console.log('🔥 COMPLETE SIGNUP: Profile updated successfully');

      // Wait for auth state to propagate with better error handling
      console.log('🔥 COMPLETE SIGNUP: Waiting for auth state to update...');
      let attempts = 0;
      let authUser = user;
      
      // Check Firebase auth directly as backup
      while (!authUser && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
        
        // Check both context user and Firebase auth current user
        authUser = user || auth.currentUser;
        console.log(`🔥 COMPLETE SIGNUP: Auth check attempt ${attempts}, contextUser: ${!!user}, firebaseUser: ${!!auth.currentUser}`);
        
        if (authUser) break;
      }
      
      if (authUser) {
        console.log('🔥 COMPLETE SIGNUP: Auth state confirmed - user is authenticated', { uid: authUser.uid });
      } else {
        console.log('🔥 COMPLETE SIGNUP: ERROR - user still not authenticated after waiting');
        throw new Error('Authentication failed - please try signing up again');
      }

      // Show success with User ID and commitment notice
      CustomAlertService.showSuccess(
        'Welcome to Guild!',
        `Your account has been created successfully!\n\nYour User ID: ${userId}\n\n🔒 IMPORTANT: Your account information (email, phone number, and personal details) is now permanently registered and cannot be used to create additional accounts.\n\nPlease save this ID for future reference.`
      );
              console.log('🔥 SIGNUP COMPLETE: Get Started button pressed');
              console.log('🔥 SIGNUP COMPLETE: About to navigate to home');
      setTimeout(() => {
              router.replace('/(main)/home');
              console.log('🔥 SIGNUP COMPLETE: Navigation command sent');
      }, 2000);
    } catch (error) {
      console.error('🔥 COMPLETE SIGNUP ERROR:', error);
      console.error('🔥 ERROR DETAILS:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      let errorMessage = 'Failed to create account. Please check your connection and try again.';
      
      // Provide more specific error messages
      if (error?.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error?.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email and try again.';
      } else if (error?.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error?.message) {
        errorMessage = `Account creation failed: ${error.message}`;
      }
      
      CustomAlertService.showError(
        'Account Creation Failed',
        errorMessage
      );
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

  const renderPersonalInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Personal Information</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Tell us about yourself
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ahmed Mohammed Al-Rashid (at least 3 names)"
          placeholderTextColor={theme.textSecondary}
        />
        <Text style={[styles.helperText, { color: theme.textSecondary }]}>
          Please enter your full name (minimum 3 names)
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Date of Birth *</Text>
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color={theme.primary} />
          <Text style={[styles.dateText, { color: dateOfBirth ? theme.textPrimary : theme.textSecondary }]}>
            {dateOfBirth ? formatDate(dateOfBirth) : 'Select Date of Birth'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Gender *</Text>
        <View style={styles.genderContainer}>
          {['Male', 'Female'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.genderOption,
                { 
                  backgroundColor: gender === option ? theme.primary + '20' : theme.surface,
                  borderColor: gender === option ? theme.primary : theme.border
                }
              ]}
              onPress={() => setGender(option)}
            >
              <Text style={[
                styles.genderText,
                { color: gender === option ? theme.primary : theme.textSecondary }
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Nationality (Optional)</Text>
        <Text style={[styles.helpText, { color: theme.textSecondary, fontSize: 12, marginBottom: 8 }]}>
          🍎 You may skip this field. Providing nationality helps with Qatar ID verification.
        </Text>
        <TouchableOpacity
          style={[styles.input, styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setShowNationalityDropdown(!showNationalityDropdown)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, { color: nationality ? theme.textPrimary : theme.textSecondary }]}>
            {nationality || 'Select your nationality (optional)'}
          </Text>
          <Ionicons 
            name={showNationalityDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>
        
        <Modal
          visible={showNationalityDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowNationalityDropdown(false);
            setNationalitySearch('');
          }}
        >
          <View style={styles.countriesModalOverlay}>
            <TouchableOpacity 
              style={styles.countriesModalBackdrop}
              activeOpacity={1}
              onPress={() => {
                setShowNationalityDropdown(false);
                setNationalitySearch('');
              }}
            />
            <View style={[styles.countriesModal, { backgroundColor: theme.surface }]}>
              {/* Header */}
              <View style={[styles.countriesHeader, { borderBottomColor: theme.border, backgroundColor: theme.primary }]}>
                <Text style={[styles.countriesTitle, { color: '#000000' }]}>Select Your Nationality</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowNationalityDropdown(false);
                    setNationalitySearch('');
                  }}
                  style={styles.countriesCloseButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Search */}
              <View style={[styles.countriesSearchContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
                <View style={[styles.searchInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="search" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.countriesSearchInput, { color: theme.textPrimary }]}
                    placeholder="Search countries..."
                    placeholderTextColor={theme.textSecondary}
                    value={nationalitySearch}
                    onChangeText={setNationalitySearch}
                    autoFocus={false}
                  />
                  {nationalitySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setNationalitySearch('')}>
                      <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              {/* Countries List */}
              <ScrollView 
                style={styles.countriesScrollView}
                contentContainerStyle={styles.countriesScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                bounces={true}
              >
                {COUNTRIES.filter(country => 
                  country.toLowerCase().includes(nationalitySearch.toLowerCase())
                ).map((country, index) => (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.countryItem, 
                      { 
                        borderBottomColor: theme.border,
                        backgroundColor: nationality === country ? theme.primary + '10' : 'transparent'
                      }
                    ]}
                    onPress={() => {
                      setNationality(country);
                      setShowNationalityDropdown(false);
                      setNationalitySearch('');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.countryItemContent}>
                      <Text style={[styles.countryName, { color: theme.textPrimary }]}>
                        {country}
                      </Text>
                      {nationality === country && (
                        <View style={[styles.selectedIndicator, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                
                {COUNTRIES.filter(country => 
                  country.toLowerCase().includes(nationalitySearch.toLowerCase())
                ).length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search" size={48} color={theme.textSecondary} />
                    <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
                      No countries found
                    </Text>
                    <Text style={[styles.noResultsSubtext, { color: theme.textSecondary }]}>
                      Try a different search term
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        {/* Country Code Picker Modal */}
        <Modal
          visible={showCountryPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View style={styles.countriesModalOverlay}>
            <TouchableOpacity 
              style={styles.countriesModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowCountryPicker(false)}
            />
            <View style={[styles.countriesModal, { backgroundColor: theme.surface }]}>
              {/* Header */}
              <View style={[styles.countriesHeader, { borderBottomColor: theme.border, backgroundColor: theme.primary }]}>
                <Text style={[styles.countriesTitle, { color: 'white' }]}>Select Country Code</Text>
                <TouchableOpacity
                  onPress={() => setShowCountryPicker(false)}
                  style={styles.countriesCloseButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Countries List */}
              <ScrollView 
                style={styles.countriesScrollView}
                contentContainerStyle={styles.countriesScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                bounces={true}
              >
                {COUNTRY_CODES.map((country) => (
                  <TouchableOpacity
                    key={`${country.country}-${country.code}`}
                    style={[
                      styles.countryCodeItem, 
                      { 
                        borderBottomColor: theme.border,
                        backgroundColor: countryCode === country.code ? theme.primary + '10' : 'transparent'
                      }
                    ]}
                    onPress={() => {
                      setCountryCode(country.code);
                      setShowCountryPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.countryCodeItemContent}>
                      <View style={styles.countryCodeItemLeft}>
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <View style={styles.countryCodeItemText}>
                          <Text style={[styles.countryName, { color: theme.textPrimary }]}>
                            {country.country}
                          </Text>
                          <Text style={[styles.countryCodeDisplay, { color: theme.textSecondary }]}>
                            {country.code}
                          </Text>
                        </View>
                      </View>
                      {countryCode === country.code && (
                        <View style={[styles.selectedIndicator, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );

  const renderAccountInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Account Information</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Create your login credentials
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address *</Text>
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
          placeholder="john.doe@example.com"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {getFieldError('email') && (
          <Text style={[styles.errorText, { color: theme.error }]}>{getFieldError('email')}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number *</Text>
        <Text style={[styles.helpText, { color: theme.textSecondary, fontSize: 12, marginBottom: 8 }]}>
          Required for account verification and enabling communication between clients and freelancers.
        </Text>
        <View style={styles.phoneInputContainer}>
          {/* Country Code Picker */}
          <TouchableOpacity
            style={[styles.countryCodeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowCountryPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.countryCodeText, { color: theme.textPrimary }]}>
              {COUNTRY_CODES.find(c => c.code === countryCode)?.flag || '🌍'} {countryCode}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          
          {/* Phone Number Input */}
          <TextInput
            style={[
              styles.phoneInput,
              { 
                backgroundColor: theme.surface, 
                color: theme.textPrimary, 
                borderColor: getFieldError('phone') ? theme.error : theme.border 
              }
            ]}
            value={phone}
            onChangeText={setPhone}
            placeholder="1234 5678"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
        </View>
        {getFieldError('phone') && (
          <Text style={[styles.errorText, { color: theme.error }]}>{getFieldError('phone')}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.passwordInput,
              { 
                backgroundColor: theme.surface, 
                color: theme.textPrimary, 
                borderColor: getFieldError('password') ? theme.error : theme.border 
              }
            ]}
            value={password}
            onChangeText={setPassword}
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
        {getFieldError('password') && (
          <Text style={[styles.errorText, { color: theme.error }]}>{getFieldError('password')}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.passwordInput,
              { 
                backgroundColor: theme.surface, 
                color: theme.textPrimary, 
                borderColor: password !== confirmPassword && confirmPassword ? theme.error : theme.border 
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
        {password !== confirmPassword && confirmPassword && (
          <Text style={[styles.errorText, { color: theme.error }]}>Passwords do not match</Text>
        )}
      </View>
    </View>
  );

  const renderVerification = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Identity Verification</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Upload your documents for verification
      </Text>

      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Profile Photo *</Text>
        <Text style={[styles.photoRequirement, { color: theme.textSecondary }]}>
          Take a clear photo of your face for verification
        </Text>
        <TouchableOpacity
          style={[styles.photoContainer, { borderColor: theme.border }]}
          onPress={() => handleCamera('profile')}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={40} color={theme.textSecondary} />
              <Text style={[styles.photoText, { color: theme.textSecondary }]}>Take Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ID Documents */}
      <View style={styles.idSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Qatar ID</Text>
        
        <View style={styles.idContainer}>
          <View style={styles.idItem}>
            <Text style={[styles.idLabel, { color: theme.textSecondary }]}>Front Side</Text>
            <TouchableOpacity
              style={[styles.idImageContainer, { borderColor: theme.border }]}
              onPress={() => handleCamera('idFront')}
            >
              {idFrontImage ? (
                <Image source={{ uri: idFrontImage }} style={styles.idImage} />
              ) : (
                <View style={styles.idPlaceholder}>
                  <Ionicons name="card" size={30} color={theme.textSecondary} />
                  <Text style={[styles.idText, { color: theme.textSecondary }]}>Front</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.idItem}>
            <Text style={[styles.idLabel, { color: theme.textSecondary }]}>Back Side</Text>
            <TouchableOpacity
              style={[styles.idImageContainer, { borderColor: theme.border }]}
              onPress={() => handleCamera('idBack')}
            >
              {idBackImage ? (
                <Image source={{ uri: idBackImage }} style={styles.idImage} />
              ) : (
                <View style={styles.idPlaceholder}>
                  <Ionicons name="card" size={30} color={theme.textSecondary} />
                  <Text style={[styles.idText, { color: theme.textSecondary }]}>Back</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );


  const renderSkills = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Skills & Expertise</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Select skills or add your own ({selectedSkills.length + customSkills.length} total)
      </Text>

      {/* Predefined Skills */}
      <Text style={[styles.skillSectionTitle, { color: theme.textPrimary }]}>Popular Skills</Text>
      <View style={styles.skillsGrid}>
        {availableSkills.map((skill) => {
          const isSelected = selectedSkills.find(s => s.id === skill.id);
          return (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.skillChip,
                {
                  backgroundColor: isSelected ? theme.primary + '20' : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                }
              ]}
              onPress={() => toggleSkill(skill.id)}
            >
              <Text style={[
                styles.skillText,
                { color: isSelected ? theme.primary : theme.textSecondary }
              ]}>
                {skill.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Skills Input */}
      <Text style={[styles.skillSectionTitle, { color: theme.textPrimary, marginTop: 24 }]}>
        Add Your Own Skills
      </Text>
      <View style={styles.customSkillContainer}>
        <TextInput
          style={[styles.customSkillInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
          value={customSkill}
          onChangeText={setCustomSkill}
          placeholder="Type a skill and press Add"
          placeholderTextColor={theme.textSecondary}
          onSubmitEditing={addCustomSkill}
        />
        <TouchableOpacity
          style={[styles.addSkillButton, { backgroundColor: theme.primary }]}
          onPress={addCustomSkill}
          disabled={!customSkill.trim()}
        >
          <Text style={[styles.addSkillButtonText, { color: getContrastTextColor(theme.primary) }]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Skills Display */}
      {customSkills.length > 0 && (
        <>
          <Text style={[styles.skillSectionTitle, { color: theme.textPrimary, marginTop: 16 }]}>
            Your Skills
          </Text>
          <View style={styles.skillsGrid}>
            {customSkills.map((skill, index) => (
              <View
                key={`custom-${index}`}
                style={[
                  styles.skillChip,
                  styles.customSkillChip,
                  {
                    backgroundColor: theme.success + '20',
                    borderColor: theme.success,
                  }
                ]}
              >
                <Text style={[styles.skillText, { color: theme.success }]}>
                  {skill}
                </Text>
                <TouchableOpacity
                  style={styles.removeSkillButton}
                  onPress={() => removeCustomSkill(skill)}
                >
                  <Ionicons name="close" size={16} color={theme.success} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color={theme.success} />
      </View>
      <Text style={[styles.completeTitle, { color: theme.textPrimary }]}>
        Ready to Join Guild!
      </Text>
      <Text style={[styles.completeSubtitle, { color: theme.textSecondary }]}>
        Your profile is complete. Click below to create your account and start your journey.
      </Text>

      <View style={styles.summaryContainer}>
        {generatedUserId && (
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>User ID:</Text>
            <Text style={[styles.summaryValue, styles.userIdText, { color: theme.primary }]}>
              {generatedUserId}
            </Text>
          </View>
        )}
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Name:</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {fullName}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Email:</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{email}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Skills:</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {[...selectedSkills.map(s => s.name), ...customSkills].join(', ')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'personal': return renderPersonalInfo();
      case 'account': return renderAccountInfo();
      case 'verification': return renderVerification();
      case 'skills': return renderSkills();
      case 'complete': return renderComplete();
      default: return renderPersonalInfo();
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
    row: {
      flexDirection: 'row',
    },
    inputContainer: {
      marginBottom: 20,
      position: 'relative',
    },
    label: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
      fontWeight: '500',
    },
    helperText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      marginTop: 4,
      fontStyle: 'italic',
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
    },
    phoneInputContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    countryCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 16,
      borderWidth: 1,
      borderRadius: 12,
      gap: 8,
      minWidth: 100,
    },
    countryCodeText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      fontWeight: '500',
    },
    phoneInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
    },
    countryCodeItem: {
      borderBottomWidth: 1,
    },
    countryCodeItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    countryCodeItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    countryFlag: {
      fontSize: 24,
    },
    countryCodeItemText: {
      flex: 1,
    },
    countryCodeDisplay: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      marginTop: 2,
    },
    dropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      zIndex: 99999,
      elevation: 30,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalDropdown: {
      width: '90%',
      maxHeight: '80%',
      borderWidth: 1,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 15,
      zIndex: 9998,
    },
    // Enhanced Countries Modal Styles
    countriesModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    countriesModalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    countriesModal: {
      flex: 1,
      marginTop: 50,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      elevation: 25,
      zIndex: 10000,
    },
    countriesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    countriesTitle: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
    },
    countriesCloseButton: {
      padding: 4,
    },
    countriesSearchContainer: {
      padding: 16,
      borderBottomWidth: 1,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      gap: 12,
    },
    countriesSearchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      padding: 0,
    },
    countriesScrollView: {
      flex: 1,
    },
    countriesScrollContent: {
      paddingBottom: 20,
    },
    countryItem: {
      borderBottomWidth: 1,
    },
    countryItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    countryName: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      fontWeight: '500',
      flex: 1,
    },
    selectedIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    noResultsText: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      marginTop: 16,
      textAlign: 'center',
    },
    noResultsSubtext: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      marginTop: 8,
      textAlign: 'center',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
    },
    modalTitleContainer: {
      flex: 1,
      marginRight: 12,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '400',
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    datePickerModal: {
      width: '90%',
      maxWidth: 400,
      borderWidth: 1,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 24,
      zIndex: 9999,
      overflow: 'hidden',
    },
    datePickerContainer: {
      padding: 24,
      alignItems: 'center',
      position: 'relative',
      minHeight: 260,
      overflow: 'hidden',
    },
    pickerWrapper: {
      width: '100%',
      position: 'relative',
      height: 240,
    },
    pickerFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 60,
      zIndex: 2,
      pointerEvents: 'none',
    },
    pickerFadeTop: {
      top: 0,
      opacity: 0.9,
    },
    pickerFadeBottom: {
      bottom: 0,
      opacity: 0.9,
    },
    selectionHighlight: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: 48,
      marginTop: -24,
      borderTopWidth: 2,
      borderBottomWidth: 2,
      zIndex: 1,
      pointerEvents: 'none',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingRight: 16,
    },
    ageIndicator: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    ageText: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      letterSpacing: 0.5,
    },
    datePicker: {
      width: '100%',
      height: 240,
      zIndex: 0,
    },
    pickersRow: {
      flexDirection: 'row',
      height: 240,
      gap: 12,
      paddingHorizontal: 16,
    },
    pickerColumn: {
      flex: 1,
    },
    pickerColumnWide: {
      flex: 1.5,
    },
    pickerContent: {
      alignItems: 'center',
    },
    pickerPadding: {
      height: 96,
    },
    pickerItem: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    pickerItemText: {
      fontSize: 18,
      fontFamily: FONT_FAMILY,
      fontWeight: '400',
    },
    pickerItemTextSelected: {
      fontSize: 20,
      fontWeight: '700',
    },
    datePickerButtons: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
    },
    dateButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      borderWidth: 2,
    },
    confirmButton: {
      // backgroundColor set dynamically with shadow
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    confirmButtonText: {
      fontSize: 17,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      letterSpacing: 0.5,
    },
    dropdownScroll: {
      flex: 1,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      padding: 0,
    },
    dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    dropdownItemText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      minHeight: 100,
      textAlignVertical: 'top',
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
    genderContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    genderOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    genderText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '500',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    dateText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    photoSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      marginBottom: 16,
    },
    photoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    profilePhoto: {
      width: '100%',
      height: '100%',
    },
    photoPlaceholder: {
      alignItems: 'center',
    },
    photoText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      marginTop: 8,
    },
    idSection: {
      marginBottom: 24,
    },
    idContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    idItem: {
      flex: 1,
      alignItems: 'center',
    },
    idLabel: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    idImageContainer: {
      width: '100%',
      height: 100,
      borderRadius: 8,
      borderWidth: 2,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    idImage: {
      width: '100%',
      height: '100%',
    },
    idPlaceholder: {
      alignItems: 'center',
    },
    idText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      marginTop: 4,
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    locationText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    skillChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    skillText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '500',
    },
    skillSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
    },
    customSkillContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    customSkillInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
    },
    addSkillButton: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addSkillButtonText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    customSkillChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    removeSkillButton: {
      padding: 2,
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
    summaryContainer: {
      width: '100%',
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 32,
    },
    summaryItem: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      width: 80,
    },
    summaryValue: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      flex: 1,
      fontWeight: '500',
    },
    userIdText: {
      fontWeight: 'bold',
      fontSize: 16,
      letterSpacing: 1,
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
      backgroundColor: theme.primary,
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
    photoRequirement: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalSubtitle: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    codeInputContainer: {
      marginBottom: 24,
    },
    codeInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      letterSpacing: 4,
    },
    verifyButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    verifyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    resendContainer: {
      alignItems: 'center',
    },
    resendText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      textDecorationLine: 'underline',
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
        <Text style={styles.headerTitle}>Join Guild</Text>
      </View>

      {/* Progress Indicator */}
      {currentStep !== 'complete' && renderStepIndicator()}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep === 'complete' ? (
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: theme.primary }]}
            onPress={handleCompleteSignup}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: '#000000' }]}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {currentStepIndex > 0 && (
              <TouchableOpacity style={styles.backButtonStyle} onPress={handleBack}>
                <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={[styles.buttonText, { color: '#000000' }]}>
                {currentStep === 'skills' ? 'Review' : 'Next'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Phone Verification Modal */}
      <Modal
        visible={showPhoneVerification}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhoneVerification(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Verify Phone Number
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPhoneVerification(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              We sent a 6-digit code to {phone}
            </Text>

            <View style={styles.codeInputContainer}>
              <TextInput
                style={[styles.codeInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={phoneVerificationCode}
                onChangeText={setPhoneVerificationCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: theme.primary }]}
              onPress={handleVerifyPhone}
              disabled={isLoading || phoneVerificationCode.length !== 6}
            >
              <Text style={[styles.verifyButtonText, { color: getContrastTextColor(theme.primary) }]}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={handleSendSMS}
              disabled={resendTimer > 0 || isLoading}
            >
              <Text style={[styles.resendText, { color: resendTimer > 0 ? theme.textSecondary : theme.primary }]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date(new Date().getFullYear() - 25, 5, 15)}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              setDateOfBirth(selectedDate);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowDatePicker(false);
          }}
          themeVariant={isDarkMode ? 'dark' : 'light'}
        />
      )}
      
      {/* reCAPTCHA container for Firebase Phone Auth */}
      <View id="recaptcha-container" style={{ display: 'none' }} />
    </KeyboardAvoidingView>
  );
}