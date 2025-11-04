/**
 * Reply Preview Component
 * 
 * COMMENT: ADVANCED FEATURE - Copied from reference chat system
 * Purpose: Display reply preview in message bubble
 * Source: C:\Users\Admin\Desktop\chat\react-native-chat\src\components\ReplyPreview.js
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

interface ReplyPreviewProps {
  message: {
    replyTo?: {
      id?: string;
      _id?: string;
      text?: string;
      user?: {
        name?: string;
        _id?: string;
      };
      image?: string;
      audio?: string;
      video?: string;
      type?: string;
    };
    [key: string]: any;
  };
  onPress?: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onPress }) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  if (!message || !message.replyTo) return null;

  const replyToMessage = message.replyTo;

  const getPreviewText = () => {
    if (replyToMessage.text) {
      return replyToMessage.text;
    }
    if (replyToMessage.image) {
      return isRTL ? '📷 صورة' : '📷 Image';
    }
    if (replyToMessage.audio) {
      return isRTL ? '🎤 رسالة صوتية' : '🎤 Voice Note';
    }
    if (replyToMessage.video) {
      return isRTL ? '🎥 فيديو' : '🎥 Video';
    }
    if (replyToMessage.type === 'FILE' || replyToMessage.type === 'file') {
      return isRTL ? '📄 ملف' : '📄 File';
    }
    return isRTL ? 'وسائط' : 'Media';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.primary + '15' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.replyBar, { backgroundColor: theme.primary }]} />
      <View style={styles.content}>
        <Text style={[styles.replyToName, { color: theme.primary }]} numberOfLines={1}>
          {replyToMessage.user?.name || 'User'}
        </Text>
        <Text style={[styles.replyToText, { color: theme.textSecondary }]} numberOfLines={1}>
          {getPreviewText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  replyBar: {
    width: 3,
    marginRight: 10,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  replyToName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  replyToText: {
    fontSize: 12,
  },
});



