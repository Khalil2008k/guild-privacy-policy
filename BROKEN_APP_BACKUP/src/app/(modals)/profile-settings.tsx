import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Text, 
  StatusBar,
  Image 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { useTheme } from '@/contexts/ThemeContext';
import CustomAlert from '@/app/components/CustomAlert';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';

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
}

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  
  const [profile, setProfile] = useState<ProfileData>({
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+974 5012 3456',
    location: isRTL ? 'الدوحة، قطر' : 'Doha, Qatar',
    bio: isRTL ? 'مطور برمجيات ذو خبرة تزيد عن 5 سنوات في تطوير الويب والتطبيقات المحمولة. شغوف بإنشاء حلول مبتكرة.' : 'Experienced software developer with 5+ years in web and mobile development. Passionate about creating innovative solutions.',
    title: isRTL ? 'مطور Full-Stack ومصمم UI/UX' : 'Full-Stack Developer & UI/UX Designer',
    experience: isRTL ? '5+ سنوات' : '5+ years',
    website: 'https://ahmedhassan.dev',
    birthDate: '1990-05-15',
    skills: isRTL ? ['React Native', 'Node.js', 'تصميم UI/UX', 'MongoDB', 'TypeScript'] : ['React Native', 'Node.js', 'UI/UX Design', 'MongoDB', 'TypeScript']
  });

  const [showPersonalInfo, setShowPersonalInfo] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Custom Alert States
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showPhotoAlert, setShowPhotoAlert] = useState(false);
  const [showCameraAlert, setShowCameraAlert] = useState(false);
  const [showGalleryAlert, setShowGalleryAlert] = useState(false);

  // Update profile data when language changes
  React.useEffect(() => {
    setProfile(prev => ({
      ...prev,
      location: isRTL ? 'الدوحة، قطر' : 'Doha, Qatar',
      bio: isRTL ? 'مطور برمجيات ذو خبرة تزيد عن 5 سنوات في تطوير الويب والتطبيقات المحمولة. شغوف بإنشاء حلول مبتكرة.' : 'Experienced software developer with 5+ years in web and mobile development. Passionate about creating innovative solutions.',
      title: isRTL ? 'مطور Full-Stack ومصمم UI/UX' : 'Full-Stack Developer & UI/UX Designer',
      experience: isRTL ? '5+ سنوات' : '5+ years',
      skills: isRTL ? ['React Native', 'Node.js', 'تصميم UI/UX', 'MongoDB', 'TypeScript'] : ['React Native', 'Node.js', 'UI/UX Design', 'MongoDB', 'TypeScript']
    }));
  }, [isRTL]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(main)/profile');
    }
  }, []);

  const handleSave = useCallback(() => {
    setShowSaveAlert(true);
  }, []);
  
  const handleSaveConfirm = useCallback(() => {
    setShowSaveAlert(false);
    setIsEditing(false);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Reset changes here if needed
  }, []);

  const handleChangePhoto = useCallback(() => {
    setShowPhotoAlert(true);
  }, []);
  
  const handleCameraOption = useCallback(() => {
    setShowPhotoAlert(false);
    setShowCameraAlert(true);
  }, []);
  
  const handleGalleryOption = useCallback(() => {
    setShowPhotoAlert(false);
    setShowGalleryAlert(true);
  }, []);

  const handleSkillAdd = useCallback(() => {
    Alert.prompt(
      t('addSkill') || 'Add Skill',
      t('addSkillMessage') || 'Enter a new skill to add to your profile',
      [
        {
          text: t('cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('add') || 'Add',
          onPress: (skillName) => {
            if (skillName && skillName.trim()) {
              setProfile(prev => ({
                ...prev,
                skills: [...prev.skills, skillName.trim()]
              }));
            }
          },
        },
      ],
      'plain-text'
    );
  }, [t]);
  
  const handleSkillRemove = useCallback((skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  }, []);

  const updateProfile = useCallback((field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
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
      justifyContent: 'space-between'
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
    },
    headerTitle: { 
      color: isDarkMode ? '#000000' : '#000000', 
      fontSize: 24, 
      fontWeight: '900', 
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center'
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
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
    },
    content: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#111111' : theme.surface
    },
    scrollContent: {
      padding: 16,
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
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    skillChip: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    skillText: {
      color: theme.primary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    skillRemove: {
      color: theme.primary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      fontWeight: '900',
      marginLeft: 4,
    },
    addSkillButton: {
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
      borderStyle: 'dashed',
    },
    addSkillText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
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
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    secondaryButton: {
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
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
    bottomSpacer: {
      height: 100,
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar 
        barStyle={isDarkMode ? "dark-content" : "dark-content"} 
        backgroundColor={theme.primary} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {t('editProfile') || 'Edit Profile'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setIsEditing(!isEditing)}
            activeOpacity={0.7}
          >
            <Edit3 size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleChangePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={16} color="#000000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{profile.name}</Text>
          <Text style={styles.avatarTitle}>{profile.title}</Text>
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
                <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
              ) : (
                <Ionicons name="eye-off-outline" size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
          
          {showPersonalInfo && (
            <View style={styles.sectionContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('fullName') || 'Full Name'}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={profile.name}
                    onChangeText={(text) => updateProfile('name', text)}
                    editable={isEditing}
                    placeholder={t('enterName') || 'Enter your full name'}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('email') || 'Email'}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={profile.email}
                    onChangeText={(text) => updateProfile('email', text)}
                    editable={isEditing}
                    placeholder={t('enterEmail') || 'Enter your email'}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('phone') || 'Phone'}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('location') || 'Location'}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
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
            <Ionicons name="briefcase-outline" size={20} color={theme.textSecondary} />
          </View>
          
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTitle') || 'Job Title'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="briefcase-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
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
                <Ionicons name="star-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
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
              <View style={styles.inputContainer}>
                <Ionicons name="globe-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={profile.website}
                  onChangeText={(text) => updateProfile('website', text)}
                  editable={isEditing}
                  placeholder={t('enterWebsite') || 'Enter your website'}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="url"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bio') || 'Bio'}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
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
                {profile.skills.map((skill, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.skillChip}
                    onPress={() => isEditing && handleSkillRemove(skill)}
                    activeOpacity={isEditing ? 0.7 : 1}
                  >
                    <Text style={styles.skillText}>{skill}</Text>
                    {isEditing && <Text style={styles.skillRemove}> ×</Text>}
                  </TouchableOpacity>
                ))}
                {isEditing && (
                  <TouchableOpacity 
                    style={styles.addSkillButton}
                    onPress={handleSkillAdd}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addSkillText}>+ {t('addSkill') || 'Add Skill'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              {t('cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Ionicons name="save-outline" size={18} color="#000000" />
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
              {t('save') || 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <AppBottomNavigation currentRoute="/profile-settings" />

      {/* Custom Alerts */}
      <CustomAlert
        visible={showSaveAlert}
        title="Profile Updated"
        message="Your profile has been successfully updated!"
        buttons={[
          { text: 'OK', onPress: handleSaveConfirm }
        ]}
        onDismiss={handleSaveConfirm}
      />

      <CustomAlert
        visible={showPhotoAlert}
        title="Change Photo"
        message="Choose how you want to change your profile photo"
        buttons={[
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleCameraOption },
          { text: 'Choose from Gallery', onPress: handleGalleryOption }
        ]}
        onDismiss={() => setShowPhotoAlert(false)}
      />

      <CustomAlert
        visible={showCameraAlert}
        title="Camera"
        message="Camera functionality would be implemented here. This would open the device camera to take a new profile photo."
        buttons={[
          { text: 'OK', onPress: () => setShowCameraAlert(false) }
        ]}
        onDismiss={() => setShowCameraAlert(false)}
      />

      <CustomAlert
        visible={showGalleryAlert}
        title="Gallery"
        message="Gallery selection would be implemented here. This would open the photo gallery to choose an existing photo."
        buttons={[
          { text: 'OK', onPress: () => setShowGalleryAlert(false) }
        ]}
        onDismiss={() => setShowGalleryAlert(false)}
      />
    </View>
  );
}