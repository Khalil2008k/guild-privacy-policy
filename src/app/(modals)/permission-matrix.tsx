import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Shield, Lock, Unlock, Check, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';

type GuildRole = 'Guild Master' | 'Vice Master' | 'Member';
type MemberLevel = 1 | 2 | 3; // 1 = highest, 3 = lowest
type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';

interface Permission {
  id: string;
  category: string;
  feature: string;
  description: string;
  actions: PermissionAction[];
  critical: boolean; // Critical permissions require special handling
}

interface RolePermissions {
  role: GuildRole;
  level?: MemberLevel;
  permissions: {
    [permissionId: string]: {
      [action in PermissionAction]?: boolean;
    };
  };
}

const GUILD_PERMISSIONS: Permission[] = [
  // Guild Management
  {
    id: 'guild_settings',
    category: 'Guild Management',
    feature: 'Guild Settings',
    description: 'Modify guild name, description, and basic settings',
    actions: ['view', 'edit'],
    critical: true,
  },
  {
    id: 'guild_deletion',
    category: 'Guild Management',
    feature: 'Guild Deletion',
    description: 'Permanently delete the guild',
    actions: ['delete'],
    critical: true,
  },
  {
    id: 'guild_branding',
    category: 'Guild Management',
    feature: 'Guild Branding',
    description: 'Update guild logo, colors, and visual identity',
    actions: ['view', 'edit'],
    critical: false,
  },
  
  // Member Management
  {
    id: 'member_invite',
    category: 'Member Management',
    feature: 'Member Invitations',
    description: 'Send invitations to new members',
    actions: ['create', 'manage'],
    critical: false,
  },
  {
    id: 'member_removal',
    category: 'Member Management',
    feature: 'Member Removal',
    description: 'Remove members from the guild',
    actions: ['delete'],
    critical: true,
  },
  {
    id: 'role_assignment',
    category: 'Member Management',
    feature: 'Role Assignment',
    description: 'Assign and modify member roles',
    actions: ['view', 'edit'],
    critical: true,
  },
  {
    id: 'member_levels',
    category: 'Member Management',
    feature: 'Member Levels',
    description: 'Set member levels (1-3) within roles',
    actions: ['view', 'edit'],
    critical: false,
  },
  
  // Financial Management
  {
    id: 'guild_vault',
    category: 'Financial Management',
    feature: 'Guild Vault',
    description: 'Access and manage guild treasury',
    actions: ['view', 'manage'],
    critical: true,
  },
  {
    id: 'financial_reports',
    category: 'Financial Management',
    feature: 'Financial Reports',
    description: 'View detailed financial analytics',
    actions: ['view'],
    critical: false,
  },
  {
    id: 'payment_distribution',
    category: 'Financial Management',
    feature: 'Payment Distribution',
    description: 'Distribute payments to guild members',
    actions: ['create', 'manage'],
    critical: true,
  },
  
  // Job Management
  {
    id: 'guild_jobs',
    category: 'Job Management',
    feature: 'Guild Jobs',
    description: 'Create and manage guild-specific jobs',
    actions: ['view', 'create', 'edit', 'delete'],
    critical: false,
  },
  {
    id: 'job_assignments',
    category: 'Job Management',
    feature: 'Job Assignments',
    description: 'Assign jobs to guild members',
    actions: ['create', 'edit'],
    critical: false,
  },
  {
    id: 'job_approval',
    category: 'Job Management',
    feature: 'Job Approval',
    description: 'Approve or reject job applications',
    actions: ['manage'],
    critical: false,
  },
  
  // Events & Activities
  {
    id: 'guild_events',
    category: 'Events & Activities',
    feature: 'Guild Events',
    description: 'Create and manage guild events',
    actions: ['view', 'create', 'edit', 'delete'],
    critical: false,
  },
  {
    id: 'event_attendance',
    category: 'Events & Activities',
    feature: 'Event Attendance',
    description: 'Track and manage event attendance',
    actions: ['view', 'manage'],
    critical: false,
  },
  
  // Communication
  {
    id: 'guild_announcements',
    category: 'Communication',
    feature: 'Guild Announcements',
    description: 'Send announcements to all members',
    actions: ['create', 'edit', 'delete'],
    critical: false,
  },
  {
    id: 'member_messaging',
    category: 'Communication',
    feature: 'Member Messaging',
    description: 'Send direct messages to members',
    actions: ['create'],
    critical: false,
  },
];

