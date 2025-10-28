import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { CustomAlertService } from '../services/CustomAlertService';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import {
  Send,
  Camera,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  Check,
  MapPin,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendImage: (uri: string) => void;
  onSendFile: (uri: string, name: string, type: string) => void;
  onSendLocation?: (location: { latitude: number; longitude: number; address?: string }) => void;
  onTyping?: () => void;
  disabled?: boolean;
  editMode?: boolean;
  onCancelEdit?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  recordingDuration?: number;
  isUploadingVoice?: boolean;
  onStartVideoRecording?: () => void;
  isRecordingVideo?: boolean;
  isUploadingVideo?: boolean;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  onSendImage,
  onSendFile,
  onSendLocation,
  onTyping,
  disabled = false,
  editMode = false,
  onCancelEdit,
  onStartRecording,
  onStopRecording,
  isRecording = false,
  recordingDuration = 0,
  isUploadingVoice = false,
  onStartVideoRecording,
  isRecordingVideo = false,
  isUploadingVideo = false,
}: ChatInputProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const handleSend = () => {
    if (!value.trim() && selectedImages.length === 0) return;
    
    if (selectedImages.length > 0) {
      // Send images
      selectedImages.forEach(uri => onSendImage(uri));
      setSelectedImages([]);
      setShowImagePreview(false);
    }
    
    if (value.trim()) {
      onSend();
    }
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    onTyping?.();
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      CustomAlertService.showError(
        isRTL ? 'إذن مطلوب' : 'Permission Required',
        isRTL
          ? 'نحتاج إلى إذن الكاميرا لالتقاط الصور'
          : 'We need camera permission to take photos'
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      CustomAlertService.showError(
        isRTL ? 'إذن مطلوب' : 'Permission Required',
        isRTL
          ? 'نحتاج إلى إذن الوصول إلى المعرض'
          : 'We need media library permission to select photos'
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    setShowAttachmentMenu(false);
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages([result.assets[0].uri]);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل التقاط الصورة' : 'Failed to take photo'
      );
    }
  };

  const handlePickImage = async () => {
    setShowAttachmentMenu(false);
    
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map(asset => asset.uri);
        setSelectedImages(uris);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل اختيار الصورة' : 'Failed to pick image'
      );
    }
  };

  const handlePickDocument = async () => {
    setShowAttachmentMenu(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        onSendFile(file.uri, file.name, file.mimeType || 'application/octet-stream');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل اختيار المستند' : 'Failed to pick document'
      );
    }
  };

  const handleShareLocation = async () => {
    setShowAttachmentMenu(false);

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        CustomAlertService.showError(
          isRTL ? 'إذن مطلوب' : 'Permission Required',
          isRTL
            ? 'نحتاج إلى إذن الموقع لمشاركة موقعك'
            : 'We need location permission to share your location'
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address from coordinates
      let address = '';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = [addr.street, addr.city, addr.region, addr.country]
            .filter(Boolean)
            .join(', ');
        }
      } catch (error) {
        console.log('Could not get address:', error);
      }

      // Send location
      if (onSendLocation) {
        onSendLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address || 'Current Location',
        });
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل مشاركة الموقع' : 'Failed to share location'
      );
    }
  };

  const removeImage = (uri: string) => {
    setSelectedImages(prev => prev.filter(img => img !== uri));
    if (selectedImages.length === 1) {
      setShowImagePreview(false);
    }
  };

  const renderAttachmentMenu = () => (
    <Modal
      visible={showAttachmentMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAttachmentMenu(false)}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowAttachmentMenu(false)}
      >
        <View style={[styles.attachmentMenu, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.attachmentOption} onPress={handleTakePhoto}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.primary + '20' }]}>
              <Camera size={24} color={theme.primary} />
            </View>
            <Text style={[styles.attachmentText, { color: theme.textPrimary }]}>
              {isRTL ? 'التقاط صورة' : 'Take Photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.attachmentOption} onPress={handlePickImage}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.primary + '20' }]}>
              <ImageIcon size={24} color={theme.primary} />
            </View>
            <Text style={[styles.attachmentText, { color: theme.textPrimary }]}>
              {isRTL ? 'اختيار صورة' : 'Choose Image'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.attachmentOption} onPress={handlePickDocument}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.primary + '20' }]}>
              <FileText size={24} color={theme.primary} />
            </View>
            <Text style={[styles.attachmentText, { color: theme.textPrimary }]}>
              {isRTL ? 'اختيار مستند' : 'Choose Document'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.attachmentOption} onPress={handleShareLocation}>
            <View style={[styles.attachmentIcon, { backgroundColor: theme.primary + '20' }]}>
              <MapPin size={24} color={theme.primary} />
            </View>
            <Text style={[styles.attachmentText, { color: theme.textPrimary }]}>
              {isRTL ? 'مشاركة الموقع' : 'Share Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderImagePreview = () => (
    <Modal
      visible={showImagePreview}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowImagePreview(false);
        setSelectedImages([]);
      }}
    >
      <View style={[styles.previewContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.previewHeader, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            onPress={() => {
              setShowImagePreview(false);
              setSelectedImages([]);
            }}
          >
            <X size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>
            {selectedImages.length} {isRTL ? 'صورة' : 'image(s)'}
          </Text>
          <TouchableOpacity onPress={handleSend}>
            <Check size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={selectedImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: item }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity
                style={[styles.removeImageButton, { backgroundColor: theme.error }]}
                onPress={() => removeImage(item)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        />

        <View style={[styles.previewInput, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.captionInput, { color: theme.textPrimary }]}
            placeholder={isRTL ? 'أضف تعليق...' : 'Add a caption...'}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={onChangeText}
            multiline
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {editMode && (
          <View style={[styles.editModeBar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.editModeText, { color: theme.primary }]}>
              {isRTL ? 'تعديل الرسالة' : 'Editing message'}
            </Text>
            <TouchableOpacity onPress={onCancelEdit}>
              <X size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowAttachmentMenu(true)}
            disabled={disabled || editMode}
          >
            <Paperclip
              size={24}
              color={disabled || editMode ? theme.textSecondary : theme.primary}
            />
          </TouchableOpacity>

                  {/* Voice Recording Button */}
                  {!editMode && (
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        {
                          backgroundColor: isRecording ? theme.error : 'transparent',
                        },
                      ]}
                      onPress={isRecording ? onStopRecording : onStartRecording}
                      disabled={disabled || isUploadingVoice || isRecordingVideo}
                    >
                      {isRecording ? (
                        <MicOff size={24} color="#FFFFFF" />
                      ) : (
                        <Mic size={24} color={disabled ? theme.textSecondary : theme.primary} />
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Video Recording Button */}
                  {!editMode && (
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        {
                          backgroundColor: isRecordingVideo ? theme.error : 'transparent',
                        },
                      ]}
                      onPress={onStartVideoRecording}
                      disabled={disabled || isUploadingVideo || isRecording}
                    >
                      {isRecordingVideo ? (
                        <VideoOff size={24} color="#FFFFFF" />
                      ) : (
                        <Video size={24} color={disabled ? theme.textSecondary : theme.primary} />
                      )}
                    </TouchableOpacity>
                  )}

          {/* Recording Duration Display */}
          {isRecording && (
            <View style={[styles.recordingIndicator, { backgroundColor: theme.error }]}>
              <Text style={styles.recordingText}>
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}

                  {/* Uploading Indicator */}
                  {isUploadingVoice && (
                    <View style={styles.uploadingIndicator}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={[styles.uploadingText, { color: theme.textSecondary }]}>
                        {isRTL ? 'جاري الرفع...' : 'Uploading...'}
                      </Text>
                    </View>
                  )}

                  {/* Video Uploading Indicator */}
                  {isUploadingVideo && (
                    <View style={styles.uploadingIndicator}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={[styles.uploadingText, { color: theme.textSecondary }]}>
                        {isRTL ? 'جاري رفع الفيديو...' : 'Uploading video...'}
                      </Text>
                    </View>
                  )}

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.textPrimary,
              },
            ]}
            placeholder={
              editMode
                ? isRTL
                  ? 'تعديل رسالتك...'
                  : 'Edit your message...'
                : isRTL
                ? 'اكتب رسالة...'
                : 'Type a message...'
            }
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
            editable={!disabled}
            textAlign={isRTL ? 'right' : 'left'}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  value.trim() || selectedImages.length > 0 ? theme.primary : theme.surface,
              },
            ]}
            onPress={handleSend}
            disabled={disabled || (!value.trim() && selectedImages.length === 0)}
          >
            <Send
              size={20}
              color={value.trim() || selectedImages.length > 0 ? '#000000' : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderAttachmentMenu()}
      {renderImagePreview()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  editModeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  editModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  uploadingText: {
    fontSize: 12,
    marginLeft: 6,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  attachmentMenu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewImageContainer: {
    width: 375,
    height: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInput: {
    padding: 16,
  },
  captionInput: {
    fontSize: 15,
    minHeight: 40,
  },
});
