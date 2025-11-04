/**
 * useFileHandlers Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1282-1423)
 * Purpose: Handle file download, message refresh, and pagination (load more)
 */

import { useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { chatService } from '@/services/chatService';
import { CustomAlertService } from '@/services/CustomAlertService';
import { logger } from '@/utils/logger';

interface UseFileHandlersOptions {
  chatId: string;
  userId: string | null;
  isRTL: boolean;
  messages: any[];
  allMessages: any[];
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isRefreshing: boolean;
  scrollViewRef: React.RefObject<any>;
  // State setters
  setIsLoadingMore: (loading: boolean) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  setMessages: (messages: any[]) => void;
  setAllMessages: (messages: any[]) => void;
  setIsRefreshing: (refreshing: boolean) => void;
  initialLimit?: number;
}

interface UseFileHandlersReturn {
  handleDownloadFile: (url: string, filename: string) => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleLoadMore: () => Promise<void>;
}

export const useFileHandlers = ({
  chatId,
  userId,
  isRTL,
  messages,
  allMessages,
  isLoadingMore,
  hasMoreMessages,
  isRefreshing,
  scrollViewRef,
  setIsLoadingMore,
  setHasMoreMessages,
  setMessages,
  setAllMessages,
  setIsRefreshing,
  initialLimit = 50,
}: UseFileHandlersOptions): UseFileHandlersReturn => {
  
  // Download file or image
  const handleDownloadFile = useCallback(async (url: string, filename: string) => {
    try {
      // Determine if it's an image
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename) || url.includes('image');

      // Show loading
      CustomAlertService.showInfo(
        isRTL ? 'جاري التنزيل' : 'Downloading',
        isRTL ? (isImage ? 'جاري حفظ الصورة...' : 'جاري تنزيل الملف...') : (isImage ? 'Saving image...' : 'Downloading file...')
      );

      // Get document directory
      const docDir = '/tmp/';
      if (!docDir) {
        throw new Error('Document directory not available');
      }

      // Create safe filename
      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = docDir + safeFilename;

      // Download file
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: isImage ? 'image/*' : 'application/octet-stream',
            dialogTitle: isRTL ? (isImage ? 'حفظ الصورة' : 'مشاركة الملف') : (isImage ? 'Save Image' : 'Share File'),
          });
          
          CustomAlertService.showSuccess(
            isRTL ? 'تم' : 'Success',
            isRTL ? (isImage ? 'يمكنك الآن حفظ الصورة من خيارات المشاركة' : 'تم فتح خيارات المشاركة') : (isImage ? 'You can now save the image from share options' : 'Share options opened')
          );
        } else {
          CustomAlertService.showSuccess(
            isRTL ? 'تم التنزيل' : 'Downloaded',
            isRTL ? `تم حفظ ${isImage ? 'الصورة' : 'الملف'}` : `${isImage ? 'Image' : 'File'} saved successfully`
          );
        }
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      logger.error('Error downloading file:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل التنزيل' : 'Failed to download'
      );
    }
  }, [isRTL]);

  // Refresh messages with pagination support
  const handleRefresh = useCallback(async () => {
    if (!chatId || !userId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Reload initial messages
      const result = await chatService.getChatMessages(chatId, initialLimit);
      if (result.messages.length > 0) {
        setAllMessages(result.messages);
        setMessages(result.messages);
        setHasMoreMessages(result.hasMore);
      }
    } catch (error) {
      logger.error('Error refreshing messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديث الرسائل' : 'Failed to refresh messages'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [chatId, userId, isRefreshing, initialLimit, setAllMessages, setMessages, setHasMoreMessages, setIsRefreshing, isRTL]);

  // Load more messages (pagination)
  const handleLoadMore = useCallback(async () => {
    if (!chatId || !userId || isLoadingMore || !hasMoreMessages || messages.length === 0) {
      return;
    }

    setIsLoadingMore(true);

    try {
      // Get the oldest message timestamp
      const oldestMessage = messages[0];
      if (!oldestMessage || !oldestMessage.createdAt) {
        setHasMoreMessages(false);
        setIsLoadingMore(false);
        return;
      }

      // Convert to Firestore Timestamp if needed
      const { Timestamp } = await import('firebase/firestore');
      const lastTimestamp = oldestMessage.createdAt?.toMillis 
        ? oldestMessage.createdAt 
        : typeof oldestMessage.createdAt === 'number'
        ? Timestamp.fromMillis(oldestMessage.createdAt)
        : null;

      if (!lastTimestamp) {
        setHasMoreMessages(false);
        setIsLoadingMore(false);
        return;
      }

      // Load more messages
      const result = await chatService.loadMoreMessages(chatId, lastTimestamp, initialLimit);

      if (result.messages.length > 0) {
        // Prepend older messages to the list
        const updatedMessages = [...result.messages, ...messages];
        setAllMessages(updatedMessages);
        setMessages(updatedMessages);

        // Maintain scroll position (approximate)
        setTimeout(() => {
          const scrollOffset = scrollViewRef.current?.contentOffset?.y || 0;
          const estimatedHeightPerMessage = 60; // Approximate message height
          const newMessagesHeight = result.messages.length * estimatedHeightPerMessage;
          
          if (scrollViewRef.current && scrollOffset > 0) {
            scrollViewRef.current.scrollTo({
              y: scrollOffset + newMessagesHeight,
              animated: false,
            });
          }
        }, 100);
      }

      setHasMoreMessages(result.hasMore);
    } catch (error) {
      logger.error('Error loading more messages:', error);
      setHasMoreMessages(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, userId, isLoadingMore, hasMoreMessages, messages, allMessages, initialLimit, scrollViewRef, setAllMessages, setMessages, setHasMoreMessages, setIsLoadingMore]);

  return {
    handleDownloadFile,
    handleRefresh,
    handleLoadMore,
  };
};

export default useFileHandlers;
