import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface FileMetadata {
  chatId: string;
  uploadedBy: string;
  originalFileName: string;
  storagePath: string;
  url: string;
  size: number;
  type: string;
  hash: string;
  uploadedAt: any;
}

export class ChatFileService {
  /**
   * Upload a file to Firebase Storage and save metadata
   */
  async uploadFile(
    chatId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    senderId: string
  ): Promise<{ url: string; metadata: FileMetadata }> {
    try {
      // Fetch the file as a blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Calculate file hash for authenticity
      const arrayBuffer = await blob.arrayBuffer();
      const hashArray = Array.from(new Uint8Array(arrayBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const fileHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        hashHex
      );

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}_${senderId}_${fileName}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, `chats/${chatId}/files/${uniqueFilename}`);
      await uploadBytes(storageRef, blob, { contentType: fileType });

      // Get download URL
      const url = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      const metadata: FileMetadata = {
        chatId,
        uploadedBy: senderId,
        originalFileName: fileName,
        storagePath: storageRef.fullPath,
        url,
        size: blob.size,
        type: fileType,
        hash: fileHash,
        uploadedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'file_uploads'), metadata);

      return { url, metadata };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Send a file message (uploads file and creates message)
   */
  async sendFileMessage(
    chatId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    senderId: string
  ): Promise<string> {
    try {
      // Upload file first
      const { url, metadata } = await this.uploadFile(
        chatId,
        fileUri,
        fileName,
        fileType,
        senderId
      );

      // Determine message type
      const messageType = fileType.startsWith('image/') ? 'IMAGE' : 'FILE';

      // Get device info
      const deviceInfo = await this.getDeviceInfo();

      // Create message data
      const messageData = {
        chatId,
        senderId,
        text: '', // Empty text for file messages
        type: messageType,
        attachments: [url],
        status: 'sent',
        readBy: [senderId],
        createdAt: serverTimestamp(),
        fileMetadata: {
          originalName: fileName,
          size: metadata.size,
          hash: metadata.hash,
          storagePath: metadata.storagePath,
        },
        evidence: {
          deviceInfo,
          appVersion: Constants.expoConfig?.version || '1.0.0',
        },
      };

      // Add message to Firestore
      const messageRef = await addDoc(
        collection(db, 'chats', chatId, 'messages'),
        messageData
      );

      return messageRef.id;
    } catch (error) {
      console.error('Error sending file message:', error);
      throw error;
    }
  }

  /**
   * Get device information for evidence
   */
  private async getDeviceInfo(): Promise<string> {
    const modelName = Device.modelName || 'Unknown';
    const osName = Device.osName || 'Unknown';
    const osVersion = Device.osVersion || 'Unknown';
    return `${modelName}, ${osName} ${osVersion}`;
  }
}

// Export singleton instance
export const chatFileService = new ChatFileService();






