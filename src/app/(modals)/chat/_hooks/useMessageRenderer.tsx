/**
 * useMessageRenderer Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1724-1761)
 * Purpose: Handle message rendering logic, date separators, and seen indicators
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/components/ChatMessage';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

interface UseMessageRendererOptions {
  messages: any[];
  userId: string | null;
  isAdmin: boolean;
  chatInfo: any;
  onEdit: (messageId: string, currentText: string) => void;
  onDelete: (messageId: string) => Promise<void>;
  onViewHistory: (messageId: string) => void;
  onDownload: (fileUrl: string, fileName: string, messageType: string) => Promise<void>;
}

interface UseMessageRendererReturn {
  renderMessage: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  shouldShowDateSeparator: (message: any, previousMessage: any | null) => boolean;
  formatDateSeparator: (date: Date) => string;
  isMessageSeenByAll: (message: any) => boolean;
}

export const useMessageRenderer = ({
  messages,
  userId,
  isAdmin,
  chatInfo,
  onEdit,
  onDelete,
  onViewHistory,
  onDownload,
}: UseMessageRendererOptions): UseMessageRendererReturn => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  // Format date for separator
  const formatDateSeparator = useCallback((date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    
    // Check if same day
    if (messageDate.toDateString() === today.toDateString()) {
      return isRTL ? 'اليوم' : 'Today';
    }
    
    // Check if yesterday
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return isRTL ? 'أمس' : 'Yesterday';
    }
    
    // Format as date
    return messageDate.toLocaleDateString(isRTL ? 'ar' : 'en', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [isRTL]);

  // Check if should show date separator
  const shouldShowDateSeparator = useCallback((message: any, previousMessage: any | null): boolean => {
    if (!previousMessage) return true;
    
    const messageDate = message.createdAt?.toDate?.() || new Date(message.createdAt);
    const previousDate = previousMessage.createdAt?.toDate?.() || new Date(previousMessage.createdAt);
    
    // Show separator if messages are on different days
    return messageDate.toDateString() !== previousDate.toDateString();
  }, []);

  // Check if message is seen by all participants
  const isMessageSeenByAll = useCallback((message: any): boolean => {
    if (!message.readBy || !chatInfo?.participants) return false;
    
    const messageCreatedAt = message.createdAt?.toDate?.() || new Date(message.createdAt);
    const readBy = message.readBy || {};
    
    // Check if all participants (except sender) have read the message
    return chatInfo.participants
      .filter((participantId: string) => participantId !== message.senderId)
      .every((participantId: string) => {
        const readTime = readBy[participantId];
        return readTime && readTime.toDate() > messageCreatedAt;
      });
  }, [chatInfo]);

  // Render individual message
  const renderMessage = useCallback(({ item, index }: { item: any; index: number }) => {
    const isOwnMessage = item.senderId === userId;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);
    
    return (
      <View key={item.id}>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={[styles.dateSeparatorLine, { backgroundColor: theme.border }]} />
            <View style={[styles.dateSeparatorBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.dateSeparatorText, { color: theme.textSecondary }]}>
                {formatDateSeparator(item.createdAt?.toDate?.() || new Date(item.createdAt))}
              </Text>
            </View>
            <View style={[styles.dateSeparatorLine, { backgroundColor: theme.border }]} />
          </View>
        )}
        <ChatMessage
          message={item}
          isOwnMessage={isOwnMessage}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewHistory={onViewHistory}
          onDownload={onDownload}
        />
        {/* Show "Seen" indicator for latest sent message */}
        {isOwnMessage && index === messages.length - 1 && (
          <View style={styles.seenIndicator}>
            <Text style={[styles.seenText, { color: theme.textSecondary }]}>
              {isMessageSeenByAll(item) ? (isRTL ? 'تمت المشاهدة' : 'Seen') : (isRTL ? 'تم الإرسال' : 'Sent')}
            </Text>
          </View>
        )}
      </View>
    );
  }, [messages, userId, isAdmin, isRTL, theme, chatInfo, onEdit, onDelete, onViewHistory, onDownload, shouldShowDateSeparator, formatDateSeparator, isMessageSeenByAll]);

  return {
    renderMessage,
    shouldShowDateSeparator,
    formatDateSeparator,
    isMessageSeenByAll,
  };
};

const styles = StyleSheet.create({
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  seenIndicator: {
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 4,
  },
  seenText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default useMessageRenderer;
