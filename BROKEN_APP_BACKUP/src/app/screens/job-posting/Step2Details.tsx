import React from 'react';
import { StyleSheet } from 'react-native';
import { useI18n } from '@/contexts/I18nProvider';
import { RTLText, RTLView, RTLInput } from '@/app/components/primitives/primitives';
import { JobPostingData } from './JobPostingWizard';

interface Step2DetailsProps {
  jobData: JobPostingData;
  onUpdate: (updates: Partial<JobPostingData>) => void;
}

export default function Step2Details({ jobData, onUpdate }: Step2DetailsProps) {
  const { t } = useI18n();

  const validateBudget = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return t('budgetValidationError');
    }
    if (numValue < 10) {
      return t('budgetMinimumError');
    }
    return '';
  };

  const budgetError = jobData.budget ? validateBudget(jobData.budget) : '';

  return (
    <RTLView style={styles.container}>
      <RTLText style={styles.title}>{t('jobDetails')}</RTLText>
      <RTLText style={styles.subtitle}>{t('jobDetailsDescription')}</RTLText>

      {/* Job Title */}
      <RTLInput
        label={t('jobTitle')}
        placeholder={t('jobTitlePlaceholder')}
        value={jobData.title}
        onChangeText={(title) => onUpdate({ title })}
        maxLength={100}
        error={jobData.title.length > 0 && jobData.title.length < 5 ? t('titleTooShort') : ''}
        helperText={t('titleHelperText')}
        accessibilityLabel={t('jobTitle')}
      />

      {/* Job Description */}
      <RTLInput
        label={t('jobDescription')}
        placeholder={t('jobDescriptionPlaceholder')}
        value={jobData.description}
        onChangeText={(description) => onUpdate({ description })}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={500}
        error={jobData.description.length > 0 && jobData.description.length < 20 ? t('descriptionTooShort') : ''}
        helperText={`${jobData.description.length}/500 ${t('characters')}`}
        accessibilityLabel={t('jobDescription')}
        style={styles.textArea}
      />

      {/* Budget */}
      <RTLInput
        label={t('budget')}
        placeholder={t('budgetPlaceholder')}
        value={jobData.budget}
        onChangeText={(budget) => onUpdate({ budget })}
        keyboardType="numeric"
        error={budgetError}
        helperText={t('budgetHelperText')}
        accessibilityLabel={t('budget')}
      />

      {/* Budget Preview */}
      {jobData.budget && !budgetError && (
        <RTLView style={styles.budgetPreview}>
          <RTLText style={styles.budgetPreviewTitle}>{t('budgetPreview')}</RTLText>
          <RTLView style={styles.budgetPreviewContent}>
            <RTLText style={styles.budgetAmount}>
              {parseFloat(jobData.budget).toLocaleString()} {t('qar')}
            </RTLText>
            <RTLText style={styles.budgetNote}>
              {t('budgetNote')}
            </RTLText>
          </RTLView>
        </RTLView>
      )}

      {/* Form Summary */}
      <RTLView style={styles.summary}>
        <RTLText style={styles.summaryTitle}>{t('formSummary')}</RTLText>
        <RTLView style={styles.summaryItem}>
          <RTLText style={styles.summaryLabel}>{t('title')}:</RTLText>
          <RTLText style={styles.summaryValue}>
            {jobData.title || t('notProvided')}
          </RTLText>
        </RTLView>
        <RTLView style={styles.summaryItem}>
          <RTLText style={styles.summaryLabel}>{t('description')}:</RTLText>
          <RTLText style={styles.summaryValue}>
            {jobData.description ? `${jobData.description.substring(0, 50)}...` : t('notProvided')}
          </RTLText>
        </RTLView>
        <RTLView style={styles.summaryItem}>
          <RTLText style={styles.summaryLabel}>{t('budget')}:</RTLText>
          <RTLText style={styles.summaryValue}>
            {jobData.budget ? `${jobData.budget} ${t('qar')}` : t('notProvided')}
          </RTLText>
        </RTLView>
      </RTLView>
    </RTLView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'NotoSansArabic',
    marginBottom: 32,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  budgetPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  budgetPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'NotoSansArabic-Medium',
    marginBottom: 8,
  },
  budgetPreviewContent: {
    alignItems: 'flex-start',
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27AE60',
    fontFamily: 'NotoSansArabic-Bold',
    marginBottom: 4,
  },
  budgetNote: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'NotoSansArabic',
  },
  summary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'NotoSansArabic-Medium',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic',
    flex: 2,
    textAlign: 'left',
  },
});
