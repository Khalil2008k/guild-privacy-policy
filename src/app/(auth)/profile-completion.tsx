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
  Image,
  Animated,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Upload, Check, Camera, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ValidationRules } from '../../utils/validation';

const FONT_FAMILY = 'Signika Negative SC';

type ProfileStep = 'basic' | 'photo' | 'idVerification' | 'location' | 'skills' | 'complete';

interface Skill {
  id: string;
  name: string;
  selected: boolean;
}

export default function ProfileCompletionScreen() {
  const { top } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { profile, updateProfile } = useUserProfile();
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // State management
  const [currentStep, setCurrentStep] = useState<ProfileStep>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [idFrontImage, setIdFrontImage] = useState<string | null>(null);
  const [idBackImage, setIdBackImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    idNumber: '',
  });

  // Skills data
  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', name: 'Web Development', selected: false },
    { id: '2', name: 'Mobile Development', selected: false },
    { id: '3', name: 'UI/UX Design', selected: false },
    { id: '4', name: 'Graphic Design', selected: false },
    { id: '5', name: 'Digital Marketing', selected: false },
    { id: '6', name: 'Content Writing', selected: false },
    { id: '7', name: 'Photography', selected: false },
    { id: '8', name: 'Video Editing', selected: false },
    { id: '9', name: 'Data Analysis', selected: false },
    { id: '10', name: 'Project Management', selected: false },
    { id: '11', name: 'Consulting', selected: false },
    { id: '12', name: 'Translation', selected: false },
  ]);

  // Animation
  const slideAnimation = new Animated.Value(0);
  const progressAnimation = new Animated.Value(0);

  // Form validation
  const { updateField, validateForm, getFieldError } = useFormValidation({
    firstName: { value: formData.firstName, rules: { required: true, minLength: 2 } },
    lastName: { value: formData.lastName, rules: { required: true, minLength: 2 } },
    phoneNumber: { value: formData.phoneNumber, rules: ValidationRules.phone },
    idNumber: { value: formData.idNumber, rules: { required: true, minLength: 8 } },
  });

  // Calculate completion progress
  useEffect(() => {
    let progress = 0;
    const steps = ['basic', 'photo', 'idVerification', 'location', 'skills', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    progress = (currentIndex / (steps.length - 1)) * 100;
    
    setCompletionProgress(progress);
    
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Animate on step change
  useEffect(() => {
    console.log('📝 ProfileCompletion: Step changed to:', currentStep);
    
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  // Update form field
  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateField(field, value);
  };

  // Handle image picker
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        CustomAlertService.showError(t('permissionRequired'), t('cameraPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        console.log('📝 Profile image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('📝 Error picking image:', error);
      CustomAlertService.showError(t('error'), t('failedToSelectImage'));
    }
  };

  // Handle camera with face detection
  const handleCamera = async (imageType: 'profile' | 'idFront' | 'idBack' = 'profile') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        CustomAlertService.showError(t('permissionRequired'), t('cameraPermissionRequired'));
        return;
      }

      const cameraOptions = {
        allowsEditing: true,
        aspect: imageType === 'profile' ? [1, 1] : [4, 3] as [number, number],
        quality: 0.8,
      };

      const result = await ImagePicker.launchCameraAsync(cameraOptions);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        if (imageType === 'profile') {
          // Simulate face detection (in real app, use ML Kit or similar)
          const hasFace = await simulateFaceDetection(imageUri);
          
          if (!hasFace) {
            CustomAlertService.showConfirmation(
              t('faceNotDetected'),
              t('pleaseEnsureFaceVisible'),
              () => handleCamera('profile'),
              undefined,
              isRTL
            );
            return;
          }
          
          setProfileImage(imageUri);
          setFaceDetected(true);
          console.log('📝 Profile photo with face taken:', imageUri);
        } else if (imageType === 'idFront') {
          setIdFrontImage(imageUri);
          console.log('📝 ID front photo taken:', imageUri);
        } else if (imageType === 'idBack') {
          setIdBackImage(imageUri);
          console.log('📝 ID back photo taken:', imageUri);
        }
      }
    } catch (error) {
      console.error('📝 Error taking photo:', error);
      CustomAlertService.showError(t('error'), t('failedToTakePhoto'));
    }
  };

  // Simulate face detection (replace with real ML Kit implementation)
  const simulateFaceDetection = async (imageUri: string): Promise<boolean> => {
    // Mock face detection - in real app, use Google ML Kit or similar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, randomly return true/false (80% success rate)
    // In real implementation, this would analyze the image for faces
    return Math.random() > 0.2;
  };

  // Handle location
  const handleLocationRequest = async () => {
    try {
      setIsLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        CustomAlertService.showError(t('permissionRequired'), t('locationPermissionRequired'));
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: address[0] ? `${address[0].city}, ${address[0].country}` : 'Unknown Location',
      };

      setLocation(locationData);
      console.log('📝 Location obtained:', locationData);
      
    } catch (error) {
      console.error('📝 Error getting location:', error);
      CustomAlertService.showError(t('error'), t('failedToGetLocation'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skill toggle
  const toggleSkill = (skillId: string) => {
    setSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, selected: !skill.selected }
        : skill
    ));
  };

  // Handle step navigation
  const handleNext = async () => {
    switch (currentStep) {
      case 'basic':
        if (!validateBasicInfo()) return;
        setCurrentStep('photo');
        break;
      case 'photo':
        if (!profileImage) {
          CustomAlertService.showError(t('profilePhotoRequired'), t('pleaseAddProfilePhoto'));
          return;
        }
        setCurrentStep('idVerification');
        break;
      case 'idVerification':
        if (!idFrontImage || !idBackImage) {
          CustomAlertService.showError(t('idVerificationRequired'), t('pleaseAddBothIdSides'));
          return;
        }
        setCurrentStep('location');
        break;
      case 'location':
        setCurrentStep('skills');
        break;
      case 'skills':
        await handleProfileSubmit();
        break;
      default:
        break;
    }
  };

  // Validate basic info
  const validateBasicInfo = () => {
    const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'idNumber'];
    
    for (const field of requiredFields) {
      updateField(field, formData[field as keyof typeof formData]);
    }
    
    if (!validateForm()) {
      const errors = requiredFields.map(field => getFieldError(field)).filter(Boolean);
      if (errors.length > 0) {
        CustomAlertService.showError(t('error'), errors[0]);
        return false;
      }
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      CustomAlertService.showError(t('error'), t('pleaseEnterFullName'));
      return false;
    }

    if (!formData.idNumber.trim()) {
      CustomAlertService.showError(t('error'), t('pleaseEnterIdNumber'));
      return false;
    }

    return true;
  };

  // Handle profile submission
  const handleProfileSubmit = async () => {
    setIsLoading(true);

    try {
      const selectedSkills = skills.filter(skill => skill.selected).map(skill => skill.name);
      
      const profileData = {
        ...formData,
        profileImage,
        idFrontImage,
        idBackImage,
        location,
        skills: selectedSkills,
        faceDetected,
        completedAt: new Date().toISOString(),
      };

      console.log('📝 Submitting profile data:', profileData);
      
      // Save to user profile context
      await updateProfile(profileData);
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Profile submitted and saved successfully');
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('📝 Error submitting profile:', error);
      CustomAlertService.showError(t('error'), t('failedToSaveProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 'basic':
        return t('basicInformation');
      case 'photo':
        return t('profilePhoto');
      case 'idVerification':
        return t('idVerification');
      case 'location':
        return t('location');
      case 'skills':
        return t('skills');
      case 'complete':
        return t('profileComplete');
      default:
        return t('profileCompletion');
    }
  };

  // Get step description
  const getStepDescription = () => {
    switch (currentStep) {
      case 'basic':
        return t('enterBasicInformation');
      case 'photo':
        return t('addProfilePhotoRequired');
      case 'idVerification':
        return t('verifyIdentityWithId');
      case 'location':
        return t('shareLocationOptional');
      case 'skills':
        return t('selectYourSkills');
      case 'complete':
        return t('profileSetupComplete');
      default:
        return '';
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <MaterialIcons name="person-outline" size={48} color={theme.primary} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary || '#FFFFFF' }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary || '#CCCCCC' }]}>
              {getStepDescription()}
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <View style={[styles.inputWrapper, styles.halfInput, { borderColor: theme.border || '#333333' }]}>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary || '#FFFFFF' }]}
                    placeholder={t('firstName')}
                    placeholderTextColor={theme.textSecondary || '#CCCCCC'}
                    value={formData.firstName}
                    onChangeText={(value) => updateFormField('firstName', value)}
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                </View>
                <View style={[styles.inputWrapper, styles.halfInput, { borderColor: theme.border || '#333333' }]}>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary || '#FFFFFF' }]}
                    placeholder={t('lastName')}
                    placeholderTextColor={theme.textSecondary || '#CCCCCC'}
                    value={formData.lastName}
                    onChangeText={(value) => updateFormField('lastName', value)}
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                </View>
              </View>

              <View style={[styles.inputWrapper, { borderColor: theme.border || '#333333' }]}>
                <MaterialIcons name="phone" size={20} color={theme.textSecondary || '#CCCCCC'} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary || '#FFFFFF' }]}
                  placeholder={t('phoneNumber')}
                  placeholderTextColor={theme.textSecondary || '#CCCCCC'}
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormField('phoneNumber', value)}
                  keyboardType="phone-pad"
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              <View style={[styles.inputWrapper, { borderColor: theme.border || '#333333' }]}>
                <MaterialIcons name="badge" size={20} color={theme.textSecondary || '#CCCCCC'} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary || '#FFFFFF' }]}
                  placeholder={t('idNumber')}
                  placeholderTextColor={theme.textSecondary || '#CCCCCC'}
                  value={formData.idNumber}
                  onChangeText={(value) => updateFormField('idNumber', value)}
                  keyboardType="numeric"
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              <View style={[styles.inputWrapper, styles.textAreaWrapper, { borderColor: theme.border || '#333333' }]}>
                <TextInput
                  style={[styles.textArea, { color: theme.textPrimary || '#FFFFFF' }]}
                  placeholder={t('bioOptional')}
                  placeholderTextColor={theme.textSecondary || '#CCCCCC'}
                  value={formData.bio}
                  onChangeText={(value) => updateFormField('bio', value)}
                  multiline
                  numberOfLines={4}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </View>
          </View>
        );

      case 'photo':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.warning + '20' }]}>
              <MaterialIcons name="photo-camera" size={48} color={theme.warning} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary || '#FFFFFF' }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary || '#CCCCCC' }]}>
              {getStepDescription()}
            </Text>

            <View style={styles.photoContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: theme.surface || '#1a1a1a' }]}>
                  <MaterialIcons name="person" size={60} color={theme.textSecondary || '#CCCCCC'} />
                </View>
              )}
            </View>

            <View style={styles.instructionContainer}>
              <Text style={[styles.instructionText, { color: theme.warning || '#FFA500' }]}>
                {t('faceDetectionRequired')}
              </Text>
              <Text style={[styles.instructionSubtext, { color: theme.textSecondary || '#CCCCCC' }]}>
                {t('ensureFaceInCenter')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cameraButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => handleCamera('profile')}
            >
              <MaterialIcons name="photo-camera" size={32} color={theme.primary} />
              <Text style={[styles.cameraButtonText, { color: theme.primary }]}>
                {t('takeProfilePhoto')}
              </Text>
            </TouchableOpacity>

            {faceDetected && (
              <View style={[styles.successIndicator, { backgroundColor: theme.success + '20' }]}>
                <MaterialIcons name="check-circle" size={20} color={theme.success} />
                <Text style={[styles.successText, { color: theme.success }]}>
                  {t('faceDetectedSuccessfully')}
                </Text>
              </View>
            )}
          </View>
        );

      case 'idVerification':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
              <MaterialIcons name="credit-card" size={48} color={theme.error} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary || '#FFFFFF' }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary || '#CCCCCC' }]}>
              {getStepDescription()}
            </Text>

            {/* Photo Guidelines */}
            <View style={[styles.guidelinesBox, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}>
              <View style={styles.guidelinesHeader}>
                <Ionicons name="information-circle" size={20} color={theme.primary} />
                <Text style={[styles.guidelinesTitle, { color: theme.textPrimary }]}>
                  {t('photoGuidelines')}
                </Text>
              </View>
              
              <View style={[styles.guidelineItem, { marginTop: 4 }]}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
                  {t('ensureGoodLighting')}
                </Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
                  {t('keepIdFlat')}
                </Text>
              </View>
              
              <View style={[styles.guidelineItem, { marginBottom: 0 }]}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                <Text style={[styles.guidelineText, { color: theme.textSecondary }]}>
                  {t('ensureTextClear')}
                </Text>
              </View>
            </View>

            <View style={styles.idContainer}>
              <View style={styles.idSection}>
                <View style={styles.idSectionHeader}>
                  <Text style={[styles.idLabel, { color: theme.textPrimary || '#FFFFFF' }]}>
                    {t('qatarIdFront')}
                  </Text>
                  <Text style={[styles.idHint, { color: theme.textSecondary }]}>
                    {t('frontSideHint')}
                  </Text>
                </View>
                {idFrontImage ? (
                  <Image source={{ uri: idFrontImage }} style={styles.idImage} />
                ) : (
                  <View style={[styles.placeholderId, { backgroundColor: theme.surface || '#1a1a1a' }]}>
                    <MaterialIcons name="credit-card" size={40} color={theme.textSecondary || '#CCCCCC'} />
                    <Text style={[styles.placeholderText, { color: theme.textSecondary || '#CCCCCC' }]}>
                      {t('frontSide')}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.idButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                  onPress={() => handleCamera('idFront')}
                >
                  <MaterialIcons name="photo-camera" size={20} color={theme.primary} />
                  <Text style={[styles.idButtonText, { color: theme.primary }]}>
                    {idFrontImage ? t('retakePhoto') : t('takePhoto')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.idSection}>
                <View style={styles.idSectionHeader}>
                  <Text style={[styles.idLabel, { color: theme.textPrimary || '#FFFFFF' }]}>
                    {t('qatarIdBack')}
                  </Text>
                  <Text style={[styles.idHint, { color: theme.textSecondary }]}>
                    {t('backSideHint')}
                  </Text>
                </View>
                {idBackImage ? (
                  <Image source={{ uri: idBackImage }} style={styles.idImage} />
                ) : (
                  <View style={[styles.placeholderId, { backgroundColor: theme.surface || '#1a1a1a' }]}>
                    <MaterialIcons name="credit-card" size={40} color={theme.textSecondary || '#CCCCCC'} />
                    <Text style={[styles.placeholderText, { color: theme.textSecondary || '#CCCCCC' }]}>
                      {t('backSide')}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.idButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                  onPress={() => handleCamera('idBack')}
                >
                  <MaterialIcons name="photo-camera" size={20} color={theme.primary} />
                  <Text style={[styles.idButtonText, { color: theme.primary }]}>
                    {idBackImage ? t('retakePhoto') : t('takePhoto')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.warningContainer, { backgroundColor: theme.warning + '10', borderColor: theme.warning }]}>
              <MaterialIcons name="info" size={20} color={theme.warning} />
              <Text style={[styles.warningText, { color: theme.warning }]}>
                {t('idVerificationWarning')}
              </Text>
            </View>
          </View>
        );

      case 'location':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.info + '20' }]}>
              <MaterialIcons name="location-on" size={48} color={theme.info} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary || '#FFFFFF' }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary || '#CCCCCC' }]}>
              {getStepDescription()}
            </Text>

            {location ? (
              <View style={[styles.locationCard, { backgroundColor: theme.surface || '#1a1a1a', borderColor: theme.border || '#333333' }]}>
                <MaterialIcons name="location-on" size={24} color={theme.success} />
                <Text style={[styles.locationText, { color: theme.textPrimary || '#FFFFFF' }]}>
                  {location.address}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.locationButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                onPress={handleLocationRequest}
                disabled={isLoading}
              >
                <MaterialIcons name="my-location" size={24} color={theme.primary} />
                <Text style={[styles.locationButtonText, { color: theme.primary }]}>
                  {isLoading ? t('gettingLocation') : t('shareLocation')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'skills':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.success + '20' }]}>
              <MaterialIcons name="star-outline" size={48} color={theme.success} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary || '#FFFFFF' }]}>
              {getStepTitle()}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary || '#CCCCCC' }]}>
              {getStepDescription()}
            </Text>

            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={[
                    styles.skillChip,
                    {
                      backgroundColor: skill.selected 
                        ? (theme.primary + '20') 
                        : (theme.surface || '#1a1a1a'),
                      borderColor: skill.selected 
                        ? (theme.primary || '#BCFF31') 
                        : (theme.border || '#333333'),
                    }
                  ]}
                  onPress={() => toggleSkill(skill.id)}
                >
                  <Text style={[
                    styles.skillText,
                    { 
                      color: skill.selected 
                        ? (theme.primary || '#BCFF31') 
                        : (theme.textSecondary || '#CCCCCC') 
                    }
                  ]}>
                    {skill.name}
                  </Text>
                  {skill.selected && (
                    <MaterialIcons name="check" size={16} color={theme.primary || '#BCFF31'} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.success + '20' }]}>
              <MaterialIcons name="check-circle" size={48} color={theme.success} />
            </View>

            <Text style={[styles.title, { color: theme.textPrimary || '#FFFFFF' }]}>
              {t('congratulations')}
            </Text>
            
            <Text style={[styles.description, { color: theme.textSecondary || '#CCCCCC' }]}>
              {getStepDescription()}
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary || '#BCFF31' }]}
              onPress={() => router.replace('/(main)/home')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.buttonText || '#000000' }]}>
                {t('startExploring')}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background || '#000000' }]}>
      <StatusBar 
        barStyle={(theme.background || '#000000') === '#000000' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background || '#000000'} 
      />
      
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: top + 16,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color={theme.textPrimary || '#FFFFFF'} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { 
          color: theme.textPrimary || '#FFFFFF',
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {getStepTitle()}
        </Text>
        
        <Text style={[styles.progressText, { 
          color: theme.textSecondary || '#CCCCCC',
          textAlign: isRTL ? 'left' : 'right',
        }]}>
          {Math.round(completionProgress)}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: theme.border || '#333333' }]}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              { 
                backgroundColor: theme.primary || '#BCFF31',
                width: progressAnimation.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.animatedContent}>
            {renderStepContent()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      {currentStep !== 'complete' && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary || '#BCFF31' }]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText || '#000000' }]}>
              {currentStep === 'skills' 
                ? (isLoading ? t('saving') : t('completeProfile'))
                : t('next')
              }
            </Text>
          </TouchableOpacity>

          {currentStep !== 'basic' && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border || '#333333' }]}
              onPress={() => {
                const steps: ProfileStep[] = ['basic', 'photo', 'location', 'skills'];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1]);
                }
              }}
              disabled={isLoading}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textSecondary || '#CCCCCC' }]}>
                {t('back')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={[(theme.primary || '#BCFF31') + '20', (theme.primary || '#BCFF31') + '40']}
            style={styles.loadingContainer}
          >
            <MaterialIcons name="autorenew" size={32} color={theme.primary || '#BCFF31'} />
            <Text style={[styles.loadingText, { color: theme.textPrimary || '#FFFFFF' }]}>
              {currentStep === 'location' && t('gettingLocation')}
              {currentStep === 'skills' && t('saving')}
              {!['location', 'skills'].includes(currentStep) && t('loading')}
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    flex: 1,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    minWidth: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    minHeight: 400,
  },
  animatedContent: {
    flex: 1,
    minHeight: 400,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  halfInput: {
    width: '48%',
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    fontFamily: FONT_FAMILY,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginLeft: 12,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginLeft: 8,
  },
  idContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 24,
  },
  idSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  idLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  idImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  placeholderId: {
    width: 200,
    height: 120,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginTop: 8,
  },
  idButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  idButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginLeft: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginLeft: 8,
    flex: 1,
  },
  guidelinesBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderLeftWidth: 4,
    minHeight: 120,
    width: '100%',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginLeft: 8,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    paddingRight: 4,
  },
  guidelineText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    flex: 1,
    marginLeft: 8,
    flexWrap: 'wrap',
  },
  idSectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  idHint: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginTop: 2,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginLeft: 12,
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginLeft: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginRight: 4,
  },
  navigationContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginTop: 12,
  },
});
