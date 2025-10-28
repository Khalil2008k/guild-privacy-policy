import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { router } from 'expo-router';
import { 
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Clock,
  DollarSign,
  Tag,
  CheckCircle,
  BarChart3,
  ArrowLeft,
  Search
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useI18n } from '../../../src/contexts/I18nProvider';
import ModalHeader from '../components/ModalHeader';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  searchBackground: isDark ? theme.surface : '#F8F8F8',
  searchBorder: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

interface JobTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  duration: string;
  skills: string[];
  requirements: string[];
  createdAt: Date;
  usageCount: number;
}

export default function JobTemplatesScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const [templates, setTemplates] = useState<JobTemplate[]>([
    {
      id: '1',
      title: 'Mobile App Development',
      category: 'Technology',
      description: 'Looking for an experienced mobile app developer to create a cross-platform application using React Native.',
      budget: { min: 5000, max: 15000 },
      duration: '2-3 months',
      skills: ['React Native', 'JavaScript', 'Mobile Development', 'API Integration'],
      requirements: ['3+ years experience', 'Portfolio required', 'Available for meetings'],
      createdAt: new Date('2024-01-15'),
      usageCount: 12,
    },
    {
      id: '2',
      title: 'Logo Design',
      category: 'Design',
      description: 'Need a professional logo design for a new tech startup. Looking for modern, clean design that represents innovation.',
      budget: { min: 500, max: 2000 },
      duration: '1-2 weeks',
      skills: ['Logo Design', 'Adobe Illustrator', 'Brand Identity', 'Creative Design'],
      requirements: ['Portfolio with logo samples', 'Provide multiple concepts', 'Source files included'],
      createdAt: new Date('2024-01-10'),
      usageCount: 8,
    },
    {
      id: '3',
      title: 'Content Writing',
      category: 'Writing',
      description: 'Seeking a skilled content writer to create engaging blog posts and articles for our company website.',
      budget: { min: 300, max: 800 },
      duration: '1 month',
      skills: ['Content Writing', 'SEO Writing', 'Research', 'English Proficiency'],
      requirements: ['Native English speaker', 'SEO knowledge', 'Samples required'],
      createdAt: new Date('2024-01-05'),
      usageCount: 15,
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    duration: '',
    skills: '',
    requirements: '',
  });

  const categories = [
    'Technology',
    'Design',
    'Writing',
    'Marketing',
    'Business',
    'Education',
    'Healthcare',
    'Finance',
    'Legal',
    'Other',
  ];

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleUseTemplate = (template: JobTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1 }
        : t
    ));
    
    CustomAlertService.showConfirmation(
      t('jobTemplates.useTemplateTitle'),
      t('jobTemplates.useTemplateMessage'),
      () => {
        // Navigate to job posting with template data
        router.push({
          pathname: '/(modals)/add-job',
          params: {
            templateData: JSON.stringify({
              title: template.title,
              category: template.category,
              description: template.description,
              budget: template.budget,
              duration: template.duration,
              skills: template.skills,
              requirements: template.requirements,
            }),
          },
        });
      },
      undefined,
      isRTL
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    CustomAlertService.showConfirmation(
      t('jobTemplates.deleteTemplateTitle'),
      t('jobTemplates.deleteTemplateMessage'),
      () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      },
      undefined,
      isRTL
    );
  };

  const validateForm = () => {
    if (!newTemplate.title.trim()) {
      CustomAlertService.showError(t('common.error'), t('jobTemplates.titleRequired'));
      return false;
    }
    if (!newTemplate.category.trim()) {
      CustomAlertService.showError(t('common.error'), t('jobTemplates.categoryRequired'));
      return false;
    }
    if (!newTemplate.description.trim()) {
      CustomAlertService.showError(t('common.error'), t('jobTemplates.descriptionRequired'));
      return false;
    }
    if (!newTemplate.budgetMin || !newTemplate.budgetMax) {
      CustomAlertService.showError(t('common.error'), t('jobTemplates.budgetRequired'));
      return false;
    }
    if (parseInt(newTemplate.budgetMin) >= parseInt(newTemplate.budgetMax)) {
      CustomAlertService.showError(t('common.error'), t('jobTemplates.invalidBudgetRange'));
      return false;
    }
    return true;
  };

  const handleCreateTemplate = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const template: JobTemplate = {
        id: Date.now().toString(),
        title: newTemplate.title,
        category: newTemplate.category,
        description: newTemplate.description,
        budget: {
          min: parseInt(newTemplate.budgetMin),
          max: parseInt(newTemplate.budgetMax),
        },
        duration: newTemplate.duration,
        skills: newTemplate.skills.split(',').map(s => s.trim()).filter(s => s),
        requirements: newTemplate.requirements.split('\n').filter(r => r.trim()),
        createdAt: new Date(),
        usageCount: 0,
      };
      
      setTemplates(prev => [template, ...prev]);
      setNewTemplate({
        title: '',
        category: '',
        description: '',
        budgetMin: '',
        budgetMax: '',
        duration: '',
        skills: '',
        requirements: '',
      });
      setShowCreateForm(false);
      
      CustomAlertService.showSuccess(
        t('common.success'),
        t('jobTemplates.templateCreatedSuccess')
      );
    } catch (error) {
      CustomAlertService.showError(t('common.error'), t('jobTemplates.createTemplateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: adaptiveColors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    headerSection: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: adaptiveColors.primaryText,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: adaptiveColors.secondaryText,
      lineHeight: 24,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: adaptiveColors.primaryText,
    },
    templateCard: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    templateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    templateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
      flex: 1,
      marginRight: 8,
    },
    templateCategory: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    templateCategoryText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },
    templateDescription: {
      fontSize: 14,
      color: adaptiveColors.secondaryText,
      lineHeight: 20,
      marginBottom: 12,
    },
    templateDetails: {
      gap: 8,
      marginBottom: 16,
    },
    templateDetail: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    templateDetailIcon: {
      marginRight: 8,
    },
    templateDetailText: {
      fontSize: 14,
      color: adaptiveColors.primaryText,
      flex: 1,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 16,
    },
    skillTag: {
      backgroundColor: theme.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    skillTagText: {
      fontSize: 12,
      color: adaptiveColors.secondaryText,
    },
    templateFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    usageStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    usageStatsText: {
      fontSize: 12,
      color: adaptiveColors.secondaryText,
      marginLeft: 4,
    },
    templateActions: {
      flexDirection: 'row',
      gap: 8,
    },
    useButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    useButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: theme.error + '20',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
    },
    createButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    formContainer: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 12,
      padding: 20,
      marginTop: 16,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: adaptiveColors.primaryText,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: adaptiveColors.primaryText,
      backgroundColor: theme.background,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    budgetRow: {
      flexDirection: 'row',
      gap: 12,
    },
    budgetInput: {
      flex: 1,
    },
    formActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: adaptiveColors.cardBackground,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: adaptiveColors.secondaryText,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: adaptiveColors.secondaryText,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <ModalHeader 
        title={t('jobTemplates.title')}
        onClose={() => router.back()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>{t('jobTemplates.manageTemplates')}</Text>
          <Text style={styles.subtitle}>{t('jobTemplates.description')}</Text>
        </View>

        <View style={styles.searchContainer}>
          <Search 
            size={20} 
            color={theme.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('jobTemplates.searchPlaceholder')}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {filteredTemplates.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FileText size={40} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('jobTemplates.noSearchResults') : t('jobTemplates.noTemplatesTitle')}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? t('jobTemplates.noSearchResultsDesc') : t('jobTemplates.noTemplatesDescription')}
            </Text>
          </View>
        ) : (
          filteredTemplates.map((template) => (
            <View key={template.id} style={styles.templateCard}>
              <View style={styles.templateHeader}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <View style={styles.templateCategory}>
                  <Text style={styles.templateCategoryText}>{template.category}</Text>
                </View>
              </View>
              
              <Text style={styles.templateDescription}>{template.description}</Text>
              
              <View style={styles.templateDetails}>
                <View style={styles.templateDetail}>
                  <DollarSign 
                    size={16} 
                    color={theme.textSecondary} 
                    style={styles.templateDetailIcon}
                  />
                  <Text style={styles.templateDetailText}>
                    {t('jobTemplates.budget')}: {template.budget.min} - {template.budget.max} {t('common.qar')}
                  </Text>
                </View>
                <View style={styles.templateDetail}>
                  <Clock 
                    size={16} 
                    color={theme.textSecondary} 
                    style={styles.templateDetailIcon}
                  />
                  <Text style={styles.templateDetailText}>
                    {t('jobTemplates.duration')}: {template.duration}
                  </Text>
                </View>
              </View>

              <View style={styles.skillsContainer}>
                {(Array.isArray(template?.skills) ? template.skills : []).map((skill, index) => (
                  <View key={`${template?.id || "template"}-skill-${index}`} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{String(skill)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.templateFooter}>
                <View style={styles.usageStats}>
                  <BarChart3 size={16} color={theme.textSecondary} />
                  <Text style={styles.usageStatsText}>
                    {t('jobTemplates.usedTimes', { count: template.usageCount })}
                  </Text>
                </View>
                
                <View style={styles.templateActions}>
                  <TouchableOpacity 
                    style={styles.useButton}
                    onPress={() => handleUseTemplate(template)}
                  >
                    <Text style={styles.useButtonText}>{t('jobTemplates.use')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {!showCreateForm ? (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateForm(true);
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>{t('jobTemplates.createTemplate')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{t('jobTemplates.createNewTemplate')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTemplates.templateTitle')} *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.title}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, title: text }))}
                placeholder={t('jobTemplates.templateTitlePlaceholder')}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTemplates.category')} *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.category}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, category: text }))}
                placeholder={t('jobTemplates.selectCategory')}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTemplates.description')} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newTemplate.description}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, description: text }))}
                placeholder={t('jobTemplates.descriptionPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTemplates.budgetRange')} *</Text>
              <View style={styles.budgetRow}>
                <View style={styles.budgetInput}>
                  <TextInput
                    style={styles.input}
                    value={newTemplate.budgetMin}
                    onChangeText={(text) => setNewTemplate(prev => ({ ...prev, budgetMin: text }))}
                    placeholder={t('jobTemplates.minBudget')}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.budgetInput}>
                  <TextInput
                    style={styles.input}
                    value={newTemplate.budgetMax}
                    onChangeText={(text) => setNewTemplate(prev => ({ ...prev, budgetMax: text }))}
                    placeholder={t('jobTemplates.maxBudget')}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTemplates.duration')}</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.duration}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, duration: text }))}
                placeholder={t('jobTemplates.durationPlaceholder')}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTemplates.skills')}</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.skills}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, skills: text }))}
                placeholder={t('jobTemplates.skillsPlaceholder')}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('jobTemplates.requirements')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newTemplate.requirements}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, requirements: text }))}
                placeholder={t('jobTemplates.requirementsPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                multiline
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateForm(false);
                  setNewTemplate({
                    title: '',
                    category: '',
                    description: '',
                    budgetMin: '',
                    budgetMax: '',
                    duration: '',
                    skills: '',
                    requirements: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleCreateTemplate}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? t('jobTemplates.creating') : t('jobTemplates.createTemplate')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
