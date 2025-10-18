import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'Signika Negative SC';
const { width } = Dimensions.get('window');

type TabType = 'history' | 'sessions' | 'devices';

interface LoginHistory {
  id: string;
  timestamp: Date;
  location: string;
  device: string;
  ip: string;
  success: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
  browser?: string;
  os: string;
}

interface TrustedDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastUsed: Date;
  isActive: boolean;
  fingerprint: boolean;
}

export default function SecurityCenterScreen() {
  const { top } = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const [loginHistory] = useState<LoginHistory[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      location: 'Doha, Qatar',
      device: 'iPhone 15 Pro',
      ip: '192.168.1.100',
      success: true,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      location: 'Doha, Qatar',
      device: 'MacBook Pro',
      ip: '192.168.1.101',
      success: true,
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      location: 'Dubai, UAE',
      device: 'Unknown Device',
      ip: '185.123.45.67',
      success: false,
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      location: 'Doha, Qatar',
      device: 'iPad Air',
      ip: '192.168.1.102',
      success: true,
    },
  ]);

  const [activeSessions] = useState<ActiveSession[]>([
    {
      id: '1',
      device: 'iPhone 15 Pro',
      location: 'Doha, Qatar',
      lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isCurrent: true,
      browser: 'Safari',
      os: 'iOS 17.2',
    },
    {
      id: '2',
      device: 'MacBook Pro',
      location: 'Doha, Qatar',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isCurrent: false,
      browser: 'Chrome',
      os: 'macOS 14.2',
    },
    {
      id: '3',
      device: 'Windows PC',
      location: 'Doha, Qatar',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isCurrent: false,
      browser: 'Edge',
      os: 'Windows 11',
    },
  ]);

  const [trustedDevices] = useState<TrustedDevice[]>([
    {
      id: '1',
      name: 'iPhone 15 Pro',
      type: 'mobile',
      lastUsed: new Date(Date.now() - 1000 * 60 * 5),
      isActive: true,
      fingerprint: true,
    },
    {
      id: '2',
      name: 'MacBook Pro',
      type: 'desktop',
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isActive: true,
      fingerprint: false,
    },
    {
      id: '3',
      name: 'iPad Air',
      type: 'tablet',
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      isActive: false,
      fingerprint: true,
    },
  ]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleTerminateSession = (sessionId: string) => {
    CustomAlertService.showConfirmation(
      'Terminate Session',
      'Are you sure you want to terminate this session? The user will be signed out.',
      () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        CustomAlertService.showSuccess('Session Terminated', 'The session has been terminated successfully.');
      },
      undefined,
      isRTL
    );
  };

  const handleRemoveDevice = (deviceId: string) => {
    CustomAlertService.showConfirmation(
      'Remove Device',
      'Are you sure you want to remove this trusted device? You will need to verify again when signing in.',
      () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        CustomAlertService.showSuccess('Device Removed', 'The device has been removed from trusted devices.');
      },
      undefined,
      isRTL
    );
  };

  const renderTabButton = (tab: TabType, title: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? theme.primary + '20' : 'transparent',
          borderBottomColor: activeTab === tab ? theme.primary : 'transparent',
        }
      ]}
      onPress={() => {
        setActiveTab(tab);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? theme.primary : theme.textSecondary}
      />
      <Text style={[
        styles.tabText,
        { color: activeTab === tab ? theme.primary : theme.textSecondary }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderLoginHistoryItem = ({ item }: { item: LoginHistory }) => (
    <View style={[styles.historyItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <View style={styles.historyTitleRow}>
            <Ionicons
              name={item.success ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={item.success ? theme.success : theme.error}
            />
            <Text style={[styles.historyTitle, { color: theme.textPrimary }]}>
              {item.success ? 'Successful Login' : 'Failed Login Attempt'}
            </Text>
          </View>
          <Text style={[styles.historyTime, { color: theme.textSecondary }]}>
            {formatTimeAgo(item.timestamp)}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyDetails}>
        <View style={styles.historyDetailRow}>
          <Ionicons name="location" size={14} color={theme.textSecondary} />
          <Text style={[styles.historyDetailText, { color: theme.textSecondary }]}>
            {item.location}
          </Text>
        </View>
        <View style={styles.historyDetailRow}>
          <Ionicons name="phone-portrait" size={14} color={theme.textSecondary} />
          <Text style={[styles.historyDetailText, { color: theme.textSecondary }]}>
            {item.device}
          </Text>
        </View>
        <View style={styles.historyDetailRow}>
          <Ionicons name="globe" size={14} color={theme.textSecondary} />
          <Text style={[styles.historyDetailText, { color: theme.textSecondary }]}>
            {item.ip}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSessionItem = ({ item }: { item: ActiveSession }) => (
    <View style={[styles.sessionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTitleRow}>
            <Text style={[styles.sessionTitle, { color: theme.textPrimary }]}>
              {item.device}
            </Text>
            {item.isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: theme.success + '20' }]}>
                <Text style={[styles.currentBadgeText, { color: theme.success }]}>Current</Text>
              </View>
            )}
          </View>
          <Text style={[styles.sessionTime, { color: theme.textSecondary }]}>
            Last active: {formatTimeAgo(item.lastActive)}
          </Text>
        </View>
        
        {!item.isCurrent && (
          <TouchableOpacity
            style={[styles.terminateButton, { backgroundColor: theme.error + '20' }]}
            onPress={() => handleTerminateSession(item.id)}
          >
            <Ionicons name="close" size={16} color={theme.error} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.sessionDetailRow}>
          <Ionicons name="location" size={14} color={theme.textSecondary} />
          <Text style={[styles.sessionDetailText, { color: theme.textSecondary }]}>
            {item.location}
          </Text>
        </View>
        <View style={styles.sessionDetailRow}>
          <Ionicons name="desktop" size={14} color={theme.textSecondary} />
          <Text style={[styles.sessionDetailText, { color: theme.textSecondary }]}>
            {item.browser} on {item.os}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDeviceItem = ({ item }: { item: TrustedDevice }) => (
    <View style={[styles.deviceItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceTitleRow}>
            <Ionicons
              name={
                item.type === 'mobile' ? 'phone-portrait' :
                item.type === 'tablet' ? 'tablet-portrait' : 'desktop'
              }
              size={20}
              color={item.isActive ? theme.primary : theme.textSecondary}
            />
            <Text style={[styles.deviceTitle, { color: theme.textPrimary }]}>
              {item.name}
            </Text>
            {item.fingerprint && (
              <Ionicons name="finger-print" size={16} color={theme.success} />
            )}
          </View>
          <Text style={[styles.deviceTime, { color: theme.textSecondary }]}>
            Last used: {formatTimeAgo(item.lastUsed)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: theme.error + '20' }]}
          onPress={() => handleRemoveDevice(item.id)}
        >
          <Ionicons name="trash" size={16} color={theme.error} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.deviceStatus}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.isActive ? theme.success : theme.textSecondary }
        ]} />
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'history':
        return (
          <FlatList
            data={loginHistory}
            renderItem={renderLoginHistoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />
        );
      
      case 'sessions':
        return (
          <FlatList
            data={activeSessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Active Sessions ({activeSessions.length})
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Manage your active login sessions across devices
                </Text>
              </View>
            }
          />
        );
      
      case 'devices':
        return (
          <FlatList
            data={trustedDevices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Trusted Devices ({trustedDevices.length})
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Devices you've marked as trusted for faster login
                </Text>
              </View>
            }
          />
        );
      
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingTop: top + 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 20,
    },
    placeholder: {
      width: 40,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    content: {
      flex: 1,
    },
    listContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    sectionHeader: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
    },
    historyItem: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    historyInfo: {
      flex: 1,
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    historyTime: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
    historyDetails: {
      gap: 8,
    },
    historyDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    historyDetailText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
    },
    sessionItem: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    sessionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sessionInfo: {
      flex: 1,
    },
    sessionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    sessionTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    currentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    currentBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
    },
    sessionTime: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
    terminateButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sessionDetails: {
      gap: 8,
    },
    sessionDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sessionDetailText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
    },
    deviceItem: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    deviceHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    deviceTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    deviceTime: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deviceStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Center</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('history', 'History', 'time')}
        {renderTabButton('sessions', 'Sessions', 'desktop')}
        {renderTabButton('devices', 'Devices', 'phone-portrait')}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}


