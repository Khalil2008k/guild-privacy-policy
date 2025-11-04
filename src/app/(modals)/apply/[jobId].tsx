import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Send, FileText, Coins, Clock, Check, ArrowLeft, Heart, Briefcase, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BackendAPI } from '@/config/backend';
import { useI18n } from '@/contexts/I18nProvider';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

export default function ApplyScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
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

  const [coverLetter, setCoverLetter] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [timeline, setTimeline] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!coverLetter.trim() || !proposedPrice.trim() || !timeline.trim()) {
      CustomAlertService.showError(
        isRTL ? 'معلومات ناقصة' : 'Missing Information',
        isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all fields to submit your offer.'
      );
      return;
    }

    // Validate numeric price
    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      CustomAlertService.showError(
        isRTL ? 'سعر غير صحيح' : 'Invalid Price',
        isRTL ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price.'
      );
      return;
    }

    if (!user) {
      CustomAlertService.showError(
        isRTL ? 'غير مصرح' : 'Unauthorized',
        isRTL ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in to apply.'
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('📤 Submitting offer:', {
        jobId,
        budget: price,
        timeline: timeline.trim(),
        messageLength: coverLetter.trim().length
      });

      // Submit offer via backend API
      const response = await BackendAPI.post(`/v1/jobs/${jobId}/offers`, {
        budget: price,
        timeline: timeline.trim(),
        message: coverLetter.trim(),
        coverLetter: coverLetter.trim()
      });

      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('✅ Offer submitted successfully:', response);

      if (response.success) {
        // Success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        CustomAlertService.showSuccess(
          isRTL ? 'تم إرسال العرض!' : 'Offer Submitted!',
          isRTL 
            ? 'تم إرسال عرضك بنجاح. سيتم إشعارك عند رد العميل.'
            : 'Your offer has been sent successfully. You will be notified when the client responds.',
          [
            {
              text: isRTL ? 'موافق' : 'OK',
              style: 'default',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to submit offer');
      }
    } catch (error: any) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error submitting offer:', error);
      
      // User-friendly error messages
      let errorMessage = isRTL 
        ? 'فشل إرسال العرض. يرجى المحاولة مرة أخرى.'
        : 'Failed to submit offer. Please try again.';
      
      if (error.message?.includes('already submitted')) {
        errorMessage = isRTL
          ? 'لقد أرسلت عرضاً لهذه الوظيفة بالفعل'
          : 'You have already submitted an offer for this job';
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = isRTL
          ? 'غير مصرح لك بإرسال عرض لهذه الوظيفة'
          : 'You are not authorized to submit an offer for this job';
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    CustomAlertService.showSuccess(
      isSaved ? 'Job Unsaved' : 'Job Saved',
      isSaved ? 'This job has been removed from your saved jobs.' : 'This job has been saved to your favorites.'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background }]}>
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
              {isRTL ? 'التقديم على الوظيفة' : 'Apply for Job'}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Heart
              size={24}
              color="#000000"
              fill={isSaved ? '#000000' : 'none'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Job Info Card */}
        <View style={[styles.infoCard, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={[styles.iconBadge, { backgroundColor: theme.primary + '20' }]}>
            <Briefcase size={24} color={theme.primary} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={[styles.infoCardLabel, { color: adaptiveColors.textSecondary }]}>
              {isRTL ? 'رقم الوظيفة' : 'Job ID'}
            </Text>
            <Text style={[styles.infoCardValue, { color: adaptiveColors.text }]}>
              #{jobId}
            </Text>
          </View>
        </View>

        {/* Cover Letter Section */}
        <View style={[styles.card, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: theme.primary + '15' }]}>
              <FileText size={20} color={theme.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: adaptiveColors.text }]}>
                {isRTL ? 'خطاب التقديم' : 'Cover Letter'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: adaptiveColors.textSecondary }]}>
                {isRTL ? 'اشرح لماذا أنت الأنسب لهذه الوظيفة' : 'Why you\'re the perfect fit'}
              </Text>
            </View>
          </View>
          
          <TextInput
            style={[styles.textArea, {
              backgroundColor: adaptiveColors.background,
              color: adaptiveColors.text,
              borderColor: adaptiveColors.border
            }]}
            placeholder={isRTL ? 'اكتب رسالة العرض هنا...' : 'Write your proposal message here...'}
            placeholderTextColor={adaptiveColors.textSecondary}
            multiline
            numberOfLines={6}
            value={coverLetter}
            onChangeText={setCoverLetter}
            textAlignVertical="top"
            returnKeyType="next"
            onSubmitEditing={() => {}}
            enablesReturnKeyAutomatically={true}
            autoCapitalize="sentences"
            autoCorrect={true}
            spellCheck={true}
          />
        </View>

        {/* Offer Details Section */}
        <View style={[styles.card, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: theme.primary + '15' }]}>
              <User size={20} color={theme.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: adaptiveColors.text }]}>
                {isRTL ? 'تفاصيل عرضك' : 'Your Offer Details'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: adaptiveColors.textSecondary }]}>
                {isRTL ? 'السعر والجدول الزمني' : 'Price and timeline'}
              </Text>
            </View>
          </View>

          {/* Price Input */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: adaptiveColors.textSecondary }]}>
              {isRTL ? 'السعر المقترح' : 'Proposed Price'}
            </Text>
            <View style={[styles.modernInputGroup, { backgroundColor: adaptiveColors.background, borderColor: adaptiveColors.border }]}>
              <View style={[styles.inputIconContainer, { backgroundColor: theme.primary + '10' }]}>
                <Coins size={20} color={theme.primary} />
              </View>
              <TextInput
                style={[styles.modernInput, { color: adaptiveColors.text }]}
                placeholder={isRTL ? 'أدخل السعر' : 'Enter price'}
                placeholderTextColor={adaptiveColors.textSecondary}
                keyboardType="numeric"
                value={proposedPrice}
                onChangeText={setProposedPrice}
                returnKeyType="next"
                onSubmitEditing={() => {}}
                enablesReturnKeyAutomatically={true}
              />
              <Text style={[styles.currencyLabel, { color: adaptiveColors.textSecondary }]}>QR</Text>
            </View>
          </View>

          {/* Timeline Input */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: adaptiveColors.textSecondary }]}>
              {isRTL ? 'الجدول الزمني' : 'Timeline'}
            </Text>
            <View style={[styles.modernInputGroup, { backgroundColor: adaptiveColors.background, borderColor: adaptiveColors.border }]}>
              <View style={[styles.inputIconContainer, { backgroundColor: theme.primary + '10' }]}>
                <Clock size={20} color={theme.primary} />
              </View>
              <TextInput
                style={[styles.modernInput, { color: adaptiveColors.text }]}
                placeholder={isRTL ? 'مثال: أسبوعان' : 'e.g., 2 weeks'}
                placeholderTextColor={adaptiveColors.textSecondary}
                value={timeline}
                onChangeText={setTimeline}
                returnKeyType="done"
                onSubmitEditing={() => {}}
                enablesReturnKeyAutomatically={true}
                autoCapitalize="sentences"
                autoCorrect={true}
                spellCheck={true}
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { opacity: isSubmitting ? 0.6 : 1 }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.primary, theme.primary + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Send size={22} color="#000000" />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting 
                ? (isRTL ? 'جاري الإرسال...' : 'Submitting...')
                : (isRTL ? 'إرسال العرض' : 'Submit Offer')
              }
            </Text>
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
  // Content Styles
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 20,
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
  // Text Area
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    minHeight: 140,
    lineHeight: 22,
  },
  // Input Styles
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 8,
  },
  modernInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingRight: 16,
    overflow: 'hidden',
  },
  inputIconContainer: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  currencyLabel: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Submit Button
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
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
