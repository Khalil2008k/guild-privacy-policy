/**
 * useMediaHandlers Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 559-1182)
 * Purpose: Handle media recording and sending (voice, video, image, file, location)
 */

import { useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { chatFileService } from '@/services/chatFileService';
import { chatService } from '@/services/chatService';
import ChatStorageProvider from '@/services/ChatStorageProvider';
import MessageNotificationService from '@/services/MessageNotificationService';
import { disputeLoggingService } from '@/services/disputeLoggingService';
import { CustomAlertService } from '@/services/CustomAlertService';
import { logger } from '@/utils/logger';
// Camera imports removed - using ImagePicker for better UX
import { Video as ExpoVideo } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

interface UseMediaHandlersOptions {
  chatId: string;
  userId: string | null;
  jobId?: string;
  otherUser: { id: string; uid?: string } | null;
  chatInfo?: any; // Added for handleSendLocation
  isRTL: boolean;
  // State setters for optimistic UI
  messages: any[];
  setMessages: (messages: any[]) => void;
  allMessages: any[];
  setAllMessages: (messages: any[]) => void;
  // Camera/recording state removed - using ImagePicker and AdvancedVoiceRecorder instead
  cameraRef: any; // Not needed with ImagePicker - kept for compatibility
  cameraPermission: any; // Not needed with ImagePicker - kept for compatibility
  requestCameraPermission: () => Promise<any>; // Not needed with ImagePicker - kept for compatibility
  micPermission: any; // Not needed with AdvancedVoiceRecorder - kept for compatibility
  requestMicPermission: () => Promise<any>; // Not needed with AdvancedVoiceRecorder - kept for compatibility
  // State setters (kept for compatibility, many not used)
  setIsRecording: (recording: boolean) => void; // Not used with AdvancedVoiceRecorder
  setRecordingDuration: (duration: number) => void; // Not used with AdvancedVoiceRecorder
  setIsUploadingVoice: (uploading: boolean) => void;
  setMediaRecorder: (recorder: MediaRecorder | null) => void; // Not used with AdvancedVoiceRecorder
  setAudioChunks: (chunks: Blob[]) => void; // Not used with AdvancedVoiceRecorder
  setIsRecordingVideo: (recording: boolean) => void; // Not used with ImagePicker
  setIsUploadingVideo: (uploading: boolean) => void;
  setShowCameraModal: (show: boolean) => void; // Not used with ImagePicker
  setRecordingStartTime: (time: number | null) => void; // Not used with ImagePicker
  recordingDuration: number; // Not used with AdvancedVoiceRecorder
  mediaRecorder: MediaRecorder | null; // Not used with AdvancedVoiceRecorder
  isRecordingVideo: boolean; // Not used with ImagePicker
  recordingStartTime: number | null; // Not used with ImagePicker
}

interface UseMediaHandlersReturn {
  // Voice recording - Only upload (recording done by AdvancedVoiceRecorder)
  uploadVoiceMessage: (audioUri: string, duration: number) => Promise<void>;
  
  // Video recording - Uses ImagePicker (no camera modal)
  startVideoRecording: () => Promise<void>;
  uploadVideoMessage: (videoUri: string, duration: number) => Promise<void>;
  
  // Media sending
  handleSendImage: (uri: string) => Promise<void>;
  handleSendGif: (gifUrl: string, gifId?: string) => Promise<void>;
  handleSendFile: (uri: string, name: string, type: string) => Promise<void>;
  handleSendLocation: (location: { latitude: number; longitude: number; address?: string }) => Promise<void>;
}

export const useMediaHandlers = ({
  chatId,
  userId,
  jobId,
  otherUser,
  chatInfo,
  isRTL,
  messages,
  setMessages,
  allMessages,
  setAllMessages,
  cameraRef,
  cameraPermission,
  requestCameraPermission,
  micPermission,
  requestMicPermission,
  setIsRecording,
  setRecordingDuration,
  setIsUploadingVoice,
  setMediaRecorder,
  setAudioChunks,
  setIsRecordingVideo,
  setIsUploadingVideo,
  setShowCameraModal,
  setRecordingStartTime,
  recordingDuration,
  mediaRecorder,
  isRecordingVideo,
  recordingStartTime,
}: UseMediaHandlersOptions): UseMediaHandlersReturn => {
  
  // Voice recording: Upload (define first for use in startRecording)
  const uploadVoiceMessage = useCallback(async (audioUri: string, duration: number) => {
    if (!userId) return;

    // Generate message ID first for optimistic UI
    const { doc, collection, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('@/config/firebase');
    const tempMessageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const messageId = tempMessageRef.id;
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Add optimistic message immediately
    const optimisticMessage = {
      id: tempId,
      tempId,
      chatId,
      senderId: userId,
      text: '',
      type: 'voice' as const,
      attachments: [audioUri], // Use local URI temporarily
      duration: duration,
      status: 'sending' as const,
      uploadStatus: 'uploading' as const,
      readBy: [userId],
      fileMetadata: {
        originalName: `voice_${Date.now()}.m4a`,
        size: 0,
        type: 'audio/mp4',
      },
      createdAt: new Date(),
    };

    // Add optimistic message to UI
    const updatedMessages = [...messages, optimisticMessage];
    const updatedAllMessages = [...allMessages, optimisticMessage];
    setMessages(updatedMessages);
    setAllMessages(updatedAllMessages);

    try {
      setIsUploadingVoice(true);
      logger.debug('🎤 Uploading voice message...');

      // Upload to Firebase Storage with the message ID
      const { url } = await chatFileService.uploadVoiceMessage(
        chatId,
        audioUri,
        messageId,
        duration
      );

      // Create voice message with proper data
      const messageData = {
        chatId,
        senderId: userId,
        text: '', // Empty text for voice messages
        type: 'voice' as const,
        attachments: [url],
        duration: duration,
        status: 'sent' as const,
        uploadStatus: 'uploaded' as const,
        readBy: [userId],
        fileMetadata: {
          originalName: `voice_${Date.now()}.m4a`,
          size: 0,
          type: 'audio/mp4',
        },
        createdAt: serverTimestamp(),
      };

      // Update optimistic message with real data
      const messageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...messageData,
          id: messageId,
          createdAt: new Date(), // Use Date for UI, Firestore will have Timestamp
        };
        setMessages(updatedMessages);
        setAllMessages(updatedMessages);
      }

      // Use ChatStorageProvider to send the voice message (will use the messageId)
      await ChatStorageProvider.sendMessage(chatId, { ...messageData, id: messageId });

      // Update chat metadata
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة صوتية' : 'Voice message',
            senderId: userId,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        logger.warn('Failed to update chat metadata:', updateError);
      }

      // Trigger backend notification
      try {
        await MessageNotificationService.triggerBackendNotification(
          chatId, 
          userId, 
          isRTL ? 'رسالة صوتية' : 'Voice message'
        );
      } catch (notificationError) {
        logger.warn('Failed to trigger backend notification:', notificationError);
      }

      // Log for dispute resolution
      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          userId,
          [otherUser.id || otherUser.uid || ''],
          isRTL ? 'رسالة صوتية' : 'Voice message',
          [],
          { jobId }
        );
      }

      // Clean up temp file
      await chatFileService.cleanupTempAudioFile(audioUri);
      
      logger.info('✅ Voice message sent successfully');
      
    } catch (error) {
      logger.error('❌ Failed to upload voice message:', error);
      
      // Update optimistic message status to failed
      const failedMessageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
      if (failedMessageIndex !== -1) {
        updatedMessages[failedMessageIndex] = {
          ...updatedMessages[failedMessageIndex],
          status: 'failed' as const,
          uploadStatus: 'failed' as const,
        };
        setMessages(updatedMessages);
        setAllMessages(updatedMessages);
      }
      
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة الصوتية' : 'Failed to send voice message'
      );
      
      // Clean up temp file on error
      await chatFileService.cleanupTempAudioFile(audioUri);
    } finally {
      setIsUploadingVoice(false);
    }
  }, [chatId, userId, jobId, otherUser, isRTL, setIsUploadingVoice, messages, setMessages, allMessages, setAllMessages]);

  // Voice recording: Start/Stop - REMOVED (using AdvancedVoiceRecorder instead)
  // These functions have been removed as we now use AdvancedVoiceRecorder component
  // which handles recording internally and calls uploadVoiceMessage when complete


  // Video recording: Start - Uses ImagePicker instead of CameraView
  const startVideoRecording = useCallback(async () => {
    try {
      logger.debug('🎥 Opening video picker...');
      
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يجب السماح بالوصول إلى معرض الصور' : 'Media library permission required'
        );
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoAsset = result.assets[0];
        const videoUri = videoAsset.uri;
        const duration = videoAsset.duration ? Math.round(videoAsset.duration / 1000) : 0; // Convert to seconds
        
        logger.debug(`🎥 Video selected: ${videoUri}, duration: ${duration}s`);
        
        // Upload the selected video
        await uploadVideoMessage(videoUri, duration);
      } else {
        logger.debug('🎥 Video picker canceled');
      }
      
    } catch (error) {
      logger.error('❌ Failed to pick video:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل اختيار الفيديو' : 'Failed to pick video'
      );
    }
  }, [isRTL, uploadVideoMessage]);

  // Video recording: Record/Stop - REMOVED (using ImagePicker instead)
  // These functions have been removed as we now use ImagePicker for video selection
  // which handles recording internally

  // Video recording: Upload
  const uploadVideoMessage = useCallback(async (videoUri: string, duration: number) => {
    if (!userId) return;

    // Generate message ID first for optimistic UI
    const { doc, collection, serverTimestamp } = await import('firebase/firestore');
    const firebaseConfig = await import('@/config/firebase');
    const { db } = firebaseConfig;
    if (!db) {
      throw new Error('Firebase db not available');
    }
    const tempMessageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const messageId = tempMessageRef.id;
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Add optimistic message immediately
    const optimisticMessage = {
      id: tempId,
      tempId,
      chatId,
      senderId: userId,
      text: '',
      type: 'video' as const,
      attachments: [videoUri], // Use local URI temporarily
      thumbnailUrl: undefined,
      duration: duration,
      status: 'sending' as const,
      uploadStatus: 'uploading' as const,
      readBy: [userId],
      fileMetadata: {
        originalName: `video_${Date.now()}.mp4`,
        size: 0,
        type: 'video/mp4',
      },
      createdAt: new Date(),
    };

    // Add optimistic message to UI
    const updatedMessages = [...messages, optimisticMessage];
    const updatedAllMessages = [...allMessages, optimisticMessage];
    setMessages(updatedMessages);
    setAllMessages(updatedAllMessages);

    try {
      setIsUploadingVideo(true);
      logger.debug('🎥 Uploading video message...');

      // Upload to Firebase Storage with the message ID
      const { url, thumbnailUrl } = await chatFileService.uploadVideoMessage(
        chatId,
        videoUri,
        messageId,
        duration
      );

      // Create video message with proper data
      const messageData = {
        chatId,
        senderId: userId,
        text: '', // Empty text for video messages
        type: 'video' as const,
        attachments: [url],
        thumbnailUrl: thumbnailUrl,
        duration: duration,
        status: 'sent' as const,
        uploadStatus: 'uploaded' as const,
        readBy: [userId],
        fileMetadata: {
          originalName: `video_${Date.now()}.mp4`,
          size: 0,
          type: 'video/mp4',
        },
        createdAt: serverTimestamp(),
      };

      // Update optimistic message with real data
      const messageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...messageData,
          id: messageId,
          createdAt: new Date(), // Use Date for UI, Firestore will have Timestamp
        };
        setMessages(updatedMessages);
        setAllMessages(updatedMessages);
      }

      // Use ChatStorageProvider to send the video message (will use the messageId)
      await ChatStorageProvider.sendMessage(chatId, { ...messageData, id: messageId });

      // Update chat metadata
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة فيديو' : 'Video message',
            senderId: userId,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        logger.warn('Failed to update chat metadata:', updateError);
      }

      try {
        await MessageNotificationService.triggerBackendNotification(
          chatId,
          userId,
          isRTL ? 'رسالة فيديو' : 'Video message'
        );
      } catch (notificationError) {
        logger.warn('Failed to trigger backend notification:', notificationError);
      }

      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          userId,
          [otherUser.id || otherUser.uid || ''],
          isRTL ? 'رسالة فيديو' : 'Video message',
          [],
          { jobId }
        );
      }

      await chatFileService.cleanupTempVideoFile(videoUri);

      logger.info('✅ Video message sent successfully');

    } catch (error) {
      logger.error('❌ Failed to upload video message:', error);
      
      // Update optimistic message status to failed
      const failedMessageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
      if (failedMessageIndex !== -1) {
        updatedMessages[failedMessageIndex] = {
          ...updatedMessages[failedMessageIndex],
          status: 'failed' as const,
          uploadStatus: 'failed' as const,
        };
        setMessages(updatedMessages);
        setAllMessages(updatedMessages);
      }
      
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة الفيديو' : 'Failed to send video message'
      );

      await chatFileService.cleanupTempVideoFile(videoUri);
    } finally {
      setIsUploadingVideo(false);
    }
  }, [chatId, userId, jobId, otherUser, isRTL, setIsUploadingVideo, messages, setMessages, allMessages, setAllMessages]);

  // Send image
  const handleSendImage = useCallback(async (uri: string) => {
    logger.debug('🟡 [useMediaHandlers] handleSendImage START', { uri, chatId, userId, hasSetMessages: typeof setMessages === 'function', hasSetAllMessages: typeof setAllMessages === 'function' });
    
    try {
      if (!userId) {
        logger.warn('❌ [useMediaHandlers] Cannot send image: no userId');
        return;
      }
      
      logger.debug('🟡 [useMediaHandlers] UserId validated:', userId);
      
      if (!uri) {
        logger.warn('❌ [useMediaHandlers] Cannot send image: no URI provided');
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'لم يتم اختيار صورة' : 'No image selected'
        );
        return;
      }
      
      logger.debug('🟡 [useMediaHandlers] URI validated:', { uri, uriType: typeof uri, uriLength: uri.length });

      // Generate message ID first for optimistic UI
      logger.debug('🟡 [useMediaHandlers] Generating message ID...');
      let messageId: string;
      let tempId: string;
      let serverTimestamp: any; // Store for later use
      try {
        logger.debug('🟡 [useMediaHandlers] Importing Firebase modules...');
        const firestoreModule = await import('firebase/firestore');
        const { doc, collection } = firestoreModule;
        serverTimestamp = firestoreModule.serverTimestamp; // Store for later
        logger.debug('🟡 [useMediaHandlers] Firebase Firestore imported', { hasServerTimestamp: !!serverTimestamp });
        const { db } = await import('@/config/firebase');
        logger.debug('🟡 [useMediaHandlers] Firebase db imported', { hasDb: !!db });
        
        logger.debug('🟡 [useMediaHandlers] Creating temp message reference...');
        const tempMessageRef = doc(collection(db, 'chats', chatId, 'messages'));
        messageId = tempMessageRef.id;
        tempId = `temp_${Date.now()}_${Math.random()}`;
        logger.debug('🟡 [useMediaHandlers] Message ID generated', { messageId, tempId });
      } catch (error) {
        logger.error('❌ [useMediaHandlers] Failed to generate message ID:', error);
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل إنشاء معرف الرسالة' : 'Failed to create message ID'
        );
        return;
      }

      // Add optimistic message immediately - use functional updates to avoid stale state
      logger.debug('🟡 [useMediaHandlers] Creating optimistic message...');
      try {
        logger.debug('🟡 [useMediaHandlers] Building optimistic message object...');
        const optimisticMessage = {
          id: tempId,
          tempId,
          chatId,
          senderId: userId,
          text: '',
          type: 'image' as const,
          attachments: [uri], // Use local URI temporarily
          status: 'sending' as const,
          uploadStatus: 'uploading' as const,
          readBy: [userId] || [],
          fileMetadata: {
            originalName: `image_${Date.now()}.jpg`,
            size: 0,
            type: 'image/jpeg',
          },
          createdAt: new Date(),
        };
        logger.debug('🟡 [useMediaHandlers] Optimistic message object created', { tempId, uri, messageKeys: Object.keys(optimisticMessage) });

        // Validate state setters before using them
        logger.debug('🟡 [useMediaHandlers] Validating state setters...');
        if (typeof setMessages !== 'function' || typeof setAllMessages !== 'function') {
          logger.error('❌ [useMediaHandlers] State setters are not functions:', { 
            setMessages: typeof setMessages, 
            setAllMessages: typeof setAllMessages 
          });
          throw new Error('Invalid state setters');
        }
        logger.debug('🟡 [useMediaHandlers] State setters validated');

        // Use functional updates to avoid stale closure issues
        logger.debug('🟡 [useMediaHandlers] Updating messages state...');
        setMessages((currentMessages) => {
          logger.debug('🟡 [useMediaHandlers] setMessages callback called', { 
            currentType: typeof currentMessages, 
            isArray: Array.isArray(currentMessages),
            currentLength: Array.isArray(currentMessages) ? currentMessages.length : 'N/A'
          });
          if (!Array.isArray(currentMessages)) {
            logger.warn('⚠️ [useMediaHandlers] messages is not an array, resetting:', currentMessages);
            return [optimisticMessage];
          }
          const updated = [...currentMessages, optimisticMessage];
          logger.debug('🟡 [useMediaHandlers] messages updated', { oldLength: currentMessages.length, newLength: updated.length });
          return updated;
        });
        
        logger.debug('🟡 [useMediaHandlers] Updating allMessages state...');
        setAllMessages((currentAllMessages) => {
          logger.debug('🟡 [useMediaHandlers] setAllMessages callback called', { 
            currentType: typeof currentAllMessages, 
            isArray: Array.isArray(currentAllMessages),
            currentLength: Array.isArray(currentAllMessages) ? currentAllMessages.length : 'N/A'
          });
          if (!Array.isArray(currentAllMessages)) {
            logger.warn('⚠️ [useMediaHandlers] allMessages is not an array, resetting:', currentAllMessages);
            return [optimisticMessage];
          }
          const updated = [...currentAllMessages, optimisticMessage];
          logger.debug('🟡 [useMediaHandlers] allMessages updated', { oldLength: currentAllMessages.length, newLength: updated.length });
          return updated;
        });
        
        logger.debug('✅ [useMediaHandlers] Optimistic message added to UI', { tempId, uri });
      } catch (stateError) {
        logger.error('❌ [useMediaHandlers] Failed to add optimistic message:', stateError);
        // Don't throw - continue with upload even if optimistic UI fails
        // User will see message appear when Firestore listener updates
      }
      
      logger.debug('🟡 [useMediaHandlers] Proceeding to upload...');

      try {
        logger.debug('🟡 [useMediaHandlers] Starting upload try block', { uri, messageId, chatId });

        // Validate URI format
        logger.debug('🟡 [useMediaHandlers] Validating URI format...');
        if (!uri || typeof uri !== 'string') {
          logger.error('❌ [useMediaHandlers] Invalid URI format:', { uri, type: typeof uri });
          throw new Error('Invalid image URI');
        }
        logger.debug('🟡 [useMediaHandlers] URI format validated');

        // Upload image with the message ID - wrap in try/catch for better error handling
        logger.debug('🟡 [useMediaHandlers] Calling chatFileService.uploadImageMessage...', { chatId, messageId, uri });
        let url: string;
        try {
          logger.debug('🟡 [useMediaHandlers] chatFileService.uploadImageMessage START');
          const result = await chatFileService.uploadImageMessage(
            chatId,
            uri,
            messageId
          );
          logger.debug('🟡 [useMediaHandlers] chatFileService.uploadImageMessage SUCCESS', { url: result.url });
          url = result.url;
        } catch (uploadError) {
          logger.error('❌ [useMediaHandlers] Image upload failed:', uploadError);
          // Re-throw with more context
          throw new Error(`Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }

        // Create image message with proper data
        logger.debug('🟡 [useMediaHandlers] Creating message data object...', { url, messageId, hasServerTimestamp: !!serverTimestamp });
        if (!serverTimestamp) {
          logger.warn('⚠️ [useMediaHandlers] serverTimestamp not available, importing again...');
          const firestoreModule = await import('firebase/firestore');
          serverTimestamp = firestoreModule.serverTimestamp;
        }
        const messageData = {
          chatId,
          senderId: userId,
          text: '', // Empty text for image messages
          type: 'image' as const,
          attachments: [url],
          status: 'sent' as const,
          uploadStatus: 'uploaded' as const,
          readBy: [userId],
          fileMetadata: {
            originalName: `image_${Date.now()}.jpg`,
            size: 0,
            type: 'image/jpeg',
          },
          createdAt: serverTimestamp(),
        };
        logger.debug('🟡 [useMediaHandlers] Message data object created', { messageId, hasAttachments: !!messageData.attachments });

        // Update optimistic message with real data - use functional updates
        logger.debug('🟡 [useMediaHandlers] Updating optimistic message with real data...');
        setMessages((currentMessages) => {
          if (!Array.isArray(currentMessages)) {
            logger.warn('⚠️ [useMediaHandlers] messages is not an array during update');
            return currentMessages;
          }
          const messageIndex = currentMessages.findIndex(m => m.tempId === tempId);
          if (messageIndex !== -1) {
            const updated = [...currentMessages];
            updated[messageIndex] = {
              ...messageData,
              id: messageId,
              tempId: undefined, // Remove tempId so Firestore listener can replace it
              createdAt: new Date(), // Use Date for UI, Firestore will have Timestamp
            };
            logger.debug('🟡 [useMediaHandlers] Updated message in messages array', { messageIndex, messageId, tempIdRemoved: true });
            return updated;
          }
          return currentMessages;
        });
        
        setAllMessages((currentAllMessages) => {
          if (!Array.isArray(currentAllMessages)) {
            logger.warn('⚠️ [useMediaHandlers] allMessages is not an array during update');
            return currentAllMessages;
          }
          const messageIndex = currentAllMessages.findIndex(m => m.tempId === tempId);
          if (messageIndex !== -1) {
            const updated = [...currentAllMessages];
            updated[messageIndex] = {
              ...messageData,
              id: messageId,
              tempId: undefined, // Remove tempId so Firestore listener can replace it
              createdAt: new Date(),
            };
            logger.debug('🟡 [useMediaHandlers] Updated message in allMessages array', { messageIndex, messageId, tempIdRemoved: true });
            return updated;
          }
          return currentAllMessages;
        });
        logger.debug('🟡 [useMediaHandlers] Optimistic message updated with real data');

        // Use ChatStorageProvider to send the image message (will use the messageId)
        logger.debug('🟡 [useMediaHandlers] Sending message to ChatStorageProvider...', { chatId, messageId });
        await ChatStorageProvider.sendMessage(chatId, { ...messageData, id: messageId });
        logger.debug('🟡 [useMediaHandlers] Message sent to ChatStorageProvider successfully');

        // Update chat metadata
        logger.debug('🟡 [useMediaHandlers] Updating chat metadata...');
        try {
          if (!serverTimestamp) {
            logger.warn('⚠️ [useMediaHandlers] serverTimestamp not available for metadata, importing again...');
            const firestoreModule = await import('firebase/firestore');
            serverTimestamp = firestoreModule.serverTimestamp;
          }
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('@/config/firebase');
          
          logger.debug('🟡 [useMediaHandlers] Calling updateDoc for chat metadata...');
          await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: {
              text: isRTL ? 'رسالة صورة' : 'Image message',
              senderId: userId,
              timestamp: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          });
          logger.debug('🟡 [useMediaHandlers] Chat metadata updated successfully');
        } catch (updateError) {
          logger.warn('⚠️ [useMediaHandlers] Failed to update chat metadata:', updateError);
        }

        try {
          logger.debug('🟡 [useMediaHandlers] Triggering backend notification...');
          await MessageNotificationService.triggerBackendNotification(
            chatId,
            userId,
            isRTL ? 'رسالة صورة' : 'Image message'
          );
          logger.debug('🟡 [useMediaHandlers] Backend notification triggered');
        } catch (notificationError) {
          logger.warn('⚠️ [useMediaHandlers] Failed to trigger backend notification:', notificationError);
        }

        // Log image message for dispute resolution
        if (messageId && otherUser) {
          logger.debug('🟡 [useMediaHandlers] Logging message for dispute resolution...');
          await disputeLoggingService.logMessage(
            messageId,
            chatId,
            userId,
            [otherUser.id || otherUser.uid || ''],
            `[Image: image_${Date.now()}.jpg]`,
            [{
              url: url,
              type: 'image/jpeg',
              size: 0,
              filename: `image_${Date.now()}.jpg`,
            }],
            { jobId, messageType: 'image' }
          );
          logger.debug('🟡 [useMediaHandlers] Message logged for dispute resolution');
        }

        logger.info('✅ [useMediaHandlers] Image message sent successfully');
    } catch (error) {
      logger.error('❌ Error sending image message:', error);
      
      // Update optimistic message status to failed - use fresh state
      setMessages(currentMessages => {
        const failedIndex = currentMessages.findIndex(m => m.tempId === tempId);
        if (failedIndex !== -1) {
          const updated = [...currentMessages];
          updated[failedIndex] = {
            ...updated[failedIndex],
            status: 'failed' as const,
            uploadStatus: 'failed' as const,
          };
          return updated;
        }
        return currentMessages;
      });
      
      setAllMessages(currentAllMessages => {
        const failedIndex = currentAllMessages.findIndex(m => m.tempId === tempId);
        if (failedIndex !== -1) {
          const updated = [...currentAllMessages];
          updated[failedIndex] = {
            ...updated[failedIndex],
            status: 'failed' as const,
            uploadStatus: 'failed' as const,
          };
          return updated;
        }
        return currentAllMessages;
      });
      
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل إرسال الرسالة الصورة' : 'Failed to send image message'
        );
      }
      logger.debug('🟡 [useMediaHandlers] handleSendImage END (success or error handled)');
    } catch (outerError) {
      logger.error('❌ [useMediaHandlers] OUTER CATCH - handleSendImage failed:', outerError);
      logger.error('❌ [useMediaHandlers] Outer error details:', {
        message: outerError instanceof Error ? outerError.message : 'Unknown error',
        stack: outerError instanceof Error ? outerError.stack : undefined,
        errorType: typeof outerError,
        error: outerError
      });
      throw outerError;
    }
  }, [chatId, userId, jobId, otherUser, isRTL, messages, setMessages, allMessages, setAllMessages]);

  // GIF sending handler
  const handleSendGif = useCallback(async (gifUrl: string, gifId?: string) => {
    if (!userId || !chatId) return;

    try {
      logger.debug('🎬 Sending GIF...');
      
      let finalUrl = gifUrl;
      if (gifUrl.startsWith('file://') || gifUrl.startsWith('content://')) {
        const { url } = await chatFileService.uploadImageMessage(chatId, gifUrl, userId);
        finalUrl = url;
      }

      const messageData = {
        chatId,
        senderId: userId,
        text: gifId ? `GIF:${gifId}` : '',
        type: 'image' as const,
        attachments: [finalUrl],
        status: 'sent' as const,
        readBy: [userId],
        fileMetadata: {
          originalName: `gif_${Date.now()}.gif`,
          size: 0,
          type: 'image/gif',
        },
      };

      const messageId = await ChatStorageProvider.sendMessage(chatId, messageData);

      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة GIF' : 'GIF message',
            senderId: userId,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        logger.warn('Failed to update chat metadata:', updateError);
      }

      if (otherUser) {
        try {
          await MessageNotificationService.sendMessageNotification(
            chatId,
            messageId || '',
            '🎬 GIF',
            userId,
            otherUser.id || otherUser.uid || ''
          );
        } catch (notificationError) {
          logger.warn('Failed to send notification:', notificationError);
        }

        await disputeLoggingService.logMessage(
          messageId || '',
          chatId,
          userId,
          [otherUser.id || otherUser.uid || ''],
          '🎬 GIF',
          [finalUrl],
          { jobId }
        );
      }

      logger.debug('✅ GIF sent successfully');
    } catch (error) {
      logger.error('❌ Error sending GIF:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال GIF' : 'Failed to send GIF'
      );
    }
  }, [chatId, userId, otherUser, jobId, isRTL]);

  // Send file
  const handleSendFile = useCallback(async (uri: string, name: string, type: string) => {
    if (!userId) return;

    // Generate message ID first for optimistic UI
    const { doc, collection, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('@/config/firebase');
    const tempMessageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const messageId = tempMessageRef.id;
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Add optimistic message immediately
    const optimisticMessage = {
      id: tempId,
      tempId,
      chatId,
      senderId: userId,
      text: '',
      type: 'file' as const,
      attachments: [uri], // Use local URI temporarily
      status: 'sending' as const,
      uploadStatus: 'uploading' as const,
      readBy: [userId],
      fileMetadata: {
        originalName: name,
        size: 0,
        type: type,
      },
      createdAt: new Date(),
    };

    // Add optimistic message to UI
    const updatedMessages = [...messages, optimisticMessage];
    const updatedAllMessages = [...allMessages, optimisticMessage];
    setMessages(updatedMessages);
    setAllMessages(updatedAllMessages);

    try {
      logger.debug('📄 Uploading file message...');

      // Extract file extension
      const fileExtension = name.split('.').pop() || 'bin';

      // Upload file first (uploadFileMessage expects messageId, not userId)
      const { url } = await chatFileService.uploadFileMessage(
        chatId,
        uri,
        messageId,
        type,
        fileExtension
      );

      // Create file message with proper data
      const messageData = {
        chatId,
        senderId: userId,
        text: '', // Empty text for file messages
        type: 'file' as const,
        attachments: [url],
        status: 'sent' as const,
        uploadStatus: 'uploaded' as const,
        readBy: [userId],
        fileMetadata: {
          originalName: name,
          size: 0,
          type: type,
        },
        createdAt: serverTimestamp(),
      };

      // Update optimistic message with real data
      const messageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...messageData,
          id: messageId,
          createdAt: new Date(), // Use Date for UI, Firestore will have Timestamp
        };
        setMessages(updatedMessages);
        setAllMessages(updatedMessages);
      }

      // Use ChatStorageProvider to send the file message
      await ChatStorageProvider.sendMessage(chatId, { ...messageData, id: messageId });

      // Update chat metadata
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة ملف' : 'File message',
            senderId: userId,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        logger.warn('Failed to update chat metadata:', updateError);
      }

      try {
        await MessageNotificationService.triggerBackendNotification(
          chatId,
          userId,
          isRTL ? 'رسالة ملف' : 'File message'
        );
      } catch (notificationError) {
        logger.warn('Failed to trigger backend notification:', notificationError);
      }

      // Log file message for dispute resolution
      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          userId,
          [otherUser.id || otherUser.uid || ''],
          `[File: ${name}]`,
          [{
            url: url,
            type,
            size: 0,
            filename: name,
          }],
          { jobId, messageType: 'file' }
        );
      }

      logger.info('✅ File message sent successfully');
    } catch (error) {
      logger.error('❌ Error sending file message:', error);
      
      // Update optimistic message status to failed
      const failedMessageIndex = updatedMessages.findIndex(m => m.tempId === tempId);
      if (failedMessageIndex !== -1) {
        updatedMessages[failedMessageIndex] = {
          ...updatedMessages[failedMessageIndex],
          status: 'failed' as const,
          uploadStatus: 'failed' as const,
        };
        setMessages(updatedMessages);
        setAllMessages(updatedMessages);
      }
      
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة الملف' : 'Failed to send file message'
      );
    }
  }, [chatId, userId, jobId, otherUser, isRTL, messages, setMessages, allMessages, setAllMessages]);

  // Send location
  const handleSendLocation = useCallback(async (location: { latitude: number; longitude: number; address?: string }) => {
    if (!userId) return;

    try {
      // Create Google Maps link
      const googleMapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      
      // Create Apple Maps link (for iOS)
      const appleMapsLink = `http://maps.apple.com/?ll=${location.latitude},${location.longitude}`;
      
      // Create a rich location message with clickable links
      const locationText = `📍 ${location.address || 'Shared Location'}\n\n` +
        `📱 Open in:\n` +
        `Google Maps: ${googleMapsLink}\n` +
        `Apple Maps: ${appleMapsLink}\n\n` +
        `📌 Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;

      // Send location message through chat service
      await chatService.sendMessage(chatId, locationText, userId);

      // Log for dispute resolution
      await disputeLoggingService.logMessage(
        `location-${Date.now()}`,
        chatId,
        userId,
        chatInfo?.participants?.filter((id: string) => id !== userId) || [],
        locationText,
        [],
        {
          type: 'LOCATION',
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          googleMapsLink,
          appleMapsLink,
        }
      );
    } catch (error) {
      logger.error('Error sending location:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الموقع' : 'Failed to send location'
      );
    }
  }, [chatId, userId, chatInfo, isRTL]);

  return {
    // Voice recording - Only upload (recording done by AdvancedVoiceRecorder)
    uploadVoiceMessage,
    
    // Video recording - ImagePicker (no camera modal)
    startVideoRecording,
    uploadVideoMessage,
    
    // Media sending
    handleSendImage,
    handleSendGif,
    handleSendFile,
    handleSendLocation,
  };
};

export default useMediaHandlers;
