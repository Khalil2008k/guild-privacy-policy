/**
 * Chat Options Modal Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1836-1925)
 * Purpose: Options menu for chat actions (view profile, search, mute, block, report, delete)
 */

import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { User, BellOff, Ban, Flag, Trash2, Search, Pin, Star, Image, Info, Clock, Palette, FileDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

interface ChatOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  isMuted: boolean;
  isBlocked: boolean;
  chatId?: string;
  onViewProfile: () => void;
  onSearchMessages: () => void;
  onViewPinnedMessages?: () => void;
  onViewStarredMessages?: () => void;
  onViewMediaGallery?: () => void;
  onViewChatInfo?: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onReport: () => void;
  onDeleteChat: () => void;
  onDisappearingMessages?: () => void;
  onChatTheme?: () => void;
  onExportChat?: () => void;
}

export const ChatOptionsModal: React.FC<ChatOptionsModalProps> = ({
  visible,
  onClose,
  isMuted,
  isBlocked,
  chatId,
  onViewProfile,
  onSearchMessages,
  onViewPinnedMessages,
  onViewStarredMessages,
  onViewMediaGallery,
  onViewChatInfo,
  onMute,
  onUnmute,
  onBlock,
  onUnblock,
  onReport,
  onDeleteChat,
  onDisappearingMessages,
  onChatTheme,
  onExportChat,
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
        <View style={[styles.optionsMenu, { backgroundColor: theme.surface }]}>
          <TouchableOpacity 
            style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={onViewProfile}
          >
            <User size={20} color={theme.textPrimary} />
            <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'عرض الملف الشخصي' : 'View Profile'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={onSearchMessages}
          >
            <Search size={20} color={theme.textPrimary} />
            <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'البحث في الرسائل' : 'Search Messages'}
            </Text>
          </TouchableOpacity>

          {chatId && onViewMediaGallery && (
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={onViewMediaGallery}
            >
              <Image size={20} color={theme.primary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'معرض الوسائط' : 'Media Gallery'}
              </Text>
            </TouchableOpacity>
          )}

          {chatId && onViewPinnedMessages && (
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={onViewPinnedMessages}
            >
              <Pin size={20} color={theme.primary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'الرسائل المثبتة' : 'Pinned Messages'}
              </Text>
            </TouchableOpacity>
          )}

          {onViewStarredMessages && (
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={onViewStarredMessages}
            >
              <Star size={20} color="#FFD700" fill="#FFD700" />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'الرسائل المميزة' : 'Starred Messages'}
              </Text>
            </TouchableOpacity>
          )}

          {chatId && onViewChatInfo && (
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={onViewChatInfo}
            >
              <Info size={20} color={theme.primary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'معلومات الدردشة' : 'Chat Info'}
              </Text>
            </TouchableOpacity>
          )}

          {chatId && onDisappearingMessages && (
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={onDisappearingMessages}
            >
              <Clock size={20} color={theme.primary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'رسائل تختفي' : 'Disappearing Messages'}
              </Text>
            </TouchableOpacity>
          )}

          {chatId && onChatTheme && (
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={onChatTheme}
            >
              <Palette size={20} color={theme.primary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'خلفية الدردشة' : 'Chat Theme'}
              </Text>
            </TouchableOpacity>
          )}

          {chatId && onExportChat && (
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={onExportChat}
            >
              <FileDown size={20} color={theme.primary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'تصدير المحادثة' : 'Export Chat'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={isMuted ? onUnmute : onMute}
          >
            <BellOff size={20} color={isMuted ? theme.primary : theme.textPrimary} />
            <Text style={[styles.optionText, { color: isMuted ? theme.primary : theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
              {isMuted 
                ? (isRTL ? 'إلغاء كتم الإشعارات' : 'Unmute Notifications')
                : (isRTL ? 'كتم الإشعارات' : 'Mute Notifications')
              }
            </Text>
            {isMuted && (
              <View style={[styles.statusBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.statusBadgeText}>{isRTL ? 'مكتوم' : 'Muted'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />

          <TouchableOpacity 
            style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={isBlocked ? onUnblock : onBlock}
          >
            <Ban size={20} color={isBlocked ? theme.error : theme.warning} />
            <Text style={[styles.optionText, { color: isBlocked ? theme.error : theme.warning, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
              {isBlocked
                ? (isRTL ? 'إلغاء حظر المستخدم' : 'Unblock User')
                : (isRTL ? 'حظر المستخدم' : 'Block User')
              }
            </Text>
            {isBlocked && (
              <View style={[styles.statusBadge, { backgroundColor: theme.error }]}>
                <Text style={styles.statusBadgeText}>{isRTL ? 'محظور' : 'Blocked'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={onReport}
          >
            <Flag size={20} color={theme.error} />
            <Text style={[styles.optionText, { color: theme.error, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'الإبلاغ عن المستخدم' : 'Report User'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={onDeleteChat}
          >
            <Trash2 size={20} color={theme.error} />
            <Text style={[styles.optionText, { color: theme.error, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'حذف المحادثة' : 'Delete Chat'}
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
  optionsMenu: {
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  optionItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
  },
  optionDivider: {
    height: 1,
    marginVertical: 8,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ChatOptionsModal;
