/**
 * useChatOptions Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1456-1615)
 * Purpose: Handle chat options like mute, block, report, delete chat, view profile
 */

import { useCallback } from 'react';
import { router } from 'expo-router';
import { chatOptionsService } from '@/services/chatOptionsService';
import { CustomAlertService } from '@/services/CustomAlertService';
import { logger } from '@/utils/logger';

interface UseChatOptionsOptions {
  chatId: string;
  userId: string | null;
  otherUser: { id: string; name?: string } | null;
  isRTL: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isBlocked: boolean;
  setIsBlocked: (blocked: boolean) => void;
  setShowOptionsMenu: (show: boolean) => void;
  setShowMuteOptions: (show: boolean) => void;
}

interface UseChatOptionsReturn {
  handleViewProfile: () => void;
  handleMuteChat: () => void;
  handleMuteDuration: (duration: 'hour' | 'day' | 'week' | 'forever') => Promise<void>;
  handleUnmute: () => Promise<void>;
  handleBlockUser: () => void;
  handleUnblockUser: () => Promise<void>;
  handleReportUser: () => void;
  handleDeleteChat: () => void;
}

export const useChatOptions = ({
  chatId,
  userId,
  otherUser,
  isRTL,
  isMuted,
  setIsMuted,
  isBlocked,
  setIsBlocked,
  setShowOptionsMenu,
  setShowMuteOptions,
}: UseChatOptionsOptions): UseChatOptionsReturn => {
  // View profile
  const handleViewProfile = useCallback(() => {
    setShowOptionsMenu(false);
    if (otherUser) {
      // Navigate to user profile with user ID
      router.push(`/(modals)/user-profile/${otherUser.id}` as any);
    }
  }, [otherUser, setShowOptionsMenu]);

  // Mute chat (show mute options)
  const handleMuteChat = useCallback(() => {
    setShowOptionsMenu(false);
    setShowMuteOptions(true);
  }, [setShowOptionsMenu, setShowMuteOptions]);

  // Mute chat with duration
  const handleMuteDuration = useCallback(async (duration: 'hour' | 'day' | 'week' | 'forever') => {
    setShowMuteOptions(false);
    if (!userId) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'المستخدم غير مسجل الدخول' : 'User not logged in');
      return;
    }

    try {
      logger.debug('[ChatScreen] Muting chat with params:', { chatId, userId, duration });
      await chatOptionsService.muteChat(chatId, userId, duration);
      setIsMuted(true);
      
      const durationText = {
        hour: isRTL ? 'لمدة ساعة' : 'for 1 hour',
        day: isRTL ? 'لمدة يوم' : 'for 1 day',
        week: isRTL ? 'لمدة أسبوع' : 'for 1 week',
        forever: isRTL ? 'للأبد' : 'forever',
      }[duration];

      CustomAlertService.showSuccess(
        isRTL ? 'تم الكتم' : 'Muted',
        `${isRTL ? 'تم كتم الإشعارات' : 'Notifications muted'} ${durationText}`
      );
    } catch (error: any) {
      logger.error('[ChatScreen] Mute error:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        `${isRTL ? 'فشل كتم الإشعارات' : 'Failed to mute notifications'}: ${error.message || 'Unknown error'}`
      );
    }
  }, [chatId, userId, isRTL, setIsMuted, setShowMuteOptions]);

  // Unmute chat
  const handleUnmute = useCallback(async () => {
    if (!userId) return;

    try {
      await chatOptionsService.unmuteChat(chatId, userId);
      setIsMuted(false);
      CustomAlertService.showSuccess(
        isRTL ? 'تم إلغاء الكتم' : 'Unmuted',
        isRTL ? 'تم إلغاء كتم الإشعارات' : 'Notifications unmuted'
      );
    } catch (error) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إلغاء كتم الإشعارات' : 'Failed to unmute notifications'
      );
    }
  }, [chatId, userId, isRTL, setIsMuted]);

  // Block user
  const handleBlockUser = useCallback(() => {
    setShowOptionsMenu(false);
    if (!otherUser) return;

    CustomAlertService.showConfirmation(
      isRTL ? 'حظر المستخدم' : 'Block User',
      isRTL ? 'هل تريد حظر هذا المستخدم؟ لن تتمكن من تلقي رسائل منه.' : 'Do you want to block this user? You will not receive messages from them.',
      async () => {
        if (!userId) return;
        try {
          logger.debug('[ChatScreen] Blocking user:', { blockerId: userId, blockedUserId: otherUser.id });
          await chatOptionsService.blockUser(userId, otherUser.id);
          setIsBlocked(true);
          CustomAlertService.showSuccess(
            isRTL ? 'تم الحظر' : 'Blocked',
            isRTL ? 'تم حظر المستخدم بنجاح' : 'User blocked successfully'
          );
        } catch (error: any) {
          logger.error('[ChatScreen] Block error:', error);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            `${isRTL ? 'فشل حظر المستخدم' : 'Failed to block user'}: ${error.message || 'Unknown error'}`
          );
        }
      },
      undefined,
      isRTL
    );
  }, [chatId, userId, otherUser, isRTL, setIsBlocked, setShowOptionsMenu]);

  // Unblock user
  const handleUnblockUser = useCallback(async () => {
    if (!userId || !otherUser) return;

    try {
      await chatOptionsService.unblockUser(userId, otherUser.id);
      setIsBlocked(false);
      CustomAlertService.showSuccess(
        isRTL ? 'تم إلغاء الحظر' : 'Unblocked',
        isRTL ? 'تم إلغاء حظر المستخدم' : 'User unblocked'
      );
    } catch (error) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إلغاء حظر المستخدم' : 'Failed to unblock user'
      );
    }
  }, [userId, otherUser, isRTL, setIsBlocked]);

  // Report user
  const handleReportUser = useCallback(() => {
    setShowOptionsMenu(false);
    if (!otherUser) return;

    CustomAlertService.showConfirmation(
      isRTL ? 'الإبلاغ عن المستخدم' : 'Report User',
      isRTL ? 'هل تريد الإبلاغ عن هذا المستخدم للمسؤولين؟' : 'Do you want to report this user to administrators?',
      () => {
        router.push({
          pathname: '/(modals)/dispute-filing-form',
          params: { reportedUserId: otherUser.id, chatId }
        });
      },
      undefined,
      isRTL
    );
  }, [chatId, otherUser, isRTL, setShowOptionsMenu]);

  // Delete chat
  const handleDeleteChat = useCallback(() => {
    setShowOptionsMenu(false);

    CustomAlertService.showConfirmation(
      isRTL ? 'حذف المحادثة' : 'Delete Chat',
      isRTL ? 'هل تريد حذف هذه المحادثة؟ سيتم حذفها من قائمتك فقط.' : 'Do you want to delete this chat? It will only be removed from your list.',
      async () => {
        if (!userId) return;
        try {
          logger.debug('[ChatScreen] Deleting chat:', { chatId, userId });
          await chatOptionsService.deleteChat(chatId, userId);
          CustomAlertService.showSuccess(
            isRTL ? 'تم الحذف' : 'Deleted',
            isRTL ? 'تم حذف المحادثة' : 'Chat deleted'
          );
          router.back();
        } catch (error: any) {
          logger.error('[ChatScreen] Delete error:', error);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            `${isRTL ? 'فشل حذف المحادثة' : 'Failed to delete chat'}: ${error.message || 'Unknown error'}`
          );
        }
      },
      undefined,
      isRTL
    );
  }, [chatId, userId, isRTL, setShowOptionsMenu]);

  return {
    handleViewProfile,
    handleMuteChat,
    handleMuteDuration,
    handleUnmute,
    handleBlockUser,
    handleUnblockUser,
    handleReportUser,
    handleDeleteChat,
  };
};

export default useChatOptions;
