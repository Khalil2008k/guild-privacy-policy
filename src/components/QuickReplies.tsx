/**
 * Quick Replies Component
 * 
 * Displays a horizontal list of pre-defined quick reply buttons
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';

interface QuickReply {
  id: string;
  text: string;
  emoji?: string;
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  visible?: boolean;
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: 'yes', text: 'Yes', emoji: '👍' },
  { id: 'no', text: 'No', emoji: '👎' },
  { id: 'ok', text: 'OK', emoji: '👌' },
  { id: 'thanks', text: 'Thanks', emoji: '🙏' },
  { id: 'hello', text: 'Hello', emoji: '👋' },
  { id: 'bye', text: 'Bye', emoji: '👋' },
  { id: 'maybe', text: 'Maybe', emoji: '🤔' },
  { id: 'later', text: 'Later', emoji: '⏰' },
];

export function QuickReplies({
  replies = DEFAULT_QUICK_REPLIES,
  onSelect,
  visible = true,
}: QuickRepliesProps) {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  if (!visible || replies.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
        {replies.map((reply) => (
          <TouchableOpacity
            key={reply.id}
            style={[
              styles.replyButton,
              {
                backgroundColor: theme.background, // Keep the black container for buttons
                borderWidth: 1,
                borderColor: theme.primary, // Border line using theme color
              },
            ]}
            onPress={() => onSelect(reply)}
            activeOpacity={0.7}
          >
          {reply.emoji && (
            <Text style={styles.emoji}>{reply.emoji}</Text>
          )}
          <Text
            style={[
              styles.replyText,
              { color: theme.textPrimary },
            ]}
            numberOfLines={1}
          >
            {reply.text}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    backgroundColor: 'rgba(0,0,0,0)', // Fully transparent rgba
  },
  scrollContent: {
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0)', // Fully transparent rgba
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4, // Reduced further
    borderRadius: 20,
    gap: 6,
    minHeight: 26, // Reduced to 26
    // Removed all borders and backgrounds - buttons are transparent
  },
  emoji: {
    fontSize: 16,
  },
  replyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// Export default quick replies for easy import
export const DEFAULT_QUICK_REPLIES_LIST = DEFAULT_QUICK_REPLIES;

