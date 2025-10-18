import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ModalHeader from '../components/ModalHeader';
import { validateJobForm, sanitizeInput, RateLimiter } from '../../utils/validation';

const { width } = Dimensions.get('window');

interface JobFormData {
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  duration: string;
  skills: string;
  requirements: string;
}

export default function AddJobScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    duration: '',
    skills: '',
    requirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const categories = [
    { key: 'development', label: isRTL ? 'التطوير' : 'Development' },
    { key: 'design', label: isRTL ? 'التصميم' : 'Design' },
    { key: 'marketing', label: isRTL ? 'التسويق' : 'Marketing' },
    { key: 'writing', label: isRTL ? 'الكتابة' : 'Writing' },
    { key: 'translation', label: isRTL ? 'الترجمة' : 'Translation' },
    { key: 'consulting', label: isRTL ? 'الاستشارات' : 'Consulting' },
    { key: 'other', label: isRTL ? 'أخرى' : 'Other' },
  ];

  const handleInputChange = (field: keyof JobFormData, value: string) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Rate limiting check
    const rateLimitKey = 'job_submission';
    if (!RateLimiter.canAttempt(rateLimitKey, 3, 300000)) { // 3 attempts per 5 minutes
      const remainingTime = Math.ceil(RateLimiter.getRemainingTime(rateLimitKey, 300000) / 60000);
      Alert.alert(
        isRTL ? 'تم تجاوز الحد المسموح' : 'Rate Limit Exceeded',
        isRTL ? `يرجى المحاولة مرة أخرى بعد ${remainingTime} دقيقة` : `Please try again in ${remainingTime} minutes`
      );
      return;
    }

    // Comprehensive validation
    const jobData = {
      title: formData.title,
      company: 'User Company', // This would come from user profile
      description: formData.description,
      salary: formData.budget,
      location: formData.location,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
    };

    const validation = validateJobForm(jobData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      // Show first error
      const firstError = Object.values(validation.errors)[0];
      Alert.alert(
        isRTL ? 'خطأ في التحقق' : 'Validation Error',
        firstError
      );
      return;
    }

    // Clear any previous validation errors
    setValidationErrors({});

    if (!formData.description.trim()) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال وصف الوظيفة' : 'Please enter job description'
      );
      return;
    }

    if (!formData.budget.trim()) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الميزانية' : 'Please enter budget'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم نشر الوظيفة بنجاح!' : 'Job posted successfully!',
        [
          {
            text: isRTL ? 'موافق' : 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في نشر الوظيفة. يرجى المحاولة مرة أخرى.' : 'Failed to post job. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ModalHeader
        title={isRTL ? 'إضافة وظيفة جديدة' : 'Add New Job'}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Job Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'عنوان الوظيفة' : 'Job Title'} *
          </Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={[
                styles.input,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  marginLeft: isRTL ? 0 : 12,
                  marginRight: isRTL ? 12 : 0,
                }
              ]}
              placeholder={isRTL ? 'مثال: مطور React Native' : 'e.g. React Native Developer'}
              placeholderTextColor={theme.textSecondary}
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'وصف الوظيفة' : 'Job Description'} *
          </Text>
          <View style={[styles.textAreaContainer, { borderColor: theme.border }]}>
            <TextInput
              style={[
                styles.textArea,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }
              ]}
              placeholder={isRTL ? 'اكتب وصفاً مفصلاً للوظيفة...' : 'Write a detailed job description...'}
              placeholderTextColor={theme.textSecondary}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'الفئة' : 'Category'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.categoryContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: formData.category === category.key ? theme.primary : 'transparent',
                      borderColor: theme.primary,
                    }
                  ]}
                  onPress={() => handleInputChange('category', category.key)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: formData.category === category.key ? '#000000' : theme.textPrimary,
                      }
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'الميزانية (ق.ر)' : 'Budget (QR)'} *
          </Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="cash-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={[
                styles.input,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  marginLeft: isRTL ? 0 : 12,
                  marginRight: isRTL ? 12 : 0,
                }
              ]}
              placeholder={isRTL ? 'مثال: 1000-2000' : 'e.g. 1000-2000'}
              placeholderTextColor={theme.textSecondary}
              value={formData.budget}
              onChangeText={(text) => handleInputChange('budget', text)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'الموقع' : 'Location'}
          </Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="location-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={[
                styles.input,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  marginLeft: isRTL ? 0 : 12,
                  marginRight: isRTL ? 12 : 0,
                }
              ]}
              placeholder={isRTL ? 'مثال: الدوحة، قطر' : 'e.g. Doha, Qatar'}
              placeholderTextColor={theme.textSecondary}
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
            />
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'المدة المتوقعة' : 'Expected Duration'}
          </Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={[
                styles.input,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  marginLeft: isRTL ? 0 : 12,
                  marginRight: isRTL ? 12 : 0,
                }
              ]}
              placeholder={isRTL ? 'مثال: أسبوعين' : 'e.g. 2 weeks'}
              placeholderTextColor={theme.textSecondary}
              value={formData.duration}
              onChangeText={(text) => handleInputChange('duration', text)}
            />
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'المهارات المطلوبة' : 'Required Skills'}
          </Text>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={[
                styles.input,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                  marginLeft: isRTL ? 0 : 12,
                  marginRight: isRTL ? 12 : 0,
                }
              ]}
              placeholder={isRTL ? 'مثال: React, Node.js, TypeScript' : 'e.g. React, Node.js, TypeScript'}
              placeholderTextColor={theme.textSecondary}
              value={formData.skills}
              onChangeText={(text) => handleInputChange('skills', text)}
            />
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'المتطلبات الإضافية' : 'Additional Requirements'}
          </Text>
          <View style={[styles.textAreaContainer, { borderColor: theme.border }]}>
            <TextInput
              style={[
                styles.textArea,
                { 
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }
              ]}
              placeholder={isRTL ? 'أي متطلبات إضافية للوظيفة...' : 'Any additional requirements for the job...'}
              placeholderTextColor={theme.textSecondary}
              value={formData.requirements}
              onChangeText={(text) => handleInputChange('requirements', text)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.primary,
              opacity: isSubmitting ? 0.7 : 1,
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitButtonText, { color: '#000000' }]}>
            {isSubmitting 
              ? (isRTL ? 'جاري النشر...' : 'Posting...')
              : (isRTL ? 'نشر الوظيفة' : 'Post Job')
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textArea: {
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  categoryContainer: {
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
