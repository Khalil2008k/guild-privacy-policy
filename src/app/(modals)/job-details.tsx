import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlertService } from '../../services/CustomAlertService';
import { UserPreferencesService } from '../../services/UserPreferencesService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Heart, Bookmark, Clock, Coins, MapPin, Navigation, CheckCircle, XCircle, Briefcase, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '../../services/jobService';
import { jobService } from '../../services/jobService';
import { contractService } from '../../services/contractService';
import * as Location from 'expo-location';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

export default function JobDetailsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [takingJob, setTakingJob] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, []);

  useEffect(() => {
    if (job && user) {
      loadJobStatus();
    }
  }, [job, user]);

  const loadJobStatus = async () => {
    if (!job || !user) return;
    
    try {
      const result = await UserPreferencesService.getJobStatus(job.id);
      if (result.success) {
        setIsSaved(result.data.isSaved);
        setIsLiked(result.data.isLiked);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading job status:', error);
    }
  };

  const loadJobDetails = async () => {
    try {
      if (params.jobData) {
        // Job data passed from map
        const jobData = JSON.parse(params.jobData as string);
        setJob(jobData);
        await calculateDistance(jobData);
        await getAddressFromCoordinates(jobData);
      } else if (params.jobId) {
        // Fetch job by ID
        const jobData = await jobService.getJobById(params.jobId as string);
        if (jobData) {
          setJob(jobData);
          await calculateDistance(jobData);
          await getAddressFromCoordinates(jobData);
        }
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading job details:', error);
      CustomAlertService.showError('Error', 'Could not load job details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = async (jobData: Job) => {
    if (!jobData.location?.coordinates) return;

    try {
      const { status } = await Location.getForegroundPermissionsStatusAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const dist = calculateHaversineDistance(
          location.coords.latitude,
          location.coords.longitude,
          jobData.location.coordinates.latitude,
          jobData.location.coordinates.longitude
        );
        setDistance(dist);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error calculating distance:', error);
    }
  };

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };

  const getAddressFromCoordinates = async (jobData: Job) => {
    if (!jobData.location?.coordinates) return;

    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude: jobData.location.coordinates.latitude,
        longitude: jobData.location.coordinates.longitude,
      });

      if (result) {
        const addressParts = [
          result.name,
          result.street,
          result.district,
          result.city,
          result.region,
          result.country,
        ].filter(Boolean);
        
        setAddress(addressParts.join(', '));
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error getting address:', error);
      setAddress('Doha, Qatar');
    }
  };

  const handleTakeJob = async () => {
    if (!user || !job) return;

    CustomAlertService.showConfirmation(
      'Confirm Job',
      'Are you sure you want to take this job?',
      async () => {
        setTakingJob(true);
        try {
          // Update job status in Firebase
          const jobRef = doc(db, 'jobs', job.id);
          await updateDoc(jobRef, {
            status: 'taken',
            takenBy: user.uid,
            takenByName: user.displayName || 'User',
            takenAt: serverTimestamp(),
          });

          // Auto-generate contract
          try {
            const contractData = {
              jobId: job.id,
              jobTitle: { en: job.title, ar: job.title },
              jobDescription: { en: job.description || '', ar: job.description || '' },
              deliverables: {
                en: job.requirements ? [job.requirements] : ['Complete the job as described'],
                ar: job.requirements ? [job.requirements] : ['إكمال العمل كما هو موصوف'],
              },
              timeline: { en: job.timeNeeded || 'As agreed', ar: job.timeNeeded || 'حسب الاتفاق' },
              payment: {
                amount: typeof job.budget === 'object' ? job.budget.min : parseFloat(job.budget || '0'),
                currency: typeof job.budget === 'object' ? job.budget.currency : 'QAR',
                schedule: { en: 'Upon completion', ar: 'عند الإنجاز' },
              },
              posterTerms: {
                en: ['Payment will be released 7-14 days after job completion', 'Dispute resolution through GUILD platform'],
                ar: ['سيتم تحرير الدفع خلال 7-14 يومًا بعد إنجاز العمل', 'حل النزاعات عبر منصة GUILD'],
              },
              workerTerms: {
                en: ['Complete work as specified', 'Maintain professional communication'],
                ar: ['إنجاز العمل كما هو محدد', 'الحفاظ على التواصل المهني'],
              },
              posterId: job.posterId || job.userId || '',
              workerId: user.uid,
            };

            const contractId = await contractService.createContract(contractData);
            // COMMENT: PRIORITY 1 - Replace console.log with logger
            logger.debug('✅ Contract auto-generated:', contractId);

            CustomAlertService.showSuccess(
              'Success!',
              'Job taken! Contract has been generated. Check your notifications.',
              [{ text: 'OK', style: 'default', onPress: () => router.back() }]
            );
          } catch (contractError) {
            // COMMENT: PRIORITY 1 - Replace console.error with logger
            logger.error('Contract generation error:', contractError);
            // Don't fail the job acceptance if contract fails
            CustomAlertService.showSuccess(
              'Success!',
              'Job taken! Head to the location now.',
              [{ text: 'OK', style: 'default', onPress: () => router.back() }]
            );
          }
        } catch (error) {
          // COMMENT: PRIORITY 1 - Replace console.error with logger
          logger.error('Error taking job:', error);
          CustomAlertService.showError('Error', 'Could not take this job. Please try again.');
        } finally {
          setTakingJob(false);
        }
      },
      undefined,
      false
    );
  };

  const handleNavigate = () => {
    if (!job?.location?.coordinates) return;

    const { latitude, longitude } = job.location.coordinates;
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(job.title);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url!).catch(() => {
      CustomAlertService.showError('Error', 'Could not open maps');
    });
  };

  const handleSave = async () => {
    if (!user || !job) return;

    try {
      const result = await UserPreferencesService.toggleSaveJob(job.id, isSaved);
      
      if (result.success) {
        setIsSaved(!isSaved);
        CustomAlertService.showSuccess(
          isSaved ? 'Job Unsaved' : 'Job Saved',
          result.message
        );
      } else {
        CustomAlertService.showError('Error', result.message);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error saving job:', error);
      CustomAlertService.showError('Error', 'Could not save this job. Please try again.');
    }
  };

  const handleLike = async () => {
    if (!user || !job) return;

    try {
      const result = await UserPreferencesService.toggleLikeJob(job.id, isLiked);
      
      if (result.success) {
        setIsLiked(!isLiked);
        CustomAlertService.showSuccess(
          isLiked ? 'Job Unliked' : 'Job Liked',
          result.message
        );
      } else {
        CustomAlertService.showError('Error', result.message);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error liking job:', error);
      CustomAlertService.showError('Error', 'Could not like this job. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          Job not found
        </Text>
      </View>
    );
  }

  const isJobTaken = job.status === 'taken';

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'DD', theme.primary + 'AA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}
      >
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            {isRTL ? <ArrowRight size={24} color="#000000" /> : <ArrowLeft size={24} color="#000000" />}
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
              <Briefcase size={20} color="#000000" />
            </View>
            <Text style={styles.headerTitle}>
              {isRTL ? 'تفاصيل الوظيفة' : 'Job Details'}
            </Text>
          </View>

          <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity 
              onPress={handleLike} 
              style={[styles.headerActionButton, { backgroundColor: 'rgba(0,0,0,0.15)' }]}
            >
              <Heart 
                size={20} 
                color="#000000"
                fill={isLiked ? '#000000' : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.headerActionButton, { backgroundColor: 'rgba(0,0,0,0.15)' }]}
            >
              <Bookmark 
                size={20} 
                color="#000000"
                fill={isSaved ? '#000000' : 'none'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >

      {/* Job Info */}
      <View style={[styles.content, { backgroundColor: theme.surface }]}>
        {/* Poster Info */}
        <View style={[styles.posterSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {job.clientAvatar ? (
            <Image source={{ uri: job.clientAvatar }} style={styles.posterImage} />
          ) : (
            <View style={[styles.posterImagePlaceholder, { backgroundColor: theme.background }]}>
              <Text style={[styles.posterInitial, { color: theme.primary }]}>
                {job.clientName?.[0]?.toUpperCase() || 'J'}
              </Text>
            </View>
          )}
          <View style={[styles.posterInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.posterName, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
              {job.clientName || (isRTL ? 'ناشر الوظيفة' : 'Job Poster')}
            </Text>
            <Text style={[styles.postTime, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'نُشر في' : 'Posted'} {new Date(job.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Job Title & Description */}
        <View style={styles.jobSection}>
          <Text style={[styles.jobTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{job.title}</Text>
          <Text style={[styles.jobDescription, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {job.description}
          </Text>
        </View>

        {/* Duration */}
        <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Clock size={20} color={theme.primary} />
          <Text style={[styles.infoLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
            {isRTL ? 'المدة:' : 'Duration:'}
          </Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {job.timeNeeded || (isRTL ? '1-3 أيام' : '1-3 days')}
          </Text>
        </View>

        {/* Budget */}
        <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Coins size={20} color={theme.primary} />
          <Text style={[styles.infoLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
            {isRTL ? 'الميزانية:' : 'Budget:'}
          </Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {job.salary ? `${job.salary} QR` : (isRTL ? 'قابل للتفاوض' : 'Negotiable')}
          </Text>
        </View>

        {/* Location Section */}
        <View style={[styles.locationSection, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Location</Text>
          
          {distance !== null && (
            <View style={[styles.distanceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MapPin size={20} color={theme.primary} />
              <Text style={[styles.distanceText, { color: theme.primary, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>
                {distance.toFixed(1)} km away
              </Text>
            </View>
          )}

          <Text style={[styles.addressText, { color: theme.textSecondary }]}>
            {address || job.location?.address || 'Doha, Qatar'}
          </Text>

          <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: theme.primary }]}
            onPress={handleNavigate}
          >
            <Navigation size={20} color="#000000" />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {(Array.isArray(job?.skills) ? job.skills : []).map((skill, index) => (
                <View
                  key={`${job?.id || "job"}-skill-${index}`}
                  style={[styles.skillTag, { backgroundColor: theme.primary + '20' }]}
                >
                  <Text style={[styles.skillText, { color: theme.primary }]}>{String(skill)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16, backgroundColor: adaptiveColors.background }]}>
        {isJobTaken ? (
          <View style={[styles.takenBadge, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
            <XCircle size={24} color={theme.error} />
            <Text style={[styles.takenText, { color: theme.error }]}>
              {isRTL ? 'الوظيفة غير متاحة' : 'Job no longer available'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.takeJobButton}
            onPress={handleTakeJob}
            disabled={takingJob}
          >
            <LinearGradient
              colors={[theme.primary, theme.primary + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.takeJobButtonGradient}
            >
              {takingJob ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <CheckCircle size={24} color="#000000" />
                  <Text style={styles.takeJobButtonText}>
                    {isRTL ? 'قبول الوظيفة' : 'Take Job'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  posterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  posterImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  posterImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  posterInfo: {
    marginLeft: 12,
    flex: 1,
  },
  posterName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 14,
    marginTop: 2,
  },
  jobSection: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  jobDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  locationSection: {
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  navigateButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  skillsSection: {
    marginTop: 20,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  takeJobButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  takeJobButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  takeJobButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    gap: 10,
  },
  takenText: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
