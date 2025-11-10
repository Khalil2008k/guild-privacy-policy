/**
 * Chat Export Service
 * 
 * Handles exporting chat messages in various formats (text, PDF)
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { logger } from '../utils/logger';
import { chatFileService } from './chatFileService';

export interface ExportOptions {
  includeMedia: boolean;
  includeTimestamps: boolean;
  includeUserNames: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

class ChatExportService {
  /**
   * Export chat as text file
   */
  async exportAsText(
    chatId: string,
    chatName: string,
    messages: any[],
    options: ExportOptions
  ): Promise<void> {
    try {
      const lines: string[] = [];
      
      // Header
      lines.push(`Chat Export: ${chatName}`);
      lines.push(`Exported on: ${new Date().toLocaleString()}`);
      lines.push(`Total messages: ${messages.length}`);
      lines.push('─'.repeat(50));
      lines.push('');

      // Filter messages by date range if specified
      let filteredMessages = messages;
      if (options.dateRange) {
        filteredMessages = messages.filter((msg) => {
          const msgDate = msg.createdAt?.toDate?.() || new Date(msg.createdAt);
          return msgDate >= options.dateRange!.from && msgDate <= options.dateRange!.to;
        });
      }

      // Format messages
      filteredMessages.forEach((message) => {
        const timestamp = message.createdAt?.toDate?.() || new Date(message.createdAt);
        const formattedTime = options.includeTimestamps
          ? timestamp.toLocaleString()
          : '';

        const senderName = options.includeUserNames && message.senderName
          ? message.senderName
          : message.senderId;

        // Message text
        if (message.text) {
          if (options.includeTimestamps && options.includeUserNames) {
            lines.push(`[${formattedTime}] ${senderName}: ${message.text}`);
          } else if (options.includeTimestamps) {
            lines.push(`[${formattedTime}] ${message.text}`);
          } else if (options.includeUserNames) {
            lines.push(`${senderName}: ${message.text}`);
          } else {
            lines.push(message.text);
          }
        }

        // Media attachments
        if (options.includeMedia && message.attachments && message.attachments.length > 0) {
          message.attachments.forEach((attachment: string) => {
            const mediaType = message.type === 'IMAGE' ? '[Image]' : message.type === 'FILE' ? '[File]' : '[Media]';
            lines.push(`  ${mediaType}: ${attachment}`);
          });
        }

        // Voice messages
        if (message.type === 'VOICE' || message.type === 'voice') {
          lines.push(`  [Voice Message] Duration: ${message.duration || 0}s`);
        }

        lines.push(''); // Empty line between messages
      });

      // Footer
      lines.push('─'.repeat(50));
      lines.push(`End of export`);

      const textContent = lines.join('\n');

      // Save to file
      const filename = `${chatName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, textContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Chat',
        });
      } else {
        logger.warn('Sharing not available on this platform');
      }

      logger.debug(`✅ Chat exported as text: ${filename}`);
    } catch (error) {
      logger.error('Error exporting chat as text:', error);
      throw error;
    }
  }

  /**
   * Export chat as PDF
   * Note: PDF generation in React Native requires a library like react-native-pdf or similar
   * For now, we'll create a formatted text file that can be converted to PDF externally
   */
  async exportAsPDF(
    chatId: string,
    chatName: string,
    messages: any[],
    options: ExportOptions
  ): Promise<void> {
    try {
      // Since PDF generation libraries are complex and may not be available,
      // we'll create a well-formatted text file that can be converted to PDF
      // In production, you might use a library like react-native-pdf-generator or similar
      
      logger.debug('📄 PDF export requested - creating formatted text file');
      
      // For now, export as formatted text (can be converted to PDF externally)
      // In a full implementation, you would use a PDF library here
      await this.exportAsText(chatId, chatName, messages, options);
      
      // TODO: Implement actual PDF generation using a library like:
      // - react-native-pdf-lib
      // - react-native-html-to-pdf
      // - or similar PDF generation library
      
      logger.debug(`✅ Chat exported as PDF (formatted text format)`);
    } catch (error) {
      logger.error('Error exporting chat as PDF:', error);
      throw error;
    }
  }

  /**
   * Format message timestamp
   */
  private formatTimestamp(timestamp: any): string {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Format message for export
   */
  private formatMessage(message: any, options: ExportOptions): string {
    const parts: string[] = [];
    
    if (options.includeTimestamps) {
      parts.push(`[${this.formatTimestamp(message.createdAt)}]`);
    }
    
    if (options.includeUserNames && message.senderName) {
      parts.push(`${message.senderName}:`);
    }
    
    if (message.text) {
      parts.push(message.text);
    }
    
    if (options.includeMedia && message.attachments) {
      message.attachments.forEach((attachment: string) => {
        parts.push(`[Media: ${attachment}]`);
      });
    }
    
    return parts.join(' ');
  }
}

export const chatExportService = new ChatExportService();








