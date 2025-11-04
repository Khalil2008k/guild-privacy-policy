import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import CoinEscrowService from '../../services/CoinEscrowService';
import { jobService, Job } from '../../services/jobService';
import { AlertTriangle, FileText, ArrowLeft, ArrowRight, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CustomAlertService } from '../../services/CustomAlertService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

export default function JobDisputeScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { jobId, escrowId } = useLocalSearchParams();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      if (jobId) {
        const jobData = await jobService.getJob(jobId as string);
        setJob(jobData);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading job:', error);
      CustomAlertService.showError(t('error'), 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!job || !user || !escrowId) return;

    if (!disputeReason.trim()) {
      CustomAlertService.showError(
        t('error'),
        isRTL ? 'يرجى وصف سبب النزاع' : 'Please describe the reason for dispute'
      );
      return;
    }

    // Determine who is raising the dispute
    const raisedBy = user.uid === job.clientId ? 'client' : 'freelancer';

    Alert.alert(
      t('confirmDispute'),
      isRTL
        ? 'سيتم إرسال النزاع إلى فريق الإدارة للمراجعة. لن يتم توزيع العملات حتى يتم حل النزاع. هل أنت متأكد؟'
        : 'The dispute will be sent to the admin team for review. Coins will not be distributed until the dispute is resolved. Are you sure?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('raiseDispute'),
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

              const result = await CoinEscrowService.raiseDispute({
                escrowId: escrowId as string,
                raisedBy: raisedBy as 'client' | 'freelancer',
                reason: disputeReason.trim(),
                evidence: [] // TODO: Add evidence upload support
              });

              if (result.success) {
                // Update job status to disputed
                await jobService.updateJobStatus(job.id, 'disputed');

                CustomAlertService.showSuccess(
                  t('disputeRaised'),
                  isRTL
                    ? 'تم رفع النزاع بنجاح. سيقوم فريق الإدارة بمراجعته قريباً.'
                    : 'Dispute raised successfully. The admin team will review it soon.'
                );

                router.back();
              } else {
                throw new Error(result.message);
              }
            } catch (error: any) {
              // COMMENT: PRIORITY 1 - Replace console.error with logger
              logger.error('Error raising dispute:', error);
              CustomAlertService.showError(
                t('error'),
                error.message || (isRTL ? 'فشل في رفع النزاع' : 'Failed to raise dispute')
              );
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <AlertTriangle size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {t('jobNotFound')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.warning }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            {isRTL ? (
              <ArrowRight size={24} color="#000000" />
            ) : (
              <ArrowLeft size={24} color="#000000" />
            )}
          </TouchableOpacity>

          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AlertTriangle size={24} color="#000000" />
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {t('raiseDispute')}
            </Text>
          </View>

          <View style={styles.headerActionButton} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Summary */}
        <View style={[styles.jobSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.jobTitle, { color: theme.textPrimary }]}>
            {job.title}
          </Text>
          <Text style={[styles.jobAmount, { color: theme.textSecondary }]}>
            {job.budget} {isRTL ? 'عملة' : 'Coins'}
          </Text>
        </View>

        {/* Warning Notice */}
        <View style={[styles.warningCard, { backgroundColor: theme.warning + '15', borderColor: theme.warning + '40' }]}>
          <Shield size={20} color={theme.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.warningTitle, { color: theme.warning }]}>
              {t('disputeNotice')}
            </Text>
            <Text style={[styles.warningText, { color: theme.textSecondary }]}>
              {isRTL
                ? 'رفع النزاع يعني أنك غير راضٍ عن نتيجة الوظيفة. سيقوم فريق الإدارة بمراجعة الموقف وتحديد توزيع العملات بناءً على الأدلة المقدمة.'
                : 'Raising a dispute means you are not satisfied with the job outcome. The admin team will review the situation and decide the coin distribution based on the evidence provided.'}
            </Text>
          </View>
        </View>

        {/* Dispute Reason */}
        <View style={[styles.reasonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.reasonHeader}>
            <FileText size={20} color={theme.primary} />
            <Text style={[styles.reasonTitle, { color: theme.textPrimary }]}>
              {t('disputeReason')}
            </Text>
          </View>

          <TextInput
            style={[styles.reasonInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
            placeholder={
              isRTL
                ? 'اشرح بالتفصيل سبب رفع النزاع...'
                : 'Explain in detail why you are raising this dispute...'
            }
            placeholderTextColor={theme.textSecondary}
            value={disputeReason}
            onChangeText={setDisputeReason}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {/* Raise Dispute Button */}
        <TouchableOpacity
          style={[styles.disputeButton, { backgroundColor: theme.error }]}
          onPress={handleRaiseDispute}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <AlertTriangle size={20} color="#FFFFFF" />
              <Text style={styles.disputeButtonText}>
                {t('raiseDispute')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    fontFamily: FONT_FAMILY,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
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
  content: {
    flex: 1,
    padding: 16,
  },
  jobSummary: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  jobAmount: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    lineHeight: 18,
  },
  reasonCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  reasonInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    minHeight: 150,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disputeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
  },
});
