import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text,
  Image,
  StyleSheet, 
  FlatList, 
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  RefreshControl,
  AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { chatFileService } from '@/services/chatFileService';
import { chatOptionsService } from '@/services/chatOptionsService';
import { messageSearchService } from '@/services/messageSearchService';
import { disputeLoggingService } from '@/services/disputeLoggingService';
import MessageNotificationService from '@/services/MessageNotificationService';
import PresenceService, { clearTyping, isTypingFresh } from '@/services/PresenceService';
import ChatStorageProvider from '@/services/ChatStorageProvider';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { MessageLoading } from '@/components/MessageLoading';
import { EditHistoryModal } from '@/components/EditHistoryModal';
import { 
  ArrowLeft, 
  MoreVertical, 
  User, 
  BellOff, 
  Ban, 
  Flag, 
  Trash2,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video as ExpoVideo } from 'expo-av';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();
  const chatId = jobId as string;

  // State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMessageHistory, setSelectedMessageHistory] = useState<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [presenceMap, setPresenceMap] = useState<Record<string, {state: 'online'|'offline', lastSeen: number}>>({});
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Video recording state
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  
  // Camera permissions hook
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  // Microphone permissions hook
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  // Request camera and microphone permissions on mount
  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    if (!micPermission?.granted) {
      requestMicPermission();
    }
  }, [cameraPermission, requestCameraPermission, micPermission, requestMicPermission]);
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastReadMarkTime, setLastReadMarkTime] = useState(0);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const typingDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load chat info and other user details
  useEffect(() => {
    if (!chatId || !user) return;

    const loadChatInfo = () => {
      try {
        // Mark chat as read when user opens it
        chatService.markChatAsRead(chatId, user.uid);
        
        // Listen to chat details
        const unsubscribe = chatService.listenToChat(chatId, (chat) => {
          if (chat) {
            setChatInfo(chat);
            
            // Subscribe to presence for all participants
            const participantIds = chat.participants.filter((id: string) => id !== user.uid);
            if (participantIds.length > 0) {
              const unsubscribePresence = PresenceService.subscribeUsersPresence(
                participantIds,
                (presence) => {
                  setPresenceMap(presence);
                }
              );
              
              // Store unsubscribe function for cleanup
              return () => {
                unsubscribePresence();
              };
            }
            
            // Get other user ID
            const otherUserId = chat.participants.find((id: string) => id !== user.uid);
            if (otherUserId) {
              // Get other user's name from participantNames
              const otherUserName = chat.participantNames?.[otherUserId] || 'User';
              setOtherUser({
                id: otherUserId,
                name: otherUserName,
                // In a real app, you'd fetch the profile picture from users collection
                avatar: null,
              });
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading chat info:', error);
        return () => {};
      }
    };

    loadChatInfo();
  }, [chatId, user]);

  // Load messages
  useEffect(() => {
    if (!chatId || !user) return;

    setLoading(true);
    let previousMessageCount = 0;
    
    const unsubscribe = chatService.listenToMessages(chatId, async (newMessages) => {
      // Check if there are new messages
      if (newMessages.length > previousMessageCount && previousMessageCount > 0) {
        const latestMessage = newMessages[newMessages.length - 1];
        
        // Send notification if message is from someone else
        if (latestMessage.senderId !== user.uid) {
          const senderName = await MessageNotificationService.getSenderName(latestMessage.senderId);
          await MessageNotificationService.sendMessageNotification(
            chatId,
            latestMessage.senderId,
            senderName,
            latestMessage.text || 'Sent a file',
            user.uid
          );
        }
      }
      
      previousMessageCount = newMessages.length;
      setMessages(newMessages);
      setLoading(false);
      
      // Scroll to bottom on new messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  // Subscribe to typing indicators with TTL filtering
  useEffect(() => {
    if (!chatId || !user) return;

    const unsubscribeTyping = PresenceService.subscribeTyping(chatId, (typingUids) => {
      // Filter out stale typing indicators using TTL
      const freshTypingUsers = typingUids.filter(uid => {
        // The PresenceService already filters by TTL, but we can add extra validation here
        return true; // Trust the service's TTL filtering
      });
      setTypingUsers(freshTypingUsers);
    });

    return () => {
      unsubscribeTyping();
      PresenceService.stopTyping(chatId);
    };
  }, [chatId, user]);

  // Cleanup typing on unmount/background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clear typing when app goes to background
        if (chatId && user) {
          clearTyping(chatId, user.uid);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription?.remove();
      if (chatId && user) {
        clearTyping(chatId, user.uid);
      }
    };
  }, [chatId, user]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        handleKeyboardHide(); // Stop typing when keyboard hides
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [chatId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear typing timers
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      // Force stop all typing indicators (emergency cleanup)
      PresenceService.forceStopAllTyping();
      // Stop typing when component unmounts
      if (chatId) {
        PresenceService.stopTyping(chatId);
      }
    };
  }, [chatId]);

  // Mark messages as read on screen focus
  useFocusEffect(
    React.useCallback(() => {
      if (!chatId || !user || !messages.length) return;

      const markLatestAsRead = async () => {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage && latestMessage.senderId !== user.uid) {
          console.log('📖 Focus: Marking latest message as read');
          await chatService.markAsRead(chatId, [latestMessage.id], user.uid);
        }
      };

      markLatestAsRead();
    }, [chatId, user, messages])
  );

  // Throttled function to mark visible messages as read
  const markVisibleMessagesAsRead = React.useCallback(async (visibleMessageIds: string[]) => {
    const now = Date.now();
    if (now - lastReadMarkTime < 500) return; // Throttle to max 1 write per 500ms
    
    if (!chatId || !user || !visibleMessageIds.length) return;
    
    setLastReadMarkTime(now);
    console.log('📖 Scroll: Marking visible messages as read', visibleMessageIds.length);
    await chatService.markAsRead(chatId, visibleMessageIds, user.uid);
  }, [chatId, user, lastReadMarkTime]);

  // Handle typing with debounce
  const handleTyping = () => {
    if (!chatId) return;

    // Clear existing debounce timeout
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    // Start typing after 300ms debounce
    typingDebounceRef.current = setTimeout(() => {
      PresenceService.startTyping(chatId);
    }, 300);

    // Clear existing inactivity timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity (reduced from 3)
    typingTimeoutRef.current = setTimeout(() => {
      PresenceService.stopTyping(chatId);
    }, 2000);
  };

  // Handle keyboard hide - stop typing immediately
  const handleKeyboardHide = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    PresenceService.stopTyping(chatId);
  };
  
  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const messageText = inputText.trim();
    setInputText('');

    // Stop typing immediately when sending message
    handleKeyboardHide();

    try {
      if (editingMessageId) {
        // Edit existing message
        const originalMessage = messages.find(m => m.id === editingMessageId);
        await chatService.editMessage(chatId, editingMessageId, messageText);
        
        // Log edit for dispute resolution
        if (originalMessage?.content) {
          await disputeLoggingService.logEdit(
            editingMessageId,
            user.uid,
            originalMessage.content,
            messageText,
            'User edited message'
          );
        }
        
        setEditingMessageId(null);
        setEditingText('');
      } else {
        // Send new message
        const messageId = await chatService.sendMessage(chatId, messageText, user.uid);
        
        // Trigger backend push notification
        try {
          await MessageNotificationService.triggerBackendNotification(chatId, user.uid, messageText);
        } catch (notificationError) {
          console.warn('Failed to trigger backend notification:', notificationError);
        }
        
        // Log message for dispute resolution
        if (messageId && otherUser) {
          await disputeLoggingService.logMessage(
            messageId,
            chatId,
            user.uid,
            [otherUser.uid],
            messageText,
            [],
            { jobId }
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message'
      );
    }
  };

  // Voice recording functions using Web Audio API
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'تسجيل الصوت غير مدعوم في هذا المتصفح' : 'Audio recording not supported in this browser'
        );
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (recordingDuration > 0) {
          await uploadVoiceMessage(audioUrl, recordingDuration);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording
      recorder.start(1000); // Collect data every second

      // Start duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Store timer reference for cleanup
      (recorder as any).timer = timer;
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل بدء التسجيل' : 'Failed to start recording'
      );
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder) return;

    try {
      console.log('🎤 Stopping recording...');
      setIsRecording(false);
      
      // Clear timer
      if ((mediaRecorder as any).timer) {
        clearInterval((mediaRecorder as any).timer);
      }

      // Stop recording
      mediaRecorder.stop();
      
      setMediaRecorder(null);
      setAudioChunks([]);
      
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إيقاف التسجيل' : 'Failed to stop recording'
      );
    }
  };

  const uploadVoiceMessage = async (audioUri: string, duration: number) => {
    if (!user) return;

    try {
      setIsUploadingVoice(true);
      console.log('🎤 Uploading voice message...');

      // Upload to Firebase Storage
      const { url } = await chatFileService.uploadVoiceMessage(
        chatId,
        audioUri,
        user.uid,
        duration
      );

      // Create voice message with proper data
      const messageData = {
        chatId,
        senderId: user.uid,
        text: '', // Empty text for voice messages
        type: 'voice' as const,
        attachments: [url],
        duration: duration,
        status: 'sent' as const,
        readBy: [user.uid],
        fileMetadata: {
          originalName: `voice_${Date.now()}.m4a`,
          size: 0, // Size not available from uploadVoiceMessage
          type: 'audio/mp4',
        },
      };

      // Use ChatStorageProvider to send the voice message
      const messageId = await ChatStorageProvider.sendMessage(chatId, messageData);

      // Update chat metadata
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../../../config/firebase');
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة صوتية' : 'Voice message',
            senderId: user.uid,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        console.warn('Failed to update chat metadata:', updateError);
      }

      // Trigger backend notification
      try {
        await MessageNotificationService.triggerBackendNotification(
          chatId, 
          user.uid, 
          isRTL ? 'رسالة صوتية' : 'Voice message'
        );
      } catch (notificationError) {
        console.warn('Failed to trigger backend notification:', notificationError);
      }

      // Log for dispute resolution
      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          user.uid,
          [otherUser.uid],
          isRTL ? 'رسالة صوتية' : 'Voice message',
          [],
          { jobId }
        );
      }

      // Clean up temp file
      await chatFileService.cleanupTempAudioFile(audioUri);
      
      console.log('✅ Voice message sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to upload voice message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة الصوتية' : 'Failed to send voice message'
      );
      
      // Clean up temp file on error
      await chatFileService.cleanupTempAudioFile(audioUri);
    } finally {
      setIsUploadingVoice(false);
    }
  };

  // Video recording functions
  const startVideoRecording = async () => {
    try {
      console.log('🎥 Starting video recording...');
      
      // Check camera permissions
      if (!permission?.granted) {
        await requestPermission();
        if (!permission?.granted) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'يجب السماح بالوصول للكاميرا' : 'Camera permission required'
          );
          return;
        }
      }

      // Check microphone permissions
      if (!micPermission?.granted) {
        await requestMicPermission();
        if (!micPermission?.granted) {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'يجب السماح بالوصول للميكروفون' : 'Microphone permission required'
          );
          return;
        }
      }

      setShowCameraModal(true);
      
    } catch (error) {
      console.error('❌ Failed to start video recording:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل بدء تسجيل الفيديو' : 'Failed to start video recording'
      );
    }
  };

  const recordVideo = async () => {
    if (!cameraRef.current) {
      console.error('❌ Camera ref is null');
      return;
    }

    try {
      if (!isRecordingVideo) {
        // Check if camera is ready
        if (!cameraRef.current) {
          console.error('❌ Camera is not ready');
          return;
        }
        
        // Start recording
        setIsRecordingVideo(true);
        setRecordingStartTime(Date.now());
        console.log('🎥 Starting video recording...');
        
        // Add a small delay to ensure camera is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Start recording - this will continue until stopped
        try {
          const recordingPromise = cameraRef.current.recordAsync({
            maxDuration: 60, // 1 minute max
          });
          
          console.log('🎥 Recording promise created, waiting for completion...');
          
          recordingPromise.then(async (video) => {
            console.log('🎥 Recording promise resolved with video:', video);
            if (video && video.uri) {
              console.log('🎥 Video recording completed:', video.uri);
              // Get video duration from file info since it's not returned by recordAsync
              const fileInfo = await FileSystem.getInfoAsync(video.uri);
              const duration = 0; // We'll need to get this from the video file itself
              await uploadVideoMessage(video.uri, duration);
            }
            
            // Reset state after recording completes
            setIsRecordingVideo(false);
            setRecordingStartTime(null);
            setShowCameraModal(false);
          }).catch((error) => {
            console.error('❌ Recording promise rejected:', error);
            setIsRecordingVideo(false);
            setRecordingStartTime(null);
            setShowCameraModal(false);
          });
          
          console.log('🎥 Recording started successfully');
        } catch (startError) {
          console.error('❌ Failed to start recording:', startError);
          setIsRecordingVideo(false);
          setRecordingStartTime(null);
          setShowCameraModal(false);
        }
      } else {
        // Check minimum recording time (2 seconds)
        const currentTime = Date.now();
        const recordingDuration = recordingStartTime ? currentTime - recordingStartTime : 0;
        const minRecordingTime = 2000; // 2 seconds minimum
        
        console.log(`🎥 Recording duration check: ${recordingDuration}ms (min: ${minRecordingTime}ms)`);
        console.log(`🎥 Recording start time: ${recordingStartTime}, current time: ${currentTime}`);
        
        if (recordingDuration < minRecordingTime) {
          console.log(`🎥 Recording too short (${recordingDuration}ms), waiting for minimum time...`);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'يجب تسجيل فيديو لمدة ثانيتين على الأقل' : 'Please record for at least 2 seconds'
          );
          return;
        }
        
        // Stop recording
        console.log('🎥 Stopping video recording...');
        cameraRef.current.stopRecording();
      }
      
    } catch (error) {
      console.error('❌ Failed to record video:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تسجيل الفيديو' : 'Failed to record video'
      );
      setIsRecordingVideo(false);
      setRecordingStartTime(null);
      setShowCameraModal(false);
    }
  };

  const stopVideoRecording = async () => {
    if (!cameraRef.current) return;

    try {
      // Check minimum recording time (2 seconds)
      const currentTime = Date.now();
      const recordingDuration = recordingStartTime ? currentTime - recordingStartTime : 0;
      const minRecordingTime = 2000; // 2 seconds minimum
      
      console.log(`🎥 StopVideoRecording - Duration check: ${recordingDuration}ms (min: ${minRecordingTime}ms)`);
      console.log(`🎥 StopVideoRecording - Start time: ${recordingStartTime}, current time: ${currentTime}`);
      
      if (recordingDuration < minRecordingTime) {
        console.log(`🎥 StopVideoRecording - Recording too short (${recordingDuration}ms), waiting for minimum time...`);
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'يجب تسجيل فيديو لمدة ثانيتين على الأقل' : 'Please record for at least 2 seconds'
        );
        return;
      }
      
      console.log('🎥 StopVideoRecording - Stopping video recording...');
      cameraRef.current.stopRecording();
      setIsRecordingVideo(false);
      setRecordingStartTime(null);
      setShowCameraModal(false);
    } catch (error) {
      console.error('❌ Failed to stop video recording:', error);
    }
  };

  const uploadVideoMessage = async (videoUri: string, duration: number) => {
    if (!user) return;

    try {
      setIsUploadingVideo(true);
      console.log('🎥 Uploading video message...');

      const { url, thumbnailUrl } = await chatFileService.uploadVideoMessage(
        chatId,
        videoUri,
        user.uid,
        duration
      );

      // Create video message with proper data
      const messageData = {
        chatId,
        senderId: user.uid,
        text: '', // Empty text for video messages
        type: 'video' as const,
        attachments: [url],
        thumbnailUrl: thumbnailUrl,
        duration: duration,
        status: 'sent' as const,
        readBy: [user.uid],
        fileMetadata: {
          originalName: `video_${Date.now()}.mp4`,
          size: 0, // Size not available from uploadVideoMessage
          type: 'video/mp4',
        },
      };

      // Use ChatStorageProvider to send the video message
      const messageId = await ChatStorageProvider.sendMessage(chatId, messageData);

      // Update chat metadata
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../../../config/firebase');
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة فيديو' : 'Video message',
            senderId: user.uid,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        console.warn('Failed to update chat metadata:', updateError);
      }

      try {
        await MessageNotificationService.triggerBackendNotification(
          chatId,
          user.uid,
          isRTL ? 'رسالة فيديو' : 'Video message'
        );
      } catch (notificationError) {
        console.warn('Failed to trigger backend notification:', notificationError);
      }

      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          user.uid,
          [otherUser.uid],
          isRTL ? 'رسالة فيديو' : 'Video message',
          [],
          { jobId }
        );
      }

      await chatFileService.cleanupTempVideoFile(videoUri);

      console.log('✅ Video message sent successfully');

    } catch (error) {
      console.error('❌ Failed to upload video message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة الفيديو' : 'Failed to send video message'
      );

      await chatFileService.cleanupTempVideoFile(videoUri);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Send image
  const handleSendImage = async (uri: string) => {
    if (!user) return;

    try {
      console.log('📸 Uploading image message...');

      // Upload image first
      const { url } = await chatFileService.uploadImageMessage(
        chatId,
        uri,
        user.uid
      );

      // Create image message with proper data
      const messageData = {
        chatId,
        senderId: user.uid,
        text: '', // Empty text for image messages
        type: 'image' as const,
        attachments: [url],
        status: 'sent' as const,
        readBy: [user.uid],
        fileMetadata: {
          originalName: `image_${Date.now()}.jpg`,
          size: 0, // Size not available from uploadImageMessage
          type: 'image/jpeg',
        },
      };

      // Use ChatStorageProvider to send the image message
      const messageId = await ChatStorageProvider.sendMessage(chatId, messageData);

      // Update chat metadata
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../../../config/firebase');
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة صورة' : 'Image message',
            senderId: user.uid,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        console.warn('Failed to update chat metadata:', updateError);
      }

      try {
        await MessageNotificationService.triggerBackendNotification(
          chatId,
          user.uid,
          isRTL ? 'رسالة صورة' : 'Image message'
        );
      } catch (notificationError) {
        console.warn('Failed to trigger backend notification:', notificationError);
      }

      // Log image message for dispute resolution
      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          user.uid,
          [otherUser.uid],
          `[Image: image_${Date.now()}.jpg]`,
          [{
            url: url,
            type: 'image/jpeg',
            size: 0,
            filename: `image_${Date.now()}.jpg`,
          }],
          { jobId, messageType: 'image' }
        );
      }

      console.log('✅ Image message sent successfully');
    } catch (error) {
      console.error('❌ Error sending image message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة الصورة' : 'Failed to send image message'
      );
    }
  };

  // Send file
  const handleSendFile = async (uri: string, name: string, type: string) => {
    if (!user) return;

    try {
      console.log('📄 Uploading file message...');

      // Extract file extension
      const fileExtension = name.split('.').pop() || 'bin';

      // Upload file first
      const { url } = await chatFileService.uploadFileMessage(
        chatId,
        uri,
        user.uid,
        type,
        fileExtension
      );

      // Create file message with proper data
      const messageData = {
        chatId,
        senderId: user.uid,
        text: '', // Empty text for file messages
        type: 'file' as const,
        attachments: [url],
        status: 'sent' as const,
        readBy: [user.uid],
        fileMetadata: {
          originalName: name,
          size: 0, // Size not available from uploadFileMessage
          type: type,
        },
      };

      // Use ChatStorageProvider to send the file message
      const messageId = await ChatStorageProvider.sendMessage(chatId, messageData);

      // Update chat metadata
      try {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../../../config/firebase');
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: isRTL ? 'رسالة ملف' : 'File message',
            senderId: user.uid,
            timestamp: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        console.warn('Failed to update chat metadata:', updateError);
      }

      try {
        await MessageNotificationService.triggerBackendNotification(
          chatId,
          user.uid,
          isRTL ? 'رسالة ملف' : 'File message'
        );
      } catch (notificationError) {
        console.warn('Failed to trigger backend notification:', notificationError);
      }

      // Log file message for dispute resolution
      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          user.uid,
          [otherUser.uid],
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

      console.log('✅ File message sent successfully');
    } catch (error) {
      console.error('❌ Error sending file message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الرسالة الملف' : 'Failed to send file message'
      );
    }
  };

  // Send location
  const handleSendLocation = async (location: { latitude: number; longitude: number; address?: string }) => {
    if (!user) return;

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
      await chatService.sendMessage(chatId, locationText, user.uid);

      // Log for dispute resolution
      await disputeLoggingService.logMessage(
        `location-${Date.now()}`,
        chatId,
        user.uid,
        chatInfo?.participants.filter((id: string) => id !== user.uid) || [],
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
      console.error('Error sending location:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الموقع' : 'Failed to send location'
      );
    }
  };

  // Edit message
  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingText(currentText);
    setInputText(currentText);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
    setInputText('');
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      await chatService.deleteMessage(chatId, messageId, user.uid);
      
      // Log deletion for dispute resolution
      if (message?.content) {
        await disputeLoggingService.logDeletion(
          messageId,
          user.uid,
          message.content,
          true,
          'User deleted message'
        );
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل حذف الرسالة' : 'Failed to delete message'
      );
    }
  };

  // View edit history
  const handleViewHistory = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setSelectedMessageHistory(message);
      setShowHistoryModal(true);
    }
  };

  // Refresh messages
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Messages are synced in real-time via Firebase listeners
      // This provides visual feedback to the user
      await new Promise(resolve => setTimeout(resolve, 500));
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم التحديث' : 'Refreshed',
        isRTL ? 'تم تحديث الرسائل' : 'Messages updated'
      );
    } catch (error) {
      console.error('Error refreshing chat:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديث الرسائل' : 'Failed to refresh messages'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Download file or image
  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      // Determine if it's an image
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename) || url.includes('image');

      // Show loading
      CustomAlertService.showInfo(
        isRTL ? 'جاري التنزيل' : 'Downloading',
        isRTL ? (isImage ? 'جاري حفظ الصورة...' : 'جاري تنزيل الملف...') : (isImage ? 'Saving image...' : 'Downloading file...')
      );

      // Get document directory
      const docDir = '/tmp/';
      if (!docDir) {
        throw new Error('Document directory not available');
      }

      // Create safe filename
      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = docDir + safeFilename;

      // Download file
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: isImage ? 'image/*' : 'application/octet-stream',
            dialogTitle: isRTL ? (isImage ? 'حفظ الصورة' : 'مشاركة الملف') : (isImage ? 'Save Image' : 'Share File'),
          });
          
          CustomAlertService.showSuccess(
            isRTL ? 'تم' : 'Success',
            isRTL ? (isImage ? 'يمكنك الآن حفظ الصورة من خيارات المشاركة' : 'تم فتح خيارات المشاركة') : (isImage ? 'You can now save the image from share options' : 'Share options opened')
          );
        } else {
          CustomAlertService.showSuccess(
            isRTL ? 'تم التنزيل' : 'Downloaded',
            isRTL ? `تم حفظ ${isImage ? 'الصورة' : 'الملف'}` : `${isImage ? 'Image' : 'File'} saved successfully`
          );
        }
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل التنزيل' : 'Failed to download'
      );
    }
  };

  // Check if user is admin (simplified - would check Firebase custom claims)
  const isAdmin = user?.email?.includes('admin') || false;

  // Check mute and block status on load
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !chatId || !otherUser) return;

      try {
        const muted = await chatOptionsService.isChatMuted(chatId, user.uid);
        setIsMuted(muted);

        const blocked = await chatOptionsService.isUserBlocked(user.uid, otherUser.id);
        setIsBlocked(blocked);
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
  }, [user, chatId, otherUser]);

  // Handle chat options
  const handleViewProfile = () => {
    setShowOptionsMenu(false);
    if (otherUser) {
      // Navigate to user profile with user ID
      router.push(`/(modals)/user-profile/${otherUser.id}` as any);
    }
  };

  const handleMuteChat = () => {
    setShowOptionsMenu(false);
    setShowMuteOptions(true);
  };

  const handleMuteDuration = async (duration: 'hour' | 'day' | 'week' | 'forever') => {
    setShowMuteOptions(false);
    if (!user) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'المستخدم غير مسجل الدخول' : 'User not logged in');
      return;
    }

    try {
      console.log('[ChatScreen] Muting chat with params:', { chatId, userId: user.uid, duration });
      await chatOptionsService.muteChat(chatId, user.uid, duration);
      setIsMuted(true);
      
      const durationText = {
        hour: isRTL ? 'لمدة ساعة' : 'for 1 hour',
        day: isRTL ? 'لمدة يوم' : 'for 1 day',
        week: isRTL ? 'لمدة أسبوع' : 'for 1 week',
        forever: isRTL ? 'للأبد' : 'forever',
      }[duration];

      CustomAlertService.showSuccess(
        isRTL ? 'تم الكتم' : 'Muted',
        `${isRTL ? 'تم كتم الإشعارات' : 'Notifications muted'} ${durationText}`
      );
    } catch (error: any) {
      console.error('[ChatScreen] Mute error:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        `${isRTL ? 'فشل كتم الإشعارات' : 'Failed to mute notifications'}: ${error.message || 'Unknown error'}`
      );
    }
  };

  const handleUnmute = async () => {
    if (!user) return;

    try {
      await chatOptionsService.unmuteChat(chatId, user.uid);
      setIsMuted(false);
      CustomAlertService.showSuccess(
        isRTL ? 'تم إلغاء الكتم' : 'Unmuted',
        isRTL ? 'تم إلغاء كتم الإشعارات' : 'Notifications unmuted'
      );
    } catch (error) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إلغاء كتم الإشعارات' : 'Failed to unmute notifications'
      );
    }
  };

  const handleBlockUser = () => {
    setShowOptionsMenu(false);
    if (!otherUser) return;

    CustomAlertService.showConfirmation(
      isRTL ? 'حظر المستخدم' : 'Block User',
      isRTL ? 'هل تريد حظر هذا المستخدم؟ لن تتمكن من تلقي رسائل منه.' : 'Do you want to block this user? You will not receive messages from them.',
      async () => {
        if (!user) return;
        try {
          console.log('[ChatScreen] Blocking user:', { blockerId: user.uid, blockedUserId: otherUser.id });
          await chatOptionsService.blockUser(user.uid, otherUser.id);
          setIsBlocked(true);
          CustomAlertService.showSuccess(
            isRTL ? 'تم الحظر' : 'Blocked',
            isRTL ? 'تم حظر المستخدم بنجاح' : 'User blocked successfully'
          );
        } catch (error: any) {
          console.error('[ChatScreen] Block error:', error);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            `${isRTL ? 'فشل حظر المستخدم' : 'Failed to block user'}: ${error.message || 'Unknown error'}`
          );
        }
      },
      undefined,
      isRTL
    );
  };

  const handleUnblockUser = async () => {
    if (!user || !otherUser) return;

    try {
      await chatOptionsService.unblockUser(user.uid, otherUser.id);
      setIsBlocked(false);
      CustomAlertService.showSuccess(
        isRTL ? 'تم إلغاء الحظر' : 'Unblocked',
        isRTL ? 'تم إلغاء حظر المستخدم' : 'User unblocked'
      );
    } catch (error) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إلغاء حظر المستخدم' : 'Failed to unblock user'
      );
    }
  };

  const handleReportUser = () => {
    setShowOptionsMenu(false);
    if (!otherUser) return;

    CustomAlertService.showConfirmation(
      isRTL ? 'الإبلاغ عن المستخدم' : 'Report User',
      isRTL ? 'هل تريد الإبلاغ عن هذا المستخدم للمسؤولين؟' : 'Do you want to report this user to administrators?',
      () => {
        router.push({
          pathname: '/(modals)/dispute-filing-form',
          params: { reportedUserId: otherUser.id, chatId }
        });
      },
      undefined,
      isRTL
    );
  };

  const handleDeleteChat = () => {
    setShowOptionsMenu(false);

    CustomAlertService.showConfirmation(
      isRTL ? 'حذف المحادثة' : 'Delete Chat',
      isRTL ? 'هل تريد حذف هذه المحادثة؟ سيتم حذفها من قائمتك فقط.' : 'Do you want to delete this chat? It will only be removed from your list.',
      async () => {
        if (!user) return;
        try {
          console.log('[ChatScreen] Deleting chat:', { chatId, userId: user.uid });
          await chatOptionsService.deleteChat(chatId, user.uid);
          CustomAlertService.showSuccess(
            isRTL ? 'تم الحذف' : 'Deleted',
            isRTL ? 'تم حذف المحادثة' : 'Chat deleted'
          );
          router.back();
        } catch (error: any) {
          console.error('[ChatScreen] Delete error:', error);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            `${isRTL ? 'فشل حذف المحادثة' : 'Failed to delete chat'}: ${error.message || 'Unknown error'}`
          );
        }
      },
      undefined,
      isRTL
    );
  };

  const handleSearchMessages = () => {
    setShowOptionsMenu(false);
    setShowSearchModal(true);
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await messageSearchService.searchInChat(chatId, searchQuery.trim());
      setSearchResults(results);
      
      // Save to search history
      if (user) {
        await messageSearchService.saveSearchHistory(user.uid, searchQuery.trim());
      }
    } catch (error) {
      console.error('Search error:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل البحث في الرسائل' : 'Failed to search messages'
      );
    } finally {
      setIsSearching(false);
    }
  };
  
  // Format date for separator
  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    
    // Check if same day
    if (messageDate.toDateString() === today.toDateString()) {
      return isRTL ? 'اليوم' : 'Today';
    }
    
    // Check if yesterday
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return isRTL ? 'أمس' : 'Yesterday';
    }
    
    // Format as date
    return messageDate.toLocaleDateString(isRTL ? 'ar' : 'en', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if we need a date separator
  const shouldShowDateSeparator = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true;
    
    const currentDate = currentMessage.createdAt?.toDate?.() || new Date(currentMessage.createdAt);
    const previousDate = previousMessage.createdAt?.toDate?.() || new Date(previousMessage.createdAt);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // Render message item
  // Get presence status text
  const getPresenceStatus = () => {
    if (!otherUser?.id || !presenceMap[otherUser.id]) {
      return isRTL ? 'غير متصل' : 'Offline';
    }
    
    const presence = presenceMap[otherUser.id];
    if (presence.state === 'online') {
      return isRTL ? 'متصل' : 'Online';
    }
    
    // Calculate time ago
    const now = Date.now();
    const lastSeen = presence.lastSeen;
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) {
      return isRTL ? 'شوهد للتو' : 'Last seen just now';
    } else if (diffMins < 60) {
      return isRTL ? `شوهد قبل ${diffMins} دقيقة` : `Last seen ${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return isRTL ? `شوهد قبل ${diffHours} ساعة` : `Last seen ${diffHours}h ago`;
    }
  };

  // Check if message is seen by all participants
  const isMessageSeenByAll = (message: any) => {
    if (!message.readBy || !chatInfo?.participants) return false;
    
    const messageCreatedAt = message.createdAt?.toDate?.() || new Date(message.createdAt);
    const readBy = message.readBy || {};
    
    // Check if all participants (except sender) have read the message
    return chatInfo.participants
      .filter((participantId: string) => participantId !== message.senderId)
      .every((participantId: string) => {
        const readTime = readBy[participantId];
        return readTime && readTime.toDate() > messageCreatedAt;
      });
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwnMessage = item.senderId === user?.uid;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);
    
    return (
      <View key={item.id}>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={[styles.dateSeparatorLine, { backgroundColor: theme.border }]} />
            <View style={[styles.dateSeparatorBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.dateSeparatorText, { color: theme.textSecondary }]}>
                {formatDateSeparator(item.createdAt?.toDate?.() || new Date(item.createdAt))}
              </Text>
            </View>
            <View style={[styles.dateSeparatorLine, { backgroundColor: theme.border }]} />
          </View>
        )}
        <ChatMessage
          message={item}
          isOwnMessage={isOwnMessage}
          isAdmin={isAdmin}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
          onViewHistory={handleViewHistory}
          onDownload={handleDownloadFile}
        />
        {/* Show "Seen" indicator for latest sent message */}
        {isOwnMessage && index === messages.length - 1 && (
          <View style={styles.seenIndicator}>
            <Text style={[styles.seenText, { color: theme.textSecondary }]}>
              {isMessageSeenByAll(item) ? (isRTL ? 'تمت المشاهدة' : 'Seen') : (isRTL ? 'تم الإرسال' : 'Sent')}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render typing indicator with TTL check
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    // Additional TTL check in UI (redundant but safe)
    const freshTypingUsers = typingUsers.filter(uid => {
      // This is handled by the service, but we can add extra validation here if needed
      return true;
    });
    
    if (freshTypingUsers.length === 0) return null;
    
    return <MessageLoading />;
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            paddingTop: insets.top + 8,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>

        <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* User Avatar */}
          {otherUser?.avatar ? (
                      <Image
              source={{ uri: otherUser.avatar }}
              style={[styles.avatar, { marginLeft: isRTL ? 12 : 0, marginRight: isRTL ? 0 : 12 }]}
                      />
                    ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary, marginLeft: isRTL ? 12 : 0, marginRight: isRTL ? 0 : 12 }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}

          {/* User Info */}
          <View style={[styles.userInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.userName, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {otherUser?.name || t('chat')}
            </Text>
            {typingUsers.length > 0 ? (
              <Text style={[styles.typingStatus, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'يكتب...' : 'typing...'}
              </Text>
            ) : (
              <Text style={[styles.userStatus, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {getPresenceStatus()}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowOptionsMenu(true)}
        >
          <MoreVertical size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable 
          style={styles.optionsOverlay} 
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={[styles.optionsMenu, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={handleViewProfile}
            >
              <User size={20} color={theme.textPrimary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'عرض الملف الشخصي' : 'View Profile'}
            </Text>
            </TouchableOpacity>
            
              <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={handleSearchMessages}
            >
              <Search size={20} color={theme.textPrimary} />
              <Text style={[styles.optionText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'البحث في الرسائل' : 'Search Messages'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={isMuted ? handleUnmute : handleMuteChat}
            >
              <BellOff size={20} color={isMuted ? theme.primary : theme.textPrimary} />
              <Text style={[styles.optionText, { color: isMuted ? theme.primary : theme.textPrimary, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isMuted 
                  ? (isRTL ? 'إلغاء كتم الإشعارات' : 'Unmute Notifications')
                  : (isRTL ? 'كتم الإشعارات' : 'Mute Notifications')
                }
              </Text>
              {isMuted && (
                <View style={[styles.statusBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.statusBadgeText}>{isRTL ? 'مكتوم' : 'Muted'}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={isBlocked ? handleUnblockUser : handleBlockUser}
            >
              <Ban size={20} color={isBlocked ? theme.error : theme.warning} />
              <Text style={[styles.optionText, { color: isBlocked ? theme.error : theme.warning, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isBlocked
                  ? (isRTL ? 'إلغاء حظر المستخدم' : 'Unblock User')
                  : (isRTL ? 'حظر المستخدم' : 'Block User')
                }
              </Text>
              {isBlocked && (
                <View style={[styles.statusBadge, { backgroundColor: theme.error }]}>
                  <Text style={styles.statusBadgeText}>{isRTL ? 'محظور' : 'Blocked'}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={handleReportUser}
            >
              <Flag size={20} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'الإبلاغ عن المستخدم' : 'Report User'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
              style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={handleDeleteChat}
            >
              <Trash2 size={20} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'حذف المحادثة' : 'Delete Chat'}
                </Text>
              </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Mute Options Modal */}
      <Modal
        visible={showMuteOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMuteOptions(false)}
      >
        <Pressable 
          style={styles.optionsOverlay} 
          onPress={() => setShowMuteOptions(false)}
        >
          <View style={[styles.muteOptionsMenu, { backgroundColor: theme.surface }]}>
            <Text style={[styles.muteTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'كتم الإشعارات لمدة' : 'Mute notifications for'}
            </Text>
            
            <TouchableOpacity 
              style={styles.muteOption}
              onPress={() => handleMuteDuration('hour')}
            >
              <Text style={[styles.muteOptionText, { color: theme.textPrimary }]}>
                {isRTL ? 'ساعة واحدة' : '1 hour'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.muteOption}
              onPress={() => handleMuteDuration('day')}
            >
              <Text style={[styles.muteOptionText, { color: theme.textPrimary }]}>
                {isRTL ? 'يوم واحد' : '1 day'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.muteOption}
              onPress={() => handleMuteDuration('week')}
            >
              <Text style={[styles.muteOptionText, { color: theme.textPrimary }]}>
                {isRTL ? 'أسبوع واحد' : '1 week'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.muteOption}
              onPress={() => handleMuteDuration('forever')}
            >
              <Text style={[styles.muteOptionText, { color: theme.error }]}>
                {isRTL ? 'للأبد' : 'Forever'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={[styles.searchModalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.searchHeader, { backgroundColor: theme.surface, paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.searchBackButton}>
              <ArrowLeft size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.background }]}>
              <Search size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder={isRTL ? 'البحث في الرسائل...' : 'Search messages...'}
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={performSearch}
                autoFocus
              />
            </View>
          </View>

          {isSearching ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.searchLoadingText, { color: theme.textSecondary }]}>
                {isRTL ? 'جاري البحث...' : 'Searching...'}
              </Text>
            </View>
          ) : searchResults.length > 0 ? (
            <ScrollView style={styles.searchResults}>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.searchResultItem, { backgroundColor: theme.surface }]}
                  onPress={() => {
                    setShowSearchModal(false);
                    // Scroll to message
                  }}
                >
                  <Text style={[styles.searchResultText, { color: theme.textPrimary }]}>
                    {result.context}
                  </Text>
                  <Text style={[styles.searchResultDate, { color: theme.textSecondary }]}>
                    {result.message.createdAt?.toDate?.().toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : searchQuery.trim() ? (
            <View style={styles.searchEmptyContainer}>
              <Search size={48} color={theme.textSecondary} />
              <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
                {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
              </Text>
            </View>
          ) : (
            <View style={styles.searchEmptyContainer}>
              <Search size={48} color={theme.textSecondary} />
              <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
                {isRTL ? 'ابحث في رسائل هذه المحادثة' : 'Search in this chat'}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Messages and Input Container */}
      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScrollView}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          onScroll={(event) => {
            // Track visible messages for read receipts
            const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
            const scrollY = contentOffset.y;
            const viewHeight = layoutMeasurement.height;
            
            // Simple heuristic: mark messages as read when scrolled past them
            const visibleMessageIds = messages
              .filter((msg, index) => {
                // Estimate message position (rough calculation)
                const estimatedHeight = 60; // Approximate message height
                const messageTop = index * estimatedHeight;
                const messageBottom = messageTop + estimatedHeight;
                
                // Message is visible if it's in the viewport
                return messageTop < scrollY + viewHeight && messageBottom > scrollY;
              })
              .filter(msg => msg.senderId !== user?.uid) // Only mark others' messages as read
              .map(msg => msg.id);
            
            if (visibleMessageIds.length > 0) {
              markVisibleMessagesAsRead(visibleMessageIds);
            }
          }}
          scrollEventThrottle={100}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {messages.map((item, index) => renderMessage({ item, index }))}
          {renderTypingIndicator()}
        </ScrollView>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <View style={[styles.typingIndicator, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Text style={[styles.typingText, { color: theme.textSecondary }]}>
              {isRTL ? 'يكتب...' : 'Typing...'}
            </Text>
          </View>
        )}

        {/* Chat Input - Fixed at bottom */}
        <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
          <ChatInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSendMessage}
            onSendImage={handleSendImage}
            onSendFile={handleSendFile}
            onSendLocation={handleSendLocation}
            onTyping={handleTyping}
            editMode={!!editingMessageId}
            onCancelEdit={handleCancelEdit}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            isUploadingVoice={isUploadingVoice}
            onStartVideoRecording={startVideoRecording}
            isRecordingVideo={isRecordingVideo}
            isUploadingVideo={isUploadingVideo}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Edit History Modal */}
      {selectedMessageHistory && (
        <EditHistoryModal
          visible={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedMessageHistory(null);
          }}
          originalText={selectedMessageHistory.text}
          editHistory={selectedMessageHistory.editHistory || []}
          currentText={selectedMessageHistory.text}
          createdAt={selectedMessageHistory.createdAt}
        />
      )}

      {/* Camera Modal for Video Recording - Expo SDK 54 Compatible */}
      {showCameraModal && (
        <Modal
          visible={showCameraModal}
          animationType="slide"
          onRequestClose={() => setShowCameraModal(false)}
        >
          <View style={styles.cameraContainer}>
            {/* CameraView with NO children - Expo SDK 54 requirement */}
            <CameraView
              style={styles.camera}
              facing="back"
              mode="video"
              ref={cameraRef}
              onCameraReady={() => console.log('🎥 Camera ready')}
            />
            
            {/* Camera controls OVERLAY using absolute positioning */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCameraModal(false)}
              >
                <Text style={styles.cameraCloseText}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.cameraBottomControls}>
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    { backgroundColor: isRecordingVideo ? theme.error : theme.primary }
                  ]}
                  onPress={isRecordingVideo ? stopVideoRecording : recordVideo}
                >
                  <Text style={styles.recordButtonText}>
                    {isRecordingVideo ? '⏹️' : '▶️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
  },
  typingStatus: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  optionsMenu: {
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
  },
  optionDivider: {
    height: 1,
    marginVertical: 8,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  muteOptionsMenu: {
    borderRadius: 12,
    paddingVertical: 16,
    minWidth: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  muteTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  muteOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  muteOptionText: {
    fontSize: 16,
  },
  searchModalContainer: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchBackButton: {
    padding: 4,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  searchLoadingText: {
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    padding: 16,
  },
  searchResultItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchResultText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  searchResultDate: {
    fontSize: 12,
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  searchEmptyText: {
    fontSize: 16,
  },
  innerContainer: {
    flex: 1,
  },
  messagesScrollView: {
    flex: 1,
  },
  typingIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
    pointerEvents: 'box-none', // Allow touches to pass through to camera
  },
  cameraCloseButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto', // Allow touches on this button
  },
  cameraCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraBottomControls: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto', // Allow touches on this button
  },
  recordButtonText: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  seenIndicator: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  seenText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});