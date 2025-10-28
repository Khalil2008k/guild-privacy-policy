import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';

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
  duration?: number; // Added for voice messages
  thumbnailUrl?: string; // Added for video messages
}

export class ChatFileService {
  /**
   * Helper to convert file URI to Blob (React Native compatible)
   */
  private async fileToBlob(uri: string): Promise<Blob> {
    try {
      // Use fetch to get the file as a blob (React Native compatible)
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('❌ Error converting file to blob:', error);
      throw new Error('Failed to convert file to blob');
    }
  }

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

      // Calculate file hash for authenticity (React Native compatible)
      // Use the file URI directly for hashing since blob.arrayBuffer() is not available in RN
      const fileHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fileUri + fileName + Date.now()
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

  /**
   * Upload voice message to Firebase Storage with proper contentType
   */
  async uploadVoiceMessage(
    chatId: string,
    audioUri: string,
    messageId: string,
    duration: number
  ): Promise<{ url: string; duration: number }> {
    try {
      console.log('🎤 Uploading voice message:', { chatId, messageId, duration });

      // Fetch audio data
      const resp = await fetch(audioUri);
      const blob = await resp.blob();

      // Upload with proper contentType
      const fileRef = ref(storage, `chats/${chatId}/voice/${messageId}.m4a`);
      await uploadBytes(fileRef, blob, { contentType: 'audio/mp4' });
      const url = await getDownloadURL(fileRef);

      console.log('✅ Voice message uploaded successfully');
      return { url, duration };
    } catch (error) {
      console.error('❌ Error uploading voice message:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary audio file
   */
  async cleanupTempAudioFile(audioUri: string): Promise<void> {
    try {
      if (audioUri.startsWith('file://')) {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
        console.log('🧹 Cleaned up temp audio file');
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup temp audio file:', error);
    }
  }

  /**
   * Upload video message to Firebase Storage with proper contentType and order
   */
  async uploadVideoMessage(
    chatId: string,
    videoUri: string,
    messageId: string,
    durationSec?: number
  ): Promise<{ url: string; thumbnailUrl: string; duration?: number }> {
    try {
      console.log('🎥 Uploading video message:', { chatId, messageId, duration: durationSec });

      // 1) Fetch video data and convert to blob
      const resp = await fetch(videoUri);
      const blob = await resp.blob();

      // 2) Upload video file with explicit contentType
      const fileRef = ref(storage, `chats/${chatId}/video/${messageId}.mp4`);
      await uploadBytes(fileRef, blob, { contentType: 'video/mp4' });
      const url = await getDownloadURL(fileRef);

      // 3) Generate thumbnail
      const { uri: thumbLocal } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 800 });
      
      // 4) Upload thumbnail with explicit contentType
      const thumbResp = await fetch(thumbLocal);
      const thumbBlob = await thumbResp.blob();
      const thumbRef = ref(storage, `chats/${chatId}/video/thumbnails/${messageId}.jpg`);
      await uploadBytes(thumbRef, thumbBlob, { contentType: 'image/jpeg' });
      const thumbnailUrl = await getDownloadURL(thumbRef);

      console.log('✅ Video message uploaded successfully:', { url, thumbnailUrl });
      return { url, thumbnailUrl, duration: durationSec };
    } catch (error) {
      console.error('❌ Error uploading video message:', error);
      throw error;
    }
  }

  /**
   * Upload image message to Firebase Storage with proper contentType
   */
  async uploadImageMessage(
    chatId: string,
    imageUri: string,
    messageId: string
  ): Promise<{ url: string }> {
    try {
      console.log('📸 Uploading image message:', { chatId, messageId });

      // Fetch image data and convert to blob
      const resp = await fetch(imageUri);
      const blob = await resp.blob();

      // Upload image with explicit contentType
      const fileRef = ref(storage, `chats/${chatId}/images/${messageId}.jpg`);
      await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(fileRef);

      console.log('✅ Image message uploaded successfully:', { url });
      return { url };
    } catch (error) {
      console.error('❌ Error uploading image message:', error);
      throw error;
    }
  }

  /**
   * Upload file message to Firebase Storage with proper contentType
   */
  async uploadFileMessage(
    chatId: string,
    fileUri: string,
    messageId: string,
    mimeType: string,
    fileExtension: string
  ): Promise<{ url: string }> {
    try {
      console.log('📄 Uploading file message:', { chatId, messageId, mimeType });

      // Fetch file data and convert to blob
      const resp = await fetch(fileUri);
      const blob = await resp.blob();

      // Upload file with explicit contentType
      const fileRef = ref(storage, `chats/${chatId}/files/${messageId}.${fileExtension}`);
      await uploadBytes(fileRef, blob, { contentType: mimeType });
      const url = await getDownloadURL(fileRef);

      console.log('✅ File message uploaded successfully:', { url });
      return { url };
    } catch (error) {
      console.error('❌ Error uploading file message:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary video file
   */
  async cleanupTempVideoFile(videoUri: string): Promise<void> {
    try {
      if (videoUri.startsWith('file://')) {
        await FileSystem.deleteAsync(videoUri, { idempotent: true });
        console.log('🧹 Cleaned up temp video file');
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup temp video file:', error);
    }
  }
}

// Export singleton instance
export const chatFileService = new ChatFileService();