const DEFAULT_ROLE_PERMISSIONS: { [key in GuildRole]: RolePermissions } = {
  'Guild Master': {
    role: 'Guild Master',
    permissions: {
      // Guild Masters have all permissions
      ...Object.fromEntries(
        GUILD_PERMISSIONS.map(permission => [
          permission.id,
          Object.fromEntries(permission.actions.map(action => [action, true]))
        ])
      )
    }
  },
  'Vice Master': {
    role: 'Vice Master',
    permissions: {
      // Vice Masters have most permissions except critical ones
      guild_settings: { view: true, edit: false },
      guild_deletion: { delete: false },
      guild_branding: { view: true, edit: true },
      member_invite: { create: true, manage: true },
      member_removal: { delete: true },
      role_assignment: { view: true, edit: false },
      member_levels: { view: true, edit: true },
      guild_vault: { view: true, manage: false },
      financial_reports: { view: true },
      payment_distribution: { create: false, manage: false },
      guild_jobs: { view: true, create: true, edit: true, delete: true },
      job_assignments: { create: true, edit: true },
      job_approval: { manage: true },
      guild_events: { view: true, create: true, edit: true, delete: true },
      event_attendance: { view: true, manage: true },
      guild_announcements: { create: true, edit: true, delete: true },
      member_messaging: { create: true },
    }
  },
  'Member': {
    role: 'Member',
    permissions: {
      // Members have limited permissions
      guild_settings: { view: true, edit: false },
      guild_deletion: { delete: false },
      guild_branding: { view: true, edit: false },
      member_invite: { create: false, manage: false },
      member_removal: { delete: false },
      role_assignment: { view: true, edit: false },
      member_levels: { view: true, edit: false },
      guild_vault: { view: false, manage: false },
      financial_reports: { view: false },
      payment_distribution: { create: false, manage: false },
      guild_jobs: { view: true, create: false, edit: false, delete: false },
      job_assignments: { create: false, edit: false },
      job_approval: { manage: false },
      guild_events: { view: true, create: false, edit: false, delete: false },
      event_attendance: { view: true, manage: false },
      guild_announcements: { create: false, edit: false, delete: false },
      member_messaging: { create: true },
    }
  }
};

