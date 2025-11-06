/**
 * Read Receipts Screen
 * View who read a message and when they read it
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { CheckCheck, ArrowLeft, User, Clock } from 'lucide-react-native';
import { logger } from '@/utils/logger';
import { CustomAlertService } from '@/services/CustomAlertService';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface ReadReceipt {
  userId: string;
  userName?: string;
  readAt: Date;
}

export default function ReadReceiptsScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId: string; messageId: string }>();
  const chatId = params.chatId || '';
  const messageId = params.messageId || '';

  const [readReceipts, setReadReceipts] = useState<ReadReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState<string>('');

  useEffect(() => {
    if (chatId && messageId) {
      loadReadReceipts();
    }
  }, [chatId, messageId]);

  const loadReadReceipts = async () => {
    try {
      setLoading(true);
      
      // Get message document
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'لم يتم العثور على الرسالة' : 'Message not found',
          isRTL
        );
        router.back();
        return;
      }

      const messageData = messageDoc.data();
      setMessageText(messageData.text || '');

      // Get readBy data
      const readBy = messageData.readBy || {};
      const receipts: ReadReceipt[] = [];

      // Fetch user names for each reader
      for (const [userId, readTimestamp] of Object.entries(readBy)) {
        try {
          // Get user document
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          let userName = 'Unknown';
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = userData.displayName || userData.name || userData.email || 'Unknown';
          }

          // Convert timestamp
          let readAt: Date;
          if (readTimestamp && typeof readTimestamp === 'object' && 'toDate' in readTimestamp) {
            readAt = (readTimestamp as Timestamp).toDate();
          } else if (readTimestamp instanceof Date) {
            readAt = readTimestamp;
          } else if (typeof readTimestamp === 'number') {
            readAt = new Date(readTimestamp);
          } else {
            readAt = new Date();
          }

          receipts.push({
            userId,
            userName,
            readAt,
          });
        } catch (error) {
          logger.error(`Error loading user ${userId}:`, error);
          // Add with default name
          receipts.push({
            userId,
            userName: 'Unknown',
            readAt: new Date(),
          });
        }
      }

      // Sort by read time (most recent first)
      receipts.sort((a, b) => b.readAt.getTime() - a.readAt.getTime());
      
      setReadReceipts(receipts);
    } catch (error) {
      logger.error('Error loading read receipts:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل إيصالات القراءة' : 'Failed to load read receipts',
        isRTL
      );
    } finally {
      setLoading(false);
    }
  };

  const formatReadTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return isRTL ? 'الآن' : 'Just now';
    } else if (minutes < 60) {
      return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    } else if (hours < 24) {
      return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    } else if (days < 7) {
      return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    } else {
      return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'إيصالات القراءة' : 'Read Receipts'}
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
          <CheckCheck size={20} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'إيصالات القراءة' : 'Read Receipts'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Message Preview */}
      {messageText && (
        <View style={[styles.messagePreview, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.messagePreviewLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'الرسالة:' : 'Message:'}
          </Text>
          <Text style={[styles.messagePreviewText, { color: theme.textPrimary }]} numberOfLines={2}>
            {messageText}
          </Text>
        </View>
      )}

      {/* Read Receipts List */}
      {readReceipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CheckCheck size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL ? 'لم يقرأ أحد الرسالة بعد' : 'No one has read this message yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={readReceipts}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View style={[styles.receiptItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '20' }]}>
                <User size={20} color={theme.primary} />
              </View>
              <View style={styles.receiptInfo}>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>
                  {item.userName}
                </Text>
                <View style={styles.timeContainer}>
                  <Clock size={12} color={theme.textSecondary} />
                  <Text style={[styles.readTime, { color: theme.textSecondary }]}>
                    {formatReadTime(item.readAt)}
                  </Text>
                  <Text style={[styles.readTimeDetail, { color: theme.textSecondary }]}>
                    {' • '}
                    {item.readAt.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <CheckCheck size={20} color={theme.primary} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          {isRTL 
            ? `${readReceipts.length} ${readReceipts.length === 1 ? 'قارئ' : 'قراء'}`
            : `${readReceipts.length} ${readReceipts.length === 1 ? 'reader' : 'readers'}`
          }
        </Text>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagePreview: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  messagePreviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  messagePreviewText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTime: {
    fontSize: 12,
  },
  readTimeDetail: {
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});






