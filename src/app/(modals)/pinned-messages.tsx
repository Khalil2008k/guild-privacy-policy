/**
 * Pinned Messages Screen
 * View all pinned messages in a chat
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { ChatMessage } from '@/components/ChatMessage';
import { Pin, ArrowLeft } from 'lucide-react-native';
import { logger } from '@/utils/logger';
import { CustomAlertService } from '@/services/CustomAlertService';

export default function PinnedMessagesScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId: string }>();
  const chatId = params.chatId || '';

  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (chatId) {
      loadPinnedMessages();
    }
  }, [chatId]);

  const loadPinnedMessages = async () => {
    try {
      setLoading(true);
      const messages = await chatService.getPinnedMessages(chatId);
      setPinnedMessages(messages);
    } catch (error) {
      logger.error('Error loading pinned messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل الرسائل المثبتة' : 'Failed to load pinned messages',
        isRTL
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPinnedMessages();
    setRefreshing(false);
  };

  const handleMessagePress = (message: any) => {
    // Navigate to chat and scroll to message
    router.push({
      pathname: '/(modals)/chat/[jobId]',
      params: { 
        jobId: chatId,
        scrollToMessageId: message.id 
      }
    });
  };

  const handlePin = async (messageId: string) => {
    if (!user?.uid) return;
    
    try {
      await chatService.pinMessage(chatId, messageId, user.uid, false);
      // Remove from list
      setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم إلغاء تثبيت الرسالة' : 'Message unpinned',
        isRTL
      );
    } catch (error) {
      logger.error('Error unpinning message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إلغاء تثبيت الرسالة' : 'Failed to unpin message',
        isRTL
      );
    }
  };

  if (loading && pinnedMessages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'الرسائل المثبتة' : 'Pinned Messages'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Pin size={20} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'الرسائل المثبتة' : 'Pinned Messages'}
          </Text>
          {pinnedMessages.length > 0 && (
            <Text style={[styles.headerCount, { color: theme.textSecondary }]}>
              ({pinnedMessages.length})
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {pinnedMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Pin size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL ? 'لا توجد رسائل مثبتة' : 'No pinned messages'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            {isRTL ? 'قم بتثبيت رسالة مهمة لعرضها هنا' : 'Pin an important message to view it here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pinnedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleMessagePress(item)}
              style={[styles.messageItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
              activeOpacity={0.7}
            >
              <ChatMessage
                message={item}
                isOwnMessage={item.senderId === user?.uid}
                currentUserId={user?.uid}
                onPin={handlePin}
              />
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerCount: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  messageItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});






