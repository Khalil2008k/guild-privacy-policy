/**
 * MODERN CHAT SCREEN - WhatsApp Style Design
 * 
 * Design Based On: WhatsApp/Signal style
 * - Dark theme header
 * - Status/Stories section
 * - Large profile pictures
 * - Clean chat list
 * - Swipe actions
 * - Bottom navigation with FAB
 */

import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { CustomAlertService } from '../../services/CustomAlertService';
import AdminChatService from '../../services/AdminChatService';
import { 
  Search, 
  MessageCircle, 
  Users, 
  User, 
  Plus, 
  MoreVertical,
  Phone,
  Trash2,
  Pin,
  Archive,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  Mic,
  Image as ImageIcon,
  FileText,
  MapPin,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// Colors - theme styled
const STATUS_BG = 'rgba(245, 247, 250, 1)';

// WhatsApp-Style Chat Item
function WhatsAppChatItem({ 
  chat, 
  onPress, 
  onLongPress,
  theme,
  isRTL,
  currentGuild,
}: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  // Get message status icon
  const getMessageStatusIcon = () => {
    if (!chat.isOwnLastMessage) return null;
    
    return (
      <View style={styles.statusContainer}>
        {chat.messageStatus === 'read' ? (
          <CheckCheck size={14} color={theme.primary} />
        ) : chat.messageStatus === 'delivered' ? (
          <CheckCheck size={14} color={theme.textSecondary} />
        ) : chat.messageStatus === 'sent' ? (
          <Check size={14} color={theme.textSecondary} />
        ) : (
          <Clock size={14} color={theme.textSecondary} />
        )}
      </View>
    );
  };

  // Get message type icon
  const getMessageTypeIcon = () => {
    if (chat.typing) {
      return (
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
        </View>
      );
    }

    switch (chat.lastMessageType) {
      case 'voice':
        return <Mic size={13} color={theme.textSecondary} />;
      case 'image':
        return <ImageIcon size={13} color={theme.textSecondary} />;
      case 'file':
        return <FileText size={13} color={theme.textSecondary} />;
      case 'location':
        return <MapPin size={13} color={theme.textSecondary} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.whatsappChatItem}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Profile Picture */}
        <View style={styles.avatarWrapper}>
          {chat.avatarUrl ? (
            <Image
              source={{ uri: chat.avatarUrl }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={[styles.profilePicture, { backgroundColor: theme.primary + '20' }]}>
              {typeof chat.avatar === 'string' && chat.avatar.length <= 2 ? (
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {chat.avatar}
                </Text>
              ) : (
                <Text style={styles.avatarEmoji}>{chat.avatar}</Text>
              )}
            </View>
          )}
          
          {/* Online indicator */}
          {chat.online && !chat.isGroup && (
            <View style={styles.onlineDot} />
          )}
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          {/* Top row */}
          <View style={styles.topRow}>
            <Text
              style={[
                styles.chatName,
                {
                  color: theme.textPrimary,
                  fontWeight: chat.unread > 0 ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {chat.name}
            </Text>
            
            <View style={styles.timeAndStatus}>
              <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
                {chat.time}
              </Text>
              {/* User availability indicator */}
              {chat.online && (
                <View style={[styles.availabilityDot, { backgroundColor: '#00C853' }]} />
              )}
            </View>
          </View>

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            <View style={styles.messageRow}>
              {/* Message status */}
              {getMessageStatusIcon()}
              
              {/* Message type icon */}
              {getMessageTypeIcon()}
              
              {/* Muted indicator */}
              {chat.isMuted && (
                <BellOff size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
              )}
              
              {/* Message preview */}
              <Text
                style={[
                  styles.lastMessage,
                  {
                    color: chat.unread > 0 ? theme.textPrimary : theme.textSecondary,
                    fontWeight: chat.unread > 0 ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {chat.typing
                  ? (isRTL ? 'يكتب...' : 'typing...')
                  : chat.draft
                  ? `${isRTL ? 'مسودة: ' : 'Draft: '}${chat.lastMessage}`
                  : chat.lastMessage
                }
              </Text>
            </View>
            
            {/* Unread badge */}
            {chat.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.unreadText}>
                  {chat.unread > 99 ? '99+' : chat.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// New Chat Options Modal Component
function NewChatOptionsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [userId, setUserId] = useState('');

  const handleStartUserChat = () => {
    if (!userId.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال معرف المستخدم' : 'Please enter a user ID'
      );
      return;
    }
    
    // TODO: Implement user chat functionality
    CustomAlertService.showInfo(
      isRTL ? 'قريباً' : 'Coming Soon',
      isRTL ? 'ميزة الدردشة مع المستخدمين ستكون متاحة قريباً' : 'User chat feature will be available soon'
    );
    setUserId('');
    onClose();
  };

  const handleJoinGuild = () => {
    onClose();
    router.push('/(modals)/guilds');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'بدء محادثة جديدة' : 'Start New Chat'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Chat with User Option */}
            <View style={styles.optionSection}>
              <View style={styles.optionHeader}>
                <User size={24} color={theme.primary} />
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'الدردشة مع مستخدم' : 'Chat with User'}
                </Text>
              </View>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                {isRTL ? 'أدخل معرف المستخدم لبدء محادثة مباشرة' : 'Enter user ID to start a direct conversation'}
              </Text>
              
              <TextInput
                style={[
                  styles.userIdInput,
                  {
                  backgroundColor: theme.background, 
                  color: theme.textPrimary,
                  borderColor: theme.border 
                  }
                ]}
                placeholder={isRTL ? 'معرف المستخدم' : 'User ID'}
                placeholderTextColor={theme.textSecondary}
                value={userId}
                onChangeText={setUserId}
                textAlign={isRTL ? 'right' : 'left'}
              />
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={handleStartUserChat}
              >
                <Text style={[styles.actionButtonText, { color: '#000000' }]}>
                  {isRTL ? 'بدء المحادثة' : 'Start Chat'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Join Guild Option */}
            <View style={styles.optionSection}>
              <View style={styles.optionHeader}>
                <Users size={24} color={theme.primary} />
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'الانضمام إلى نقابة' : 'Join Guild'}
                </Text>
              </View>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                {isRTL ? 'انضم إلى نقابة للدردشة مع الأعضاء' : 'Join a guild to chat with members'}
              </Text>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.primary }]}
                onPress={handleJoinGuild}
              >
                <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                  {isRTL ? 'تصفح النقابات' : 'Browse Guilds'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function WhatsAppStyleChatScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { currentGuild } = useGuild();
  const { chats } = useChat();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNewChatOptions, setShowNewChatOptions] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initial loading
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 300);
  }, []);

  // Pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Handle chat press
  const handleChatPress = (chatId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(modals)/chat/${chatId}`);
  };

  // Handle long press
  const handleChatLongPress = (chat: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedChat(chat);
    setShowQuickActions(true);
  };

  // Chat options handlers
  const handlePinChat = async () => {
    if (!selectedChat) return;
    setShowQuickActions(false);

    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        isPinned: !selectedChat.isPinned,
        pinnedAt: !selectedChat.isPinned ? serverTimestamp() : null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      CustomAlertService.showSuccess(
        isRTL ? 'تم' : 'Success',
        isRTL
          ? (!selectedChat.isPinned ? 'تم تثبيت المحادثة' : 'تم إلغاء التثبيت')
          : (!selectedChat.isPinned ? 'Chat pinned' : 'Chat unpinned')
      );
    } catch (error) {
      console.error('Error pinning chat:', error);
    }
  };

  const handleMuteChat = async () => {
    if (!selectedChat) return;
    setShowQuickActions(false);

    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        isMuted: !selectedChat.isMuted,
        mutedAt: !selectedChat.isMuted ? serverTimestamp() : null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error muting chat:', error);
    }
  };

  const handleArchiveChat = async () => {
    if (!selectedChat) return;
    setShowQuickActions(false);

    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        isArchived: true,
        archivedAt: serverTimestamp(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      CustomAlertService.showSuccess(
        isRTL ? 'تم' : 'Success',
        isRTL ? 'تم أرشفة المحادثة' : 'Chat archived'
      );
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  };

  const handleDeleteChat = () => {
    if (!selectedChat) return;
    setShowQuickActions(false);

    CustomAlertService.showConfirmation(
      isRTL ? 'حذف المحادثة' : 'Delete Chat',
      isRTL ? 'هل أنت متأكد؟' : 'Are you sure?',
      async () => {
        try {
          // TODO: Implement delete chat
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.error('Error deleting chat:', error);
        }
      },
      undefined,
      isRTL
    );
  };

  const handlePokeUser = () => {
    if (!selectedChat) return;
    setShowQuickActions(false);

    CustomAlertService.showInfo(
      isRTL ? 'قريباً' : 'Coming Soon',
      isRTL ? 'ميزة التنبيه ستكون متاحة قريباً' : 'Poke feature coming soon'
    );
  };

  // Format time
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
    const now = new Date();
      const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

      if (minutes < 1) return isRTL ? 'الآن' : 'now';
      if (minutes < 60) return isRTL ? `${minutes}م` : `${minutes}m`;
      if (hours < 24) return isRTL ? `${hours}س` : `${hours}h`;
      if (days === 1) return isRTL ? 'أمس' : 'yesterday';
      if (days < 7) return isRTL ? `${days}د` : `${days}d`;
      
      // Format date
      return date.toLocaleDateString(isRTL ? 'ar' : 'en', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return '';
    }
  };

  // Transform chats
  const transformedChats = chats.map(chat => {
    const isGuildChat = !!chat.guildId;
    const isJobChat = !!chat.jobId;
    const otherParticipant = chat.participants.find(p => p !== user?.uid);
    const participantName = chat.participantNames?.[otherParticipant || ''] || 'Unknown User';

    const chatName = isGuildChat 
      ? (currentGuild?.name ? `${currentGuild.name} - General` : 'Guild Chat')
      : participantName;

    return {
      id: chat.id,
      name: chatName,
      lastMessage: chat.lastMessage?.text || (isRTL ? 'لا توجد رسائل' : 'No messages yet'),
      time: chat.lastMessage?.timestamp ? formatTime(chat.lastMessage.timestamp) : '',
      unread: chat.unreadCount || 0,
      avatar: isGuildChat ? '🏛️' : isJobChat ? '💼' : getInitials(participantName),
      avatarUrl: chat.avatarUrl,
      type: isGuildChat ? 'guild' : 'direct',
      isGroup: isGuildChat,
      memberCount: chat.participants.length,
      isPinned: chat.isPinned || false,
      isMuted: chat.isMuted || false,
      online: Math.random() > 0.5, // Random for demo
      typing: false,
      messageStatus: chat.unreadCount > 0 ? 'delivered' : 'read',
      lastMessageType: 'text',
      draft: null,
      isOwnLastMessage: chat.lastMessage?.senderId === user?.uid,
    };
  });

  // Filter chats
  const getFilteredChats = () => {
    let filtered = transformedChats;

    // Filter by tab
    switch (selectedTab) {
      case 'unread':
        filtered = filtered.filter(chat => chat.unread > 0);
        break;
      case 'groups':
        filtered = filtered.filter(chat => chat.isGroup);
        break;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        chat =>
          chat.name.toLowerCase().includes(query) ||
          chat.lastMessage.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by time
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    return filtered;
  };

  const filteredChats = getFilteredChats();

  // Get header color from theme
  const headerColor = theme.primary; // Use your theme color

  // Separate pinned and regular chats
  const pinnedChats = filteredChats.filter(chat => chat.isPinned);
  const regularChats = filteredChats.filter(chat => !chat.isPinned);

  // Get initials helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={headerColor} translucent />

      {/* Modern Theme Header */}
      <LinearGradient
        colors={[headerColor, headerColor + 'F0']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        {/* Title Row */}
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <View style={[styles.headerIconBadge, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
              <MessageCircle size={20} color="#000000" />
            </View>
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {isRTL ? 'الدردشة' : 'Chats'}
            </Text>
              </View>
          <TouchableOpacity style={[styles.menuButton, {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }]}>
            <MoreVertical size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#000000" />
          <TextInput
            style={styles.searchInput}
            placeholder={isRTL ? 'البحث' : 'Search'}
            placeholderTextColor="rgba(0, 0, 0, 0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
        
        {/* Pinned Chats Section */}
        {pinnedChats.length > 0 && (
          <View style={styles.statusSection}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={pinnedChats}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
              <TouchableOpacity
                  style={styles.statusItem}
                  onPress={() => handleChatPress(item.id)}
                  onLongPress={() => handleChatLongPress(item)}
                >
                  <View style={[styles.statusAvatar, { borderColor: '#FFFFFF' }]}>
                    {typeof item.avatar === 'string' && item.avatar.length <= 2 ? (
                    <Text style={[styles.statusAvatarText, { color: '#000000' }]}>
                      {item.avatar}
                </Text>
                    ) : (
                      <Text style={styles.statusAvatarEmoji}>{item.avatar}</Text>
                    )}
                    {/* Pinned indicator */}
                    <View style={[styles.pinnedIndicator, { backgroundColor: theme.primary }]}>
                      <Pin size={8} color="#FFFFFF" />
        </View>
      </View>
                  <Text style={[styles.statusName, { color: '#000000' }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.statusList}
            />
          </View>
        )}
      </LinearGradient>

      {/* Chat List */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : regularChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color="#CCCCCC" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {searchQuery 
                ? (isRTL ? 'لا توجد نتائج' : 'No results found')
                : (isRTL ? 'لا توجد محادثات' : 'No chats yet')}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? (isRTL ? 'جرب البحث بكلمات مختلفة' : 'Try different keywords')
                : (isRTL ? 'ابدأ محادثة جديدة للبدء' : 'Start a new chat to get started')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={regularChats}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <WhatsAppChatItem
                chat={item}
                onPress={() => handleChatPress(item.id as number)}
                onLongPress={() => handleChatLongPress(item)}
                theme={theme}
                isRTL={isRTL}
                currentGuild={currentGuild}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Animated.View>

      {/* Floating Action Button */}
              <TouchableOpacity
        style={[styles.fab, { backgroundColor: headerColor }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowNewChatOptions(true);
                }}
              >
        <MessageCircle size={24} color="#000000" />
              </TouchableOpacity>

      {/* Chat Options Modal */}
      <Modal visible={showQuickActions} transparent animationType="fade" onRequestClose={() => setShowQuickActions(false)}>
            <TouchableOpacity
          style={styles.quickActionsOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickActions(false)}
        >
          <View style={[styles.quickActionsContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.quickActionsTitle, { color: theme.textPrimary }]}>
              {selectedChat?.name}
                    </Text>

            <TouchableOpacity style={styles.quickAction} onPress={handlePinChat}>
              <Pin size={20} color={theme.textPrimary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {selectedChat?.isPinned ? (isRTL ? 'إلغاء التثبيت' : 'Unpin') : (isRTL ? 'تثبيت' : 'Pin')}
                    </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={handleMuteChat}>
              <BellOff size={20} color={theme.textPrimary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {selectedChat?.isMuted ? (isRTL ? 'إلغاء الكتم' : 'Unmute') : (isRTL ? 'كتم' : 'Mute')}
                    </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={handlePokeUser}>
              <MessageCircle size={20} color={theme.textPrimary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {isRTL ? 'تنبيه' : 'Poke'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={handleArchiveChat}>
              <Archive size={20} color={theme.textPrimary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {isRTL ? 'أرشفة' : 'Archive'}
                    </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} onPress={handleDeleteChat}>
              <Trash2 size={20} color={theme.error} />
              <Text style={[styles.quickActionText, { color: theme.error }]}>
                {isRTL ? 'حذف' : 'Delete'}
              </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
      </Modal>

      {/* New Chat Options Modal */}
      <NewChatOptionsModal
        visible={showNewChatOptions}
        onClose={() => setShowNewChatOptions(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATUS_BG,
  },
  // Modern Theme Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    padding: 0,
  },
  // Status Section
  statusSection: {
    paddingVertical: 8,
  },
  statusList: {
    paddingRight: 8,
  },
  statusItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  statusAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  statusAvatarEmoji: {
    fontSize: 28,
  },
  statusName: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    fontWeight: '600',
  },
  pinnedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modern Theme Chat Item
  whatsappChatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 76,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 17,
    fontFamily: FONT_FAMILY,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  timeAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusContainer: {
    marginRight: 4,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 4,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  lastMessage: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  // List
  listContent: {
    paddingBottom: 100,
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#999999',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  // Chat Options Modal
  quickActionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  quickActionsContainer: {
    borderRadius: 16,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    padding: 16,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  // New Chat Options Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  optionSection: {
    marginBottom: 24,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
    lineHeight: 20,
  },
  userIdInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});

