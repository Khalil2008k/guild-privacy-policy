import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, QrCode, Clock, User, Trash2, Search } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface ScanRecord {
  id: string;
  scannedGID: string;
  scannedUserName: string;
  scanType: 'JOB_START' | 'JOB_COMPLETE' | 'VERIFICATION' | 'PROFILE_VIEW';
  scanResult: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'INVALID';
  timestamp: Date;
  location?: string;
  jobId?: string;
}

export default function ScanHistoryScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call to backend GuildIdService.getUserScanHistory()
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock scan history data
      const mockHistory: ScanRecord[] = [
        {
          id: '1',
          scannedGID: 'GLD-QA-2024-001234',
          scannedUserName: 'Ahmed Al-Rashid',
          scanType: 'JOB_START',
          scanResult: 'SUCCESS',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          location: 'Doha, Qatar',
          jobId: 'job_123',
        },
        {
          id: '2',
          scannedGID: 'GLD-QA-2024-005678',
          scannedUserName: 'Sarah Johnson',
          scanType: 'VERIFICATION',
          scanResult: 'SUCCESS',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          location: 'Al Rayyan, Qatar',
        },
        {
          id: '3',
          scannedGID: 'GLD-QA-2024-009876',
          scannedUserName: 'Mohammed Hassan',
          scanType: 'JOB_COMPLETE',
          scanResult: 'SUCCESS',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          location: 'Al Wakrah, Qatar',
          jobId: 'job_456',
        },
        {
          id: '4',
          scannedGID: 'INVALID_CODE',
          scannedUserName: 'Unknown',
          scanType: 'PROFILE_VIEW',
          scanResult: 'INVALID',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      ];
      
      setScanHistory(mockHistory);
    } catch (error) {
      console.error('Error loading scan history:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في تحميل سجل المسح' : 'Failed to load scan history'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getScanTypeIcon = (scanType: ScanRecord['scanType']) => {
    switch (scanType) {
      case 'JOB_START':
        return 'play-circle-outline';
      case 'JOB_COMPLETE':
        return 'check-circle-outline';
      case 'VERIFICATION':
        return 'verified-user';
      default:
        return 'qr-code-scanner';
    }
  };

  const getScanTypeLabel = (scanType: ScanRecord['scanType']) => {
    switch (scanType) {
      case 'JOB_START':
        return isRTL ? 'بدء المهمة' : 'Job Start';
      case 'JOB_COMPLETE':
        return isRTL ? 'إكمال المهمة' : 'Job Complete';
      case 'VERIFICATION':
        return isRTL ? 'التحقق' : 'Verification';
      default:
        return isRTL ? 'عرض الملف الشخصي' : 'Profile View';
    }
  };

  const getScanResultColor = (result: ScanRecord['scanResult']) => {
    switch (result) {
      case 'SUCCESS':
        return theme.success;
      case 'FAILED':
        return theme.error;
      case 'EXPIRED':
        return theme.warning;
      case 'INVALID':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getScanResultLabel = (result: ScanRecord['scanResult']) => {
    switch (result) {
      case 'SUCCESS':
        return isRTL ? 'نجح' : 'Success';
      case 'FAILED':
        return isRTL ? 'فشل' : 'Failed';
      case 'EXPIRED':
        return isRTL ? 'منتهي الصلاحية' : 'Expired';
      case 'INVALID':
        return isRTL ? 'غير صالح' : 'Invalid';
      default:
        return result;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return isRTL ? 'منذ قليل' : 'Just now';
    } else if (diffInHours < 24) {
      return isRTL ? `منذ ${diffInHours} ساعة` : `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return isRTL ? `منذ ${diffInDays} يوم` : `${diffInDays}d ago`;
    }
  };

  const handleScanItemPress = (scan: ScanRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    CustomAlertService.showInfo(
      isRTL ? 'تفاصيل المسح' : 'Scan Details',
      isRTL 
        ? `معرف GUILD: ${scan.scannedGID}\nالاسم: ${scan.scannedUserName}\nالنوع: ${getScanTypeLabel(scan.scanType)}\nالنتيجة: ${getScanResultLabel(scan.scanResult)}\nالوقت: ${scan.timestamp.toLocaleString()}\n${scan.location ? `الموقع: ${scan.location}` : ''}`
        : `GUILD ID: ${scan.scannedGID}\nName: ${scan.scannedUserName}\nType: ${getScanTypeLabel(scan.scanType)}\nResult: ${getScanResultLabel(scan.scanResult)}\nTime: ${scan.timestamp.toLocaleString()}\n${scan.location ? `Location: ${scan.location}` : ''}`
    );
  };

  const handleClearHistory = () => {
    CustomAlertService.showConfirmation(
      isRTL ? 'مسح السجل' : 'Clear History',
      isRTL ? 'هل أنت متأكد من مسح جميع سجلات المسح؟' : 'Are you sure you want to clear all scan records?',
      () => {
        setScanHistory([]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
      undefined,
      isRTL
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: isRTL ? 'سجل المسح' : 'Scan History',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: {
            fontFamily: FONT_FAMILY,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <MaterialIcons 
                name={isRTL ? "chevron-right" : "chevron-left"} 
                size={24} 
                color={theme.textPrimary} 
              />
            </TouchableOpacity>
          ),
          headerRight: () => scanHistory.length > 0 ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClearHistory}
            >
              <MaterialIcons 
                name="delete-outline" 
                size={24} 
                color={theme.error} 
              />
            </TouchableOpacity>
          ) : null,
        }}
      />

      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.surface} 
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadScanHistory}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {scanHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="qr-code-scanner" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'لا يوجد سجل مسح' : 'No Scan History'}
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              {isRTL 
                ? 'ستظهر هنا رموز QR التي قمت بمسحها'
                : 'QR codes you scan will appear here'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {scanHistory.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={[styles.scanItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => handleScanItemPress(scan)}
              >
                <View style={styles.scanItemLeft}>
                  <View style={[styles.scanIcon, { backgroundColor: getScanResultColor(scan.scanResult) + '20' }]}>
                    <MaterialIcons 
                      name={getScanTypeIcon(scan.scanType) as any} 
                      size={24} 
                      color={getScanResultColor(scan.scanResult)} 
                    />
                  </View>
                  
                  <View style={styles.scanInfo}>
                    <Text style={[styles.scanUserName, { color: theme.textPrimary }]}>
                      {scan.scannedUserName}
                    </Text>
                    <Text style={[styles.scanGuildId, { color: theme.textSecondary }]}>
                      {scan.scannedGID}
                    </Text>
                    <View style={styles.scanMeta}>
                      <Text style={[styles.scanType, { color: theme.textSecondary }]}>
                        {getScanTypeLabel(scan.scanType)}
                      </Text>
                      <View style={styles.scanMetaDot} />
                      <Text style={[styles.scanTime, { color: theme.textSecondary }]}>
                        {formatTimestamp(scan.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.scanItemRight}>
                  <View style={[styles.scanResult, { backgroundColor: getScanResultColor(scan.scanResult) + '20' }]}>
                    <Text style={[styles.scanResultText, { color: getScanResultColor(scan.scanResult) }]}>
                      {getScanResultLabel(scan.scanResult)}
                    </Text>
                  </View>
                  
                  <MaterialIcons 
                    name={isRTL ? "chevron-left" : "chevron-right"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
  },
  historyList: {
    padding: 20,
    gap: 12,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  scanItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scanInfo: {
    flex: 1,
  },
  scanUserName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  scanGuildId: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  scanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanType: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  scanMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
    marginHorizontal: 8,
  },
  scanTime: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  scanItemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  scanResult: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scanResultText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});
