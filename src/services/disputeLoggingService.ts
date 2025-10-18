/**
 * Dispute Logging Service - Production-Grade Message Audit Trail
 * 
 * Logs all message activities for legal dispute resolution:
 * - Original messages with full metadata
 * - Edit history with timestamps
 * - Deletion logs with original content
 * - Device and network information
 * - Content hashing for integrity verification
 */

import { doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  modelName: string;
}

export interface NetworkInfo {
  timestamp: Date;
  connectionType?: string;
}

export interface MessageLog {
  messageId: string;
  chatId: string;
  senderId: string;
  recipientIds: string[];
  content: string;
  contentHash: string;
  timestamp: Timestamp | Date;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  status: 'sent' | 'delivered' | 'read' | 'deleted';
  attachments: Array<{
    url: string;
    type: string;
    size: number;
    hash: string;
    filename: string;
  }>;
  metadata: Record<string, any>;
}

export interface EditLog {
  messageId: string;
  editTimestamp: Timestamp | Date;
  originalContent: string;
  newContent: string;
  editorId: string;
  editReason?: string;
  deviceInfo: DeviceInfo;
  contentHash: string;
}

export interface DeletionLog {
  messageId: string;
  deletedTimestamp: Timestamp | Date;
  deletedBy: string;
  originalContent: string;
  deletionReason?: string;
  softDelete: boolean;
  deviceInfo: DeviceInfo;
  contentHash: string;
}

export interface DisputeLog {
  id: string;
  type: 'message' | 'edit' | 'deletion';
  timestamp: Date;
  data: MessageLog | EditLog | DeletionLog;
}

