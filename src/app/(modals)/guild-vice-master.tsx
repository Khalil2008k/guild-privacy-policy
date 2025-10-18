import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { getAdaptiveTextColor } from '../../utils/colorUtils';
import { useGuildJobs } from '../../contexts/GuildJobContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Users, Briefcase, Award, Settings, TrendingUp, CheckCircle } from 'lucide-react-native';
import ModalHeader from '../components/ModalHeader';
import * as Haptics from 'expo-haptics';
import { Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function GuildViceMasterScreen() {
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
    assignMembersToJob,
    createWorkshop,
    fundWorkshop,
    refreshGuildJobData 
  } = useGuildJobs();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'jobs' | 'workshops' | 'members'>('overview');
  
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
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [workshopForm, setWorkshopForm] = useState({
    title: '',
    description: '',
    duration: '4 hours',
    cost: '1000',
    skillCategory: 'technical',
    targetLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshGuildJobData();
    setRefreshing(false);
  };

  // Mock guild members data (in real app, this would come from guild context)
  const guildMembers = [
    { id: 'member1', name: 'Ahmed Ali', level: 1, role: 'Member', tasksCompleted: 15, earnings: 25000 },
    { id: 'member2', name: 'Sara Hassan', level: 2, role: 'Member', tasksCompleted: 8, earnings: 12000 },
    { id: 'member3', name: 'Omar Khalil', level: 3, role: 'Member', tasksCompleted: 3, earnings: 5000 },
    { id: 'member4', name: 'Layla Ahmed', level: 1, role: 'Member', tasksCompleted: 12, earnings: 18000 },
  ];

  const handleAssignMembers = async (jobId: string) => {
    // In real app, this would show a member selection modal
    CustomAlertService.showConfirmation(
      'Assign Members',
      'Select members to assign to this job:',
      async () => {
        try {
          // Mock assignment - in real app, user would select members
          const selectedMembers = ['member1', 'member2'];
          await assignMembersToJob(jobId, selectedMembers);
          CustomAlertService.showSuccess('Success', 'Members assigned successfully!');
        } catch (error) {
          CustomAlertService.showError('Error', 'Failed to assign members');
        }
      },
      undefined,
      isRTL
    );
  };

  const handleCreateWorkshop = async () => {
    try {
      if (!workshopForm.title.trim()) {
        CustomAlertService.showError('Error', 'Please enter workshop title');
        return;
      }

      const workshop = await createWorkshop({
        title: workshopForm.title,
        description: workshopForm.description,
        duration: workshopForm.duration,
        cost: parseInt(workshopForm.cost),
        skillCategory: workshopForm.skillCategory,
        targetLevel: workshopForm.targetLevel,
        maxParticipants: 10,
        instructorName: 'External Expert',
        instructorType: 'external',
        location: 'Online',
        skillsImproved: [workshopForm.skillCategory],
      });

      setShowWorkshopModal(false);
      setWorkshopForm({
        title: '',
        description: '',
        duration: '4 hours',
        cost: '1000',
        skillCategory: 'technical',
        targetLevel: 'intermediate',
      });

      CustomAlertService.showSuccess('Success', `Workshop "${workshop.title}" created successfully!`);
    } catch (error) {
      CustomAlertService.showError('Error', 'Failed to create workshop');
    }
  };

  const handleFundWorkshop = async (workshopId: string) => {
    try {
      await fundWorkshop(workshopId);
      CustomAlertService.showSuccess('Success', 'Workshop funded successfully!');
    } catch (error) {
      CustomAlertService.showError('Error', 'Failed to fund workshop. Check guild vault balance.');
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Guild Stats */}
      <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
        <LinearGradient
          colors={[theme.primary + '20', theme.primary + '10']}
          style={styles.statsGradient}
        >
          <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>
            Guild Overview
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {guildJobs.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Active Jobs
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {guildVault?.balance || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Vault (QAR)
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.warning }]}>
                {workshops.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Workshops
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.info }]}>
                {guildMembers.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Members
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Recent Activity
      </Text>
      
      <View style={[styles.activityCard, { 
        backgroundColor: theme.surface, 
        borderColor: theme.border + '80', 
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }]}>
        <View style={styles.activityItem}>
          <View style={[styles.activityIconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="briefcase" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.activityText, { color: theme.textPrimary, fontWeight: '600' }]}>
            New job "Mobile App Development" created
          </Text>
          <Text style={[styles.activityTime, { color: theme.textSecondary, fontWeight: '500' }]}>
            2h ago
          </Text>
        </View>
        
        <View style={[styles.activityDivider, { backgroundColor: theme.border + '60' }]} />
        
        <View style={styles.activityItem}>
          <View style={[styles.activityIconContainer, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="school" size={18} color={theme.warning} />
          </View>
          <Text style={[styles.activityText, { color: theme.textPrimary, fontWeight: '600' }]}>
            Workshop "React Patterns" funded
          </Text>
          <Text style={[styles.activityTime, { color: theme.textSecondary, fontWeight: '500' }]}>
            1d ago
          </Text>
        </View>
        
        <View style={[styles.activityDivider, { backgroundColor: theme.border + '60' }]} />
        
        <View style={styles.activityItem}>
          <View style={[styles.activityIconContainer, { backgroundColor: theme.success + '20' }]}>
            <Ionicons name="people" size={18} color={theme.success} />
          </View>
          <Text style={[styles.activityText, { color: theme.textPrimary, fontWeight: '600' }]}>
            3 members assigned to design project
          </Text>
          <Text style={[styles.activityTime, { color: theme.textSecondary, fontWeight: '500' }]}>
            2d ago
          </Text>
        </View>
      </View>
    </View>
  );

  const renderJobs = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Guild Jobs Management
      </Text>
      
      {guildJobs.map(job => (
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
              <Ionicons name="people-outline" size={16} color={theme.primary} />
              <Text style={[styles.jobDetailText, { color: theme.primary }]}>
                {job.assignedMembers.length}/{job.maxParticipants}
              </Text>
            </View>
          </View>
          
          {job.status === 'draft' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => handleAssignMembers(job.id)}
            >
              <Ionicons name="people" size={16} color={theme.buttonText} />
              <Text style={[styles.actionButtonText, { color: theme.buttonText }]}>
                Assign Members
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderWorkshops = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Workshop Management
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowWorkshopModal(true)}
        >
          <Ionicons name="add" size={20} color={theme.buttonText} />
          <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>
      
      {workshops.map(workshop => (
        <View key={workshop.id} style={[styles.workshopCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.workshopTitle, { color: theme.textPrimary }]}>
            {workshop.title}
          </Text>
          
          <Text style={[styles.workshopDescription, { color: theme.textSecondary }]}>
            {workshop.description}
          </Text>
          
          <View style={styles.workshopDetails}>
            <View style={styles.workshopDetailItem}>
              <Ionicons name="cash-outline" size={16} color={theme.success} />
              <Text style={[styles.workshopDetailText, { color: theme.success }]}>
                {workshop.cost} QAR
              </Text>
            </View>
            <View style={styles.workshopDetailItem}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.workshopDetailText, { color: theme.textSecondary }]}>
                {workshop.duration}
              </Text>
            </View>
            <View style={styles.workshopDetailItem}>
              <Ionicons name="people-outline" size={16} color={theme.primary} />
              <Text style={[styles.workshopDetailText, { color: theme.primary }]}>
                {workshop.registeredMembers.length}/{workshop.maxParticipants}
              </Text>
            </View>
          </View>
          
          <View style={[styles.fundingBadge, { 
            backgroundColor: workshop.fundingStatus === 'funded' ? theme.success + '20' : theme.warning + '20' 
          }]}>
            <Text style={[styles.fundingText, { 
              color: workshop.fundingStatus === 'funded' ? theme.success : theme.warning 
            }]}>
              {workshop.fundingStatus.toUpperCase()}
            </Text>
          </View>
          
          {workshop.fundingStatus === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.success }]}
              onPress={() => handleFundWorkshop(workshop.id)}
            >
              <Ionicons name="card" size={16} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                Fund Workshop
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderMembers = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Guild Members ({guildMembers.length})
      </Text>
      
      {guildMembers.map(member => (
        <View key={member.id} style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.memberHeader}>
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: theme.textPrimary }]}>
                {member.name}
              </Text>
              <Text style={[styles.memberRole, { color: theme.textSecondary }]}>
                {member.role} - Level {member.level}
              </Text>
            </View>
            
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(member.level) + '20' }]}>
              <Text style={[styles.levelBadgeText, { color: getLevelColor(member.level) }]}>
                Lv.{member.level}
              </Text>
            </View>
          </View>
          
          <View style={styles.memberStats}>
            <View style={styles.memberStatItem}>
              <Text style={[styles.memberStatValue, { color: theme.primary }]}>
                {member.tasksCompleted}
              </Text>
              <Text style={[styles.memberStatLabel, { color: theme.textSecondary }]}>
                Tasks
              </Text>
            </View>
            
            <View style={styles.memberStatItem}>
              <Text style={[styles.memberStatValue, { color: theme.success }]}>
                {member.earnings}
              </Text>
              <Text style={[styles.memberStatLabel, { color: theme.textSecondary }]}>
                Earnings (QAR)
              </Text>
            </View>
          </View>
          
          {/* Vice Master can manage Level 3 members only */}
          {member.level === 3 && (
            <View style={styles.memberActions}>
              <TouchableOpacity
                style={[styles.memberActionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                onPress={() => CustomAlertService.showError('Promote Member', `Promote ${member.name} to Level 2?`)}
              >
                <Ionicons name="arrow-up" size={16} color={theme.primary} />
                <Text style={[styles.memberActionText, { color: theme.primary }]}>
                  Promote
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.memberActionButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
                onPress={() => CustomAlertService.showError('Remove Member', `Remove ${member.name} from guild?`)}
              >
                <Ionicons name="person-remove" size={16} color={theme.error} />
                <Text style={[styles.memberActionText, { color: theme.error }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#10B981'; // Green
      case 2: return '#F59E0B'; // Yellow
      case 3: return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#06B6D4';
      case 'pending_approval': return '#F59E0B';
      default: return '#6B7280';
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
              // Vice Master tools
            }}
          >
            <Ionicons name="settings-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Vice Guild Master
        </Text>
      </View>
      
      {/* Vice Master Stats Bar */}
      <Animated.View 
        style={[
          styles.viceMasterStatsBar,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.statItemHeader}>
          <Text style={styles.statValueHeader}>{guildJobs.filter(job => job.status === 'active').length}</Text>
          <Text style={styles.statLabelHeader}>Managing</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItemHeader}>
          <Text style={styles.statValueHeader}>{workshops.length}</Text>
          <Text style={styles.statLabelHeader}>Workshops</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItemHeader}>
          <Text style={styles.statValueHeader}>{currentGuild?.memberCount ? Math.floor(currentGuild.memberCount * 0.7) : 8}</Text>
          <Text style={styles.statLabelHeader}>Team Size</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Enhanced Tab Navigation */}
        <Animated.View 
          style={[
            styles.enhancedTabContainer, 
            { backgroundColor: theme.surface },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {[
            { key: 'overview', label: 'Overview', icon: 'analytics-outline', badge: null },
            { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline', badge: guildJobs.filter(job => job.status === 'active').length },
            { key: 'workshops', label: 'Workshops', icon: 'school-outline', badge: workshops.length },
            { key: 'members', label: 'Members', icon: 'people-outline', badge: currentGuild?.memberCount ? Math.floor(currentGuild.memberCount * 0.7) : null },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.enhancedTabButton,
                selectedTab === tab.key && { 
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }
              ]}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.8}
            >
              <View style={styles.tabIconContainer}>
                <Ionicons 
                  name={tab.icon as any} 
                  size={18} 
                  color={selectedTab === tab.key ? 'white' : theme.textSecondary} 
                />
                {tab.badge && tab.badge > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: selectedTab === tab.key ? 'white' : theme.primary }]}>
                    <Text style={[styles.tabBadgeText, { color: selectedTab === tab.key ? theme.primary : 'white' }]}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.enhancedTabText,
                { color: selectedTab === tab.key ? 'white' : theme.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'jobs' && renderJobs()}
        {selectedTab === 'workshops' && renderWorkshops()}
        {selectedTab === 'members' && renderMembers()}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* Workshop Creation Modal */}
      <Modal
        visible={showWorkshopModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ModalHeader
            title="Create Workshop"
            onBack={() => setShowWorkshopModal(false)}
          />
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Workshop Title
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={workshopForm.title}
                onChangeText={(text) => setWorkshopForm({ ...workshopForm, title: text })}
                placeholder="Enter workshop title"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Description
              </Text>
              <TextInput
                style={[styles.formTextArea, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={workshopForm.description}
                onChangeText={(text) => setWorkshopForm({ ...workshopForm, description: text })}
                placeholder="Enter workshop description"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Duration
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={workshopForm.duration}
                  onChangeText={(text) => setWorkshopForm({ ...workshopForm, duration: text })}
                  placeholder="4 hours"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Cost (QAR)
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={workshopForm.cost}
                  onChangeText={(text) => setWorkshopForm({ ...workshopForm, cost: text })}
                  placeholder="1000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateWorkshop}
            >
              <Text style={[styles.createButtonText, { color: theme.buttonText }]}>
                Create Workshop
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  guildBrandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  guildIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guildInfo: {
    flex: 1,
  },
  guildName: {
    fontSize: 19,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: 'white',
    marginBottom: 2,
  },
  viceMasterTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  viceMasterStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statItemHeader: {
    alignItems: 'center',
  },
  statValueHeader: {
    fontSize: 17,
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
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Enhanced Tab Styles
  enhancedTabContainer: {
    marginTop: 20,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  enhancedTabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
  },
  tabIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  enhancedTabText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
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
  statsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  statsGradient: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  activityCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDivider: {
    height: 1,
    marginVertical: 8,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
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
    marginBottom: 16,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
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
    marginBottom: 12,
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
  fundingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  fundingText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  memberCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  memberRole: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  memberStatItem: {
    alignItems: 'center',
  },
  memberStatValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  memberStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
  },
  memberActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  memberActionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  formTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlignVertical: 'top',
  },
  createButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});
