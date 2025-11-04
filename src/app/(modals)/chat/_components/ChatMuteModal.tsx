/**
 * Chat Mute Modal Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1928-1980)
 * Purpose: Modal for selecting mute duration (1 hour, 1 day, 1 week, forever)
 */

import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

interface ChatMuteModalProps {
  visible: boolean;
  onClose: () => void;
  onMuteDuration: (duration: 'hour' | 'day' | 'week' | 'forever') => void;
}

export const ChatMuteModal: React.FC<ChatMuteModalProps> = ({
  visible,
  onClose,
  onMuteDuration,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.optionsOverlay} 
        onPress={onClose}
      >
        <View style={[styles.muteOptionsMenu, { backgroundColor: theme.surface }]}>
          <Text style={[styles.muteTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'كتم الإشعارات لمدة' : 'Mute notifications for'}
          </Text>
          
          <TouchableOpacity 
            style={styles.muteOption}
            onPress={() => onMuteDuration('hour')}
          >
            <Text style={[styles.muteOptionText, { color: theme.textPrimary }]}>
              {isRTL ? 'ساعة واحدة' : '1 hour'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.muteOption}
            onPress={() => onMuteDuration('day')}
          >
            <Text style={[styles.muteOptionText, { color: theme.textPrimary }]}>
              {isRTL ? 'يوم واحد' : '1 day'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.muteOption}
            onPress={() => onMuteDuration('week')}
          >
            <Text style={[styles.muteOptionText, { color: theme.textPrimary }]}>
              {isRTL ? 'أسبوع واحد' : '1 week'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.muteOption}
            onPress={() => onMuteDuration('forever')}
          >
            <Text style={[styles.muteOptionText, { color: theme.error }]}>
              {isRTL ? 'للأبد' : 'Forever'}
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  muteOptionsMenu: {
    borderRadius: 12,
    paddingVertical: 16,
    minWidth: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  muteTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  muteOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  muteOptionText: {
    fontSize: 16,
  },
});

export default ChatMuteModal;
