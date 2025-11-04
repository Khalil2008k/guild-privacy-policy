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
  Switch,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { useGuildJobs } from '../../contexts/GuildJobContext';
import { getAdaptiveTextColor, getOptimalBorderColor, testColorLogic } from '../../utils/colorUtils';
import { GuildSystem } from '../../utils/guildSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Crown, Shield, Users, Settings, TrendingUp, Award, AlertCircle } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ModalHeader from '../components/ModalHeader';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Animated, Easing } from 'react-native';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function GuildMasterScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { userGuildStatus, currentGuild, currentMembership, updateGuildSettings, guildJoinRequests, respondToJoinRequest } = useGuild();
  
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
    createGuildJob,
    createContract,
    assignMembersToJob,
    createWorkshop,
    fundWorkshop,
    depositToVault,
    withdrawFromVault,
    refreshGuildJobData 
  } = useGuildJobs();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'jobs' | 'contracts' | 'vault' | 'members' | 'court' | 'settings'>('dashboard');
  const [showJobModal, setShowJobModal] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const [showContractModal, setShowContractModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedJobForContract, setSelectedJobForContract] = useState<string | null>(null);

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    category: 'development',
    totalBudget: '25000',
    estimatedDuration: '3 weeks',
    maxParticipants: '4',
    clientName: '',
    clientContact: '',
    assignedMembers: [] as string[], // New field for member assignment
  });

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

  const [contractForm, setContractForm] = useState({
    terms: ['Complete all deliverables on time', 'Maintain quality standards', 'Regular progress updates'],
    guildMasterShare: '25',
    guildVaultShare: '15',
    equalSplit: true,
  });

  const [vaultForm, setVaultForm] = useState({
    amount: '5000',
    description: '',
    type: 'deposit' as 'deposit' | 'withdrawal',
    category: 'general',
  });

  const [inviteForm, setInviteForm] = useState({
    userId: '',
    message: '',
    role: 'member' as 'member' | 'vice_master',
    level: 3,
  });

  // Mock guild members data
  const guildMembers = [
    { id: 'member1', name: 'Ahmed Ali', level: 1, role: 'Member', tasksCompleted: 15, earnings: 25000, joinedAt: '2024-01-15' },
    { id: 'member2', name: 'Sara Hassan', level: 2, role: 'Member', tasksCompleted: 8, earnings: 12000, joinedAt: '2024-02-20' },
    { id: 'member3', name: 'Omar Khalil', level: 3, role: 'Member', tasksCompleted: 3, earnings: 5000, joinedAt: '2024-03-10' },
    { id: 'member4', name: 'Layla Ahmed', level: 1, role: 'Member', tasksCompleted: 12, earnings: 18000, joinedAt: '2024-01-25' },
    { id: 'vice1', name: 'Hassan Omar', level: undefined, role: 'Vice Master', tasksCompleted: 20, earnings: 35000, joinedAt: '2024-01-10' },
  ];

  // Mock dispute data for Guild Court
  const activeDisputes = [
    {
      id: 'dispute1',
      title: 'Payment Dispute - Mobile App Project',
      plaintiff: 'Ahmed Ali',
      defendant: 'TechCorp Solutions',
      amount: 15000,
      status: 'pending_jury',
      priority: 'high',
      createdAt: '2025-09-15',
      description: 'Client refusing to pay after project completion and approval',
      evidence: ['contract.pdf', 'approval_email.png', 'project_screenshots.zip'],
      juryMembers: ['Hassan Omar', 'Sara Hassan', 'Layla Ahmed'],
      votingDeadline: '2025-09-25',
    },
    {
      id: 'dispute2',
      title: 'Quality Dispute - Website Design',
      plaintiff: 'Digital Innovations',
      defendant: 'Omar Khalil',
      amount: 8500,
      status: 'in_voting',
      priority: 'medium',
      createdAt: '2025-09-12',
      description: 'Design quality does not meet agreed specifications',
      evidence: ['design_brief.pdf', 'delivered_files.zip'],
      juryMembers: ['Hassan Omar', 'Ahmed Ali', 'member4'],
      votingDeadline: '2025-09-22',
      votes: { 'Hassan Omar': 'plaintiff', 'Ahmed Ali': null, 'member4': null }
    },
    {
      id: 'dispute3',
      title: 'Deadline Dispute - Content Writing',
      plaintiff: 'StartupHub',
      defendant: 'Sara Hassan',
      amount: 3200,
      status: 'resolved',
      priority: 'low',
      createdAt: '2025-09-08',
      description: 'Project delivered 5 days after agreed deadline',
      evidence: ['timeline.pdf', 'communication_log.txt'],
      juryMembers: ['Hassan Omar', 'Ahmed Ali', 'Layla Ahmed'],
      votingDeadline: '2025-09-18',
      resolution: 'Partial payment (70%) awarded to freelancer',
      resolvedAt: '2025-09-18'
    }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshGuildJobData();
    setRefreshing(false);
  };

  const handleCreateJob = async () => {
    try {
      if (!jobForm.title.trim() || !jobForm.description.trim()) {
        CustomAlertService.showError('Error', 'Please fill in all required fields');
        return;
      }

      const job = await createGuildJob({
        title: jobForm.title,
        description: jobForm.description,
        category: jobForm.category,
        totalBudget: parseInt(jobForm.totalBudget),
        estimatedDuration: jobForm.estimatedDuration,
        maxParticipants: parseInt(jobForm.maxParticipants),
        clientName: jobForm.clientName,
        clientContact: jobForm.clientContact,
        assignedMembers: jobForm.assignedMembers, // Include assigned members
        requiredSkills: ['React', 'Node.js', 'UI/UX'],
        difficultyLevel: 'intermediate',
      });

      setShowJobModal(false);
      setJobForm({
        title: '',
        description: '',
        category: 'development',
        totalBudget: '25000',
        estimatedDuration: '3 weeks',
        maxParticipants: '4',
        clientName: '',
        clientContact: '',
        assignedMembers: [],
      });

      CustomAlertService.showSuccess('Success', `Guild job "${job.title}" created successfully!`);
    } catch (error) {
      CustomAlertService.showError('Error', 'Failed to create guild job');
    }
  };

  const handleInviteByUserId = () => {
    if (!inviteForm.userId.trim()) {
      CustomAlertService.showError('Error', 'Please enter a valid User ID');
      return;
    }

    console.log('Sending guild invitation:', inviteForm);
    
    // Here you would call your guild invitation API
    // For now, we'll simulate the invitation
    CustomAlertService.showError(
      'Invitation Sent',
      `Invitation sent to User ID: ${inviteForm.userId}\nRole: ${inviteForm.role}\nLevel: ${inviteForm.level}`,
      [{ text: 'OK', onPress: () => {
        setShowInviteModal(false);
        setInviteForm({
          userId: '',
          message: '',
          role: 'member',
          level: 3,
        });
      }}]
    );
    handleActionPress();
  };

  const canKickMember = (memberId: string): boolean => {
    // Check if member is in any ongoing contracts
    const memberInContract = guildJobs.some(job => 
      job.assignedMembers?.includes(memberId) && 
      (job.status === 'active' || job.status === 'in_progress')
    );
    
    return !memberInContract;
  };

  const handleKickMember = (memberId: string, memberName: string) => {
    if (!canKickMember(memberId)) {
      CustomAlertService.showError(
        'Cannot Remove Member',
        `${memberName} is currently assigned to ongoing contracts and cannot be removed until all contracts are fulfilled.`,
        [{ text: 'OK' }]
      );
      return;
    }

    CustomAlertService.showError(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the guild?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            console.log('Removing member:', memberId);
            // Here you would call your remove member API
            CustomAlertService.showSuccess('Success', `${memberName} has been removed from the guild.`);
            handleActionPress();
          }
        }
      ]
    );
  };

  const getActiveContractsCount = (): number => {
    return guildJobs.filter(job => 
      job.status === 'active' || job.status === 'in_progress'
    ).length;
  };

  const getMinimumRankText = (): string => {
    return currentGuild?.minRankRequired || 'G';
  };

  const handleUpdateMemberCount = () => {
    CustomAlertService.showError(
      'Update Member Limit',
      'Enter new maximum member count:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update',
          onPress: () => {
            console.log('Updating member count');
            // Here you would implement the member count update
            CustomAlertService.showSuccess('Success', 'Member limit updated successfully');
          }
        }
      ]
    );
  };

  const handleUpdateMinimumRank = () => {
    CustomAlertService.showError(
      'Update Minimum Rank',
      'Select new minimum rank requirement:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'G', onPress: () => updateMinRank('G') },
        { text: 'F', onPress: () => updateMinRank('F') },
        { text: 'E', onPress: () => updateMinRank('E') },
        { text: 'D', onPress: () => updateMinRank('D') },
        { text: 'C', onPress: () => updateMinRank('C') },
        { text: 'B', onPress: () => updateMinRank('B') },
        { text: 'A', onPress: () => updateMinRank('A') },
        { text: 'S', onPress: () => updateMinRank('S') },
        { text: 'SS', onPress: () => updateMinRank('SS') },
        { text: 'SSS', onPress: () => updateMinRank('SSS') },
      ]
    );
  };

  const updateMinRank = (rank: string) => {
    console.log('Updating minimum rank to:', rank);
    // Here you would call your update minimum rank API
    CustomAlertService.showSuccess('Success', `Minimum rank requirement updated to ${rank}`);
  };

  const handleCreateContract = async () => {
    try {
      if (!selectedJobForContract) {
        CustomAlertService.showError('Error', 'Please select a job first');
        return;
      }

      const job = guildJobs.find(j => j.id === selectedJobForContract);
      if (!job || job.assignedMembers.length === 0) {
        CustomAlertService.showError('Error', 'Job must have assigned members before creating contract');
        return;
      }

      // Create responsibilities for each member
      const responsibilities: { [userId: string]: string[] } = {};
      job.assignedMembers.forEach(memberId => {
        responsibilities[memberId] = [
          'Complete assigned tasks on time',
          'Maintain quality standards',
          'Participate in team meetings',
        ];
      });

      const contract = await createContract(selectedJobForContract, contractForm.terms, responsibilities);

      setShowContractModal(false);
      setSelectedJobForContract(null);
      setContractForm({
        terms: ['Complete all deliverables on time', 'Maintain quality standards', 'Regular progress updates'],
        guildMasterShare: '25',
        guildVaultShare: '15',
        equalSplit: true,
      });

      CustomAlertService.showSuccess('Success', `Contract "${contract.title}" created successfully!`);
    } catch (error) {
      CustomAlertService.showError('Error', 'Failed to create contract');
    }
  };

  const handleVaultTransaction = async () => {
    try {
      const amount = parseInt(vaultForm.amount);
      if (isNaN(amount) || amount <= 0) {
        CustomAlertService.showError('Error', 'Please enter a valid amount');
        return;
      }

      if (vaultForm.type === 'deposit') {
        await depositToVault(amount, vaultForm.description || 'Guild Master deposit');
      } else {
        await withdrawFromVault(amount, vaultForm.description || 'Guild Master withdrawal', vaultForm.category);
      }

      setShowVaultModal(false);
      setVaultForm({
        amount: '5000',
        description: '',
        type: 'deposit',
        category: 'general',
      });

      CustomAlertService.showSuccess('Success', `${vaultForm.type === 'deposit' ? 'Deposit' : 'Withdrawal'} completed successfully!`);
    } catch (error) {
      CustomAlertService.showError('Error', `Failed to ${vaultForm.type === 'deposit' ? 'deposit to' : 'withdraw from'} vault`);
    }
  };

  const handleAssignMembers = async (jobId: string) => {
    CustomAlertService.showError(
      'Assign Members',
      'Select members to assign to this job:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Assign Selected', 
          onPress: async () => {
            try {
              // Mock assignment - in real app, user would select members
              const selectedMembers = ['member1', 'member2', 'member3'];
              await assignMembersToJob(jobId, selectedMembers);
              CustomAlertService.showSuccess('Success', 'Members assigned successfully!');
            } catch (error) {
              CustomAlertService.showError('Error', 'Failed to assign members');
            }
          }
        }
      ]
    );
  };

  const handlePromoteMember = (memberId: string, memberName: string, currentLevel?: number) => {
    if (currentLevel === undefined) {
      // Vice Master - can transfer leadership
      CustomAlertService.showError(
        'Transfer Leadership',
        `Transfer Guild Master role to ${memberName}? You will become Vice Master.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Transfer', style: 'destructive', onPress: () => {
            CustomAlertService.showSuccess('Success', `Leadership transferred to ${memberName}`);
          }}
        ]
      );
    } else if (currentLevel > 1) {
      CustomAlertService.showError(
        'Promote Member',
        `Promote ${memberName} to Level ${currentLevel - 1}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Promote', onPress: () => {
            CustomAlertService.showSuccess('Success', `${memberName} promoted to Level ${currentLevel - 1}`);
          }}
        ]
      );
    } else {
      // Level 1 member - can promote to Vice Master
      CustomAlertService.showError(
        'Promote to Vice Master',
        `Promote ${memberName} to Vice Master?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Promote', onPress: () => {
            CustomAlertService.showSuccess('Success', `${memberName} promoted to Vice Master`);
          }}
        ]
      );
    }
  };

  const handleDemoteMember = (memberId: string, memberName: string, currentLevel?: number) => {
    if (currentLevel === undefined) {
      // Vice Master - demote to Level 1
      CustomAlertService.showError(
        'Demote Vice Master',
        `Demote ${memberName} to Member Level 1?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Demote', style: 'destructive', onPress: () => {
            CustomAlertService.showSuccess('Success', `${memberName} demoted to Member Level 1`);
          }}
        ]
      );
    } else if (currentLevel < 3) {
      CustomAlertService.showError(
        'Demote Member',
        `Demote ${memberName} to Level ${currentLevel + 1}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Demote', style: 'destructive', onPress: () => {
            CustomAlertService.showSuccess('Success', `${memberName} demoted to Level ${currentLevel + 1}`);
          }}
        ]
      );
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    CustomAlertService.showError(
      'Remove Member',
      `Remove ${memberName} from the guild? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          CustomAlertService.showSuccess('Success', `${memberName} removed from guild`);
        }}
      ]
    );
  };

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      {/* Guild Stats */}
      <View style={[styles.statsContainer, { 
        backgroundColor: theme.surface, 
        borderWidth: 2, 
        borderColor: theme.primary + '40',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      }]}>
        <LinearGradient
          colors={[theme.primary + '25', theme.primary + '08']}
          style={styles.statsGradient}
        >
          <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>
            Guild Master Dashboard
          </Text>
          
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem} onPress={handleUpdateMemberCount}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {guildMembers.length}/{currentGuild?.maxMembers || 50}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Members
              </Text>
            </TouchableOpacity>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {getActiveContractsCount()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Active Contracts
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {guildVault?.balance || 0} QAR
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Vault Balance
              </Text>
            </View>
            
            <TouchableOpacity style={styles.statItem} onPress={handleUpdateMinimumRank}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {getMinimumRankText()}+
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Min Rank Required
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Quick Actions
      </Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.quickActionCard, { 
            backgroundColor: theme.surface, 
            borderColor: theme.primary + '60', 
            borderWidth: 2,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }]}
          onPress={() => {
            handleActionPress();
            setShowJobModal(true);
          }}
        >
          <View style={[styles.quickActionIconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="briefcase" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.quickActionText, { color: theme.textPrimary, fontWeight: '700' }]}>
            Create Job
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionCard, { 
            backgroundColor: theme.surface, 
            borderColor: theme.success + '60', 
            borderWidth: 2,
            shadowColor: theme.success,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }]}
          onPress={() => {
            handleActionPress();
            setShowVaultModal(true);
          }}
        >
          <View style={[styles.quickActionIconContainer, { backgroundColor: theme.success + '20' }]}>
            <Ionicons name="wallet" size={28} color={theme.success} />
          </View>
          <Text style={[styles.quickActionText, { color: theme.textPrimary, fontWeight: '700' }]}>
            Manage Vault
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionCard, { 
            backgroundColor: theme.surface, 
            borderColor: theme.warning + '60', 
            borderWidth: 2,
            shadowColor: theme.warning,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }]}
          onPress={() => {
            handleActionPress();
            setSelectedTab('contracts');
          }}
        >
          <View style={[styles.quickActionIconContainer, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="document-text" size={28} color={theme.warning} />
          </View>
          <Text style={[styles.quickActionText, { color: theme.textPrimary, fontWeight: '700' }]}>
            Contracts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionCard, { 
            backgroundColor: theme.surface, 
            borderColor: theme.info + '60', 
            borderWidth: 2,
            shadowColor: theme.info,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }]}
          onPress={() => {
            handleActionPress();
            setSelectedTab('members');
          }}
        >
          <View style={[styles.quickActionIconContainer, { backgroundColor: theme.info + '20' }]}>
            <Ionicons name="people" size={28} color={theme.info} />
          </View>
          <Text style={[styles.quickActionText, { color: theme.textPrimary, fontWeight: '700' }]}>
            Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { 
            backgroundColor: theme.surface, 
            borderColor: theme.primary + '60', 
            borderWidth: 2,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }]}
          onPress={() => {
            handleActionPress();
            setShowInviteModal(true);
          }}
        >
          <View style={[styles.quickActionIconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="person-add" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.quickActionText, { color: theme.textPrimary, fontWeight: '700' }]}>
            Invite Member
          </Text>
        </TouchableOpacity>
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
            Created job "E-commerce Platform Development"
          </Text>
          <Text style={[styles.activityTime, { color: theme.textSecondary, fontWeight: '500' }]}>
            1h ago
          </Text>
        </View>
        
        <View style={[styles.activityDivider, { backgroundColor: theme.border + '60' }]} />
        
        <View style={styles.activityItem}>
          <View style={[styles.activityIconContainer, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="document-text" size={18} color={theme.warning} />
          </View>
          <Text style={[styles.activityText, { color: theme.textPrimary, fontWeight: '600' }]}>
            Contract approved for "Mobile App Design"
          </Text>
          <Text style={[styles.activityTime, { color: theme.textSecondary, fontWeight: '500' }]}>
            3h ago
          </Text>
        </View>
        
        <View style={[styles.activityDivider, { backgroundColor: theme.border + '60' }]} />
        
        <View style={styles.activityItem}>
          <View style={[styles.activityIconContainer, { backgroundColor: theme.success + '20' }]}>
            <Ionicons name="cash" size={18} color={theme.success} />
          </View>
          <Text style={[styles.activityText, { color: theme.textPrimary, fontWeight: '600' }]}>
            Deposited 10,000 QAR to guild vault
          </Text>
          <Text style={[styles.activityTime, { color: theme.textSecondary, fontWeight: '500' }]}>
            1d ago
          </Text>
        </View>
      </View>
    </View>
  );

  const renderJobs = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Guild Jobs Management
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowJobModal(true)}
        >
          <Ionicons name="add" size={20} color={theme.buttonText} />
          <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
            Create Job
          </Text>
        </TouchableOpacity>
      </View>
      
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
            <View style={styles.jobDetailItem}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.jobDetailText, { color: theme.textSecondary }]}>
                {job.estimatedDuration}
              </Text>
            </View>
          </View>
          
          <View style={styles.jobActions}>
            {job.status === 'draft' && (
              <TouchableOpacity
                style={[styles.jobActionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                onPress={() => handleAssignMembers(job.id)}
              >
                <Ionicons name="people" size={16} color={theme.primary} />
                <Text style={[styles.jobActionText, { color: theme.primary }]}>
                  Assign Members
                </Text>
              </TouchableOpacity>
            )}
            
            {job.status === 'active' && job.assignedMembers.length > 0 && !job.contractId && (
              <TouchableOpacity
                style={[styles.jobActionButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
                onPress={() => {
                  setSelectedJobForContract(job.id);
                  setShowContractModal(true);
                }}
              >
                <Ionicons name="document-text" size={16} color={theme.warning} />
                <Text style={[styles.jobActionText, { color: theme.warning }]}>
                  Create Contract
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderContracts = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Contract Management
      </Text>
      
      {activeContracts.map(contract => (
        <View key={contract.id} style={[styles.contractCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.contractHeader}>
            <Text style={[styles.contractTitle, { color: theme.textPrimary }]}>
              {contract.title}
            </Text>
            <View style={[styles.contractStatusBadge, { backgroundColor: getContractStatusColor(contract.status) + '20' }]}>
              <Text style={[styles.contractStatusText, { color: getContractStatusColor(contract.status) }]}>
                {contract.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.contractAmount, { color: theme.success }]}>
            Total Amount: {contract.totalAmount} QAR
          </Text>
          
          <Text style={[styles.contractDescription, { color: theme.textSecondary }]}>
            {contract.description}
          </Text>
          
          <View style={styles.contractProgress}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              Member Approvals: {contract.currentApprovals}/{contract.requiredApprovals}
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
          
          <View style={styles.profitDistribution}>
            <Text style={[styles.distributionTitle, { color: theme.textPrimary }]}>
              Profit Distribution:
            </Text>
            <View style={styles.distributionDetails}>
              <Text style={[styles.distributionText, { color: theme.textSecondary }]}>
                Guild Master: {contract.profitDistribution.guildMasterShare}%
              </Text>
              <Text style={[styles.distributionText, { color: theme.textSecondary }]}>
                Guild Vault: {contract.profitDistribution.guildVaultShare}%
              </Text>
              <Text style={[styles.distributionText, { color: theme.textSecondary }]}>
                Members: {100 - contract.profitDistribution.guildMasterShare - contract.profitDistribution.guildVaultShare}%
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderVault = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Guild Vault Management
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.success }]}
          onPress={() => setShowVaultModal(true)}
        >
          <Ionicons name="cash" size={20} color="white" />
          <Text style={[styles.addButtonText, { color: 'white' }]}>
            Transaction
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Vault Overview */}
      <View style={[styles.vaultOverview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <LinearGradient
          colors={[theme.success + '20', theme.success + '10']}
          style={styles.vaultGradient}
        >
          <Text style={[styles.vaultTitle, { color: theme.textPrimary }]}>
            Vault Balance
          </Text>
          <Text style={[styles.vaultBalance, { color: theme.success }]}>
            {guildVault?.balance || 0} QAR
          </Text>
          
          <View style={styles.vaultStats}>
            <View style={styles.vaultStatItem}>
              <Text style={[styles.vaultStatValue, { color: theme.primary }]}>
                {guildVault?.totalDeposited || 0}
              </Text>
              <Text style={[styles.vaultStatLabel, { color: theme.textSecondary }]}>
                Total Deposited
              </Text>
            </View>
            
            <View style={styles.vaultStatItem}>
              <Text style={[styles.vaultStatValue, { color: theme.warning }]}>
                {guildVault?.totalWithdrawn || 0}
              </Text>
              <Text style={[styles.vaultStatLabel, { color: theme.textSecondary }]}>
                Total Withdrawn
              </Text>
            </View>
            
            <View style={styles.vaultStatItem}>
              <Text style={[styles.vaultStatValue, { color: theme.info }]}>
                {guildVault?.totalSpentOnDevelopment || 0}
              </Text>
              <Text style={[styles.vaultStatLabel, { color: theme.textSecondary }]}>
                Development Spending
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      {/* Fund Categories */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Fund Categories
      </Text>
      
      <View style={styles.fundCategoriesGrid}>
        <View style={[styles.fundCategoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="school" size={24} color={theme.primary} />
          <Text style={[styles.fundCategoryTitle, { color: theme.textPrimary }]}>
            Workshop Fund
          </Text>
          <Text style={[styles.fundCategoryAmount, { color: theme.primary }]}>
            {guildVault?.workshopFund || 0} QAR
          </Text>
        </View>
        
        <View style={[styles.fundCategoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="book" size={24} color={theme.warning} />
          <Text style={[styles.fundCategoryTitle, { color: theme.textPrimary }]}>
            Course Fund
          </Text>
          <Text style={[styles.fundCategoryAmount, { color: theme.warning }]}>
            {guildVault?.courseFund || 0} QAR
          </Text>
        </View>
        
        <View style={[styles.fundCategoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="calendar" size={24} color={theme.info} />
          <Text style={[styles.fundCategoryTitle, { color: theme.textPrimary }]}>
            Event Fund
          </Text>
          <Text style={[styles.fundCategoryAmount, { color: theme.info }]}>
            {guildVault?.eventFund || 0} QAR
          </Text>
        </View>
        
        <View style={[styles.fundCategoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="shield" size={24} color={theme.error} />
          <Text style={[styles.fundCategoryTitle, { color: theme.textPrimary }]}>
            Emergency Fund
          </Text>
          <Text style={[styles.fundCategoryAmount, { color: theme.error }]}>
            {guildVault?.emergencyFund || 0} QAR
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMembers = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Guild Members Management ({guildMembers.length})
      </Text>
      
      {guildMembers.map(member => (
        <View key={member.id} style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.memberHeader}>
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: theme.textPrimary }]}>
                {member.name}
              </Text>
              <Text style={[styles.memberRole, { color: theme.textSecondary }]}>
                {member.role}{member.level ? ` - Level ${member.level}` : ''}
              </Text>
              <Text style={[styles.memberJoinDate, { color: theme.textSecondary }]}>
                Joined: {member.joinedAt}
              </Text>
            </View>
            
            {member.level && (
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(member.level) + '20' }]}>
                <Text style={[styles.levelBadgeText, { color: getLevelColor(member.level) }]}>
                  Lv.{member.level}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.memberStats}>
            <View style={styles.memberStatItem}>
              <Text style={[styles.memberStatValue, { color: theme.primary }]}>
                {member.tasksCompleted}
              </Text>
              <Text style={[styles.memberStatLabel, { color: theme.textSecondary }]}>
                Tasks Completed
              </Text>
            </View>
            
            <View style={styles.memberStatItem}>
              <Text style={[styles.memberStatValue, { color: theme.success }]}>
                {member.earnings}
              </Text>
              <Text style={[styles.memberStatLabel, { color: theme.textSecondary }]}>
                Total Earnings (QAR)
              </Text>
            </View>
          </View>
          
          {/* Guild Master has full control over all members */}
          <View style={styles.memberActions}>
            <TouchableOpacity
              style={[styles.memberActionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => handlePromoteMember(member.id, member.name, member.level)}
            >
              <Ionicons name="arrow-up" size={16} color={theme.primary} />
              <Text style={[styles.memberActionText, { color: theme.primary }]}>
                Promote
              </Text>
            </TouchableOpacity>
            
            {(member.level || member.role === 'Vice Master') && (
              <TouchableOpacity
                style={[styles.memberActionButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
                onPress={() => handleDemoteMember(member.id, member.name, member.level)}
              >
                <Ionicons name="arrow-down" size={16} color={theme.warning} />
                <Text style={[styles.memberActionText, { color: theme.warning }]}>
                  Demote
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.memberActionButton, 
                { 
                  backgroundColor: canKickMember(member.id) ? theme.error + '20' : theme.textSecondary + '20', 
                  borderColor: canKickMember(member.id) ? theme.error : theme.textSecondary,
                  opacity: canKickMember(member.id) ? 1 : 0.5,
                }
              ]}
              onPress={() => handleKickMember(member.id, member.name)}
              disabled={!canKickMember(member.id)}
            >
              <Ionicons 
                name={canKickMember(member.id) ? "person-remove" : "shield-outline"} 
                size={16} 
                color={canKickMember(member.id) ? theme.error : theme.textSecondary} 
              />
              <Text style={[
                styles.memberActionText, 
                { color: canKickMember(member.id) ? theme.error : theme.textSecondary }
              ]}>
                {canKickMember(member.id) ? 'Remove' : 'Protected'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {!canKickMember(member.id) && (
            <View style={[styles.contractProtectionBadge, { backgroundColor: theme.info + '15', borderColor: theme.info }]}>
              <Ionicons name="contract-outline" size={14} color={theme.info} />
              <Text style={[styles.contractProtectionText, { color: theme.info }]}>
                In Active Contract - Cannot Remove
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderCourt = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {isRTL ? 'محكمة النقابة' : 'Guild Court'} ({activeDisputes.filter(d => d.status !== 'resolved').length} {isRTL ? 'نزاع نشط' : 'Active'})
      </Text>

      {/* Court Statistics */}
      <View style={[styles.courtStatsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.courtStatsGrid}>
          <View style={[styles.courtStatCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.courtStatValue, { color: theme.warning }]}>
              {activeDisputes.filter(d => d.status === 'pending_jury').length}
            </Text>
            <Text style={[styles.courtStatLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'في انتظار المحلفين' : 'Pending Jury'}
            </Text>
          </View>
          <View style={[styles.courtStatCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.courtStatValue, { color: theme.info }]}>
              {activeDisputes.filter(d => d.status === 'in_voting').length}
            </Text>
            <Text style={[styles.courtStatLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'في التصويت' : 'In Voting'}
            </Text>
          </View>
          <View style={[styles.courtStatCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.courtStatValue, { color: theme.success }]}>
              {activeDisputes.filter(d => d.status === 'resolved').length}
            </Text>
            <Text style={[styles.courtStatLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'محلول' : 'Resolved'}
            </Text>
          </View>
        </View>
      </View>

      {/* Active Disputes */}
      <Text style={[styles.subsectionTitle, { color: theme.textPrimary }]}>
        {isRTL ? 'النزاعات النشطة' : 'Active Disputes'}
      </Text>

      {activeDisputes.map((dispute) => (
        <View key={dispute.id} style={[styles.disputeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.disputeHeader}>
            <View style={styles.disputeInfo}>
              <Text style={[styles.disputeTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                {dispute.title}
              </Text>
              <Text style={[styles.disputeAmount, { color: theme.primary }]}>
                QR {dispute.amount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.disputeStatusContainer}>
              <View style={[
                styles.disputeStatus,
                { 
                  backgroundColor: dispute.status === 'pending_jury' ? theme.warning + '20' :
                                 dispute.status === 'in_voting' ? theme.info + '20' :
                                 theme.success + '20'
                }
              ]}>
                <Text style={[
                  styles.disputeStatusText,
                  { 
                    color: dispute.status === 'pending_jury' ? theme.warning :
                           dispute.status === 'in_voting' ? theme.info :
                           theme.success
                  }
                ]}>
                  {dispute.status === 'pending_jury' ? (isRTL ? 'في انتظار المحلفين' : 'Pending Jury') :
                   dispute.status === 'in_voting' ? (isRTL ? 'في التصويت' : 'In Voting') :
                   (isRTL ? 'محلول' : 'Resolved')}
                </Text>
              </View>
              <View style={[
                styles.disputePriority,
                { 
                  backgroundColor: dispute.priority === 'high' ? theme.error + '20' :
                                 dispute.priority === 'medium' ? theme.warning + '20' :
                                 theme.info + '20'
                }
              ]}>
                <Text style={[
                  styles.disputePriorityText,
                  { 
                    color: dispute.priority === 'high' ? theme.error :
                           dispute.priority === 'medium' ? theme.warning :
                           theme.info
                  }
                ]}>
                  {dispute.priority === 'high' ? (isRTL ? 'عالي' : 'High') :
                   dispute.priority === 'medium' ? (isRTL ? 'متوسط' : 'Medium') :
                   (isRTL ? 'منخفض' : 'Low')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.disputeParties}>
            <View style={styles.disputeParty}>
              <Text style={[styles.disputePartyLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'المدعي:' : 'Plaintiff:'}
              </Text>
              <Text style={[styles.disputePartyName, { color: theme.textPrimary }]}>
                {dispute.plaintiff}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={theme.textSecondary} />
            <View style={styles.disputeParty}>
              <Text style={[styles.disputePartyLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'المدعى عليه:' : 'Defendant:'}
              </Text>
              <Text style={[styles.disputePartyName, { color: theme.textPrimary }]}>
                {dispute.defendant}
              </Text>
            </View>
          </View>

          <Text style={[styles.disputeDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {dispute.description}
          </Text>

          {/* Jury Information */}
          {dispute.juryMembers && (
            <View style={styles.jurySection}>
              <Text style={[styles.jurySectionTitle, { color: theme.textPrimary }]}>
                {isRTL ? 'المحلفون:' : 'Jury Members:'}
              </Text>
              <View style={styles.juryMembers}>
                {dispute.juryMembers.map((member, index) => (
                  <View key={index} style={[styles.juryMember, { backgroundColor: theme.background }]}>
                    <Text style={[styles.juryMemberName, { color: theme.textPrimary }]}>
                      {member}
                    </Text>
                    {dispute.votes && dispute.votes[member] && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={16} 
                        color={theme.success} 
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Evidence */}
          {dispute.evidence && dispute.evidence.length > 0 && (
            <View style={styles.evidenceSection}>
              <Text style={[styles.evidenceSectionTitle, { color: theme.textPrimary }]}>
                {isRTL ? 'الأدلة:' : 'Evidence:'}
              </Text>
              <View style={styles.evidenceList}>
                {dispute.evidence.map((evidence, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.evidenceItem, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      console.log('View evidence:', evidence);
                    }}
                  >
                    <Ionicons name="document-outline" size={16} color={theme.primary} />
                    <Text style={[styles.evidenceText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {evidence}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.disputeActions}>
            {dispute.status === 'pending_jury' && (
              <TouchableOpacity
                style={[styles.disputeActionButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  CustomAlertService.showError(
                    isRTL ? 'تعيين المحلفين' : 'Assign Jury',
                    isRTL ? 'هل تريد تعيين المحلفين لهذا النزاع؟' : 'Do you want to assign jury members to this dispute?',
                    [
                      { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                      { text: isRTL ? 'تعيين' : 'Assign', onPress: () => console.log('Assign jury:', dispute.id) }
                    ]
                  );
                }}
              >
                <Ionicons name="people" size={16} color="#000000" />
                <Text style={[styles.disputeActionText, { color: '#000000' }]}>
                  {isRTL ? 'تعيين المحلفين' : 'Assign Jury'}
                </Text>
              </TouchableOpacity>
            )}
            
            {dispute.status === 'in_voting' && (
              <TouchableOpacity
                style={[styles.disputeActionButton, { backgroundColor: theme.info }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  console.log('View voting details:', dispute.id);
                }}
              >
                <Ionicons name="eye" size={16} color="#000000" />
                <Text style={[styles.disputeActionText, { color: '#000000' }]}>
                  {isRTL ? 'عرض التصويت' : 'View Voting'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.disputeActionButton, { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('View dispute details:', dispute.id);
              }}
            >
              <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
              <Text style={[styles.disputeActionText, { color: theme.primary }]}>
                {isRTL ? 'التفاصيل' : 'Details'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resolution (for resolved disputes) */}
          {dispute.status === 'resolved' && dispute.resolution && (
            <View style={[styles.resolutionSection, { backgroundColor: theme.success + '10', borderColor: theme.success }]}>
              <View style={styles.resolutionHeader}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.resolutionTitle, { color: theme.success }]}>
                  {isRTL ? 'القرار النهائي' : 'Final Resolution'}
                </Text>
              </View>
              <Text style={[styles.resolutionText, { color: theme.textPrimary }]}>
                {dispute.resolution}
              </Text>
              <Text style={[styles.resolutionDate, { color: theme.textSecondary }]}>
                {isRTL ? 'تم الحل في:' : 'Resolved on:'} {dispute.resolvedAt}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Court Rules & Guidelines */}
      <View style={[styles.courtRulesSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.courtRulesTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'قواعد المحكمة' : 'Court Rules & Guidelines'}
        </Text>
        <View style={styles.courtRulesList}>
          <View style={styles.courtRule}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.courtRuleText, { color: theme.textSecondary }]}>
              {isRTL ? 'يجب على جميع المحلفين التصويت خلال 7 أيام' : 'All jury members must vote within 7 days'}
            </Text>
          </View>
          <View style={styles.courtRule}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.courtRuleText, { color: theme.textSecondary }]}>
              {isRTL ? 'الأغلبية البسيطة مطلوبة للقرار' : 'Simple majority required for decision'}
            </Text>
          </View>
          <View style={styles.courtRule}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.courtRuleText, { color: theme.textSecondary }]}>
              {isRTL ? 'يمكن استئناف القرارات خلال 48 ساعة' : 'Decisions can be appealed within 48 hours'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Guild Settings
      </Text>
      
      {/* Guild Privacy Settings */}
      <View style={[styles.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.settingsCardTitle, { color: theme.textPrimary }]}>
          Privacy & Access
        </Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
              Guild Type
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              {currentGuild ? GuildSystem.getGuildPrivacyText(currentGuild) : 'Unknown'}
            </Text>
          </View>
          <Ionicons 
            name={currentGuild ? GuildSystem.getGuildPrivacyIcon(currentGuild) as any : 'help-outline'} 
            size={24} 
            color={currentGuild?.isOpen ? theme.success : theme.warning} 
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
              Open Guild
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Anyone can discover and join your guild
            </Text>
          </View>
          <Switch
            value={currentGuild?.isOpen ?? true}
            onValueChange={async (value) => {
              if (currentGuild) {
                await updateGuildSettings(currentGuild.id, { 
                  isOpen: value,
                  isPublic: value, // Keep backward compatibility
                  requiresApproval: value ? currentGuild.requiresApproval : true // Closed guilds always require approval
                });
              }
            }}
            trackColor={{ false: theme.border, true: theme.success + '40' }}
            thumbColor={currentGuild?.isOpen ? theme.success : theme.textSecondary}
          />
        </View>
        
        {currentGuild?.isOpen && (
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
                Require Approval
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Review join requests before accepting members
              </Text>
            </View>
            <Switch
              value={currentGuild?.requiresApproval ?? false}
              onValueChange={async (value) => {
                if (currentGuild) {
                  await updateGuildSettings(currentGuild.id, { requiresApproval: value });
                }
              }}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={currentGuild?.requiresApproval ? theme.primary : theme.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Guild Information */}
      <View style={[styles.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.settingsCardTitle, { color: theme.textPrimary }]}>
          Guild Information
        </Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
              Maximum Members
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Current: {currentGuild?.memberCount || 0} / {currentGuild?.maxMembers || 0}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
            onPress={() => CustomAlertService.showError('Edit Max Members', 'Feature coming soon')}
          >
            <Text style={[styles.settingButtonText, { color: theme.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>
              Minimum Rank Required
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              {currentGuild?.minRankRequired || 'G'} and above
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
            onPress={() => CustomAlertService.showError('Edit Rank Requirement', 'Feature coming soon')}
          >
            <Text style={[styles.settingButtonText, { color: theme.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Join Requests (for closed guilds or open guilds with approval) */}
      {(!currentGuild?.isOpen || currentGuild?.requiresApproval) && (
        <View style={[styles.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.settingsCardTitle, { color: theme.textPrimary }]}>
            Join Requests ({guildJoinRequests.filter(req => req.status === 'pending').length})
          </Text>
          
          {guildJoinRequests.filter(req => req.status === 'pending').length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-add-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                No pending join requests
              </Text>
            </View>
          ) : (
            guildJoinRequests
              .filter(req => req.status === 'pending')
              .map(request => (
                <View key={request.id} style={styles.joinRequestItem}>
                  <View style={styles.joinRequestInfo}>
                    <Text style={[styles.joinRequestName, { color: theme.textPrimary }]}>
                      {request.userName}
                    </Text>
                    <Text style={[styles.joinRequestRank, { color: theme.textSecondary }]}>
                      Rank: {request.userRank}
                    </Text>
                    {request.message && (
                      <Text style={[styles.joinRequestMessage, { color: theme.textSecondary }]}>
                        "{request.message}"
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.joinRequestActions}>
                    <TouchableOpacity
                      style={[styles.joinRequestButton, { backgroundColor: theme.success }]}
                      onPress={() => respondToJoinRequest(request.id, 'approve')}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.joinRequestButton, { backgroundColor: theme.error }]}
                      onPress={() => respondToJoinRequest(request.id, 'reject')}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
          )}
        </View>
      )}

      {/* Danger Zone */}
      <View style={[styles.settingsCard, { backgroundColor: theme.error + '10', borderColor: theme.error }]}>
        <Text style={[styles.settingsCardTitle, { color: theme.error }]}>
          Danger Zone
        </Text>
        
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
          onPress={() => CustomAlertService.showError(
            'Delete Guild',
            'Are you sure you want to permanently delete this guild? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => {
                CustomAlertService.showError('Guild Deleted', 'Your guild has been permanently deleted.');
              }}
            ]
          )}
        >
          <Ionicons name="trash-outline" size={20} color={theme.error} />
          <Text style={[styles.dangerButtonText, { color: theme.error }]}>
            Delete Guild
          </Text>
        </TouchableOpacity>
      </View>
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

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'active': return '#3B82F6';
      case 'completed': return '#06B6D4';
      case 'pending_votes': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleTabPress = (tabKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tabKey as any);
  };

  const handleActionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              setSelectedTab('settings');
            }}
          >
            <Ionicons name="settings-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Guild Master Dashboard
        </Text>
      </View>

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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {[
              { key: 'dashboard', label: 'Dashboard', icon: 'analytics-outline', badge: null },
              { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline', badge: guildJobs.length },
              { key: 'contracts', label: 'Contracts', icon: 'document-text-outline', badge: activeContracts.length },
              { key: 'vault', label: 'Vault', icon: 'wallet-outline', badge: null },
              { key: 'members', label: 'Members', icon: 'people-outline', badge: currentGuild?.memberCount },
              { key: 'court', label: isRTL ? 'المحكمة' : 'Court', icon: 'hammer-outline', badge: 3 }, // Mock badge for active disputes
              { key: 'settings', label: 'Settings', icon: 'settings-outline', badge: guildJoinRequests.filter(req => req.status === 'pending').length || null },
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
          </ScrollView>
        </Animated.View>

        {/* Tab Content */}
        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'jobs' && renderJobs()}
        {selectedTab === 'contracts' && renderContracts()}
        {selectedTab === 'vault' && renderVault()}
        {selectedTab === 'members' && renderMembers()}
        {selectedTab === 'court' && renderCourt()}
        {selectedTab === 'settings' && renderSettings()}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* Job Creation Modal */}
      <Modal
        visible={showJobModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ModalHeader
            title="Create Guild Job"
            onBack={() => setShowJobModal(false)}
          />
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Job Title *
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={jobForm.title}
                onChangeText={(text) => setJobForm({ ...jobForm, title: text })}
                placeholder="Enter job title"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Description *
              </Text>
              <TextInput
                style={[styles.formTextArea, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={jobForm.description}
                onChangeText={(text) => setJobForm({ ...jobForm, description: text })}
                placeholder="Enter job description"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Budget (QAR)
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={jobForm.totalBudget}
                  onChangeText={(text) => setJobForm({ ...jobForm, totalBudget: text })}
                  placeholder="25000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Duration
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={jobForm.estimatedDuration}
                  onChangeText={(text) => setJobForm({ ...jobForm, estimatedDuration: text })}
                  placeholder="3 weeks"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Max Participants
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={jobForm.maxParticipants}
                  onChangeText={(text) => setJobForm({ ...jobForm, maxParticipants: text })}
                  placeholder="4"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Client Name
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={jobForm.clientName}
                  onChangeText={(text) => setJobForm({ ...jobForm, clientName: text })}
                  placeholder="Client Company"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
            
            {/* Member Assignment Section */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Assign to Members (Optional)
              </Text>
              <Text style={[styles.formDescription, { color: theme.textSecondary }]}>
                Select specific guild members for this job. Leave empty to make it available to all members.
              </Text>
              
              <View style={styles.memberSelectionContainer}>
                {/* Mock guild members - in real app, get from guild context */}
                {[
                  { id: 'member1', name: 'Ahmed Al-Rashid', rank: 'A', level: 1, avatar: '👨‍💻' },
                  { id: 'member2', name: 'Sarah Johnson', rank: 'B', level: 2, avatar: '👩‍🎨' },
                  { id: 'member3', name: 'Mohammed Hassan', rank: 'A', level: 1, avatar: '👨‍🔧' },
                  { id: 'member4', name: 'Lisa Chen', rank: 'C', level: 3, avatar: '👩‍💼' },
                ].map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberSelectionItem,
                      { 
                        backgroundColor: jobForm.assignedMembers.includes(member.id) ? theme.primary + '20' : theme.surface,
                        borderColor: jobForm.assignedMembers.includes(member.id) ? theme.primary : theme.border
                      }
                    ]}
                    onPress={() => {
                      handleActionPress();
                      const isSelected = jobForm.assignedMembers.includes(member.id);
                      if (isSelected) {
                        setJobForm({
                          ...jobForm,
                          assignedMembers: jobForm.assignedMembers.filter(id => id !== member.id)
                        });
                      } else {
                        setJobForm({
                          ...jobForm,
                          assignedMembers: [...jobForm.assignedMembers, member.id]
                        });
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.memberSelectionInfo}>
                      <Text style={styles.memberAvatar}>{member.avatar}</Text>
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberName, { color: theme.textPrimary }]}>
                          {member.name}
                        </Text>
                        <View style={styles.memberMeta}>
                          <View style={[styles.rankBadge, { backgroundColor: theme.primary + '30' }]}>
                            <Text style={[styles.rankText, { color: theme.primary }]}>
                              Rank {member.rank}
                            </Text>
                          </View>
                          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(member.level) + '30' }]}>
                            <Text style={[styles.levelText, { color: getLevelColor(member.level) }]}>
                              Level {member.level}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    <View style={[
                      styles.selectionIndicator,
                      { 
                        backgroundColor: jobForm.assignedMembers.includes(member.id) ? theme.primary : 'transparent',
                        borderColor: theme.border
                      }
                    ]}>
                      {jobForm.assignedMembers.includes(member.id) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                
                {jobForm.assignedMembers.length > 0 && (
                  <TouchableOpacity
                    style={[styles.clearSelectionButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
                    onPress={() => {
                      handleActionPress();
                      setJobForm({ ...jobForm, assignedMembers: [] });
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={theme.error} />
                    <Text style={[styles.clearSelectionText, { color: theme.error }]}>
                      Clear Selection ({jobForm.assignedMembers.length} selected)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateJob}
            >
              <Text style={[styles.createButtonText, { color: theme.buttonText }]}>
                Create Guild Job
                {jobForm.assignedMembers.length > 0 && ` (${jobForm.assignedMembers.length} assigned)`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Contract Creation Modal */}
      <Modal
        visible={showContractModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ModalHeader
            title="Create Contract"
            onBack={() => setShowContractModal(false)}
          />
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Create a contract for the selected job. Members will vote to approve the terms and profit distribution.
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Guild Master Share (%)
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={contractForm.guildMasterShare}
                onChangeText={(text) => setContractForm({ ...contractForm, guildMasterShare: text })}
                placeholder="25"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Guild Vault Share (%)
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={contractForm.guildVaultShare}
                onChangeText={(text) => setContractForm({ ...contractForm, guildVaultShare: text })}
                placeholder="15"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Equal Split Among Members
                </Text>
                <Switch
                  value={contractForm.equalSplit}
                  onValueChange={(value) => setContractForm({ ...contractForm, equalSplit: value })}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={contractForm.equalSplit ? theme.primary : theme.textSecondary}
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateContract}
            >
              <Text style={[styles.createButtonText, { color: theme.buttonText }]}>
                Create Contract
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Vault Transaction Modal */}
      <Modal
        visible={showVaultModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ModalHeader
            title="Vault Transaction"
            onBack={() => setShowVaultModal(false)}
          />
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Transaction Type
              </Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    vaultForm.type === 'deposit' && { backgroundColor: theme.primary },
                    { borderColor: theme.primary }
                  ]}
                  onPress={() => setVaultForm({ ...vaultForm, type: 'deposit' })}
                >
                  <Text style={[
                    styles.segmentText,
                    { color: vaultForm.type === 'deposit' ? theme.buttonText : theme.primary }
                  ]}>
                    Deposit
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    vaultForm.type === 'withdrawal' && { backgroundColor: theme.primary },
                    { borderColor: theme.primary }
                  ]}
                  onPress={() => setVaultForm({ ...vaultForm, type: 'withdrawal' })}
                >
                  <Text style={[
                    styles.segmentText,
                    { color: vaultForm.type === 'withdrawal' ? theme.buttonText : theme.primary }
                  ]}>
                    Withdrawal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Amount (QAR)
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={vaultForm.amount}
                onChangeText={(text) => setVaultForm({ ...vaultForm, amount: text })}
                placeholder="5000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Description
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                value={vaultForm.description}
                onChangeText={(text) => setVaultForm({ ...vaultForm, description: text })}
                placeholder="Transaction description"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: vaultForm.type === 'deposit' ? theme.success : theme.warning }]}
              onPress={handleVaultTransaction}
            >
              <Text style={[styles.createButtonText, { color: 'white' }]}>
                {vaultForm.type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ModalHeader
            title="Invite Member by User ID"
            onBack={() => setShowInviteModal(false)}
          />
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Invite a user to join your guild by entering their User ID. You can set their initial role and level.
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                User ID *
              </Text>
              <TextInput
                style={[styles.formInput, { 
                  backgroundColor: theme.surface, 
                  color: getAdaptiveTextColor(theme.surface, theme, theme.textPrimary), 
                  borderColor: theme.border + '80' 
                }]}
                value={inviteForm.userId}
                onChangeText={(text) => setInviteForm(prev => ({ ...prev, userId: text }))}
                placeholder="Enter User ID (e.g., USER123456)"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Initial Role
              </Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleSelectorButton,
                    { 
                      backgroundColor: inviteForm.role === 'member' ? theme.primary + '20' : theme.surface,
                      borderColor: inviteForm.role === 'member' ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => setInviteForm(prev => ({ ...prev, role: 'member' }))}
                >
                  <Text style={[
                    styles.roleSelectorText,
                    { color: inviteForm.role === 'member' ? theme.primary : theme.textPrimary }
                  ]}>
                    Member
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleSelectorButton,
                    { 
                      backgroundColor: inviteForm.role === 'vice_master' ? theme.primary + '20' : theme.surface,
                      borderColor: inviteForm.role === 'vice_master' ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => setInviteForm(prev => ({ ...prev, role: 'vice_master' }))}
                >
                  <Text style={[
                    styles.roleSelectorText,
                    { color: inviteForm.role === 'vice_master' ? theme.primary : theme.textPrimary }
                  ]}>
                    Vice Master
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {inviteForm.role === 'member' && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                  Member Level
                </Text>
                <View style={styles.levelSelector}>
                  {[1, 2, 3].map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelSelectorButton,
                        { 
                          backgroundColor: inviteForm.level === level ? theme.primary + '20' : theme.surface,
                          borderColor: inviteForm.level === level ? theme.primary : theme.border,
                        }
                      ]}
                      onPress={() => setInviteForm(prev => ({ ...prev, level }))}
                    >
                      <Text style={[
                        styles.levelSelectorText,
                        { color: inviteForm.level === level ? theme.primary : theme.textPrimary }
                      ]}>
                        Level {level}
                      </Text>
                      <Text style={[
                        styles.levelDescription,
                        { color: inviteForm.level === level ? theme.primary : theme.textSecondary }
                      ]}>
                        {level === 1 ? 'Senior' : level === 2 ? 'Regular' : 'Junior'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Invitation Message (Optional)
              </Text>
              <TextInput
                style={[styles.formTextArea, { 
                  backgroundColor: theme.surface, 
                  color: getAdaptiveTextColor(theme.surface, theme, theme.textPrimary), 
                  borderColor: theme.border + '80' 
                }]}
                value={inviteForm.message}
                onChangeText={(text) => setInviteForm(prev => ({ ...prev, message: text }))}
                placeholder="Add a personal message to your invitation..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={handleInviteByUserId}
            >
              <Text style={[styles.createButtonText, { 
                color: getAdaptiveTextColor(theme.primary, theme, theme.buttonText) 
              }]}>
                Send Invitation
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
  },
  tabScrollContent: {
    paddingHorizontal: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    whiteSpace: 'nowrap',
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
    fontSize: 20,
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
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginTop: 4,
    textAlign: 'center',
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
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
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  jobActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  jobActionText: {
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
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    flex: 1,
    marginRight: 12,
  },
  contractStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contractStatusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
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
  contractProgress: {
    marginBottom: 16,
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
  profitDistribution: {
    gap: 8,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  distributionDetails: {
    gap: 4,
  },
  distributionText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  vaultOverview: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  vaultGradient: {
    padding: 20,
  },
  vaultTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  vaultBalance: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 20,
  },
  vaultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vaultStatItem: {
    alignItems: 'center',
  },
  vaultStatValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  vaultStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginTop: 4,
    textAlign: 'center',
  },
  fundCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fundCategoryCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  fundCategoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginTop: 8,
    textAlign: 'center',
  },
  fundCategoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginTop: 4,
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
  memberJoinDate: {
    fontSize: 12,
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
    textAlign: 'center',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  memberActionText: {
    fontSize: 11,
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
  modalDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 20,
    lineHeight: 20,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
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
  // Settings Styles
  settingsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    opacity: 0.8,
  },
  settingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  joinRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  joinRequestInfo: {
    flex: 1,
    marginRight: 16,
  },
  joinRequestName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  joinRequestRank: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  joinRequestMessage: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    fontStyle: 'italic',
  },
  joinRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinRequestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginTop: 12,
    textAlign: 'center',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guildInfo: {
    flex: 1,
  },
  guildName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: 'white',
    marginBottom: 2,
  },
  masterTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  guildStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statItemHeader: {
    alignItems: 'center',
  },
  statValueHeader: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: 'white',
  },
  statLabelHeader: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
  },
  enhancedTabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    minWidth: 80,
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
  // Member Selection Styles
  formDescription: {
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
    lineHeight: 18,
  },
  memberSelectionContainer: {
    gap: 8,
  },
  memberSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  memberSelectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  clearSelectionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  contractProtectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  contractProtectionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleSelectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  levelSelector: {
    gap: 8,
  },
  levelSelectorButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  levelSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 2,
  },
  levelDescription: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  // Court styles
  courtStatsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  courtStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  courtStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  courtStatValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  courtStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  disputeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  disputeInfo: {
    flex: 1,
    marginRight: 12,
  },
  disputeTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  disputeAmount: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  disputeStatusContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  disputeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  disputeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  disputePriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  disputePriorityText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  disputeParties: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  disputeParty: {
    flex: 1,
    alignItems: 'center',
  },
  disputePartyLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  disputePartyName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  disputeDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
    marginBottom: 16,
  },
  jurySection: {
    marginBottom: 16,
  },
  jurySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  juryMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  juryMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  juryMemberName: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  evidenceSection: {
    marginBottom: 16,
  },
  evidenceSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 8,
  },
  evidenceList: {
    gap: 8,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  evidenceText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  disputeActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  disputeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  disputeActionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  resolutionSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resolutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  resolutionText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    lineHeight: 20,
    marginBottom: 8,
  },
  resolutionDate: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  courtRulesSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  courtRulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  courtRulesList: {
    gap: 12,
  },
  courtRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courtRuleText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    flex: 1,
    lineHeight: 20,
  },
});
