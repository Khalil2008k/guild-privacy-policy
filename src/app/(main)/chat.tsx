import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdaptiveTextColor } from '../../utils/colorUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import ChatOptionsModal from '../(modals)/chat-options';
import { CustomAlertService } from '../../services/CustomAlertService';
import { 
  Search, 
  MessageCircle, 
  Users, 
  User, 
  Plus, 
  X, 
  Shield, 
  UserPlus,
  MessageSquare,
  MoreHorizontal,
  XCircle,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  searchBackground: isDark ? theme.surface : '#F8F8F8',
  searchBorder: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

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
              <X size={24} color={theme.iconSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Chat with User Option */}
            <View style={styles.optionSection}>
              <View style={styles.optionHeader}>
                <User size={24} color={theme.iconPrimary} />
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'الدردشة مع مستخدم' : 'Chat with User'}
                </Text>
              </View>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                {isRTL ? 'أدخل معرف المستخدم لبدء محادثة مباشرة' : 'Enter user ID to start a direct conversation'}
              </Text>
              
              <TextInput
                style={[styles.userIdInput, { 
                  backgroundColor: theme.background, 
                  color: theme.textPrimary,
                  borderColor: theme.border 
                }]}
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
                <Users size={24} color={theme.iconPrimary} />
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
                <Text style={[styles.actionButtonText, { color: theme.iconActive }]}>
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

