/**
 * Message Scheduler Component
 * 
 * Allows users to schedule messages to be sent at a specific date/time
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, X, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';

interface MessageSchedulerProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (scheduledDate: Date, message: string) => void;
  initialMessage?: string;
}

export function MessageScheduler({
  visible,
  onClose,
  onSchedule,
  initialMessage = '',
}: MessageSchedulerProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [messageText, setMessageText] = useState(initialMessage);

  React.useEffect(() => {
    if (visible) {
      // Reset to current time + 1 hour as default
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      setSelectedDate(defaultDate);
      setMessageText(initialMessage);
    }
  }, [visible, initialMessage]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      // Preserve time from selectedDate
      const newDate = new Date(date);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      // Preserve date from selectedDate
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const handleSchedule = () => {
    if (!messageText.trim()) {
      return;
    }

    // Validate date is in the future
    if (selectedDate <= new Date()) {
      // Could show error here
      return;
    }

    onSchedule(selectedDate, messageText);
    onClose();
    setMessageText('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'جدولة الرسالة' : 'Schedule Message'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Message Input */}
          <View style={styles.content}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {isRTL ? 'الرسالة' : 'Message'}
            </Text>
            <Text style={[styles.messagePreview, { color: theme.textPrimary }]}>
              {messageText || (isRTL ? 'لا توجد رسالة' : 'No message')}
            </Text>

            {/* Date/Time Selection */}
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={theme.primary} />
                <Text style={[styles.dateTimeText, { color: theme.textPrimary }]}>
                  {formatDate(selectedDate)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateTimeButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={theme.primary} />
                <Text style={[styles.dateTimeText, { color: theme.textPrimary }]}>
                  {formatTime(selectedDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected DateTime Summary */}
            <View style={[styles.summary, { backgroundColor: theme.background }]}>
              <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                {isRTL ? 'سيتم إرسال الرسالة في:' : 'Message will be sent at:'}
              </Text>
              <Text style={[styles.summaryDate, { color: theme.textPrimary }]}>
                {selectedDate.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.background }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleButton, { backgroundColor: theme.primary }]}
              onPress={handleSchedule}
              disabled={!messageText.trim() || selectedDate <= new Date()}
            >
              <Check size={20} color="#000000" />
              <Text style={[styles.scheduleButtonText, { color: '#000000' }]}>
                {isRTL ? 'جدولة' : 'Schedule'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minHeight: 50,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  summary: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryDate: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});







