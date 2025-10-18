import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Users, Search, Shield, Crown, Star, UserPlus, UserMinus, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { useCustomAlert } from '../../components/CustomAlert';
import { GuildMember, GuildRole, MemberLevel } from '../../utils/guildSystem';

interface MemberWithDetails extends GuildMember {
  name: string;
  avatar?: string;
  lastActive: Date;
  joinedDate: Date;
  completedJobs: number;
  rating: number;
}

type TabType = 'members' | 'invitations' | 'requests';

export default function MemberManagement() {
  const { top, bottom } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { currentGuild, currentMembership, sendGuildInvitation, respondToJoinRequest } = useGuild();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberWithDetails[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithDetails | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<GuildRole>('Member');
  const [inviteLevel, setInviteLevel] = useState<MemberLevel>(3);

  // Check permissions
  const canManageMembers = currentMembership?.role === 'Guild Master' || currentMembership?.role === 'Vice Master';
  const canAssignRoles = currentMembership?.role === 'Guild Master';

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockMembers: MemberWithDetails[] = [
        {
          userId: '1',
          guildId: currentGuild?.id || '',
          role: 'Guild Master',
          level: 1,
          joinedAt: new Date('2024-01-15'),
          name: 'Ahmed Al-Rashid',
          lastActive: new Date(),
          joinedDate: new Date('2024-01-15'),
          completedJobs: 45,
          rating: 4.9,
        },
        {
          userId: '2',
          guildId: currentGuild?.id || '',
          role: 'Vice Master',
          level: 1,
          joinedAt: new Date('2024-02-01'),
          name: 'Sarah Johnson',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          joinedDate: new Date('2024-02-01'),
          completedJobs: 32,
          rating: 4.8,
        },
        {
          userId: '3',
          guildId: currentGuild?.id || '',
          role: 'Member',
          level: 2,
          joinedAt: new Date('2024-03-10'),
          name: 'Mohammed Hassan',
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          joinedDate: new Date('2024-03-10'),
          completedJobs: 18,
          rating: 4.6,
        },
        {
          userId: '4',
          guildId: currentGuild?.id || '',
          role: 'Member',
          level: 3,
          joinedAt: new Date('2024-04-05'),
          name: 'Lisa Chen',
          lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          joinedDate: new Date('2024-04-05'),
          completedJobs: 8,
          rating: 4.4,
        },
      ];

      setMembers(mockMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      showAlert('error', 'Error', 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTabChange = async (tab: TabType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      showAlert('error', 'Validation Error', 'Please enter an email address');
      return;
    }

    try {
      await sendGuildInvitation(
        currentGuild?.id || '',
        inviteEmail, // In real app, this would be userId
        inviteRole,
        inviteLevel,
        `You've been invited to join ${currentGuild?.name}`
      );
      
      showAlert('success', 'Success!', 'Invitation sent successfully');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('Member');
      setInviteLevel(3);
    } catch (error) {
      console.error('Error sending invitation:', error);
      showAlert('error', 'Error', 'Failed to send invitation');
    }
  };

  const handleRoleChange = async (newRole: GuildRole, newLevel?: MemberLevel) => {
    if (!selectedMember) return;

    try {
      // Mock role change - replace with actual API call
      const updatedMembers = members.map(member => 
        member.userId === selectedMember.userId 
          ? { ...member, role: newRole, level: newLevel || member.level }
          : member
      );
      
      setMembers(updatedMembers);
      showAlert('success', 'Success!', 'Member role updated successfully');
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error updating role:', error);
      showAlert('error', 'Error', 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (member: MemberWithDetails) => {
    CustomAlertService.showConfirmation(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the guild?`,
      async () => {
        try {
          const updatedMembers = members.filter(m => m.userId !== member.userId);
          setMembers(updatedMembers);
          showAlert('success', 'Success!', 'Member removed from guild');
        } catch (error) {
          console.error('Error removing member:', error);
          showAlert('error', 'Error', 'Failed to remove member');
        }
      },
      undefined,
      isRTL
    );
  };

  const getFilteredMembers = () => {
    return members.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: GuildRole) => {
    switch (role) {
      case 'Guild Master': return '#FFD700';
      case 'Vice Master': return '#C0C0C0';
      default: return theme.primary;
    }
  };

  const renderMemberItem = ({ item: member }: { item: MemberWithDetails }) => (
    <View style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, { color: theme.textPrimary }]}>
              {member.name}
            </Text>
            <View style={styles.memberMeta}>
              <View style={[styles.roleChip, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                  {member.role}
                </Text>
              </View>
              <Text style={[styles.levelText, { color: theme.textSecondary }]}>
                Level {member.level}
              </Text>
            </View>
            <Text style={[styles.lastActive, { color: theme.textSecondary }]}>
              {formatLastActive(member.lastActive)}
            </Text>
          </View>
        </View>
        
        {canManageMembers && member.role !== 'Guild Master' && (
          <View style={styles.memberActions}>
            {canAssignRoles && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => {
                  setSelectedMember(member);
                  setShowRoleModal(true);
                }}
              >
                <Ionicons name="settings" size={16} color={theme.primary} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F44336' + '20' }]}
              onPress={() => handleRemoveMember(member)}
            >
              <Ionicons name="trash" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.memberStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>
            {member.completedJobs}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Jobs
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>
              {member.rating}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Rating
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>
            {Math.floor((new Date().getTime() - member.joinedDate.getTime()) / (1000 * 60 * 60 * 24))}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Days
          </Text>
        </View>
      </View>
    </View>
  );

  const renderInviteModal = () => (
    <Modal
      visible={showInviteModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInviteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Invite Member
            </Text>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Email Address
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.textPrimary 
                }]}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="Enter email address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Role
              </Text>
              <View style={styles.roleSelector}>
                {(['Member', 'Vice Master'] as GuildRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor: inviteRole === role ? theme.primary : theme.background,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => setInviteRole(role)}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      { color: inviteRole === role ? '#000' : theme.textPrimary }
                    ]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                Level
              </Text>
              <View style={styles.levelSelector}>
                {[1, 2, 3].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelOption,
                      {
                        backgroundColor: inviteLevel === level ? theme.primary : theme.background,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => setInviteLevel(level as MemberLevel)}
                  >
                    <Text style={[
                      styles.levelOptionText,
                      { color: inviteLevel === level ? '#000' : theme.textPrimary }
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.inviteButton, { backgroundColor: theme.primary }]}
              onPress={handleInviteMember}
            >
              <Text style={styles.inviteButtonText}>
                Send Invite
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderRoleModal = () => (
    <Modal
      visible={showRoleModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRoleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Change Role: {selectedMember?.name}
            </Text>
            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
              Select New Role
            </Text>
            
            {(['Member', 'Vice Master'] as GuildRole[]).map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleChangeOption, { borderColor: theme.border }]}
                onPress={() => handleRoleChange(role, role === 'Vice Master' ? 1 : 3)}
              >
                <View style={styles.roleChangeInfo}>
                  <Text style={[styles.roleChangeName, { color: theme.textPrimary }]}>
                    {role}
                  </Text>
                  <Text style={[styles.roleChangeDescription, { color: theme.textSecondary }]}>
                    {role === 'Vice Master' 
                      ? 'Can manage members and moderate guild'
                      : 'Standard guild member with basic permissions'
                    }
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: top + 10,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    inviteButton: {
      padding: 8,
    },
    tabContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    activeTabText: {
      color: '#000',
    },
    inactiveTabText: {
      color: theme.textSecondary,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    searchInput: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.textPrimary,
    },
    content: {
      flex: 1,
    },
    membersList: {
      paddingHorizontal: 20,
      paddingBottom: bottom + 20,
    },
    memberCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    memberHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    memberInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flex: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    memberDetails: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    memberMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    roleChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '500',
    },
    levelText: {
      fontSize: 12,
    },
    lastActive: {
      fontSize: 12,
    },
    memberActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberStats: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      borderRadius: 16,
      padding: 20,
    },
    modalHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    modalBody: {
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    roleSelector: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 8,
    },
    roleOption: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    roleOptionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    levelSelector: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 8,
    },
    levelOption: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    levelOptionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    modalFooter: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      borderWidth: 1,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    inviteButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#000',
    },
    roleChangeOption: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 8,
    },
    roleChangeInfo: {
      flex: 1,
    },
    roleChangeName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    roleChangeDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  if (!canManageMembers) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons 
                name={isRTL ? "chevron-forward" : "chevron-back"} 
                size={24} 
                color={theme.textPrimary} 
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t('guildManagement.memberManagement.title')}
            </Text>
          </View>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed" size={64} color={theme.textSecondary} />
          <Text style={styles.emptyText}>
            You don't have permission to manage guild members. Only Guild Masters and Vice Masters can access this feature.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertComponent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons 
              name={isRTL ? "chevron-forward" : "chevron-back"} 
              size={24} 
              color={theme.textPrimary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('guildManagement.memberManagement.title')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
        >
          <Ionicons name="person-add" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'members' ? styles.activeTab : styles.inactiveTab
          ]}
          onPress={() => handleTabChange('members')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'members' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Members ({members.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'invitations' ? styles.activeTab : styles.inactiveTab
          ]}
          onPress={() => handleTabChange('invitations')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'invitations' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Invitations (2)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'requests' ? styles.activeTab : styles.inactiveTab
          ]}
          onPress={() => handleTabChange('requests')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'requests' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Requests (1)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      {activeTab === 'members' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members..."
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      )}

      {/* Content */}
      <FlatList
        style={styles.content}
        contentContainerStyle={styles.membersList}
        data={getFilteredMembers()}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.userId}
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      {renderInviteModal()}
      {renderRoleModal()}
    </View>
  );
}

