/**
 * useChatActions Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 435-557, 1239-1279)
 * Purpose: Handle message actions like send, edit, delete, view history, and typing
 */

import { useCallback, useRef } from 'react';
import { chatService } from '@/services/chatService';
import { disputeLoggingService } from '@/services/disputeLoggingService';
import MessageNotificationService from '@/services/MessageNotificationService';
import MessageQueueService from '@/services/MessageQueueService';
import PresenceService from '@/services/PresenceService';
import { CustomAlertService } from '@/services/CustomAlertService';
import { logger } from '@/utils/logger';

interface UseChatActionsOptions {
  chatId: string;
  userId: string | null;
  jobId?: string;
  messages: any[];
  setMessages: (messages: any[]) => void;
  allMessages: any[];
  setAllMessages: (messages: any[]) => void;
  otherUser: { id: string } | null;
  isRTL: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editingText: string;
  setEditingText: (text: string) => void;
  onKeyboardHide?: () => void;
}

interface UseChatActionsReturn {
  handleSendMessage: () => Promise<void>;
  handleEditMessage: (messageId: string) => void;
  handleCancelEdit: () => void;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  handleViewHistory: (messageId: string) => void;
  handleTyping: () => void;
  handleKeyboardHide: () => void;
}

export const useChatActions = ({
  chatId,
  userId,
  jobId,
  messages,
  setMessages,
  allMessages,
  setAllMessages,
  otherUser,
  isRTL,
  inputText,
  setInputText,
  editingMessageId,
  setEditingMessageId,
  editingText,
  setEditingText,
  onKeyboardHide,
}: UseChatActionsOptions): UseChatActionsReturn => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const typingDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    if (!chatId) return;

    // Clear existing debounce timeout
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    // Start typing after 300ms debounce
    typingDebounceRef.current = setTimeout(() => {
      PresenceService.startTyping(chatId, userId!);
    }, 300);

    // Stop typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      PresenceService.stopTyping(chatId);
    }, 2000);
  }, [chatId, userId]);

  // Handle keyboard hide - stop typing immediately
  const handleKeyboardHide = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    PresenceService.stopTyping(chatId);
    
    if (onKeyboardHide) {
      onKeyboardHide();
    }
  }, [chatId, onKeyboardHide]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !userId) return;

    const messageText = inputText.trim();
    setInputText('');

    // Stop typing immediately when sending message
    handleKeyboardHide();

    try {
      if (editingMessageId) {
        // Edit existing message
        const originalMessage = messages.find(m => m.id === editingMessageId);
        await chatService.editMessage(chatId, editingMessageId, messageText);
        
        // Log edit for dispute resolution
        if (originalMessage?.content) {
          await disputeLoggingService.logEdit(
            editingMessageId,
            userId,
            originalMessage.content,
            messageText,
            'User edited message'
          );
        }
        
        setEditingMessageId(null);
        setEditingText('');
      } else {
        // COMMENT: PRODUCTION HARDENING - Task 3.5 - Handle message send with offline queue fallback
        // Add optimistic message immediately so sender sees it right away
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMessage = {
          id: tempId,
          tempId,
          chatId,
          senderId: userId,
          text: messageText,
          type: 'TEXT' as const,
          status: 'sending' as const,
          createdAt: new Date(),
          readBy: [userId!],
        };

        // Add optimistic message to UI immediately
        const updatedMessages = [...messages, optimisticMessage];
        const updatedAllMessages = [...allMessages, optimisticMessage];
        setMessages(updatedMessages);
        setAllMessages(updatedAllMessages);

        try {
          // Send new message
          const messageId = await chatService.sendMessage(chatId, messageText, userId);
          
          // Update optimistic message status to sent (will be updated to delivered/read by listener)
          const messageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
          if (messageIndex !== -1) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              status: 'sent' as const,
            };
            setMessages(updatedMessages);
          }
          
          // Trigger backend push notification
          try {
            await MessageNotificationService.triggerBackendNotification(chatId, userId, messageText);
          } catch (notificationError) {
            logger.warn('Failed to trigger backend notification:', notificationError);
          }
          
          // Log message for dispute resolution
          if (messageId && otherUser) {
            await disputeLoggingService.logMessage(
              messageId,
              chatId,
              userId,
              [otherUser.id],
              messageText,
              [],
              { jobId }
            );
          }
          
          // Note: The optimistic message will be replaced by the real message when Firestore listener receives it
          // The merge logic in the listener handles replacing tempId messages with real ones
        } catch (sendError: any) {
          // COMMENT: PRODUCTION HARDENING - Task 3.5 - Message failed to send, mark as failed instead of removing
          logger.error('Error sending message:', sendError);
          
          // Update optimistic message status to failed (don't remove, allow retry)
          const messageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
          if (messageIndex !== -1) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              status: 'failed' as const,
            };
            setMessages(updatedMessages);
            
            const allMessagesIndex = updatedAllMessages.findIndex(m => m.tempId === tempId);
            if (allMessagesIndex !== -1) {
              updatedAllMessages[allMessagesIndex] = {
                ...updatedAllMessages[allMessagesIndex],
                status: 'failed' as const,
              };
              setAllMessages(updatedAllMessages);
            }
          }
          
          // Check if message was added to queue
          const queueStatus = MessageQueueService.getQueueStatus();
          
          if (queueStatus.pending > 0 || queueStatus.retrying > 0) {
            // Message is in queue, will retry automatically
            CustomAlertService.showInfo(
              isRTL ? 'رسالة في الانتظار' : 'Message queued',
              isRTL 
                ? 'فشل إرسال الرسالة. سيتم إعادة المحاولة تلقائياً عند توفر الاتصال.' 
                : 'Failed to send message. Will retry automatically when connection is available.'
            );
          } else {
            // Queue failed too, show error with retry option
            CustomAlertService.showError(
              isRTL ? 'خطأ' : 'Error',
              isRTL 
                ? 'فشل إرسال الرسالة. اضغط على زر الإعادة للمحاولة مرة أخرى.' 
                : 'Failed to send message. Tap retry button to try again.'
            );
          }
        }
      }
    } catch (error) {
      // Error already handled in individual try-catch blocks
      logger.error('Error in handleSendMessage:', error);
    }
  }, [
    chatId,
    userId,
    jobId,
    messages,
    otherUser,
    isRTL,
    inputText,
    setInputText,
    editingMessageId,
    setEditingMessageId,
    setEditingText,
    handleKeyboardHide,
  ]);

  // Edit message
  const handleEditMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.senderId === userId) {
      setEditingMessageId(messageId);
      setEditingText(message.text || '');
    }
  }, [messages, userId, setEditingMessageId, setEditingText]);

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
  }, [setEditingMessageId, setEditingText]);

  // Delete message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!userId) return;

    try {
      const message = messages.find(m => m.id === messageId);
      await chatService.deleteMessage(chatId, messageId, userId);
      
      // Log deletion for dispute resolution
      if (message?.content) {
        await disputeLoggingService.logDeletion(
          messageId,
          userId,
          message.content,
          true,
          'User deleted message'
        );
      }
    } catch (error) {
      logger.error('Error deleting message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل حذف الرسالة' : 'Failed to delete message'
      );
    }
  }, [chatId, userId, messages, isRTL]);

  // View edit history (returns message, caller should handle modal state)
  const handleViewHistory = useCallback((messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    return message || null;
  }, [messages]);

  // Retry failed message
  const handleRetryMessage = useCallback(async (messageId: string, messageText: string) => {
    if (!userId || !chatId) return;

    // Find the failed message
    const failedMessage = messages.find(m => (m.tempId === messageId || m.id === messageId) && m.status === 'failed');
    if (!failedMessage) return;

    // Update status to sending
    const updatedMessages = messages.map(m => 
      (m.tempId === messageId || m.id === messageId) && m.status === 'failed'
        ? { ...m, status: 'sending' as const }
        : m
    );
    setMessages(updatedMessages);

    const updatedAllMessages = allMessages.map(m => 
      (m.tempId === messageId || m.id === messageId) && m.status === 'failed'
        ? { ...m, status: 'sending' as const }
        : m
    );
    setAllMessages(updatedAllMessages);

    try {
      // Retry sending the message
      const newMessageId = await chatService.sendMessage(chatId, messageText, userId);
      
      // Update status to sent (will be updated by listener)
      const finalMessages = updatedMessages.map(m => 
        (m.tempId === messageId || m.id === messageId) && m.status === 'sending'
          ? { ...m, status: 'sent' as const, id: newMessageId, tempId: undefined }
          : m
      );
      setMessages(finalMessages);

      const finalAllMessages = updatedAllMessages.map(m => 
        (m.tempId === messageId || m.id === messageId) && m.status === 'sending'
          ? { ...m, status: 'sent' as const, id: newMessageId, tempId: undefined }
          : m
      );
      setAllMessages(finalAllMessages);

      // Send notification
      if (otherUser) {
        try {
          await MessageNotificationService.sendMessageNotification(
            chatId,
            newMessageId,
            messageText,
            userId,
            otherUser.id
          );
        } catch (notificationError) {
          logger.warn('Failed to trigger backend notification:', notificationError);
        }
      }

      // Log message for dispute resolution
      if (newMessageId && otherUser) {
        await disputeLoggingService.logMessage(
          newMessageId,
          chatId,
          userId,
          [otherUser.id],
          messageText,
          [],
          { jobId }
        );
      }
    } catch (error) {
      logger.error('Error retrying message:', error);
      
      // Update status back to failed
      const failedMessages = updatedMessages.map(m => 
        (m.tempId === messageId || m.id === messageId) && m.status === 'sending'
          ? { ...m, status: 'failed' as const }
          : m
      );
      setMessages(failedMessages);

      const failedAllMessages = updatedAllMessages.map(m => 
        (m.tempId === messageId || m.id === messageId) && m.status === 'sending'
          ? { ...m, status: 'failed' as const }
          : m
      );
      setAllMessages(failedAllMessages);
      
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إعادة إرسال الرسالة' : 'Failed to retry message',
        isRTL
      );
    }
  }, [chatId, userId, messages, allMessages, setMessages, setAllMessages, otherUser, jobId, isRTL]);

  return {
    handleSendMessage,
    handleEditMessage,
    handleCancelEdit,
    handleDeleteMessage,
    handleViewHistory,
    handleTyping,
    handleKeyboardHide,
    handleRetryMessage,
  };
};

export default useChatActions;