export class DisputeLoggingService {
  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      return {
        platform: Device.osName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        deviceId: Application.androidId || (await Application.getIosIdForVendorAsync()) || 'unknown',
        deviceName: Device.deviceName || 'unknown',
        manufacturer: Device.manufacturer || 'unknown',
        modelName: Device.modelName || 'unknown',
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        platform: 'unknown',
        osVersion: 'unknown',
        appVersion: '1.0.0',
        deviceId: 'unknown',
        deviceName: 'unknown',
        manufacturer: 'unknown',
        modelName: 'unknown',
      };
    }
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): NetworkInfo {
    return {
      timestamp: new Date(),
      connectionType: 'unknown', // Could be enhanced with network library
    };
  }

  /**
   * Generate content hash for integrity verification
   */
  private async generateContentHash(content: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        content
      );
      return hash;
    } catch (error) {
      console.error('Error generating content hash:', error);
      return 'error-generating-hash';
    }
  }

  /**
   * Log original message with full metadata
   */
  async logMessage(
    messageId: string,
    chatId: string,
    senderId: string,
    recipientIds: string[],
    content: string,
    attachments: Array<{
      url: string;
      type: string;
      size: number;
      filename: string;
    }> = [],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const networkInfo = this.getNetworkInfo();
      const contentHash = await this.generateContentHash(content);

      // Hash attachments
      const attachmentsWithHash = await Promise.all(
        attachments.map(async (att) => ({
          ...att,
          hash: await this.generateContentHash(att.url + att.filename),
        }))
      );

      const messageLog: Omit<MessageLog, 'timestamp'> = {
        messageId,
        chatId,
        senderId,
        recipientIds,
        content,
        contentHash,
        deviceInfo,
        networkInfo,
        status: 'sent',
        attachments: attachmentsWithHash,
        metadata,
        timestamp: serverTimestamp() as Timestamp,
      };

      // Store in message-audit-trail collection
      const auditRef = doc(db, 'message-audit-trail', messageId);
      await setDoc(
        auditRef,
        {
          originalMessage: messageLog,
          edits: [],
          deletions: [],
          views: [],
          reports: [],
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[DisputeLogging] Message logged successfully:', messageId);
    } catch (error) {
      console.error('[DisputeLogging] Error logging message:', error);
      // Don't throw - logging failure shouldn't break message sending
    }
  }

  /**
   * Log message edit
   */
  async logEdit(
    messageId: string,
    editorId: string,
    originalContent: string,
    newContent: string,
    editReason?: string
  ): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const contentHash = await this.generateContentHash(newContent);

      const editLog: Omit<EditLog, 'editTimestamp'> = {
        messageId,
        originalContent,
        newContent,
        editorId,
        editReason,
        deviceInfo,
        contentHash,
        editTimestamp: serverTimestamp() as Timestamp,
      };

      // Add to edits array in audit trail
      const auditRef = doc(db, 'message-audit-trail', messageId);
      const auditSnap = await getDoc(auditRef);

      if (auditSnap.exists()) {
        const currentEdits = auditSnap.data().edits || [];
        await setDoc(
          auditRef,
          {
            edits: [...currentEdits, editLog],
            lastEditedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // Create audit trail if it doesn't exist
        await setDoc(auditRef, {
          messageId,
          edits: [editLog],
          createdAt: serverTimestamp(),
          lastEditedAt: serverTimestamp(),
        });
      }

      console.log('[DisputeLogging] Edit logged successfully:', messageId);
    } catch (error) {
      console.error('[DisputeLogging] Error logging edit:', error);
    }
  }

  /**
   * Log message deletion
   */
  async logDeletion(
    messageId: string,
    deletedBy: string,
    originalContent: string,
    softDelete: boolean = true,
    deletionReason?: string
  ): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const contentHash = await this.generateContentHash(originalContent);

      const deletionLog: Omit<DeletionLog, 'deletedTimestamp'> = {
        messageId,
        deletedBy,
        originalContent,
        deletionReason,
        softDelete,
        deviceInfo,
        contentHash,
        deletedTimestamp: serverTimestamp() as Timestamp,
      };

      // Add to deletions array in audit trail
      const auditRef = doc(db, 'message-audit-trail', messageId);
      const auditSnap = await getDoc(auditRef);

      if (auditSnap.exists()) {
        const currentDeletions = auditSnap.data().deletions || [];
        await setDoc(
          auditRef,
          {
            deletions: [...currentDeletions, deletionLog],
            lastDeletedAt: serverTimestamp(),
            isDeleted: true,
          },
          { merge: true }
        );
      } else {
        // Create audit trail if it doesn't exist
        await setDoc(auditRef, {
          messageId,
          deletions: [deletionLog],
          createdAt: serverTimestamp(),
          lastDeletedAt: serverTimestamp(),
          isDeleted: true,
        });
      }

      console.log('[DisputeLogging] Deletion logged successfully:', messageId);
    } catch (error) {
      console.error('[DisputeLogging] Error logging deletion:', error);
    }
  }

  /**
   * Get complete message history for disputes
   */
  async getMessageHistory(messageId: string): Promise<DisputeLog[]> {
    try {
      const auditRef = doc(db, 'message-audit-trail', messageId);
      const auditSnap = await getDoc(auditRef);

      if (!auditSnap.exists()) {
        return [];
      }

      const data = auditSnap.data();
      const logs: DisputeLog[] = [];

      // Add original message
      if (data.originalMessage) {
        logs.push({
          id: `${messageId}-original`,
          type: 'message',
          timestamp: data.originalMessage.timestamp.toDate(),
          data: data.originalMessage,
        });
      }

      // Add edits
      if (data.edits) {
        data.edits.forEach((edit: any, index: number) => {
          logs.push({
            id: `${messageId}-edit-${index}`,
            type: 'edit',
            timestamp: edit.editTimestamp.toDate(),
            data: edit,
          });
        });
      }

      // Add deletions
      if (data.deletions) {
        data.deletions.forEach((deletion: any, index: number) => {
          logs.push({
            id: `${messageId}-deletion-${index}`,
            type: 'deletion',
            timestamp: deletion.deletedTimestamp.toDate(),
            data: deletion,
          });
        });
      }

      // Sort by timestamp
      logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return logs;
    } catch (error) {
      console.error('[DisputeLogging] Error getting message history:', error);
      return [];
    }
  }

  /**
   * Export chat audit trail for dispute resolution
   */
  async exportForDispute(
    chatId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    try {
      // Query all audit trails for this chat
      const auditQuery = query(
        collection(db, 'message-audit-trail'),
        where('originalMessage.chatId', '==', chatId),
        orderBy('createdAt', 'desc')
      );

      const auditSnap = await getDocs(auditQuery);
      const allLogs: any[] = [];

      for (const doc of auditSnap.docs) {
        const data = doc.data();
        
        // Filter by date if specified
        const messageDate = data.originalMessage?.timestamp?.toDate();
        if (startDate && messageDate && messageDate < startDate) continue;
        if (endDate && messageDate && messageDate > endDate) continue;

        allLogs.push({
          messageId: doc.id,
          ...data,
        });
      }

      // Format as JSON report
      const report = {
        chatId,
        exportDate: new Date().toISOString(),
        dateRange: {
          start: startDate?.toISOString() || 'all',
          end: endDate?.toISOString() || 'all',
        },
        totalMessages: allLogs.length,
        messages: allLogs,
      };

      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error('[DisputeLogging] Error exporting audit trail:', error);
      throw error;
    }
  }

  /**
   * Create dispute report
   */
  async createDisputeReport(
    chatId: string,
    reporterId: string,
    reportedUserId: string,
    reason: string,
    messageIds: string[]
  ): Promise<string> {
    try {
      const disputeRef = await addDoc(collection(db, 'disputes'), {
        chatId,
        reporterId,
        reportedUserId,
        reason,
        messageIds,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Copy relevant message logs to dispute
      for (const messageId of messageIds) {
        const history = await this.getMessageHistory(messageId);
        await setDoc(
          doc(db, 'disputes', disputeRef.id, 'messages', messageId),
          {
            history,
            capturedAt: serverTimestamp(),
          }
        );
      }

      console.log('[DisputeLogging] Dispute report created:', disputeRef.id);
      return disputeRef.id;
    } catch (error) {
      console.error('[DisputeLogging] Error creating dispute report:', error);
      throw error;
    }
  }
}

export const disputeLoggingService = new DisputeLoggingService();



