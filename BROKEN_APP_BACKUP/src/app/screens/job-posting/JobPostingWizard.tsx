import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/contexts/I18nProvider';
import { RTLText, RTLView, RTLButton } from '@/app/components/primitives/primitives';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { jobService } from '@/services/jobService';
import { router } from 'expo-router';
import Step1Category from './Step1Category';
import Step2Details from './Step2Details';
import Step3Schedule from './Step3Schedule';

export interface JobPostingData {
  category: string;
  title: string;
  description: string;
  budget: string;
  location: string;
  schedule: Date | null;
}

export default function JobPostingWizard() {
  const { t, isRTL } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobData, setJobData] = useState<JobPostingData>({
    category: '',
    title: '',
    description: '',
    budget: '',
    location: '',
    schedule: null,
  });

  const updateJobData = useCallback((updates: Partial<JobPostingData>) => {
    setJobData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return jobData.category !== '';
      case 2:
        return jobData.title !== '' && jobData.description !== '' && jobData.budget !== '';
      case 3:
        return jobData.location !== '' && jobData.schedule !== null;
      default:
        return false;
    }
  }, [currentStep, jobData]);

  const handleSubmitJob = useCallback(async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      // TODO: Get actual client ID from auth context
      const clientId = 'demo-client-id';
      
      const jobId = await jobService.createJob({
        ...jobData,
        clientId,
        clientName: 'Demo Client', // TODO: Get from auth context
        skills: [], // TODO: Add skills selection
        isUrgent: false, // TODO: Add urgent toggle
        timeNeeded: '1-2 days', // TODO: Get from form
      });

      Alert.alert(
        t('success'),
        t('jobPostedSuccessfully'),
        [
          {
            text: t('viewJob'),
            onPress: () => {
              router.push(`/(modals)/job/${jobId}`);
            },
          },
          {
            text: t('ok'),
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error posting job:', error);
      Alert.alert(
        t('error'),
        t('jobPostingFailed'),
        [{ text: t('ok') }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [jobData, canProceed, t]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Category
            selectedCategory={jobData.category}
            onCategorySelect={(category) => updateJobData({ category })}
          />
        );
      case 2:
        return (
          <Step2Details
            jobData={jobData}
            onUpdate={updateJobData}
          />
        );
      case 3:
        return (
          <Step3Schedule
            jobData={jobData}
            onUpdate={updateJobData}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t('selectCategory');
      case 2:
        return t('jobDetails');
      case 3:
        return t('scheduleLocation');
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top, paddingBottom: bottom, backgroundColor: theme.background }]}>
      {/* Header */}
      <RTLView style={[styles.header, { borderBottomColor: theme.primary }]}>
        <RTLButton
          variant="outline"
          size="small"
          onPress={prevStep}
          disabled={currentStep === 1}
          style={styles.navButton}
        >
          {isRTL ? <Ionicons name="chevron-forward" size={20} /> : <Ionicons name="chevron-back" size={20} />}
        </RTLButton>
        
        <RTLView style={styles.headerContent}>
          <RTLText style={[styles.stepTitle, { color: theme.textPrimary }]}>{getStepTitle()}</RTLText>
          <RTLText style={[styles.stepIndicator, { color: theme.textSecondary }]}>
            {t('step')} {currentStep} {t('of')} 3
          </RTLText>
        </RTLView>
      </RTLView>

      {/* Progress Bar */}
      <RTLView style={styles.progressContainer}>
        <RTLView style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <RTLView 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / 3) * 100}%`, backgroundColor: theme.primary }
            ]} 
          >
            {null}
          </RTLView>
        </RTLView>
      </RTLView>

      {/* Step Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation Footer */}
      <RTLView style={styles.footer}>
        {currentStep < 3 ? (
          <RTLButton
            variant="primary"
            size="large"
            onPress={nextStep}
            disabled={!canProceed()}
            style={styles.nextButton}
          >
            <RTLText style={styles.buttonText}>
              {t('next')} {isRTL ? <Ionicons name="chevron-back" size={20} /> : <Ionicons name="chevron-forward" size={20} />}
            </RTLText>
          </RTLButton>
        ) : (
          <RTLButton
            variant="primary"
            size="large"
            onPress={handleSubmitJob}
            disabled={!canProceed() || isSubmitting}
            style={styles.submitButton}
          >
            <RTLText style={styles.buttonText}>
              {isSubmitting ? t('posting') : t('postJob')}
            </RTLText>
          </RTLButton>
        )}
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
    borderBottomColor: '#E5E5E5',
  },
  navButton: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
    marginBottom: 4,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'NotoSansArabic',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E90FF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  nextButton: {
    width: '100%',
  },
  submitButton: {
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'NotoSansArabic-Medium',
  },
});
