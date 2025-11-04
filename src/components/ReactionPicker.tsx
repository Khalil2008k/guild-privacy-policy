/**
 * Reaction Picker Component
 * 
 * COMMENT: ADVANCED FEATURE - Copied from reference chat system
 * Purpose: Advanced emoji reaction picker with full reaction system
 * Source: C:\Users\Admin\Desktop\chat\react-native-chat\src\components\ReactionPicker.js
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '💯', '✨', '😎'];

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectReaction: (messageId: string, emoji: string) => void;
  messageId: string;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onClose,
  onSelectReaction,
  messageId,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.reactionContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.reactionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'تفاعل' : 'React'}
          </Text>
          <View style={styles.reactionList}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.reactionItem, { backgroundColor: theme.background }]}
                onPress={() => {
                  onSelectReaction(messageId, emoji);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionContainer: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minWidth: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  reactionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  reactionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  reactionItem: {
    width: 40,
    height: 40,
    borderRadius: 20, // Perfect circle: half of width/height
    padding: 0, // No padding to ensure emoji fits fully
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure emoji doesn't overflow circle
  },
  reactionEmoji: {
    fontSize: 20,
    lineHeight: 20, // Match fontSize to prevent clipping
  },
});