export default function PermissionMatrixScreen() {
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
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<GuildRole>('Guild Master');
  const [selectedLevel, setSelectedLevel] = useState<MemberLevel>(1);
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS['Guild Master']);
  const [hasChanges, setHasChanges] = useState(false);

  // Load permissions when role changes
  useEffect(() => {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[selectedRole];
    setPermissions({ ...rolePermissions, level: selectedRole === 'Member' ? selectedLevel : undefined });
    setHasChanges(false);
  }, [selectedRole, selectedLevel]);

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string, action: PermissionAction, value: boolean) => {
    const permission = GUILD_PERMISSIONS.find(p => p.id === permissionId);
    
    // Check if this is a critical permission and user is not Guild Master
    if (permission?.critical && selectedRole !== 'Guild Master' && value) {
      showAlert(
        'Critical Permission',
        'This is a critical permission that can only be granted to Guild Masters.',
        'warning'
      );
      return;
    }

    setPermissions(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: {
          ...prev.permissions[permissionId],
          [action]: value
        }
      }
    }));
    setHasChanges(true);
  };

  // Handle save permissions
  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showAlert(
        'Permissions Updated',
        `Permissions for ${selectedRole}${selectedRole === 'Member' ? ` Level ${selectedLevel}` : ''} have been updated successfully.`,
        'success'
      );
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      showAlert(
        'Save Error',
        'Failed to save permissions. Please try again.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle reset permissions
  const handleResetPermissions = () => {
    showAlert(
      'Reset Permissions',
      'Are you sure you want to reset all permissions to default values?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[selectedRole];
            setPermissions({ ...defaultPermissions, level: selectedRole === 'Member' ? selectedLevel : undefined });
            setHasChanges(false);
          }
        }
      ]
    );
  };

  // Get permission status
  const getPermissionStatus = (permissionId: string, action: PermissionAction): boolean => {
    return permissions.permissions[permissionId]?.[action] || false;
  };

  // Group permissions by category
  const groupedPermissions = GUILD_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as { [category: string]: Permission[] });

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
    roleSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    roleButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      alignItems: 'center',
    },
    roleButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    roleButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    roleButtonTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    levelSelector: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    levelButton: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      alignItems: 'center',
    },
    levelButtonActive: {
      backgroundColor: theme.secondary,
      borderColor: theme.secondary,
    },
    levelButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    levelButtonTextActive: {
      color: getContrastTextColor(theme.secondary),
    },
    scrollContent: {
      padding: 20,
    },
    categorySection: {
      marginBottom: 24,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    permissionCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    permissionCardCritical: {
      borderColor: theme.warning,
      backgroundColor: theme.warning + '05',
    },
    permissionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    permissionInfo: {
      flex: 1,
    },
    permissionName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    permissionDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      lineHeight: 18,
    },
    criticalBadge: {
      backgroundColor: theme.warning,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    criticalText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
    },
    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 80,
    },
    actionItemEnabled: {
      backgroundColor: theme.success + '20',
      borderColor: theme.success,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginLeft: 6,
      textTransform: 'capitalize',
    },
    actionTextEnabled: {
      color: theme.success,
    },
    footer: {
      backgroundColor: theme.surface,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    footerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    footerButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    footerButtonDisabled: {
      opacity: 0.5,
    },
    footerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
    },
    footerButtonTextSecondary: {
      color: theme.textPrimary,
    },
    changeIndicator: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.warning,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Permission Matrix',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guild Access Control</Text>
        <Text style={styles.headerDescription}>
          Configure permissions for different guild roles and member levels. Critical permissions are restricted to Guild Masters only.
        </Text>

        {/* Role Selector */}
        <View style={styles.roleSelector}>
          {(['Guild Master', 'Vice Master', 'Member'] as GuildRole[]).map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                selectedRole === role && styles.roleButtonActive
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[
                styles.roleButtonText,
                selectedRole === role && styles.roleButtonTextActive
              ]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Member Level Selector */}
        {selectedRole === 'Member' && (
          <View style={styles.levelSelector}>
            {([1, 2, 3] as MemberLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelButton,
                  selectedLevel === level && styles.levelButtonActive
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text style={[
                  styles.levelButtonText,
                  selectedLevel === level && styles.levelButtonTextActive
                ]}>
                  Level {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Permissions List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <MaterialIcons 
                  name={
                    category === 'Guild Management' ? 'settings' :
                    category === 'Member Management' ? 'people' :
                    category === 'Financial Management' ? 'account-balance-wallet' :
                    category === 'Job Management' ? 'work' :
                    category === 'Events & Activities' ? 'event' :
                    'chat'
                  } 
                  size={16} 
                  color={theme.primary} 
                />
              </View>
              <Text style={styles.categoryTitle}>{category}</Text>
            </View>

            {categoryPermissions.map((permission) => (
              <View 
                key={permission.id} 
                style={[
                  styles.permissionCard,
                  permission.critical && styles.permissionCardCritical
                ]}
              >
                <View style={styles.permissionHeader}>
                  <View style={styles.permissionInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.permissionName}>{permission.feature}</Text>
                      {permission.critical && (
                        <View style={styles.criticalBadge}>
                          <Text style={styles.criticalText}>CRITICAL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.permissionDescription}>{permission.description}</Text>
                  </View>
                </View>

                <View style={styles.actionsContainer}>
                  {permission.actions.map((action) => {
                    const isEnabled = getPermissionStatus(permission.id, action);
                    return (
                      <TouchableOpacity
                        key={action}
                        style={[
                          styles.actionItem,
                          isEnabled && styles.actionItemEnabled
                        ]}
                        onPress={() => handlePermissionToggle(permission.id, action, !isEnabled)}
                      >
                        <Ionicons
                          name={isEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={isEnabled ? theme.success : theme.textSecondary}
                        />
                        <Text style={[
                          styles.actionText,
                          isEnabled && styles.actionTextEnabled
                        ]}>
                          {action}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonSecondary]}
            onPress={handleResetPermissions}
          >
            <Ionicons name="refresh" size={20} color={theme.textPrimary} />
            <Text style={[styles.footerButtonText, styles.footerButtonTextSecondary]}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.footerButton,
              (!hasChanges || saving) && styles.footerButtonDisabled
            ]}
            onPress={handleSavePermissions}
            disabled={!hasChanges || saving}
          >
            {hasChanges && <View style={styles.changeIndicator} />}
            {saving ? (
              <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
            ) : (
              <Ionicons name="save" size={20} color={getContrastTextColor(theme.primary)} />
            )}
            <Text style={styles.footerButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <AlertComponent />
    </View>
  );
}
