/**
 * GuildMapModal Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines 1494-1633)
 * Purpose: Modal displaying GUILD map with job locations
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { JobMap } from '../../../components/JobMap';
import { jobService } from '../../../services/jobService';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { logger } from '../../../utils/logger';

interface GuildMapModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GuildMapModal = React.memo<GuildMapModalProps>(({ visible, onClose }) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [mapJobs, setMapJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadMapJobs();
    }
  }, [visible]);

  const loadMapJobs = async () => {
    setLoading(true);
    try {
      // Load jobs with location data for the map
      const response = await jobService.getOpenJobs();
      const jobsWithLocation = (response.jobs || []).filter(job => 
        typeof job.location === 'object' && job.location?.coordinates?.latitude && job.location?.coordinates?.longitude
      );
      setMapJobs(jobsWithLocation);
    } catch (error) {
      logger.error('Error loading map jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobPress = (job: any) => {
    onClose();
    router.push({
      pathname: '/(modals)/job-details',
      params: { jobData: JSON.stringify(job) }
    });
  };

  const handleLocationPress = (location: { latitude: number; longitude: number; address: string }) => {
    CustomAlertService.showInfo(
      isRTL ? 'موقع' : 'Location',
      isRTL ? `تم تحديد الموقع: ${location.address}` : `Location selected: ${location.address}`
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.mapContainer}>
        {/* Header */}
        <View style={[styles.mapHeader, { backgroundColor: theme.surface }]}>
          <View style={styles.shieldIconContainer}>
            <Shield size={24} color={theme.primary} />
          </View>
          <Text style={[styles.mapTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'خريطة GUILD' : 'GUILD Map'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Real Map Content */}
        <View style={styles.mapContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {isRTL ? 'جاري تحميل الخريطة...' : 'Loading map...'}
              </Text>
            </View>
          ) : (
            <JobMap
              jobs={mapJobs}
              onJobPress={handleJobPress}
              onLocationPress={handleLocationPress}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});

GuildMapModal.displayName = 'GuildMapModal';

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  shieldIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  mapContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

