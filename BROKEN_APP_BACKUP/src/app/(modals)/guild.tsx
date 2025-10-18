import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nProvider';
import { RTLText, RTLView } from '@/app/components/primitives/primitives';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';

const mockGuildMembers = [
  {
    id: '1',
    name: 'Hassan Ahmed',
    rank: 'Guild Leader',
    level: 15,
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=100&h=100&fit=crop',
    completedJobs: 247,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Amira Farid',
    rank: 'Senior Member',
    level: 12,
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop',
    completedJobs: 189,
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Mohammed Ali',
    rank: 'Master Worker',
    level: 10,
    avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?w=100&h=100&fit=crop',
    completedJobs: 156,
    rating: 4.7,
  },
];

export default function GuildScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { t, isRTL } = useI18n();

  return (
    <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.guildHeader}>
          <View style={styles.guildBanner}>
            <View style={styles.guildIconContainer}>
              <MaterialIcons name="security" size={48} color="#BCFF31" />
              <View style={styles.guildIconGlow} />
            </View>
            <View style={styles.guildInfo}>
              <RTLText style={styles.guildName}>Professional Workers of Qatar</RTLText>
              <RTLText style={styles.guildLevel}>Guild Level 8</RTLText>
              <View style={styles.guildStats}>
                <RTLText style={styles.statText}>247 Members • 4.8★ Trust Rating</RTLText>
              </View>
            </View>
          </View>
          
          <View style={styles.guildProgress}>
            <View style={styles.progressHeader}>
              <RTLText style={styles.progressLabel}>Guild Experience Progress</RTLText>
              <Ionicons name="flash-outline" size={16} color="#F9CB40" />
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: '75%' }]} />
              <View style={styles.progressGlow} />
            </View>
            <RTLText style={styles.progressText}>7,500 / 10,000 XP to Level 9</RTLText>
          </View>
        </View>

        <View style={styles.membershipCard}>
          <View style={styles.cardGlow} />
          
          <View style={styles.membershipHeader}>
            <RTLText style={styles.membershipTitle}>Your Status</RTLText>
            <View style={styles.memberBadge}>
              <Ionicons name="crown-outline" size={14} color="#F9CB40" />
              <RTLText style={styles.memberRank}>Senior Member</RTLText>
            </View>
          </View>
          
          <View style={styles.membershipStats}>
            <View style={styles.stat}>
              <RTLText style={styles.statNumber}>89</RTLText>
              <RTLText style={styles.statLabel}>Jobs Completed</RTLText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <RTLText style={styles.statNumber}>4.8</RTLText>
              <RTLText style={styles.statLabel}>Guild Rating</RTLText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <RTLText style={styles.statNumber}>₿ 8,900</RTLText>
              <RTLText style={styles.statLabel}>Monthly Bonus</RTLText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RTLText style={styles.sectionTitle}>Guild Leadership</RTLText>
            <Ionicons name="trending-up-outline" size={20} color="#23D5AB" />
          </View>
          
          {mockGuildMembers.map((member, index) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.rankBadge}>
                <RTLText style={styles.rankNumber}>#{index + 1}</RTLText>
              </View>
              
              <TouchableOpacity
                style={styles.memberAvatarContainer}
                onPress={() => router.push(`/(modals)/wallet/${member.id}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" source={{ uri: member.avatar }} style={styles.memberAvatar} />
                <View style={styles.memberAvatarGlow} />
              </TouchableOpacity>
              
              <View style={styles.memberInfo}>
                <RTLText style={styles.memberName}>{member.name}</RTLText>
                <RTLText style={styles.memberRankText}>{member.rank}</RTLText>
                <View style={styles.memberStats}>
                  <RTLText style={styles.memberLevel}>Level {member.level}</RTLText>
                  <RTLText style={styles.memberJobs}>{member.completedJobs} jobs</RTLText>
                </View>
              </View>
              
              <View style={styles.memberRating}>
                <Ionicons name="star-outline" size={14} color="#F9CB40" fill="#F9CB40" />
                <RTLText style={styles.ratingText}>{member.rating}</RTLText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <RTLText style={styles.sectionTitle}>Guild Benefits</RTLText>
          
          <View style={styles.benefitCard}>
            <MaterialIcons name="security" size={22} color="#23D5AB" />
            <View style={styles.benefitInfo}>
              <RTLText style={styles.benefitTitle}>Priority Job Access</RTLText>
              <RTLText style={styles.benefitDesc}>Early access to high-value guild jobs</RTLText>
            </View>
          </View>
          
          <View style={styles.benefitCard}>
            <Ionicons name="crown-outline" size={22} color="#F9CB40" />
            <View style={styles.benefitInfo}>
              <RTLText style={styles.benefitTitle}>Monthly Bonus Credits</RTLText>
              <RTLText style={styles.benefitDesc}>Earn extra ₿ based on guild performance</RTLText>
            </View>
          </View>
          
          <View style={styles.benefitCard}>
            <Ionicons name="people-outline" size={22} color="#8A6DF1" />
            <View style={styles.benefitInfo}>
              <RTLText style={styles.benefitTitle}>Skill Training</RTLText>
              <RTLText style={styles.benefitDesc}>Free training sessions with guild leaders</RTLText>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.createGuildButton}
          onPress={() => router.push('/(modals)/create-guild')}
        >
          <View style={styles.buttonGlow} />
          <RTLText style={styles.createGuildText}>CREATE NEW GUILD</RTLText>
        </TouchableOpacity>

        <View style={styles.listBottom} />
      </ScrollView>

             {/* Bottom Navigation */}
       <AppBottomNavigation currentRoute="/(modals)/guild" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1320',
  },
  content: {
    flex: 1,
  },
  guildHeader: {
    backgroundColor: '#1A2136',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#23D5AB20',
  },
  guildBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 20,
  },
  guildIconContainer: {
    position: 'relative',
  },
  guildIconGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#8A6DF120',
  },
  guildInfo: {
    flex: 1,
  },
  guildName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  guildLevel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#8A6DF1',
    marginBottom: 8,
  },
  guildStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#A4B1C0',
  },
  guildProgress: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0A0F2420',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    height: '100%',
    backgroundColor: '#F9CB40',
    borderRadius: 4,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9CB40',
    opacity: 0.3,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#A4B1C0',
  },
  membershipCard: {
    backgroundColor: '#1A2136',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#23D5AB15',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#23D5AB',
    opacity: 0.3,
  },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  membershipTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9CB4020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F9CB4040',
  },
  memberRank: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: '#F9CB40',
    letterSpacing: 0.5,
  },
  membershipStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#23D5AB',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#A4B1C0',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#23D5AB20',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  memberCard: {
    backgroundColor: '#1A2136',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#23D5AB15',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8A6DF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#23D5AB40',
  },
  memberAvatarGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#23D5AB20',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  memberRankText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#8A6DF1',
    marginBottom: 4,
  },
  memberStats: {
    flexDirection: 'row',
    gap: 12,
  },
  memberLevel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#F9CB40',
  },
  memberJobs: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#A4B1C0',
  },
  memberRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#F9CB40',
  },
  benefitCard: {
    backgroundColor: '#1A2136',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#23D5AB15',
  },
  benefitInfo: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  benefitDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#A4B1C0',
    lineHeight: 16,
  },
  createGuildButton: {
    backgroundColor: '#23D5AB',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#23D5AB',
    opacity: 0.2,
    borderRadius: 16,
  },
  createGuildText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#0A0F24',
    letterSpacing: 1,
  },
     listBottom: {
     height: 100,
   },
});
