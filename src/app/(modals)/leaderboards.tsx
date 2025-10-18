import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Star,
  Crown,
  Target,
  Zap,
  Briefcase,
  RefreshCw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BackendAnalyticsService } from '../../config/backend';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

// Helper function to get Lucide icon component
const getLucideTabIcon = (iconName: string, color: string, size: number = 18) => {
  const iconProps = { size, color };
  
  switch(iconName) {
    case 'person':
      return <Users {...iconProps} />;
    case 'people':
      return <Users {...iconProps} />;
    case 'code-slash':
    case 'code':
      return <Target {...iconProps} />;
    default:
      return <Trophy {...iconProps} />;
  }
};

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  rank: string;
  score: number;
  earnings: number;
  completedJobs: number;
  rating: number;
  guildName?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardGuild {
  id: string;
  name: string;
  logo?: string;
  members: number;
  totalEarnings: number;
  averageRating: number;
  completedProjects: number;
  rank: number;
}

export default function LeaderboardsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const [selectedTab, setSelectedTab] = useState<'users' | 'guilds' | 'skills'>('users');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [leaderboardData, setLeaderboardData] = useState<{
    users: LeaderboardUser[];
    guilds: LeaderboardGuild[];
    skills: LeaderboardSkill[];
  }>({ users: [], guilds: [], skills: [] });
  const [loading, setLoading] = useState(true);

  // Load leaderboard data from backend
  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        setLoading(true);
        const endDate = new Date().toISOString();
        const startDate = selectedPeriod === 'week' 
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          : selectedPeriod === 'month'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(0).toISOString(); // All time

        const analytics = await BackendAnalyticsService.getPlatformAnalytics(startDate, endDate);
        
        if (analytics && analytics.leaderboards) {
          setLeaderboardData({
            users: analytics.leaderboards.users || mockTopUsers,
            guilds: analytics.leaderboards.guilds || mockTopGuilds,
            skills: analytics.leaderboards.skills || mockTopSkills
          });
        } else {
          // Fallback to mock data
          setLeaderboardData({
            users: mockTopUsers,
            guilds: mockTopGuilds,
            skills: mockTopSkills
          });
        }
      } catch (error) {
        console.log('Backend not available, using mock data:', error);
        setLeaderboardData({
          users: mockTopUsers,
          guilds: mockTopGuilds,
          skills: mockTopSkills
        });
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboards();
  }, [selectedTab, selectedPeriod]);

  // Mock leaderboard data (fallback)
  const mockTopUsers: LeaderboardUser[] = [
    {
      id: '1',
      name: 'Ahmed Al-Rashid',
      avatar: 'https://i.pravatar.cc/150?img=1',
      rank: 'SSS',
      score: 9850,
      earnings: 125400,
      completedJobs: 47,
      rating: 4.9,
      guildName: 'Elite Developers',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=2',
      rank: 'SS',
      score: 9720,
      earnings: 118200,
      completedJobs: 42,
      rating: 4.8,
      guildName: 'Design Masters',
    },
    {
      id: '3',
      name: 'Omar Hassan',
      avatar: 'https://i.pravatar.cc/150?img=3',
      rank: 'SS',
      score: 9680,
      earnings: 115800,
      completedJobs: 39,
      rating: 4.9,
      guildName: 'Tech Innovators',
    },
    {
      id: '4',
      name: 'Fatima Al-Zahra',
      avatar: 'https://i.pravatar.cc/150?img=4',
      rank: 'S',
      score: 9420,
      earnings: 98600,
      completedJobs: 35,
      rating: 4.7,
      guildName: 'Creative Guild',
    },
    {
      id: '5',
      name: 'Mike Chen',
      avatar: 'https://i.pravatar.cc/150?img=5',
      rank: 'S',
      score: 9380,
      earnings: 95200,
      completedJobs: 33,
      rating: 4.8,
      guildName: 'Code Warriors',
      isCurrentUser: true,
    },
  ];

  const mockTopGuilds: LeaderboardGuild[] = [
    {
      id: '1',
      name: 'Elite Developers',
      logo: 'https://i.pravatar.cc/150?img=10',
      members: 25,
      totalEarnings: 2450000,
      averageRating: 4.9,
      completedProjects: 156,
      rank: 1,
    },
    {
      id: '2',
      name: 'Design Masters',
      logo: 'https://i.pravatar.cc/150?img=11',
      members: 18,
      totalEarnings: 1980000,
      averageRating: 4.8,
      completedProjects: 134,
      rank: 2,
    },
    {
      id: '3',
      name: 'Tech Innovators',
      logo: 'https://i.pravatar.cc/150?img=12',
      members: 22,
      totalEarnings: 1850000,
      averageRating: 4.7,
      completedProjects: 128,
      rank: 3,
    },
  ];

  const mockTopSkills = [
    {
      skill: 'React Native',
      leaders: [
        { name: 'Ahmed Al-Rashid', score: 9850, earnings: 45600 },
        { name: 'Sarah Johnson', score: 9720, earnings: 42300 },
        { name: 'Mike Chen', score: 9380, earnings: 38900 },
      ]
    },
    {
      skill: 'UI/UX Design',
      leaders: [
        { name: 'Fatima Al-Zahra', score: 9650, earnings: 38200 },
        { name: 'Sarah Johnson', score: 9420, earnings: 35800 },
        { name: 'Lisa Park', score: 9180, earnings: 32400 },
      ]
    },
    {
      skill: 'Node.js',
      leaders: [
        { name: 'Omar Hassan', score: 9480, earnings: 41200 },
        { name: 'Ahmed Al-Rashid', score: 9320, earnings: 39600 },
        { name: 'David Kim', score: 9150, earnings: 36800 },
      ]
    },
  ];

  const periods = [
    { key: 'week', label: isRTL ? 'هذا الأسبوع' : 'This Week' },
    { key: 'month', label: isRTL ? 'هذا الشهر' : 'This Month' },
    { key: 'all', label: isRTL ? 'كل الأوقات' : 'All Time' },
  ];

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'SSS': return '#FFD700';
      case 'SS': return '#C0C0C0';
      case 'S': return '#CD7F32';
      case 'A': return theme.primary;
      case 'B': return theme.info;
      default: return theme.textSecondary;
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  const renderUserLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      {/* Top 3 Podium */}
      <View style={[styles.podiumContainer, { backgroundColor: adaptiveColors.cardBackground, borderColor: adaptiveColors.cardBorder }]}>
        <Text style={[styles.podiumTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'أفضل 3 مستقلين' : 'Top 3 Freelancers'}
        </Text>
        
        <View style={styles.podium}>
          {/* Second Place */}
          {topUsers[1] && (
            <View style={[styles.podiumPosition, styles.secondPlace]}>
              <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.podiumRankText}>2</Text>
              </View>
              <Image source={{ uri: topUsers[1].avatar }} style={styles.podiumAvatar} />
              <Text style={[styles.podiumName, { color: theme.textPrimary }]} numberOfLines={1}>
                {topUsers[1].name}
              </Text>
              <Text style={[styles.podiumScore, { color: theme.primary }]}>
                {topUsers[1].score.toLocaleString()}
              </Text>
            </View>
          )}

          {/* First Place */}
          {topUsers[0] && (
            <View style={[styles.podiumPosition, styles.firstPlace]}>
              <View style={[styles.podiumRank, { backgroundColor: '#FFD700' }]}>
                <Trophy size={20} color="#000000" />
              </View>
              <Image source={{ uri: topUsers[0].avatar }} style={[styles.podiumAvatar, styles.firstPlaceAvatar]} />
              <Text style={[styles.podiumName, { color: theme.textPrimary }]} numberOfLines={1}>
                {topUsers[0].name}
              </Text>
              <Text style={[styles.podiumScore, { color: theme.primary }]}>
                {topUsers[0].score.toLocaleString()}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: getRankColor(topUsers[0].rank) }]}>
                <Text style={[styles.rankText, { color: '#000000' }]}>{topUsers[0].rank}</Text>
              </View>
            </View>
          )}

          {/* Third Place */}
          {topUsers[2] && (
            <View style={[styles.podiumPosition, styles.thirdPlace]}>
              <View style={[styles.podiumRank, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.podiumRankText}>3</Text>
              </View>
              <Image source={{ uri: topUsers[2].avatar }} style={styles.podiumAvatar} />
              <Text style={[styles.podiumName, { color: theme.textPrimary }]} numberOfLines={1}>
                {topUsers[2].name}
              </Text>
              <Text style={[styles.podiumScore, { color: theme.primary }]}>
                {topUsers[2].score.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Full Rankings */}
      <View style={[styles.rankingsContainer, { backgroundColor: adaptiveColors.cardBackground, borderColor: adaptiveColors.cardBorder }]}>
        <Text style={[styles.rankingsTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'التصنيف الكامل' : 'Full Rankings'}
        </Text>
        
        {(leaderboardData.users.length > 0 ? leaderboardData.users : mockTopUsers).map((user, index) => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.userRankItem,
              { 
                backgroundColor: user.isCurrentUser ? theme.primary + '10' : theme.background,
                borderColor: user.isCurrentUser ? theme.primary : theme.border,
                borderWidth: user.isCurrentUser ? 2 : 1,
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              console.log('View user profile:', user.id);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.userRankLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.userPosition, { color: theme.textPrimary }]}>
                {getRankIcon(index + 1)}
              </Text>
              <Image source={{ uri: user.avatar }} style={[styles.userAvatar, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]} />
              <View style={[styles.userInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {user.name}
                  {user.isCurrentUser && (
                    <Text style={[styles.youLabel, { color: theme.primary }]}> (You)</Text>
                  )}
                </Text>
                <Text style={[styles.userGuild, { color: theme.textSecondary }]} numberOfLines={1}>
                  {user.guildName}
                </Text>
              </View>
            </View>
            
            <View style={[styles.userRankRight, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
              <View style={[styles.userRankBadge, { backgroundColor: getRankColor(user.rank) }]}>
                <Text style={[styles.userRankText, { color: '#000000' }]}>{user.rank}</Text>
              </View>
              <Text style={[styles.userScore, { color: theme.primary }]}>
                {user.score.toLocaleString()}
              </Text>
              <View style={[styles.userStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.userStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Star size={12} color={theme.warning} />
                  <Text style={[styles.userStatText, { color: theme.textSecondary, marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }]}>
                    {user.rating}
                  </Text>
                </View>
                <View style={[styles.userStat, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Briefcase size={12} color={theme.info} />
                  <Text style={[styles.userStatText, { color: theme.textSecondary, marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }]}>
                    {user.completedJobs}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGuildLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      {(leaderboardData.guilds.length > 0 ? leaderboardData.guilds : mockTopGuilds).map((guild, index) => (
        <TouchableOpacity
          key={guild.id}
          style={[
            styles.guildRankItem,
            { backgroundColor: theme.surface, borderColor: theme.border }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log('View guild:', guild.id);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.guildRankLeft}>
            <View style={[
              styles.guildPosition,
              { 
                backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
              }
            ]}>
              <Text style={[styles.guildPositionText, { color: '#000000' }]}>
                {index + 1}
              </Text>
            </View>
            <Image source={{ uri: guild.logo }} style={styles.guildLogo} />
            <View style={styles.guildInfo}>
              <Text style={[styles.guildName, { color: theme.textPrimary }]} numberOfLines={1}>
                {guild.name}
              </Text>
              <Text style={[styles.guildMembers, { color: theme.textSecondary }]}>
                {guild.members} {isRTL ? 'عضو' : 'members'}
              </Text>
            </View>
          </View>
          
          <View style={styles.guildRankRight}>
            <Text style={[styles.guildEarnings, { color: theme.primary }]}>
              QR {(guild.totalEarnings / 1000).toFixed(0)}K
            </Text>
            <View style={styles.guildStats}>
              <View style={styles.guildStat}>
                <Star size={12} color={theme.warning} />
                <Text style={[styles.guildStatText, { color: theme.textSecondary }]}>
                  {guild.averageRating}
                </Text>
              </View>
              <View style={styles.guildStat}>
                <Briefcase size={12} color={theme.info} />
                <Text style={[styles.guildStatText, { color: theme.textSecondary }]}>
                  {guild.completedProjects}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSkillLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      {(leaderboardData.skills.length > 0 ? leaderboardData.skills : mockTopSkills).map((skillData, skillIndex) => (
        <View
          key={skillIndex}
          style={[styles.skillSection, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.skillTitle, { color: theme.textPrimary }]}>
            {skillData.skill}
          </Text>
          
          {skillData.leaders.map((leader, index) => (
            <View key={index} style={styles.skillLeaderItem}>
              <View style={styles.skillLeaderLeft}>
                <Text style={[styles.skillPosition, { color: theme.textPrimary }]}>
                  {getRankIcon(index + 1)}
                </Text>
                <Text style={[styles.skillLeaderName, { color: theme.textPrimary }]}>
                  {leader.name}
                </Text>
              </View>
              <View style={styles.skillLeaderRight}>
                <Text style={[styles.skillScore, { color: theme.primary }]}>
                  {leader.score.toLocaleString()}
                </Text>
                <Text style={[styles.skillEarnings, { color: theme.textSecondary }]}>
                  QR {leader.earnings.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'CC']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: '#000000' }]}>
            {isRTL ? 'لوحة المتصدرين' : 'Leaderboards'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: '#000000CC' }]}>
            {isRTL ? 'تنافس مع الأفضل' : 'Compete with the best'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log('Refresh leaderboards');
          }}
          activeOpacity={0.7}
        >
          <RefreshCw size={24} color="#000000" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Period Selector */}
      <View style={[styles.periodContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.key ? theme.primary : 'transparent',
                  borderColor: selectedPeriod === period.key ? theme.primary : theme.border,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPeriod(period.key as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.periodText,
                { color: selectedPeriod === period.key ? '#000000' : theme.textSecondary }
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {[
          { key: 'users', label: isRTL ? 'المستقلين' : 'Freelancers', icon: 'person' },
          { key: 'guilds', label: isRTL ? 'النقابات' : 'Guilds', icon: 'people' },
          { key: 'skills', label: isRTL ? 'المهارات' : 'Skills', icon: 'code-slash' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && { backgroundColor: theme.primary }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTab(tab.key as any);
            }}
            activeOpacity={0.7}
          >
            {getLucideTabIcon(
              tab.icon,
              selectedTab === tab.key ? '#000000' : theme.textSecondary,
              18
            )}
            <Text style={[
              styles.tabText,
              { color: selectedTab === tab.key ? '#000000' : theme.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedTab === 'users' && renderUserLeaderboard()}
        {selectedTab === 'guilds' && renderGuildLeaderboard()}
        {selectedTab === 'skills' && renderSkillLeaderboard()}
        
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  periodScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  leaderboardContainer: {
    gap: 20,
  },
  // Podium styles
  podiumContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  podiumTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
  },
  podiumPosition: {
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: {
    marginBottom: 0,
  },
  secondPlace: {
    marginBottom: 20,
  },
  thirdPlace: {
    marginBottom: 10,
  },
  podiumRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumRankText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  firstPlaceAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  podiumName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumScore: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  rankText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
  },
  // Rankings styles
  rankingsContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  rankingsTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  userRankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userPosition: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  youLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  userGuild: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  userRankRight: {
    alignItems: 'flex-end',
  },
  userRankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  userRankText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
  },
  userScore: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStatText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  // Guild styles
  guildRankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  guildRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guildPosition: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guildPositionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
  guildLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  guildInfo: {
    flex: 1,
  },
  guildName: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  guildMembers: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  guildRankRight: {
    alignItems: 'flex-end',
  },
  guildEarnings: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  guildStats: {
    flexDirection: 'row',
    gap: 12,
  },
  guildStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guildStatText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  // Skill styles
  skillSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  skillTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  skillLeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  skillLeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skillPosition: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    width: 30,
  },
  skillLeaderName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  skillLeaderRight: {
    alignItems: 'flex-end',
  },
  skillScore: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  skillEarnings: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
});
