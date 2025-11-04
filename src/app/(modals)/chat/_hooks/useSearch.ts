/**
 * useSearch Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1615-1641)
 * Purpose: Handle message search functionality
 */

import { useCallback } from 'react';
import { messageSearchService } from '@/services/messageSearchService';
import { CustomAlertService } from '@/services/CustomAlertService';
import { logger } from '@/utils/logger';

interface UseSearchOptions {
  chatId: string;
  userId: string | null;
  isRTL: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchResults: (results: any[]) => void;
  setShowOptionsMenu: (show: boolean) => void;
  setShowSearchModal: (show: boolean) => void;
}

interface UseSearchReturn {
  handleSearchMessages: () => void;
  performSearch: () => Promise<void>;
  clearSearch: () => void;
}

export const useSearch = ({
  chatId,
  userId,
  isRTL,
  searchQuery,
  setSearchQuery,
  setIsSearching,
  setSearchResults,
  setShowOptionsMenu,
  setShowSearchModal,
}: UseSearchOptions): UseSearchReturn => {
  
  // Open search modal
  const handleSearchMessages = useCallback(() => {
    setShowOptionsMenu(false);
    setShowSearchModal(true);
  }, [setShowOptionsMenu, setShowSearchModal]);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await messageSearchService.searchInChat(chatId, searchQuery.trim());
      setSearchResults(results);
      
      // Save to search history
      if (userId) {
        await messageSearchService.saveSearchHistory(userId, searchQuery.trim());
      }
    } catch (error) {
      logger.error('Search error:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل البحث في الرسائل' : 'Failed to search messages'
      );
    } finally {
      setIsSearching(false);
    }
  }, [chatId, userId, searchQuery, isRTL, setIsSearching, setSearchResults]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchModal(false);
  }, [setSearchQuery, setSearchResults, setShowSearchModal]);

  return {
    handleSearchMessages,
    performSearch,
    clearSearch,
  };
};

export default useSearch;
