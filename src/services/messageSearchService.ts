import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message } from './chatService';

export interface SearchResult {
  message: Message;
  matchedText: string;
  context: string;
}

export class MessageSearchService {
  /**
   * Search messages in a specific chat
   */
  async searchInChat(
    chatId: string,
    searchTerm: string,
    options?: {
      caseSensitive?: boolean;
      exactMatch?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      senderId?: string;
      messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
    }
  ): Promise<SearchResult[]> {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      let q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));

      // Apply filters
      if (options?.dateFrom) {
        q = query(q, where('createdAt', '>=', options.dateFrom));
      }
      if (options?.dateTo) {
        q = query(q, where('createdAt', '<=', options.dateTo));
      }
      if (options?.senderId) {
        q = query(q, where('senderId', '==', options.senderId));
      }
      if (options?.messageType) {
        q = query(q, where('type', '==', options.messageType));
      }

      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      // Filter by search term (client-side for flexibility)
      const results: SearchResult[] = [];
      const searchTermLower = options?.caseSensitive ? searchTerm : searchTerm.toLowerCase();

      for (const message of messages) {
        if (!message.text) continue;

        const messageText = options?.caseSensitive ? message.text : message.text.toLowerCase();
        
        let isMatch = false;
        if (options?.exactMatch) {
          isMatch = messageText === searchTermLower;
        } else {
          isMatch = messageText.includes(searchTermLower);
        }

        if (isMatch) {
          // Get context (surrounding text)
          const matchIndex = messageText.indexOf(searchTermLower);
          const contextStart = Math.max(0, matchIndex - 30);
          const contextEnd = Math.min(message.text.length, matchIndex + searchTerm.length + 30);
          const context = message.text.substring(contextStart, contextEnd);

          results.push({
            message,
            matchedText: message.text.substring(matchIndex, matchIndex + searchTerm.length),
            context: contextStart > 0 ? '...' + context : context,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Search messages across all user's chats
   */
  async searchAllChats(
    userId: string,
    searchTerm: string
  ): Promise<Map<string, SearchResult[]>> {
    try {
      // Get all user's chats
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      );
      const chatsSnapshot = await getDocs(chatsQuery);

      const resultsByChat = new Map<string, SearchResult[]>();

      // Search in each chat
      for (const chatDoc of chatsSnapshot.docs) {
        const chatId = chatDoc.id;
        const results = await this.searchInChat(chatId, searchTerm);
        if (results.length > 0) {
          resultsByChat.set(chatId, results);
        }
      }

      return resultsByChat;
    } catch (error) {
      console.error('Error searching all chats:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on recent searches
   */
  async getSearchSuggestions(userId: string): Promise<string[]> {
    try {
      // This would fetch from a user's search history
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Save search to history
   */
  async saveSearchHistory(userId: string, searchTerm: string): Promise<void> {
    try {
      // Save to user's search history
      // Implementation would add to a searchHistory subcollection
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  /**
   * Highlight search term in text
   */
  highlightSearchTerm(text: string, searchTerm: string, caseSensitive: boolean = false): string {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${searchTerm})`, flags);
    return text.replace(regex, '<mark>$1</mark>');
  }
}

export const messageSearchService = new MessageSearchService();






