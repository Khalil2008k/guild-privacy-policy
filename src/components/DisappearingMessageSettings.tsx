/**
 * Disappearing Message Settings Component
 * 
 * Allows users to configure disappearing message timer settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Clock, X, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';

export type DisappearingMessageDuration = 
  | 'off' 
  | 30        // 30 seconds
  | 60        // 1 minute
  | 300       // 5 minutes
  | 3600      // 1 hour
  | 86400     // 24 hours
  | 604800;   // 7 days

interface DisappearingMessageSettingsProps {
  visible: boolean;
  onClose: () => void;
  currentDuration: DisappearingMessageDuration;
  onDurationChange: (duration: DisappearingMessageDuration) => void;
}

const DURATION_OPTIONS: Array<{
  value: DisappearingMessageDuration;
  label: string;
  labelAR: string;
}> = [
  { value: 'off', label: 'Off', labelAR: 'إيقاف' },
  { value: 30, label: '30 seconds', labelAR: '30 ثانية' },
  { value: 60, label: '1 minute', labelAR: 'دقيقة واحدة' },
  { value: 300, label: '5 minutes', labelAR: '5 دقائق' },
  { value: 3600, label: '1 hour', labelAR: 'ساعة واحدة' },
  { value: 86400, label: '24 hours', labelAR: '24 ساعة' },
  { value: 604800, label: '7 days', labelAR: '7 أيام' },
];

export function DisappearingMessageSettings({
  visible,
  onClose,
  currentDuration,
  onDurationChange,
}: DisappearingMessageSettingsProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [selectedDuration, setSelectedDuration] = useState<DisappearingMessageDuration>(currentDuration);

  React.useEffect(() => {
    if (visible) {
      setSelectedDuration(currentDuration);
    }
  }, [visible, currentDuration]);

  const handleSave = () => {
    onDurationChange(selectedDuration);
    onClose();
  };

  const formatDuration = (duration: DisappearingMessageDuration): string => {
    if (duration === 'off') return isRTL ? 'إيقاف' : 'Off';
    const option = DURATION_OPTIONS.find(opt => opt.value === duration);
    return option ? (isRTL ? option.labelAR : option.label) : String(duration);
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
            <Clock size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'رسائل تختفي' : 'Disappearing Messages'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.content}>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {isRTL 
                ? 'سيتم حذف الرسائل تلقائياً بعد الفترة المحددة'
                : 'Messages will be automatically deleted after the selected duration'
              }
            </Text>

            {/* Duration Options */}
            <View style={styles.optionsContainer}>
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={String(option.value)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selectedDuration === option.value 
                        ? theme.primary + '20' 
                        : theme.background,
                      borderColor: selectedDuration === option.value 
                        ? theme.primary 
                        : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedDuration(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: selectedDuration === option.value 
                            ? theme.primary 
                            : theme.textPrimary,
                          fontWeight: selectedDuration === option.value ? '600' : '400',
                        },
                      ]}
                    >
                      {isRTL ? option.labelAR : option.label}
                    </Text>
                    {selectedDuration === option.value && (
                      <Check size={20} color={theme.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
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
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Check size={20} color="#000000" />
              <Text style={[styles.saveButtonText, { color: '#000000' }]}>
                {isRTL ? 'حفظ' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionText: {
    fontSize: 16,
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
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

