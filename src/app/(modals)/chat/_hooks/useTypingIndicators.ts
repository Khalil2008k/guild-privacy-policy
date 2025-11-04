/**
 * useTypingIndicators Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 305-344)
 * Purpose: Handle typing indicators, presence subscriptions, and app state cleanup
 */

import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import PresenceService, { clearTyping } from '@/services/PresenceService';
import { logger } from '@/utils/logger';

interface UseTypingIndicatorsOptions {
  chatId: string;
  userId: string | null;
}

interface UseTypingIndicatorsReturn {
  typingUsers: string[];
  setTypingUsers: (users: string[]) => void;
}

export const useTypingIndicators = ({
  chatId,
  userId,
}: UseTypingIndicatorsOptions): UseTypingIndicatorsReturn => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Subscribe to typing indicators with TTL filtering
  useEffect(() => {
    if (!chatId || !userId) return;

    const unsubscribeTyping = PresenceService.subscribeTyping(chatId, (typingUids) => {
      // Filter out stale typing indicators using TTL
      // The PresenceService already filters by TTL, but we can add extra validation here
      const freshTypingUsers = typingUids.filter(() => {
        // Trust the service's TTL filtering
        return true;
      });
      setTypingUsers(freshTypingUsers);
    });

    return () => {
      unsubscribeTyping();
      PresenceService.stopTyping(chatId);
    };
  }, [chatId, userId]);

  // Cleanup typing on unmount/background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clear typing when app goes to background
        if (chatId && userId) {
          clearTyping(chatId, userId);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription?.remove();
      if (chatId && userId) {
        clearTyping(chatId, userId);
      }
    };
  }, [chatId, userId]);

  return {
    typingUsers,
    setTypingUsers,
  };
};

export default useTypingIndicators;
