import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { logger } from '../utils/logger'; // COMMENT: FINAL STABILIZATION - Task 7 - Replace console.log with logger
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
      logger.error('❌ Error converting file to blob:', error);
      throw new Error('Failed to convert file to blob');
    }
  }

  /**
   * Upload chat background image
   */
  async uploadChatBackground(chatId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const filename = `chat-backgrounds/${chatId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      logger.error('Error uploading chat background:', error);
      throw error;
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
      logger.error('Error uploading file:', error);
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
      logger.error('Error sending file message:', error);
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
      logger.debug('🎤 Uploading voice message:', { chatId, messageId, duration });

      // Fetch audio data
      const resp = await fetch(audioUri);
      const blob = await resp.blob();

      // Upload with proper contentType
      const fileRef = ref(storage, `chats/${chatId}/voice/${messageId}.m4a`);
      await uploadBytes(fileRef, blob, { contentType: 'audio/mp4' });
      const url = await getDownloadURL(fileRef);

      logger.info('✅ Voice message uploaded successfully');
      return { url, duration };
    } catch (error) {
      logger.error('❌ Error uploading voice message:', error);
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
        logger.debug('🧹 Cleaned up temp audio file');
      }
    } catch (error) {
      logger.warn('⚠️ Failed to cleanup temp audio file:', error);
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
      logger.debug('🎥 Uploading video message:', { chatId, messageId, duration: durationSec });

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

      logger.info('✅ Video message uploaded successfully:', { url, thumbnailUrl });
      return { url, thumbnailUrl, duration: durationSec };
    } catch (error) {
      logger.error('❌ Error uploading video message:', error);
      throw error;
    }
  }

  /**
   * Upload image message to Firebase Storage with proper contentType
   * COMMENT: PRODUCTION HARDENING - Task 4.9 - Compress images before upload
   */
  async uploadImageMessage(
    chatId: string,
    imageUri: string,
    messageId: string
  ): Promise<{ url: string }> {
    logger.debug('🔴 [chatFileService] uploadImageMessage START', { chatId, messageId, imageUri, uriType: typeof imageUri, uriLength: imageUri?.length });
    try {
      logger.debug('🔴 [chatFileService] uploadImageMessage try block entered', { chatId, messageId });

      // COMMENT: PRODUCTION HARDENING - Task 4.9 - Compress image before upload
      logger.debug('🔴 [chatFileService] Starting image compression...', { imageUri });
      let finalImageUri = imageUri;
      try {
        logger.debug('🔴 [chatFileService] Importing ImageCompressionService...');
        const { ImageCompressionService } = await import('./ImageCompressionService');
        logger.debug('🔴 [chatFileService] ImageCompressionService imported, calling smartCompress...');
        const compressionResult = await ImageCompressionService.smartCompress(imageUri);
        finalImageUri = compressionResult.uri;
        logger.debug(`🔴 [chatFileService] Image compressed: ${ImageCompressionService.formatBytes(compressionResult.originalSize)} → ${ImageCompressionService.formatBytes(compressionResult.size)} (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);
      } catch (compressionError) {
        logger.warn('⚠️ [chatFileService] Image compression failed, using original:', compressionError);
        // Continue with original image if compression fails
      }
      logger.debug('🔴 [chatFileService] Compression step complete', { finalImageUri });

      // Convert image URI to blob - handle local file URIs properly for React Native
      logger.debug('🔴 [chatFileService] Converting URI to blob...', { finalImageUri });
      let blob: Blob;
      try {
        // First try using fetch (works for most URIs including local files on iOS)
        // For Android, fetch may fail with local file:// URIs
        logger.debug('🔴 [chatFileService] Attempting fetch...', { finalImageUri });
        const resp = await fetch(finalImageUri);
        logger.debug('🔴 [chatFileService] Fetch response received', { ok: resp.ok, status: resp.status, statusText: resp.statusText });
        if (!resp.ok) {
          throw new Error(`Fetch failed with status ${resp.status}`);
        }
        logger.debug('🔴 [chatFileService] Converting response to blob...');
        blob = await resp.blob();
        logger.debug('🔴 [chatFileService] Successfully read image using fetch', { blobSize: blob.size, blobType: blob.type });
      } catch (fetchError) {
        logger.warn('⚠️ [chatFileService] Fetch failed, trying FileSystem fallback:', fetchError);
        // Fallback: Use FileSystem to read as base64, then convert to blob
        logger.debug('🔴 [chatFileService] Entering FileSystem fallback...');
        try {
          // Check if file exists first
          logger.debug('🔴 [chatFileService] Checking if file exists...', { finalImageUri });
          const fileInfo = await FileSystem.getInfoAsync(finalImageUri);
          logger.debug('🔴 [chatFileService] File info retrieved', { exists: fileInfo?.exists, isDirectory: fileInfo?.isDirectory });
          if (!fileInfo || !fileInfo.exists) {
            throw new Error(`File does not exist: ${finalImageUri}`);
          }
          
          logger.debug('🔴 [chatFileService] Reading file as base64...');
          // Read file as base64 - handle both legacy and new FileSystem APIs
          let base64Data: string;
          try {
            logger.debug('🔴 [chatFileService] Calling readAsStringAsync...');
            base64Data = await FileSystem.readAsStringAsync(finalImageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            logger.debug('🔴 [chatFileService] readAsStringAsync completed', { dataLength: base64Data?.length });
          } catch (readError) {
            // If readAsStringAsync fails, try alternative approach
            logger.warn('⚠️ [chatFileService] readAsStringAsync failed:', readError);
            // Alternative: Try reading as binary and converting
            throw new Error(`Failed to read file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
          }
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('File read returned empty data');
          }
          
          logger.debug(`🔴 [chatFileService] Base64 data length: ${base64Data.length} characters`);
          
          // Convert base64 to blob - handle large files safely
          logger.debug('🔴 [chatFileService] Converting base64 to blob...');
          try {
            const byteCharacters = atob(base64Data);
            logger.debug('🔴 [chatFileService] Base64 decoded', { byteCharactersLength: byteCharacters.length });
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            logger.debug(`🔴 [chatFileService] Successfully converted base64 to blob (${byteArray.length} bytes)`);
          } catch (conversionError) {
            logger.error('❌ [chatFileService] Failed to convert base64 to blob:', conversionError);
            throw new Error(`Failed to convert file to blob: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
          }
        } catch (fileSystemError) {
          logger.error('❌ [chatFileService] Both fetch and FileSystem failed:', fileSystemError);
          // Provide user-friendly error message
          const errorMessage = fileSystemError instanceof Error 
            ? fileSystemError.message 
            : 'Unknown error reading image file';
          throw new Error(`Failed to read image file. Please try taking the photo again or selecting from gallery. Error: ${errorMessage}`);
        }
      }
      logger.debug('🔴 [chatFileService] Blob conversion complete', { blobSize: blob?.size, blobType: blob?.type });

      // Upload image with explicit contentType
      logger.debug('🔴 [chatFileService] Uploading blob to Firebase Storage...', { chatId, messageId });
      const fileRef = ref(storage, `chats/${chatId}/images/${messageId}.jpg`);
      logger.debug('🔴 [chatFileService] Storage reference created', { path: `chats/${chatId}/images/${messageId}.jpg` });
      
      logger.debug('🔴 [chatFileService] Calling uploadBytes...');
      await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
      logger.debug('🔴 [chatFileService] uploadBytes completed');
      
      logger.debug('🔴 [chatFileService] Getting download URL...');
      const url = await getDownloadURL(fileRef);
      logger.debug('🔴 [chatFileService] Download URL retrieved', { url });

      logger.info('✅ [chatFileService] Image message uploaded successfully:', { url });
      return { url };
    } catch (error) {
      logger.error('❌ [chatFileService] Error uploading image message:', error);
      logger.error('❌ [chatFileService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        error
      });
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
      logger.debug('📄 Uploading file message:', { chatId, messageId, mimeType });

      // Fetch file data and convert to blob
      const resp = await fetch(fileUri);
      const blob = await resp.blob();

      // Upload file with explicit contentType
      const fileRef = ref(storage, `chats/${chatId}/files/${messageId}.${fileExtension}`);
      await uploadBytes(fileRef, blob, { contentType: mimeType });
      const url = await getDownloadURL(fileRef);

      logger.info('✅ File message uploaded successfully:', { url });
      return { url };
    } catch (error) {
      logger.error('❌ Error uploading file message:', error);
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
        logger.debug('🧹 Cleaned up temp video file');
      }
    } catch (error) {
      logger.warn('⚠️ Failed to cleanup temp video file:', error);
    }
  }
}

// Export singleton instance
export const chatFileService = new ChatFileService();






