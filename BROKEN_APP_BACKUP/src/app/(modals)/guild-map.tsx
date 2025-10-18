import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import CustomAlert from '@/app/components/CustomAlert';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';

const FONT_FAMILY = 'Signika Negative SC';

interface MapLocation {
  id: string;
  name: string;
  type: 'guild' | 'job' | 'member';
  lat: number;
  lng: number;
  description: string;
  rating?: number;
  memberCount?: number;
  jobCount?: number;
  distance: string;
}

const mockLocations: MapLocation[] = [
  {
    id: '1',
    name: 'Doha Developers Hub',
    type: 'guild',
    lat: 25.2854,
    lng: 51.5310,
    description: 'Tech guild specializing in software development',
    rating: 4.8,
    memberCount: 128,
    distance: '2.3 km'
  },
  {
    id: '2', 
    name: 'Handy Pros Qatar',
    type: 'guild',
    lat: 25.2944,
    lng: 51.5418,
    description: 'Home maintenance and repair services',
    rating: 4.6,
    memberCount: 86,
    distance: '3.1 km'
  },
  {
    id: '3',
    name: 'UI/UX Design Project',
    type: 'job',
    lat: 25.2760,
    lng: 51.5200,
    description: 'Mobile app design needed urgently',
    distance: '1.8 km'
  },
  {
    id: '4',
    name: 'Ahmed Hassan',
    type: 'member',
    lat: 25.2900,
    lng: 51.5350,
    description: 'Top-rated developer available for projects',
    rating: 4.9,
    distance: '2.7 km'
  }
];

