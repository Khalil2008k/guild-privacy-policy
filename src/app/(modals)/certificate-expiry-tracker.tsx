import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, FileText, Calendar, AlertCircle, CheckCircle, XCircle, Plus, Filter } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

const FONT_FAMILY = 'SignikaNegative_400Regular';

type CertificateStatus = 'active' | 'expiring_soon' | 'expired' | 'pending_renewal';
type CertificateType = 'professional' | 'technical' | 'language' | 'safety' | 'license' | 'other';

interface Certificate {
  id: string;
  name: string;
  type: CertificateType;
  issuingOrganization: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: CertificateStatus;
  reminderDays: number;
  documentUrl?: string;
  notes?: string;
  renewalUrl?: string;
  cost?: number;
  currency: string;
}

const SAMPLE_CERTIFICATES: Certificate[] = [
  {
    id: 'cert_1',
    name: 'Project Management Professional (PMP)',
    type: 'professional',
    issuingOrganization: 'Project Management Institute (PMI)',
    certificateNumber: 'PMP-2024-001234',
    issueDate: new Date('2021-03-15'),
    expiryDate: new Date('2024-03-15'),
    status: 'expiring_soon',
    reminderDays: 30,
    cost: 555,
    currency: 'USD',
    notes: 'Requires 60 PDUs for renewal',
    renewalUrl: 'https://pmi.org/renewal'
  },
  {
    id: 'cert_2',
    name: 'AWS Solutions Architect - Professional',
    type: 'technical',
    issuingOrganization: 'Amazon Web Services',
    certificateNumber: 'AWS-SAP-789456',
    issueDate: new Date('2022-06-20'),
    expiryDate: new Date('2025-06-20'),
    status: 'active',
    reminderDays: 60,
    cost: 300,
    currency: 'USD',
    renewalUrl: 'https://aws.amazon.com/certification/'
  },
  {
    id: 'cert_3',
    name: 'IELTS Academic',
    type: 'language',
    issuingOrganization: 'British Council',
    certificateNumber: 'IELTS-2023-567890',
    issueDate: new Date('2023-01-10'),
    expiryDate: new Date('2025-01-10'),
    status: 'active',
    reminderDays: 90,
    cost: 250,
    currency: 'USD'
  },
  {
    id: 'cert_4',
    name: 'Qatar Driving License',
    type: 'license',
    issuingOrganization: 'Qatar Ministry of Interior',
    certificateNumber: 'QDL-2019-123456',
    issueDate: new Date('2019-08-15'),
    expiryDate: new Date('2024-08-15'),
    status: 'expiring_soon',
    reminderDays: 45,
    cost: 200,
    currency: 'QAR',
    notes: 'Medical examination required for renewal'
  },
  {
    id: 'cert_5',
    name: 'OSHA Safety Training',
    type: 'safety',
    issuingOrganization: 'Occupational Safety and Health Administration',
    certificateNumber: 'OSHA-2020-987654',
    issueDate: new Date('2020-11-05'),
    expiryDate: new Date('2023-11-05'),
    status: 'expired',
    reminderDays: 30,
    cost: 150,
    currency: 'USD',
    notes: 'Expired - renewal required for construction projects'
  }
];

