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
} from 'lucide-react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// Dark header color (WhatsApp style)
const HEADER_COLOR = '#075E54';
const STATUS_BG = '#FAFAFA';

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
        style={[
          styles.whatsappChatItem,
          {
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 0.5,
            borderBottomColor: '#E5E5E5',
          },
        ]}
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
                  color: '#000000',
                  fontWeight: chat.unread > 0 ? '600' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {chat.name}
            </Text>
            
            <Text style={[styles.chatTime, { color: '#999999' }]}>
              {chat.time}
            </Text>
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
                <BellOff size={14} color="#999999" style={{ marginRight: 4 }} />
              )}
              
              {/* Message preview */}
              <Text
                style={[
                  styles.lastMessage,
                  {
                    color: chat.unread > 0 ? '#000000' : '#999999',
                    fontWeight: chat.unread > 0 ? '500' : '400',
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
    // Show quick actions
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

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      online: false,
      typing: false,
      messageStatus: 'read',
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_COLOR} translucent />

      {/* WhatsApp-Style Dark Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Title Row */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>
            {isRTL ? 'الدردشة' : 'Chats'}
          </Text>
          <TouchableOpacity style={styles.menuButton}>
            <MoreVertical size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#FFFFFF" />
          <TextInput
            style={styles.searchInput}
            placeholder={isRTL ? 'البحث' : 'Search'}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        {/* Status/Stories Section */}
        <View style={styles.statusSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: '0', name: 'My Status', avatar: '📍' },
              ...transformedChats.slice(0, 5),
            ]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.statusItem}>
                <View style={styles.statusAvatar}>
                  {typeof item.avatar === 'string' && item.avatar.length <= 2 ? (
                    <Text style={[styles.statusAvatarText, { color: theme.primary }]}>
                      {item.avatar}
                    </Text>
                  ) : (
                    <Text style={styles.statusAvatarEmoji}>{item.avatar}</Text>
                  )}
                </View>
                <Text style={styles.statusName} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.statusList}
          />
        </View>
      </View>

      {/* Chat List */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : filteredChats.length === 0 ? (
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
            data={filteredChats}
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
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Show new chat options
        }}
      >
        <MessageCircle size={24} color="#000000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATUS_BG,
  },
  // WhatsApp-Style Header
  header: {
    backgroundColor: HEADER_COLOR,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
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
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // WhatsApp-Style Chat Item
  whatsappChatItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 72,
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});














