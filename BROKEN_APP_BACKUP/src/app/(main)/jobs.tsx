import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useI18n } from '@/contexts/I18nProvider';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function JobsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mock data for demonstration
  const categories = [
    { key: 'All', label: t('all') },
    { key: 'Development', label: isRTL ? 'التطوير' : 'Development' },
    { key: 'Design', label: isRTL ? 'التصميم' : 'Design' },
    { key: 'Marketing', label: isRTL ? 'التسويق' : 'Marketing' },
    { key: 'Sales', label: isRTL ? 'المبيعات' : 'Sales' }
  ];
  const jobs = [
    {
      id: 1,
      title: isRTL ? 'مطور React Native أول' : 'Senior React Native Developer',
      company: isRTL ? 'شركة التقنية المحدودة' : 'TechCorp Inc.',
      location: isRTL ? 'نيويورك، نيويورك' : 'New York, NY',
      salary: isRTL ? '120-150 ألف ق.ر' : 'QR 120k - 150k',
      skills: isRTL ? ['React Native', 'TypeScript', 'Node.js'] : ['React Native', 'TypeScript', 'Node.js'],
      category: 'Development',
      description: isRTL ? 'نبحث عن مطور React Native ذو خبرة للانضمام إلى فريق التطبيقات المحمولة.' : 'Looking for an experienced React Native developer to join our mobile team.'
    },
    {
      id: 2,
      title: isRTL ? 'مصمم تجربة المستخدم' : 'UX/UI Designer',
      company: isRTL ? 'استوديو التصميم' : 'DesignStudio',
      location: isRTL ? 'سان فرانسيسكو، كاليفورنيا' : 'San Francisco, CA',
      salary: isRTL ? '90-120 ألف ق.ر' : 'QR 90k - 120k',
      skills: isRTL ? ['Figma', 'Sketch', 'Adobe XD'] : ['Figma', 'Sketch', 'Adobe XD'],
      category: 'Design',
      description: isRTL ? 'مصمم تجربة مستخدم مبدع مطلوب لمشاريع تطبيقات محمولة مبتكرة.' : 'Creative UX/UI designer needed for innovative mobile app projects.'
    },
    {
      id: 3,
      title: isRTL ? 'مطور Full Stack' : 'Full Stack Developer',
      company: isRTL ? 'شركة StartupXYZ' : 'StartupXYZ',
      location: isRTL ? 'أوستن، تكساس' : 'Austin, TX',
      salary: isRTL ? '100-130 ألف ق.ر' : 'QR 100k - 130k',
      skills: isRTL ? ['React', 'Node.js', 'MongoDB'] : ['React', 'Node.js', 'MongoDB'],
      category: 'Development',
      description: isRTL ? 'مطور Full Stack مطلوب لشركة ناشئة سريعة النمو.' : 'Full stack developer wanted for fast-growing startup.'
    },
  ];

  const filteredJobs = selectedCategory === 'All'
    ? jobs
    : jobs.filter(job => job.category === selectedCategory);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "dark-content" : "dark-content"}
        backgroundColor={theme.primary}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
          {t('jobs')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={[styles.content, { backgroundColor: isDarkMode ? '#111111' : theme.surface }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Spacing */}
        <View style={styles.topSpacer} />
        
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  { borderColor: theme.primary },
                  selectedCategory === category.key && { backgroundColor: theme.primary }
                ]}
                onPress={() => setSelectedCategory(category.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.key 
                      ? { color: theme.buttonText }
                      : { color: '#999999' }
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Jobs List */}
        <View style={styles.jobsSection}>
          {filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[
                styles.jobCard,
                {
                  backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#262626' : theme.border,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 12,
                }
              ]}
              onPress={() => router.push(`/(modals)/job/${job.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={[styles.jobTitle, { color: theme.textPrimary }]}>
                    {job.title}
                  </Text>
                  <Text style={[styles.jobCompany, { color: theme.textSecondary }]}>
                    {job.company}
                  </Text>
                </View>
                <Text style={[styles.jobSalary, { color: '#BCFF31' }]}>
                  {job.salary}
                </Text>
              </View>

              <Text style={[styles.jobDescription, { color: theme.textSecondary }]}>
                {job.description}
              </Text>

              <View style={styles.jobFooter}>
                <View style={styles.jobSkills}>
                  {job.skills.map((skill, index) => (
                    <Text key={index} style={[styles.skillTag, { backgroundColor: theme.border }]}>
                      {skill}
                    </Text>
                  ))}
                </View>
                <Text style={[styles.jobLocation, { color: theme.textSecondary }]}>
                  {job.location}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Job Button */}
      <TouchableOpacity
        style={[styles.addJobButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/(modals)/job-posting')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={theme.buttonText} />
        <Text style={[styles.addJobText, { color: theme.buttonText }]}>
          {t('postJob')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#BCFF31',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  jobsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  jobCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  jobSalary: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  jobDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  skillTag: {
    fontSize: 10,
    fontFamily: FONT_FAMILY,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  jobLocation: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  addJobButton: {
    position: 'absolute',
    bottom: 105,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  addJobText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  topSpacer: {
    height: 20,
  },
});
