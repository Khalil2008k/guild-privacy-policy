import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { useAuth } from '../../../contexts/AuthContext';
import ModalHeader from '../../components/ModalHeader';
import { jobService, Job } from '../../../services/jobService';
import { CheckCircle, AlertTriangle, Clock, DollarSign, FileText } from 'lucide-react-native';

export default function JobAcceptScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposedPrice, setProposedPrice] = useState('');
  const [timeline, setTimeline] = useState('');
  const [terms, setTerms] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    setLoading(true);
    try {
      if (!jobId) return;

      const jobData = await jobService.getJobById(jobId as string);
      if (jobData) {
        setJob(jobData);
        // Set default proposed price based on job budget
        if (jobData.budget) {
          setProposedPrice(jobData.budget.toString());
        }
      }
    } catch (error) {
      console.error('Error loading job:', error);
      CustomAlertService.showError('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async () => {
    if (!proposedPrice.trim() || !timeline.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields'
      );
      return;
    }

    setAccepting(true);
    try {
      if (!job || !user) return;

      // Create job offer
      const offerData = {
        price: parseFloat(proposedPrice),
        message: `I propose to complete this job for ${proposedPrice} QR within ${timeline}. ${terms ? 'Additional terms: ' + terms : ''}`,
        timeline,
        terms: terms || undefined
      };

      const offerId = await jobService.submitOffer(jobId as string, offerData);

      // Accept the offer immediately (for the flow)
      await jobService.acceptOffer(jobId as string, offerId);

      CustomAlertService.showSuccess(
        isRTL ? 'تم قبول الوظيفة' : 'Job Accepted',
        isRTL
          ? 'تم قبول عرضك وإنشاء العقد. يمكنك الآن بدء العمل.'
          : 'Your offer has been accepted and the contract created. You can now start working.',
        [
          {
            text: isRTL ? 'موافق' : 'OK',
            style: 'default',
            onPress: () => router.push('/(main)/jobs')
          }
        ]
      );
    } catch (error) {
      console.error('Error accepting job:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في قبول الوظيفة. يرجى المحاولة مرة أخرى.' : 'Failed to accept job. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {isRTL ? 'جارٍ التحميل...' : 'Loading job details...'}
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {isRTL ? 'الوظيفة غير موجودة' : 'Job not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <ModalHeader
        title={isRTL ? 'قبول الوظيفة' : 'Accept Job'}
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Summary */}
        <View style={[styles.jobSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.jobTitle, { color: theme.textPrimary }]}>
            {job.title}
          </Text>

          <View style={[styles.jobMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { backgroundColor: theme.primary + '15' }]}>
              <DollarSign size={16} color={theme.primary} />
              <Text style={[styles.metaText, { color: theme.primary }]}>
                {job.budget} QR
              </Text>
            </View>

            <View style={[styles.metaItem, { backgroundColor: theme.secondary + '15' }]}>
              <Clock size={16} color={theme.secondary} />
              <Text style={[styles.metaText, { color: theme.secondary }]}>
                {job.timeNeeded}
              </Text>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'شروط العقد' : 'Contract Terms'}
            </Text>
          </View>

          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            {isRTL
              ? 'عند قبول هذه الوظيفة، أنت توافق على:'
              : 'By accepting this job, you agree to:'
            }
          </Text>

          <View style={styles.termsList}>
            <Text style={[styles.termItem, { color: theme.textPrimary }]}>
              • {isRTL ? 'إكمال العمل حسب المواصفات المتفق عليها' : 'Complete work according to agreed specifications'}
            </Text>
            <Text style={[styles.termItem, { color: theme.textPrimary }]}>
              • {isRTL ? 'الالتزام بالمواعيد النهائية' : 'Meet agreed deadlines'}
            </Text>
            <Text style={[styles.termItem, { color: theme.textPrimary }]}>
              • {isRTL ? 'التواصل المنتظم مع العميل' : 'Maintain regular communication with client'}
            </Text>
            <Text style={[styles.termItem, { color: theme.textPrimary }]}>
              • {isRTL ? 'تسليم العمل عالي الجودة' : 'Deliver high-quality work'}
            </Text>
          </View>
        </View>

        {/* Proposal Form */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'عرضك' : 'Your Proposal'}
          </Text>

          {/* Proposed Price */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'السعر المقترح (QR)' : 'Proposed Price (QR)'} *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              placeholder={isRTL ? 'أدخل السعر المقترح' : 'Enter proposed price'}
              placeholderTextColor={theme.textSecondary}
              value={proposedPrice}
              onChangeText={setProposedPrice}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* Timeline */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'الجدول الزمني' : 'Timeline'} *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              placeholder={isRTL ? 'مثال: 3-5 أيام' : 'e.g., 3-5 days'}
              placeholderTextColor={theme.textSecondary}
              value={timeline}
              onChangeText={setTimeline}
              returnKeyType="next"
            />
          </View>

          {/* Additional Terms */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'شروط إضافية (اختيارية)' : 'Additional Terms (Optional)'}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              placeholder={isRTL ? 'أي شروط إضافية...' : 'Any additional terms...'}
              placeholderTextColor={theme.textSecondary}
              value={terms}
              onChangeText={setTerms}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Important Notes */}
        <View style={[styles.notesSection, { backgroundColor: theme.warning + '10', borderColor: theme.warning }]}>
          <AlertTriangle size={20} color={theme.warning} />
          <Text style={[styles.notesTitle, { color: theme.warning }]}>
            {isRTL ? 'ملاحظات مهمة' : 'Important Notes'}
          </Text>
          <Text style={[styles.notesText, { color: theme.textSecondary }]}>
            {isRTL
              ? '• سيتم إنشاء العقد تلقائياً عند القبول'
              : '• Contract will be created automatically upon acceptance'
            }
          </Text>
          <Text style={[styles.notesText, { color: theme.textSecondary }]}>
            {isRTL
              ? '• ستحصل على الدفع بعد إكمال العمل'
              : '• Payment will be released after work completion'
            }
          </Text>
          <Text style={[styles.notesText, { color: theme.textSecondary }]}>
            {isRTL
              ? '• يمكنك طلب تعديل العقد في أي وقت'
              : '• You can request contract modifications anytime'
            }
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.error + '20' }]}
          onPress={() => router.back()}
          disabled={accepting}
        >
          <Text style={[styles.cancelButtonText, { color: theme.error }]}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.acceptButton,
            {
              backgroundColor: accepting ? theme.border : theme.success,
            }
          ]}
          onPress={handleAcceptJob}
          disabled={accepting}
        >
          <CheckCircle size={20} color={theme.buttonText} />
          <Text style={[styles.acceptButtonText, { color: theme.buttonText }]}>
            {accepting
              ? (isRTL ? 'جارٍ القبول...' : 'Accepting...')
              : (isRTL ? 'قبول الوظيفة' : 'Accept Job')
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  jobSummary: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 14,
    marginBottom: 12,
  },
  termsList: {
    gap: 8,
  },
  termItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 80,
  },
  notesSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

