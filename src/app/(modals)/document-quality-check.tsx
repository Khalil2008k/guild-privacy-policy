import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle, Upload, Eye, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';

interface DocumentCheck {
  id: string;
  type: 'national_id' | 'passport' | 'driving_license' | 'utility_bill' | 'bank_statement';
  name: string;
  status: 'pending' | 'checking' | 'approved' | 'rejected' | 'retry_required';
  imageUri?: string;
  uploadedAt?: Date;
  checkedAt?: Date;
  qualityScore?: number;
  issues?: string[];
  feedback?: string;
}

interface QualityCheckResult {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  checks: {
    blur: { passed: boolean; score: number; message: string };
    lighting: { passed: boolean; score: number; message: string };
    completeness: { passed: boolean; score: number; message: string };
    readability: { passed: boolean; score: number; message: string };
    authenticity: { passed: boolean; score: number; message: string };
  };
  recommendations: string[];
}

export default function DocumentQualityCheckScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // State
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentCheck[]>([
    {
      id: 'national_id',
      type: 'national_id',
      name: 'National ID',
      status: 'pending',
    },
    {
      id: 'passport',
      type: 'passport',
      name: 'Passport',
      status: 'pending',
    },
    {
      id: 'utility_bill',
      type: 'utility_bill',
      name: 'Utility Bill',
      status: 'pending',
    },
  ]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentCheck | null>(null);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityCheckResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock quality check function
  const performQualityCheck = async (document: DocumentCheck): Promise<QualityCheckResult> => {
    // Simulate quality analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate random quality scores for demo
    const blurScore = Math.random() * 100;
    const lightingScore = Math.random() * 100;
    const completenessScore = Math.random() * 100;
    const readabilityScore = Math.random() * 100;
    const authenticityScore = Math.random() * 100;

    const averageScore = (blurScore + lightingScore + completenessScore + readabilityScore + authenticityScore) / 5;

    const result: QualityCheckResult = {
      overall: averageScore >= 80 ? 'excellent' : averageScore >= 60 ? 'good' : averageScore >= 40 ? 'fair' : 'poor',
      score: Math.round(averageScore),
      checks: {
        blur: {
          passed: blurScore >= 60,
          score: Math.round(blurScore),
          message: blurScore >= 60 ? 'Image is sharp and clear' : 'Image appears blurry or out of focus'
        },
        lighting: {
          passed: lightingScore >= 60,
          score: Math.round(lightingScore),
          message: lightingScore >= 60 ? 'Good lighting conditions' : 'Poor lighting or shadows detected'
        },
        completeness: {
          passed: completenessScore >= 60,
          score: Math.round(completenessScore),
          message: completenessScore >= 60 ? 'All document edges visible' : 'Document appears cropped or incomplete'
        },
        readability: {
          passed: readabilityScore >= 60,
          score: Math.round(readabilityScore),
          message: readabilityScore >= 60 ? 'Text is clearly readable' : 'Text is difficult to read or unclear'
        },
        authenticity: {
          passed: authenticityScore >= 60,
          score: Math.round(authenticityScore),
          message: authenticityScore >= 60 ? 'Document appears authentic' : 'Potential authenticity concerns detected'
        }
      },
      recommendations: []
    };

    // Add recommendations based on failed checks
    if (!result.checks.blur.passed) {
      result.recommendations.push('Hold the camera steady and ensure the document is in focus');
    }
    if (!result.checks.lighting.passed) {
      result.recommendations.push('Take the photo in good lighting conditions, avoid shadows');
    }
    if (!result.checks.completeness.passed) {
      result.recommendations.push('Ensure all edges of the document are visible in the frame');
    }
    if (!result.checks.readability.passed) {
      result.recommendations.push('Make sure all text on the document is clearly visible');
    }
    if (!result.checks.authenticity.passed) {
      result.recommendations.push('Ensure the document is original and not a photocopy');
    }

    return result;
  };

  // Handle document upload
  const handleUploadDocument = async (document: DocumentCheck) => {
    try {
      setSelectedDocument(document);
      setLoading(true);
      setUploadProgress(0);

      // Simulate file upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Wait for upload to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update document with mock image
      const updatedDocument = {
        ...document,
        status: 'checking' as const,
        imageUri: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Document+Image',
        uploadedAt: new Date(),
      };

      setDocuments(prev => prev.map(doc => 
        doc.id === document.id ? updatedDocument : doc
      ));

      // Perform quality check
      const result = await performQualityCheck(updatedDocument);
      setQualityResult(result);

      // Update document status based on quality check
      const finalStatus = result.overall === 'poor' ? 'retry_required' : 
                         result.overall === 'fair' ? 'rejected' : 'approved';

      const finalDocument = {
        ...updatedDocument,
        status: finalStatus,
        qualityScore: result.score,
        checkedAt: new Date(),
        issues: Object.entries(result.checks)
          .filter(([_, check]) => !check.passed)
          .map(([key, check]) => check.message),
        feedback: result.recommendations.join('. ')
      };

      setDocuments(prev => prev.map(doc => 
        doc.id === document.id ? finalDocument : doc
      ));

      setShowQualityModal(true);

    } catch (error) {
      console.error('Error uploading document:', error);
      showAlert(
        'Upload Error',
        'Failed to upload document. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle retry upload
  const handleRetryUpload = (document: DocumentCheck) => {
    const resetDocument = {
      ...document,
      status: 'pending' as const,
      imageUri: undefined,
      uploadedAt: undefined,
      checkedAt: undefined,
      qualityScore: undefined,
      issues: undefined,
      feedback: undefined,
    };

    setDocuments(prev => prev.map(doc => 
      doc.id === document.id ? resetDocument : doc
    ));

    handleUploadDocument(resetDocument);
  };

  // Get status color
  const getStatusColor = (status: DocumentCheck['status']) => {
    switch (status) {
      case 'approved': return theme.success;
      case 'rejected': return theme.error;
      case 'retry_required': return theme.warning;
      case 'checking': return theme.info;
      default: return theme.textSecondary;
    }
  };

  // Get status icon
  const getStatusIcon = (status: DocumentCheck['status']) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'retry_required': return 'warning';
      case 'checking': return 'time';
      default: return 'document-outline';
    }
  };

  // Get quality color
  const getQualityColor = (overall: string) => {
    switch (overall) {
      case 'excellent': return theme.success;
      case 'good': return theme.info;
      case 'fair': return theme.warning;
      case 'poor': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
    },
    description: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      marginBottom: 16,
    },
    documentCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    documentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    documentIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    documentStatus: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      marginLeft: 4,
    },
    documentImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      marginBottom: 12,
    },
    qualityScore: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    qualityText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
    },
    issuesList: {
      marginBottom: 12,
    },
    issueItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    issueText: {
      fontSize: 13,
      color: theme.error,
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
      flex: 1,
    },
    documentActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 6,
    },
    actionButtonTextSecondary: {
      color: theme.textPrimary,
    },
    progressContainer: {
      marginBottom: 12,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
    },
    progressText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    qualityOverall: {
      alignItems: 'center',
      marginBottom: 20,
    },
    qualityScoreCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    qualityScoreText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      fontFamily: FONT_FAMILY,
    },
    qualityLabel: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    checksContainer: {
      marginBottom: 20,
    },
    checksTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
    },
    checkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      padding: 8,
      backgroundColor: theme.background,
      borderRadius: 8,
    },
    checkInfo: {
      flex: 1,
      marginLeft: 8,
    },
    checkName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    checkMessage: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginTop: 2,
    },
    checkScore: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    recommendationsContainer: {
      marginBottom: 20,
    },
    recommendationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
    },
    recommendationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    recommendationText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
      flex: 1,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    modalButtonTextSecondary: {
      color: theme.textPrimary,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Document Quality Check',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KYC Document Verification</Text>
          <Text style={styles.description}>
            Upload your identity documents for verification. Our system will automatically check the quality and authenticity of your documents to ensure they meet KYC compliance standards.
          </Text>
        </View>

        {/* Documents List */}
        <View style={styles.section}>
          {documents.map((document) => (
            <View key={document.id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentIcon}>
                  <Ionicons 
                    name="document-text-outline" 
                    size={20} 
                    color={theme.primary} 
                  />
                </View>
                
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{document.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(document.status) + '20' }]}>
                    <Ionicons 
                      name={getStatusIcon(document.status)} 
                      size={12} 
                      color={getStatusColor(document.status)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(document.status) }]}>
                      {document.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Upload Progress */}
              {loading && selectedDocument?.id === document.id && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
                </View>
              )}

              {/* Document Image */}
              {document.imageUri && (
                <Image source={{ uri: document.imageUri }} style={styles.documentImage} />
              )}

              {/* Quality Score */}
              {document.qualityScore && (
                <View style={styles.qualityScore}>
                  <MaterialIcons 
                    name="assessment" 
                    size={16} 
                    color={getStatusColor(document.status)} 
                  />
                  <Text style={[styles.qualityText, { color: getStatusColor(document.status) }]}>
                    Quality Score: {document.qualityScore}%
                  </Text>
                </View>
              )}

              {/* Issues List */}
              {document.issues && document.issues.length > 0 && (
                <View style={styles.issuesList}>
                  {document.issues.map((issue, index) => (
                    <View key={index} style={styles.issueItem}>
                      <Ionicons name="warning" size={12} color={theme.error} />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.documentActions}>
                {document.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleUploadDocument(document)}
                    disabled={loading}
                  >
                    {loading && selectedDocument?.id === document.id ? (
                      <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
                    ) : (
                      <Ionicons name="camera" size={16} color={getContrastTextColor(theme.primary)} />
                    )}
                    <Text style={styles.actionButtonText}>
                      {loading && selectedDocument?.id === document.id ? 'Uploading...' : 'Upload Document'}
                    </Text>
                  </TouchableOpacity>
                )}

                {(document.status === 'retry_required' || document.status === 'rejected') && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRetryUpload(document)}
                    disabled={loading}
                  >
                    <Ionicons name="refresh" size={16} color={getContrastTextColor(theme.primary)} />
                    <Text style={styles.actionButtonText}>Retry Upload</Text>
                  </TouchableOpacity>
                )}

                {document.status === 'approved' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleRetryUpload(document)}
                  >
                    <Ionicons name="refresh" size={16} color={theme.textPrimary} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      Re-upload
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Quality Check Modal */}
      <Modal
        visible={showQualityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQualityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quality Check Results</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQualityModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {qualityResult && (
                <>
                  {/* Overall Quality */}
                  <View style={styles.qualityOverall}>
                    <View style={[
                      styles.qualityScoreCircle,
                      { backgroundColor: getQualityColor(qualityResult.overall) }
                    ]}>
                      <Text style={styles.qualityScoreText}>{qualityResult.score}</Text>
                    </View>
                    <Text style={[styles.qualityLabel, { color: getQualityColor(qualityResult.overall) }]}>
                      {qualityResult.overall}
                    </Text>
                  </View>

                  {/* Individual Checks */}
                  <View style={styles.checksContainer}>
                    <Text style={styles.checksTitle}>Quality Checks</Text>
                    {Object.entries(qualityResult.checks).map(([key, check]) => (
                      <View key={key} style={styles.checkItem}>
                        <Ionicons
                          name={check.passed ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={check.passed ? theme.success : theme.error}
                        />
                        <View style={styles.checkInfo}>
                          <Text style={styles.checkName}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Text>
                          <Text style={styles.checkMessage}>{check.message}</Text>
                        </View>
                        <Text style={[
                          styles.checkScore,
                          { color: check.passed ? theme.success : theme.error }
                        ]}>
                          {check.score}%
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Recommendations */}
                  {qualityResult.recommendations.length > 0 && (
                    <View style={styles.recommendationsContainer}>
                      <Text style={styles.recommendationsTitle}>Recommendations</Text>
                      {qualityResult.recommendations.map((recommendation, index) => (
                        <View key={index} style={styles.recommendationItem}>
                          <Ionicons name="bulb-outline" size={14} color={theme.warning} />
                          <Text style={styles.recommendationText}>{recommendation}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowQualityModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertComponent />
    </View>
  );
}
