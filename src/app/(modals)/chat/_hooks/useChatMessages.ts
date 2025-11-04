/**
 * useChatMessages Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 232-303)
 * Purpose: Handle message loading, pagination, and real-time updates
 */

import { useState, useEffect, useRef } from 'react';
import { chatService } from '@/services/chatService';
import MessageNotificationService from '@/services/MessageNotificationService';
import { logger } from '@/utils/logger';

interface UseChatMessagesOptions {
  chatId: string;
  userId: string | null;
  initialLimit?: number;
}

interface UseChatMessagesReturn {
  messages: any[];
  allMessages: any[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  setLoading: (loading: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const INITIAL_MESSAGE_LIMIT = 50;

export const useChatMessages = ({
  chatId,
  userId,
  initialLimit = INITIAL_MESSAGE_LIMIT,
}: UseChatMessagesOptions): UseChatMessagesReturn => {
  const [messages, setMessages] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const previousMessageCountRef = useRef(0);
  const keyboardScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<any>(null);

  // Load messages with pagination support
  useEffect(() => {
    if (!chatId || !userId) return;

    setLoading(true);
    setHasMoreMessages(true);
    setAllMessages([]); // Reset on chat change
    previousMessageCountRef.current = 0;
    
    const unsubscribe = chatService.listenToMessages(chatId, async (newMessages) => {
      // Check if there are new messages
      if (newMessages.length > previousMessageCountRef.current && previousMessageCountRef.current > 0) {
        const latestMessage = newMessages[newMessages.length - 1];
        
        // Send notification if message is from someone else
        if (latestMessage.senderId !== userId) {
          try {
            const senderName = await MessageNotificationService.getSenderName(latestMessage.senderId);
            await MessageNotificationService.sendMessageNotification(
              chatId,
              latestMessage.senderId,
              senderName,
              latestMessage.text || 'Sent a file',
              userId
            );
          } catch (error) {
            logger.warn('Failed to send message notification:', error);
          }
        }
      }
      
      previousMessageCountRef.current = newMessages.length;
      
      // Merge new messages with existing paginated messages
      // For initial load, replace all messages
      // For real-time updates, merge new messages with existing paginated list
      if (allMessages.length === 0) {
        // Initial load - use messages from listener
        setMessages(newMessages);
        setAllMessages(newMessages);
      } else {
        // Real-time update - merge with existing paginated messages
        // Only add messages that aren't already in the list
        const existingIds = new Set(allMessages.map(m => m.id));
        const newUniqueMessages = newMessages.filter(m => !existingIds.has(m.id));
        
        if (newUniqueMessages.length > 0) {
          // Merge new messages (they're newer, so append to end)
          const updatedMessages = [...allMessages, ...newUniqueMessages].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
            return aTime - bTime;
          });
          setAllMessages(updatedMessages);
          setMessages(updatedMessages);
        }
      }
      
      setLoading(false);
      
      // Scroll to bottom on new messages (only if not loading more)
      if (!isLoadingMore) {
        // Clear any existing scroll timeout
        if (keyboardScrollTimeoutRef.current) {
          clearTimeout(keyboardScrollTimeoutRef.current);
        }
        keyboardScrollTimeoutRef.current = setTimeout(() => {
          keyboardScrollTimeoutRef.current = null;
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }, initialLimit);

    return () => {
      unsubscribe();
      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
      }
    };
  }, [chatId, userId, initialLimit]);

  // Load more messages (older messages)
  const loadMoreMessages = async () => {
    if (!chatId || !userId || isLoadingMore || !hasMoreMessages || allMessages.length === 0) {
      return;
    }

    setIsLoadingMore(true);
    try {
      // Get the oldest message timestamp
      const oldestMessage = allMessages[0];
      const oldestTimestamp = oldestMessage.createdAt;

      // Load older messages
      const result = await chatService.loadMoreMessages(chatId, oldestTimestamp, initialLimit);
      
      if (result.messages.length > 0) {
        // Merge older messages at the beginning
        const updatedMessages = [...result.messages, ...allMessages].sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return aTime - bTime;
        });
        
        setAllMessages(updatedMessages);
        setMessages(updatedMessages);
        setHasMoreMessages(result.hasMore);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      logger.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Refresh messages
  const refreshMessages = async () => {
    if (!chatId || !userId) return;

    setLoading(true);
    try {
      const result = await chatService.getChatMessages(chatId, initialLimit);
      setAllMessages(result.messages);
      setMessages(result.messages);
      setHasMoreMessages(result.hasMore);
    } catch (error) {
      logger.error('Error refreshing messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    allMessages,
    loading,
    isLoadingMore,
    hasMoreMessages,
    setLoading,
    setIsLoadingMore,
    setHasMoreMessages,
    loadMoreMessages,
    refreshMessages,
  };
};

export default useChatMessages;
