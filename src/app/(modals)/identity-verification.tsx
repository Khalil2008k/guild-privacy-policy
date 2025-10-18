import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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

const FONT_FAMILY = 'Signika Negative SC';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
  icon: string;
  documents?: VerificationDocument[];
}

interface VerificationDocument {
  id: string;
  type: 'government_id' | 'selfie' | 'address_proof' | 'bank_statement';
  name: string;
  uri: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export default function IdentityVerificationScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);

  // Mock verification data
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: 'email',
      title: isRTL ? 'التحقق من البريد الإلكتروني' : 'Email Verification',
      description: isRTL ? 'تأكيد عنوان البريد الإلكتروني الخاص بك' : 'Confirm your email address',
      status: 'completed',
      required: true,
      icon: 'mail-outline',
    },
    {
      id: 'phone',
      title: isRTL ? 'التحقق من رقم الهاتف' : 'Phone Verification',
      description: isRTL ? 'تأكيد رقم هاتفك المحمول' : 'Confirm your mobile phone number',
      status: 'completed',
      required: true,
      icon: 'call-outline',
    },
    {
      id: 'government_id',
      title: isRTL ? 'الهوية الحكومية' : 'Government ID',
      description: isRTL ? 'رفع صورة من الهوية الحكومية أو جواز السفر' : 'Upload government ID or passport photo',
      status: 'in_progress',
      required: true,
      icon: 'card-outline',
      documents: [
        {
          id: 'doc_1',
          type: 'government_id',
          name: 'Qatar_ID_Front.jpg',
          uri: 'file://mock-image-1.jpg',
          uploadedAt: '2025-09-19',
          status: 'pending',
        }
      ],
    },
    {
      id: 'selfie',
      title: isRTL ? 'صورة شخصية' : 'Selfie Verification',
      description: isRTL ? 'التقاط صورة شخصية للتحقق من الهوية' : 'Take a selfie for identity verification',
      status: 'pending',
      required: true,
      icon: 'camera-outline',
    },
    {
      id: 'biometric',
      title: isRTL ? 'التحقق البيومتري' : 'Biometric Verification',
      description: isRTL ? 'مسح بصمة الإصبع أو الوجه' : 'Fingerprint or facial recognition scan',
      status: 'pending',
      required: false,
      icon: 'finger-print-outline',
    },
    {
      id: 'address',
      title: isRTL ? 'إثبات العنوان' : 'Address Proof',
      description: isRTL ? 'رفع مستند يثبت عنوان الإقامة' : 'Upload document proving residential address',
      status: 'pending',
      required: false,
      icon: 'home-outline',
    },
    {
      id: 'bank_verification',
      title: isRTL ? 'التحقق المصرفي' : 'Bank Verification',
      description: isRTL ? 'ربط حساب مصرفي للمدفوعات' : 'Link bank account for payments',
      status: 'pending',
      required: false,
      icon: 'card-outline',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.success;
      case 'in_progress': return theme.warning;
      case 'failed': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'time';
      case 'failed': return 'close-circle';
      default: return 'ellipse-outline';
    }
  };

  const getVerificationLevel = () => {
    const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
    const totalSteps = verificationSteps.length;
    const percentage = (completedSteps / totalSteps) * 100;
    
    if (percentage >= 85) return { level: 'Full', color: theme.success, icon: 'shield-checkmark' };
    if (percentage >= 60) return { level: 'Advanced', color: theme.info, icon: 'shield' };
    if (percentage >= 40) return { level: 'Basic', color: theme.warning, icon: 'shield-outline' };
    return { level: 'Minimal', color: theme.error, icon: 'alert-circle' };
  };

  const handleDocumentUpload = async (stepId: string, documentType: 'camera' | 'gallery' | 'file') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      let result;
      
      if (documentType === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          CustomAlertService.showError(
            isRTL ? 'إذن مطلوب' : 'Permission Required',
            isRTL ? 'نحتاج إذن الوصول للكاميرا' : 'We need camera access permission'
          );
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaType.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else if (documentType === 'gallery') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Document uploaded:', asset);
        
        // Update verification step
        setVerificationSteps(prev => prev.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              status: 'in_progress',
              documents: [
                ...(step.documents || []),
                {
                  id: Date.now().toString(),
                  type: stepId as any,
                  name: asset.name || 'Document',
                  uri: asset.uri,
                  uploadedAt: new Date().toISOString().split('T')[0],
                  status: 'pending',
                }
              ]
            };
          }
          return step;
        }));
        
        CustomAlertService.showSuccess(
          isRTL ? 'تم الرفع' : 'Upload Successful',
          isRTL ? 'تم رفع المستند بنجاح وسيتم مراجعته قريباً' : 'Document uploaded successfully and will be reviewed soon'
        );
      }
    } catch (error) {
      console.error('Document upload error:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ في الرفع' : 'Upload Error',
        isRTL ? 'حدث خطأ أثناء رفع المستند' : 'An error occurred while uploading the document'
      );
    }
    
    setShowDocumentModal(false);
  };

  const handleBiometricVerification = (type: 'fingerprint' | 'face') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    CustomAlertService.showConfirmation(
      isRTL ? 'التحقق البيومتري' : 'Biometric Verification',
      isRTL ? `سيتم بدء عملية مسح ${type === 'fingerprint' ? 'بصمة الإصبع' : 'الوجه'}` : `${type === 'fingerprint' ? 'Fingerprint' : 'Face'} scanning will begin`,
      () => {
        // Simulate biometric verification
        setTimeout(() => {
          setVerificationSteps(prev => prev.map(step => {
            if (step.id === 'biometric') {
              return { ...step, status: 'completed' };
            }
            return step;
          }));
          
          CustomAlertService.showSuccess(
            isRTL ? 'تم التحقق' : 'Verification Complete',
            isRTL ? 'تم التحقق البيومتري بنجاح' : 'Biometric verification completed successfully'
          );
        }, 2000);
      },
      undefined,
      isRTL
    );
    
    setShowBiometricModal(false);
  };

  const verificationLevel = getVerificationLevel();
  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = verificationSteps.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'CC']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="shield-checkmark" size={28} color="#000000" />
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {isRTL ? 'التحقق من الهوية' : 'Identity Verification'}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: '#000000CC' }]}>
            {isRTL ? 'تأمين حسابك وزيادة الثقة' : 'Secure Your Account & Build Trust'}
          </Text>
        </View>
        
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Verification Level Card */}
      <View style={[styles.levelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <View style={styles.levelIconContainer}>
              <Ionicons name={verificationLevel.icon as any} size={32} color={verificationLevel.color} />
            </View>
            <View>
              <Text style={[styles.levelTitle, { color: theme.textPrimary }]}>
                {isRTL ? 'مستوى التحقق:' : 'Verification Level:'}
              </Text>
              <Text style={[styles.levelValue, { color: verificationLevel.color }]}>
                {verificationLevel.level} {isRTL ? 'التحقق' : 'Verification'}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {completedSteps}/{totalSteps}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: verificationLevel.color,
                    width: `${(completedSteps / totalSteps) * 100}%`
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        <Text style={[styles.levelDescription, { color: theme.textSecondary }]}>
          {isRTL 
            ? 'كلما زاد مستوى التحقق، زادت الثقة والوصول لفرص أفضل'
            : 'Higher verification levels increase trust and access to better opportunities'
          }
        </Text>
      </View>

      {/* Verification Steps */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {verificationSteps.map((step, index) => (
          <View key={step.id} style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepInfo}>
                <View style={[
                  styles.stepIconContainer,
                  { backgroundColor: getStatusColor(step.status) + '20' }
                ]}>
                  <Ionicons name={step.icon as any} size={24} color={getStatusColor(step.status)} />
                </View>
                
                <View style={styles.stepDetails}>
                  <View style={styles.stepTitleRow}>
                    <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
                      {step.title}
                    </Text>
                    {step.required && (
                      <View style={[styles.requiredBadge, { backgroundColor: theme.error + '20' }]}>
                        <Text style={[styles.requiredText, { color: theme.error }]}>
                          {isRTL ? 'مطلوب' : 'Required'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                    {step.description}
                  </Text>
                </View>
              </View>

              <View style={styles.stepStatus}>
                <Ionicons 
                  name={getStatusIcon(step.status) as any} 
                  size={24} 
                  color={getStatusColor(step.status)} 
                />
              </View>
            </View>

            {/* Documents */}
            {step.documents && step.documents.length > 0 && (
              <View style={[styles.documentsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.documentsTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'المستندات المرفوعة' : 'Uploaded Documents'}
                </Text>
                {step.documents.map((doc) => (
                  <View key={doc.id} style={styles.documentItem}>
                    <View style={styles.documentInfo}>
                      <Ionicons name="document-outline" size={16} color={theme.textSecondary} />
                      <Text style={[styles.documentName, { color: theme.textPrimary }]}>
                        {doc.name}
                      </Text>
                    </View>
                    <View style={[
                      styles.documentStatus,
                      { backgroundColor: getStatusColor(doc.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.documentStatusText,
                        { color: getStatusColor(doc.status) }
                      ]}>
                        {doc.status === 'pending' ? (isRTL ? 'قيد المراجعة' : 'Pending') :
                         doc.status === 'approved' ? (isRTL ? 'موافق عليه' : 'Approved') :
                         (isRTL ? 'مرفوض' : 'Rejected')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.stepActions}>
              {step.status === 'pending' && (
                <>
                  {(step.id === 'government_id' || step.id === 'selfie' || step.id === 'address') && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.primary }]}
                      onPress={() => {
                        setSelectedStep(step.id);
                        setShowDocumentModal(true);
                      }}
                    >
                      <Ionicons name="cloud-upload" size={16} color="#000000" />
                      <Text style={[styles.actionButtonText, { color: '#000000' }]}>
                        {isRTL ? 'رفع مستند' : 'Upload Document'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {step.id === 'biometric' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.info }]}
                      onPress={() => setShowBiometricModal(true)}
                    >
                      <Ionicons name="finger-print" size={16} color="#000000" />
                      <Text style={[styles.actionButtonText, { color: '#000000' }]}>
                        {isRTL ? 'بدء المسح' : 'Start Scan'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {step.id === 'bank_verification' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.success }]}
                      onPress={() => {
                        CustomAlertService.showError(
                          isRTL ? 'ربط الحساب المصرفي' : 'Link Bank Account',
                          isRTL ? 'سيتم توجيهك لربط حسابك المصرفي' : 'You will be directed to link your bank account'
                        );
                      }}
                    >
                      <Ionicons name="card" size={16} color="#000000" />
                      <Text style={[styles.actionButtonText, { color: '#000000' }]}>
                        {isRTL ? 'ربط الحساب' : 'Link Account'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              {step.status === 'in_progress' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning, borderWidth: 1 }]}
                  onPress={() => {
                    CustomAlertService.showError(
                      isRTL ? 'قيد المراجعة' : 'Under Review',
                      isRTL ? 'مستندك قيد المراجعة، سنخبرك بالنتيجة قريباً' : 'Your document is under review, we will notify you of the result soon'
                    );
                  }}
                >
                  <Ionicons name="time" size={16} color={theme.warning} />
                  <Text style={[styles.actionButtonText, { color: theme.warning }]}>
                    {isRTL ? 'قيد المراجعة' : 'Under Review'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {step.status === 'completed' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.success + '20', borderColor: theme.success, borderWidth: 1 }]}
                  disabled
                >
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[styles.actionButtonText, { color: theme.success }]}>
                    {isRTL ? 'مكتمل' : 'Completed'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {step.status === 'failed' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.error + '20', borderColor: theme.error, borderWidth: 1 }]}
                  onPress={() => {
                    CustomAlertService.showConfirmation(
                      isRTL ? 'إعادة المحاولة' : 'Retry Verification',
                      isRTL ? 'هل تريد إعادة محاولة التحقق؟' : 'Do you want to retry verification?',
                      () => console.log('Retry verification'),
                      undefined,
                      isRTL
                    );
                  }}
                >
                  <Ionicons name="refresh" size={16} color={theme.error} />
                  <Text style={[styles.actionButtonText, { color: theme.error }]}>
                    {isRTL ? 'إعادة المحاولة' : 'Retry'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* Document Upload Modal */}
      <Modal
        visible={showDocumentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.documentModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'رفع مستند' : 'Upload Document'}
            </Text>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              {isRTL ? 'اختر طريقة رفع المستند' : 'Choose how to upload your document'}
            </Text>
            
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={[styles.uploadOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => handleDocumentUpload(selectedStep!, 'camera')}
              >
                <Ionicons name="camera" size={32} color={theme.primary} />
                <Text style={[styles.uploadOptionText, { color: theme.textPrimary }]}>
                  {isRTL ? 'التقاط صورة' : 'Take Photo'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uploadOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => handleDocumentUpload(selectedStep!, 'gallery')}
              >
                <Ionicons name="images" size={32} color={theme.info} />
                <Text style={[styles.uploadOptionText, { color: theme.textPrimary }]}>
                  {isRTL ? 'من المعرض' : 'From Gallery'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uploadOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => handleDocumentUpload(selectedStep!, 'file')}
              >
                <Ionicons name="document" size={32} color={theme.success} />
                <Text style={[styles.uploadOptionText, { color: theme.textPrimary }]}>
                  {isRTL ? 'ملف PDF' : 'PDF File'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => setShowDocumentModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Biometric Verification Modal */}
      <Modal
        visible={showBiometricModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBiometricModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.biometricModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'التحقق البيومتري' : 'Biometric Verification'}
            </Text>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              {isRTL ? 'اختر نوع التحقق البيومتري' : 'Choose biometric verification type'}
            </Text>
            
            <View style={styles.biometricOptions}>
              <TouchableOpacity
                style={[styles.biometricOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => handleBiometricVerification('fingerprint')}
              >
                <Ionicons name="finger-print" size={48} color={theme.primary} />
                <Text style={[styles.biometricOptionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'بصمة الإصبع' : 'Fingerprint'}
                </Text>
                <Text style={[styles.biometricOptionDesc, { color: theme.textSecondary }]}>
                  {isRTL ? 'مسح بصمة الإصبع' : 'Scan your fingerprint'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.biometricOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => handleBiometricVerification('face')}
              >
                <Ionicons name="scan" size={48} color={theme.info} />
                <Text style={[styles.biometricOptionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'مسح الوجه' : 'Face Scan'}
                </Text>
                <Text style={[styles.biometricOptionDesc, { color: theme.textSecondary }]}>
                  {isRTL ? 'مسح ملامح الوجه' : 'Scan your facial features'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => setShowBiometricModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  levelCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  levelIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  levelValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  progressText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    width: 100,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  stepCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDetails: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  stepTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
  },
  stepDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
  },
  stepStatus: {
    marginLeft: 16,
  },
  documentsContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  documentsTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  documentName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  documentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentStatusText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  stepActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentModal: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  biometricModal: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  uploadOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  uploadOptionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  biometricOptions: {
    gap: 16,
    marginBottom: 24,
  },
  biometricOption: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  biometricOptionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  biometricOptionDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
});