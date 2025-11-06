import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
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
import MessageQueueService from '@/services/MessageQueueService';
import { messageSchedulerService } from '@/services/messageSchedulerService';
import { disappearingMessageService } from '@/services/disappearingMessageService';
import { DisappearingMessageSettings, DisappearingMessageDuration } from '@/components/DisappearingMessageSettings';
import { ChatThemeSelector } from '@/components/ChatThemeSelector';
import { chatThemeService } from '@/services/chatThemeService';
import { ChatExportModal } from '@/components/ChatExportModal';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { MessageLoading } from '@/components/MessageLoading';
import { EnhancedTypingIndicator } from '@/components/EnhancedTypingIndicator';
import { AdvancedVoiceRecorder } from '@/components/AdvancedVoiceRecorder';
// COMMENT: PRODUCTION HARDENING - Task 4.7 - Lazy load EditHistoryModal (only shown when editing message)
const EditHistoryModal = lazy(() => import('@/components/EditHistoryModal').then(m => ({ default: m.EditHistoryModal })));
import ErrorBoundary from '@/components/ErrorBoundary'; // COMMENT: PRODUCTION HARDENING - Task 4.5 - Add error boundary for chat screen
import { logger } from '@/utils/logger';
// COMMENT: PRODUCTION HARDENING - Task 4.10 - Import responsive utilities
import { useResponsive, getMaxContentWidth } from '@/utils/responsive';
// COMMENT: PRIORITY 1 - File Modularization - Extract components (underscore prefix prevents Expo Router from treating as routes)
import { ChatHeader } from './_components/ChatHeader';
import { ChatOptionsModal } from './_components/ChatOptionsModal';
import { ChatMuteModal } from './_components/ChatMuteModal';
import { ChatSearchModal } from './_components/ChatSearchModal';
import { ForwardMessageModal } from './_components/ForwardMessageModal';
// COMMENT: PRIORITY 1 - File Modularization - Import extracted hooks (underscore prefix prevents Expo Router from treating as routes)
import { useChatOptions } from './_hooks/useChatOptions';
import { useMediaHandlers } from './_hooks/useMediaHandlers';
import { useChatActions } from './_hooks/useChatActions';
import { 
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  CheckSquare,
  X,
  Copy,
  Trash2,
  Forward,
  Pin,
  Star,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// Camera imports removed - using ImagePicker for better UX
import { Video as ExpoVideo } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();
  const chatId = jobId as string;
  // COMMENT: PRODUCTION HARDENING - Task 4.10 - Get responsive dimensions
  const { isTablet, isLargeDevice, width } = useResponsive();

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
  const [disappearingDuration, setDisappearingDuration] = useState<DisappearingMessageDuration>(chatInfo?.disappearingMessageDuration || 0);
  const [showDisappearingSettings, setShowDisappearingSettings] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [chatTheme, setChatTheme] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Voice recording - Only advanced recorder
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  
  // Video recording - ImagePicker (no camera modal needed)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  // Camera/mic permissions - Not needed with ImagePicker/AdvancedVoiceRecorder, but kept for compatibility
  const cameraPermission = null;
  const requestCameraPermission = async () => ({} as any);
  const micPermission = null;
  const requestMicPermission = async () => ({} as any);
  
  // Recording state - Not used with ImagePicker/AdvancedVoiceRecorder, but kept for compatibility
  const setIsRecording = () => {};
  const setRecordingDuration = () => {};
  const setMediaRecorder = () => {};
  const setAudioChunks = () => {};
  const setIsRecordingVideo = () => {};
  const setShowCameraModal = () => {};
  const setRecordingStartTime = () => {};
  const recordingDuration = 0;
  const mediaRecorder = null;
  const isRecordingVideo = false;
  const recordingStartTime = null;
  
  // Advanced voice recorder state
  const [showAdvancedVoiceRecorder, setShowAdvancedVoiceRecorder] = useState(false);
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastReadMarkTime, setLastReadMarkTime] = useState(0);
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  
  // COMMENT: PRODUCTION HARDENING - Task 3.6 - Pagination state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [allMessages, setAllMessages] = useState<any[]>([]); // All loaded messages (with pagination)
  const INITIAL_MESSAGE_LIMIT = 50; // Initial message limit for pagination
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<any>(null); // Keep for backward compatibility during transition
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const typingDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Camera ref removed - using ImagePicker instead, but kept for compatibility with useMediaHandlers
  const cameraRef = useRef<any>(null);

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Load chat info and other user details with cleanup
  useEffect(() => {
    if (!chatId || !user) return;

    let unsubscribeChat: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;
    let isMounted = true; // Cleanup flag to prevent state updates on unmounted component

    try {
      // Mark chat as read when user opens it
      chatService.markChatAsRead(chatId, user.uid);
      
      // Listen to chat details
      unsubscribeChat = chatService.listenToChat(chatId, (chat) => {
        if (!isMounted) return; // Early return if component unmounted
        
        if (chat) {
          setChatInfo(chat);
          
          // Subscribe to presence for all participants
          const participantIds = chat.participants.filter((id: string) => id !== user.uid);
          if (participantIds.length > 0) {
            // Cleanup previous presence subscription if exists
            if (unsubscribePresence) {
              unsubscribePresence();
            }
            
            unsubscribePresence = PresenceService.subscribeUsersPresence(
              participantIds,
              (presence) => {
                if (!isMounted) return; // Early return if component unmounted
                setPresenceMap(presence);
              }
            );
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
          
          // Update disappearing message duration from chat info
          if (chat.disappearingMessageDuration !== undefined) {
            setDisappearingDuration(chat.disappearingMessageDuration as DisappearingMessageDuration || 0);
          }
          
          // Load chat theme
          if (chat.theme) {
            setChatTheme(chat.theme);
          } else {
            // Load from service if not in chat data
            chatThemeService.getChatTheme(chatId).then((theme) => {
              if (theme) {
                setChatTheme(theme);
              }
            }).catch((error) => {
              logger.error('Error loading chat theme:', error);
            });
          }
        }
      });
    } catch (error) {
      // COMMENT: FINAL STABILIZATION - Task 7 - Use logger instead of console.error
      logger.error('Error loading chat info:', error);
    }

    // Cleanup: Unsubscribe from chat and presence listeners
    return () => {
      isMounted = false; // Prevent state updates
      if (unsubscribeChat) {
        unsubscribeChat();
      }
      if (unsubscribePresence) {
        unsubscribePresence();
      }
    };
  }, [chatId, user]);

  // COMMENT: PRODUCTION HARDENING - Task 3.6 - Load messages with pagination support
  // Load messages
  useEffect(() => {
    if (!chatId || !user) return;

    setLoading(true);
    setHasMoreMessages(true);
    setAllMessages([]); // Reset on chat change
    let previousMessageCount = 0;
    
    // COMMENT: PRODUCTION HARDENING - Task 3.6 - Use initial limit for pagination
    const unsubscribe = chatService.listenToMessages(chatId, async (newMessages) => {
      // Log for debugging
      logger.debug(`📨 Received ${newMessages.length} messages from Firestore listener for chat ${chatId}`);
      
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
      
      // COMMENT: PRODUCTION HARDENING - Task 3.6 - Merge new messages with existing paginated messages
      // Firestore listener sends ALL messages (up to limit), not just new ones
      if (allMessages.length === 0) {
        // Initial load - use messages from listener
        logger.debug(`📥 Initial load: Setting ${newMessages.length} messages`);
        setMessages(newMessages);
        setAllMessages(newMessages);
      } else {
        // Real-time update - merge Firestore messages (latest N) with paginated older messages
        // Firestore messages are the source of truth for the latest messages
        const firestoreMessageIds = new Set(newMessages.map(m => m.id));
        
        // Keep paginated older messages that are not in Firestore latest batch
        // Also remove optimistic messages (tempId) that have been replaced by real messages
        const paginatedOlderMessages = allMessages.filter(m => {
          // Remove optimistic messages (tempId) if real message exists
          if (m.tempId) {
            logger.debug(`🔍 Checking optimistic message for replacement:`, { 
              tempId: m.tempId, 
              messageId: m.id, 
              type: m.type, 
              senderId: m.senderId,
              createdAt: m.createdAt,
              createdAtType: typeof m.createdAt
            });
            
            // Check if real message exists in Firestore
            // Match by: sender, type, and time within 10 seconds (increased window for async operations)
            // For media messages (empty text), also match by type
            // For text messages, match by text content
            const realMessage = newMessages.find(fm => {
              const fmTime = fm.createdAt?.toMillis?.() 
                ? fm.createdAt.toMillis() 
                : typeof fm.createdAt === 'number' 
                ? fm.createdAt 
                : fm.createdAt instanceof Date 
                ? fm.createdAt.getTime()
                : new Date(fm.createdAt).getTime();
              
              const mTime = m.createdAt?.toMillis?.() 
                ? m.createdAt.toMillis() 
                : typeof m.createdAt === 'number' 
                ? m.createdAt 
                : m.createdAt instanceof Date 
                ? m.createdAt.getTime()
                : m.createdAt 
                ? new Date(m.createdAt).getTime() 
                : 0;
              
              const timeDiff = Math.abs(fmTime - mTime);
              const timeMatch = timeDiff < 10000; // Increased to 10 seconds for async operations
              const senderMatch = fm.senderId === m.senderId;
              const typeMatch = fm.type === m.type;
              
              logger.debug(`🔍 Matching check:`, {
                fmId: fm.id,
                fmType: fm.type,
                fmSenderId: fm.senderId,
                fmTime,
                mTempId: m.tempId,
                mType: m.type,
                mSenderId: m.senderId,
                mTime,
                timeDiff,
                timeMatch,
                senderMatch,
                typeMatch
              });
              
              // For text messages, match by text
              if (m.type === 'TEXT' || !m.type) {
                const textMatch = fm.text === m.text;
                const matched = senderMatch && textMatch && timeMatch;
                if (matched) {
                  logger.debug(`✅ Matched optimistic text message:`, { tempId: m.tempId, realId: fm.id });
                }
                return matched;
              }
              
              // For media messages (voice, image, video, file), match by type and time
              // Media messages have empty text, so we can't match by text
              const matched = senderMatch && typeMatch && timeMatch;
              if (matched) {
                logger.debug(`✅ Matched optimistic media message:`, { tempId: m.tempId, realId: fm.id, type: m.type });
              }
              return matched;
            });
            if (realMessage) {
              logger.debug(`🔄 Replacing optimistic message with real message:`, { 
                tempId: m.tempId, 
                oldId: m.id, 
                newId: realMessage.id,
                type: m.type
              });
              return false; // Remove optimistic message, real one will be added
            } else {
              logger.debug(`⚠️ No match found for optimistic message:`, { 
                tempId: m.tempId, 
                type: m.type,
                senderId: m.senderId,
                availableIds: newMessages.map(fm => ({ id: fm.id, type: fm.type, senderId: fm.senderId }))
              });
            }
          }
          // Keep paginated older messages that are not in Firestore batch
          return !firestoreMessageIds.has(m.id);
        });
        
        // Always use Firestore messages as source of truth (they contain latest data)
        // Create a map to deduplicate by ID (Firestore messages take priority)
        logger.debug(`🔀 Merging messages: ${paginatedOlderMessages.length} older + ${newMessages.length} Firestore`);
        logger.debug(`🔀 Firestore message IDs: ${Array.from(firestoreMessageIds).join(', ')}`);
        logger.debug(`🔀 Older message IDs: ${paginatedOlderMessages.map(m => m.id).join(', ')}`);
        
        const messageMap = new Map<string, any>();
        
        // Add paginated older messages first
        paginatedOlderMessages.forEach(m => {
          // Only add if not already in Firestore messages (they'll override)
          if (!firestoreMessageIds.has(m.id)) {
            logger.debug(`🔀 Adding older message to map: ${m.id} (not in Firestore)`);
            messageMap.set(m.id, m);
          } else {
            logger.debug(`🔀 Skipping older message (Firestore has it): ${m.id}`);
          }
        });
        
        // Add/update with Firestore messages (they override existing ones with same ID)
        newMessages.forEach(m => {
          logger.debug(`🔀 Adding Firestore message to map: ${m.id} (type: ${m.type})`);
          messageMap.set(m.id, m); // Firestore messages are always latest
        });
        
        logger.debug(`🔀 Message map size before sort: ${messageMap.size}`);
        logger.debug(`🔀 Message map IDs: ${Array.from(messageMap.keys()).join(', ')}`);
        
        // Convert map to array and sort by timestamp (oldest first)
        const combinedMessages = Array.from(messageMap.values()).sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 
                        (typeof a.createdAt === 'number' ? a.createdAt : 
                         (a.createdAt ? new Date(a.createdAt).getTime() : 0)) || 0;
          const bTime = b.createdAt?.toMillis?.() || 
                        (typeof b.createdAt === 'number' ? b.createdAt : 
                         (b.createdAt ? new Date(b.createdAt).getTime() : 0)) || 0;
          return aTime - bTime; // Oldest first
        });
        
        // COMMENT: PERFORMANCE FIX - Keep messages in chronological order (oldest first, newest last)
        // This allows normal scroll direction: scroll up = see older messages, scroll down = see newer messages
        // Newest messages appear at bottom (natural FlatList behavior)
        
        logger.debug(`📦 Merged messages: ${paginatedOlderMessages.length} older + ${newMessages.length} Firestore = ${combinedMessages.length} total (deduplicated)`);
        logger.debug(`📨 Message IDs in combined (sorted): ${combinedMessages.map(m => `${m.id}(${m.type || 'TEXT'})`).join(', ')}`);
        
        // Check all image messages in the combined list
        const imageMessages = combinedMessages.filter(m => m.type === 'image' || m.type === 'IMAGE');
        const newImageMessages = newMessages.filter(m => m.type === 'image' || m.type === 'IMAGE');
        logger.debug(`🖼️ Image messages check:`, {
          totalInCombined: imageMessages.length,
          totalInFirestore: newImageMessages.length,
          combinedImageIds: imageMessages.map(m => m.id),
          firestoreImageIds: newImageMessages.map(m => m.id),
          imageMessagesDetails: imageMessages.map(m => ({
            id: m.id,
            type: m.type,
            hasAttachments: !!m.attachments?.length,
            attachments: m.attachments,
            createdAt: m.createdAt,
            createdAtType: typeof m.createdAt,
            createdAtValue: m.createdAt?.toMillis?.() || (typeof m.createdAt === 'number' ? m.createdAt : (m.createdAt instanceof Date ? m.createdAt.getTime() : 'unknown'))
          }))
        });
        
        setAllMessages(combinedMessages);
        setMessages(combinedMessages);
      }
      
      setLoading(false);
      
      // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear existing timeout and store new one for scroll
      // Scroll to bottom on new messages (only if not loading more)
      if (!isLoadingMore) {
        // Clear any existing scroll timeout
        if (keyboardScrollTimeoutRef.current) {
          clearTimeout(keyboardScrollTimeoutRef.current);
        }
        keyboardScrollTimeoutRef.current = setTimeout(() => {
          keyboardScrollTimeoutRef.current = null;
          // COMMENT: PERFORMANCE FIX - Scroll to bottom (newest messages) when new messages arrive
          if (messages.length > 0) {
            try {
              const lastIndex = messages.length - 1;
              flatListRef.current?.scrollToIndex({ index: lastIndex, animated: true });
            } catch (error) {
              // Fallback to scrollToEnd if scrollToIndex fails
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }
        }, 100);
      }
    }, INITIAL_MESSAGE_LIMIT); // COMMENT: PRODUCTION HARDENING - Task 3.6 - Pass initial limit

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

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Timeout ref for keyboard scroll cleanup
  const keyboardScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use chat actions hook - moved before keyboard listeners so handleKeyboardHide is available
  const {
    handleSendMessage,
    handleEditMessage,
    handleCancelEdit,
    handleDeleteMessage,
    handleViewHistory,
    handleTyping,
    handleKeyboardHide: handleKeyboardHideFromHook,
    handleRetryMessage,
  } = useChatActions({
    chatId,
    userId: user?.uid || null,
    jobId,
    messages,
    setMessages,
    allMessages,
    setAllMessages,
    otherUser,
    isRTL,
    inputText,
    setInputText,
    editingMessageId,
    setEditingMessageId,
    editingText,
    setEditingText,
  });

  // Keyboard listeners - now after hook so handleKeyboardHideFromHook is available
  useEffect(() => {
    if (!handleKeyboardHideFromHook) return; // Guard against undefined function
    
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear existing timeout and store new one
        if (keyboardScrollTimeoutRef.current) {
          clearTimeout(keyboardScrollTimeoutRef.current);
        }
        // COMMENT: PERFORMANCE FIX - Scroll to bottom (newest messages) when keyboard appears
        keyboardScrollTimeoutRef.current = setTimeout(() => {
          keyboardScrollTimeoutRef.current = null;
          if (messages.length > 0) {
            try {
              const lastIndex = messages.length - 1;
              flatListRef.current?.scrollToIndex({ index: lastIndex, animated: true });
            } catch (error) {
              // Fallback to scrollToEnd if scrollToIndex fails
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        handleKeyboardHideFromHook(); // Stop typing when keyboard hides
        // ChatInput component now handles keyboard visibility and recalculates padding automatically
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear keyboard scroll timeout
      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
        keyboardScrollTimeoutRef.current = null;
      }
    };
  }, [chatId, handleKeyboardHideFromHook]);

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
          logger.debug('📖 Focus: Marking latest message as read');
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
    logger.debug('📖 Scroll: Marking visible messages as read', visibleMessageIds.length);
        // COMMENT: PRODUCTION HARDENING - Task 3.4 - Mark messages as read with updated method signature
        await chatService.markAsRead(chatId, visibleMessageIds, user.uid);
  }, [chatId, user, lastReadMarkTime]);

  // COMMENT: PERFORMANCE FIX - Memoized callback for tracking visible messages in FlatList
  const handleViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    const visibleMessageIds = viewableItems
      .filter((item: any) => item.item.senderId !== user?.uid) // Only mark others' messages as read
      .map((item: any) => item.item.id);
    
    if (visibleMessageIds.length > 0) {
      markVisibleMessagesAsRead(visibleMessageIds);
    }
  }, [user?.uid, markVisibleMessagesAsRead]);

  // COMMENT: PRIORITY 1 - File Modularization - Typing and keyboard handlers now provided by useChatActions hook
  // handleTyping and handleKeyboardHide are now from useChatActions hook
  
  // COMMENT: PRIORITY 1 - File Modularization - Message handlers now provided by useChatActions hook
  // handleSendMessage is now from useChatActions hook
  
  // COMMENT: PRIORITY 1 - File Modularization - All handlers now provided by hooks
  // Duplicate handler definitions removed - using useChatActions, useMediaHandlers hooks
  
  // COMMENT: PRIORITY 1 - File Modularization - All duplicate handlers removed (now from hooks above)
  // Media handlers: startRecording, stopRecording, uploadVoiceMessage, startVideoRecording, 
  // recordVideo, stopVideoRecording, uploadVideoMessage, handleSendImage, handleSendFile, handleSendLocation
  // Message handlers: handleEditMessage, handleCancelEdit, handleDeleteMessage, handleViewHistory
  // All provided by useMediaHandlers and useChatActions hooks above

  // COMMENT: PRODUCTION HARDENING - Task 3.6 - Load more messages (pagination)
  const handleLoadMore = React.useCallback(async () => {
    if (!chatId || !user || isLoadingMore || !hasMoreMessages || messages.length === 0) {
      return;
    }

    setIsLoadingMore(true);

    try {
      // Get the oldest message timestamp
      const oldestMessage = messages[0];
      if (!oldestMessage || !oldestMessage.createdAt) {
        setHasMoreMessages(false);
        setIsLoadingMore(false);
        return;
      }

      // Convert to Firestore Timestamp if needed
      const { Timestamp } = await import('firebase/firestore');
      const lastTimestamp = oldestMessage.createdAt?.toMillis 
        ? oldestMessage.createdAt 
        : typeof oldestMessage.createdAt === 'number'
        ? Timestamp.fromMillis(oldestMessage.createdAt)
        : null;

      if (!lastTimestamp) {
        setHasMoreMessages(false);
        setIsLoadingMore(false);
        return;
      }

      // Load more messages
      const result = await chatService.loadMoreMessages(chatId, lastTimestamp, INITIAL_MESSAGE_LIMIT);

      if (result.messages.length > 0) {
        // Prepend older messages to the list
        const updatedMessages = [...result.messages, ...messages];
        setAllMessages(updatedMessages);
        setMessages(updatedMessages);

        // COMMENT: PERFORMANCE FIX - With FlatList inverted, we maintain scroll position automatically
        // FlatList handles scroll position maintenance when prepending items
        // No manual scroll adjustment needed
      }

      setHasMoreMessages(result.hasMore);
    } catch (error) {
      logger.error('Error loading more messages:', error);
      setHasMoreMessages(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, user, isLoadingMore, hasMoreMessages, messages, allMessages]);

  // Schedule message handler
  const handleScheduleMessage = useCallback(async (scheduledDate: Date, messageText: string) => {
    if (!user?.uid || !chatId || !messageText.trim()) return;

    try {
      await messageSchedulerService.scheduleMessage(
        chatId,
        user.uid,
        messageText,
        scheduledDate
      );

      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم جدولة الرسالة لـ ${scheduledDate.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}`
          : `Message scheduled for ${scheduledDate.toLocaleString('en-US')}`,
        isRTL
      );

      // Clear input
      setInputText('');
    } catch (error) {
      logger.error('Error scheduling message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل جدولة الرسالة' : 'Failed to schedule message',
        isRTL
      );
    }
  }, [chatId, user?.uid, isRTL, setInputText]);

  // COMMENT: PRODUCTION HARDENING - Task 3.6 - Refresh messages with pagination support
  const handleRefresh = React.useCallback(async () => {
    if (!chatId || !user || isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Reload initial messages
      const result = await chatService.getChatMessages(chatId, INITIAL_MESSAGE_LIMIT);
      if (result.messages.length > 0) {
        setAllMessages(result.messages);
        setMessages(result.messages);
        setHasMoreMessages(result.hasMore);
      }
    } catch (error) {
      logger.error('Error refreshing messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديث الرسائل' : 'Failed to refresh messages'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [chatId, user, isRefreshing]);

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
      logger.error('Error downloading file:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل التنزيل' : 'Failed to download'
      );
    }
  };

  // Check if user is admin (simplified - would check Firebase custom claims)
  const isAdmin = user?.email?.includes('admin') || false;

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Check mute and block status on load with cleanup
  useEffect(() => {
    let isMounted = true; // Cleanup flag to prevent state updates on unmounted component
    
    const checkStatus = async () => {
      if (!user || !chatId || !otherUser) return;

      try {
        const muted = await chatOptionsService.isChatMuted(chatId, user.uid);
        if (!isMounted) return; // Early return if component unmounted
        setIsMuted(muted);

        const blocked = await chatOptionsService.isUserBlocked(user.uid, otherUser.id);
        if (!isMounted) return; // Early return if component unmounted
        setIsBlocked(blocked);
      } catch (error) {
        logger.error('Error checking status:', error);
      }
    };

    checkStatus();
    
    // Cleanup: Set flag to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [user, chatId, otherUser]);

  // COMMENT: PRIORITY 1 - File Modularization - Use extracted hooks instead of duplicate handlers
  // Use chat options hook
  const {
    handleViewProfile,
    handleMuteChat,
    handleMuteDuration,
    handleUnmute,
    handleBlockUser,
    handleUnblockUser,
    handleReportUser,
    handleDeleteChat,
  } = useChatOptions({
    chatId,
    userId: user?.uid || null,
    otherUser,
    isRTL,
    isMuted,
    setIsMuted,
    isBlocked,
    setIsBlocked,
    setShowOptionsMenu,
    setShowMuteOptions,
  });

  // Advanced voice recorder handler
  const handleAdvancedVoiceRecordingComplete = useCallback(async (uri: string, duration: number) => {
    try {
      setShowAdvancedVoiceRecorder(false);
      await uploadVoiceMessage(uri, duration);
    } catch (error) {
      logger.error('Error with advanced voice recording:', error);
    }
  }, [uploadVoiceMessage]);

  // Use media handlers hook
  const {
    uploadVoiceMessage,
    startVideoRecording,
    uploadVideoMessage,
    handleSendImage,
    handleSendGif,
    handleSendFile,
    handleSendLocation,
  } = useMediaHandlers({
    chatId,
    userId: user?.uid || null,
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
  });

  // COMMENT: PRIORITY 1 - File Modularization - Duplicate handlers removed (using hooks above)
  // All chat options handlers (handleViewProfile, handleMuteChat, etc.) now provided by useChatOptions hook

  // Pin/Star message handlers
  const handlePinMessage = async (messageId: string) => {
    if (!chatId || !user?.uid || !messageId) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const isPinned = message.isPinned || false;
      await chatService.pinMessage(chatId, messageId, user.uid, !isPinned);
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isPinned 
          ? (isRTL ? 'تم إلغاء تثبيت الرسالة' : 'Message unpinned')
          : (isRTL ? 'تم تثبيت الرسالة' : 'Message pinned'),
        isRTL
      );
    } catch (error) {
      logger.error('Error pinning/unpinning message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تثبيت/إلغاء تثبيت الرسالة' : 'Failed to pin/unpin message',
        isRTL
      );
    }
  };

  const handleStarMessage = async (messageId: string) => {
    if (!chatId || !user?.uid || !messageId) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const isStarred = message.starredBy?.includes(user.uid) || false;
      await chatService.starMessage(chatId, messageId, user.uid, !isStarred);
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isStarred 
          ? (isRTL ? 'تم إلغاء تميز الرسالة' : 'Message unstarred')
          : (isRTL ? 'تم تميز الرسالة' : 'Message starred'),
        isRTL
      );
    } catch (error) {
      logger.error('Error starring/unstarring message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تميز/إلغاء تميز الرسالة' : 'Failed to star/unstar message',
        isRTL
      );
    }
  };

  const handleSearchMessages = () => {
    setShowOptionsMenu(false);
    setShowSearchModal(true);
  };

  const performSearch = async (filters?: {
    messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO';
    senderId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await messageSearchService.searchInChat(chatId, searchQuery.trim(), filters);
      setSearchResults(results);
      
      // Save to search history
      if (user) {
        await messageSearchService.saveSearchHistory(user.uid, searchQuery.trim());
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
  };

  const handleForwardMessage = (message: any) => {
    setMessageToForward(message);
    setShowForwardModal(true);
  };

  const handleForwardToChats = async (message: any, targetChatIds: string[]) => {
    if (!user?.uid || !message) return;

    try {
      // Forward message to each target chat
      for (const targetChatId of targetChatIds) {
        await chatService.sendMessage(
          targetChatId,
          message.text || (message.type !== 'TEXT' ? `Forwarded ${message.type}` : 'Forwarded message'),
          user.uid
        );
        
        logger.debug(`Forwarded message ${message.id} to chat ${targetChatId}`);
      }
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم إعادة توجيه الرسالة إلى ${targetChatIds.length} محادثة`
          : `Message forwarded to ${targetChatIds.length} chat(s)`,
        isRTL
      );
    } catch (error) {
      logger.error('Error forwarding message:', error);
      throw error;
    }
  };

  // Selection mode handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedMessages(new Set());
    }
  };

  const handleSelectAll = () => {
    const allMessageIds = new Set(messages.map(m => m.id));
    setSelectedMessages(allMessageIds);
  };

  const handleDeselectAll = () => {
    setSelectedMessages(new Set());
  };

  // Batch actions
  const handleBatchDelete = async () => {
    if (selectedMessages.size === 0) return;

    CustomAlertService.showConfirmation(
      isRTL ? 'حذف الرسائل' : 'Delete Messages',
      isRTL 
        ? `هل أنت متأكد من حذف ${selectedMessages.size} رسالة؟`
        : `Are you sure you want to delete ${selectedMessages.size} message(s)?`,
      async () => {
        try {
          for (const messageId of selectedMessages) {
            await handleDeleteMessage(messageId);
          }
          setSelectedMessages(new Set());
          setIsSelectionMode(false);
          CustomAlertService.showSuccess(
            isRTL ? 'نجح' : 'Success',
            isRTL ? 'تم حذف الرسائل' : 'Messages deleted',
            isRTL
          );
        } catch (error) {
          logger.error('Error deleting messages:', error);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل حذف الرسائل' : 'Failed to delete messages',
            isRTL
          );
        }
      },
      undefined,
      isRTL
    );
  };

  const handleBatchForward = () => {
    if (selectedMessages.size === 0) return;
    
    // For now, forward only the first message (can be enhanced to forward all)
    const firstMessageId = Array.from(selectedMessages)[0];
    const message = messages.find(m => m.id === firstMessageId);
    
    if (message) {
      setMessageToForward(message);
      setShowForwardModal(true);
      // Note: After forwarding, user can continue selecting more messages or exit selection mode
    }
  };

  const handleBatchCopy = async () => {
    if (selectedMessages.size === 0) return;

    try {
      const selectedMessagesList = messages
        .filter(m => selectedMessages.has(m.id))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || (typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime());
          const bTime = b.createdAt?.toMillis?.() || (typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime());
          return aTime - bTime;
        });

      const textToCopy = selectedMessagesList
        .map(m => `${m.senderId === user?.uid ? (isRTL ? 'أنت' : 'You') : 'Other'}: ${m.text || (m.type !== 'TEXT' ? `[${m.type}]` : '')}`)
        .join('\n\n');

      // Use Clipboard API
      try {
        const Clipboard = await import('@react-native-clipboard/clipboard');
        await Clipboard.default.setString(textToCopy);
      } catch (clipboardError) {
        // Fallback to expo-clipboard if available
        try {
          const Clipboard = await import('expo-clipboard');
          await Clipboard.default.setStringAsync(textToCopy);
        } catch (expoClipboardError) {
          logger.error('No clipboard package available');
          throw new Error('Clipboard not available');
        }
      }
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم نسخ الرسائل' : 'Messages copied',
        isRTL
      );
    } catch (error) {
      logger.error('Error copying messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل نسخ الرسائل' : 'Failed to copy messages',
        isRTL
      );
    }
  };

  const handleBatchPin = async () => {
    if (selectedMessages.size === 0 || !user?.uid) return;

    try {
      for (const messageId of selectedMessages) {
        await chatService.pinMessage(chatId, messageId, user.uid, true);
      }
      
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم تثبيت ${selectedMessages.size} رسالة`
          : `Pinned ${selectedMessages.size} message(s)`,
        isRTL
      );
    } catch (error) {
      logger.error('Error pinning messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تثبيت الرسائل' : 'Failed to pin messages',
        isRTL
      );
    }
  };

  const handleBatchStar = async () => {
    if (selectedMessages.size === 0 || !user?.uid) return;

    try {
      for (const messageId of selectedMessages) {
        await chatService.starMessage(chatId, messageId, user.uid, true);
      }
      
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم تميز ${selectedMessages.size} رسالة`
          : `Starred ${selectedMessages.size} message(s)`,
        isRTL
      );
    } catch (error) {
      logger.error('Error starring messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تميز الرسائل' : 'Failed to star messages',
        isRTL
      );
    }
  };

  // Advanced features from reference system - Reactions
  const handleReaction = async (message: any) => {
    if (!user?.uid || !chatId || !message.id) return;

    try {
      const emoji = message.selectedEmoji || '👍'; // Default emoji
      await chatService.addReaction(chatId, message.id, user.uid, emoji);
      
      logger.debug(`🔥 Reaction added: ${emoji} by ${user.uid}`);
    } catch (error) {
      logger.error('Error adding reaction:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إضافة التفاعل' : 'Failed to add reaction',
        isRTL
      );
    }
  };

  // Reply handler
  const handleReply = (message: any) => {
    if (!message) {
      logger.warn('Cannot reply: message is missing');
      return;
    }
    // Set reply context - this will be shown in the input
    // TODO: Implement reply preview in input area
    logger.debug(`📩 Reply to message: ${message.id}`);
    // For now, just show a success message indicating the feature is being implemented
    CustomAlertService.showSuccess(
      isRTL ? 'نجح' : 'Success',
      isRTL ? 'سيتم إضافة معاينة الرد قريباً' : 'Reply preview will be added soon',
      isRTL
    );
  };

  // Quote handler (different from Reply)
  const handleQuote = (message: any) => {
    if (!message || !message.text) {
      logger.warn('Cannot quote: message or message.text is missing');
      return;
    }
    // Quote shows the original message text differently
    // TODO: Implement quote functionality
    logger.debug(`💬 Quote message: ${message.id}`);
    // For now, just show a success message indicating the feature is being implemented
    CustomAlertService.showSuccess(
      isRTL ? 'نجح' : 'Success',
      isRTL ? 'سيتم إضافة وظيفة الاقتباس قريباً' : 'Quote functionality will be added soon',
      isRTL
    );
  };

  // Copy handler
  const handleCopy = async (message: any) => {
    if (!message || !message.text) {
      logger.warn('Cannot copy: message or message.text is missing', { message });
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'لا يمكن نسخ هذه الرسالة' : 'Cannot copy this message',
        isRTL
      );
      return;
    }

    try {
      const textToCopy = message.text;
      logger.debug('Copying message text:', { length: textToCopy.length });
      
      // Try expo-clipboard first (most common in Expo projects)
      try {
        const Clipboard = require('expo-clipboard');
        await Clipboard.setStringAsync(textToCopy);
        logger.debug('Successfully copied using expo-clipboard');
      } catch (expoError) {
        // Fallback to @react-native-clipboard/clipboard
        try {
          const Clipboard = require('@react-native-clipboard/clipboard');
          Clipboard.setString(textToCopy);
          logger.debug('Successfully copied using @react-native-clipboard/clipboard');
        } catch (clipboardError) {
          logger.error('Both clipboard packages failed:', { expoError, clipboardError });
          throw new Error('Clipboard not available - packages not installed');
        }
      }
      
      // Simple one-word notification - no full alert popup
      // Just log success (user will see clipboard worked when they paste)
      logger.debug('Copied');
    } catch (error: any) {
      logger.error('Error copying message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL 
          ? `فشل نسخ الرسالة: ${error?.message || 'Unknown error'}` 
          : `Failed to copy message: ${error?.message || 'Unknown error'}`,
        isRTL
      );
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

  // COMMENT: PERFORMANCE FIX - FlatList helper functions for optimized rendering
  const keyExtractor = useCallback((item: any) => item.id || item.tempId || `msg-${item.createdAt}`, []);
  
  const getItemLayout = useCallback((data: any, index: number) => {
    // Estimated message height (including date separator if present)
    const estimatedHeight = 80; // Average message height
    return {
      length: estimatedHeight,
      offset: estimatedHeight * index,
      index,
    };
  }, []);

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwnMessage = item.senderId === user?.uid;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);
    const isLastMessage = index === messages.length - 1;
    
    return (
      <View>
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
        {/* ✅ MODERN 2025: Animated message fade-in (reanimated) */}
        <Animated.View entering={FadeInDown.duration(250)}>
          <ChatMessage
            message={{ ...item, chatId }}
            isOwnMessage={isOwnMessage}
          isAdmin={isAdmin}
          currentUserId={user?.uid}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
          onViewHistory={handleViewHistory}
          onDownload={handleDownloadFile}
          onPin={handlePinMessage}
          onStar={handleStarMessage}
          onRetry={handleRetryMessage}
          onViewReadReceipts={(messageId) => {
            router.push({
              pathname: '/(modals)/read-receipts',
              params: { chatId, messageId }
            });
          }}
          onForward={handleForwardMessage}
          isSelectionMode={isSelectionMode}
          isSelected={selectedMessages.has(item.id)}
          onSelect={(messageId, selected) => {
            setSelectedMessages(prev => {
              const next = new Set(prev);
              if (selected) {
                next.add(messageId);
              } else {
                next.delete(messageId);
              }
              return next;
            });
          }}
          // Advanced features from reference system
          onReaction={handleReaction}
          onReply={handleReply}
          onQuote={handleQuote}
          onCopy={handleCopy}
          chatId={chatId}
          />
        </Animated.View>
        {/* Show "Seen" indicator for latest sent message */}
        {isOwnMessage && isLastMessage && (
          <View style={styles.seenIndicator}>
            <Text style={[styles.seenText, { color: theme.textSecondary }]}>
              {isMessageSeenByAll(item) ? (isRTL ? 'تمت المشاهدة' : 'Seen') : (isRTL ? 'تم الإرسال' : 'Sent')}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render enhanced typing indicator with TTL check and multiple users support
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    // Additional TTL check in UI (redundant but safe)
    const freshTypingUsers = typingUsers.filter(uid => {
      // This is handled by the service, but we can add extra validation here if needed
      return true;
    });
    
    if (freshTypingUsers.length === 0) return null;
    
    // Get user names for typing users
    const typingUserNames: Record<string, string> = {};
    freshTypingUsers.forEach(uid => {
      if (uid === otherUser?.id || uid === otherUser?.uid) {
        typingUserNames[uid] = otherUser?.name || t('someone');
      } else if (chatInfo?.participantNames?.[uid]) {
        typingUserNames[uid] = chatInfo.participantNames[uid];
      } else {
        typingUserNames[uid] = t('someone');
      }
    });

    return (
      <EnhancedTypingIndicator
        typingUsers={freshTypingUsers}
        typingUserNames={typingUserNames}
        maxVisibleUsers={3}
        isOwnMessage={false}
      />
    );
  };
  
  // COMMENT: PRODUCTION HARDENING - Task 4.5 - Wrap chat screen in error boundary
  if (loading) {
    return (
      <ErrorBoundary
        fallback={null}
        onError={(error, errorInfo) => {
          logger.error('Chat screen loading error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          });
        }}
        resetOnPropsChange={true}
        resetKeys={[chatId]}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </View>
      </ErrorBoundary>
    );
  }
  
  return (
    <ErrorBoundary
      fallback={null}
      onError={(error, errorInfo) => {
        logger.error('Chat screen error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
      resetOnPropsChange={true}
      resetKeys={[chatId]}
    >
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Gradient - Matching Home Screen Theme */}
      <LinearGradient
        colors={[theme.background, theme.surfaceSecondary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Chat Background Theme - DISABLED: Restored to original theme colors */}
      {/* {chatTheme && (() => {
        if (chatTheme.type === 'color') {
          return (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: chatTheme.value as string, opacity: 0.3 },
              ]}
            />
          );
        } else if (chatTheme.type === 'gradient' && Array.isArray(chatTheme.value)) {
          return (
            <LinearGradient
              colors={chatTheme.value as string[]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          );
        } else if (chatTheme.type === 'image' && typeof chatTheme.value === 'object' && 'uri' in chatTheme.value) {
          return (
            <ImageBackground
              source={{ uri: chatTheme.value.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              imageStyle={{ opacity: 0.2 }}
            />
          );
        }
        return null;
      })()} */}
      
      {/* COMMENT: PRODUCTION HARDENING - Task 4.10 - Responsive container with max width on tablet */}
      <View style={[
        styles.contentWrapper,
        {
          maxWidth: isTablet ? getMaxContentWidth() : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }
      ]}>
      {/* COMMENT: PRIORITY 1 - File Modularization - Use extracted ChatHeader component */}
      <ChatHeader
        otherUser={otherUser}
        typingUsers={typingUsers}
        presenceStatus={getPresenceStatus()}
        onOptionsPress={() => setShowOptionsMenu(true)}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedMessages.size}
        onToggleSelection={toggleSelectionMode}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* COMMENT: PRIORITY 1 - File Modularization - Use extracted modal components */}
      <ChatOptionsModal
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        isMuted={isMuted}
        isBlocked={isBlocked}
        chatId={chatId}
        onViewProfile={handleViewProfile}
        onSearchMessages={handleSearchMessages}
        onViewMediaGallery={() => {
          setShowOptionsMenu(false);
          router.push({
            pathname: '/(modals)/chat-media-gallery',
            params: { chatId }
          });
        }}
        onViewPinnedMessages={() => {
          setShowOptionsMenu(false);
          router.push({
            pathname: '/(modals)/pinned-messages',
            params: { chatId }
          });
        }}
        onViewStarredMessages={() => {
          setShowOptionsMenu(false);
          router.push('/(modals)/starred-messages');
        }}
        onViewChatInfo={() => {
          setShowOptionsMenu(false);
          const displayName = chatInfo?.name || otherUser?.name || t('chat');
          const groupName = chatInfo?.groupName || null;
          router.push({
            pathname: '/(modals)/chat-info',
            params: {
              chatId,
              chatName: displayName,
              groupName: groupName || '',
            },
          });
        }}
        onMute={handleMuteChat}
        onUnmute={handleUnmute}
        onBlock={handleBlockUser}
        onUnblock={handleUnblockUser}
        onReport={handleReportUser}
        onDeleteChat={handleDeleteChat}
        onDisappearingMessages={() => {
          setShowOptionsMenu(false);
          setShowDisappearingSettings(true);
        }}
        onChatTheme={() => {
          setShowOptionsMenu(false);
          setShowThemeSelector(true);
        }}
        onExportChat={() => {
          setShowOptionsMenu(false);
          setShowExportModal(true);
        }}
      />

      <ChatMuteModal
        visible={showMuteOptions}
        onClose={() => setShowMuteOptions(false)}
        onMuteDuration={handleMuteDuration}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        visible={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setMessageToForward(null);
        }}
        message={messageToForward}
        onForward={handleForwardToChats}
      />

      {/* COMMENT: PRIORITY 1 - File Modularization - Use extracted ChatSearchModal component */}
      <ChatSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={performSearch}
        isSearching={isSearching}
        searchResults={searchResults}
        participants={
          chatInfo?.participants
            ? chatInfo.participants
                .filter((id: string) => id !== user?.uid)
                .map((id: string) => ({
                  id,
                  name: chatInfo.participantNames?.[id] || otherUser?.name || 'Unknown',
                }))
            : otherUser
            ? [{ id: otherUser.id, name: otherUser.name }]
            : []
        }
        onResultPress={async (result, index) => {
          // Close search modal first
          setShowSearchModal(false);
          
          // Get message ID from search result
          const messageId = result.message?.id || result.messageId;
          if (!messageId) {
            logger.warn('Search result missing message ID');
            return;
          }
          
          // Find message in current messages array
          const messageIndex = messages.findIndex(msg => msg.id === messageId);
          
          if (messageIndex === -1) {
            // Message not in current view, need to load more or search differently
            logger.debug(`Message ${messageId} not found in current view, may need to load older messages`);
            
            // Try to find in allMessages
            const allMessagesIndex = allMessages.findIndex(msg => msg.id === messageId);
            if (allMessagesIndex !== -1) {
              // Message exists but not visible, we need to ensure it's loaded
              // For now, show a message to user
              CustomAlertService.showInfo(
                isRTL ? 'معلومات' : 'Info',
                isRTL ? 'الرسالة موجودة لكن ليست في العرض الحالي. قم بالتمرير للعثور عليها.' : 'Message exists but not in current view. Please scroll to find it.',
                isRTL
              );
            } else {
              CustomAlertService.showError(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'لم يتم العثور على الرسالة' : 'Message not found',
                isRTL
              );
            }
            return;
          }
          
          // COMMENT: PERFORMANCE FIX - Scroll to message using FlatList scrollToIndex
          // With normal FlatList, messages[0] is oldest (top), messages[length-1] is newest (bottom)
          // Wait a bit for UI to settle after modal closes
          setTimeout(() => {
            try {
              flatListRef.current?.scrollToIndex({ 
                index: messageIndex, 
                animated: true,
                viewPosition: 0.5, // Center the message in view
              });
              logger.debug(`Scrolled to message at index ${messageIndex}`);
            } catch (error) {
              // Fallback: scroll to offset if scrollToIndex fails
              const estimatedHeightPerMessage = 70;
              const scrollOffset = messageIndex * estimatedHeightPerMessage;
              flatListRef.current?.scrollToOffset({ 
                offset: scrollOffset, 
                animated: true 
              });
              logger.debug(`Scrolled to message at offset ${scrollOffset} (fallback)`);
            }
          }, 300);
        }}
      />

      {/* Messages and Input Container */}
      <KeyboardAvoidingView
        style={styles.innerContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={true}
      >
        {/* COMMENT: PERFORMANCE FIX - Converted from ScrollView to FlatList for virtualization */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          getItemLayout={getItemLayout}
          inverted={false}
          style={styles.messagesScrollView}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingHorizontal: isTablet ? 24 : 8,
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // COMMENT: PERFORMANCE FIX - FlatList optimizations for better performance
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          // COMMENT: PRODUCTION HARDENING - Task 3.6 - Pagination: Load more when scrolling to top (oldest messages)
          onScroll={(event) => {
            const { contentOffset } = event.nativeEvent;
            // Load more when scrolled near the top (within 100px)
            if (contentOffset.y < 100 && hasMoreMessages && !isLoadingMore && messages.length > 0) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={100}
          // Track visible messages for read receipts
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          // Scroll to bottom (newest messages) when new messages arrive
          onContentSizeChange={() => {
            if (!isLoadingMore && messages.length > 0) {
              // Scroll to newest message (last index in normal list)
              setTimeout(() => {
                try {
                  const lastIndex = messages.length - 1;
                  flatListRef.current?.scrollToIndex({ index: lastIndex, animated: true });
                } catch (error) {
                  // Fallback to scrollToEnd if scrollToIndex fails
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }, 100);
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          // COMMENT: PRODUCTION HARDENING - Task 3.6 - Loading indicator for pagination (at top for older messages)
          ListHeaderComponent={
            isLoadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadMoreText, { color: theme.textSecondary }]}>
                  {isRTL ? 'جاري تحميل المزيد...' : 'Loading more messages...'}
                </Text>
              </View>
            ) : null
          }
          // Typing indicator at bottom (newest messages area)
          ListFooterComponent={renderTypingIndicator()}
        />

        {/* Chat Input - Fixed at bottom */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: 'transparent', // Removed grey background
            paddingHorizontal: isTablet ? 24 : 16,
            // Don't add paddingBottom here - ChatInput handles its own padding
            // Safe area insets are handled by KeyboardAvoidingView
          }
        ]}>
          {!isSelectionMode && (
            <ChatInput
              value={inputText}
              onChangeText={setInputText}
              onSend={handleSendMessage}
              onSendImage={async (uri: string) => {
                logger.debug('🟢 [ChatScreen] onSendImage wrapper called', { uri, chatId, userId: user?.uid });
                try {
                  if (!uri || typeof uri !== 'string') {
                    logger.error('❌ [ChatScreen] Invalid image URI in onSendImage:', uri);
                    CustomAlertService.showError(
                      isRTL ? 'خطأ' : 'Error',
                      isRTL ? 'رابط الصورة غير صحيح' : 'Invalid image URI'
                    );
                    return;
                  }
                  logger.debug('🟢 [ChatScreen] Valid URI, checking handleSendImage function', { 
                    uri, 
                    isFunction: typeof handleSendImage === 'function',
                    chatId,
                    userId: user?.uid
                  });
                  
                  if (typeof handleSendImage !== 'function') {
                    logger.error('❌ [ChatScreen] handleSendImage is not a function:', typeof handleSendImage);
                    throw new Error('handleSendImage is not a function');
                  }
                  
                  logger.debug('📸 [ChatScreen] Calling handleSendImage with URI:', uri);
                  await handleSendImage(uri);
                  logger.debug('✅ [ChatScreen] handleSendImage completed successfully');
                } catch (error) {
                  logger.error('❌ [ChatScreen] Error in onSendImage wrapper:', error);
                  CustomAlertService.showError(
                    isRTL ? 'خطأ' : 'Error',
                    isRTL ? 'فشل إرسال الصورة. الرجاء المحاولة مرة أخرى' : 'Failed to send image. Please try again.'
                  );
                }
                logger.debug('🟢 [ChatScreen] onSendImage wrapper completed');
              }}
              onSendGif={handleSendGif}
              onSendFile={handleSendFile}
              onSendLocation={handleSendLocation}
              useGiphyAPI={false} // TODO: Add Giphy API key configuration
              giphyApiKey={undefined} // TODO: Get from config
              quickReplies={undefined} // TODO: Load from user preferences or chat context
              showQuickReplies={!inputText.trim()} // Show when input is empty
              onScheduleMessage={handleScheduleMessage}
              onTyping={handleTyping}
              editMode={!!editingMessageId}
              onCancelEdit={handleCancelEdit}
              // Voice recording - Only advanced recorder
              isUploadingVoice={isUploadingVoice}
              onOpenAdvancedVoiceRecorder={() => setShowAdvancedVoiceRecorder(true)}
              // Video recording - ImagePicker
              onStartVideoRecording={startVideoRecording}
              isUploadingVideo={isUploadingVideo}
            />
          )}

          {/* Batch Action Toolbar */}
          {isSelectionMode && (
            <View style={[styles.batchToolbar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => setIsSelectionMode(false)}
                style={styles.batchToolbarButton}
              >
                <X size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              
              <Text style={[styles.batchToolbarText, { color: theme.textPrimary }]}>
                {selectedMessages.size > 0 
                  ? (isRTL ? `${selectedMessages.size} محدد` : `${selectedMessages.size} selected`)
                  : (isRTL ? 'اختر الرسائل' : 'Select messages')
                }
              </Text>

              <View style={styles.batchToolbarActions}>
                <TouchableOpacity
                  onPress={handleBatchCopy}
                  style={[styles.batchActionButton, selectedMessages.size === 0 && styles.batchActionButtonDisabled]}
                  disabled={selectedMessages.size === 0}
                >
                  <Copy size={18} color={selectedMessages.size > 0 ? theme.textPrimary : theme.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleBatchForward}
                  style={[styles.batchActionButton, selectedMessages.size === 0 && styles.batchActionButtonDisabled]}
                  disabled={selectedMessages.size === 0}
                >
                  <Forward size={18} color={selectedMessages.size > 0 ? theme.textPrimary : theme.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleBatchPin}
                  style={[styles.batchActionButton, selectedMessages.size === 0 && styles.batchActionButtonDisabled]}
                  disabled={selectedMessages.size === 0}
                >
                  <Pin size={18} color={selectedMessages.size > 0 ? theme.textPrimary : theme.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleBatchStar}
                  style={[styles.batchActionButton, selectedMessages.size === 0 && styles.batchActionButtonDisabled]}
                  disabled={selectedMessages.size === 0}
                >
                  <Star size={18} color={selectedMessages.size > 0 ? '#FFD700' : theme.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleBatchDelete}
                  style={[styles.batchActionButton, selectedMessages.size === 0 && styles.batchActionButtonDisabled]}
                  disabled={selectedMessages.size === 0}
                >
                  <Trash2 size={18} color={selectedMessages.size > 0 ? theme.error : theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      </View>
      {/* COMMENT: PRODUCTION HARDENING - Task 4.10 - End responsive wrapper */}

      {/* Edit History Modal */}
      {/* COMMENT: PRODUCTION HARDENING - Task 4.7 - Lazy load EditHistoryModal with Suspense */}
      {selectedMessageHistory && (
        <Suspense
          fallback={
            <Modal visible={showHistoryModal} transparent animationType="fade">
              <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading history...
                </Text>
              </View>
            </Modal>
          }
        >
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
        </Suspense>
      )}

      {/* Advanced Voice Recorder Modal */}
      <Modal
        visible={showAdvancedVoiceRecorder}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdvancedVoiceRecorder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <AdvancedVoiceRecorder
              onRecordingComplete={handleAdvancedVoiceRecordingComplete}
              onCancel={() => setShowAdvancedVoiceRecorder(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Camera Modal for Video Recording - Expo SDK 54 Compatible */}
      {/* Camera Modal removed - using ImagePicker for video selection instead */}

      {/* Disappearing Message Settings Modal */}
      <DisappearingMessageSettings
        visible={showDisappearingSettings}
        onClose={() => setShowDisappearingSettings(false)}
        currentDuration={disappearingDuration === 0 ? 'off' : disappearingDuration as DisappearingMessageDuration}
        onDurationChange={async (duration) => {
          if (!chatId) return;
          try {
            const durationValue = duration === 'off' ? 0 : duration;
            await disappearingMessageService.setDisappearingDuration(chatId, durationValue);
            setDisappearingDuration(durationValue);
            setShowDisappearingSettings(false);
            
            CustomAlertService.showSuccess(
              isRTL ? 'نجح' : 'Success',
              isRTL 
                ? `تم تعيين مدة الرسائل المتلاشية إلى ${duration === 'off' ? 'إيقاف' : duration === 30 ? '30 ثانية' : duration === 60 ? 'دقيقة واحدة' : duration === 300 ? '5 دقائق' : duration === 3600 ? 'ساعة واحدة' : duration === 86400 ? '24 ساعة' : duration === 604800 ? '7 أيام' : `${duration} ثانية`}`
                : `Disappearing messages set to ${duration === 'off' ? 'Off' : duration === 30 ? '30 seconds' : duration === 60 ? '1 minute' : duration === 300 ? '5 minutes' : duration === 3600 ? '1 hour' : duration === 86400 ? '24 hours' : duration === 604800 ? '7 days' : `${duration} seconds`}`,
              isRTL
            );
          } catch (error) {
            logger.error('Error setting disappearing message duration:', error);
            CustomAlertService.showError(
              isRTL ? 'خطأ' : 'Error',
              isRTL ? 'فشل تعيين مدة الرسائل المتلاشية' : 'Failed to set disappearing message duration',
              isRTL
            );
          }
        }}
      />
      
      {/* Chat Theme Selector Modal */}
      <ChatThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        chatId={chatId}
        currentTheme={chatTheme}
        onThemeChange={async (newTheme) => {
          setChatTheme(newTheme);
          setShowThemeSelector(false);
        }}
      />

      {/* Chat Export Modal */}
      <ChatExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        chatId={chatId}
        chatName={chatInfo?.name || otherUser?.name || 'Chat'}
        messages={messages}
        onExportComplete={(format) => {
          CustomAlertService.showSuccess(
            isRTL ? 'نجح' : 'Success',
            isRTL 
              ? `تم تصدير المحادثة بنجاح بتنسيق ${format === 'text' ? 'نص' : 'PDF'}`
              : `Chat exported successfully as ${format.toUpperCase()}`,
            isRTL
          );
        }}
      />
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // COMMENT: PRODUCTION HARDENING - Task 4.10 - Responsive content wrapper for tablet
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  // COMMENT: PRIORITY 1 - File Modularization - Header styles moved to ChatHeader component
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
  // COMMENT: PRIORITY 1 - File Modularization - Header-related styles (backButton, headerCenter, avatar, etc.) moved to ChatHeader component
  // COMMENT: PRIORITY 1 - File Modularization - Search modal styles moved to ChatSearchModal component
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
    paddingVertical: 12, // ✅ Modern spacing: 8-12px padding around chat
    paddingHorizontal: 10, // ✅ Modern spacing: 8-12px padding around chat
    flexGrow: 1,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 0, // No padding here - ChatInput handles it with safe area insets
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
  // COMMENT: PRODUCTION HARDENING - Task 3.6 - Pagination loading styles
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
  },
  batchToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  batchToolbarButton: {
    padding: 8,
  },
  batchToolbarText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  batchToolbarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  batchActionButton: {
    padding: 8,
  },
  batchActionButtonDisabled: {
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
});