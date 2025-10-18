import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ModalHeader from '../../components/ModalHeader';

const FONT_FAMILY = 'Signika Negative SC';

export default function JobDetailScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const mockJob = {
    id,
    title: isRTL ? 'مطلوب مطور Full Stack' : 'Full Stack Developer Needed',
    description: isRTL ? 'نبحث عن مطور Full Stack ذو خبرة لبناء تطبيق ويب حديث. يجب أن يكون لديه خبرة في React و Node.js وتصميم قواعد البيانات.' : 'Looking for an experienced full stack developer to build a modern web application. Must have experience with React, Node.js, and database design.',
    price: 2500,
    location: isRTL ? 'الدوحة، قطر' : 'Doha, Qatar',
    duration: isRTL ? '3 أسابيع' : '3 weeks',
    postedBy: isRTL ? 'شركة التقنية المحدودة' : 'TechCorp Ltd',
    skills: ['React', 'Node.js', 'MongoDB', 'Express'],
    status: 'open'
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
              }]}>{mockJob.title}</Text>
              <Text style={[styles.companyName, { 
                color: theme.textSecondary,
                textAlign: isRTL ? 'right' : 'left',
              }]}>{mockJob.postedBy}</Text>
            </View>
            <View style={[styles.jobActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="heart-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Ionicons name="star-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Job Meta Info */}
          <View style={[styles.jobMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="cash-outline" size={16} color={theme.primary} />
              <Text style={[styles.metaText, { 
                color: theme.textPrimary,
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
              }]}>{isRTL ? `${mockJob.price.toLocaleString()} ق.ر` : `QR ${mockJob.price.toLocaleString()}`}</Text>
            </View>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="location-outline" size={16} color={theme.primary} />
              <Text style={[styles.metaText, { 
                color: theme.textPrimary,
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
              }]}>{mockJob.location}</Text>
            </View>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.metaText, { 
                color: theme.textPrimary,
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
              }]}>{mockJob.duration}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('description')}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{mockJob.description}</Text>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('skills')}</Text>
          <View style={styles.skillsContainer}>
            {mockJob.skills.map((skill, index) => (
              <View key={index} style={[styles.skillTag, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.skillText, { color: theme.primary }]}>{skill}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('postedBy')}</Text>
          <View style={styles.posterInfo}>
            <Ionicons name="person-outline" size={20} color={theme.primary} />
            <Text style={[styles.posterName, { color: theme.textPrimary }]}>{mockJob.postedBy}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push(`/(modals)/apply/${id}`)}
          >
            <Text style={[styles.actionButtonText, { color: theme.buttonText }]}>{t('apply')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
