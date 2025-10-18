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
      if (activeTab === 'leaderboard') {
        const leaderboard = await guildService.getGuildLeaderboard(20);
        setGuilds(leaderboard);
      } else {
        // Load guilds for discovery (in real implementation, load from database)
        const mockGuilds: GuildData[] = [
          {
            id: '1',
            name: 'Tech Innovators',
            description: 'A guild focused on cutting-edge technology and innovation',
            category: 'Technology',
            location: 'Global',
            memberCount: 15,
            maxMembers: 20,
            guildRank: 'B',
            totalJobs: 45,
            successRate: 92,
            totalEarnings: 25000,
            isPublic: true,
            requiresApproval: false,
            guildMasterName: 'Ahmed Al-Rashid'
          },
          {
            id: '2',
            name: 'Creative Designers',
            description: 'Professional design guild specializing in UI/UX and branding',
            category: 'Design',
            location: 'Middle East',
            memberCount: 8,
            maxMembers: 12,
            guildRank: 'C',
            totalJobs: 28,
            successRate: 88,
            totalEarnings: 18000,
            isPublic: true,
            requiresApproval: true,
            guildMasterName: 'Sarah Johnson'
          }
        ];

        // Filter based on search
        const filteredGuilds = searchQuery
          ? mockGuilds.filter(guild =>
              guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              guild.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : mockGuilds;

        setGuilds(filteredGuilds);
      }
    } catch (error) {
      console.error('Error loading guilds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserGuild = async () => {
    if (!user?.uid) return;

    try {
      // In real implementation, check if user is member of any guild
      setUserGuild(null); // Placeholder
    } catch (error) {
      console.error('Error loading user guild:', error);
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
          <Users size={16} color={theme.primary} />
          <Text style={[styles.statText, { color: theme.primary }]}>
            {item.memberCount}/{item.maxMembers}
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: theme.success + '15' }]}>
          <Star size={16} color={theme.success} />
          <Text style={[styles.statText, { color: theme.success }]}>
            {item.successRate}%
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: theme.secondary + '15' }]}>
          <Crown size={16} color={theme.secondary} />
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
    topBar: { paddingTop: top + 8, paddingBottom: 12, paddingHorizontal: 18, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandText: { color: theme.buttonText, fontSize: 24, fontWeight: '900', letterSpacing: 1.1, fontFamily: FONT_FAMILY },
    squareBtn: { width: 40, height: 40, backgroundColor: theme.buttonText, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

    header: { backgroundColor: theme.primary, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, borderBottomLeftRadius: 26 },
    title: { color: theme.buttonText, fontSize: 28, fontWeight: '900', fontFamily: FONT_FAMILY },
    sub: { color: theme.buttonText, opacity: 0.9, fontSize: 13, fontFamily: FONT_FAMILY },

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
      textAlign: isRTL ? 'right' : 'left'
    },

    tabs: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    tabsContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
      gap: 8,
    },
    tabText: {
      fontSize: 14,
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
      fontSize: 16,
      marginTop: 16,
      color: theme.textSecondary,
    },
    guildsList: {
      padding: 16,
    },
    guildCard: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    guildHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    guildInfo: {
      flex: 1,
    },
    guildName: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    guildDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    rankBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    rankText: {
      fontSize: 12,
      fontWeight: '700',
    },
    guildStats: {
      gap: 8,
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    statText: {
      fontSize: 12,
      fontWeight: '600',
    },
    guildFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    guildMeta: {
      gap: 8,
    },
    guildCategory: {
      fontSize: 12,
      fontWeight: '500',
    },
    guildLocation: {
      fontSize: 12,
    },
    publicBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    publicText: {
      fontSize: 12,
      fontWeight: '600',
    },
    privateBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    privateText: {
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginTop: 16,
      color: theme.textPrimary,
    },
    emptyText: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 40,
      color: theme.textSecondary,
    },
    emptyButton: {
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: theme.primary,
    },
    emptyButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.buttonText,
    },
    fab: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.primary,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.primary} />

      <View style={styles.topBar}>
        <View style={styles.brand}>
          <ShieldCheck size={22} color={theme.buttonText} />
          <Text style={styles.brandText}>{isRTL ? 'النقابات' : 'Guilds'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={goMap} style={styles.squareBtn}>
            <Map size={18} color={theme.primary} />
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
        <Search size={20} color={theme.textSecondary} />
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
                size={16}
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
          <FlatList
            data={guilds}
            renderItem={renderGuildCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.guildsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Users size={64} color={theme.textSecondary} />
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
                    onPress={() => setActiveTab('create')}
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

      {/* Floating Action Button (Create Guild) */}
      {activeTab === 'discover' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setActiveTab('create')}
        >
          <Plus size={24} color={theme.buttonText} />
        </TouchableOpacity>
      )}

      <AppBottomNavigation currentRoute="/guilds" />
    </View>
  );
}
