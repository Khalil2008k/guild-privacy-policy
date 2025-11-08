/**
 * Starred Messages Screen
 * View all starred messages by the current user
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
import { Star, ArrowLeft } from 'lucide-react-native';
import { logger } from '@/utils/logger';
import { CustomAlertService } from '@/services/CustomAlertService';

export default function StarredMessagesScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [starredMessages, setStarredMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadStarredMessages();
    }
  }, [user?.uid]);

  const loadStarredMessages = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const messages = await chatService.getStarredMessages(user.uid);
      setStarredMessages(messages);
    } catch (error) {
      logger.error('Error loading starred messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل الرسائل المميزة' : 'Failed to load starred messages',
        isRTL
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStarredMessages();
    setRefreshing(false);
  };

  const handleMessagePress = (message: any) => {
    // Navigate to chat and scroll to message
    router.push({
      pathname: '/(modals)/chat/[jobId]',
      params: { 
        jobId: message.chatId,
        scrollToMessageId: message.id 
      }
    });
  };

  const handleStar = async (messageId: string, chatId: string) => {
    if (!user?.uid) return;
    
    try {
      await chatService.starMessage(chatId, messageId, user.uid, false);
      // Remove from list
      setStarredMessages(prev => prev.filter(m => m.id !== messageId));
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم إلغاء تميز الرسالة' : 'Message unstarred',
        isRTL
      );
    } catch (error) {
      logger.error('Error unstarring message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إلغاء تميز الرسالة' : 'Failed to unstar message',
        isRTL
      );
    }
  };

  if (loading && starredMessages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'الرسائل المميزة' : 'Starred Messages'}
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
          <Star size={20} color="#FFD700" fill="#FFD700" />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'الرسائل المميزة' : 'Starred Messages'}
          </Text>
          {starredMessages.length > 0 && (
            <Text style={[styles.headerCount, { color: theme.textSecondary }]}>
              ({starredMessages.length})
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {starredMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Star size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL ? 'لا توجد رسائل مميزة' : 'No starred messages'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            {isRTL ? 'قم بتمييز رسالة مهمة لعرضها هنا' : 'Star an important message to view it here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={starredMessages}
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
                onStar={() => handleStar(item.id, item.chatId)}
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







