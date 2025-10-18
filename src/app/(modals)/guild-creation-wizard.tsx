import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Shield, Check, Users, MapPin, Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useGuild } from '../../contexts/GuildContext';
import { useCustomAlert } from '../../components/CustomAlert';

type WizardStep = 'basic' | 'details' | 'settings' | 'review';

interface GuildFormData {
  name: string;
  description: string;
  category: string;
  location: string;
  maxMembers: number;
  isPrivate: boolean;
  requiresApproval: boolean;
  tags: string[];
}

const GUILD_CATEGORIES = [
  'Technology',
  'Design',
  'Marketing',
  'Business',
  'Finance',
  'Education',
  'Healthcare',
  'Engineering',
  'Creative',
  'Other'
];

export default function GuildCreationWizard() {
  const { top, bottom } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { createGuild } = useGuild();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GuildFormData>({
    name: '',
    description: '',
    category: '',
    location: '',
    maxMembers: 50,
    isPrivate: false,
    requiresApproval: true,
    tags: [],
  });

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const steps: WizardStep[] = ['basic', 'details', 'settings', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      router.back();
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate current step
    if (!validateCurrentStep()) {
      return;
    }

    const steps: WizardStep[] = ['basic', 'details', 'settings', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      handleCreateGuild();
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'basic':
        if (!formData.name.trim()) {
          showAlert('error', 'Validation Error', 'Guild name is required');
          return false;
        }
        if (formData.name.length < 3) {
          showAlert('error', 'Validation Error', 'Guild name must be at least 3 characters');
          return false;
        }
        break;
      case 'details':
        if (!formData.description.trim()) {
          showAlert('error', 'Validation Error', 'Guild description is required');
          return false;
        }
        if (!formData.category) {
          showAlert('error', 'Validation Error', 'Please select a category');
          return false;
        }
        break;
      case 'settings':
        if (formData.maxMembers < 5 || formData.maxMembers > 500) {
          showAlert('error', 'Validation Error', 'Max members must be between 5 and 500');
          return false;
        }
        break;
    }
    return true;
  };

  const handleCreateGuild = async () => {
    setLoading(true);
    try {
      await createGuild({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        maxMembers: formData.maxMembers,
        isPrivate: formData.isPrivate,
        requiresApproval: formData.requiresApproval,
        tags: formData.tags,
        createdAt: new Date(),
      });

      showAlert('success', 'Success!', 'Guild created successfully!');
      
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error creating guild:', error);
      showAlert('error', 'Error', 'Failed to create guild. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getStepProgress = () => {
    const steps: WizardStep[] = ['basic', 'details', 'settings', 'review'];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return renderBasicStep();
      case 'details':
        return renderDetailsStep();
      case 'settings':
        return renderSettingsStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderBasicStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Basic Information
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Let's start with the basics of your guild
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>
          Guild Name *
        </Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.textPrimary 
          }]}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter guild name"
          placeholderTextColor={theme.textSecondary}
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>
          Location
        </Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.textPrimary 
          }]}
          value={formData.location}
          onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
          placeholder="Enter location (optional)"
          placeholderTextColor={theme.textSecondary}
        />
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Guild Details
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Tell us more about your guild
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>
          Description *
        </Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.textPrimary 
          }]}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Describe your guild's purpose and goals"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>
          Category *
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {GUILD_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: formData.category === category ? theme.primary : theme.surface,
                  borderColor: formData.category === category ? theme.primary : theme.border,
                }
              ]}
              onPress={() => setFormData(prev => ({ ...prev, category }))}
            >
              <Text style={[
                styles.categoryText,
                {
                  color: formData.category === category ? '#000' : theme.textPrimary
                }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderSettingsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Guild Settings
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Configure your guild preferences
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>
          Maximum Members
        </Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.textPrimary 
          }]}
          value={formData.maxMembers.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setFormData(prev => ({ ...prev, maxMembers: num }));
          }}
          placeholder="50"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
            Private Guild
          </Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Only invited members can join
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              backgroundColor: formData.isPrivate ? theme.primary : theme.surface,
              borderColor: theme.border,
            }
          ]}
          onPress={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
        >
          {formData.isPrivate && (
            <Ionicons name="checkmark" size={16} color="#000" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>
            Require Approval
          </Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            New members need approval to join
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggle,
            {
              backgroundColor: formData.requiresApproval ? theme.primary : theme.surface,
              borderColor: theme.border,
            }
          ]}
          onPress={() => setFormData(prev => ({ ...prev, requiresApproval: !prev.requiresApproval }))}
        >
          {formData.requiresApproval && (
            <Ionicons name="checkmark" size={16} color="#000" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Review & Create
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Review your guild information before creating
      </Text>

      <View style={[styles.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.reviewRow}>
          <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Name:</Text>
          <Text style={[styles.reviewValue, { color: theme.textPrimary }]}>{formData.name}</Text>
        </View>
        
        <View style={styles.reviewRow}>
          <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Category:</Text>
          <Text style={[styles.reviewValue, { color: theme.textPrimary }]}>{formData.category}</Text>
        </View>
        
        <View style={styles.reviewRow}>
          <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Location:</Text>
          <Text style={[styles.reviewValue, { color: theme.textPrimary }]}>{formData.location || 'Not specified'}</Text>
        </View>
        
        <View style={styles.reviewRow}>
          <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Max Members:</Text>
          <Text style={[styles.reviewValue, { color: theme.textPrimary }]}>{formData.maxMembers}</Text>
        </View>
        
        <View style={styles.reviewRow}>
          <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Privacy:</Text>
          <Text style={[styles.reviewValue, { color: theme.textPrimary }]}>
            {formData.isPrivate ? 'Private' : 'Public'}
          </Text>
        </View>
        
        <View style={styles.reviewRow}>
          <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Approval:</Text>
          <Text style={[styles.reviewValue, { color: theme.textPrimary }]}>
            {formData.requiresApproval ? 'Required' : 'Not Required'}
          </Text>
        </View>
        
        <View style={styles.reviewDescription}>
          <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Description:</Text>
          <Text style={[styles.reviewDescriptionText, { color: theme.textPrimary }]}>
            {formData.description}
          </Text>
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: top + 10,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    stepIndicator: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginTop: 10,
      borderRadius: 2,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 2,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    stepContainer: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    stepDescription: {
      fontSize: 16,
      marginBottom: 32,
      lineHeight: 24,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    categoryScroll: {
      marginTop: 8,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
    },
    settingRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingInfo: {
      flex: 1,
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    toggle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 20,
    },
    reviewRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    reviewLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    reviewValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    reviewDescription: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    reviewDescriptionText: {
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
    footer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: bottom + 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 12,
    },
    footerButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonFooter: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    nextButton: {
      backgroundColor: theme.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    backButtonText: {
      color: theme.textPrimary,
    },
    nextButtonText: {
      color: '#000',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AlertComponent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons 
              name={isRTL ? "chevron-forward" : "chevron-back"} 
              size={24} 
              color={theme.textPrimary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Guild</Text>
        </View>
        <Text style={styles.stepIndicator}>
          {['basic', 'details', 'settings', 'review'].indexOf(currentStep) + 1}/4
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${getStepProgress()}%` }
          ]} 
        />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.backButtonFooter]}
          onPress={handleBack}
        >
          <Text style={[styles.buttonText, styles.backButtonText]}>
            {currentStep === 'basic' ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.footerButton, styles.nextButton]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.nextButtonText]}>
            {loading ? 'Creating...' : currentStep === 'review' ? 'Create Guild' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

