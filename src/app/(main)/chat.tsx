/**
 * 🎨 PREMIUM CHAT SCREEN - 2025 EDITION
 * 
 * Features:
 * - Glassmorphism UI
 * - Smooth micro-animations
 * - Advanced shadows & depth
 * - Premium typography
 * - Swipe gestures
 * - Haptic feedback
 * - Real-time indicators
 * - Modern color system
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Animated,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';
// ✅ TASK 14: iPad responsive layout components
import { ResponsiveFlatList } from '../../components/ResponsiveFlatList';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { useResponsive } from '../../utils/responsive';
import * as Haptics from 'expo-haptics';
import { CustomAlertService } from '../../services/CustomAlertService';
import AdminChatService from '../../services/AdminChatService';
import PresenceService from '../../services/PresenceService';
import MessageAnalyticsService from '../../services/MessageAnalyticsService';
import { chatService } from '../../services/chatService';
import { formatChatTime, formatDuration } from '../../utils/timeFormatter';
import {
  Search,
  MessageCircle,
  Users,
  User,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Trash2,
  Pin,
  Archive,
  BellOff,
  Bell,
  Check,
  CheckCheck,
  Clock,
  Mic,
  Image as ImageIcon,
  FileText,
  MapPin,
  X,
  Camera,
  Edit3,
  Settings,
  Zap,
  Star,
  Volume2,
  VolumeX,
  ShieldCheck,
  Lock,
  AlertCircle,
  Smile,
  Frown,
  Meh,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// 🎨 Premium Color System
const PREMIUM_COLORS = {
  glass: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(0, 0, 0, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  online: '#00D856',
  typing: '#00A8FF',
  sent: '#8E8E93',
  delivered: '#00D856',
  read: '#00A8FF',
};

// 🎯 Date Separator Component
function DateSeparator({ date, theme, isRTL, t }: any) {
  const getDateLabel = (dateStr: string) => {
    const today = new Date();
    const chatDate = new Date(dateStr);
    
    // Normalize to start of day for comparison
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const chatDateStart = new Date(chatDate);
    chatDateStart.setHours(0, 0, 0, 0);
    
    const isToday = chatDateStart.getTime() === todayStart.getTime();
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = chatDateStart.getTime() === yesterday.getTime();
    
    if (isToday) return t('today');
    if (isYesterday) return t('yesterday');
    
    return chatDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: chatDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <View style={styles.dateSeparator}>
      <View style={styles.dateSeparatorLine} />
      <Text style={styles.dateSeparatorText}>
        {getDateLabel(date)}
      </Text>
      <View style={styles.dateSeparatorLine} />
    </View>
  );
}

// 🎨 Adaptive Color Helper for Chat Screen
const getAdaptiveChatColors = (theme: any, isDark: boolean) => ({
  // Text colors - black in light mode, theme colors in dark mode
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  chatNameText: isDark ? theme.textPrimary : '#000000',
  chatTimeText: isDark ? '#FFFFFF' : '#000000', // Time text
  lastMessageText: isDark ? '#FFFFFF' : '#000000', // Last message text
  unreadBadgeText: '#FFFFFF', // Always white on colored badge
  messageCountText: isDark ? '#FFFFFF' : '#000000', // Message count text
  
  // Icon colors - black in light mode, white in dark mode
  messageTypeIcon: isDark ? '#FFFFFF' : '#000000',
  statusIcon: isDark ? '#FFFFFF' : '#000000',
  
  // Chat item background
  chatItemBackground: isDark ? 'rgba(229, 229, 234, 0.01)' : 'rgba(229, 229, 234, 0.3)',
});

// 🎯 Premium Chat Item Component
function PremiumChatItem({
  chat,
  onPress,
  onLongPress,
  theme,
  isRTL,
  t,
}: any) {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const adaptiveColors = getAdaptiveChatColors(theme, isDarkMode);
  const isSupportChat = chat.id?.startsWith('support_') || chat.type === 'support';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Real-time presence state
  const [presenceStatus, setPresenceStatus] = useState(chat.online ? 'online' : 'offline');
  const [isTypingNow, setIsTypingNow] = useState(false);

  // Subscribe to real-time presence
  useEffect(() => {
    if (!chat.participants || chat.participants.length === 0 || !user) return;

    // Get the other user's ID (for direct chats)
    const otherUserId = chat.participants.find((p: string) => p !== user.uid);
    if (!otherUserId) return;

    const unsubscribePresence = PresenceService.subscribeToPresence(otherUserId, (presenceData) => {
      setPresenceStatus(presenceData.status);
    });

    return () => unsubscribePresence();
  }, [chat.id, chat.participants, user?.uid]);

  // Subscribe to typing indicator from chat document (with TTL check)
  useEffect(() => {
    if (!chat.id || !chat.participants || chat.participants.length === 0 || !user) return;

    // Get the other user's ID (for direct chats)
    const otherUserId = chat.participants.find((p: string) => p !== user.uid);
    if (!otherUserId) return;

    // Subscribe to chat's typing field with TTL check
    const unsubscribeTyping = PresenceService.subscribeTyping(chat.id, (typingUids) => {
      // Check if the other user is in the typing list
      const otherUserIsTyping = typingUids.includes(otherUserId);
      setIsTypingNow(otherUserIsTyping);
      
      // Clear typing state if it becomes false (safety check)
      if (!otherUserIsTyping) {
        setIsTypingNow(false);
      }
    });

    return () => unsubscribeTyping();
  }, [chat.id, chat.participants, user?.uid]);

  useEffect(() => {
    // Subtle glow animation for unread messages
    if (chat.unread > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop glow animation when unread count becomes 0
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [chat.unread, glowAnim]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 400,
      friction: 25,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 25,
    }).start();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  // Get presence color based on status
  const getPresenceColor = () => {
    switch (presenceStatus) {
      case 'online': return '#34C759';
      case 'away': return '#FF9500';
      case 'busy': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  // Analyze message sentiment
  const sentiment = chat.lastMessage?.text 
    ? MessageAnalyticsService.analyzeSentiment(chat.lastMessage.text)
    : 'neutral';

  // Check if message is urgent
  const isUrgent = chat.lastMessage?.text 
    ? MessageAnalyticsService.isUrgent(chat.lastMessage.text)
    : false;

  // Format time smartly
  const formattedTime = chat.lastMessage?.timestamp
    ? formatChatTime(
        typeof chat.lastMessage.timestamp.toDate === 'function'
          ? chat.lastMessage.timestamp.toDate()
          : new Date(chat.lastMessage.timestamp),
        isRTL ? 'ar' : 'en'
      )
    : chat.time || '';

  // Get sentiment icon
  const getSentimentIcon = () => {
    if (sentiment === 'positive') return <Smile size={12} color="#34C759" style={{ marginLeft: 4 }} />;
    if (sentiment === 'negative') return <Frown size={12} color="#FF3B30" style={{ marginLeft: 4 }} />;
    return null;
  };

  return (
    <Animated.View
      style={[
        styles.premiumChatItem,
        {
          transform: [{ scale: scaleAnim }],
          borderColor: theme.primary + '40', // Theme color border with 40% opacity
        },
      ]}
    >
      {/* Glow effect for unread */}
      {chat.unread > 0 && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              backgroundColor: theme.primary,
              opacity: glowOpacity,
            },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress();
        }}
        activeOpacity={1}
        style={styles.chatItemTouchable}
      >
        <View style={styles.chatItemContent}>
          {/* Avatar with status ring */}
          <View style={styles.avatarContainer}>
            {/* Black border around avatar */}
            <View style={styles.avatarBorder}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                {chat.avatar ? (
                  <Image 
                    source={{ uri: chat.avatar }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {chat.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Online indicator with border - Real-time status */}
            {presenceStatus !== 'offline' && (
              <View style={styles.onlineIndicatorWrapper}>
                <View style={[styles.onlineIndicator, { backgroundColor: getPresenceColor() }]} />
              </View>
            )}
            
          </View>

          {/* Chat info */}
          <View style={styles.chatInfo}>
            {/* Top row */}
            <View style={styles.topRow}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.chatName,
                    {
                      color: adaptiveColors.chatNameText,
                      fontWeight: chat.unread > 0 ? '700' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {chat.name}
                </Text>
                {/* Badges */}
                {chat.isPinned && (
                  <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                    <Pin size={12} color={theme.primary} />
                  </View>
                )}
                {chat.isMuted && (
                  <View style={[styles.badge, { backgroundColor: theme.textSecondary + '20' }]}>
                    <VolumeX size={12} color={theme.textSecondary} />
                  </View>
                )}
                {AdminChatService.isAdminChat(chat) && (
                  <View style={[styles.badge, { backgroundColor: '#FFD700' + '20' }]}>
                    <Star size={12} color="#FFD700" />
                  </View>
                )}
                {/* Verified badge */}
                {chat.isVerified && (
                  <View style={[styles.badge, { backgroundColor: '#007AFF' + '20' }]}>
                    <ShieldCheck size={12} color="#007AFF" />
                  </View>
                )}
                {/* Encryption indicator */}
                {chat.isEncrypted && (
                  <View style={[styles.badge, { backgroundColor: theme.textSecondary + '20' }]}>
                    <Lock size={10} color={theme.textSecondary} />
                  </View>
                )}
              </View>

              {/* Time - Smart formatting */}
              <View style={styles.timeContainer}>
                <Text
                  style={[
                    styles.chatTime,
                    {
                      color: chat.unread > 0 ? theme.primary : adaptiveColors.chatTimeText,
                      fontWeight: chat.unread > 0 ? '600' : '400',
                    },
                  ]}
                >
                  {formattedTime}
                </Text>
              </View>
            </View>

            {/* Bottom row */}
            <View style={styles.bottomRow}>
              <View style={styles.messagePreview}>
                {/* Message status icon */}
                {chat.isOwnLastMessage && (
                  <View style={styles.statusIcon}>
                    {chat.messageStatus === 'sent' && (
                      <Check size={15} color={PREMIUM_COLORS.sent} />
                    )}
                    {chat.messageStatus === 'delivered' && (
                      <CheckCheck size={15} color={PREMIUM_COLORS.delivered} />
                    )}
                    {chat.messageStatus === 'read' && (
                      <CheckCheck size={15} color={PREMIUM_COLORS.read} />
                    )}
                    {chat.messageStatus === 'pending' && (
                      <Clock size={15} color={PREMIUM_COLORS.sent} />
                    )}
                  </View>
                )}

                {/* Message type icon */}
                {chat.lastMessageType === 'voice' && (
                  <Mic size={13} color={adaptiveColors.messageTypeIcon} style={{ marginRight: 4 }} />
                )}
                {chat.lastMessageType === 'image' && (
                  <ImageIcon size={13} color={adaptiveColors.messageTypeIcon} style={{ marginRight: 4 }} />
                )}
                {chat.lastMessageType === 'file' && (
                  <FileText size={13} color={adaptiveColors.messageTypeIcon} style={{ marginRight: 4 }} />
                )}
                {chat.lastMessageType === 'location' && (
                  <MapPin size={13} color={adaptiveColors.messageTypeIcon} style={{ marginRight: 4 }} />
                )}

                {/* Message text */}
                <Text
                  style={[
                    styles.lastMessage,
                    {
                      color: adaptiveColors.lastMessageText,
                      fontWeight: chat.unread > 0 ? '500' : '400',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {isTypingNow
                    ? t('typing')
                    : chat.draft
                    ? `${t('draftPrefix')}${chat.lastMessage}`
                    : (typeof chat.lastMessage === 'string' 
                        ? chat.lastMessage 
                        : chat.lastMessage?.text || t('noMessages'))}
                </Text>
                
                {/* Sentiment indicator */}
                {getSentimentIcon()}
                
                {/* Urgency indicator */}
                {isUrgent && (
                  <AlertCircle size={12} color="#FF3B30" style={{ marginLeft: 4 }} />
                )}
              </View>

              {/* Unread badge or message count */}
              <View style={styles.rightColumn}>
                {chat.unread > 0 ? (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.unreadText, { color: adaptiveColors.unreadBadgeText }]}>
                      {chat.unread > 99 ? '99+' : chat.unread}
                    </Text>
                  </View>
                ) : chat.totalMessages ? (
                  <View style={[styles.messageCountBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.messageCountText, { color: adaptiveColors.messageCountText }]}>
                      {chat.totalMessages > 999 ? '999+' : chat.totalMessages}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 🎨 Premium Header Component
function PremiumHeader({ theme, isRTL, onSearch, onMenu, t }: any) {
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.premiumHeader,
        {
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.primary, theme.primary + 'DD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Top row */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {t('chats')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onSearch}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.headerButtonInner}>
                <Search size={20} color="#000000" />
              </View>
            </TouchableOpacity>

            {/* REMOVED: Archive icon - functionality moved to 3 dots menu */}
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onMenu}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.headerButtonInner}>
                <MoreVertical size={20} color="#000000" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// 🎯 Main Component
export default function PremiumChatScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { currentGuild } = useGuild();
  const { chats, isConnected } = useChat();
  const { user } = useAuth();
  // ✅ TASK 14: Get responsive dimensions for iPad layout
  const { isTablet, isLargeDevice, deviceType } = useResponsive();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showChatListMenu, setShowChatListMenu] = useState(false); // General chat list menu
  const [showNewChatOptions, setShowNewChatOptions] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      // Chats are automatically loaded by ChatContext
      // Just simulate a small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadChats();
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error refreshing chats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // COMMENT: PRODUCTION HARDENING - Task 5.2 - Memoized chat item renderer with useCallback
  const memoizedRenderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    // Show date separator if it's a new day
    // Compare dates by day only (year-month-day), ignoring time
    const getDateKey = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      // Normalize to start of day for date-only comparison
      date.setHours(0, 0, 0, 0);
      // Return date string in YYYY-MM-DD format for comparison
      return date.toISOString().split('T')[0];
    };
    
    const currentDateKey = getDateKey(item.date);
    const previousDateKey = index > 0 ? getDateKey(filteredChats[index - 1]?.date) : '';
    // Show separator if it's the first item or if the date changed (different day)
    const showDateSeparator = index === 0 || (previousDateKey !== currentDateKey);
    
    return (
      <>
        {showDateSeparator && item.date && (
          <DateSeparator date={item.date} theme={theme} isRTL={isRTL} t={t} />
        )}
        <PremiumChatItem
          chat={item}
          onPress={() => handleChatPress(item)}
          onLongPress={() => handleChatLongPress(item)}
          theme={theme}
          isRTL={isRTL}
          t={t}
        />
      </>
    );
  }, [filteredChats, theme, isRTL, t]);

  // COMMENT: PRODUCTION HARDENING - Task 5.2 - getItemLayout for fixed height items (estimated ~100px per chat item including separator)
  const getItemLayout = useCallback((_: any, index: number) => {
    const ITEM_HEIGHT = 85; // Estimated height per chat item (reduced by 15px)
    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  const handleChatPress = async (chat: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Immediately clear unread count when chat is opened
    if (chat.unread > 0 && user?.uid) {
      try {
        await chatService.markChatAsRead(chat.id, user.uid);
        logger.debug('✅ Cleared unread count for chat:', chat.id);
      } catch (error) {
        logger.error('Error clearing unread count:', error);
      }
    }
    
    // Navigate to chat
    if (chat.id?.startsWith('support_') || chat.type === 'support') {
      router.push(`/(modals)/support-chat` as any);
    } else if (chat.type === 'guild') {
      router.push(`/(modals)/guild-chat/${chat.id}` as any);
    } else if (chat.type === 'job') {
      router.push(`/(modals)/chat/${chat.jobId}` as any);
    } else {
      // For direct chats, use the job chat route for now
      router.push(`/(modals)/chat/${chat.id}` as any);
    }
  };

  const handleChatLongPress = (chat: any) => {
    setSelectedChat(chat);
    setShowQuickActions(true);
  };

  const handlePinChat = async () => {
    if (!selectedChat || !user?.uid) return;
    
    try {
      const isPinned = selectedChat.pinnedUsers?.includes(user.uid);
      
      if (isPinned) {
        await chatService.unpinChat(selectedChat.id, user.uid);
        CustomAlertService.showSuccess(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم إلغاء تثبيت المحادثة' : 'Chat unpinned'
        );
      } else {
        await chatService.pinChat(selectedChat.id, user.uid);
        CustomAlertService.showSuccess(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم تثبيت المحادثة' : 'Chat pinned'
        );
      }
      
      setShowQuickActions(false);
      await loadChats();
    } catch (error) {
      logger.error('Error pinning/unpinning chat:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تثبيت/إلغاء تثبيت المحادثة' : 'Failed to pin/unpin chat'
      );
    }
  };

  const handleMuteChat = async () => {
    if (!selectedChat) return;
    
    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        isMuted: !selectedChat.isMuted,
        updatedAt: serverTimestamp(),
      });
      
      CustomAlertService.showSuccess(
        t('success'),
        selectedChat.isMuted
          ? t('chatUnmuted')
          : t('chatMuted')
      );
      
      setShowQuickActions(false);
      await loadChats();
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error muting chat:', error);
      CustomAlertService.showError(
        t('error'),
        t('failedToMuteChat')
      );
    }
  };

  const handleArchiveChat = async () => {
    if (!selectedChat || !user?.uid) return;
    
    try {
      const isArchived = selectedChat.archivedUsers?.includes(user.uid);
      
      if (isArchived) {
        await chatService.unarchiveChat(selectedChat.id, user.uid);
        CustomAlertService.showSuccess(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم إلغاء أرشفة المحادثة' : 'Chat unarchived'
        );
      } else {
        await chatService.archiveChat(selectedChat.id, user.uid);
        CustomAlertService.showSuccess(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم أرشفة المحادثة' : 'Chat archived'
        );
      }
      
      setShowQuickActions(false);
      await loadChats();
    } catch (error) {
      logger.error('Error archiving/unarchiving chat:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل أرشفة/إلغاء أرشفة المحادثة' : 'Failed to archive/unarchive chat'
      );
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    
    // Show confirmation alert
    CustomAlertService.showInfo(
      t('confirmDelete'),
      t('areYouSureDeleteChat')
    );
    
    // For now, just proceed with deletion
    // TODO: Add proper confirmation dialog
    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      
      CustomAlertService.showSuccess(
        t('success'),
        t('chatDeleted')
      );
      
      setShowQuickActions(false);
      await loadChats();
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error deleting chat:', error);
      CustomAlertService.showError(
        t('error'),
        t('failedToDeleteChat')
      );
    }
  };

  const handlePokeUser = () => {
    if (!selectedChat) return;
    
    CustomAlertService.showInfo(
      t('poke'),
      t('pokedUser', { name: selectedChat.name })
    );
    
    setShowQuickActions(false);
  };

  // General chat list menu handlers
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      let markedCount = 0;
      for (const chat of chats) {
        const unreadCount = typeof chat.unreadCount === 'object' 
          ? chat.unreadCount[user.uid] || 0
          : chat.unreadCount || 0;
        
        if (unreadCount > 0) {
          await chatService.markChatAsRead(chat.id, user.uid);
          markedCount++;
        }
      }
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم تحديد ${markedCount} محادثة كمقروءة`
          : `Marked ${markedCount} chat${markedCount !== 1 ? 's' : ''} as read`,
        isRTL
      );
      
      setShowChatListMenu(false);
      await loadChats();
    } catch (error) {
      logger.error('Error marking all chats as read:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديد جميع المحادثات كمقروءة' : 'Failed to mark all chats as read',
        isRTL
      );
    }
  };

  const handleClearAllUnread = async () => {
    if (!user?.uid) return;
    
    try {
      let clearedCount = 0;
      for (const chat of chats) {
        const unreadCount = typeof chat.unreadCount === 'object' 
          ? chat.unreadCount[user.uid] || 0
          : chat.unreadCount || 0;
        
        if (unreadCount > 0) {
          const chatRef = doc(db, 'chats', chat.id);
          await updateDoc(chatRef, {
            [`unreadCount.${user.uid}`]: 0,
            updatedAt: serverTimestamp(),
          });
          clearedCount++;
        }
      }
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم مسح ${clearedCount} محادثة من العداد`
          : `Cleared unread count for ${clearedCount} chat${clearedCount !== 1 ? 's' : ''}`,
        isRTL
      );
      
      setShowChatListMenu(false);
      await loadChats();
    } catch (error) {
      logger.error('Error clearing all unread counts:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل مسح عداد المحادثات' : 'Failed to clear unread counts',
        isRTL
      );
    }
  };

  const handleViewArchived = () => {
    setShowArchived(!showArchived);
    setShowChatListMenu(false);
  };

  const handleNewChat = () => {
    setShowNewChatOptions(true);
    setShowChatListMenu(false);
  };

  const handleChatSettings = () => {
    setShowChatListMenu(false);
    router.push('/(modals)/settings');
  };

  // Transform chats data
  const transformedChats = chats.map((chat: any) => {
    const isJobChat = chat.type === 'job';
    const isGuildChat = chat.type === 'guild';
    
    // For direct chats, try to get participant name from participantNames object
    let participantName = 'Unknown';
    if (isJobChat) {
      participantName = chat.jobTitle || 'Job Chat';
    } else if (isGuildChat) {
      participantName = chat.guildName || 'Guild Chat';
    } else {
      // For direct chats, get the other participant's ID
      const otherParticipant = chat.participants?.find((p: string) => p !== user?.uid);
      if (otherParticipant && chat.participantNames?.[otherParticipant]) {
        participantName = chat.participantNames[otherParticipant];
      } else if (chat.participantName) {
        participantName = chat.participantName;
      } else if (chat.name) {
        participantName = chat.name;
      }
    }

    // Handle lastMessage - it can be a string or an object
    const lastMessageText = typeof chat.lastMessage === 'string' 
      ? chat.lastMessage 
      : chat.lastMessage?.text || '';
    
    const lastMessageSenderId = typeof chat.lastMessage === 'object' 
      ? chat.lastMessage?.senderId 
      : chat.lastMessageSenderId;

    // Get date for separator - with proper error handling
    // We use date only (year-month-day) to group chats by day, ignoring time
    let messageDate: Date;
    try {
      if (chat.lastMessage?.timestamp) {
        // Handle Firestore Timestamp
        if (typeof chat.lastMessage.timestamp.toDate === 'function') {
          messageDate = chat.lastMessage.timestamp.toDate();
        } else {
          messageDate = new Date(chat.lastMessage.timestamp);
        }
        // Validate date
        if (isNaN(messageDate.getTime())) {
          messageDate = new Date();
        }
      } else {
        messageDate = new Date();
      }
      // Normalize to start of day for date-only comparison
      messageDate.setHours(0, 0, 0, 0);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.warn with logger
      logger.warn('Error parsing message date:', error);
      messageDate = new Date();
      messageDate.setHours(0, 0, 0, 0);
    }

    // Get unread count for current user
    const unreadCount = typeof chat.unreadCount === 'object' 
      ? (chat.unreadCount[user?.uid || ''] || 0)
      : (chat.unreadCount || 0);

    // Check if chat is archived/pinned by current user
    const isArchived = chat.archivedUsers?.includes(user?.uid || '') || false;
    const isPinned = chat.pinnedUsers?.includes(user?.uid || '') || false;

    return {
      ...chat,
      name: participantName,
      lastMessage: lastMessageText,
      time: chat.time || 'Now',
      date: messageDate.toISOString(),
      unread: unreadCount,
      totalMessages: chat.messageCount || 0,
      isPinned,
      isArchived,
      isMuted: chat.isMuted || false,
      online: chat.online || false,
      typing: chat.typing || false,
      messageStatus: chat.messageStatus || 'sent',
      lastMessageType: chat.lastMessageType || 'text',
      draft: chat.draft || '',
      isOwnLastMessage: lastMessageSenderId === user?.uid,
    };
  });

  // Filter chats based on archive status
  const archiveFilteredChats = showArchived
    ? transformedChats.filter((chat: any) => chat.isArchived)
    : transformedChats.filter((chat: any) => !chat.isArchived);

  // Separate support chat from regular chats to prevent duplicates
  const supportChat = archiveFilteredChats.find((chat: any) => 
    chat.id?.startsWith('support_') || chat.type === 'support'
  );
  
  // Remove support chat from regular chats list
  const chatsWithoutSupport = archiveFilteredChats.filter((chat: any) => 
    !(chat.id?.startsWith('support_') || chat.type === 'support')
  );

  // Separate pinned and regular chats
  const regularPinnedChats = chatsWithoutSupport.filter((chat: any) => chat.isPinned);
  const regularChats = chatsWithoutSupport.filter((chat: any) => !chat.isPinned);
  
  // Build final list: support chat first (if exists), then pinned, then regular
  const pinnedChats = supportChat 
    ? [supportChat, ...regularPinnedChats]
    : regularPinnedChats;

  // Combine: pinned first, then regular (both sorted by updatedAt desc)
  const sortedChats = [
    ...pinnedChats.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    }),
    ...regularChats.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    }),
  ];

  // Filter chats based on search
  const filteredChats = searchQuery
    ? sortedChats.filter((chat: any) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedChats;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Premium Header */}
      <PremiumHeader
        theme={theme}
        isRTL={isRTL}
        t={t}
        onSearch={() => {
          setShowSearch(!showSearch);
        }}
        onMenu={() => {
          // Open general chat list menu (not per-chat menu)
          setSelectedChat(null); // Clear selected chat for general menu
          setShowChatListMenu(true);
        }}
      />
      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? theme.textPrimary : '#000000' }]}
            placeholder={isRTL ? 'البحث...' : 'Search...'}
            placeholderTextColor={isDarkMode ? theme.textSecondary : '#999999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity onPress={() => setShowSearch(false)}>
            <X size={20} color={isDarkMode ? theme.textSecondary : '#000000'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Pinned Chats Section */}
      {pinnedChats.length > 0 && (
        <View style={styles.pinnedSection}>
          <View style={[styles.sectionHeader, { backgroundColor: theme.surface }]}>
            <Pin size={16} color={isDarkMode ? theme.primary : '#000000'} />
            <Text style={[styles.sectionTitle, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
              {t('pinnedChats')}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinnedChatsScroll}
          >
            {pinnedChats.map((chat: any) => (
              <TouchableOpacity
                key={chat.id}
                onPress={() => handleChatPress(chat)}
                style={styles.pinnedChatItem}
              >
                <View style={[styles.pinnedAvatar, { backgroundColor: theme.primary + '20' }]}>
                  {chat.avatar ? (
                    <Image 
                      source={{ uri: chat.avatar }} 
                      style={styles.pinnedAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={[styles.pinnedAvatarText, { color: theme.primary }]}>
                      {chat.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  )}
                  {chat.unread > 0 && (
                    <View style={[styles.pinnedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.pinnedBadgeText}>
                        {chat.unread > 9 ? '9+' : chat.unread}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.pinnedName, { color: isDarkMode ? theme.textPrimary : '#000000' }]}
                  numberOfLines={1}
                >
                  {chat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Grey separator line underneath pinned chat items */}
          <View style={styles.pinnedSeparatorLine} />
        </View>
      )}

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={isDarkMode ? theme.textSecondary : '#666666'} />
          <Text style={[styles.emptyText, { color: isDarkMode ? theme.textSecondary : '#666666' }]}>
            {searchQuery
              ? t('noResultsFound')
              : t('noChatsYet')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          // COMMENT: PRODUCTION HARDENING - Task 5.2 - Memoized renderItem for performance
          renderItem={memoizedRenderItem}
          // COMMENT: PRODUCTION HARDENING - Task 5.2 - getItemLayout for fixed height items (estimated ~100px per chat item)
          getItemLayout={getItemLayout}
          // COMMENT: PRODUCTION HARDENING - Task 5.2 - Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          contentContainerStyle={styles.chatList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}


      {/* Quick Actions Modal */}
      <Modal
        visible={showQuickActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickActions(false)}
        >
          <View style={[styles.quickActionsMenu, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={handlePinChat}
            >
              <Pin size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {selectedChat?.isPinned
                  ? t('unpin')
                  : t('pin')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleMuteChat}
            >
              {selectedChat?.isMuted ? (
                <Bell size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              ) : (
                <BellOff size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              )}
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {selectedChat?.isMuted
                  ? t('unmute')
                  : t('mute')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handlePokeUser}
            >
              <Zap size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {t('poke')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleArchiveChat}
            >
              <Archive size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {t('archive')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleDeleteChat}
            >
              <Trash2 size={20} color={theme.error} />
              <Text style={[styles.quickActionText, { color: theme.error }]}>
                {t('delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* General Chat List Menu Modal */}
      <Modal
        visible={showChatListMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChatListMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChatListMenu(false)}
        >
          <View style={[styles.quickActionsMenu, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleNewChat}
            >
              <Plus size={20} color={isDarkMode ? theme.primary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {isRTL ? 'محادثة جديدة' : 'New Chat'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleMarkAllAsRead}
            >
              <CheckCheck size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {isRTL ? 'تحديد الكل كمقروء' : 'Mark All as Read'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleClearAllUnread}
            >
              <Check size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {isRTL ? 'مسح العداد' : 'Clear All Unread'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleViewArchived}
            >
              <Archive size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {showArchived 
                  ? (isRTL ? 'إخفاء الأرشيف' : 'Hide Archived')
                  : (isRTL ? 'عرض الأرشيف' : 'View Archived')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleChatSettings}
            >
              <Settings size={20} color={isDarkMode ? theme.textPrimary : '#000000'} />
              <Text style={[styles.quickActionText, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>
                {isRTL ? 'إعدادات المحادثة' : 'Chat Settings'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Chat Options Modal */}
      <Modal
        visible={showNewChatOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChatOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.newChatModal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHandle} />
            
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('startNewChat')}
            </Text>

            <TouchableOpacity
              style={[styles.newChatOption, { backgroundColor: theme.background }]}
              onPress={() => {
                setShowNewChatOptions(false);
                // TODO: Navigate to user search
              }}
            >
              <View style={[styles.newChatIcon, { backgroundColor: theme.primary + '20' }]}>
                <User size={24} color={theme.primary} />
              </View>
              <View style={styles.newChatInfo}>
                <Text style={[styles.newChatTitle, { color: theme.textPrimary }]}>
                  {t('chatWithUser')}
                </Text>
                <Text style={[styles.newChatDescription, { color: theme.textSecondary }]}>
                  {t('startDirectConversation')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newChatOption, { backgroundColor: theme.background }]}
              onPress={() => {
                setShowNewChatOptions(false);
                router.push('/(modals)/guilds');
              }}
            >
              <View style={[styles.newChatIcon, { backgroundColor: theme.primary + '20' }]}>
                <Users size={24} color={theme.primary} />
              </View>
              <View style={styles.newChatInfo}>
                <Text style={[styles.newChatTitle, { color: theme.textPrimary }]}>
                  {t('joinGuild')}
                </Text>
                <Text style={[styles.newChatDescription, { color: theme.textSecondary }]}>
                  {t('joinGroupConversation')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.error + '20' }]}
              onPress={() => setShowNewChatOptions(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.error }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Premium Header
  premiumHeader: {
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  headerButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },

  // Pinned Section
  pinnedSection: {
    marginTop: -10,
    marginBottom: -12,
    paddingHorizontal: 31,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinnedChatsScroll: {
    paddingHorizontal: 0,
    paddingBottom: 2,
    paddingTop: 2,
    gap: 16,
  },
  pinnedChatItem: {
    alignItems: 'center',
    gap: 7,
  },
  pinnedAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pinnedAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27.5,
  },
  pinnedAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pinnedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pinnedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pinnedName: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    maxWidth: 58,
  },
  pinnedSeparatorLine: {
    height: 0.4,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },

  // Premium Chat Item
  premiumChatItem: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(229, 229, 234, 0.01)',
    borderWidth: 0.4,
    borderColor: 'transparent', // Will be set dynamically with theme color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 56,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  chatItemTouchable: {
    borderRadius: 16,
  },
  chatItemContent: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 3.11296,
    gap: 12,
  },
  
  // Avatar
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  onlineIndicatorWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Chat Info
  chatInfo: {
    flex: 1,
    gap: 1.96608,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  chatName: {
    fontSize: 12.8,
    fontFamily: FONT_FAMILY,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeContainer: {},
  chatTime: {
    fontSize: 9.6,
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statusIcon: {
    marginRight: 2,
  },
  lastMessage: {
    fontSize: 11.2,
    fontFamily: FONT_FAMILY,
    flex: 1,
    color: '#FFFFFF',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  messageCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  messageCountText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },

  // Date Separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 0.4,
    backgroundColor: '#E5E5EA',
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: FONT_FAMILY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Chat List
  chatList: {
    paddingTop: 0,
    paddingBottom: 100,
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },


  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsMenu: {
    borderRadius: 20,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  newChatModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 24,
  },
  newChatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  newChatIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatInfo: {
    flex: 1,
  },
  newChatTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  newChatDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});

