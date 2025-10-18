import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { CustomAlertService } from '@/services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useI18n } from '@/contexts/I18nProvider';
import { RTLText, RTLView, RTLButton } from '@/app/components/primitives/primitives';
import { jobService, Job } from '@/services/jobService';
import JobCard from './JobCard';
import FilterModal from './FilterModal';
import { MapPin, Filter, Briefcase, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface FilterOptions {
  category: string;
  maxDistance: number;
  minBudget: number;
  maxBudget: number;
  sortBy: 'distance' | 'budget' | 'datePosted' | 'relevance';
}

export default function LeadsFeedScreen() {
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    category: '',
    maxDistance: 50,
    minBudget: 0,
    maxBudget: 10000,
    sortBy: 'relevance',
  });

  // Request location permission and get current location
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        return true;
      } else {
        setLocationPermission(false);
        CustomAlertService.showError(
          t('locationRequired'),
          t('locationPermissionDenied'),
          [{ text: t('ok') }]
        );
        return false;
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermission(false);
      return false;
    }
  }, [t]);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Load jobs from Firebase
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const openJobs = await jobService.getOpenJobs();
      
      // Add distance calculation if location is available
      const jobsWithDistance = openJobs.map(job => {
        if (location && typeof job.location === 'object' && job.location?.coordinates) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            job.location.coordinates.latitude,
            job.location.coordinates.longitude
          );
          return { ...job, distance };
        }
        return { ...job, distance: null };
      });

      setJobs(jobsWithDistance);
      setFilteredJobs(jobsWithDistance);
    } catch (error) {
      console.error('Error loading jobs:', error);
      CustomAlertService.showError(t('error'), t('failedToLoadJobs'), [{ text: t('ok') }]);
    } finally {
      setLoading(false);
    }
  }, [location, calculateDistance, t]);

  // Apply filters to jobs
  const applyFilters = useCallback(() => {
    let filtered = [...jobs];

    // Filter by category
    if (filterOptions.category) {
      filtered = filtered.filter(job => job.category === filterOptions.category);
    }

    // Filter by distance
    if (location && filterOptions.maxDistance < 50) {
      filtered = filtered.filter(job => 
        job.distance !== null && job.distance <= filterOptions.maxDistance
      );
    }

    // Filter by budget
    filtered = filtered.filter(job => {
      const budget = typeof job.budget === 'string' ? parseFloat(job.budget) : job.budget.max;
      return budget >= filterOptions.minBudget && budget <= filterOptions.maxBudget;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      switch (filterOptions.sortBy) {
        case 'distance':
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        case 'budget':
          const aBudget = typeof a.budget === 'string' ? parseFloat(a.budget) : a.budget.max;
          const bBudget = typeof b.budget === 'string' ? parseFloat(b.budget) : b.budget.max;
          return bBudget - aBudget;
        case 'datePosted':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'relevance':
        default:
          // Sort by relevance (combination of distance and recency)
          const aScore = (a.distance ? 1 / (a.distance + 1) : 0) + 
                        (1 / (Date.now() - new Date(a.createdAt).getTime() + 1));
          const bScore = (b.distance ? 1 / (b.distance + 1) : 0) + 
                        (1 / (Date.now() - new Date(b.createdAt).getTime() + 1));
          return bScore - aScore;
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, filterOptions, location]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  }, [loadJobs]);

  // Handle job card press
  const handleJobPress = useCallback((job: Job) => {
    // TODO: Navigate to job details screen
    console.log('Job pressed:', job.id);
  }, []);



  // Initialize location and load jobs
  useEffect(() => {
    const initialize = async () => {
      await requestLocationPermission();
      await loadJobs();
    };
    initialize();
  }, [requestLocationPermission, loadJobs]);

  // Apply filters when filter options change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const renderJobCard = useCallback(({ item }: { item: Job }) => (
    <JobCard
      job={item}
      onPress={() => handleJobPress(item)}
      location={location}
    />
  ), [handleJobPress, location]);

  const renderEmptyState = () => (
    <RTLView style={styles.emptyState}>
      <RTLText style={styles.emptyStateTitle}>{t('noJobsFound')}</RTLText>
      <RTLText style={styles.emptyStateSubtitle}>
        {location ? t('noJobsInArea') : t('locationRequired')}
      </RTLText>
      {!location && (
        <RTLButton onPress={requestLocationPermission} style={styles.enableLocationButton}>
          <RTLText style={styles.enableLocationText}>{t('enableLocation')}</RTLText>
        </RTLButton>
      )}
    </RTLView>
  );

  const renderHeader = () => (
    <RTLView style={styles.header}>
      <RTLView style={styles.headerContent}>
        <RTLText style={styles.title}>{t('leadsFeed')}</RTLText>
        <RTLText style={styles.subtitle}>{t('leadsFeedDescription')}</RTLText>
      </RTLView>
      <RTLView style={styles.headerActions}>
        <RTLButton
          variant="outline"
          size="small"
          onPress={() => setShowFilterModal(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter-outline" size={20} color="#1E90FF" />
        </RTLButton>
        <RTLButton
          variant="outline"
          size="small"
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#1E90FF" />
        </RTLButton>
      </RTLView>
    </RTLView>
  );

  return (
    <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
      {renderHeader()}
      
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E90FF']}
            tintColor="#1E90FF"
          />
        }
        ListEmptyComponent={renderEmptyState}
        accessibilityLabel={t('leadsFeed')}
      />

      <FilterModal
        visible={showFilterModal}
        filterOptions={filterOptions}
        onClose={() => setShowFilterModal(false)}
        onApply={(newOptions) => {
          setFilterOptions(newOptions);
          setShowFilterModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    minWidth: 48,
    height: 48,
  },
  refreshButton: {
    minWidth: 48,
    height: 48,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
  },
  enableLocationButton: {
    minWidth: 120,
    height: 48,
  },
  enableLocationText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
