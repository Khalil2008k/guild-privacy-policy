import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { CustomAlertService } from '@/services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { RTLText, RTLView, RTLButton, RTLInput } from '@/app/components/primitives/primitives';
import { jobService, Job } from '@/services/jobService';
import { OfferService, CreateOfferData } from '@/services/offerService';
import { Send, DollarSign, MessageSquare, Briefcase, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface OfferFormData {
  price: string;
  message: string;
}

export default function OfferSubmissionScreen() {
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  
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
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<OfferFormData>({
    price: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<OfferFormData>>({});

  // Load job details
  const loadJobDetails = useCallback(async () => {
    if (!jobId) {
      CustomAlertService.showError(t('error'), 'Job ID is required', [{ text: t('ok') }]);
      router.back();
      return;
    }

    try {
      setLoading(true);
      const jobDetails = await jobService.getJobById(jobId);
      
      if (!jobDetails) {
        CustomAlertService.showError(t('error'), 'Job not found', [{ text: t('ok') }]);
        router.back();
        return;
      }
      
      setJob(jobDetails);
    } catch (error) {
      console.error('Error loading job details:', error);
      CustomAlertService.showError(t('error'), t('failedToLoadJobs'), [{ text: t('ok') }]);
    } finally {
      setLoading(false);
    }
  }, [jobId, t]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<OfferFormData> = {};

    // Validate price
    if (!formData.price) {
      newErrors.price = t('offerValidationError');
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 10) {
        newErrors.price = t('priceTooLow');
      } else if (price > 50000) {
        newErrors.price = t('priceTooHigh');
      }
    }

    // Validate message
    if (!formData.message) {
      newErrors.message = t('offerValidationError');
    } else if (formData.message.length < 20) {
      newErrors.message = t('messageTooShort');
    } else if (formData.message.length > 500) {
      newErrors.message = t('messageTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !job) return;

    try {
      setSubmitting(true);
      const freelancerId = user?.uid || '';

      const offerData: CreateOfferData = {
        jobId: job.id,
        freelancerId,
        price: parseFloat(formData.price),
        message: formData.message,
      };

      const offerId = await OfferService.createOffer(offerData);
      
      // Update job offers count
      await jobService.incrementOffers(job.id);

      CustomAlertService.showSuccess(
        t('success'),
        t('offerSubmittedSuccessfully'),
        [
          {
            text: t('ok'),
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting offer:', error);
      CustomAlertService.showError(t('error'), t('offerSubmissionFailed'), [{ text: t('ok') }]);
    } finally {
      setSubmitting(false);
    }
  }, [formData, job, validateForm, t]);

  // Format budget
  const formatBudget = (budget: string): string => {
    const amount = parseFloat(budget);
    return `${amount.toLocaleString()} QAR`;
  };

  // Get category icon
  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'نقل': '🚚',
      'تنظيف': '🧹',
      'صيانة': '🔧',
      'توصيل': '📦',
      'تصميم': '🎨',
      'برمجة': '💻',
      'كتابة': '✍️',
      'تدريس': '📚',
      'تصوير': '📸',
      'أخرى': '📋',
    };
    return icons[category] || '📋';
  };

  useEffect(() => {
    loadJobDetails();
  }, [loadJobDetails]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
        <RTLView style={styles.loadingContainer}>
          <RTLText style={styles.loadingText}>{t('loading')}</RTLText>
        </RTLView>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
        <RTLView style={styles.errorContainer}>
          <RTLText style={styles.errorText}>{t('error')}</RTLText>
        </RTLView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
      {/* Header */}
      <RTLView style={styles.header}>
        <RTLButton
          variant="outline"
          size="small"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          {isRTL ? <Ionicons name="chevron-back" size={20} /> : <Ionicons name="chevron-back" size={20} />}
        </RTLButton>
        <RTLText style={styles.headerTitle}>{t('offerSubmission')}</RTLText>
      </RTLView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Details Card */}
        <RTLView style={styles.jobCard}>
          <RTLView style={styles.jobHeader}>
            <RTLText style={styles.categoryIcon}>{getCategoryIcon(job.category)}</RTLText>
            <RTLText style={styles.jobTitle}>{job.title}</RTLText>
          </RTLView>

          <RTLText style={styles.jobDescription}>{job.description}</RTLText>

          <RTLView style={styles.jobDetails}>
            <RTLView style={styles.jobDetail}>
              <Ionicons name="cash-outline" size={16} color="#1E90FF" />
              <RTLText style={styles.jobDetailText}>
                {t('jobBudget')}: {formatBudget(typeof job.budget === 'string' ? job.budget : `${job.budget.min}-${job.budget.max} ${job.budget.currency}`)}
              </RTLText>
            </RTLView>

            {job.location && (
              <RTLView style={styles.jobDetail}>
                <Ionicons name="location-outline" size={16} color="#1E90FF" />
                <RTLText style={styles.jobDetailText}>
                  {typeof job.location === 'string' ? job.location : job.location.address}
                </RTLText>
              </RTLView>
            )}

            {job.schedule && (
              <RTLView style={styles.jobDetail}>
                <Ionicons name="time-outline" size={16} color="#1E90FF" />
                <RTLText style={styles.jobDetailText}>
                  {new Date(typeof job.schedule === 'string' ? job.schedule : job.schedule.toISOString()).toLocaleDateString()}
                </RTLText>
              </RTLView>
            )}
          </RTLView>
        </RTLView>

        {/* Offer Form */}
        <RTLView style={styles.formSection}>
          <RTLText style={styles.sectionTitle}>{t('offerDetails')}</RTLText>

          <RTLInput
            label={t('offerPrice')}
            placeholder={t('offerPricePlaceholder')}
            value={formData.price}
            onChangeText={(price) => setFormData(prev => ({ ...prev, price }))}
            keyboardType="numeric"
            error={errors.price}
            helperText={t('offerPriceHelper')}
          />

          <RTLInput
            label={t('offerMessage')}
            placeholder={t('offerMessagePlaceholder')}
            value={formData.message}
            onChangeText={(message) => setFormData(prev => ({ ...prev, message }))}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            error={errors.message}
            helperText={`${formData.message.length}/500 ${t('characters')}`}
            style={styles.messageInput}
          />

          {/* Offer Summary */}
          {formData.price && !errors.price && (
            <RTLView style={styles.offerSummary}>
              <RTLText style={styles.summaryTitle}>{t('offerSummary')}</RTLText>
              <RTLView style={styles.summaryRow}>
                <RTLText style={styles.summaryLabel}>{t('jobBudget')}:</RTLText>
                <RTLText style={styles.summaryValue}>{formatBudget(typeof job.budget === 'string' ? job.budget : `${job.budget.min}-${job.budget.max} ${job.budget.currency}`)}</RTLText>
              </RTLView>
              <RTLView style={styles.summaryRow}>
                <RTLText style={styles.summaryLabel}>{t('yourOffer')}:</RTLText>
                <RTLText style={styles.summaryValue}>{formatBudget(formData.price)}</RTLText>
              </RTLView>
              <RTLView style={styles.summaryRow}>
                <RTLText style={styles.summaryLabel}>{t('offerDifference')}:</RTLText>
                <RTLText style={[
                  styles.summaryValue,
                  parseFloat(formData.price) > (typeof job.budget === 'string' ? parseFloat(job.budget) : job.budget.max) ? styles.higherPrice : styles.lowerPrice
                ]}>
                                      {parseFloat(formData.price) > (typeof job.budget === 'string' ? parseFloat(job.budget) : job.budget.max) ? '+' : ''}
                    {(parseFloat(formData.price) - (typeof job.budget === 'string' ? parseFloat(job.budget) : job.budget.max)).toLocaleString()} QAR
                </RTLText>
              </RTLView>
            </RTLView>
          )}
        </RTLView>

        {/* Tips Section */}
        <RTLView style={styles.tipsSection}>
          <RTLText style={styles.sectionTitle}>{t('offerTips')}</RTLText>
          <RTLView style={styles.tipsList}>
            <RTLText style={styles.tipItem}>• {t('offerTips1')}</RTLText>
            <RTLText style={styles.tipItem}>• {t('offerTips2')}</RTLText>
            <RTLText style={styles.tipItem}>• {t('offerTips3')}</RTLText>
            <RTLText style={styles.tipItem}>• {t('offerTips4')}</RTLText>
            <RTLText style={styles.tipItem}>• {t('offerTips5')}</RTLText>
          </RTLView>
        </RTLView>
      </ScrollView>

      {/* Submit Button */}
      <RTLView style={styles.footer}>
        <RTLButton
          onPress={handleSubmit}
          disabled={submitting || !formData.price || !formData.message}
          style={styles.submitButton}
        >
          <RTLText style={styles.submitButtonText}>
            {submitting ? t('submittingOffer') : t('submitOfferButton')}
          </RTLText>
        </RTLButton>
      </RTLView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    minWidth: 48,
    height: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  jobDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  jobDetails: {
    gap: 8,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#666666',
  },
  formSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  messageInput: {
    height: 120,
  },
  offerSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  higherPrice: {
    color: '#FF4444',
  },
  lowerPrice: {
    color: '#27AE60',
  },
  tipsSection: {
    marginVertical: 16,
    marginBottom: 100,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    height: 48,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
