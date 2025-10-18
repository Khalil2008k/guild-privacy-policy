import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { ArrowLeft, Scale, Shield, AlertTriangle, CheckCircle, XCircle, FileText, Gavel } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface Dispute {
  id: string;
  title: string;
  plaintiff: string;
  defendant: string;
  amount: number;
  status: 'pending_jury' | 'in_voting' | 'resolved' | 'appealed';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  description: string;
  evidence: string[];
  juryMembers?: string[];
  votingDeadline?: string;
  votes?: Record<string, 'plaintiff' | 'defendant' | null>;
  resolution?: string;
  resolvedAt?: string;
  caseNumber: string;
  category: 'payment' | 'quality' | 'deadline' | 'contract_breach' | 'other';
}

export default function GuildCourtScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'voting' | 'resolved'>('all');
  const [showNewDisputeModal, setShowNewDisputeModal] = useState(false);

  // Mock disputes data
  const disputes: Dispute[] = [
    {
      id: 'dispute_001',
      caseNumber: 'GC-2025-001',
      title: 'Payment Dispute - E-commerce Platform Development',
      plaintiff: 'Ahmed Al-Rashid',
      defendant: 'TechCorp Solutions',
      amount: 25000,
      status: 'pending_jury',
      priority: 'high',
      category: 'payment',
      createdAt: '2025-09-15',
      description: 'Client refusing to pay final milestone payment despite project completion and approval. All deliverables were submitted on time and meet the agreed specifications.',
      evidence: ['signed_contract.pdf', 'project_approval_email.png', 'completed_deliverables.zip', 'client_feedback.pdf'],
      votingDeadline: '2025-09-25',
    },
    {
      id: 'dispute_002',
      caseNumber: 'GC-2025-002',
      title: 'Quality Dispute - Mobile App UI/UX Design',
      plaintiff: 'Digital Innovations LLC',
      defendant: 'Sara Hassan',
      amount: 12000,
      status: 'in_voting',
      priority: 'medium',
      category: 'quality',
      createdAt: '2025-09-12',
      description: 'Design quality allegedly does not meet agreed specifications. Client claims designs are not responsive and lack modern UI elements.',
      evidence: ['design_brief.pdf', 'delivered_designs.zip', 'client_requirements.docx'],
      juryMembers: ['Omar Khalil', 'Layla Ahmed', 'Hassan Omar'],
      votingDeadline: '2025-09-22',
      votes: { 'Omar Khalil': 'defendant', 'Layla Ahmed': null, 'Hassan Omar': null }
    },
    {
      id: 'dispute_003',
      caseNumber: 'GC-2025-003',
      title: 'Deadline Dispute - Content Writing Project',
      plaintiff: 'StartupHub Qatar',
      defendant: 'Mike Chen',
      amount: 4500,
      status: 'resolved',
      priority: 'low',
      category: 'deadline',
      createdAt: '2025-09-08',
      description: 'Project delivered 7 days after agreed deadline without prior communication or approval for extension.',
      evidence: ['project_timeline.pdf', 'communication_log.txt', 'delivery_confirmation.png'],
      juryMembers: ['Ahmed Al-Rashid', 'Sara Hassan', 'Omar Khalil'],
      votingDeadline: '2025-09-18',
      resolution: 'Partial payment (75%) awarded to freelancer. 25% penalty for late delivery as per contract terms.',
      resolvedAt: '2025-09-18'
    }
  ];

  const filteredDisputes = disputes.filter(dispute => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return dispute.status === 'pending_jury';
    if (selectedFilter === 'voting') return dispute.status === 'in_voting';
    if (selectedFilter === 'resolved') return dispute.status === 'resolved';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_jury': return theme.warning;
      case 'in_voting': return theme.info;
      case 'resolved': return theme.success;
      case 'appealed': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.error;
      case 'medium': return theme.warning;
      case 'low': return theme.info;
      default: return theme.textSecondary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return 'cash-outline';
      case 'quality': return 'star-outline';
      case 'deadline': return 'time-outline';
      case 'contract_breach': return 'document-text-outline';
      default: return 'alert-circle-outline';
    }
  };

  const handleFileDispute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    CustomAlertService.showConfirmation(
      isRTL ? 'رفع نزاع جديد' : 'File New Dispute',
      isRTL ? 'هل تريد رفع نزاع جديد؟ سيتم توجيهك إلى نموذج رفع النزاع.' : 'Do you want to file a new dispute? You will be directed to the dispute filing form.',
      () => {
        setShowNewDisputeModal(true);
      },
      undefined,
      isRTL
    );
  };

  const handleVoteOnDispute = (disputeId: string, vote: 'plaintiff' | 'defendant') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    CustomAlertService.showConfirmation(
      isRTL ? 'تأكيد التصويت' : 'Confirm Vote',
      isRTL ? `هل تريد التصويت لصالح ${vote === 'plaintiff' ? 'المدعي' : 'المدعى عليه'}؟` : `Do you want to vote in favor of the ${vote}?`,
      () => {
        console.log('Vote submitted:', disputeId, vote);
        CustomAlertService.showSuccess(
          isRTL ? 'تم التصويت' : 'Vote Submitted',
          isRTL ? 'تم تسجيل تصويتك بنجاح' : 'Your vote has been recorded successfully'
        );
      },
      undefined,
      isRTL
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
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
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="hammer" size={28} color="#000000" />
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {isRTL ? 'محكمة النقابة' : 'Guild Court'}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: '#000000CC' }]}>
            {isRTL ? 'نظام العدالة والنزاعات' : 'Justice & Dispute Resolution'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.fileDisputeButton}
          onPress={handleFileDispute}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#000000" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: isRTL ? 'الكل' : 'All', count: disputes.length },
            { key: 'pending', label: isRTL ? 'في الانتظار' : 'Pending', count: disputes.filter(d => d.status === 'pending_jury').length },
            { key: 'voting', label: isRTL ? 'في التصويت' : 'Voting', count: disputes.filter(d => d.status === 'in_voting').length },
            { key: 'resolved', label: isRTL ? 'محلولة' : 'Resolved', count: disputes.filter(d => d.status === 'resolved').length },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter.key ? theme.primary : 'transparent',
                  borderColor: selectedFilter === filter.key ? theme.primary : theme.border,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(filter.key as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                { color: selectedFilter === filter.key ? '#000000' : theme.textSecondary }
              ]}>
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  { backgroundColor: selectedFilter === filter.key ? '#000000' : theme.primary }
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    { color: selectedFilter === filter.key ? theme.primary : '#000000' }
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Court Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.statValue, { color: theme.warning }]}>
              {disputes.filter(d => d.status === 'pending_jury').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'في الانتظار' : 'Pending'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.statValue, { color: theme.info }]}>
              {disputes.filter(d => d.status === 'in_voting').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'في التصويت' : 'Voting'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {disputes.filter(d => d.status === 'resolved').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'محلولة' : 'Resolved'}
            </Text>
          </View>
        </View>
      </View>

      {/* Disputes List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredDisputes.map((dispute) => (
          <View key={dispute.id} style={[styles.disputeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Case Header */}
            <View style={styles.caseHeader}>
              <View style={styles.caseInfo}>
                <View style={styles.caseNumberContainer}>
                  <Ionicons name={getCategoryIcon(dispute.category)} size={16} color={theme.primary} />
                  <Text style={[styles.caseNumber, { color: theme.primary }]}>
                    {dispute.caseNumber}
                  </Text>
                </View>
                <Text style={[styles.disputeTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                  {dispute.title}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(dispute.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(dispute.status) }
                  ]}>
                    {dispute.status === 'pending_jury' ? (isRTL ? 'في الانتظار' : 'Pending') :
                     dispute.status === 'in_voting' ? (isRTL ? 'في التصويت' : 'Voting') :
                     (isRTL ? 'محلولة' : 'Resolved')}
                  </Text>
                </View>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(dispute.priority) + '20' }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    { color: getPriorityColor(dispute.priority) }
                  ]}>
                    {dispute.priority === 'high' ? (isRTL ? 'عالي' : 'High') :
                     dispute.priority === 'medium' ? (isRTL ? 'متوسط' : 'Medium') :
                     (isRTL ? 'منخفض' : 'Low')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
              <Ionicons name="cash" size={20} color={theme.primary} />
              <Text style={[styles.disputeAmount, { color: theme.primary }]}>
                QR {dispute.amount.toLocaleString()}
              </Text>
            </View>

            {/* Parties */}
            <View style={styles.partiesContainer}>
              <View style={styles.party}>
                <Text style={[styles.partyLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'المدعي:' : 'Plaintiff:'}
                </Text>
                <Text style={[styles.partyName, { color: theme.textPrimary }]}>
                  {dispute.plaintiff}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={theme.textSecondary} />
              <View style={styles.party}>
                <Text style={[styles.partyLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'المدعى عليه:' : 'Defendant:'}
                </Text>
                <Text style={[styles.partyName, { color: theme.textPrimary }]}>
                  {dispute.defendant}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={[styles.disputeDescription, { color: theme.textSecondary }]} numberOfLines={3}>
              {dispute.description}
            </Text>

            {/* Evidence Count */}
            {dispute.evidence && dispute.evidence.length > 0 && (
              <View style={styles.evidenceContainer}>
                <Ionicons name="folder-outline" size={16} color={theme.info} />
                <Text style={[styles.evidenceText, { color: theme.info }]}>
                  {dispute.evidence.length} {isRTL ? 'دليل مرفق' : 'Evidence Files'}
                </Text>
              </View>
            )}

            {/* Voting Section (for in_voting status) */}
            {dispute.status === 'in_voting' && dispute.juryMembers && (
              <View style={[styles.votingSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.votingSectionTitle, { color: theme.textPrimary }]}>
                  {isRTL ? 'التصويت الجاري' : 'Active Voting'}
                </Text>
                <View style={styles.juryProgress}>
                  {dispute.juryMembers.map((member, index) => (
                    <View key={index} style={styles.juryMemberVote}>
                      <Text style={[styles.juryMemberName, { color: theme.textPrimary }]}>
                        {member}
                      </Text>
                      <Ionicons 
                        name={dispute.votes?.[member] ? "checkmark-circle" : "time-outline"} 
                        size={16} 
                        color={dispute.votes?.[member] ? theme.success : theme.warning} 
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    style={[styles.voteButton, { backgroundColor: theme.success + '20', borderColor: theme.success }]}
                    onPress={() => handleVoteOnDispute(dispute.id, 'plaintiff')}
                  >
                    <Text style={[styles.voteButtonText, { color: theme.success }]}>
                      {isRTL ? 'لصالح المدعي' : 'For Plaintiff'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voteButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
                    onPress={() => handleVoteOnDispute(dispute.id, 'defendant')}
                  >
                    <Text style={[styles.voteButtonText, { color: theme.error }]}>
                      {isRTL ? 'لصالح المدعى عليه' : 'For Defendant'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Resolution (for resolved status) */}
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

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  console.log('View dispute details:', dispute.id);
                }}
              >
                <Ionicons name="eye-outline" size={16} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                  {isRTL ? 'عرض التفاصيل' : 'View Details'}
                </Text>
              </TouchableOpacity>
              
              {dispute.status === 'resolved' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning, borderWidth: 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    CustomAlertService.showConfirmation(
                      isRTL ? 'استئناف القرار' : 'Appeal Decision',
                      isRTL ? 'هل تريد استئناف هذا القرار؟' : 'Do you want to appeal this decision?',
                      () => console.log('Appeal dispute:', dispute.id),
                      undefined,
                      isRTL
                    );
                  }}
                >
                  <Ionicons name="refresh-outline" size={16} color={theme.warning} />
                  <Text style={[styles.actionButtonText, { color: theme.warning }]}>
                    {isRTL ? 'استئناف' : 'Appeal'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* New Dispute Modal */}
      <Modal
        visible={showNewDisputeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewDisputeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.newDisputeModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'رفع نزاع جديد' : 'File New Dispute'}
            </Text>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              {isRTL ? 'سيتم توجيهك إلى نموذج رفع النزاع المفصل' : 'You will be directed to the detailed dispute filing form'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setShowNewDisputeModal(false);
                  router.push('/(modals)/dispute-filing-form');
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#000000' }]}>
                  {isRTL ? 'متابعة' : 'Continue'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => setShowNewDisputeModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  fileDisputeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  filterText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  disputeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  caseInfo: {
    flex: 1,
    marginRight: 12,
  },
  caseNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  caseNumber: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  disputeTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  disputeAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
  },
  partiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  party: {
    flex: 1,
    alignItems: 'center',
  },
  partyLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  partyName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disputeDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  evidenceText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  votingSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  votingSectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  juryProgress: {
    gap: 8,
    marginBottom: 12,
  },
  juryMemberVote: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  juryMemberName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  voteButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  resolutionSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resolutionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  resolutionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resolutionDate: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newDisputeModal: {
    width: 320,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
});
