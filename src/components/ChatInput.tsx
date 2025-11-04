import React, { useState, useEffect } from 'react';
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
  Keyboard,
  Platform,
} from 'react-native';
import { CustomAlertService } from '../services/CustomAlertService';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';
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
  ImagePlus,
  Clock,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { GifPicker } from './GifPicker';
import { QuickReplies, DEFAULT_QUICK_REPLIES_LIST } from './QuickReplies';
import { MessageScheduler } from './MessageScheduler';

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
  // Voice recording - Only advanced recorder
  isUploadingVoice?: boolean;
  onOpenAdvancedVoiceRecorder?: () => void;
  // Video recording - Use ImagePicker
  onStartVideoRecording?: () => void;
  isUploadingVideo?: boolean;
  onSendGif?: (gifUrl: string, gifId?: string) => void;
  giphyApiKey?: string;
  useGiphyAPI?: boolean;
  quickReplies?: Array<{ id: string; text: string; emoji?: string }>;
  showQuickReplies?: boolean;
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
  // Voice recording - Only advanced recorder
  isUploadingVoice = false,
  onOpenAdvancedVoiceRecorder,
  // Video recording - Use ImagePicker
  onStartVideoRecording,
  isUploadingVideo = false,
  onSendGif,
  giphyApiKey,
  useGiphyAPI = false,
  quickReplies,
  showQuickReplies = true,
}: ChatInputProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Track keyboard visibility to recalculate padding when keyboard hides
  // Use keyboardWillHide (before animation) to fix gap immediately BEFORE keyboard disappears
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );

    // Use keyboardWillHide on iOS and keyboardDidHide on Android
    // This triggers BEFORE keyboard fully disappears to fix gap immediately
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Force immediate state update BEFORE keyboard animation completes
        // This ensures padding is recalculated instantly when keyboard starts hiding
        // Multiple forced updates ensure React re-renders immediately
        setKeyboardVisible(false);
        // Force immediate re-render using requestAnimationFrame (runs before next paint)
        requestAnimationFrame(() => {
          setKeyboardVisible(false);
        });
        // Additional forced update using setTimeout (runs immediately after current call stack)
        setTimeout(() => {
          setKeyboardVisible(false);
        }, 0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  const handleQuickReplySelect = (reply: { id: string; text: string; emoji?: string }) => {
    onChangeText(reply.text);
    // Small delay to ensure text is set before sending
    setTimeout(() => {
      onSend();
    }, 100);
  };

  const handleSend = () => {
    logger.debug('🔵 [ChatInput] handleSend called', { 
      hasText: !!value.trim(), 
      imageCount: selectedImages.length,
      imageUris: selectedImages
    });
    
    if (!value.trim() && selectedImages.length === 0) {
      logger.debug('🔵 [ChatInput] handleSend: No text and no images, returning');
      return;
    }
    
    if (selectedImages.length > 0) {
      logger.debug(`🔵 [ChatInput] handleSend: Starting to send ${selectedImages.length} image(s)`);
      // Send images - wrap in try/catch to prevent crashes
      try {
        logger.debug(`🔵 [ChatInput] handleSend: Entering images loop, count: ${selectedImages.length}`);
        selectedImages.forEach((uri, index) => {
          try {
            logger.debug(`🔵 [ChatInput] handleSend: Processing image ${index + 1}/${selectedImages.length}`, { uri });
            if (!uri || typeof uri !== 'string') {
              logger.warn(`⚠️ [ChatInput] Invalid image URI at index ${index}:`, uri);
              return;
            }
            logger.debug(`📸 [ChatInput] Calling onSendImage for image ${index + 1}/${selectedImages.length}`, { uri });
            onSendImage(uri);
            logger.debug(`✅ [ChatInput] onSendImage called successfully for image ${index + 1}`);
          } catch (error) {
            logger.error(`❌ [ChatInput] Error sending image ${index + 1}:`, error);
            CustomAlertService.showError(
              isRTL ? 'خطأ' : 'Error',
              isRTL 
                ? `فشل إرسال الصورة ${index + 1} من ${selectedImages.length}`
                : `Failed to send image ${index + 1} of ${selectedImages.length}`
            );
          }
        });
        logger.debug(`🔵 [ChatInput] handleSend: All images processed, clearing state`);
        setSelectedImages([]);
        setShowImagePreview(false);
        logger.debug(`✅ [ChatInput] handleSend: Image state cleared`);
      } catch (error) {
        logger.error('❌ [ChatInput] Error in handleSend for images:', error);
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل إرسال الصور' : 'Failed to send images'
        );
      }
    }
    
    if (value.trim()) {
      try {
        logger.debug('🔵 [ChatInput] handleSend: Sending text message');
        onSend();
        logger.debug('✅ [ChatInput] handleSend: Text message sent');
      } catch (error) {
        logger.error('❌ [ChatInput] Error in handleSend for text:', error);
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message'
        );
      }
    }
    
    logger.debug('🔵 [ChatInput] handleSend: Completed');
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
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages([result.assets[0].uri]);
        setShowImagePreview(true);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error taking photo:', error);
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
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map(asset => asset.uri);
        setSelectedImages(uris);
        setShowImagePreview(true);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error picking image:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error picking document:', error);
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
        // COMMENT: PRIORITY 1 - Replace console.log with logger
        logger.debug('Could not get address:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error sharing location:', error);
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

          {onOpenAdvancedVoiceRecorder && (
            <TouchableOpacity 
              style={styles.attachmentOption} 
              onPress={() => {
                setShowAttachmentMenu(false);
                onOpenAdvancedVoiceRecorder();
              }}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: theme.error + '20' }]}>
                <Mic size={24} color={theme.error} />
              </View>
              <Text style={[styles.attachmentText, { color: theme.textPrimary }]}>
                {isRTL ? 'تسجيل صوتي متقدم' : 'Advanced Voice'}
              </Text>
            </TouchableOpacity>
          )}
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
      {/* Quick Replies - Show when input is empty and not in edit mode */}
      {showQuickReplies && !editMode && !value.trim() && (
        <View style={{ marginBottom: 10, backgroundColor: 'transparent' }}>
          <QuickReplies
            replies={quickReplies || DEFAULT_QUICK_REPLIES_LIST}
            onSelect={handleQuickReplySelect}
            visible={true}
          />
        </View>
      )}
      
      {/* Input Bar - Matching Home Screen Theme */}
      <View
        style={[
          styles.container, 
          { 
            backgroundColor: 'transparent', // Transparent background
            // Force immediate padding recalculation when keyboard starts hiding
            // Use keyboardWillHide to trigger BEFORE keyboard fully disappears
            // When keyboard visible: minimal padding (8px)
            // When keyboard hidden: safe area insets or minimum 8px
            paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom || 0, 8), // Always use max of safe area or 8px when keyboard is hidden
          }
        ]}
      >
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
          {/* Input Container (80% width) with camera button inside */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
              {
                backgroundColor: theme.background,
                color: theme.textPrimary,
                borderWidth: 0.5, // Reduced thickness
                borderColor: theme.primary, // Use theme color
                paddingRight: onStartVideoRecording ? 46 : 12, // Space for camera button
                paddingLeft: 12,
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
              textAlignVertical="center"
            />
            
            {/* Camera Button - Inside input field at the end, slightly up */}
            {onStartVideoRecording && (
              <TouchableOpacity
                style={styles.inputEndButton}
                onPress={onStartVideoRecording}
                disabled={disabled || isUploadingVideo || isUploadingVoice}
                accessibilityLabel={isRTL ? 'كاميرا / فيديو' : 'Camera / Video'}
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Camera 
                  size={21} 
                  color={disabled || isUploadingVideo || isUploadingVoice ? theme.textSecondary : (theme.iconPrimary || theme.primary)} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Icons Container - Attachment and Voice/Send buttons */}
          <View style={styles.iconsContainer}>

            {/* Attachment/Add button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowAttachmentMenu(true)}
              disabled={disabled || editMode}
              accessibilityLabel={isRTL ? 'إضافة مرفق' : 'Add attachment'}
              accessibilityRole="button"
            >
              <Paperclip
                size={22}
                color={disabled || editMode ? theme.textSecondary : (theme.iconPrimary || theme.primary)}
              />
            </TouchableOpacity>

            {/* Voice Recording or Send Button */}
            {!value.trim() && !editMode ? (
              /* Voice Recording Button - Show when input is empty */
              onOpenAdvancedVoiceRecorder && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onOpenAdvancedVoiceRecorder}
                  disabled={disabled || isUploadingVoice || isUploadingVideo}
                  accessibilityLabel={isRTL ? 'تسجيل صوتي' : 'Record voice'}
                  accessibilityRole="button"
                >
                  <Mic 
                    size={22} 
                    color={disabled || isUploadingVoice || isUploadingVideo ? theme.textSecondary : (theme.iconPrimary || theme.primary)} 
                  />
                </TouchableOpacity>
              )
            ) : (
              /* Send Button - Show only when there is text */
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={handleSend}
                disabled={disabled || (!value.trim() && selectedImages.length === 0)}
                accessibilityLabel={isRTL ? 'إرسال' : 'Send'}
                accessibilityRole="button"
              >
                <Send
                  size={20}
                  color={theme.buttonText || '#000000'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Uploading Indicators */}
          {isUploadingVoice && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.uploadingText, { color: theme.textSecondary }]}>
                {isRTL ? 'جاري الرفع...' : 'Uploading...'}
              </Text>
            </View>
          )}

          {isUploadingVideo && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.uploadingText, { color: theme.textSecondary }]}>
                {isRTL ? 'جاري رفع الفيديو...' : 'Uploading video...'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {renderAttachmentMenu()}
      {renderImagePreview()}
      
      {/* GIF Picker Modal */}
      {onSendGif && (
        <GifPicker
          visible={showGifPicker}
          onClose={() => setShowGifPicker(false)}
          onSelectGif={(gifUrl, gifId) => {
            if (onSendGif) {
              onSendGif(gifUrl, gifId);
            }
          }}
          useGiphyAPI={useGiphyAPI}
          giphyApiKey={giphyApiKey}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 8,
    // paddingBottom handled dynamically with safe area insets
    // Removed borderTopWidth and borderTopColor - no grey border
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
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    flex: 0.8, // 80% of width
    position: 'relative',
  },
  input: {
    width: '100%',
    borderRadius: 24, // Pill shape - WhatsApp-like
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100, // ~4 lines (25px per line) - WhatsApp-like growth
    fontSize: 15,
    minHeight: 40,
    textAlignVertical: 'center', // Center text vertically
    lineHeight: 20,
  },
  inputEndButton: {
    position: 'absolute',
    right: 6, // Always at the right end
    top: 6, // Slightly down (was 4, now 6 - moved down 2px)
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 31, // Increased by 3px (was 28)
    height: 31, // Increased by 3px (was 28)
    borderRadius: 15.5, // Half of width/height for perfect circle
    zIndex: 1, // Ensure it's above the input text
  },
  iconsContainer: {
    flex: 0.2, // 20% of width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingLeft: 4,
    paddingTop: 0, // Aligned with camera button center
  },
  iconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
    minHeight: 36,
    borderRadius: 18,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dualModeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
