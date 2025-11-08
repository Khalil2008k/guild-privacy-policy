/**
 * Error Code Share Service
 * Service to share error codes via chat
 */

import { formatErrorForChat, ErrorCodeData } from '../utils/errorCodeFormatter';
import { chatService } from './chatService';
import { logger } from '../utils/logger';
import { auth } from '../config/firebase';

export class ErrorCodeShareService {
  /**
   * Share error code to a chat
   */
  static async shareErrorToChat(
    chatId: string,
    errorData: ErrorCodeData
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const formattedError = formatErrorForChat(errorData);
      
      logger.info('📤 Sharing error code to chat:', {
        chatId,
        userId: currentUser.uid,
        errorCode: errorData.errorCode
      });
      
      // Send message to chat using chatService
      await chatService.sendMessage(chatId, formattedError, currentUser.uid);
      
      logger.info('✅ Error code shared to chat successfully');
    } catch (error: any) {
      logger.error('❌ Failed to share error code to chat:', error);
      throw new Error(`Failed to share error code: ${error.message}`);
    }
  }
  
  /**
   * Share error code to a specific user (creates or uses existing chat)
   */
  static async shareErrorToUser(
    toUserId: string,
    errorData: ErrorCodeData
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const fromUserId = currentUser.uid;
      
      // Get or create chat between users
      const chats = await chatService.getUserChats(fromUserId);
      let chat = chats.find(c => {
        const participants = c.participants || c.participantIds || [];
        return participants.includes(toUserId) && participants.length === 2;
      });
      
      if (!chat) {
        // Create new direct chat
        chat = await chatService.createDirectChat(toUserId);
      }
      
      // Share error to chat
      await this.shareErrorToChat(chat.id, errorData);
    } catch (error: any) {
      logger.error('❌ Failed to share error code to user:', error);
      throw new Error(`Failed to share error code to user: ${error.message}`);
    }
  }
}

