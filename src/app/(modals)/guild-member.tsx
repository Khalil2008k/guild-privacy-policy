import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { getAdaptiveTextColor } from '../../utils/colorUtils';
import { useGuildJobs } from '../../contexts/GuildJobContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Users, Briefcase, Award, TrendingUp, Star, DollarSign } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ModalHeader from '../components/ModalHeader';
import * as Haptics from 'expo-haptics';
import { Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function GuildMemberScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { userGuildStatus, currentGuild, currentMembership } = useGuild();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };
  const { 
    guildJobs, 
    activeContracts, 
    guildVault, 
    workshops, 
    voteOnContract,
    registerForWorkshop,
    getMemberSkillProgress,
    refreshGuildJobData 
  } = useGuildJobs();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'jobs' | 'contracts' | 'workshops' | 'progress'>('jobs');
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Optimized entrance animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300, // Reduced from 600ms
        easing: Easing.out(Easing.quad), // More efficient easing
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300, // Reduced from 600ms
        easing: Easing.out(Easing.quad), // Simplified easing
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250, // Reduced from 500ms
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTabPress = (tabKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tabKey as any);
  };

  const handleActionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const memberSkillProgress = getMemberSkillProgress('current_user');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshGuildJobData();
    setRefreshing(false);
  };

  // Get member's assigned jobs
  const memberJobs = guildJobs.filter(job => 
    job.assignedMembers.includes('current_user') || job.applicants.includes('current_user')
  );

  // Get contracts member can vote on
  const memberContracts = activeContracts.filter(contract => 
    contract.memberVotes.hasOwnProperty('current_user')
  );

  // Get available workshops
  const availableWorkshops = workshops.filter(workshop => 
    workshop.fundingStatus === 'funded' && 
    !workshop.registeredMembers.includes('current_user')
  );

  const registeredWorkshops = workshops.filter(workshop => 
    workshop.registeredMembers.includes('current_user')
  );

  const handleVoteOnContract = async (contractId: string, vote: 'accept' | 'reject') => {
    try {
      await voteOnContract(contractId, 'current_user', vote);
      CustomAlertService.showError(
        t('success'),
        vote === 'accept' 
          ? 'Contract accepted successfully!' 
          : 'Contract rejected successfully!'
      );
    } catch (error) {
      CustomAlertService.showError(t('error'), 'Failed to vote on contract');
    }
  };

  const handleRegisterForWorkshop = async (workshopId: string) => {
    try {
      await registerForWorkshop(workshopId, 'current_user');
      CustomAlertService.showSuccess(t('success'), 'Successfully registered for workshop!');
    } catch (error) {
      CustomAlertService.showError(t('error'), 'Failed to register for workshop');
    }
  };

  const handleReportIssue = () => {
    CustomAlertService.showConfirmation(
      'Report Issue to Admin',
      'This will send a report to the app administrators. Please describe your concern:',
      () => {
        // In real app, this would open a form or send to admin system
        CustomAlertService.showSuccess('Report Sent', 'Your report has been sent to the administrators.');
      },
      undefined,
      isRTL
    );
  };

  const renderMemberInfo = () => (
    <View style={[styles.memberInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <LinearGradient
        colors={[theme.primary + '20', theme.primary + '10']}
        style={styles.memberInfoGradient}
      >
        <View style={styles.memberInfoHeader}>
          <MaterialIcons name="person" size={24} color={theme.primary} />
          <Text style={[styles.memberInfoTitle, { color: theme.textPrimary }]}>
            Member Information
          </Text>
        </View>
        
        <View style={styles.memberInfoContent}>
          <View style={styles.memberInfoRow}>
            <Text style={[styles.memberInfoLabel, { color: theme.textSecondary }]}>
              Guild:
            </Text>
            <Text style={[styles.memberInfoValue, { color: theme.textPrimary }]}>
              {currentGuild?.name || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.memberInfoRow}>
            <Text style={[styles.memberInfoLabel, { color: theme.textSecondary }]}>
              Role:
            </Text>
            <Text style={[styles.memberInfoValue, { color: theme.primary }]}>
              {userGuildStatus.guild?.roleDisplayText || 'Member'}
            </Text>
          </View>
          
          {currentMembership?.level && (
            <View style={styles.memberInfoRow}>
              <Text style={[styles.memberInfoLabel, { color: theme.textSecondary }]}>
                Member Level:
              </Text>
              <View style={styles.levelBadge}>
                <Text style={[styles.levelBadgeText, { color: theme.buttonText }]}>
                  Level {currentMembership.level}
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.memberInfoRow}>
            <Text style={[styles.memberInfoLabel, { color: theme.textSecondary }]}>
              Tasks Completed:
            </Text>
            <Text style={[styles.memberInfoValue, { color: theme.success }]}>
              {currentMembership?.tasksCompletedInGuild || 0}
            </Text>
          </View>
          
          <View style={styles.memberInfoRow}>
            <Text style={[styles.memberInfoLabel, { color: theme.textSecondary }]}>
              Guild Earnings:
            </Text>
            <Text style={[styles.memberInfoValue, { color: theme.success }]}>
              {currentMembership?.earningsInGuild || 0} QAR
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'jobs':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              My Guild Jobs ({memberJobs.length})
            </Text>
            {memberJobs.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <MaterialIcons name="work-off" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No jobs assigned yet
                </Text>
              </View>
            ) : (
              memberJobs.map(job => (
                <View key={job.id} style={[styles.jobCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.jobHeader}>
                    <Text style={[styles.jobTitle, { color: theme.textPrimary }]}>
                      {job.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getJobStatusColor(job.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getJobStatusColor(job.status) }]}>
                        {job.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.jobDescription, { color: theme.textSecondary }]}>
                    {job.description}
                  </Text>
                  
                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetailItem}>
                      <Ionicons name="cash-outline" size={16} color={theme.success} />
                      <Text style={[styles.jobDetailText, { color: theme.success }]}>
                        {job.totalBudget} QAR
                      </Text>
                    </View>
                    <View style={styles.jobDetailItem}>
                      <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                      <Text style={[styles.jobDetailText, { color: theme.textSecondary }]}>
                        {job.estimatedDuration}
                      </Text>
                    </View>
                    <View style={styles.jobDetailItem}>
                      <Ionicons name="people-outline" size={16} color={theme.primary} />
                      <Text style={[styles.jobDetailText, { color: theme.primary }]}>
                        {job.assignedMembers.length}/{job.maxParticipants}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        );

      case 'contracts':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Contract Voting ({memberContracts.length})
            </Text>
            {memberContracts.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <MaterialIcons name="assignment" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No contracts to vote on
                </Text>
              </View>
            ) : (
              memberContracts.map(contract => (
                <View key={contract.id} style={[styles.contractCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.contractTitle, { color: theme.textPrimary }]}>
                    {contract.title}
                  </Text>
                  
                  <Text style={[styles.contractAmount, { color: theme.success }]}>
                    Total: {contract.totalAmount} QAR
                  </Text>
                  
                  <Text style={[styles.contractDescription, { color: theme.textSecondary }]}>
                    {contract.description}
                  </Text>
                  
                  <View style={styles.votingSection}>
                    <Text style={[styles.votingTitle, { color: theme.textPrimary }]}>
                      Your Vote:
                    </Text>
                    
                    {contract.memberVotes['current_user'] === 'pending' ? (
                      <View style={styles.votingButtons}>
                        <TouchableOpacity
                          style={[styles.voteButton, styles.acceptButton, { backgroundColor: theme.success }]}
                          onPress={() => handleVoteOnContract(contract.id, 'accept')}
                        >
                          <Ionicons name="checkmark" size={20} color="white" />
                          <Text style={styles.voteButtonText}>Accept</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.voteButton, styles.rejectButton, { backgroundColor: theme.error }]}
                          onPress={() => handleVoteOnContract(contract.id, 'reject')}
                        >
                          <Ionicons name="close" size={20} color="white" />
                          <Text style={styles.voteButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={[styles.votedBadge, { 
                        backgroundColor: contract.memberVotes['current_user'] === 'accept' ? theme.success + '20' : theme.error + '20' 
                      }]}>
                        <Text style={[styles.votedText, { 
                          color: contract.memberVotes['current_user'] === 'accept' ? theme.success : theme.error 
                        }]}>
                          {contract.memberVotes['current_user'] === 'accept' ? '✓ Accepted' : '✗ Rejected'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.contractProgress}>
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                      Approvals: {contract.currentApprovals}/{contract.requiredApprovals}
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            backgroundColor: theme.primary,
                            width: `${(contract.currentApprovals / contract.requiredApprovals) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        );

      case 'workshops':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Available Workshops ({availableWorkshops.length})
            </Text>
            
            {availableWorkshops.map(workshop => (
              <View key={workshop.id} style={[styles.workshopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.workshopTitle, { color: theme.textPrimary }]}>
                  {workshop.title}
                </Text>
                
                <Text style={[styles.workshopDescription, { color: theme.textSecondary }]}>
                  {workshop.description}
                </Text>
                
                <View style={styles.workshopDetails}>
                  <View style={styles.workshopDetailItem}>
                    <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.workshopDetailText, { color: theme.textSecondary }]}>
                      {workshop.duration}
                    </Text>
                  </View>
                  <View style={styles.workshopDetailItem}>
                    <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.workshopDetailText, { color: theme.textSecondary }]}>
                      {workshop.location}
                    </Text>
                  </View>
                  <View style={styles.workshopDetailItem}>
                    <Ionicons name="people-outline" size={16} color={theme.primary} />
                    <Text style={[styles.workshopDetailText, { color: theme.primary }]}>
                      {workshop.registeredMembers.length}/{workshop.maxParticipants}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.registerButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleRegisterForWorkshop(workshop.id)}
                >
                  <Text style={[styles.registerButtonText, { color: theme.buttonText }]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {registeredWorkshops.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 24 }]}>
                  My Workshops ({registeredWorkshops.length})
                </Text>
                
                {registeredWorkshops.map(workshop => (
                  <View key={workshop.id} style={[styles.workshopCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                    <Text style={[styles.workshopTitle, { color: theme.textPrimary }]}>
                      {workshop.title}
                    </Text>
                    
                    <View style={[styles.registeredBadge, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[styles.registeredText, { color: theme.primary }]}>
                        ✓ Registered
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        );

      case 'progress':
        return (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Skill Progress
            </Text>
            
            {memberSkillProgress ? (
              <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.progressStats}>
                  <View style={styles.progressStatItem}>
                    <Text style={[styles.progressStatValue, { color: theme.primary }]}>
                      {memberSkillProgress.skillPointsEarned}
                    </Text>
                    <Text style={[styles.progressStatLabel, { color: theme.textSecondary }]}>
                      Skill Points
                    </Text>
                  </View>
                  
                  <View style={styles.progressStatItem}>
                    <Text style={[styles.progressStatValue, { color: theme.success }]}>
                      {memberSkillProgress.workshopsAttended.length}
                    </Text>
                    <Text style={[styles.progressStatLabel, { color: theme.textSecondary }]}>
                      Workshops
                    </Text>
                  </View>
                  
                  <View style={styles.progressStatItem}>
                    <Text style={[styles.progressStatValue, { color: theme.warning }]}>
                      {memberSkillProgress.totalLearningHours}h
                    </Text>
                    <Text style={[styles.progressStatLabel, { color: theme.textSecondary }]}>
                      Learning
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.skillsTitle, { color: theme.textPrimary }]}>
                  Skills
                </Text>
                
                {Object.entries(memberSkillProgress.skills).map(([skillName, skill]) => (
                  <View key={skillName} style={styles.skillItem}>
                    <View style={styles.skillHeader}>
                      <Text style={[styles.skillName, { color: theme.textPrimary }]}>
                        {skillName}
                      </Text>
                      <Text style={[styles.skillLevel, { color: theme.primary }]}>
                        {skill.level.toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={[styles.skillProgressBar, { backgroundColor: theme.border }]}>
                      <View 
                        style={[
                          styles.skillProgressFill, 
                          { 
                            backgroundColor: theme.primary,
                            width: `${(skill.points / 1000) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                    
                    <Text style={[styles.skillPoints, { color: theme.textSecondary }]}>
                      {skill.points}/1000 points
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <MaterialIcons name="trending-up" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No skill progress yet
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.success;
      case 'in_progress': return theme.primary;
      case 'completed': return theme.info;
      case 'pending_approval': return theme.warning;
      default: return theme.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Clean Header - Home Screen Style */}
      <View style={[styles.cleanHeader, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              handleActionPress();
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="shield" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {currentGuild?.name || 'My Guild'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => {
              handleActionPress();
              handleReportIssue();
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Guild Member • Level {currentMembership?.level || 2}
        </Text>
      </View>
      
      {/* Member Stats Bar */}
      <Animated.View 
        style={[
          styles.memberStatsBar,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.statItemHeader}>
          <Text style={styles.statValueHeader}>{guildJobs.filter(job => job.assignedMembers?.includes('current_user')).length}</Text>
          <Text style={styles.statLabelHeader}>My Jobs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItemHeader}>
          <Text style={styles.statValueHeader}>{activeContracts.filter(contract => contract.status === 'active').length}</Text>
          <Text style={styles.statLabelHeader}>Active Contracts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItemHeader}>
          <Text style={styles.statValueHeader}>{workshops.filter(w => w.participants?.includes('current_user')).length}</Text>
          <Text style={styles.statLabelHeader}>Workshops</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderMemberInfo()}

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
          {[
            { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
            { key: 'contracts', label: 'Contracts', icon: 'document-text-outline' },
            { key: 'workshops', label: 'Workshops', icon: 'school-outline' },
            { key: 'progress', label: 'Progress', icon: 'trending-up-outline' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                selectedTab === tab.key && { backgroundColor: theme.primary + '20' }
              ]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={selectedTab === tab.key ? theme.primary : theme.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.key ? theme.primary : theme.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderTabContent()}

        {/* Report Issue Button */}
        <TouchableOpacity
          style={[styles.reportButton, { 
            backgroundColor: theme.error + '15', 
            borderColor: theme.error + '80',
            borderWidth: 2,
            shadowColor: theme.error,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }]}
          onPress={() => {
            handleActionPress();
            handleReportIssue();
          }}
        >
          <View style={[styles.reportIconContainer, { backgroundColor: theme.error + '25' }]}>
            <Ionicons name="warning-outline" size={18} color={theme.error} />
          </View>
          <Text style={[styles.reportButtonText, { color: theme.error, fontWeight: '700' }]}>
            Report Issue to Admin
          </Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memberInfoCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  memberInfoGradient: {
    padding: 20,
  },
  memberInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginLeft: 12,
  },
  memberInfoContent: {
    gap: 12,
  },
  memberInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  memberInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  levelBadge: {
    backgroundColor: '#BCFF31',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  tabContent: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginTop: 12,
  },
  jobCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  jobDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
    lineHeight: 20,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  contractCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  contractAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  contractDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
    lineHeight: 20,
  },
  votingSection: {
    marginBottom: 16,
  },
  votingTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {},
  rejectButton: {},
  voteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  votedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  votedText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  contractProgress: {
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  workshopCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  workshopTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  workshopDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
    lineHeight: 20,
  },
  workshopDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  workshopDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workshopDetailText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  registerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  registeredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  registeredText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  progressCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  progressStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginTop: 4,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  skillItem: {
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  skillLevel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  skillProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  skillProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  skillPoints: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  reportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
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
    marginBottom: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  guildBrandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  guildIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guildInfo: {
    flex: 1,
  },
  guildName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: 'white',
    marginBottom: 2,
  },
  memberTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  memberStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statItemHeader: {
    alignItems: 'center',
  },
  statValueHeader: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: 'white',
  },
  statLabelHeader: {
    fontSize: 11,
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
