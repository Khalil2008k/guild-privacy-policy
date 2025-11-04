/**
 * Profile Picture Editor Component
 * Independent component for editing profile pictures
 * COMMENT: PRODUCTION HARDENING - Task 2.8 - ProfilePictureEditor operates independently
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Camera, User, X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { secureStorage } from '../services/secureStorage';
import { logger } from '../utils/logger';
import * as ImagePicker from 'expo-image-picker';

const FONT_FAMILY = 'Signika Negative SC';

interface ProfilePictureEditorProps {
  initialPictureUri?: string | null;
  onPictureProcessed?: (processedImageUri: string) => Promise<void>;
  onPictureUpdated?: (pictureUri: string) => void;
  showInModal?: boolean;
}

/**
 * ProfilePictureEditor Component
 * Handles profile picture editing independently
 */
const ProfilePictureEditor = memo<ProfilePictureEditorProps>(({
  initialPictureUri,
  onPictureProcessed,
  onPictureUpdated,
  showInModal = false,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  const [profilePicture, setProfilePicture] = useState<string | null>(initialPictureUri || null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent picture loading
  const loadProfilePicture = useCallback(async () => {
    try {
      const savedPicture = await secureStorage.getItem('user_profile_picture');
      if (savedPicture) {
        setProfilePicture(savedPicture);
      } else if (initialPictureUri) {
        setProfilePicture(initialPictureUri);
      }
    } catch (error) {
      logger.error('Error loading profile picture:', error);
    }
  }, [initialPictureUri]);

  useEffect(() => {
    loadProfilePicture();
  }, [loadProfilePicture]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent image picker
  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired') || 'Permission Required',
          t('cameraPermissionMessage') || 'Please grant permission to access your photo library'
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
        const imageUri = result.assets[0].uri;
        
        // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent processing
        if (onPictureProcessed) {
          setLoading(true);
          try {
            await onPictureProcessed(imageUri);
            setProfilePicture(imageUri);
            
            // Save to secure storage independently
            await secureStorage.setItem('user_profile_picture', imageUri);
            
            if (onPictureUpdated) {
              onPictureUpdated(imageUri);
            }
            
            Alert.alert(t('success'), t('profilePictureUpdated'));
          } catch (error: any) {
            logger.error('Error processing profile picture:', error);
            Alert.alert(t('error'), error.message || t('failedToSaveProfilePicture'));
          } finally {
            setLoading(false);
          }
        } else {
          // Simple save without processing
          setProfilePicture(imageUri);
          await secureStorage.setItem('user_profile_picture', imageUri);
          
          if (onPictureUpdated) {
            onPictureUpdated(imageUri);
          }
          
          Alert.alert(t('success'), t('profilePictureUpdated'));
        }
      }
    } catch (error: any) {
      logger.error('Error picking image:', error);
      Alert.alert(t('error'), error.message || t('failedToPickImage') || 'Failed to pick image');
    }
  }, [onPictureProcessed, onPictureUpdated, t]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent camera access
  const handleTakePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired') || 'Permission Required',
          t('cameraPermissionMessage') || 'Please grant permission to access your camera'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        if (onPictureProcessed) {
          setLoading(true);
          try {
            await onPictureProcessed(imageUri);
            setProfilePicture(imageUri);
            await secureStorage.setItem('user_profile_picture', imageUri);
            
            if (onPictureUpdated) {
              onPictureUpdated(imageUri);
            }
            
            Alert.alert(t('success'), t('profilePictureUpdated'));
          } catch (error: any) {
            logger.error('Error processing profile picture:', error);
            Alert.alert(t('error'), error.message || t('failedToSaveProfilePicture'));
          } finally {
            setLoading(false);
          }
        } else {
          setProfilePicture(imageUri);
          await secureStorage.setItem('user_profile_picture', imageUri);
          
          if (onPictureUpdated) {
            onPictureUpdated(imageUri);
          }
          
          Alert.alert(t('success'), t('profilePictureUpdated'));
        }
      }
    } catch (error: any) {
      logger.error('Error taking photo:', error);
      Alert.alert(t('error'), error.message || t('failedToTakePhoto') || 'Failed to take photo');
    }
  }, [onPictureProcessed, onPictureUpdated, t]);

  // COMMENT: PRODUCTION HARDENING - Task 2.8 - Independent deletion
  const handleDeletePicture = useCallback(async () => {
    Alert.alert(
      t('deleteProfilePicture') || 'Delete Profile Picture',
      t('deleteProfilePictureMessage') || 'Are you sure you want to delete your profile picture?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await secureStorage.removeItem('user_profile_picture');
              setProfilePicture(null);
              
              if (onPictureUpdated) {
                onPictureUpdated('');
              }
              
              Alert.alert(t('success'), t('profilePictureDeleted') || 'Profile picture deleted');
            } catch (error: any) {
              logger.error('Error deleting profile picture:', error);
              Alert.alert(t('error'), error.message || t('failedToDeleteProfilePicture') || 'Failed to delete profile picture');
            }
          }
        }
      ]
    );
  }, [onPictureUpdated, t]);

  const content = (
    <View style={styles.container}>
      <View style={[styles.pictureContainer, { borderColor: theme.border }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
        ) : (
          <View style={[styles.profilePlaceholder, { backgroundColor: theme.primary + '20' }]}>
            <User size={48} color={theme.primary} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.cameraIcon, { backgroundColor: theme.primary }]}
          onPress={handlePickImage}
          disabled={loading}
        >
          <Camera size={20} color={theme.buttonText} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handlePickImage}
          disabled={loading}
        >
          <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
            {t('chooseFromLibrary') || 'Choose from Library'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleTakePhoto}
          disabled={loading}
        >
          <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
            {t('takePhoto') || 'Take Photo'}
          </Text>
        </TouchableOpacity>

        {profilePicture && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
            onPress={handleDeletePicture}
            disabled={loading}
          >
            <Text style={[styles.actionButtonText, { color: theme.error }]}>
              {t('delete')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (showInModal) {
    return (
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.background, paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
            <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowModal(false)}
              >
                <X size={24} color={theme.primary} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('profilePicture')}
              </Text>
              
              <View style={styles.headerActionButton} />
            </View>
          </View>

          <View style={styles.modalContent}>
            {content}
          </View>
        </View>
      </Modal>
    );
  }

  return content;
});

ProfilePictureEditor.displayName = 'ProfilePictureEditor';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  pictureContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  profilePlaceholder: {
    width: 114,
    height: 114,
    borderRadius: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  loadingContainer: {
    width: 114,
    height: 114,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});

export default ProfilePictureEditor;



