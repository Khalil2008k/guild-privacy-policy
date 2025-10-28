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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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

// 🎯 Premium Chat Item Component
function PremiumChatItem({
  chat,
  onPress,
  onLongPress,
  theme,
  isRTL,
}: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

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
    }
  }, [chat.unread]);

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

  return (
    <Animated.View
      style={[
        styles.premiumChatItem,
        {
          transform: [{ scale: scaleAnim }],
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
            {chat.online && (
              <View style={[styles.statusRing, { borderColor: PREMIUM_COLORS.online }]} />
            )}
            <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
              {chat.avatar ? (
                <Image source={{ uri: chat.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {chat.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              )}
            </View>
            {/* Online indicator */}
            {chat.online && (
              <View style={[styles.onlineIndicator, { backgroundColor: PREMIUM_COLORS.online }]} />
            )}
            {/* Typing indicator */}
            {chat.typing && (
              <View style={[styles.typingIndicator, { backgroundColor: PREMIUM_COLORS.typing }]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, { backgroundColor: '#FFFFFF' }]} />
                  <View style={[styles.typingDot, { backgroundColor: '#FFFFFF' }]} />
                  <View style={[styles.typingDot, { backgroundColor: '#FFFFFF' }]} />
                </View>
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
                      color: theme.textPrimary,
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
              </View>

              {/* Time */}
              <View style={styles.timeContainer}>
                <Text
                  style={[
                    styles.chatTime,
                    {
                      color: chat.unread > 0 ? theme.primary : theme.textSecondary,
                      fontWeight: chat.unread > 0 ? '600' : '400',
                    },
                  ]}
                >
                  {chat.time}
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
                      <Check size={16} color={PREMIUM_COLORS.sent} />
                    )}
                    {chat.messageStatus === 'delivered' && (
                      <CheckCheck size={16} color={PREMIUM_COLORS.delivered} />
                    )}
                    {chat.messageStatus === 'read' && (
                      <CheckCheck size={16} color={PREMIUM_COLORS.read} />
                    )}
                    {chat.messageStatus === 'pending' && (
                      <Clock size={16} color={PREMIUM_COLORS.sent} />
                    )}
                  </View>
                )}

                {/* Message type icon */}
                {chat.lastMessageType === 'voice' && (
                  <Mic size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                )}
                {chat.lastMessageType === 'image' && (
                  <ImageIcon size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                )}
                {chat.lastMessageType === 'file' && (
                  <FileText size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                )}
                {chat.lastMessageType === 'location' && (
                  <MapPin size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                )}

                {/* Message text */}
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
                    : chat.lastMessage}
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
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 🎨 Premium Header Component
function PremiumHeader({ theme, isRTL, onSearch, onMenu }: any) {
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
              {isRTL ? 'المحادثات' : 'Chats'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onSearch}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={[styles.headerButtonInner, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                <Search size={20} color="#000000" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={onMenu}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={[styles.headerButtonInner, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
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
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { currentGuild } = useGuild();
  const { chats, isConnected, refreshChats } = useChat();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNewChatOptions, setShowNewChatOptions] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadChats();
    animateFAB();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      await refreshChats();
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateFAB = () => {
    Animated.spring(fabAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
      delay: 300,
    }).start();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (chat.type === 'guild') {
      router.push(`/(modals)/guild-chat/${chat.id}`);
    } else if (chat.type === 'job') {
      router.push(`/(modals)/chat/${chat.jobId}`);
    } else {
      router.push(`/(modals)/direct-chat/${chat.id}`);
    }
  };

  const handleChatLongPress = (chat: any) => {
    setSelectedChat(chat);
    setShowQuickActions(true);
  };

  const handlePinChat = async () => {
    if (!selectedChat) return;
    
    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        isPinned: !selectedChat.isPinned,
        updatedAt: serverTimestamp(),
      });
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        selectedChat.isPinned
          ? (isRTL ? 'تم إلغاء التثبيت' : 'Chat unpinned')
          : (isRTL ? 'تم التثبيت' : 'Chat pinned')
      );
      
      setShowQuickActions(false);
      await refreshChats();
    } catch (error) {
      console.error('Error pinning chat:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في تثبيت المحادثة' : 'Failed to pin chat'
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
        isRTL ? 'نجح' : 'Success',
        selectedChat.isMuted
          ? (isRTL ? 'تم إلغاء الكتم' : 'Chat unmuted')
          : (isRTL ? 'تم الكتم' : 'Chat muted')
      );
      
      setShowQuickActions(false);
      await refreshChats();
    } catch (error) {
      console.error('Error muting chat:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في كتم المحادثة' : 'Failed to mute chat'
      );
    }
  };

  const handleArchiveChat = async () => {
    if (!selectedChat) return;
    
    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        isArchived: true,
        updatedAt: serverTimestamp(),
      });
      
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم الأرشفة' : 'Chat archived'
      );
      
      setShowQuickActions(false);
      await refreshChats();
    } catch (error) {
      console.error('Error archiving chat:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في أرشفة المحادثة' : 'Failed to archive chat'
      );
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    
    CustomAlertService.showConfirm(
      isRTL ? 'تأكيد الحذف' : 'Confirm Delete',
      isRTL ? 'هل أنت متأكد من حذف هذه المحادثة؟' : 'Are you sure you want to delete this chat?',
      async () => {
        try {
          const chatRef = doc(db, 'chats', selectedChat.id);
          await updateDoc(chatRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
          });
          
          CustomAlertService.showSuccess(
            isRTL ? 'نجح' : 'Success',
            isRTL ? 'تم الحذف' : 'Chat deleted'
          );
          
          setShowQuickActions(false);
          await refreshChats();
        } catch (error) {
          console.error('Error deleting chat:', error);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'فشل في حذف المحادثة' : 'Failed to delete chat'
          );
        }
      }
    );
  };

  const handlePokeUser = () => {
    if (!selectedChat) return;
    
    CustomAlertService.showInfo(
      isRTL ? 'تنبيه' : 'Poke',
      isRTL ? `تم إرسال تنبيه إلى ${selectedChat.name}` : `Poked ${selectedChat.name}`
    );
    
    setShowQuickActions(false);
  };

  // Transform chats data
  const transformedChats = chats.map((chat: any) => {
    const isJobChat = chat.type === 'job';
    const isGuildChat = chat.type === 'guild';
    const participantName = isJobChat
      ? chat.jobTitle || 'Job Chat'
      : isGuildChat
      ? chat.guildName || 'Guild Chat'
      : chat.participantName || chat.name || 'Unknown';

    return {
      ...chat,
      name: participantName,
      isPinned: chat.isPinned || false,
      isMuted: chat.isMuted || false,
      online: chat.online || false,
      typing: chat.typing || false,
      messageStatus: chat.messageStatus || 'sent',
      lastMessageType: chat.lastMessageType || 'text',
      draft: chat.draft || '',
      isOwnLastMessage: chat.lastMessageSenderId === user?.uid,
    };
  });

  // Separate pinned and regular chats
  const pinnedChats = transformedChats.filter((chat: any) => chat.isPinned);
  const regularChats = transformedChats.filter((chat: any) => !chat.isPinned);

  // Filter chats based on search
  const filteredChats = searchQuery
    ? regularChats.filter((chat: any) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : regularChats;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Premium Header */}
      <PremiumHeader
        theme={theme}
        isRTL={isRTL}
        onSearch={() => setShowSearch(!showSearch)}
        onMenu={() => {
          // TODO: Show menu
        }}
      />

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={isRTL ? 'بحث...' : 'Search...'}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Pinned Chats Section */}
      {pinnedChats.length > 0 && (
        <View style={styles.pinnedSection}>
          <View style={[styles.sectionHeader, { backgroundColor: theme.surface }]}>
            <Pin size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'المحادثات المثبتة' : 'Pinned Chats'}
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
                    <Image source={{ uri: chat.avatar }} style={styles.pinnedAvatarImage} />
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
                  style={[styles.pinnedName, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {chat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {searchQuery
              ? (isRTL ? 'لا توجد نتائج' : 'No results found')
              : (isRTL ? 'لا توجد محادثات' : 'No chats yet')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PremiumChatItem
              chat={item}
              onPress={() => handleChatPress(item)}
              onLongPress={() => handleChatLongPress(item)}
              theme={theme}
              isRTL={isRTL}
            />
          )}
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

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            opacity: fabAnim,
            transform: [
              {
                scale: fabAnim,
              },
              {
                translateY: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setShowNewChatOptions(true);
          }}
          style={[styles.fabButton, { backgroundColor: theme.primary }]}
        >
          <LinearGradient
            colors={[theme.primary, theme.primary + 'CC']}
            style={styles.fabGradient}
          >
            <Plus size={28} color="#000000" strokeWidth={3} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

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
              <Pin size={20} color={theme.textPrimary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {selectedChat?.isPinned
                  ? (isRTL ? 'إلغاء التثبيت' : 'Unpin')
                  : (isRTL ? 'تثبيت' : 'Pin')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleMuteChat}
            >
              {selectedChat?.isMuted ? (
                <Bell size={20} color={theme.textPrimary} />
              ) : (
                <BellOff size={20} color={theme.textPrimary} />
              )}
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {selectedChat?.isMuted
                  ? (isRTL ? 'إلغاء الكتم' : 'Unmute')
                  : (isRTL ? 'كتم' : 'Mute')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handlePokeUser}
            >
              <Zap size={20} color={theme.textPrimary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {isRTL ? 'تنبيه' : 'Poke'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleArchiveChat}
            >
              <Archive size={20} color={theme.textPrimary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>
                {isRTL ? 'أرشفة' : 'Archive'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleDeleteChat}
            >
              <Trash2 size={20} color={theme.error} />
              <Text style={[styles.quickActionText, { color: theme.error }]}>
                {isRTL ? 'حذف' : 'Delete'}
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
              {isRTL ? 'بدء محادثة جديدة' : 'Start New Chat'}
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
                  {isRTL ? 'محادثة مع مستخدم' : 'Chat with User'}
                </Text>
                <Text style={[styles.newChatDescription, { color: theme.textSecondary }]}>
                  {isRTL ? 'ابدأ محادثة مباشرة' : 'Start a direct conversation'}
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
                  {isRTL ? 'الانضمام إلى نقابة' : 'Join Guild'}
                </Text>
                <Text style={[styles.newChatDescription, { color: theme.textSecondary }]}>
                  {isRTL ? 'انضم إلى محادثة جماعية' : 'Join a group conversation'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.error + '20' }]}
              onPress={() => setShowNewChatOptions(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.error }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinnedChatsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  pinnedChatItem: {
    alignItems: 'center',
    gap: 8,
  },
  pinnedAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pinnedAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  pinnedAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pinnedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pinnedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  pinnedName: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    maxWidth: 64,
  },

  // Premium Chat Item
  premiumChatItem: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  chatItemTouchable: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
  },
  chatItemContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  
  // Avatar
  avatarContainer: {
    position: 'relative',
  },
  statusRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 32,
    borderWidth: 2.5,
    zIndex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Chat Info
  chatInfo: {
    flex: 1,
    gap: 6,
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
    fontSize: 17,
    fontFamily: FONT_FAMILY,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeContainer: {},
  chatTime: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
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
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    flex: 1,
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

  // Chat List
  chatList: {
    paddingTop: 8,
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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


