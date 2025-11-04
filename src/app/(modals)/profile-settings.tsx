import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Text, 
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { CustomAlert } from '@/components/CustomAlert';
import { 
  ArrowLeft, Camera, Mail, Phone, MapPin, Briefcase, Award, Globe, 
  Eye, EyeOff, User, ChevronRight, ShieldCheck, Lock, UserCircle, Save, Edit, Star, Plus, X
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { CustomAlertService } from '@/services/CustomAlertService';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  title: string;
  experience: string;
  website: string;
  birthDate: string;
  skills: string[];
  photoURL?: string;
}

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    title: '',
    experience: '',
    website: '',
    birthDate: '',
    skills: [],
    photoURL: undefined
  });

  const [originalProfile, setOriginalProfile] = useState<ProfileData>({} as ProfileData);
  const [showPersonalInfo, setShowPersonalInfo] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const profileData: ProfileData = {
          name: data.name || data.firstName + ' ' + data.lastName || '',
          email: data.email || user.email || '',
          phone: data.phoneNumber || data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          title: data.jobTitle || data.title || '',
          experience: data.experience || '',
          website: data.website || '',
          birthDate: data.birthDate || '',
          skills: data.skills || [],
          photoURL: data.photoURL || undefined
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading profile:', error);
      CustomAlertService.showError(
        isRTL ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile',
        isRTL ? 'تعذر تحميل بيانات ملفك الشخصي. يرجى المحاولة مرة أخرى.' : 'Could not load your profile data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, isRTL]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleBack = useCallback(() => {
    if (isEditing && JSON.stringify(profile) !== JSON.stringify(originalProfile)) {
      CustomAlertService.showConfirmation(
        isRTL ? 'هل لديك تغييرات غير محفوظة' : 'Unsaved Changes',
        isRTL ? 'لديك تغييرات غير محفوظة. هل تريد المغادرة بدون حفظ؟' : 'You have unsaved changes. Do you want to leave without saving?',
        () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/(main)/profile');
          }
        }
      );
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(main)/profile');
      }
    }
  }, [isEditing, profile, originalProfile, isRTL]);

  // Validation
  const validateField = useCallback((field: keyof ProfileData, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) return isRTL ? 'الاسم مطلوب' : 'Name is required';
        if (value.trim().length < 2) return isRTL ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Name must be at least 2 characters';
        return null;
      case 'email':
        if (!value.trim()) return isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return isRTL ? 'البريد الإلكتروني غير صالح' : 'Invalid email format';
        return null;
      case 'phone':
        if (value && value.length < 8) return isRTL ? 'رقم الهاتف غير صالح' : 'Invalid phone number';
        return null;
      case 'website':
        if (value && !value.match(/^https?:\/\/.+/)) return isRTL ? 'يجب أن يبدأ الموقع بـ http:// أو https://' : 'Website must start with http:// or https://';
        return null;
      default:
        return null;
    }
  }, [isRTL]);

  const updateProfile = useCallback((field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.uid) return;

    // Validate all fields
    const newErrors: Partial<Record<keyof ProfileData, string>> = {};
    (Object.keys(profile) as Array<keyof ProfileData>).forEach(field => {
      if (field === 'skills' || field === 'photoURL') return;
      const error = validateField(field, profile[field] as string);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      CustomAlertService.showError(
        isRTL ? 'خطأ في التحقق' : 'Validation Error',
        isRTL ? 'يرجى تصحيح الأخطاء قبل الحفظ.' : 'Please fix the errors before saving.'
      );
      return;
    }

    try {
      setIsSaving(true);
      const docRef = doc(db, 'users', user.uid);
      
      await updateDoc(docRef, {
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phone,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        jobTitle: profile.title,
        title: profile.title,
        experience: profile.experience,
        website: profile.website,
        birthDate: profile.birthDate,
        skills: profile.skills,
        photoURL: profile.photoURL,
        updatedAt: serverTimestamp()
      });

      setOriginalProfile(profile);
      setIsEditing(false);
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم التحديث!' : 'Profile Updated!',
        isRTL ? 'تم حفظ ملفك الشخصي بنجاح.' : 'Your profile has been saved successfully.'
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error saving profile:', error);
      CustomAlertService.showError(
        isRTL ? 'فشل الحفظ' : 'Save Failed',
        isRTL ? 'تعذر حفظ ملفك الشخصي. يرجى المحاولة مرة أخرى.' : 'Could not save your profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, validateField, isRTL]);

  const handleCancel = useCallback(() => {
    setProfile(originalProfile);
    setIsEditing(false);
    setErrors({});
  }, [originalProfile]);

  const handleChangePhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        CustomAlertService.showError(
          isRTL ? 'إذن مطلوب' : 'Permission Required',
          isRTL ? 'يرجى السماح بالوصول إلى معرض الصور في الإعدادات.' : 'Please allow access to your photo library in Settings.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error picking image:', error);
      CustomAlertService.showError(
        isRTL ? 'فشل اختيار الصورة' : 'Image Selection Failed',
        isRTL ? 'تعذر اختيار الصورة. يرجى المحاولة مرة أخرى.' : 'Could not select image. Please try again.'
      );
    }
  }, [isRTL]);

  const uploadProfileImage = useCallback(async (uri: string) => {
    if (!user?.uid) return;

    try {
      setIsUploadingImage(true);

      // Fetch image as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, `profileImages/${user.uid}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });

      setProfile(prev => ({ ...prev, photoURL: downloadURL }));
      setOriginalProfile(prev => ({ ...prev, photoURL: downloadURL }));

      CustomAlertService.showSuccess(
        isRTL ? 'تم التحديث!' : 'Photo Updated!',
        isRTL ? 'تم تحديث صورة ملفك الشخصي.' : 'Your profile photo has been updated.'
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error uploading image:', error);
      CustomAlertService.showError(
        isRTL ? 'فشل التحميل' : 'Upload Failed',
        isRTL ? 'تعذر تحميل الصورة. يرجى المحاولة مرة أخرى.' : 'Could not upload image. Please try again.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  }, [user, isRTL]);

  const handleSkillAdd = useCallback(() => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
      setShowSkillInput(false);
    }
  }, [newSkill, profile.skills]);

  const handleSkillRemove = useCallback((skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  }, []);

  const styles = StyleSheet.create({
    screen: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#000000' : theme.background 
    },
    header: { 
      paddingTop: top + 12, 
      paddingBottom: 16, 
      paddingHorizontal: 18, 
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerTitle: { 
      color: '#000000', 
      fontSize: 24, 
      fontWeight: '900', 
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center'
    },
    headerActions: {
      width: 42,
    },
    headerActionButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    content: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111111' : theme.surface
    },
    scrollContent: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
    },
    profileImageSection: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      padding: 24,
      marginBottom: 16,
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: '#000000',
      fontSize: 36,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDarkMode ? '#000000' : '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    avatarName: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      marginBottom: 4,
    },
    avatarTitle: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    sectionCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      marginBottom: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight,
      backgroundColor: isDarkMode ? '#1f1f1f' : theme.surfaceSecondary,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    toggleButton: {
      padding: 4,
    },
    sectionContent: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    inputContainerError: {
      borderColor: theme.error,
      borderWidth: 2,
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      paddingVertical: 12,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      marginTop: 4,
      marginLeft: 4,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    skillChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    skillText: {
      color: '#000000',
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    skillRemoveButton: {
      marginLeft: 8,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addSkillButton: {
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.primary,
      borderStyle: 'dashed',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addSkillText: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    skillInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    skillInput: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
    },
    skillInputButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      backgroundColor: isDarkMode ? '#000000' : theme.surface,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#262626' : theme.border,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    secondaryButton: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surfaceSecondary,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
    },
    actionButtonText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      fontWeight: '800',
    },
    primaryButtonText: {
      color: '#000000',
    },
    secondaryButtonText: {
      color: theme.textSecondary,
    },
    navigationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
      marginBottom: 12,
    },
    navigationButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    navigationButtonIcon: {
      marginRight: 12,
    },
    navigationButtonText: {
      flex: 1,
    },
    navigationButtonTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    navigationButtonSubtitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
    bottomSpacer: {
      height: 100,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={theme.primary} 
        />
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>
            {t('editProfile') || 'Edit Profile'}
          </Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>
            {isRTL ? 'جاري تحميل الملف الشخصي...' : 'Loading profile...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={theme.primary} 
      />
      
      {/* Header */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          {isRTL ? (
            <ChevronRight size={20} color={theme.primary} />
          ) : (
            <ArrowLeft size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('editProfile') || (isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile')}
        </Text>
        
        <View style={styles.headerActions}>
          {!isEditing && (
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.7}
            >
              <Edit size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profile.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {profile.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleChangePhoto}
              activeOpacity={0.7}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Camera size={16} color="#000000" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{profile.name || 'User'}</Text>
          <Text style={styles.avatarTitle}>{profile.title || 'No title set'}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('personalInformation') || 'Personal Information'}
            </Text>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setShowPersonalInfo(!showPersonalInfo)}
              activeOpacity={0.7}
            >
              {showPersonalInfo ? (
                <Eye size={20} color={theme.textSecondary} />
              ) : (
                <EyeOff size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
          
          {showPersonalInfo && (
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('fullName') || 'Full Name'}</Text>
                <View style={[styles.inputContainer, errors.name && styles.inputContainerError]}>
                  <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={profile.name}
                    onChangeText={(text) => updateProfile('name', text)}
                    editable={isEditing}
                    placeholder={t('enterName') || 'Enter your full name'}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('email') || 'Email'}</Text>
                <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
                  <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={profile.email}
                    onChangeText={(text) => updateProfile('email', text)}
                    editable={isEditing}
                    placeholder={t('enterEmail') || 'Enter your email'}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('phone') || 'Phone'}</Text>
                <View style={[styles.inputContainer, errors.phone && styles.inputContainerError]}>
                  <Phone size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={profile.phone}
                    onChangeText={(text) => updateProfile('phone', text)}
                    editable={isEditing}
                    placeholder={t('enterPhone') || 'Enter your phone number'}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('location') || 'Location'}</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={profile.location}
                    onChangeText={(text) => updateProfile('location', text)}
                    editable={isEditing}
                    placeholder={t('enterLocation') || 'Enter your location'}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Professional Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('professionalInformation') || 'Professional Information'}
            </Text>
            <Briefcase size={20} color={theme.textSecondary} />
          </View>
          
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTitle') || 'Job Title'}</Text>
              <View style={styles.inputContainer}>
                <Briefcase size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={profile.title}
                  onChangeText={(text) => updateProfile('title', text)}
                  editable={isEditing}
                  placeholder={t('enterJobTitle') || 'Enter your job title'}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('experience') || 'Experience'}</Text>
              <View style={styles.inputContainer}>
                <Award size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={profile.experience}
                  onChangeText={(text) => updateProfile('experience', text)}
                  editable={isEditing}
                  placeholder={t('enterExperience') || 'Enter your experience'}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('website') || 'Website'}</Text>
              <View style={[styles.inputContainer, errors.website && styles.inputContainerError]}>
                <Globe size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={profile.website}
                  onChangeText={(text) => updateProfile('website', text)}
                  editable={isEditing}
                  placeholder={t('enterWebsite') || 'Enter your website'}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
              {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bio') || 'Bio'}</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={theme.textSecondary} style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]} />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={profile.bio}
                  onChangeText={(text) => updateProfile('bio', text)}
                  editable={isEditing}
                  placeholder={t('enterBio') || 'Tell us about yourself'}
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('skills') || 'Skills'}</Text>
              <View style={styles.skillsContainer}>
                {(Array.isArray(profile?.skills) ? profile.skills : []).map((skill, index) => (
                  <View key={`${profile?.id || "profile"}-skill-${index}`} style={styles.skillChip}>
                    <Text style={styles.skillText}>{String(skill)}</Text>
                    {isEditing && (
                      <TouchableOpacity 
                        style={styles.skillRemoveButton}
                        onPress={() => handleSkillRemove(skill)}
                        activeOpacity={0.7}
                      >
                        <X size={10} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {isEditing && !showSkillInput && (
                  <TouchableOpacity 
                    style={styles.addSkillButton}
                    onPress={() => setShowSkillInput(true)}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={theme.primary} />
                    <Text style={styles.addSkillText}>{t('addSkill') || 'Add Skill'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showSkillInput && (
                <View style={styles.skillInputContainer}>
                  <TextInput
                    style={styles.skillInput}
                    value={newSkill}
                    onChangeText={setNewSkill}
                    placeholder={isRTL ? 'أدخل مهارة جديدة' : 'Enter new skill'}
                    placeholderTextColor={theme.textSecondary}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={styles.skillInputButton}
                    onPress={handleSkillAdd}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color="#000000" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.skillInputButton, { backgroundColor: theme.error }]}
                    onPress={() => {
                      setShowSkillInput(false);
                      setNewSkill('');
                    }}
                    activeOpacity={0.7}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Security & Verification */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('securityVerification') || 'Security & Verification'}
            </Text>
            <ShieldCheck size={20} color={theme.textSecondary} />
          </View>
          
          <View style={styles.sectionContent}>
            <TouchableOpacity 
              style={styles.navigationButton}
              onPress={() => router.push('/(modals)/security-center')}
              activeOpacity={0.7}
            >
              <View style={styles.navigationButtonContent}>
                <Lock size={20} color={theme.textSecondary} style={styles.navigationButtonIcon} />
                <View style={styles.navigationButtonText}>
                  <Text style={styles.navigationButtonTitle}>Security Center</Text>
                  <Text style={styles.navigationButtonSubtitle}>
                    Manage login history and security settings
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navigationButton}
              onPress={() => router.push('/(modals)/identity-verification')}
              activeOpacity={0.7}
            >
              <View style={styles.navigationButtonContent}>
                <UserCircle size={20} color={theme.textSecondary} style={styles.navigationButtonIcon} />
                <View style={styles.navigationButtonText}>
                  <Text style={styles.navigationButtonTitle}>Identity Verification</Text>
                  <Text style={styles.navigationButtonSubtitle}>
                    Complete KYC compliance verification
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      {isEditing && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleCancel}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <X size={18} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              {t('cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Save size={18} color="#000000" />
                <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                  {t('save') || 'Save Changes'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
