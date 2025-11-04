import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { useRealPayment } from '../../../contexts/RealPaymentContext';
import { jobService, Job } from '../../../services/jobService';
import CoinEscrowService from '../../../services/CoinEscrowService';
import { CheckCircle, AlertTriangle, Clock, DollarSign, FileText, Coins, Send, ArrowLeft, Briefcase, User, Calendar, Info } from 'lucide-react-native';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../../utils/logger';

export default function JobAcceptScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const { wallet, isLoading: walletLoading, processPayment } = useRealPayment();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.textPrimary : '#1A1A1A',
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
        // Don't set default price - let user enter their own offer
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading job:', error);
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

      const proposedAmount = parseFloat(proposedPrice);

      // NOTE: Doer doesn't need coins - only the POSTER (client) pays!
      // The coins will be deducted from the POSTER's wallet when they accept your offer

      // Create job offer with coin amount
      const offerData = {
        jobId: jobId as string,
        freelancerId: user.uid,
        freelancerName: user.displayName || 'Freelancer',
        price: proposedAmount, // Price in QR (coin value)
        message: `I propose to complete this job for ${proposedAmount} QR within ${timeline}.`,
        timeline,
      };

      await jobService.submitOffer(offerData);

      // NOTE: We're NOT accepting the offer here - just submitting it
      // The POSTER will accept it, which triggers escrow creation

      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال العرض!' : 'Offer Submitted!',
        isRTL
          ? `تم إرسال عرضك بـ ${proposedAmount} QR. سيتم إشعارك عندما يقبل العميل عرضك.`
          : `Your offer of ${proposedAmount} QR has been sent. You'll be notified when the client accepts your offer.`,
        [
          {
            text: isRTL ? 'موافق' : 'OK',
            style: 'default',
            onPress: () => router.push('/(main)/jobs')
          }
        ]
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error submitting offer:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في إرسال العرض. يرجى المحاولة مرة أخرى.' : 'Failed to submit offer. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: adaptiveColors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: adaptiveColors.textSecondary }]}>
          {isRTL ? 'جارٍ التحميل...' : 'Loading job details...'}
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: adaptiveColors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AlertTriangle size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: adaptiveColors.text }]}>
          {isRTL ? 'الوظيفة غير موجودة' : 'Job not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'DD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Briefcase size={20} color="#000000" style={{ marginBottom: 4 }} />
            <Text style={styles.headerTitle}>
              {isRTL ? 'إرسال عرض' : 'Send Offer'}
            </Text>
          </View>
          
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Job Summary Card */}
        <View style={[styles.jobCard, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={[styles.jobIconBadge, { backgroundColor: theme.primary }]}>
            <Briefcase size={28} color="#000000" />
          </View>
          
          <Text style={[styles.jobTitle, { color: adaptiveColors.text }]}>
            {job.title}
          </Text>

          <View style={[styles.jobMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaChip, { backgroundColor: theme.primary + '15' }]}>
              <Coins size={16} color={theme.primary} />
              <Text style={[styles.metaText, { color: theme.primary }]}>
                {typeof job.budget === 'object' ? `${job.budget.min}-${job.budget.max}` : job.budget} QR
              </Text>
            </View>

            <View style={[styles.metaChip, { backgroundColor: adaptiveColors.border }]}>
              <Clock size={16} color={adaptiveColors.textSecondary} />
              <Text style={[styles.metaText, { color: adaptiveColors.textSecondary }]}>
                {job.timeNeeded}
              </Text>
            </View>
          </View>
        </View>

        {/* Proposal Form Card */}
        <View style={[styles.card, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: theme.primary }]}>
              <User size={20} color="#000000" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: adaptiveColors.text }]}>
                {isRTL ? 'تفاصيل عرضك' : 'Your Offer'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: adaptiveColors.textSecondary }]}>
                {isRTL ? 'السعر والجدول الزمني' : 'Price and timeline'}
              </Text>
            </View>
          </View>

          {/* Proposed Price in QR */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: adaptiveColors.text }]}>
              {isRTL ? 'السعر المقترح' : 'Proposed Price'} *
            </Text>
            <View style={[styles.priceInputContainer, { backgroundColor: adaptiveColors.background, borderColor: adaptiveColors.border }]}>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    color: adaptiveColors.text,
                    textAlign: isRTL ? 'right' : 'left'
                  }
                ]}
                placeholder={isRTL ? 'أدخل السعر المقترح' : 'Enter proposed price'}
                placeholderTextColor={adaptiveColors.textSecondary}
                value={proposedPrice}
                onChangeText={setProposedPrice}
                keyboardType="numeric"
                returnKeyType="next"
              />
              <Text style={[styles.currencyBadge, { color: theme.primary, backgroundColor: theme.primary + '15' }]}>
                QR
              </Text>
            </View>
            <Text style={[styles.helperText, { color: adaptiveColors.textSecondary }]}>
              {isRTL ? 'سيدفع العميل بالعملات (قيمة QR)' : 'Client will pay in coins (QR value)'}
            </Text>
          </View>

          {/* Timeline */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: adaptiveColors.text }]}>
              {isRTL ? 'الجدول الزمني' : 'Timeline'} *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: adaptiveColors.background,
                  color: adaptiveColors.text,
                  borderColor: adaptiveColors.border,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              placeholder={isRTL ? 'مثال: 3-5 أيام' : 'e.g., 3-5 days'}
              placeholderTextColor={adaptiveColors.textSecondary}
              value={timeline}
              onChangeText={setTimeline}
              returnKeyType="next"
            />
          </View>

        </View>

        {/* Payment Info - Subtle */}
        <View style={[styles.infoCard, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: theme.primary }]}>
            <Info size={18} color="#000000" />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoText, { color: adaptiveColors.textSecondary }]}>
              {isRTL
                ? 'سيتم مراجعة عرضك من قبل العميل. عند القبول، يتم إنشاء عقد آمن وحماية الدفع.'
                : 'Your offer will be reviewed by the client. Upon acceptance, a secure contract is created with payment protection.'
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: adaptiveColors.surface, borderTopColor: adaptiveColors.border }]}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: adaptiveColors.border }]}
            onPress={() => router.back()}
            disabled={accepting}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: adaptiveColors.text }]}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { opacity: accepting ? 0.6 : 1 }]}
            onPress={handleAcceptJob}
            disabled={accepting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.primary, theme.primary + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {accepting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Send size={22} color="#000000" />
              )}
              <Text style={styles.submitButtonText}>
                {accepting
                  ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...')
                  : (isRTL ? 'إرسال العرض' : 'Send Offer')
                }
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FONT_FAMILY = 'Signika Negative SC';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header Styles
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    color: '#000000',
  },
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  // Job Card
  jobCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  jobIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 22,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  // Card Styles
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  // Input Styles
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 12,
    overflow: 'hidden',
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  currencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginTop: 6,
    fontStyle: 'italic',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  // Info Card
  infoCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  submitButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitButtonText: {
    fontSize: 17,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    color: '#000000',
  },
});

