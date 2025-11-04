import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { Ionicons } from '@expo/vector-icons';
import { Shield, MapPin, Clock, DollarSign } from 'lucide-react-native';
import * as Location from 'expo-location';
import { CustomAlertService } from '@/services/CustomAlertService';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';

const { width, height } = Dimensions.get('window');

// Custom Map Styles
const getCustomMapStyle = (isDark: boolean) => [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": isDark ? "#1d2c4d" : "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#8ec3b9" : "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": isDark ? "#1a3646" : "#ffffff"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": isDark ? "#4b6878" : "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#64779e" : "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": isDark ? "#4b6878" : "#e0e0e0"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": isDark ? "#334e87" : "#e0e0e0"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": isDark ? "#023e58" : "#e0e0e0"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": isDark ? "#283d6a" : "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#6f9ba4" : "#757575"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": isDark ? "#1d2c4d" : "#ffffff"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": isDark ? "#023e58" : "#c8e6c9"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#3C7680" : "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": isDark ? "#304a7d" : "#ffffff"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#98a5be" : "#424242"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": isDark ? "#1d2c4d" : "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": isDark ? "#2c6675" : "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": isDark ? "#255763" : "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#b0d5ce" : "#616161"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": isDark ? "#023e58" : "#ffffff"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#98a5be" : "#757575"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": isDark ? "#1d2c4d" : "#ffffff"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": isDark ? "#283d6a" : "#e0e0e0"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": isDark ? "#3a4762" : "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": isDark ? "#0e1626" : "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": isDark ? "#4e6d70" : "#9e9e9e"
      }
    ]
  }
];

interface Job {
  id: string;
  title: string;
  description: string;
  salary: string;
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  status: string;
  createdAt: string;
  distance?: number; // Distance from user in kilometers
}

interface JobMapProps {
  jobs: Job[];
  onJobPress: (job: Job) => void;
  onLocationPress?: (location: { latitude: number; longitude: number; address: string }) => void;
}

