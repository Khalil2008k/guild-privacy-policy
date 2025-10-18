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
} from 'react-native';
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
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load chat info and other user details
  useEffect(() => {
    if (!chatId || !user) return;

    const loadChatInfo = () => {
      try {
        // Listen to chat details
        const unsubscribe = chatService.listenToChat(chatId, (chat) => {
          if (chat) {
            setChatInfo(chat);
            
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
    const unsubscribe = chatService.listenToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
      // Scroll to bottom on new messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
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
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Listen for typing indicators (simplified - would need real-time implementation)
  useEffect(() => {
    // In a real implementation, you'd listen to a Firestore collection for typing indicators
    // For now, this is a placeholder
  }, [chatId]);
  
  // Handle typing
  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // In a real implementation, you'd update Firestore with typing status
    // For now, this is a placeholder
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
      // Update Firestore to stop typing
      }, 2000);
  };
  
  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const messageText = inputText.trim();
    setInputText('');

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

  // Send image
  const handleSendImage = async (uri: string) => {
    if (!user) return;

    try {
      // Extract filename from URI
      const filename = uri.split('/').pop() || 'image.jpg';
      const messageId = await chatFileService.sendFileMessage(chatId, uri, filename, 'image/jpeg', user.uid);
      
      // Log image message for dispute resolution
      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          user.uid,
          [otherUser.uid],
          `[Image: ${filename}]`,
          [{
            url: uri,
            type: 'image/jpeg',
            size: 0,
            filename,
          }],
          { jobId, messageType: 'image' }
        );
      }
    } catch (error) {
      console.error('Error sending image:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الصورة' : 'Failed to send image'
      );
    }
  };

  // Send file
  const handleSendFile = async (uri: string, name: string, type: string) => {
    if (!user) return;

    try {
      const messageId = await chatFileService.sendFileMessage(chatId, uri, name, type, user.uid);
      
      // Log file message for dispute resolution
      if (messageId && otherUser) {
        await disputeLoggingService.logMessage(
          messageId,
          chatId,
          user.uid,
          [otherUser.uid],
          `[File: ${name}]`,
          [{
            url: uri,
            type,
            size: 0,
            filename: name,
          }],
          { jobId, messageType: 'file' }
        );
      }
    } catch (error) {
      console.error('Error sending file:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الملف' : 'Failed to send file'
      );
    }
  };

  // Send location
  const handleSendLocation = async (location: { latitude: number; longitude: number; address?: string }) => {
    if (!user) return;

    try {
      // Create a location message
      const locationMessage = {
        type: 'location',
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || 'Shared Location',
        timestamp: new Date().toISOString(),
        senderId: user.uid,
        senderName: user.displayName || 'User',
      };

      // Send location message through chat service
      await chatService.sendMessage(chatId, `📍 ${location.address || 'Shared Location'}`, user.uid);
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

  // Download file
  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const docDir = (FileSystem as any).documentDirectory as string | null;
      if (!docDir) {
        throw new Error('Document directory not available');
      }
      const fileUri = docDir + filename;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri);
    } else {
          CustomAlertService.showSuccess(
            isRTL ? 'تم التنزيل' : 'Downloaded',
            isRTL ? `تم حفظ الملف في ${fileUri}` : `File saved to ${fileUri}`
          );
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تنزيل الملف' : 'Failed to download file'
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
  
  // Render message item
  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === user?.uid;
    
    return (
      <ChatMessage
        message={item}
        isOwnMessage={isOwnMessage}
        isAdmin={isAdmin}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onViewHistory={handleViewHistory}
        onDownload={handleDownloadFile}
      />
    );
  };
  
  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
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
                {isRTL ? 'نشط' : 'Active'}
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {messages.map((item) => (
            <View key={item.id}>
              {renderMessage({ item })}
            </View>
          ))}
          {renderTypingIndicator()}
        </ScrollView>

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
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
});