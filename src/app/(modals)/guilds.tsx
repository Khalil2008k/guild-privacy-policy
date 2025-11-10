import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  StatusBar,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Plus, Crown, Users, Star, ShieldCheck, Map } from 'lucide-react-native';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';
import { useI18n } from '@/contexts/I18nProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { guildService } from '@/services/firebase/GuildService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';
// ✅ TASK 14: iPad responsive layout components
import { ResponsiveFlatList } from '@/components/ResponsiveFlatList';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useResponsive } from '@/utils/responsive';

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

interface GuildData {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  memberCount: number;
  maxMembers: number;
  guildRank: string;
  totalJobs: number;
  successRate: number;
  totalEarnings: number;
  isPublic: boolean;
  requiresApproval: boolean;
  guildMasterName?: string;
}

type TabType = 'discover' | 'my-guild' | 'leaderboard' | 'create';

export default function Guilds() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const goBack = useCallback(() => router.back(), []);
  const goMap = useCallback(() => router.push('/(modals)/guild-map'), []);
  // ✅ TASK 14: Get responsive dimensions for iPad layout
  const { isTablet, isLargeDevice, deviceType } = useResponsive();

  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [guilds, setGuilds] = useState<GuildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userGuild, setUserGuild] = useState<GuildData | null>(null);

  const { theme, isDarkMode } = useTheme();
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);

  useEffect(() => {
    loadGuilds();
    loadUserGuild();
  }, [activeTab]);

  const loadGuilds = async () => {
    setLoading(true);
    try {
      // Leaderboard view: prefer high successRate and totalJobs
      if (activeTab === 'leaderboard') {
        const list = await guildService.searchGuilds('');
        const ranked = [...list].sort((a, b) => {
          // Rank by successRate desc, then totalJobs desc
          const bySuccess = (b.successRate || 0) - (a.successRate || 0);
          if (bySuccess !== 0) return bySuccess;
          return (b.totalJobs || 0) - (a.totalJobs || 0);
        });
        setGuilds(ranked.slice(0, 50) as any);
        return;
      }

      // Discover/My Guilds: live query (backend first, Firebase fallback in service)
      const discovered = await guildService.searchGuilds(searchQuery || '');
      setGuilds(discovered as any);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading guilds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserGuild = async () => {
    if (!user?.uid) return;
    try {
      const myGuilds = await guildService.getUserGuilds(user.uid);
      setUserGuild(myGuilds && myGuilds.length > 0 ? (myGuilds[0] as any) : null);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading user guild:', error);
    }
  };
  
  const renderRankBadge = (rank: string) => {
    const rankColors = {
      'SSS': '#FFD700', 'SS': '#C0C0C0', 'S': '#CD7F32',
      'A': '#FF6B6B', 'B': '#4ECDC4', 'C': '#45B7D1',
      'D': '#96CEB4', 'E': '#FFEAA7', 'F': '#DDA0DD', 'G': '#98D8C8'
    };

    return (
      <View style={[styles.rankBadge, { backgroundColor: rankColors[rank as keyof typeof rankColors] || theme.border }]}>
        <Text style={[styles.rankText, { color: adaptiveColors.primaryText }]}>{rank}</Text>
      </View>
    );
  };

  const renderGuildCard = ({ item }: { item: GuildData }) => (
    <TouchableOpacity
      style={[styles.guildCard, { backgroundColor: adaptiveColors.cardBackground, borderColor: adaptiveColors.cardBorder }]}
      onPress={() => router.push(`/(modals)/guild/${item.id}`)}
    >
      <View style={styles.guildHeader}>
        <View style={styles.guildInfo}>
          <Text style={[styles.guildName, { color: adaptiveColors.primaryText }]}>{item.name}</Text>
          <Text style={[styles.guildDescription, { color: adaptiveColors.secondaryText }]}>
            {item.description}
          </Text>
        </View>
        {renderRankBadge(item.guildRank)}
      </View>

      <View style={[styles.guildStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.statItem, { backgroundColor: theme.primary + '15' }]}>
          <Users size={14.08} color={theme.primary} />
          <Text style={[styles.statText, { color: theme.primary }]}>
            {item.memberCount}/{item.maxMembers}
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: theme.success + '15' }]}>
          <Star size={14.08} color={theme.success} />
          <Text style={[styles.statText, { color: theme.success }]}>
            {item.successRate}%
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: theme.secondary + '15' }]}>
          <Crown size={14.08} color={theme.secondary} />
          <Text style={[styles.statText, { color: theme.secondary }]}>
            {item.totalJobs} jobs
          </Text>
        </View>
      </View>

      <View style={styles.guildFooter}>
        <View style={[styles.guildMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.guildCategory, { color: adaptiveColors.secondaryText }]}>
            {item.category}
          </Text>
          <Text style={[styles.guildLocation, { color: adaptiveColors.secondaryText }]}>
            {item.location}
          </Text>
        </View>

        {item.isPublic ? (
          <View style={[styles.publicBadge, { backgroundColor: theme.success + '20' }]}>
            <Text style={[styles.publicText, { color: theme.success }]}>
              {isRTL ? 'عام' : 'Public'}
            </Text>
          </View>
        ) : (
          <View style={[styles.privateBadge, { backgroundColor: theme.warning + '20' }]}>
            <Text style={[styles.privateText, { color: theme.warning }]}>
              {isRTL ? 'خاص' : 'Private'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const tabs = [
    { key: 'discover', label: isRTL ? 'اكتشف' : 'Discover', icon: Search },
    { key: 'my-guild', label: isRTL ? 'نقابتي' : 'My Guild', icon: Users },
    { key: 'leaderboard', label: isRTL ? 'المتصدرون' : 'Leaderboard', icon: Crown },
    { key: 'create', label: isRTL ? 'إنشاء' : 'Create', icon: Plus },
  ];

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    topBar: { paddingTop: top + 7.04, paddingBottom: 10.56, paddingHorizontal: 15.84, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 7.04 },
    brandText: { color: theme.buttonText, fontSize: 21.12, fontWeight: '900', letterSpacing: 0.968, fontFamily: FONT_FAMILY },
    squareBtn: { width: 42.24, height: 42.24, backgroundColor: theme.buttonText, borderRadius: 12.672, alignItems: 'center', justifyContent: 'center', marginLeft: 7.04 }, // 35.2 * 1.2 = 42.24, 10.56 * 1.2 = 12.672 (20% increase)

    header: { backgroundColor: theme.primary, paddingHorizontal: 15.84, paddingTop: 8.8, paddingBottom: 14.08, borderBottomLeftRadius: 22.88 },
    title: { color: theme.buttonText, fontSize: 24.64, fontWeight: '900', fontFamily: FONT_FAMILY },
    sub: { color: theme.buttonText, opacity: 0.9, fontSize: 11.44, fontFamily: FONT_FAMILY },

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 14.08,
      paddingHorizontal: 14.08,
      paddingVertical: 4.73088, // 5.9136 * 0.8 = 4.73088 (20% reduction from previous)
      borderRadius: 10.56,
      borderWidth: 0.88,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      gap: 10.56,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1.76 },
      shadowOpacity: 0.08,
      shadowRadius: 7.04,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      fontSize: 14.08,
      color: theme.textPrimary,
      textAlign: isRTL ? 'right' : 'left'
    },

    tabs: {
      borderBottomWidth: 0.88,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    tabsContent: {
      paddingHorizontal: 14.08,
      gap: 10.56,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16.896, // 14.08 * 1.2 = 16.896 (20% increase)
      paddingVertical: 12.672, // 10.56 * 1.2 = 12.672 (20% increase)
      borderRadius: 8.448, // 7.04 * 1.2 = 8.448 (20% increase)
      borderWidth: 0.88,
      borderColor: 'transparent',
      gap: 7.04,
    },
    tabText: {
      fontSize: 12.32,
      fontWeight: '600',
    },

    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14.08,
      marginTop: 14.08,
      color: theme.textSecondary,
    },
    guildsList: {
      padding: 14.08,
    },
    guildCard: {
      marginBottom: 14.08,
      padding: 14.08,
      borderRadius: 10.56,
      borderWidth: 0.88,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1.76 },
      shadowOpacity: 0.1,
      shadowRadius: 7.04,
      elevation: 4,
    },
    guildHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10.56,
    },
    guildInfo: {
      flex: 1,
    },
    guildName: {
      fontSize: 15.84,
      fontWeight: '700',
      marginBottom: 3.52,
    },
    guildDescription: {
      fontSize: 12.32,
      lineHeight: 17.6,
    },
    rankBadge: {
      paddingHorizontal: 7.04,
      paddingVertical: 3.52,
      borderRadius: 7.04,
    },
    rankText: {
      fontSize: 10.56,
      fontWeight: '700',
    },
    guildStats: {
      gap: 7.04,
      marginBottom: 10.56,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7.04,
      paddingVertical: 3.52,
      borderRadius: 5.28,
      gap: 3.52,
    },
    statText: {
      fontSize: 10.56,
      fontWeight: '600',
    },
    guildFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    guildMeta: {
      gap: 7.04,
    },
    guildCategory: {
      fontSize: 10.56,
      fontWeight: '500',
    },
    guildLocation: {
      fontSize: 10.56,
    },
    publicBadge: {
      paddingHorizontal: 7.04,
      paddingVertical: 3.52,
      borderRadius: 5.28,
    },
    publicText: {
      fontSize: 10.56,
      fontWeight: '600',
    },
    privateBadge: {
      paddingHorizontal: 7.04,
      paddingVertical: 3.52,
      borderRadius: 5.28,
    },
    privateText: {
      fontSize: 10.56,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 52.8,
    },
    emptyTitle: {
      fontSize: 17.6,
      fontWeight: '700',
      marginTop: 14.08,
      color: theme.textPrimary,
    },
    emptyText: {
      fontSize: 12.32,
      marginTop: 7.04,
      textAlign: 'center',
      paddingHorizontal: 35.2,
      color: theme.textSecondary,
    },
    emptyButton: {
      marginTop: 21.12,
      paddingVertical: 12.672, // 10.56 * 1.2 = 12.672 (20% increase)
      paddingHorizontal: 25.344, // 21.12 * 1.2 = 25.344 (20% increase)
      borderRadius: 12.672, // 10.56 * 1.2 = 12.672 (20% increase)
      backgroundColor: theme.primary,
    },
    emptyButtonText: {
      fontSize: 16.896, // 14.08 * 1.2 = 16.896 (20% increase)
      fontWeight: '700',
      color: theme.buttonText,
    },
    fab: {
      position: 'absolute',
      bottom: 88,
      right: 17.6,
      width: 59.136, // 49.28 * 1.2 = 59.136 (20% increase)
      height: 59.136, // 49.28 * 1.2 = 59.136 (20% increase)
      borderRadius: 29.568, // 24.64 * 1.2 = 29.568 (20% increase)
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.primary,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3.52 },
      shadowOpacity: 0.3,
      shadowRadius: 7.04,
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.primary} />

      <View style={styles.topBar}>
        <View style={styles.brand}>
          <ShieldCheck size={19.36} color={theme.buttonText} />
          <Text style={styles.brandText}>{isRTL ? 'النقابات' : 'Guilds'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={goMap} style={styles.squareBtn}>
            <Map size={15.84} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>
          {activeTab === 'discover' && (isRTL ? 'اكتشف النقابات' : 'Discover Guilds')}
          {activeTab === 'my-guild' && (isRTL ? 'نقابتي' : 'My Guild')}
          {activeTab === 'leaderboard' && (isRTL ? 'المتصدرون' : 'Leaderboard')}
          {activeTab === 'create' && (isRTL ? 'إنشاء نقابة' : 'Create Guild')}
        </Text>
        <Text style={styles.sub}>
          {activeTab === 'discover' && (isRTL ? 'انضم إلى مجموعات موثوقة لتنمية شبكتك' : 'Join trusted groups to grow your network')}
          {activeTab === 'my-guild' && (isRTL ? 'إدارة نقابتك وأعضائها' : 'Manage your guild and members')}
          {activeTab === 'leaderboard' && (isRTL ? 'تصنيف أفضل النقابات' : 'Top performing guilds')}
          {activeTab === 'create' && (isRTL ? 'أنشئ نقابة جديدة' : 'Create a new guild')}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={17.6} color={theme.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={isRTL ? 'البحث عن نقابات...' : 'Search guilds...'}
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                activeTab === tab.key && {
                  backgroundColor: theme.primary + '20',
                  borderColor: theme.primary,
                },
              ]}
            >
              <tab.icon
                size={14.08}
                color={activeTab === tab.key ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.key ? theme.primary : theme.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>
              {isRTL ? 'جارٍ التحميل...' : 'Loading guilds...'}
            </Text>
          </View>
        ) : (
          <ResponsiveFlatList
            data={guilds}
            renderItem={renderGuildCard}
            keyExtractor={(item) => item.id}
            minColumns={1}
            maxColumns={3}
            itemSpacing={16}
            contentContainerStyle={styles.guildsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Users size={56.32} color={theme.textSecondary} />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'discover' && (isRTL ? 'لا توجد نقابات' : 'No Guilds Found')}
                  {activeTab === 'my-guild' && (isRTL ? 'ليس لديك نقابة' : 'No Guild Membership')}
                  {activeTab === 'leaderboard' && (isRTL ? 'لا توجد بيانات' : 'No Data Available')}
                  {activeTab === 'create' && (isRTL ? 'إنشاء نقابة جديدة' : 'Create New Guild')}
                </Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'discover' && (isRTL ? 'لا توجد نقابات متاحة حالياً' : 'No guilds available right now')}
                  {activeTab === 'my-guild' && (isRTL ? 'انضم إلى نقابة أو أنشئ واحدة جديدة' : 'Join a guild or create a new one')}
                  {activeTab === 'leaderboard' && (isRTL ? 'لا توجد بيانات تصنيف متاحة' : 'No ranking data available')}
                  {activeTab === 'create' && (isRTL ? 'املأ النموذج أدناه لإنشاء نقابة' : 'Fill the form below to create a guild')}
                </Text>
                {activeTab === 'discover' && (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => router.push('/(modals)/guild-creation-rules')}
                  >
                    <Text style={styles.emptyButtonText}>
                      {isRTL ? 'إنشاء نقابة' : 'Create Guild'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </View>

      <AppBottomNavigation currentRoute="/guilds" />
    </View>
  );
}
