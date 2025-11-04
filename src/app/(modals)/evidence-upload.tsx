import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Upload, Camera, FileText, Image as ImageIcon, Trash2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BackendAPI } from '../../config/backend';

const FONT_FAMILY = 'Signika Negative SC';

// Lazy load native modules to avoid import errors
const DocumentPicker = {
  getDocumentAsync: async (...args: any[]) => {
    const module = await import('expo-document-picker');
    return module.getDocumentAsync(...args);
  }
};

const ImagePicker = {
  launchImageLibraryAsync: async (...args: any[]) => {
    const module = await import('expo-image-picker');
    return module.launchImageLibraryAsync(...args);
  },
  requestCameraPermissionsAsync: async () => {
    const module = await import('expo-image-picker');
    return module.requestCameraPermissionsAsync();
  },
  launchCameraAsync: async (...args: any[]) => {
    const module = await import('expo-image-picker');
    return module.launchCameraAsync(...args);
  },
  MediaType: {
    Images: 'Images' as const
  }
};

interface EvidenceFile {
  id: string;
  name: string;
  type: 'image' | 'document';
  uri: string;
  size?: number;
}

export default function EvidenceUploadScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { disputeId } = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newFile: EvidenceFile = {
          id: Date.now().toString(),
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image',
          uri: asset.uri,
          size: asset.fileSize,
        };
        setEvidence(prev => [...prev, newFile]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل في اختيار الصورة' : 'Failed to pick image');
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newFile: EvidenceFile = {
          id: Date.now().toString(),
          name: asset.name,
          type: 'document',
          uri: asset.uri,
          size: asset.size,
        };
        setEvidence(prev => [...prev, newFile]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل في اختيار المستند' : 'Failed to pick document');
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setEvidence(prev => prev.filter(file => file.id !== fileId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleUpload = async () => {
    if (evidence.length === 0) {
      CustomAlertService.showInfo(isRTL ? 'تنبيه' : 'Warning', isRTL ? 'يرجى إضافة ملف واحد على الأقل' : 'Please add at least one file');
      return;
    }

    setUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Upload files to backend
      const uploadPromises = evidence.map(async (file) => {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.type === 'image' ? 'image/jpeg' : 'application/pdf',
          name: file.name,
        } as any);
        formData.append('disputeId', disputeId as string);
        formData.append('fileType', file.type);

        return BackendAPI.post('/guild-court/evidence/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      });

      await Promise.all(uploadPromises);

      CustomAlertService.showSuccess(
        isRTL ? 'تم بنجاح' : 'Success',
        isRTL ? 'تم رفع الأدلة بنجاح' : 'Evidence uploaded successfully',
        [
          {
            text: isRTL ? 'موافق' : 'OK',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log('Failed to upload evidence:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في رفع الأدلة. يرجى المحاولة مرة أخرى.' : 'Failed to upload evidence. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <MaterialIcons name="cloud-upload" size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'رفع الأدلة' : 'Upload Evidence'}
          </Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="information-circle" size={24} color={theme.info} />
          <View style={styles.instructionsContent}>
            <Text style={[styles.instructionsTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'إرشادات رفع الأدلة' : 'Evidence Upload Guidelines'}
            </Text>
            <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
              {isRTL 
                ? '• ارفع المستندات والصور التي تدعم قضيتك\n• الحد الأقصى لحجم الملف: 10 ميجابايت\n• الصيغ المدعومة: PDF, JPG, PNG, DOC'
                : '• Upload documents and images that support your case\n• Maximum file size: 10 MB\n• Supported formats: PDF, JPG, PNG, DOC'
              }
            </Text>
          </View>
        </View>

        {/* Upload Options */}
        <View style={[styles.uploadSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'إضافة ملفات' : 'Add Files'}
          </Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={handleImagePicker}
            >
              <Ionicons name="camera" size={24} color={theme.primary} />
              <Text style={[styles.uploadButtonText, { color: theme.primary }]}>
                {isRTL ? 'صورة' : 'Image'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.info + '20', borderColor: theme.info }]}
              onPress={handleDocumentPicker}
            >
              <Ionicons name="document-text" size={24} color={theme.info} />
              <Text style={[styles.uploadButtonText, { color: theme.info }]}>
                {isRTL ? 'مستند' : 'Document'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Evidence List */}
        {evidence.length > 0 && (
          <View style={[styles.evidenceSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'الملفات المرفوعة' : 'Uploaded Files'} ({evidence.length})
            </Text>
            
            {evidence.map((file) => (
              <View key={file.id} style={[styles.evidenceItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.evidenceInfo}>
                  {file.type === 'image' ? (
                    <Image source={{ uri: file.uri }} style={styles.evidencePreview} />
                  ) : (
                    <View style={[styles.documentIcon, { backgroundColor: theme.info + '20' }]}>
                      <Ionicons name="document-text" size={24} color={theme.info} />
                    </View>
                  )}
                  
                  <View style={styles.evidenceDetails}>
                    <Text style={[styles.evidenceName, { color: theme.textPrimary }]} numberOfLines={2}>
                      {file.name}
                    </Text>
                    <Text style={[styles.evidenceSize, { color: theme.textSecondary }]}>
                      {formatFileSize(file.size)}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: theme.error + '20' }]}
                  onPress={() => handleRemoveFile(file.id)}
                >
                  <Ionicons name="trash" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: evidence.length > 0 ? 1 : 0.5 }]}
          onPress={handleUpload}
          disabled={uploading || evidence.length === 0}
        >
          <LinearGradient
            colors={[theme.primary, theme.primary + 'CC']}
            style={styles.submitGradient}
          >
            {uploading ? (
              <Text style={[styles.submitButtonText, { color: '#000000' }]}>
                {isRTL ? 'جاري الرفع...' : 'Uploading...'}
              </Text>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#000000" />
                <Text style={[styles.submitButtonText, { color: '#000000' }]}>
                  {isRTL ? 'رفع الأدلة' : 'Upload Evidence'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  uploadSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 16,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  evidenceSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  evidenceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  evidencePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  documentIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceDetails: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 2,
  },
  evidenceSize: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});