export default function GuildMapScreen() {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<'all' | 'guilds' | 'jobs' | 'members'>('all');

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(main)/home');
    }
  }, []);

  const handleLocationPress = useCallback((location: MapLocation) => {
    setSelectedLocation(location);
    Alert.alert(
      location.name,
      location.description,
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('viewDetails') || 'View Details', 
          onPress: () => {
            if (location.type === 'guild') {
              router.push(`/(modals)/guild/${location.id}`);
            } else if (location.type === 'job') {
              router.push(`/(modals)/job/${location.id}`);
            }
          }
        }
      ]
    );
  }, [t]);

  const handleSearch = useCallback(() => {
    Alert.alert(
      t('search') || 'Search',
      t('searchMapFeature') || 'Map search functionality would be implemented here'
    );
  }, [t]);

  const toggleMapType = useCallback(() => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
  }, []);

  const getLocationIcon = useCallback((type: MapLocation['type']) => {
    switch (type) {
      case 'guild':
        return <MaterialIcons name="security" size={16} color={theme.primary} />;
      case 'job':
        return <Ionicons name="location-outline" size={16} color="#FFB84D" />;
      case 'member':
        return <Ionicons name="people-outline" size={16} color="#8A6DF1" />;
      default:
        return <Ionicons name="location-outline" size={16} color={theme.textSecondary} />;
    }
  }, [theme]);

  const filteredLocations = mockLocations.filter(location => {
    if (filter === 'all') return true;
    if (filter === 'guilds') return location.type === 'guild';
    if (filter === 'jobs') return location.type === 'job';
    if (filter === 'members') return location.type === 'member';
    return true;
  });

  const styles = StyleSheet.create({
    screen: { 
      flex: 1, 
      backgroundColor: isDarkMode ? '#000000' : theme.background 
    },
    header: { 
      paddingTop: top + 12, 
      paddingBottom: 16, 
      paddingHorizontal: 18, 
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
    },
    headerTitle: { 
      color: isDarkMode ? '#000000' : '#000000', 
      fontSize: 24, 
      fontWeight: '900', 
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center'
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerActionButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
    },
    content: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111111' : theme.surface,
    },
    mapContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0a0a0a' : '#F5F5F5',
      margin: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      overflow: 'hidden',
      position: 'relative',
    },
    mapPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#1a1a1a' : '#FFFFFF',
    },
    mapText: {
      color: theme.textSecondary,
      marginTop: 16,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      fontWeight: '600',
    },
    mapSubText: {
      color: theme.textSecondary,
      marginTop: 8,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      opacity: 0.7,
    },
    mapOverlay: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    searchButton: {
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.border,
      flex: 1,
      marginRight: 8,
    },
    searchText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
    },
    mapControlButton: {
      width: 44,
      height: 44,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.border,
      marginLeft: 4,
    },
    filterBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
    },
    filterButtonActive: {
      backgroundColor: theme.primary + '20',
      borderColor: theme.primary,
    },
    filterButtonText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    filterButtonTextActive: {
      color: theme.primary,
    },
    locationsList: {
      maxHeight: 200,
    },
    locationsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    locationsTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    locationsCount: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    locationIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : theme.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : theme.borderLight,
    },
    locationInfo: {
      flex: 1,
    },
    locationName: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    locationDescription: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      lineHeight: 16,
    },
    locationMeta: {
      alignItems: 'flex-end',
    },
    locationDistance: {
      color: theme.primary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
      marginBottom: 2,
    },
    locationRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: FONT_FAMILY,
      fontWeight: '600',
    },
    quickActions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#262626' : theme.borderLight,
    },
    quickActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
    },
    quickActionText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
    },
    bottomSpacer: {
      height: 100,
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar 
        barStyle={isDarkMode ? "dark-content" : "dark-content"} 
        backgroundColor={theme.primary} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {t('guildMap') || 'Guild Map'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleSearch}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Filter Bar */}
        <View style={styles.filterBar}>
          {(['all', 'guilds', 'jobs', 'members'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterType)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive
              ]}>
                {filterType === 'all' ? (t('all') || 'All') :
                 filterType === 'guilds' ? (t('guilds') || 'Guilds') :
                 filterType === 'jobs' ? (t('jobs') || 'Jobs') :
                 (t('members') || 'Members')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {/* Map Placeholder */}
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={theme.primary} />
            <Text style={styles.mapText}>
              {t('mapIntegration') || 'Interactive Map'}
            </Text>
            <Text style={styles.mapSubText}>
              {t('mapComingSoon') || 'Real-time location tracking and guild discovery coming soon'}
            </Text>
          </View>

          {/* Map Overlay Controls */}
          <View style={styles.mapOverlay}>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              activeOpacity={0.7}
            >
              <Text style={styles.searchText}>
                {t('searchLocation') || 'Search locations...'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mapControlButton}
              onPress={toggleMapType}
              activeOpacity={0.7}
            >
              <Ionicons name="layers-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mapControlButton}
              activeOpacity={0.7}
            >
              <Ionicons name="radio-button-on-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearby Locations */}
        <View style={styles.locationsHeader}>
          <Text style={styles.locationsTitle}>
            {t('nearbyLocations') || 'Nearby Locations'}
          </Text>
          <Text style={styles.locationsCount}>
            {filteredLocations.length} {t('found') || 'found'}
          </Text>
        </View>

        <ScrollView style={styles.locationsList} nestedScrollEnabled>
          {filteredLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.locationItem}
              onPress={() => handleLocationPress(location)}
              activeOpacity={0.7}
            >
              <View style={styles.locationIcon}>
                {getLocationIcon(location.type)}
              </View>
              
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationDescription}>{location.description}</Text>
              </View>
              
              <View style={styles.locationMeta}>
                <Text style={styles.locationDistance}>{location.distance}</Text>
                {location.rating && (
                  <View style={styles.locationRating}>
                    <Ionicons name="star-outline" size={12} color={theme.primary} />
                    <Text style={styles.ratingText}>{location.rating}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate-outline" size={16} color={theme.primary} />
            <Text style={styles.quickActionText}>
              {t('directions') || 'Directions'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <Text style={styles.quickActionText}>
              {t('addLocation') || 'Add Location'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={16} color={theme.primary} />
            <Text style={styles.quickActionText}>
              {t('filters') || 'Filters'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </View>
      
      <AppBottomNavigation currentRoute="/guild-map" />
    </View>
  );
}