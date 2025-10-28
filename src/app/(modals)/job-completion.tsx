import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useRealPayment } from '../../contexts/RealPaymentContext';
import { jobService, Job } from '../../services/jobService';
import CoinEscrowService from '../../services/CoinEscrowService';
import { CheckCircle, Clock, DollarSign, AlertTriangle, Coins, Shield, ArrowLeft, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CustomAlertService } from '../../services/CustomAlertService';

const FONT_FAMILY = 'Signika Negative SC';

export default function JobCompletionScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const { wallet, processPayment } = useRealPayment();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [escrowId, setEscrowId] = useState<string | null>(null);

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
      console.error('Error loading job:', error);
      CustomAlertService.showError(t('error'), 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!job || !user) return;

    // Calculate platform fee (10%) and freelancer amount (90%)
    const jobAmount = job.budget;
    const platformFee = Math.round(jobAmount * 0.1 * 100) / 100; // 10% fee
    const freelancerAmount = jobAmount - platformFee; // 90% to freelancer

    Alert.alert(
      t('confirmJobCompletion'),
      isRTL
        ? `سيتم توزيع ${jobAmount} عملة كالتالي:\n• ${freelancerAmount} عملة للعامل\n• ${platformFee} عملة رسوم المنصة\n\nهل أنت متأكد من إكمال هذه الوظيفة؟`
        : `The ${jobAmount} coins will be distributed as follows:\n• ${freelancerAmount} coins to freelancer\n• ${platformFee} coins platform fee\n\nAre you sure you want to complete this job?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('completeJob'),
          style: 'default',
          onPress: async () => {
            setCompleting(true);
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

              // Release escrow (automatically distributes 90% to freelancer, 10% to platform)
              if (escrowId) {
                const releaseResult = await CoinEscrowService.releaseEscrow({
                  escrowId,
                  completionNotes: `Job completed: ${job.title}`
                });

                if (!releaseResult.success) {
                  throw new Error(releaseResult.message);
                }
              } else {
                // Fallback: Direct payment if no escrow exists
                const success = await processPayment(
                  jobAmount,
                  job.id,
                  `Job completion payment for: ${job.title}`,
                  job.freelancerId
                );

                if (!success) {
                  throw new Error('Payment processing failed');
                }
              }

              // Mark job as completed
              await jobService.updateJobStatus(job.id, 'completed');

              CustomAlertService.showSuccess(
                t('jobCompleted'),
                isRTL
                  ? `تم إكمال الوظيفة وتوزيع ${jobAmount} عملة بنجاح (${freelancerAmount} للعامل، ${platformFee} رسوم المنصة)`
                  : `Job completed! ${jobAmount} coins distributed (${freelancerAmount} to freelancer, ${platformFee} platform fee)`
              );

              router.push('/(main)/jobs');
            } catch (error: any) {
              console.error('Error completing job:', error);
              CustomAlertService.showError(
                t('error'),
                error.message || (isRTL ? 'فشل في إكمال الوظيفة' : 'Failed to complete job')
              );
            } finally {
              setCompleting(false);
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

  const jobAmount = job.budget;
  const platformFee = Math.round(jobAmount * 0.1 * 100) / 100;
  const freelancerAmount = jobAmount - platformFee;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.primary }]}>
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
            <CheckCircle size={24} color="#000000" />
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {t('completeJob')}
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

          <View style={[styles.jobMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { backgroundColor: theme.primary + '15' }]}>
              <Coins size={16} color={theme.primary} />
              <Text style={[styles.metaText, { color: theme.primary }]}>
                {jobAmount} {isRTL ? 'عملة' : 'Coins'}
              </Text>
            </View>

            <View style={[styles.metaItem, { backgroundColor: theme.success + '15' }]}>
              <CheckCircle size={16} color={theme.success} />
              <Text style={[styles.metaText, { color: theme.success }]}>
                {t('readyForCompletion')}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Distribution */}
        <View style={[styles.distributionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.distributionHeader}>
            <Shield size={20} color={theme.primary} />
            <Text style={[styles.distributionTitle, { color: theme.textPrimary }]}>
              {t('paymentDistribution')}
            </Text>
          </View>

          <View style={[styles.distributionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.distributionLabel, { color: theme.textSecondary }]}>
              {t('freelancerPayment')}
            </Text>
            <Text style={[styles.distributionValue, { color: theme.success }]}>
              {freelancerAmount} {isRTL ? 'عملة' : 'Coins'}
            </Text>
          </View>

          <View style={styles.distributionDivider} />

          <View style={[styles.distributionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.distributionLabel, { color: theme.textSecondary }]}>
              {t('platformFee')}
            </Text>
            <Text style={[styles.distributionValue, { color: theme.warning }]}>
              {platformFee} {isRTL ? 'عملة' : 'Coins'} (10%)
            </Text>
          </View>
        </View>

        {/* Completion Notice */}
        <View style={[styles.noticeCard, { backgroundColor: theme.info + '15', borderColor: theme.info + '40' }]}>
          <AlertTriangle size={20} color={theme.info} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.noticeTitle, { color: theme.info }]}>
              {t('importantNotice')}
            </Text>
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              {isRTL
                ? 'عند إكمال الوظيفة، سيتم خصم العملات من محفظة العميل وتوزيعها حسب النسب المحددة. تأكد من رضا العميل قبل الإكمال.'
                : 'When completing the job, coins will be deducted from the client\'s wallet and distributed according to the specified ratios. Make sure the client is satisfied before completion.'}
            </Text>
          </View>
        </View>

        {/* Complete Job Button */}
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: theme.success }]}
          onPress={handleCompleteJob}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>
                {t('completeJob')}
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
    fontFamily: FONT_FAMILY,
  },
  distributionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  distributionLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  distributionValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  distributionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    lineHeight: 18,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
  },
});
