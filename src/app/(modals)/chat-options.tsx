import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useChat } from '../../contexts/ChatContext';
import { chatOptionsService } from '../../services/chatOptionsService';
import * as Haptics from 'expo-haptics';
import { 
  BellOff, 
  Bell, 
  Ban, 
  Flag, 
  LogOut, 
  Trash2,
  Check,
  X as XIcon,
} from 'lucide-react-native';

const FONT_FAMILY = 'Signika Negative SC';

interface ChatOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  chatId: string | number;
  chatType: 'guild' | 'direct';
}

export default function ChatOptionsModal({ visible, onClose, chatId, chatType }: ChatOptionsModalProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Load chat options state
  useEffect(() => {
    if (visible && chatId) {
      loadChatOptions();
    }
  }, [visible, chatId]);

  const loadChatOptions = async () => {
    try {
      // Get current user ID from auth context
      const userId = 'current-user-id'; // TODO: Get from useAuth()
      
      const [mutedStatus, blockedStatus] = await Promise.all([
        chatOptionsService.isChatMuted(String(chatId), userId),
        // For blocked, we need the other user's ID, which we don't have here
        // So we'll skip it for now
        Promise.resolve(false)
      ]);
      
      setIsMuted(mutedStatus);
      setIsBlocked(blockedStatus);
    } catch (error) {
      console.error('Error loading chat options:', error);
    }
  };

  const handleMute = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const action = isMuted ? 'unmute' : 'mute';
    const title = isRTL 
      ? (isMuted ? 'إلغاء كتم الإشعارات' : 'كتم الإشعارات')
      : (isMuted ? 'Unmute Notifications' : 'Mute Notifications');
    const message = isRTL
      ? (isMuted ? 'هل تريد استقبال الإشعارات من هذه المحادثة؟' : 'هل تريد كتم الإشعارات من هذه المحادثة؟')
      : (isMuted ? 'Do you want to receive notifications from this chat?' : 'Do you want to mute notifications from this chat?');

    CustomAlertService.showConfirmation(
      title,
      message,
      async () => {
        setIsLoading(true);
        try {
          const userId = 'current-user-id'; // TODO: Get from useAuth()
          
          if (isMuted) {
            await chatOptionsService.unmuteChat(String(chatId), userId);
          } else {
            await chatOptionsService.muteChat(String(chatId), userId, 'forever');
          }
          
          setIsMuted(!isMuted);
          CustomAlertService.showSuccess(
            isRTL ? 'نجح' : 'Success',
            isRTL 
              ? (isMuted ? 'تم إلغاء كتم الإشعارات' : 'تم كتم الإشعارات')
              : (isMuted ? 'Notifications unmuted' : 'Notifications muted')
          );
          onClose();
        } catch (error) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل تحديث إعدادات الإشعارات' : 'Failed to update notification settings'
          );
        } finally {
          setIsLoading(false);
        }
      },
      undefined,
      isRTL
    );
  };

  const handleBlock = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const action = isBlocked ? 'unblock' : 'block';
    const title = isRTL
      ? (isBlocked ? 'إلغاء حظر المستخدم' : 'حظر المستخدم')
      : (isBlocked ? 'Unblock User' : 'Block User');
    const message = isRTL
      ? (isBlocked ? 'هل تريد إلغاء حظر هذا المستخدم؟' : 'هل تريد حظر هذا المستخدم؟ لن تتمكن من تلقي رسائل منه.')
      : (isBlocked ? 'Do you want to unblock this user?' : 'Do you want to block this user? You will not receive messages from them.');

    CustomAlertService.showConfirmation(
      title,
      message,
      async () => {
        setIsLoading(true);
        try {
          const userId = 'current-user-id'; // TODO: Get from useAuth()
          const otherUserId = 'other-user-id'; // TODO: Extract from chat
          
          if (isBlocked) {
            await chatOptionsService.unblockUser(userId, otherUserId);
          } else {
            await chatOptionsService.blockUser(userId, otherUserId);
          }
          
          setIsBlocked(!isBlocked);
          CustomAlertService.showSuccess(
            isRTL ? 'نجح' : 'Success',
            isRTL
              ? (isBlocked ? 'تم إلغاء حظر المستخدم' : 'تم حظر المستخدم')
              : (isBlocked ? 'User unblocked' : 'User blocked')
          );
          onClose();
        } catch (error) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل تحديث حالة الحظر' : 'Failed to update block status'
          );
        } finally {
          setIsLoading(false);
        }
      },
      undefined,
      isRTL
    );
  };

  const handleLeave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    CustomAlertService.showConfirmation(
      isRTL ? 'مغادرة المحادثة' : 'Leave Chat',
      isRTL 
        ? 'هل أنت متأكد من مغادرة هذه المحادثة؟ لن تتمكن من رؤية الرسائل الجديدة.'
        : 'Are you sure you want to leave this chat? You will no longer see new messages.',
      async () => {
        setIsLoading(true);
        try {
          const userId = 'current-user-id'; // TODO: Get from useAuth()
          await chatOptionsService.deleteChat(String(chatId), userId);
          CustomAlertService.showSuccess(
            isRTL ? 'نجح' : 'Success',
            isRTL ? 'تم مغادرة المحادثة' : 'Left chat successfully'
          );
          onClose();
        } catch (error) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل مغادرة المحادثة' : 'Failed to leave chat'
          );
        } finally {
          setIsLoading(false);
        }
      },
      undefined,
      isRTL
    );
  };

  const handleClearHistory = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    CustomAlertService.showConfirmation(
      isRTL ? 'مسح السجل' : 'Clear History',
      isRTL
        ? 'هل تريد مسح سجل المحادثة؟ هذا الإجراء لا يمكن التراجع عنه.'
        : 'Do you want to clear chat history? This action cannot be undone.',
      async () => {
        setIsLoading(true);
        try {
          const userId = 'current-user-id'; // TODO: Get from useAuth()
          await chatOptionsService.clearChatHistory(String(chatId), userId);
          CustomAlertService.showSuccess(
            isRTL ? 'نجح' : 'Success',
            isRTL ? 'تم مسح السجل' : 'History cleared'
          );
          onClose();
        } catch (error) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل مسح السجل' : 'Failed to clear history'
          );
        } finally {
          setIsLoading(false);
        }
      },
      undefined,
      isRTL
    );
  };

  const options = chatType === 'guild' ? [
    { 
      id: 'mute', 
      label: isRTL ? (isMuted ? 'إلغاء كتم الإشعارات' : 'كتم الإشعارات') : (isMuted ? 'Unmute Notifications' : 'Mute Notifications'),
      IconComponent: isMuted ? Bell : BellOff,
      action: handleMute,
      active: isMuted
    },
    { 
      id: 'clear', 
      label: isRTL ? 'مسح السجل' : 'Clear History',
      IconComponent: Trash2,
      action: handleClearHistory,
      warning: true
    },
    { 
      id: 'leave', 
      label: isRTL ? 'مغادرة المحادثة' : 'Leave Chat',
      IconComponent: LogOut,
      action: handleLeave,
      danger: true
    },
  ] : [
    { 
      id: 'mute', 
      label: isRTL ? (isMuted ? 'إلغاء كتم الإشعارات' : 'كتم الإشعارات') : (isMuted ? 'Unmute Notifications' : 'Mute Notifications'),
      IconComponent: isMuted ? Bell : BellOff,
      action: handleMute,
      active: isMuted
    },
    { 
      id: 'clear', 
      label: isRTL ? 'مسح السجل' : 'Clear History',
      IconComponent: Trash2,
      action: handleClearHistory,
      warning: true
    },
    { 
      id: 'block', 
      label: isRTL ? (isBlocked ? 'إلغاء حظر المستخدم' : 'حظر المستخدم') : (isBlocked ? 'Unblock User' : 'Block User'),
      IconComponent: Ban,
      action: handleBlock,
      danger: true,
      active: isBlocked
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={[styles.modalContent, { backgroundColor: theme.surface }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'خيارات المحادثة' : 'Chat Options'}
          </Text>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}

          {options.map((option) => {
            const IconComponent = option.IconComponent;
            const iconColor = option.danger 
              ? theme.error 
              : option.warning
              ? theme.warning
              : option.active
              ? theme.primary
              : theme.textPrimary;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  { borderColor: theme.border },
                  (option.danger || option.warning) && styles.dangerItem,
                  option.active && [styles.activeItem, { backgroundColor: theme.primary + '10' }]
                ]}
                onPress={option.action}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <IconComponent 
                  size={22} 
                  color={iconColor} 
                />
                <Text style={[
                  styles.optionText,
                  { color: iconColor }
                ]}>
                  {option.label}
                </Text>
                {option.active && (
                  <Check size={18} color={theme.primary} style={styles.activeCheck} />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.primary + '20' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelText, { color: theme.primary }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  activeItem: {
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  activeCheck: {
    marginLeft: 'auto',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 24,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
});




