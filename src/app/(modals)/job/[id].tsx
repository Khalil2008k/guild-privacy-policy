import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, User, CheckCircle, Heart, Star, Share } from 'lucide-react-native';
import ModalHeader from '../../components/ModalHeader';
import { jobService, Job } from '../../../services/jobService';
import { useAuth } from '../../../contexts/AuthContext';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../../utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

export default function JobDetailScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
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

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    setLoading(true);
    try {
      const jobData = await jobService.getJobById(id as string);
      if (jobData) {
        setJob(jobData);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.primary}
        translucent
      />
      
      <ModalHeader
        title={isRTL ? 'تفاصيل الوظيفة' : 'Job Details'}
        onBack={() => router.back()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : job ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Job Header Card */}
          <View style={[styles.jobCard, { 
            backgroundColor: theme.surface,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
          }]}>
            {/* Job Title and Actions */}
            <View style={[styles.jobHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.jobTitleContainer}>
                <Text style={[styles.jobTitle, { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }]}>{job.title}</Text>
                <Text style={[styles.companyName, { 
                  color: theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                }]}>{job.clientName || 'Anonymous Client'}</Text>
            </View>
            <View style={[styles.jobActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.actionIcon}>
                <Heart size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Star size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Job Meta Info */}
          <View style={[styles.jobMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <DollarSign size={16} color={theme.primary} />
              <Text style={[styles.metaText, { 
                color: theme.textPrimary,
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
              }]}>{
                typeof job.budget === 'object' 
                  ? isRTL ? `${job.budget.min.toLocaleString()}-${job.budget.max.toLocaleString()} ق.ر` : `QR ${job.budget.min.toLocaleString()}-${job.budget.max.toLocaleString()}`
                  : isRTL ? `${job.budget} ق.ر` : `QR ${job.budget}`
              }</Text>
            </View>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MapPin size={16} color={theme.primary} />
              <Text style={[styles.metaText, { 
                color: theme.textPrimary,
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
              }]}>{
                typeof job.location === 'object' 
                  ? job.location.address 
                  : job.location
              }</Text>
            </View>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Clock size={16} color={theme.primary} />
              <Text style={[styles.metaText, { 
                color: theme.textPrimary,
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
              }]}>{job.timeNeeded || 'Flexible'}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { 
            color: theme.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }]}>{t('description')}</Text>
          <Text style={[styles.description, { 
            color: theme.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
          }]}>{job.description}</Text>

          <Text style={[styles.sectionTitle, { 
            color: theme.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }]}>{t('skills')}</Text>
          <View style={styles.skillsContainer}>
            {(Array.isArray(job?.skills) ? job.skills : []).map((skill, index) => (
              <View key={`${job?.id || "job"}-skill-${index}`} style={[styles.skillTag, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.skillText, { color: theme.primary }]}>{String(skill)}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { 
            color: theme.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }]}>{t('postedBy')}</Text>
          <View style={[styles.posterInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <User 
              size={20} 
              color={theme.primary} 
              style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}
            />
            <Text style={[styles.posterName, { 
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            }]}>{job.clientName || 'Anonymous Client'}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* Only show Apply button if user is not the job poster */}
          {job.clientId !== user?.uid && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push(`/(modals)/apply/${id}`)}
            >
              <Text style={[styles.actionButtonText, { color: theme.buttonText }]}>
                {isRTL ? 'تقديم عرض' : 'Submit Offer'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surfaceSecondary, marginTop: job.clientId !== user?.uid ? 12 : 0 }]}
            onPress={() => router.push({ pathname: '/(modals)/chat/[jobId]', params: { jobId: id } })}
          >
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
              {isRTL ? 'مناقشة الوظيفة' : 'Discuss Job'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL ? 'الوظيفة غير موجودة' : 'Job not found'}
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.buttonText }]}>
              {isRTL ? 'رجوع' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  jobCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  jobHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
  },
  jobActions: {
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(188, 255, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobMeta: {
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(188, 255, 49, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_FAMILY,
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
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  posterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterName: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginLeft: 10,
  },
  actions: {
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});
