/**
 * Profile Edit Screen
 * Edit user display name, bio, avatar
 */

import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/I18nProvider';
import * as ImagePicker from 'expo-image-picker';
import { User, Camera, Save, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      setPhotoURL(result.assets[0].uri);
    }
  };
  
  const handleSave = async () => {
    if (!displayName.trim()) {
      CustomAlertService.showError(
        t('error'),
        t('profile.nameRequired')
      );
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile({ displayName, bio, photoURL });
      CustomAlertService.showSuccess(
        t('success'),
        t('profile.updated')
      );
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      CustomAlertService.showError(
        t('error'),
        t('profile.updateFailed')
      );
    } finally {
      setLoading(false);
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingTop: insets.top + 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 20,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: theme.primary,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.border,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.primary,
      borderRadius: 20,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.surface,
      color: theme.textPrimary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 16,
      textAlign: isRTL ? 'right' : 'left',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    bioInput: {
      backgroundColor: theme.surface,
      color: theme.textPrimary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 120,
      fontSize: 16,
      textAlignVertical: 'top',
      textAlign: isRTL ? 'right' : 'left',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    charCount: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: 30,
      textAlign: isRTL ? 'right' : 'left',
    },
    saveButton: {
      backgroundColor: loading ? theme.border : theme.primary,
      borderRadius: 12,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButtonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '700',
    },
    cancelButton: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    cancelButtonText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>
          {t('profile.editProfile')}
        </Text>
        
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color={theme.textSecondary} />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Camera size={20} color="#000000" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Display Name */}
        <Text style={styles.label}>
          {t('profile.displayName')}
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('profile.enterName')}
          placeholderTextColor={theme.textSecondary}
          style={styles.input}
        />
        
        {/* Bio */}
        <Text style={styles.label}>
          {t('profile.bio')}
        </Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder={t('profile.enterBio')}
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
          maxLength={500}
          style={styles.bioInput}
        />
        <Text style={styles.charCount}>
          {bio.length}/500
        </Text>
        
        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Save size={20} color="#000000" />
              <Text style={styles.saveButtonText}>
                {t('saveChanges')}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
          style={styles.cancelButton}
        >
          <X size={20} color={theme.textPrimary} />
          <Text style={styles.cancelButtonText}>
            {t('cancel')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}