export default function CertificateExpiryTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();
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

  // State
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>(SAMPLE_CERTIFICATES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [filterStatus, setFilterStatus] = useState<CertificateStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'status'>('expiry');

  // New certificate form
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    type: 'professional' as CertificateType,
    issuingOrganization: '',
    certificateNumber: '',
    issueDate: new Date(),
    expiryDate: new Date(),
    reminderDays: 30,
    cost: '',
    currency: 'QAR',
    notes: '',
    renewalUrl: ''
  });

  // Calculate certificate status
  const calculateStatus = (expiryDate: Date, reminderDays: number): CertificateStatus => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= reminderDays) return 'expiring_soon';
    return 'active';
  };

  // Update certificate statuses
  useEffect(() => {
    setCertificates(prev => prev.map(cert => ({
      ...cert,
      status: calculateStatus(cert.expiryDate, cert.reminderDays)
    })));
  }, []);

  // Handle add/edit certificate
  const handleSaveCertificate = async () => {
    if (!newCertificate.name || !newCertificate.issuingOrganization) {
      showAlert('Validation Error', 'Please fill in all required fields.', 'warning');
      return;
    }

    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const certificate: Certificate = {
        id: editingCertificate?.id || `cert_${Date.now()}`,
        name: newCertificate.name,
        type: newCertificate.type,
        issuingOrganization: newCertificate.issuingOrganization,
        certificateNumber: newCertificate.certificateNumber,
        issueDate: newCertificate.issueDate,
        expiryDate: newCertificate.expiryDate,
        status: calculateStatus(newCertificate.expiryDate, newCertificate.reminderDays),
        reminderDays: newCertificate.reminderDays,
        cost: newCertificate.cost ? parseFloat(newCertificate.cost) : undefined,
        currency: newCertificate.currency,
        notes: newCertificate.notes || undefined,
        renewalUrl: newCertificate.renewalUrl || undefined
      };

      if (editingCertificate) {
        setCertificates(prev => prev.map(cert => cert.id === editingCertificate.id ? certificate : cert));
        showAlert('Certificate Updated', 'Certificate has been updated successfully.', 'success');
      } else {
        setCertificates(prev => [...prev, certificate]);
        showAlert('Certificate Added', 'Certificate has been added successfully.', 'success');
      }

      // Reset form
      setNewCertificate({
        name: '',
        type: 'professional',
        issuingOrganization: '',
        certificateNumber: '',
        issueDate: new Date(),
        expiryDate: new Date(),
        reminderDays: 30,
        cost: '',
        currency: 'QAR',
        notes: '',
        renewalUrl: ''
      });
      setEditingCertificate(null);
      setShowAddModal(false);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error saving certificate:', error);
      showAlert('Save Error', 'Failed to save certificate. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit certificate
  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setNewCertificate({
      name: certificate.name,
      type: certificate.type,
      issuingOrganization: certificate.issuingOrganization,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      reminderDays: certificate.reminderDays,
      cost: certificate.cost?.toString() || '',
      currency: certificate.currency,
      notes: certificate.notes || '',
      renewalUrl: certificate.renewalUrl || ''
    });
    setShowAddModal(true);
  };

  // Handle delete certificate
  const handleDeleteCertificate = (certificateId: string) => {
    showAlert(
      'Delete Certificate',
      'Are you sure you want to delete this certificate?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCertificates(prev => prev.filter(cert => cert.id !== certificateId));
            showAlert('Certificate Deleted', 'Certificate has been deleted successfully.', 'success');
          }
        }
      ]
    );
  };

  // Handle renewal reminder
  const handleSetReminder = (certificateId: string, days: number) => {
    setCertificates(prev => prev.map(cert => 
      cert.id === certificateId 
        ? { ...cert, reminderDays: days, status: calculateStatus(cert.expiryDate, days) }
        : cert
    ));
    showAlert('Reminder Updated', `Reminder set for ${days} days before expiry.`, 'success');
  };

  // Get status color
  const getStatusColor = (status: CertificateStatus) => {
    switch (status) {
      case 'active': return theme.success;
      case 'expiring_soon': return theme.warning;
      case 'expired': return theme.error;
      case 'pending_renewal': return theme.info;
      default: return theme.textSecondary;
    }
  };

  // Get status icon
  const getStatusIcon = (status: CertificateStatus) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'expiring_soon': return 'warning';
      case 'expired': return 'close-circle';
      case 'pending_renewal': return 'refresh-circle';
      default: return 'help-circle';
    }
  };

  // Get type icon
  const getTypeIcon = (type: CertificateType) => {
    switch (type) {
      case 'professional': return 'briefcase-outline';
      case 'technical': return 'code-slash-outline';
      case 'language': return 'language-outline';
      case 'safety': return 'shield-checkmark-outline';
      case 'license': return 'card-outline';
      default: return 'document-outline';
    }
  };

  // Get type label
  const getTypeLabel = (type: CertificateType) => {
    const labels = {
      professional: 'Professional',
      technical: 'Technical',
      language: 'Language',
      safety: 'Safety',
      license: 'License',
      other: 'Other'
    };
    return labels[type];
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filter and sort certificates
  const filteredAndSortedCertificates = certificates
    .filter(cert => filterStatus === 'all' || cert.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'expiry':
          return a.expiryDate.getTime() - b.expiryDate.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder = { expired: 0, expiring_soon: 1, pending_renewal: 2, active: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

  // Get summary stats
  const stats = {
    total: certificates.length,
    active: certificates.filter(c => c.status === 'active').length,
    expiring: certificates.filter(c => c.status === 'expiring_soon').length,
    expired: certificates.filter(c => c.status === 'expired').length
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    headerDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 6,
    },
    headerButtonTextSecondary: {
      color: theme.textPrimary,
    },
    controlsContainer: {
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    controlGroup: {
      flex: 1,
    },
    controlLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 6,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
    },
    filterButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    filterButtonTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    sortButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginRight: 4,
      textTransform: 'capitalize',
    },
    scrollContent: {
      padding: 20,
    },
    certificateCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    certificateHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    certificateInfo: {
      flex: 1,
    },
    certificateName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    certificateOrg: {
      fontSize: 13,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    certificateNumber: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 12,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
      marginLeft: 4,
      textTransform: 'uppercase',
    },
    certificateDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailItem: {
      flex: 1,
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
    },
    expiryWarning: {
      backgroundColor: theme.warning + '20',
      borderRadius: 8,
      padding: 8,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    expiryText: {
      fontSize: 12,
      color: theme.warning,
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
      flex: 1,
    },
    certificateActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    actionButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonDanger: {
      backgroundColor: theme.error,
      borderColor: theme.error,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    actionButtonTextSecondary: {
      color: theme.textPrimary,
    },
    actionButtonTextDanger: {
      color: 'white',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    formGroup: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      borderWidth: 1,
      borderColor: theme.border,
    },
    formRow: {
      flexDirection: 'row',
      gap: 12,
    },
    formRowItem: {
      flex: 1,
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    typeButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      flexDirection: 'row',
      alignItems: 'center',
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginLeft: 6,
    },
    typeButtonTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    modalButtonTextSecondary: {
      color: theme.textPrimary,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Certificate Expiry Tracker',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Professional Certificates</Text>
        <Text style={styles.headerDescription}>
          Track your professional certifications, licenses, and credentials with automated expiry reminders.
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.success }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.warning }]}>{stats.expiring}</Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.error }]}>{stats.expired}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonSecondary]}
            onPress={() => router.push('/(modals)/profile-settings')}
          >
            <Ionicons name="person-outline" size={16} color={theme.textPrimary} />
            <Text style={[styles.headerButtonText, styles.headerButtonTextSecondary]}>
              View Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={16} color={getContrastTextColor(theme.primary)} />
            <Text style={styles.headerButtonText}>Add Certificate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Filter by Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {(['all', 'active', 'expiring_soon', 'expired'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    filterStatus === status && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterStatus === status && styles.filterButtonTextActive
                  ]}>
                    {status === 'all' ? 'All' : status === 'expiring_soon' ? 'Expiring' : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View>
            <Text style={styles.controlLabel}>Sort by</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                const options: typeof sortBy[] = ['expiry', 'name', 'status'];
                const currentIndex = options.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % options.length;
                setSortBy(options[nextIndex]);
              }}
            >
              <Text style={styles.sortButtonText}>{sortBy}</Text>
              <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {filteredAndSortedCertificates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="ribbon-outline" 
              size={48} 
              color={theme.textSecondary} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Certificates Found</Text>
            <Text style={styles.emptyDescription}>
              {filterStatus === 'all' 
                ? 'Add your professional certificates and credentials to track their expiry dates.'
                : `No certificates with status "${filterStatus === 'expiring_soon' ? 'expiring soon' : filterStatus}" found.`
              }
            </Text>
          </View>
        ) : (
          filteredAndSortedCertificates.map((certificate) => {
            const daysUntilExpiry = getDaysUntilExpiry(certificate.expiryDate);
            
            return (
              <View key={certificate.id} style={styles.certificateCard}>
                <View style={styles.certificateHeader}>
                  <View style={styles.typeIcon}>
                    <Ionicons 
                      name={getTypeIcon(certificate.type)} 
                      size={20} 
                      color={theme.primary} 
                    />
                  </View>
                  
                  <View style={styles.certificateInfo}>
                    <Text style={styles.certificateName}>{certificate.name}</Text>
                    <Text style={styles.certificateOrg}>{certificate.issuingOrganization}</Text>
                    {certificate.certificateNumber && (
                      <Text style={styles.certificateNumber}>#{certificate.certificateNumber}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(certificate.status) }]}>
                    <Ionicons 
                      name={getStatusIcon(certificate.status)} 
                      size={10} 
                      color="white" 
                    />
                    <Text style={styles.statusText}>
                      {certificate.status === 'expiring_soon' ? 'expiring' : certificate.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.certificateDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{getTypeLabel(certificate.type)}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Issued</Text>
                    <Text style={styles.detailValue}>{certificate.issueDate.toLocaleDateString()}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Expires</Text>
                    <Text style={styles.detailValue}>{certificate.expiryDate.toLocaleDateString()}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Days Left</Text>
                    <Text style={[
                      styles.detailValue,
                      { color: daysUntilExpiry < 0 ? theme.error : daysUntilExpiry <= certificate.reminderDays ? theme.warning : theme.success }
                    ]}>
                      {daysUntilExpiry < 0 ? 'Expired' : daysUntilExpiry}
                    </Text>
                  </View>
                </View>

                {(certificate.status === 'expiring_soon' || certificate.status === 'expired') && (
                  <View style={styles.expiryWarning}>
                    <Ionicons 
                      name={certificate.status === 'expired' ? 'close-circle' : 'warning'} 
                      size={16} 
                      color={certificate.status === 'expired' ? theme.error : theme.warning} 
                    />
                    <Text style={[styles.expiryText, { color: certificate.status === 'expired' ? theme.error : theme.warning }]}>
                      {certificate.status === 'expired' 
                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago. Renewal required.`
                        : `Expires in ${daysUntilExpiry} days. Consider renewing soon.`
                      }
                    </Text>
                  </View>
                )}

                <View style={styles.certificateActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleEditCertificate(certificate)}
                  >
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  {certificate.renewalUrl && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => showAlert('Renewal Link', 'Opening renewal page in browser...', 'info')}
                    >
                      <Text style={styles.actionButtonText}>Renew</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => handleDeleteCertificate(certificate.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Certificate Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCertificate ? 'Edit Certificate' : 'Add Certificate'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Certificate Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCertificate.name}
                  onChangeText={(text) => setNewCertificate(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Project Management Professional (PMP)"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  {(['professional', 'technical', 'language', 'safety', 'license', 'other'] as CertificateType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        newCertificate.type === type && styles.typeButtonActive
                      ]}
                      onPress={() => setNewCertificate(prev => ({ ...prev, type }))}
                    >
                      <Ionicons 
                        name={getTypeIcon(type)} 
                        size={14} 
                        color={newCertificate.type === type ? getContrastTextColor(theme.primary) : theme.textSecondary} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        newCertificate.type === type && styles.typeButtonTextActive
                      ]}>
                        {getTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Issuing Organization *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCertificate.issuingOrganization}
                  onChangeText={(text) => setNewCertificate(prev => ({ ...prev, issuingOrganization: text }))}
                  placeholder="e.g., Project Management Institute"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Certificate Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCertificate.certificateNumber}
                  onChangeText={(text) => setNewCertificate(prev => ({ ...prev, certificateNumber: text }))}
                  placeholder="Optional certificate number"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowItem}>
                  <Text style={styles.formLabel}>Reminder (Days)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newCertificate.reminderDays.toString()}
                    onChangeText={(text) => setNewCertificate(prev => ({ ...prev, reminderDays: parseInt(text) || 30 }))}
                    placeholder="30"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formRowItem}>
                  <Text style={styles.formLabel}>Cost</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newCertificate.cost}
                    onChangeText={(text) => setNewCertificate(prev => ({ ...prev, cost: text }))}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Renewal URL</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCertificate.renewalUrl}
                  onChangeText={(text) => setNewCertificate(prev => ({ ...prev, renewalUrl: text }))}
                  placeholder="https://example.com/renew"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                  value={newCertificate.notes}
                  onChangeText={(text) => setNewCertificate(prev => ({ ...prev, notes: text }))}
                  placeholder="Additional notes about this certificate"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSaveCertificate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {editingCertificate ? 'Update' : 'Add'} Certificate
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertComponent />
    </View>
  );
}
