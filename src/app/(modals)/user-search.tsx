/**
 * User Search Screen
 * Find users by GID, phone number, or name
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Search,
  X,
  User,
  Phone,
  Hash,
  ShieldCheck,
  MessageCircle,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import UserSearchService, { UserSearchResult } from '../../services/UserSearchService';
import { CustomAlertService } from '../../services/CustomAlertService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

export default function UserSearchScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const { createDirectChat } = useChat();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [recentContacts, setRecentContacts] = useState<UserSearchResult[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'suggested'>('search');

  // Load recent contacts and suggestions on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadInitialData = async () => {
    if (!user?.uid) return;

    try {
      const [recent, suggested] = await Promise.all([
        UserSearchService.getRecentContacts(user.uid, 10),
        UserSearchService.getSuggestedUsers(user.uid, 10),
      ]);

      setRecentContacts(recent);
      setSuggestedUsers(suggested);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading initial data:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const results = await UserSearchService.universalSearch(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error searching users:', error);
      CustomAlertService.showError(
        t('error'),
        isRTL ? 'فشل البحث عن المستخدمين' : 'Failed to search users'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserPress = async (selectedUser: UserSearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create or get existing chat
      const chat = await createDirectChat(selectedUser.uid);
      
      // Navigate to chat
      router.back();
      router.push(`/(modals)/direct-chat/${chat.id}` as any);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error creating chat:', error);
      CustomAlertService.showError(
        t('error'),
        isRTL ? 'فشل إنشاء المحادثة' : 'Failed to create chat'
      );
    }
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: theme.surface }]}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <User size={24} color={theme.primary} />
          </View>
        )}
        {item.online && (
          <View style={styles.onlineDot} />
        )}
      </View>

      {/* User info */}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.displayName}
          </Text>
          {item.isVerified && (
            <ShieldCheck size={16} color="#007AFF" style={{ marginLeft: 4 }} />
          )}
        </View>

        {/* GID */}
        <View style={styles.detailRow}>
          <Hash size={12} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {item.gid}
          </Text>
        </View>

        {/* Phone (if available) */}
        {item.phoneNumber && (
          <View style={styles.detailRow}>
            <Phone size={12} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {item.phoneNumber}
            </Text>
          </View>
        )}

        {/* Bio (if available) */}
        {item.bio && (
          <Text style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.chatButton, { backgroundColor: theme.primary }]}
        onPress={() => handleUserPress(item)}
      >
        <MessageCircle size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL ? 'جاري البحث...' : 'Searching...'}
          </Text>
        </View>
      );
    }

    if (searchQuery.trim().length > 0 && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'لا توجد نتائج' : 'No results found'}
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL
              ? 'جرب البحث باستخدام GID أو رقم الهاتف أو الاسم'
              : 'Try searching by GID, phone number, or name'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Search size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'ابحث عن مستخدمين' : 'Search for users'}
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {isRTL
            ? 'ابحث باستخدام GID أو رقم الهاتف أو الاسم'
            : 'Search by GID, phone number, or name'}
        </Text>
      </View>
    );
  };

  const getDisplayData = () => {
    if (searchQuery.trim().length > 0) {
      return searchResults;
    }

    if (activeTab === 'recent') {
      return recentContacts;
    }

    if (activeTab === 'suggested') {
      return suggestedUsers;
    }

    return [];
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'DD']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <X size={24} color="#000000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isRTL ? 'بحث عن مستخدمين' : 'Find Users'}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#000000" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isRTL ? 'GID، رقم الهاتف، أو الاسم' : 'GID, phone, or name'}
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#000000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs (only show when not searching) */}
        {searchQuery.trim().length === 0 && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
              onPress={() => setActiveTab('recent')}
            >
              <Clock size={16} color={activeTab === 'recent' ? '#000000' : 'rgba(0, 0, 0, 0.5)'} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'recent' ? '#000000' : 'rgba(0, 0, 0, 0.5)' },
                ]}
              >
                {isRTL ? 'الأخيرة' : 'Recent'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'suggested' && styles.activeTab]}
              onPress={() => setActiveTab('suggested')}
            >
              <TrendingUp size={16} color={activeTab === 'suggested' ? '#000000' : 'rgba(0, 0, 0, 0.5)'} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'suggested' ? '#000000' : 'rgba(0, 0, 0, 0.5)' },
                ]}
              >
                {isRTL ? 'مقترحة' : 'Suggested'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Results */}
      <FlatList
        data={getDisplayData()}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  bio: {
    fontSize: 13,
    marginTop: 2,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});








