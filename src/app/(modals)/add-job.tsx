import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import { CoinWalletAPIClient } from '../../services/CoinWalletAPIClient';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import ErrorBoundary from '../../components/ErrorBoundary'; // COMMENT: PRODUCTION HARDENING - Task 4.5 - Add error boundary for add job screen
import { logger } from '../../utils/logger';
// COMMENT: PRIORITY 1 - File Modularization - Import extracted components (underscore prefix prevents Expo Router from treating as routes)
import { StepIndicator } from './_components/StepIndicator';
import { LanguageSelector } from './_components/LanguageSelector';
import { Step1BasicInfo } from './_components/Step1BasicInfo';
import { Step2BudgetTimeline } from './_components/Step2BudgetTimeline';
import { Step3LocationRequirements } from './_components/Step3LocationRequirements';
import { Step4VisibilitySummary } from './_components/Step4VisibilitySummary';
import { AddJobHeader } from './_components/AddJobHeader';
import { AddJobFooter } from './_components/AddJobFooter';
// COMMENT: PRIORITY 1 - File Modularization - Import extracted hooks (underscore prefix prevents Expo Router from treating as routes)
import { useWalletBalance } from './_hooks/useWalletBalance';
import { useLocation } from './_hooks/useLocation';
import { useJobForm } from './_hooks/useJobForm';
import { useAdminNotifications } from './_hooks/useAdminNotifications';
import { usePromotionLogic } from './_hooks/usePromotionLogic';
// COMMENT: PRIORITY 1 - File Modularization - Import constants
import { getCategories, getBudgetTypes, getExperienceLevels } from './_constants/jobFormConstants';
import { 
  X, Plus, Globe, MapPin, Clock, DollarSign, Users, Star,
  Zap, Shield, Award, Target, Briefcase, Palette, Code,
  Megaphone, PenTool, Camera, Video, Music, Headphones,
  ShoppingCart, BarChart3, Car, Home, Utensils, GraduationCap,
  Dumbbell, Heart, Baby, Dog, Hammer, Truck, BookOpen,
  Calculator, Lock, Lightbulb, Smartphone, ChevronRight,
  CheckCircle, AlertCircle, Info, Sparkles, TrendingUp,
  Navigation, Map, Crosshair, Coins, User, Trophy
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface JobFormData {
  // Basic Info
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  
  // Budget & Timeline
  budget: string;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
  duration: string;
  isUrgent: boolean;
  
  // Location
  location: string;
  locationAr: string;
  isRemote: boolean;
  showOnMap: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Advanced Options
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  skills: string[];
  requirements: string;
  requirementsAr: string;
  deliverables: string;
  deliverablesAr: string;
  
  // Visibility & Promotion
  visibility: 'public' | 'guild_only' | 'premium';
  featured: boolean;
  boost: boolean;
  
  // Language Settings
  primaryLanguage: 'en' | 'ar' | 'both';
}

export default function ModernAddJobScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // COMMENT: PRIORITY 1 - File Modularization - Use extracted hooks
  const {
    walletBalance,
    balanceLoading,
    balanceError,
    loadBalance,
    calculateWalletValue: calculateWalletValueFromHook,
  } = useWalletBalance();

  const {
    formData,
    currentStep,
    isSubmitting,
    focusedField,
    showLanguageSelector,
    handleInputChange,
    handleNextStep,
    handlePrevStep,
    setFocusedField,
    setShowLanguageSelector,
    handleSubmit: handleSubmitForm,
  } = useJobForm();

  const { notifyAdmins } = useAdminNotifications();

  const {
    calculatePromotionCost,
    calculateWalletValue: calculateWalletValueForPromotion,
    validatePromotionBalance,
    handlePromotionToggle: handlePromotionToggleFromHook,
  } = usePromotionLogic();

  // COMMENT: PRIORITY 1 - File Modularization - Wallet balance logic extracted to useWalletBalance hook
  // Old code commented out - now using extracted hook
  /*
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Load wallet balance function
  const loadBalance = async () => {
    try {
      setBalanceLoading(true);
      setBalanceError(null);
      const balance = await CoinWalletAPIClient.getBalance();
      setWalletBalance(balance);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading wallet balance:', error);
      const errorMessage = isRTL 
        ? 'فشل تحميل رصيد المحفظة'
        : 'Failed to load wallet balance';
      setBalanceError(errorMessage);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Load balance on mount
  useEffect(() => {
    loadBalance();
  }, []);
  */

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // COMMENT: PRIORITY 1 - File Modularization - Constants extracted to _constants/jobFormConstants.ts
  const categories = getCategories(isRTL);
  const experienceLevels = getExperienceLevels(isRTL, theme.primary);
  const budgetTypes = getBudgetTypes(isRTL);

  // COMMENT: PRIORITY 1 - File Modularization - handleInputChange extracted to useJobForm hook
  // Old function commented out - now using extracted hook
  /*
  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  */

  // COMMENT: PRIORITY 1 - File Modularization - Use useLocation hook after handleInputChange is defined
  const {
    locationLoading,
    getCurrentLocation,
    openMapSelector,
  } = useLocation((location, locationAr, coordinates) => {
    handleInputChange('location', location);
    handleInputChange('locationAr', locationAr);
    if (coordinates) {
      handleInputChange('coordinates', coordinates);
      handleInputChange('showOnMap', true);
    }
  });

  // COMMENT: PRIORITY 1 - File Modularization - handleNextStep and handlePrevStep extracted to useJobForm hook
  // Old functions commented out - now using extracted hook

  // COMMENT: PRIORITY 1 - File Modularization - Location logic extracted to useLocation hook
  // Old code commented out - now using extracted hook
  /*
  // Location functions
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRTL ? 'إذن الموقع مطلوب' : 'Location Permission Required',
          isRTL ? 'نحتاج إذن الموقع لتحديد موقعك الحالي' : 'We need location permission to get your current location'
      );
      return;
    }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const fullAddress = `${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.replace(/^,\s*|,\s*$/g, '');
        
        handleInputChange('location', fullAddress);
        handleInputChange('locationAr', fullAddress); // For now, same as English
        handleInputChange('coordinates', { latitude, longitude });
        handleInputChange('showOnMap', true);
        
        CustomAlertService.showSuccess(
          isRTL ? 'تم تحديد الموقع' : 'Location Set',
          isRTL ? `تم تحديد موقعك: ${fullAddress}` : `Your location has been set: ${fullAddress}`
        );
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error getting location:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ في الموقع' : 'Location Error',
        isRTL ? 'فشل في تحديد موقعك الحالي' : 'Failed to get your current location'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const openMapSelector = () => {
    // For now, show an alert. In a real app, you'd open a map modal
    Alert.alert(
      isRTL ? 'اختيار الموقع' : 'Select Location',
      isRTL ? 'سيتم فتح خريطة لاختيار الموقع' : 'Map will open to select location',
      [
        {
          text: isRTL ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
        {
          text: isRTL ? 'فتح الخريطة' : 'Open Map',
          onPress: () => {
            // In a real app, navigate to map screen
            CustomAlertService.showInfo(
              isRTL ? 'قريباً' : 'Coming Soon',
              isRTL ? 'ميزة الخريطة ستكون متاحة قريباً' : 'Map feature will be available soon'
            );
          },
        },
      ]
    );
  };
  */

  // COMMENT: PRIORITY 1 - File Modularization - Promotion logic extracted to usePromotionLogic hook
  // Old functions commented out - now using extracted hooks
  /*
  // Helper function to calculate total promotion cost
  // DISABLED: Promotions will be managed by admin via admin portal
  const calculatePromotionCost = (): number => {
    return 0; // Promotions coming soon - admin will set costs
    // let total = 0;
    // if (formData.featured) total += 50;
    // if (formData.boost) total += 100;
    // return total;
  };

  // Helper function to calculate total wallet value
  const calculateWalletValue = (): number => {
    if (!walletBalance?.balances) return 0;
    
    const coinValues: { [key: string]: number } = {
      GBC: 5, GSC: 10, GGC: 50, GPC: 100, GDC: 200, GRC: 500
    };
    
    return Object.entries(walletBalance.balances).reduce((sum, [symbol, quantity]: [string, any]) => {
      return sum + (quantity * (coinValues[symbol] || 0));
    }, 0);
  };

  // Helper function to validate promotion balance
  const validatePromotionBalance = (): { valid: boolean; message: string } => {
    const promotionCost = calculatePromotionCost();
    
    if (promotionCost === 0) {
      return { valid: true, message: '' };
    }
    
    const walletValue = calculateWalletValue();
    
    if (walletValue < promotionCost) {
      return {
        valid: false,
        message: isRTL 
          ? `رصيدك غير كافٍ. المطلوب: ${promotionCost} عملة. الرصيد الحالي: ${walletValue} عملة. يرجى شراء المزيد من العملات.`
          : `Insufficient balance. Required: ${promotionCost} coins. Current balance: ${walletValue} coins. Please purchase more coins.`
      };
    }
    
    return { valid: true, message: '' };
  };

  // Helper function to handle promotion toggle with balance check
  const handlePromotionToggle = (type: 'featured' | 'boost', currentValue: boolean) => {
    // If turning OFF, allow it
    if (currentValue) {
      handleInputChange(type, false);
      return;
    }

    // If turning ON, check balance first
    const newCost = calculatePromotionCost() + (type === 'featured' ? 50 : 100);
    const walletValue = calculateWalletValue();

    if (walletValue < newCost) {
      CustomAlertService.showError(
        isRTL ? 'رصيد غير كافٍ' : 'Insufficient Balance',
        isRTL 
          ? `رصيدك غير كافٍ لهذا الخيار. المطلوب: ${newCost} عملة. الرصيد الحالي: ${walletValue} عملة.`
          : `Insufficient balance for this option. Required: ${newCost} coins. Current balance: ${walletValue} coins.`,
        [
          {
            text: isRTL ? 'إلغاء' : 'Cancel',
            style: 'cancel',
          },
          {
            text: isRTL ? 'شراء عملات' : 'Buy Coins',
            onPress: () => router.push('/(modals)/coin-store'),
          },
        ]
      );
      return;
    }

    // Balance is sufficient, allow toggle
    handleInputChange(type, true);
  };

  // Helper function to notify admins about pending job
  const notifyAdmins = async (jobId: string, jobTitle: string) => {
    try {
      // Get all admin users
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      const adminsSnapshot = await getDocs(adminsQuery);
      
      if (adminsSnapshot.empty) {
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('No admin users found');
        return;
      }

      // Create notification for each admin
      const notificationPromises = adminsSnapshot.docs.map(async (adminDoc) => {
        await addDoc(collection(db, 'notifications'), {
          userId: adminDoc.id,
          type: 'JOB_PENDING_REVIEW',
          title: 'New Job Pending Review',
          message: `Job "${jobTitle}" needs admin review`,
          data: {
            jobId,
            jobTitle,
            status: 'pending_review'
          },
          isRead: false,
          createdAt: new Date(),
          priority: 'high',
          category: 'jobs'
        });
      });

      await Promise.all(notificationPromises);
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug(`✅ Notified ${adminsSnapshot.size} admin(s) about new job`);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error notifying admins:', error);
      // Don't throw - notification failure shouldn't block job creation
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate promotion balance
      const balanceValidation = validatePromotionBalance();
      if (!balanceValidation.valid) {
        CustomAlertService.showError(
          isRTL ? 'رصيد غير كافٍ' : 'Insufficient Balance',
          balanceValidation.message,
          [
            {
              text: isRTL ? 'إلغاء' : 'Cancel',
              style: 'cancel',
            },
            {
              text: isRTL ? 'شراء عملات' : 'Buy Coins',
              onPress: () => router.push('/(modals)/coin-store'),
            },
          ]
        );
        setIsSubmitting(false);
        return;
      }

      const jobData = {
        title: formData.primaryLanguage === 'ar' ? formData.titleAr : formData.title,
        description: formData.primaryLanguage === 'ar' ? formData.descriptionAr : formData.description,
        category: formData.category,
        budget: formData.budget,
        budgetType: formData.budgetType,
        location: formData.primaryLanguage === 'ar' ? formData.locationAr : formData.location,
        timeNeeded: formData.duration,
        isUrgent: formData.isUrgent,
        isRemote: formData.isRemote,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills,
        requirements: formData.primaryLanguage === 'ar' ? formData.requirementsAr : formData.requirements,
        deliverables: formData.primaryLanguage === 'ar' ? formData.deliverablesAr : formData.deliverables,
        visibility: formData.visibility,
        featured: formData.featured,
        boost: formData.boost,
        promotionCost: calculatePromotionCost(), // Store the cost for admin deduction
        clientId: user.uid,
        clientName: user.displayName || user.email || 'Anonymous Client',
        clientAvatar: user.photoURL || undefined,
        showOnMap: formData.showOnMap,
        coordinates: formData.coordinates,
        adminStatus: 'pending_review' as const,
        // Bilingual support
        titleAr: formData.titleAr,
        descriptionAr: formData.descriptionAr,
        locationAr: formData.locationAr,
        requirementsAr: formData.requirementsAr,
        deliverablesAr: formData.deliverablesAr,
        primaryLanguage: formData.primaryLanguage,
      };

      const result = await jobService.createJob(jobData);
      
      // Notify admins about the new job
      if (result.job?.id) {
        await notifyAdmins(result.job.id, jobData.title);
      }
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال الوظيفة' : 'Job Submitted',
        isRTL ? 'تم إرسال وظيفتك للمراجعة. ستظهر للمستقلين بعد الموافقة.' : 'Your job has been submitted for review. It will be visible after admin approval.',
        [
          {
            text: isRTL ? 'موافق' : 'OK',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error posting job:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في نشر الوظيفة. يرجى المحاولة مرة أخرى.' : 'Failed to post job. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  // Wrapper functions to use hooks with formData
  const getPromotionCost = useCallback(() => {
    return calculatePromotionCost(formData.featured, formData.boost);
  }, [formData.featured, formData.boost, calculatePromotionCost]);

  const getWalletValue = useCallback(() => {
    return calculateWalletValueForPromotion(walletBalance);
  }, [walletBalance, calculateWalletValueForPromotion]);

  const validateBalance = useCallback(() => {
    return validatePromotionBalance(getPromotionCost(), getWalletValue());
  }, [validatePromotionBalance, getPromotionCost, getWalletValue]);

  const handlePromotionToggle = useCallback((type: 'featured' | 'boost', currentValue: boolean) => {
    handlePromotionToggleFromHook(
      type,
      currentValue,
      getPromotionCost(),
      getWalletValue(),
      (type, value) => handleInputChange(type, value)
    );
  }, [handlePromotionToggleFromHook, getPromotionCost, getWalletValue, handleInputChange]);

  // Wrapper to handle submit with current hooks
  const handleSubmit = useCallback(async () => {
    const balanceValidation = validateBalance();
    if (!balanceValidation.valid) {
      CustomAlertService.showError(
        t('insufficientBalance'),
        balanceValidation.message,
        [
          {
            text: t('cancel'),
            style: 'cancel',
          },
          {
            text: t('buyCoins'),
            onPress: () => router.push('/(modals)/coin-store'),
          },
        ]
      );
      return;
    }

    await handleSubmitForm(
      getPromotionCost,
      notifyAdmins
    );
  }, [validateBalance, handleSubmitForm, getPromotionCost, notifyAdmins, isRTL]);

  // COMMENT: PRIORITY 1 - File Modularization - StepIndicator component extracted to _components/StepIndicator.tsx
  // Old render function commented out - now using extracted component
  /*
  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            {
              backgroundColor: step <= currentStep ? theme.primary : 'rgba(128,128,128,0.3)',
              borderColor: '#000000',
              marginRight: isRTL ? 0 : 4,
              marginLeft: isRTL ? 4 : 0,
            },
          ]}
        />
      ))}
      <Text style={[styles.stepText, { 
        color: '#000000',
        textAlign: isRTL ? 'right' : 'left',
        marginRight: isRTL ? 0 : 12,
        marginLeft: isRTL ? 12 : 0,
      }]}>
        {isRTL ? `الخطوة ${currentStep} من 4` : `Step ${currentStep} of 4`}
          </Text>
        </View>
  );
  */

  // COMMENT: PRIORITY 1 - File Modularization - LanguageSelector component extracted to _components/LanguageSelector.tsx
  // Old render function commented out - now using extracted component
  /*
  const renderLanguageSelector = () => (
    <View style={styles.languageSelector}>
      <Text style={[styles.languageLabel, { 
        color: theme.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
      }]}>
        {isRTL ? 'اللغة الأساسية' : 'Primary Language'}
            </Text>
      <View style={[styles.languageOptions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {[
          { key: 'en', label: isRTL ? 'الإنجليزية' : 'English' },
          { key: 'ar', label: isRTL ? 'العربية' : 'Arabic' },
          { key: 'both', label: isRTL ? 'كلاهما' : 'Both' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.languageOption,
              {
                backgroundColor: formData.primaryLanguage === option.key ? theme.primary : theme.surface,
                borderColor: formData.primaryLanguage === option.key ? theme.primary : theme.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                marginRight: isRTL ? 0 : 8,
                marginLeft: isRTL ? 8 : 0,
              },
            ]}
            onPress={() => handleInputChange('primaryLanguage', option.key as any)}
          >
            <Text
              style={[
                styles.languageOptionText,
                {
                  color: formData.primaryLanguage === option.key ? '#000000' : theme.textPrimary,
                  textAlign: 'center',
                },
              ]}
            >
              {option.label}
              </Text>
          </TouchableOpacity>
        ))}
            </View>
          </View>
  );
  */

  // COMMENT: PRIORITY 1 - File Modularization - renderStep1 extracted to Step1BasicInfo component
  // Old render function commented out - now using extracted component
  /*
  const renderStep1 = () => (
    ... old code ...
  );
  */

  const renderStep1 = () => (
    <Step1BasicInfo
      formData={formData}
      focusedField={focusedField}
      fadeAnim={fadeAnim}
      slideAnim={slideAnim}
      scaleAnim={scaleAnim}
      onInputChange={handleInputChange}
      onFocusChange={setFocusedField}
      onLanguageChange={(language) => handleInputChange('primaryLanguage', language)}
    />
  );

  // COMMENT: PRIORITY 1 - File Modularization - renderStep2 extracted to Step2BudgetTimeline component
  // Old render function commented out - now using extracted component
  /*
  const renderStep2_OLD = () => {
    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={[styles.stepTitle, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'الميزانية والجدول الزمني' : 'Budget & Timeline'}
        </Text>

      // COMMENT: Budget Type section removed - now in Step2BudgetTimeline component
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'نوع الميزانية' : 'Budget Type'}
        </Text>
        <View style={[styles.budgetTypeContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {budgetTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.budgetTypeCard,
                  {
                    backgroundColor: formData.budgetType === type.key ? theme.primary : theme.surface,
                    borderColor: formData.budgetType === type.key ? theme.primary : theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  },
                ]}
                onPress={() => handleInputChange('budgetType', type.key as any)}
              >
                <IconComponent
                  size={18}
                  color={formData.budgetType === type.key ? '#000000' : theme.primary}
                />
                <Text
                  style={[
                    styles.budgetTypeText,
                    {
                      color: formData.budgetType === type.key ? '#000000' : theme.textPrimary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
            </View>
          </View>

      // COMMENT: Budget Amount section removed
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'المبلغ' : 'Amount'} *
        </Text>
          <View style={[
          styles.budgetInputContainer,
            { 
              borderColor: focusedField === 'budget' ? theme.primary : theme.border,
            backgroundColor: theme.surface,
            }
          ]}>
          <Coins size={20} color={theme.textSecondary} />
            <TextInput
              style={[
              styles.budgetInput,
                {
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
              },
              ]}
            placeholder={isRTL ? '0' : '0'}
              placeholderTextColor={theme.textSecondary}
              value={formData.budget}
            onChangeText={(value) => handleInputChange('budget', value)}
              onFocus={() => setFocusedField('budget')}
            keyboardType="numeric"
            />
          <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
            {isRTL ? 'عملة' : 'coins'}
          </Text>
          </View>
        </View>

      // COMMENT: Duration section removed
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'المدة المتوقعة' : 'Expected Duration'} *
            </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.surface,
              borderColor: focusedField === 'duration' ? theme.primary : theme.border,
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          placeholder={isRTL ? 'مثال: 1-2 أسابيع' : 'e.g. 1-2 weeks'}
          placeholderTextColor={theme.textSecondary}
          value={formData.duration}
          onChangeText={(value) => handleInputChange('duration', value)}
          onFocus={() => setFocusedField('duration')}
        />
      </View>

      // COMMENT: Experience Level section removed
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'مستوى الخبرة المطلوب' : 'Required Experience Level'}
          </Text>
        <View style={[styles.experienceContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {experienceLevels.map((level) => {
            const IconComponent = level.icon;
            return (
              <TouchableOpacity
                key={level.key}
                style={[
                  styles.experienceCard,
                  {
                    backgroundColor: formData.experienceLevel === level.key ? theme.primary : theme.surface,
                    borderColor: formData.experienceLevel === level.key ? theme.primary : theme.border,
              flexDirection: isRTL ? 'row-reverse' : 'row',
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  },
                ]}
                onPress={() => handleInputChange('experienceLevel', level.key as any)}
              >
                <IconComponent
                  size={18}
                  color={formData.experienceLevel === level.key ? '#000000' : theme.textPrimary}
                />
                <Text
                  style={[
                    styles.experienceText,
                    {
                      color: formData.experienceLevel === level.key ? '#000000' : theme.textPrimary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      // COMMENT: Urgent Toggle section removed
      <TouchableOpacity
        style={[
          styles.urgentToggle,
          {
            backgroundColor: formData.isUrgent ? '#EF4444' : theme.surface,
            borderColor: formData.isUrgent ? '#EF4444' : theme.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        onPress={() => handleInputChange('isUrgent', !formData.isUrgent)}
      >
        <View style={{
          marginRight: isRTL ? 0 : 8,
          marginLeft: isRTL ? 8 : 0,
        }}>
          <Zap size={20} color={formData.isUrgent ? '#000000' : '#EF4444'} />
        </View>
        <Text
          style={[
            styles.urgentText,
            {
              color: formData.isUrgent ? '#000000' : '#EF4444',
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {isRTL ? 'وظيفة عاجلة' : 'Urgent Job'}
        </Text>
      </TouchableOpacity>
        </Animated.View>
      );
    };
    */

  const renderStep2 = () => (
    <Step2BudgetTimeline
      formData={{
        budget: formData.budget,
        budgetType: formData.budgetType,
        duration: formData.duration,
        isUrgent: formData.isUrgent,
      }}
      focusedField={focusedField}
      fadeAnim={fadeAnim}
      slideAnim={slideAnim}
      scaleAnim={scaleAnim}
      onInputChange={handleInputChange}
      onFocusChange={setFocusedField}
    />
  );

  // COMMENT: PRIORITY 1 - File Modularization - renderStep3 extracted to Step3LocationRequirements component
  // Old render function commented out - now using extracted component
  /*
  const renderStep3_OLD = () => {
    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={[styles.stepTitle, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'الموقع والمتطلبات' : 'Location & Requirements'}
        </Text>

      // COMMENT: Location section removed - now in Step3LocationRequirements component
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'الموقع' : 'Location'} *
        </Text>
        
        COMMENT: Location Input Fields removed - now in Step3LocationRequirements component
        COMMENT: Original location input code removed
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
            <TextInput
              style={[
              styles.textInput,
                {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'location' ? theme.primary : theme.border,
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
              },
              ]}
              placeholder={isRTL ? 'مثال: الدوحة، قطر' : 'e.g. Doha, Qatar'}
              placeholderTextColor={theme.textSecondary}
              value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
              onFocus={() => setFocusedField('location')}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'locationAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'مثال: الدوحة، قطر' : 'مثال: الدوحة، قطر'}
            placeholderTextColor={theme.textSecondary}
            value={formData.locationAr}
            onChangeText={(value) => handleInputChange('locationAr', value)}
            onFocus={() => setFocusedField('locationAr')}
          />
        ) : null}

        // COMMENT: Location Actions removed
        <View style={[styles.locationActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.locationButton, { 
              backgroundColor: theme.primary,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: 6,
            }]}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Crosshair size={16} color="#000000" />
            )}
            <Text style={[styles.locationButtonText, { 
              color: '#000000',
            }]}>
              {isRTL ? 'موقعي الحالي' : 'My Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.locationButton, { 
              backgroundColor: theme.surface, 
              borderColor: theme.border, 
              borderWidth: 1,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: 6,
            }]}
            onPress={openMapSelector}
          >
            <Map size={16} color={theme.textPrimary} />
            <Text style={[styles.locationButtonText, { 
              color: theme.textPrimary,
            }]}>
              {isRTL ? 'اختيار من الخريطة' : 'Choose on Map'}
          </Text>
          </TouchableOpacity>
        </View>
      </View>

      // COMMENT: Remote Work Toggle removed
          <TouchableOpacity
            style={[
          styles.remoteToggle,
          {
            backgroundColor: formData.isRemote ? theme.primary : theme.surface,
            borderColor: formData.isRemote ? theme.primary : theme.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        onPress={() => handleInputChange('isRemote', !formData.isRemote)}
      >
        <View style={{
          marginRight: isRTL ? 0 : 8,
          marginLeft: isRTL ? 8 : 0,
        }}>
          <Globe size={20} color={formData.isRemote ? '#000000' : theme.textPrimary} />
        </View>
        <Text
          style={[
            styles.remoteText,
            {
              color: formData.isRemote ? '#000000' : theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {isRTL ? 'عمل عن بُعد' : 'Remote Work'}
        </Text>
      </TouchableOpacity>

      // COMMENT: Requirements section removed
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'المتطلبات' : 'Requirements'}
        </Text>
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'requirements' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'اكتب المتطلبات المطلوبة...' : 'Write the required qualifications...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.requirements}
            onChangeText={(value) => handleInputChange('requirements', value)}
            onFocus={() => setFocusedField('requirements')}
            multiline
            numberOfLines={3}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'requirementsAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                    textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'اكتب المتطلبات المطلوبة...' : 'اكتب المتطلبات المطلوبة...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.requirementsAr}
            onChangeText={(value) => handleInputChange('requirementsAr', value)}
            onFocus={() => setFocusedField('requirementsAr')}
            multiline
            numberOfLines={3}
          />
        ) : null}
      </View>

      // COMMENT: Deliverables section removed
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'المخرجات المتوقعة' : 'Expected Deliverables'}
                </Text>
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'deliverables' ? theme.primary : theme.border,
                color: theme.textPrimary,
                    textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'اكتب المخرجات المتوقعة...' : 'Write the expected deliverables...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.deliverables}
            onChangeText={(value) => handleInputChange('deliverables', value)}
            onFocus={() => setFocusedField('deliverables')}
            multiline
            numberOfLines={3}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'deliverablesAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'اكتب المخرجات المتوقعة...' : 'اكتب المخرجات المتوقعة...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.deliverablesAr}
            onChangeText={(value) => handleInputChange('deliverablesAr', value)}
            onFocus={() => setFocusedField('deliverablesAr')}
            multiline
            numberOfLines={3}
          />
        ) : null}
      </View>
      </Animated.View>
    );
  };
  */

  const renderStep3 = () => (
    <Step3LocationRequirements
      formData={{
        location: formData.location,
        locationAr: formData.locationAr,
        isRemote: formData.isRemote,
        showOnMap: formData.showOnMap,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills,
        requirements: formData.requirements,
        requirementsAr: formData.requirementsAr,
        deliverables: formData.deliverables,
        deliverablesAr: formData.deliverablesAr,
        primaryLanguage: formData.primaryLanguage,
      }}
      focusedField={focusedField}
      locationLoading={locationLoading}
      fadeAnim={fadeAnim}
      slideAnim={slideAnim}
      scaleAnim={scaleAnim}
      onInputChange={handleInputChange}
      onFocusChange={setFocusedField}
      onGetCurrentLocation={getCurrentLocation}
      onOpenMapSelector={openMapSelector}
    />
  );

  // COMMENT: PRIORITY 1 - File Modularization - renderStep4 extracted to Step4VisibilitySummary component
  // Old render function commented out - now using extracted component
  /*
  const renderStep4_OLD = () => {
    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={[styles.stepTitle, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'خيارات متقدمة' : 'Advanced Options'}
        </Text>

      // COMMENT: Visibility Options removed - now in Step4VisibilitySummary component
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'الرؤية' : 'Visibility'}
        </Text>
        <View style={[styles.visibilityContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {[
            { key: 'public', label: isRTL ? 'عام' : 'Public', icon: Globe },
            { key: 'guild_only', label: isRTL ? 'النقابة فقط' : 'Guild Only', icon: Shield },
            { key: 'premium', label: isRTL ? 'مميز' : 'Premium', icon: Star },
          ].map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.visibilityCard,
                  {
                    backgroundColor: formData.visibility === option.key ? theme.primary : theme.surface,
                    borderColor: formData.visibility === option.key ? theme.primary : theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  },
                ]}
                onPress={() => handleInputChange('visibility', option.key as any)}
              >
                <IconComponent
                  size={18}
                  color={formData.visibility === option.key ? '#000000' : theme.textPrimary}
                />
                <Text
                  style={[
                    styles.visibilityText,
                    {
                      color: formData.visibility === option.key ? '#000000' : theme.textPrimary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
              </View>
            </View>

      // COMMENT: Promotion Options - DISABLED: Coming Soon via Admin Portal
      // COMMENT: Promotion code removed - now in Step4VisibilitySummary component
      // COMMENT: DISABLED: Promotions coming soon via admin portal
        {balanceError && (
          <View style={[styles.errorCard, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
            <Ionicons name="alert-circle" size={20} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {balanceError}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.error }]}
              onPress={() => {
                setBalanceError(null);
                loadBalance();
              }}
            >
              <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'إعادة المحاولة' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.promotionCard,
            {
              backgroundColor: formData.featured ? theme.primary : theme.surface,
              borderColor: formData.featured ? theme.primary : theme.border,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
          onPress={() => handlePromotionToggle('featured', formData.featured)}
        >
          <View style={{ 
            marginRight: isRTL ? 0 : 12,
            marginLeft: isRTL ? 12 : 0,
          }}>
            <Star size={20} color={formData.featured ? '#000000' : theme.primary} />
              </View>
          <View style={styles.promotionContent}>
            <Text
              style={[
                styles.promotionTitle,
                {
                  color: formData.featured ? '#000000' : theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {isRTL ? 'وظيفة مميزة' : 'Featured Job'}
            </Text>
            <Text
              style={[
                styles.promotionDescription,
                {
                  color: formData.featured ? '#000000' : theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {isRTL ? 'ستظهر في المقدمة مع خلفية ملونة' : 'Will appear at the top with colored background'}
            </Text>
            </View>
          <Text style={[styles.promotionPrice, { 
            color: formData.featured ? '#000000' : theme.primary,
            textAlign: 'center',
          }]}>
            +5 coins
          </Text>
          </TouchableOpacity>

              <TouchableOpacity
                style={[
            styles.promotionCard,
            {
              backgroundColor: formData.boost ? theme.primary : theme.surface,
              borderColor: formData.boost ? theme.primary : theme.border,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
          onPress={() => handlePromotionToggle('boost', formData.boost)}
        >
          <View style={{ 
            marginRight: isRTL ? 0 : 12,
            marginLeft: isRTL ? 12 : 0,
          }}>
            <TrendingUp size={20} color={formData.boost ? '#000000' : theme.primary} />
          </View>
          <View style={styles.promotionContent}>
                <Text
                  style={[
                styles.promotionTitle,
                {
                  color: formData.boost ? '#000000' : theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {isRTL ? 'تعزيز الوظيفة' : 'Job Boost'}
            </Text>
            <Text
              style={[
                styles.promotionDescription,
                {
                  color: formData.boost ? '#000000' : theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {isRTL ? 'ستظهر في أعلى النتائج لمدة 7 أيام' : 'Will appear at top of results for 7 days'}
            </Text>
          </View>
          <Text style={[styles.promotionPrice, { 
            color: formData.boost ? '#000000' : theme.primary,
            textAlign: 'center',
          }]}>
            +10 coins
                </Text>
              </TouchableOpacity>
        COMMENT: Promotion section removed - now in Step4VisibilitySummary component
        COMMENT: Original promotion JSX code removed - all promotion code extracted to component

      COMMENT: Summary section removed - now in Step4VisibilitySummary component
      COMMENT: All summary JSX removed for Step4VisibilitySummary component
      COMMENT: Original code: summary card showing title, category, budget, duration
      COMMENT: Closing Animated.View and function return statement
      COMMENT: </Animated.View> JSX removed
      COMMENT: return statement and function closing removed
    );
  };
  */

  const renderStep4 = () => (
    <Step4VisibilitySummary
      formData={{
        visibility: formData.visibility,
        featured: formData.featured,
        boost: formData.boost,
        title: formData.title,
        titleAr: formData.titleAr,
        category: formData.category,
        budget: formData.budget,
        budgetType: formData.budgetType,
        duration: formData.duration,
        location: formData.location,
        locationAr: formData.locationAr,
        primaryLanguage: formData.primaryLanguage,
      }}
      fadeAnim={fadeAnim}
      slideAnim={slideAnim}
      scaleAnim={scaleAnim}
      onInputChange={handleInputChange}
      onPromotionToggle={handlePromotionToggle}
      categories={categories}
    />
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  // COMMENT: PRODUCTION HARDENING - Task 4.5 - Wrap add job screen in error boundary
  return (
    <ErrorBoundary
      fallback={null}
      onError={(error, errorInfo) => {
        logger.error('Add job screen error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
      resetOnPropsChange={true}
    >
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <AddJobHeader currentStep={currentStep} />

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Footer */}
      <AddJobFooter
        currentStep={currentStep}
        isSubmitting={isSubmitting}
        onBack={handlePrevStep}
        onNext={handleNextStep}
        onSubmit={handleSubmit}
      />
    </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // COMMENT: PRIORITY 1 - File Modularization - Header/footer styles moved to AddJobHeader and AddJobFooter components
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  languageSelector: {
    marginBottom: 24,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  languageOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  flagText: {
    fontSize: 16,
  },
  languageOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  budgetTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetTypeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetTypeText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
    flexWrap: 'nowrap',
    textAlign: 'center',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  budgetInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  experienceContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  experienceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  experienceText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
    flexWrap: 'nowrap',
    textAlign: 'center',
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  urgentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remoteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 12,
  },
  remoteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  visibilityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
    flexWrap: 'nowrap',
    textAlign: 'center',
  },
  promotionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promotionContent: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  promotionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  promotionPrice: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryCategory: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryBudget: {
    fontSize: 16,
    fontWeight: '700',
  },
  // COMMENT: PRIORITY 1 - File Modularization - Footer styles moved to AddJobFooter component
});
