import React, { useState } from 'react';
import { StyleSheet, Platform, TouchableOpacity, Modal, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useI18n } from '@/contexts/I18nProvider';
import { RTLText, RTLView, RTLInput, RTLButton } from '@/app/components/primitives/primitives';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { JobPostingData } from './JobPostingWizard';

interface Step3ScheduleProps {
  jobData: JobPostingData;
  onUpdate: (updates: Partial<JobPostingData>) => void;
}

export default function Step3Schedule({ jobData, onUpdate }: Step3ScheduleProps) {
  const { t, isRTL } = useI18n();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (jobData.schedule) {
        newDate.setHours(jobData.schedule.getHours());
        newDate.setMinutes(jobData.schedule.getMinutes());
      }
      onUpdate({ schedule: newDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDate = new Date(selectedTime);
      if (jobData.schedule) {
        newDate.setFullYear(jobData.schedule.getFullYear());
        newDate.setMonth(jobData.schedule.getMonth());
        newDate.setDate(jobData.schedule.getDate());
      }
      onUpdate({ schedule: newDate });
    }
  };

  const showPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    if (Platform.OS === 'ios') {
      if (mode === 'date') {
        setShowDatePicker(true);
      } else {
        setShowTimePicker(true);
      }
    } else {
      if (mode === 'date') {
        setShowDatePicker(true);
      } else {
        setShowTimePicker(true);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const validateLocation = (value: string) => {
    if (value.length > 0 && value.length < 5) {
      return t('locationTooShort');
    }
    return '';
  };

  const locationError = jobData.location ? validateLocation(jobData.location) : '';

  return (
    <RTLView style={styles.container}>
      <RTLText style={styles.title}>{t('scheduleLocation')}</RTLText>
      <RTLText style={styles.subtitle}>{t('scheduleLocationDescription')}</RTLText>

      {/* Location Input */}
      <RTLView style={styles.inputContainer}>
        <RTLText style={styles.inputLabel}>{t('location')}</RTLText>
        <RTLView style={styles.locationInput}>
          <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
          <RTLInput
            placeholder={t('locationPlaceholder')}
            value={jobData.location}
            onChangeText={(location) => onUpdate({ location })}
            error={locationError}
            helperText={t('locationHelperText')}
            accessibilityLabel={t('location')}
            style={styles.locationTextInput}
          />
        </RTLView>
      </RTLView>

      {/* Date Selection */}
      <RTLView style={styles.inputContainer}>
        <RTLText style={styles.inputLabel}>{t('date')}</RTLText>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => showPicker('date')}
          accessibilityRole="button"
          accessibilityLabel={t('selectDate')}
        >
          <RTLView style={styles.dateTimeContent}>
            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
            <RTLText style={styles.dateTimeText}>
              {jobData.schedule ? formatDate(jobData.schedule) : t('selectDate')}
            </RTLText>
          </RTLView>
        </TouchableOpacity>
      </RTLView>

      {/* Time Selection */}
      <RTLView style={styles.inputContainer}>
        <RTLText style={styles.inputLabel}>{t('time')}</RTLText>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => showPicker('time')}
          accessibilityRole="button"
          accessibilityLabel={t('selectTime')}
        >
          <RTLView style={styles.dateTimeContent}>
            <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
            <RTLText style={styles.dateTimeText}>
              {jobData.schedule ? formatTime(jobData.schedule) : t('selectTime')}
            </RTLText>
          </RTLView>
        </TouchableOpacity>
      </RTLView>

      {/* Schedule Preview */}
      {jobData.schedule && (
        <RTLView style={styles.schedulePreview}>
          <RTLText style={styles.previewTitle}>{t('schedulePreview')}</RTLText>
          <RTLView style={styles.previewContent}>
            <RTLView style={styles.previewItem}>
              <Ionicons name="calendar-outline" size={16} color="#1E90FF" />
              <RTLText style={styles.previewText}>
                {formatDate(jobData.schedule)}
              </RTLText>
            </RTLView>
            <RTLView style={styles.previewItem}>
              <Ionicons name="time-outline" size={16} color="#1E90FF" />
              <RTLText style={styles.previewText}>
                {formatTime(jobData.schedule)}
              </RTLText>
            </RTLView>
          </RTLView>
        </RTLView>
      )}

      {/* Final Summary */}
      <RTLView style={styles.finalSummary}>
        <RTLText style={styles.summaryTitle}>{t('jobSummary')}</RTLText>
        <RTLView style={styles.summarySection}>
          <RTLText style={styles.sectionTitle}>{t('jobDetails')}</RTLText>
          <RTLText style={styles.summaryText}>
            <RTLText style={styles.summaryLabel}>{t('category')}: </RTLText>
            {t(jobData.category)}
          </RTLText>
          <RTLText style={styles.summaryText}>
            <RTLText style={styles.summaryLabel}>{t('title')}: </RTLText>
            {jobData.title}
          </RTLText>
          <RTLText style={styles.summaryText}>
            <RTLText style={styles.summaryLabel}>{t('budget')}: </RTLText>
            {jobData.budget} {t('qar')}
          </RTLText>
        </RTLView>
        <RTLView style={styles.summarySection}>
          <RTLText style={styles.sectionTitle}>{t('scheduleLocation')}</RTLText>
          <RTLText style={styles.summaryText}>
            <RTLText style={styles.summaryLabel}>{t('location')}: </RTLText>
            {jobData.location}
          </RTLText>
          <RTLText style={styles.summaryText}>
            <RTLText style={styles.summaryLabel}>{t('schedule')}: </RTLText>
            {jobData.schedule ? `${formatDate(jobData.schedule)} ${formatTime(jobData.schedule)}` : t('notSet')}
          </RTLText>
        </RTLView>
      </RTLView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={jobData.schedule || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={jobData.schedule || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* iOS Modal for Date/Time Picker */}
      {(showDatePicker || showTimePicker) && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker || showTimePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <RTLView style={styles.modalContent}>
              <RTLView style={styles.modalHeader}>
                <RTLText style={styles.modalTitle}>
                  {showDatePicker ? t('selectDate') : t('selectTime')}
                </RTLText>
                <RTLButton
                  variant="outline"
                  size="small"
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                >
                  <RTLText style={styles.doneButtonText}>{t('done')}</RTLText>
                </RTLButton>
              </RTLView>
              {(showDatePicker || showTimePicker) && (
                <DateTimePicker
                  value={jobData.schedule || new Date()}
                  mode={showDatePicker ? 'date' : 'time'}
                  display="spinner"
                  onChange={showDatePicker ? handleDateChange : handleTimeChange}
                  minimumDate={showDatePicker ? new Date() : undefined}
                />
              )}
            </RTLView>
          </View>
        </Modal>
      )}
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Medium',
    marginBottom: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  locationTextInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  dateTimeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic',
    flex: 1,
  },
  schedulePreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'NotoSansArabic-Medium',
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic',
    marginLeft: 8,
  },
  finalSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
    marginBottom: 16,
  },
  summarySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'NotoSansArabic-Medium',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: '600',
    fontFamily: 'NotoSansArabic-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
  },
  doneButtonText: {
    fontSize: 14,
    color: '#1E90FF',
    fontFamily: 'NotoSansArabic-Medium',
  },
});