export function JobMap({ jobs, onJobPress, onLocationPress }: JobMapProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState({
    latitude: 25.2854, // Doha, Qatar default
    longitude: 51.5310,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [jobsWithDistance, setJobsWithDistance] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Animation values
  const markerAnimations = useRef<{ [key: string]: Animated.Value }>({});
  const calloutAnimation = useRef(new Animated.Value(0)).current;
  const mapStyleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (jobs.length > 0) {
      calculateDistances();
      // Only fit map to jobs on initial load, not on every change
      if (jobsWithDistance.length === 0) {
        // Delay fitting to ensure map is properly rendered
        setTimeout(() => {
          fitMapToJobs();
        }, 500);
      }
      // Initialize marker animations
      initializeMarkerAnimations();
    }
  }, [jobs, userLocation]);

  // Ensure map region is stable after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize marker animations
  const initializeMarkerAnimations = () => {
    jobs.forEach(job => {
      if (!markerAnimations.current[job.id]) {
        markerAnimations.current[job.id] = new Animated.Value(0);
      }
    });
  };

  // Animate marker on press
  const animateMarker = (jobId: string) => {
    const animation = markerAnimations.current[jobId];
    if (animation) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Animate callout appearance
  const animateCallout = (show: boolean) => {
    Animated.timing(calloutAnimation, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateDistances = () => {
    if (!userLocation) return;
    
    const jobsWithDist = jobs.map(job => {
      if (job.location?.coordinates) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          job.location.coordinates.latitude,
          job.location.coordinates.longitude
        );
        return { ...job, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
      }
      return job;
    });
    
    // Sort by distance (closest first)
    jobsWithDist.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    setJobsWithDistance(jobsWithDist);
  };

  const fitMapToJobs = () => {
    const coordinates = jobs
      .filter(job => job.location?.coordinates)
      .map(job => job.location.coordinates);
    
    if (coordinates.length > 0) {
      const minLat = Math.min(...coordinates.map(coord => coord.latitude));
      const maxLat = Math.max(...coordinates.map(coord => coord.latitude));
      const minLng = Math.min(...coordinates.map(coord => coord.longitude));
      const maxLng = Math.max(...coordinates.map(coord => coord.longitude));
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      // Calculate balanced deltas to prevent horizontal scrolling
      const latRange = Math.max(maxLat - minLat, 0.01);
      const lngRange = Math.max(maxLng - minLng, 0.01);
      
      // Use the larger range to ensure proper aspect ratio
      const maxRange = Math.max(latRange, lngRange);
      const padding = 1.5; // Add padding
      
      const newRegion = {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: maxRange * padding,
        longitudeDelta: maxRange * padding,
      };
      
      setRegion(newRegion);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        CustomAlertService.showError(
          isRTL ? 'إذن مطلوب' : 'Permission Required',
          isRTL ? 'نحتاج إلى إذن الموقع لعرض موقعك على الخريطة' : 'We need location permission to show your location on the map'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Center map on user location
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error getting current location:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل الحصول على الموقع الحالي' : 'Failed to get current location'
      );
    }
  };

  const handleMapPress = (event: any) => {
    if (onLocationPress) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      onLocationPress({
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      });
    }
  };

  const toggleMapType = () => {
    const types: ('standard' | 'satellite' | 'hybrid')[] = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    } else {
      getCurrentLocation();
    }
  };

  const getMarkerColor = (job: Job) => {
    switch (job.status) {
      case 'open':
        return '#4CAF50'; // Green
      case 'in_progress':
        return '#FF9800'; // Orange
      case 'completed':
        return '#2196F3'; // Blue
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#9C27B0'; // Purple
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return 'briefcase-outline';
      case 'in_progress':
        return 'play-circle-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          mapType={mapType}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          loadingEnabled={true}
          loadingIndicatorColor={theme.primary}
          loadingBackgroundColor={theme.surface}
          moveOnMarkerPress={false}
          followsUserLocation={false}
          showsPointsOfInterest={true}
          showsUserLocationButton={false}
          customMapStyle={getCustomMapStyle(theme.isDark)}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          cacheEnabled={true}
          maxZoomLevel={20}
          minZoomLevel={3}
        >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title={isRTL ? 'موقعك الحالي' : 'Your Location'}
            description={isRTL ? 'أنت هنا' : 'You are here'}
            pinColor="#FF0000"
          >
            <View style={[styles.userMarker, { backgroundColor: theme.primary }]}>
              <Ionicons name="person" size={16} color="#000000" />
            </View>
          </Marker>
        )}

            {/* Job Markers with Distance */}
            {jobsWithDistance
              .filter(job => job.location?.coordinates)
              .map((job) => {
                const markerAnimation = markerAnimations.current[job.id];
                const scale = markerAnimation ? markerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }) : 1;
                
                return (
                  <React.Fragment key={job.id}>
                    {/* Job Marker */}
                    <Marker
                      coordinate={job.location.coordinates}
                      title={job.title}
                      description={`${job.salary} - ${job.distance ? `${job.distance}km away` : job.location.address}`}
                      pinColor={getMarkerColor(job)}
                      onPress={() => {
                        animateMarker(job.id);
                        setSelectedJob(job);
                        animateCallout(true);
                      }}
                    >
                      <Animated.View 
                        style={[
                          styles.jobMarker, 
                          { 
                            backgroundColor: theme.primary,
                            transform: [{ scale }]
                          }
                        ]}
                      >
                        <Shield size={16} color="#000000" />
                      </Animated.View>
                      <Callout style={styles.callout} onPress={() => onJobPress(job)}>
                        <Animated.View 
                          style={[
                            styles.calloutContent, 
                            { 
                              backgroundColor: theme.surface,
                              transform: [{
                                scale: calloutAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1],
                                })
                              }]
                            }
                          ]}
                        >
                          <View style={styles.calloutHeader}>
                            <View style={[styles.calloutIcon, { backgroundColor: theme.primary }]}>
                              <Shield size={16} color={theme.background} />
                            </View>
                            <View style={styles.calloutHeaderText}>
                              <Text style={[styles.calloutTitle, { color: theme.textPrimary }]}>
                                {job.title}
                              </Text>
                              <Text style={[styles.calloutStatus, { color: theme.textSecondary }]}>
                                {job.status}
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.calloutDetails}>
                            <View style={styles.calloutDetailRow}>
                              <DollarSign size={14} color={theme.primary} />
                              <Text style={[styles.calloutSalary, { color: theme.primary }]}>
                                {job.salary}
                              </Text>
                            </View>
                            
                            <View style={styles.calloutDetailRow}>
                              <MapPin size={14} color={theme.textSecondary} />
                              <Text style={[styles.calloutAddress, { color: theme.textSecondary }]}>
                                {job.location.address}
                              </Text>
                            </View>
                            
                            {job.distance && (
                              <View style={styles.calloutDetailRow}>
                                <Clock size={14} color={theme.primary} />
                                <Text style={[styles.calloutDistance, { color: theme.primary }]}>
                                  {job.distance}km {isRTL ? 'بعيد' : 'away'}
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          <TouchableOpacity
                            style={[styles.calloutButton, { backgroundColor: theme.primary }]}
                            onPress={() => onJobPress(job)}
                          >
                            <Text style={[styles.calloutButtonText, { color: theme.background }]}>
                              {isRTL ? 'عرض التفاصيل' : 'View Details'}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      </Callout>
                    </Marker>
                  </React.Fragment>
                );
              })}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        {/* Map Type Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.surface }]}
          onPress={toggleMapType}
        >
          <Ionicons 
            name={mapType === 'standard' ? 'map' : mapType === 'satellite' ? 'satellite' : 'layers'} 
            size={20} 
            color={theme.primary} 
          />
        </TouchableOpacity>

        {/* Center on User Location */}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.surface }]}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={20} color={theme.primary} />
        </TouchableOpacity>

        {/* Toggle User Location */}
        <TouchableOpacity
          style={[
            styles.controlButton, 
            { backgroundColor: showUserLocation ? theme.primary : theme.surface }
          ]}
          onPress={() => setShowUserLocation(!showUserLocation)}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={showUserLocation ? theme.background : theme.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Job Count Badge */}
      <View style={[styles.jobCountBadge, { backgroundColor: theme.primary }]}>
        <View style={styles.jobCountContent}>
          <Shield size={16} color={theme.background} />
          <Text style={[styles.jobCountText, { color: theme.background }]}>
            {jobsWithDistance.filter(job => job.location?.coordinates).length} {isRTL ? 'وظيفة' : 'Jobs'}
          </Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  jobMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  callout: {
    width: 280,
    borderRadius: 16,
  },
  calloutContent: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calloutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calloutHeaderText: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  calloutStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calloutDetails: {
    marginBottom: 16,
  },
  calloutDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutSalary: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  calloutAddress: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  calloutDistance: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  calloutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  calloutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  jobCountBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    minWidth: 60,
    height: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobCountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobCountText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  jobCountSubtext: {
    fontSize: 8,
    opacity: 0.9,
    marginTop: 1,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
});