export default function ChatScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { currentGuild } = useGuild();
  const { chats, isConnected, loadMoreMessages } = useChat();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'guild' | 'direct'>('all');
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showNewChatOptions, setShowNewChatOptions] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Initial loading
  useEffect(() => {
    // Simulate initial load
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Reload chats - this will be handled by ChatContext
      await new Promise(resolve => setTimeout(resolve, 1000));
      CustomAlertService.showSuccess(
        isRTL ? 'تم التحديث' : 'Refreshed',
        isRTL ? 'تم تحديث المحادثات' : 'Chats refreshed successfully'
      );
    } catch (error) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحديث المحادثات' : 'Failed to refresh chats'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabPress = (tabKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tabKey as any);
  };

  const handleChatPress = (chatId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(modals)/chat/${chatId}`);
  };

  // Format time from timestamp
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return isRTL ? 'الآن' : 'Now';
    if (minutes < 60) return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Transform real chats from ChatContext to display format
  const transformedChats = chats.map(chat => {
    const isGuildChat = !!chat.guildId;
    const isJobChat = !!chat.jobId;
    const otherParticipant = chat.participants.find(p => p !== user?.uid);
    const participantName = chat.participantNames?.[otherParticipant || ''] || 'Unknown User';

    return {
      id: chat.id,
      name: isGuildChat 
        ? (currentGuild?.name ? `${currentGuild.name} - General` : 'Guild Chat')
        : isJobChat
        ? `Job Chat - ${chat.jobId.slice(0, 8)}`
        : participantName,
      lastMessage: chat.lastMessage?.text || (isRTL ? 'لا توجد رسائل' : 'No messages yet'),
      time: chat.lastMessage?.timestamp ? formatTime(chat.lastMessage.timestamp) : '',
      unread: chat.unreadCount || 0,
      avatar: isGuildChat ? '🏛️' : isJobChat ? '💼' : getInitials(participantName),
      online: true, // We could add online status tracking
      type: isGuildChat ? 'guild' : 'direct',
      isGroup: isGuildChat || isJobChat,
      memberCount: chat.participants.length,
      role: isJobChat ? 'Job' : undefined,
    };
  });

  // Filter chats based on selected tab and search query
  const getFilteredChats = () => {
    let filtered = transformedChats;

    // Filter by tab
    switch (selectedTab) {
      case 'guild':
        filtered = filtered.filter(chat => chat.type === 'guild');
        break;
      case 'direct':
        filtered = filtered.filter(chat => chat.type === 'direct' && !chat.role);
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        chat =>
          chat.name.toLowerCase().includes(query) ||
          chat.lastMessage.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredChats = getFilteredChats();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Clean Header - Home Screen Style */}
      <View style={[styles.cleanHeader, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MessageCircle size={24} color={theme.iconPrimary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}>
              {t('messages')}
            </Text>
            {!isConnected && (
              <View style={[styles.offlineBadge, { backgroundColor: theme.error }]}>
                <Text style={styles.offlineText}>{isRTL ? 'غير متصل' : 'Offline'}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.headerActionButton, { backgroundColor: theme.surface }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowNewChatOptions(true);
            }}
          >
            <Plus size={24} color={theme.iconPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Search size={18} color={theme.iconSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}
            placeholder={isRTL ? 'البحث في المحادثات...' : 'Search chats...'}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <XCircle size={18} color={theme.iconSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Chat Tabs - Clean Style */}
        <View style={styles.tabContainer}>
          {[
            { key: 'all', label: isRTL ? 'الكل' : 'All', IconComponent: MessageSquare, count: transformedChats.length },
            { key: 'guild', label: isRTL ? 'النقابة' : 'Guild', IconComponent: Shield, count: transformedChats.filter(c => c.type === 'guild').length },
            { key: 'direct', label: isRTL ? 'مباشر' : 'Direct', IconComponent: User, count: transformedChats.filter(c => c.type === 'direct' && !c.role).length },
          ].map((tab) => {
            const IconComponent = tab.IconComponent;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  selectedTab === tab.key && { 
                    backgroundColor: theme.primary + '20', 
                    borderColor: theme.primary 
                  }
                ]}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.8}
              >
                <IconComponent 
                  size={16} 
                  color={selectedTab === tab.key ? theme.iconActive : theme.iconSecondary} 
                />
                <Text style={[
                  styles.tabText, 
                  { color: selectedTab === tab.key ? theme.iconActive : theme.textSecondary }
                ]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.tabBadgeText, { color: '#000000' }]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={[styles.content, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={styles.topSpacer} />

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {isRTL ? 'جاري التحميل...' : 'Loading chats...'}
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filteredChats.length === 0 && (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color={theme.iconSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {searchQuery 
                ? (isRTL ? 'لا توجد نتائج' : 'No results found')
                : (isRTL ? 'لا توجد محادثات' : 'No chats yet')}
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              {searchQuery
                ? (isRTL ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different keywords')
                : (isRTL ? 'ابدأ محادثة جديدة للبدء' : 'Start a new chat to get started')}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowNewChatOptions(true);
                }}
              >
                <Plus size={20} color="#000000" />
                <Text style={[styles.emptyButtonText, { color: '#000000' }]}>
                  {isRTL ? 'بدء محادثة' : 'Start Chat'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Chat List */}
        {!isLoading && filteredChats.map((chat, index) => (
          <Animated.View
            key={chat.id}
            style={[
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.chatItem,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: theme.primary,
                }
              ]}
              onPress={() => handleChatPress(chat.id as number)}
              activeOpacity={0.8}
            >
              <View style={styles.avatarContainer}>
                <View style={[
                  styles.avatar, 
                  { 
                    backgroundColor: chat.type === 'guild' 
                      ? (currentGuild?.primaryColor || theme.primary) + '20'
                      : theme.primary + '20',
                    borderWidth: 2,
                    borderColor: chat.type === 'guild' 
                      ? (currentGuild?.primaryColor || theme.primary)
                      : theme.primary,
                  }
                ]}>
                  {typeof chat.avatar === 'string' && chat.avatar.length <= 2 ? (
                    <Text style={[styles.avatarText, { 
                      color: chat.type === 'guild' 
                        ? (currentGuild?.primaryColor || theme.primary)
                        : theme.primary 
                    }]}>
                      {chat.avatar}
                    </Text>
                  ) : (
                    <Text style={styles.avatarEmoji}>
                      {chat.avatar}
                    </Text>
                  )}
                </View>
                
                {/* Online indicator for direct chats */}
                {chat.type === 'direct' && chat.online && (
                  <View style={[styles.onlineIndicator, { backgroundColor: theme.success }]} />
                )}
                
                {/* Group indicator for guild chats */}
                {chat.type === 'guild' && (
                  <View style={[styles.groupIndicator, { backgroundColor: currentGuild?.primaryColor || theme.primary }]}>
                    <Users size={10} color="white" />
                  </View>
                )}
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <View style={styles.chatTitleContainer}>
                    <Text style={[styles.chatName, { color: theme.textPrimary }]}>
                      {chat.name}
                    </Text>
                    {chat.type === 'guild' && chat.isGroup && (
                      <View style={[styles.memberCountBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.memberCountText, { color: theme.iconActive }]}>
                          {chat.memberCount}
                        </Text>
                      </View>
                    )}
                    {chat.type === 'direct' && chat.role && (
                      <View style={[styles.roleBadge, { backgroundColor: theme.info + '20' }]}>
                        <Text style={[styles.roleText, { color: theme.info }]}>
                          {chat.role}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
                    {chat.time}
                  </Text>
                </View>

                <Text
                  style={[styles.lastMessage, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {chat.lastMessage}
                </Text>
              </View>

              <View style={styles.chatActions}>
                {chat.unread > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.unreadText, { color: 'white' }]}>
                      {chat.unread > 99 ? '99+' : chat.unread}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={[styles.chatActionButton, { backgroundColor: theme.primary + '10' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedChat(chat);
                    setShowChatOptions(true);
                  }}
                >
                  <MoreHorizontal size={16} color={theme.iconSecondary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {selectedChat && (
        <ChatOptionsModal
          visible={showChatOptions}
          onClose={() => setShowChatOptions(false)}
          chatId={selectedChat.id}
          chatType={selectedChat.type}
        />
      )}

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
  },
  // Clean Header Styles - Home Screen Style
  cleanHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: 'white',
    marginLeft: 12,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
  },
  offlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    padding: 0,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: 'white',
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: 'white',
  },
  // Content Styles
  content: {
    flex: 1,
  },
  topSpacer: {
    height: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  // Modal Styles
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
  // Chat Item Styles
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  groupIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  chatTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginRight: 8,
  },
  memberCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  memberCountText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  chatActions: {
    alignItems: 'center',
    gap: 8,
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
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  chatActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading State Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});
