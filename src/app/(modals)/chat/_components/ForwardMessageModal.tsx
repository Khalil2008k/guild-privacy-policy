/**
 * Forward Message Modal Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Purpose: Modal for forwarding messages to selected chats
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Forward, CheckCircle, Circle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { logger } from '@/utils/logger';
import { CustomAlertService } from '@/services/CustomAlertService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Chat, Message } from '@/services/chatService';

interface ForwardMessageModalProps {
  visible: boolean;
  onClose: () => void;
  message: Message & {
    text?: string;
    attachments?: string[];
    type?: string;
    chatId?: string;
  } | null;
  onForward: (message: Message, targetChatIds: string[]) => Promise<void>;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  visible,
  onClose,
  message,
  onForward,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (visible && user?.uid) {
      loadChats();
    } else {
      setSelectedChatIds([]);
      setChats([]);
    }
  }, [visible, user?.uid]);

  const loadChats = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      
      // Get all chats where user is a participant
      const chatsRef = collection(db, 'chats');
      const chatsQuery = query(
        chatsRef,
        where('participants', 'array-contains', user.uid),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(chatsQuery);
      const chatsList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Chat))
        .filter(chat => chat.id !== message?.chatId); // Exclude current chat

      setChats(chatsList);
    } catch (error) {
      logger.error('Error loading chats for forwarding:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل المحادثات' : 'Failed to load chats',
        isRTL
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleChatSelection = (chatId: string) => {
    setSelectedChatIds(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (!message || selectedChatIds.length === 0) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى اختيار محادثة واحدة على الأقل' : 'Please select at least one chat',
        isRTL
      );
      return;
    }

    try {
      setForwarding(true);
      await onForward(message, selectedChatIds);
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم إعادة توجيه الرسالة إلى ${selectedChatIds.length} محادثة`
          : `Message forwarded to ${selectedChatIds.length} chat(s)`,
        isRTL
      );
      
      setSelectedChatIds([]);
      onClose();
    } catch (error) {
      logger.error('Error forwarding message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إعادة توجيه الرسالة' : 'Failed to forward message',
        isRTL
      );
    } finally {
      setForwarding(false);
    }
  };

  const getChatName = (chat: Chat): string => {
    if (chat.jobId) {
      return chat.name || `Job Chat ${chat.jobId}`;
    }
    if (chat.guildId) {
      return chat.name || `Guild Chat ${chat.guildId}`;
    }
    
    // Direct chat - get other participant's name
    if (chat.participantNames && user?.uid) {
      const otherParticipant = chat.participants?.find(p => p !== user.uid);
      if (otherParticipant && chat.participantNames[otherParticipant]) {
        return chat.participantNames[otherParticipant];
      }
    }
    
    return chat.name || 'Unknown Chat';
  };

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface, maxHeight: '90%' }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ArrowLeft size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Forward size={20} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {isRTL ? 'إعادة توجيه الرسالة' : 'Forward Message'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Message Preview */}
          <View style={[styles.previewContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'معاينة الرسالة:' : 'Message Preview:'}
            </Text>
            <View style={[styles.previewMessage, { backgroundColor: theme.surface }]}>
              {message.type === 'IMAGE' || message.type === 'FILE' || message.type === 'VOICE' ? (
                <Text style={[styles.previewText, { color: theme.textSecondary }]}>
                  {isRTL ? 'رسالة وسائط' : 'Media message'}
                </Text>
              ) : (
                <Text style={[styles.previewText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {message.text || (isRTL ? 'رسالة' : 'Message')}
                </Text>
              )}
            </View>
          </View>

          {/* Chats List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {isRTL ? 'جاري التحميل...' : 'Loading chats...'}
              </Text>
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Forward size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {isRTL ? 'لا توجد محادثات متاحة' : 'No chats available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedChatIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.chatItem,
                      { backgroundColor: theme.surface, borderBottomColor: theme.border },
                      isSelected && { backgroundColor: theme.primary + '20' }
                    ]}
                    onPress={() => toggleChatSelection(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.chatInfo}>
                      <Text style={[styles.chatName, { color: theme.textPrimary }]}>
                        {getChatName(item)}
                      </Text>
                      {item.lastMessage && (
                        <Text style={[styles.chatLastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
                          {typeof item.lastMessage === 'string' 
                            ? item.lastMessage 
                            : item.lastMessage.text || ''}
                        </Text>
                      )}
                    </View>
                    {isSelected ? (
                      <CheckCircle size={24} color={theme.primary} fill={theme.primary} />
                    ) : (
                      <Circle size={24} color={theme.border} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              {selectedChatIds.length > 0 
                ? (isRTL 
                    ? `${selectedChatIds.length} محادثة محددة`
                    : `${selectedChatIds.length} chat(s) selected`)
                : (isRTL ? 'اختر محادثات' : 'Select chats')}
            </Text>
            <TouchableOpacity
              style={[
                styles.forwardButton,
                { backgroundColor: theme.primary },
                (selectedChatIds.length === 0 || forwarding) && { opacity: 0.5 }
              ]}
              onPress={handleForward}
              disabled={selectedChatIds.length === 0 || forwarding}
            >
              {forwarding ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={[styles.forwardButtonText, { color: '#000000' }]}>
                  {isRTL ? 'إعادة التوجيه' : 'Forward'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
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
  previewContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewMessage: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatLastMessage: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  forwardButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forwardButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForwardMessageModal;

