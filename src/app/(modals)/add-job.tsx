import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ModalHeader from '../components/ModalHeader';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import { useRealPayment } from '../../contexts/RealPaymentContext';
import { 
  Briefcase, DollarSign, MapPin, Clock, X, Code, Palette, Megaphone, PenTool, 
  Users, Wrench, FileText, Camera, Video, Music, Languages, Headphones, 
  ShoppingCart, Search, BarChart3, Shield, Car, Home, Utensils, 
  GraduationCap, Dumbbell, Heart, Baby, Dog, Hammer, Zap, Paintbrush, 
  Truck, BookOpen, Calculator, Globe, Lock, Lightbulb, Target, Smartphone
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface JobFormData {
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  duration: string;
  showOnMap: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export default function AddJobScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { wallet } = useRealPayment();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.textPrimary : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    duration: '',
    showOnMap: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const categories = [
    // Technology & Development
    { key: 'development', label: isRTL ? 'التطوير' : 'Development', icon: Code },
    { key: 'design', label: isRTL ? 'التصميم' : 'Design', icon: Palette },
    { key: 'ui-ux', label: isRTL ? 'واجهة المستخدم' : 'UI/UX', icon: Target },
    { key: 'web-design', label: isRTL ? 'تصميم المواقع' : 'Web Design', icon: Globe },
    { key: 'mobile-app', label: isRTL ? 'تطبيقات الهاتف' : 'Mobile App', icon: Smartphone },
    
    // Media & Creative
    { key: 'photography', label: isRTL ? 'التصوير' : 'Photography', icon: Camera },
    { key: 'video', label: isRTL ? 'الفيديو' : 'Video', icon: Video },
    { key: 'music', label: isRTL ? 'الموسيقى' : 'Music', icon: Music },
    { key: 'audio', label: isRTL ? 'الصوتيات' : 'Audio', icon: Headphones },
    { key: 'animation', label: isRTL ? 'الرسوم المتحركة' : 'Animation', icon: Zap },
    
    // Content & Communication
    { key: 'writing', label: isRTL ? 'الكتابة' : 'Writing', icon: PenTool },
    { key: 'translation', label: isRTL ? 'الترجمة' : 'Translation', icon: Languages },
    { key: 'content-creation', label: isRTL ? 'إنشاء المحتوى' : 'Content Creation', icon: FileText },
    { key: 'social-media', label: isRTL ? 'وسائل التواصل' : 'Social Media', icon: Megaphone },
    { key: 'blogging', label: isRTL ? 'المدونات' : 'Blogging', icon: BookOpen },
    
    // Business & Marketing
    { key: 'marketing', label: isRTL ? 'التسويق' : 'Marketing', icon: BarChart3 },
    { key: 'sales', label: isRTL ? 'المبيعات' : 'Sales', icon: ShoppingCart },
    { key: 'consulting', label: isRTL ? 'الاستشارات' : 'Consulting', icon: Users },
    { key: 'data-analysis', label: isRTL ? 'تحليل البيانات' : 'Data Analysis', icon: BarChart3 },
    { key: 'research', label: isRTL ? 'البحث' : 'Research', icon: Search },
    
    // Services & Maintenance
    { key: 'maintenance', label: isRTL ? 'الصيانة' : 'Maintenance', icon: Wrench },
    { key: 'cleaning', label: isRTL ? 'التنظيف' : 'Cleaning', icon: Home },
    { key: 'plumbing', label: isRTL ? 'السباكة' : 'Plumbing', icon: Hammer },
    { key: 'electrical', label: isRTL ? 'الكهرباء' : 'Electrical', icon: Zap },
    { key: 'painting', label: isRTL ? 'الدهان' : 'Painting', icon: Paintbrush },
    
    // Transportation & Delivery
    { key: 'delivery', label: isRTL ? 'التوصيل' : 'Delivery', icon: Truck },
    { key: 'driving', label: isRTL ? 'القيادة' : 'Driving', icon: Car },
    { key: 'logistics', label: isRTL ? 'اللوجستيات' : 'Logistics', icon: Truck },
    
    // Personal Services
    { key: 'cooking', label: isRTL ? 'الطبخ' : 'Cooking', icon: Utensils },
    { key: 'tutoring', label: isRTL ? 'الدروس الخصوصية' : 'Tutoring', icon: GraduationCap },
    { key: 'fitness', label: isRTL ? 'اللياقة البدنية' : 'Fitness', icon: Dumbbell },
    { key: 'beauty', label: isRTL ? 'التجميل' : 'Beauty', icon: Heart },
    { key: 'childcare', label: isRTL ? 'رعاية الأطفال' : 'Childcare', icon: Baby },
    { key: 'pet-care', label: isRTL ? 'رعاية الحيوانات' : 'Pet Care', icon: Dog },
    
    // Professional Services
    { key: 'accounting', label: isRTL ? 'المحاسبة' : 'Accounting', icon: Calculator },
    { key: 'legal', label: isRTL ? 'القانون' : 'Legal', icon: Shield },
    { key: 'security', label: isRTL ? 'الأمن' : 'Security', icon: Lock },
    { key: 'project-management', label: isRTL ? 'إدارة المشاريع' : 'Project Management', icon: Target },
    
    // Other
    { key: 'other', label: isRTL ? 'أخرى' : 'Other', icon: Lightbulb },
  ];

  const durations = [
    { key: '1-2-days', label: isRTL ? '1-2 أيام' : '1-2 days' },
    { key: '3-7-days', label: isRTL ? '3-7 أيام' : '3-7 days' },
    { key: '1-2-weeks', label: isRTL ? '1-2 أسابيع' : '1-2 weeks' },
    { key: '2-4-weeks', label: isRTL ? '2-4 أسابيع' : '2-4 weeks' },
    { key: '1-3-months', label: isRTL ? '1-3 أشهر' : '1-3 months' },
    { key: 'flexible', label: isRTL ? 'مرن' : 'Flexible' },
  ];

  const handleInputChange = (field: keyof JobFormData, value: string) => {
    // NO SANITIZATION - Keep spaces and special characters
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال عنوان الوظيفة' : 'Please enter job title'
      );
      return;
    }

    if (!formData.description.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال وصف الوظيفة' : 'Please enter job description'
      );
      return;
    }

    if (!formData.category) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى اختيار الفئة' : 'Please select category'
      );
      return;
    }

    // Budget validation commented out for beta testing with Guild Coins
    /*
    if (!formData.budget.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الميزانية' : 'Please enter budget'
      );
      return;
    }
    */

    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create job using Firebase service
      const jobData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: 'To be discussed', // Default budget for beta testing
        location: formData.location || 'Remote',
        timeNeeded: formData.duration || 'To be discussed',
        skills: [], // No required skills
        isUrgent: false,
        adminStatus: 'pending_review' as const,
        clientId: user.uid,
        clientName: user.displayName || user.email || 'Anonymous Client',
        showOnMap: formData.showOnMap,
        coordinates: formData.coordinates,
        clientAvatar: user.photoURL || undefined,
      };

      const result = await jobService.createJob(jobData);
      
      console.log('✅ Job created successfully:', result.job.id);
      
      // Note: Job posting is currently free during beta testing
      // Real payment integration will be added later if needed
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال الوظيفة' : 'Job Submitted',
        isRTL ? 'تم إرسال وظيفتك للمراجعة. ستظهر للمستقلين بعد الموافقة.' : 'Your job has been submitted for review. It will be visible after admin approval.',
        [
          {
            text: isRTL ? 'موافق' : 'OK',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error posting job:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في نشر الوظيفة. يرجى المحاولة مرة أخرى.' : 'Failed to post job. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ModalHeader 
        title={isRTL ? 'إنشاء وظيفة' : 'Create Job'} 
        onBack={() => router.back()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: theme.primary + '15' }]}>
          <Briefcase size={48} color={theme.primary} />
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'انشر وظيفتك' : 'Post Your Job'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {isRTL ? 'سيتم مراجعتها من قبل الإدارة' : 'Will be reviewed by admin'}
          </Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              {isRTL ? 'عنوان الوظيفة' : 'Job Title'}
            </Text>
            <View style={[styles.requiredBadge, { backgroundColor: theme.error + '20' }]}>
              <Text style={[styles.requiredText, { color: theme.error }]}>
                *
              </Text>
            </View>
          </View>
          <View style={[
            styles.inputContainer, 
            { 
              borderColor: focusedField === 'title' ? theme.primary : theme.border,
              borderWidth: focusedField === 'title' ? 2 : 1,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }
          ]}>
            <Briefcase 
              size={20} 
              color={theme.textSecondary} 
              style={{ marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }
              ]}
              placeholder={isRTL ? 'مثال: مطور تطبيقات محمول' : 'e.g. Mobile App Developer'}
              placeholderTextColor={theme.textSecondary}
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
              autoCapitalize="words"
              maxLength={100}
            />
          </View>
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {formData.title.length}/100
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              {isRTL ? 'وصف الوظيفة' : 'Job Description'}
            </Text>
            <View style={[styles.requiredBadge, { backgroundColor: theme.error + '20' }]}>
              <Text style={[styles.requiredText, { color: theme.error }]}>
                *
              </Text>
            </View>
          </View>
          <View style={[
            styles.textAreaContainer, 
            { 
              borderColor: focusedField === 'description' ? theme.primary : theme.border,
              borderWidth: focusedField === 'description' ? 2 : 1,
            }
          ]}>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }
              ]}
              placeholder={isRTL ? 'اكتب وصفاً تفصيلياً للوظيفة، المهام، والمتطلبات...' : 'Describe the job, tasks, and requirements in detail...'}
              placeholderTextColor={theme.textSecondary}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoCapitalize="sentences"
              maxLength={8000}
            />
          </View>
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {formData.description.length}/8000
          </Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              {isRTL ? 'الفئة' : 'Category'}
            </Text>
            <View style={[styles.requiredBadge, { backgroundColor: theme.error + '20' }]}>
              <Text style={[styles.requiredText, { color: theme.error }]}>
                *
              </Text>
            </View>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
            style={styles.categoryScrollView}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: formData.category === category.key 
                        ? theme.primary 
                        : theme.surface,
                      borderColor: formData.category === category.key 
                        ? theme.primary 
                        : theme.border,
                    }
                  ]}
                  onPress={() => handleInputChange('category', category.key)}
                  activeOpacity={0.7}
                >
                  <IconComponent 
                    size={32} 
                    color={formData.category === category.key ? '#000000' : theme.textPrimary} 
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        color: formData.category === category.key 
                          ? '#000000' 
                          : theme.textPrimary,
                      }
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Budget - Commented out for beta testing with Guild Coins */}
        {/* 
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              {isRTL ? 'الميزانية' : 'Budget'}
            </Text>
            <View style={[styles.requiredBadge, { backgroundColor: theme.error + '20' }]}>
              <Text style={[styles.requiredText, { color: theme.error }]}>
                *
              </Text>
            </View>
          </View>
          <View style={[
            styles.inputContainer, 
            { 
              borderColor: focusedField === 'budget' ? theme.primary : theme.border,
              borderWidth: focusedField === 'budget' ? 2 : 1,
            }
          ]}>
            <DollarSign size={20} color={theme.textSecondary} />
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }
              ]}
              placeholder={isRTL ? 'مثال: 1000-2000 ق.ر' : 'e.g. 1000-2000 QAR'}
              placeholderTextColor={theme.textSecondary}
              value={formData.budget}
              onChangeText={(text) => handleInputChange('budget', text)}
              onFocus={() => setFocusedField('budget')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
          </View>
        </View>
        */}

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'الموقع' : 'Location'} 
            <Text style={[styles.optional, { color: theme.textSecondary }]}>
              {' '}({isRTL ? 'اختياري' : 'Optional'})
            </Text>
          </Text>
          <View style={[
            styles.inputContainer, 
            { 
              borderColor: focusedField === 'location' ? theme.primary : theme.border,
              borderWidth: focusedField === 'location' ? 2 : 1,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }
          ]}>
            <MapPin 
              size={20} 
              color={theme.textSecondary} 
              style={{ marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }
              ]}
              placeholder={isRTL ? 'مثال: الدوحة، قطر' : 'e.g. Doha, Qatar'}
              placeholderTextColor={theme.textSecondary}
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              onFocus={() => setFocusedField('location')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Show on Map Option */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'عرض على الخريطة' : 'Show on Map'}
            <Text style={[styles.optional, { color: theme.textSecondary }]}>
              {isRTL ? ' (اختياري)' : ' (Optional)'}
            </Text>
          </Text>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            {isRTL 
              ? 'اختر هذا الخيار لعرض الوظيفة على خريطة GUILD للمستخدمين القريبين'
              : 'Check this to display your job on the GUILD map for nearby users'
            }
          </Text>
          <TouchableOpacity
            style={[
              styles.mapOptionContainer,
              { 
                backgroundColor: formData.showOnMap ? theme.primary + '20' : theme.surface,
                borderColor: formData.showOnMap ? theme.primary : theme.border,
                borderWidth: formData.showOnMap ? 2 : 1,
              }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, showOnMap: !prev.showOnMap }))}
          >
            <View style={styles.mapOptionContent}>
            <View style={[styles.mapOptionLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MapPin 
                size={20} 
                color={formData.showOnMap ? theme.primary : theme.textSecondary} 
                style={{ marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}
              />
              <View style={styles.mapOptionText}>
                <Text style={[
                  styles.mapOptionTitle, 
                  { 
                    color: formData.showOnMap ? theme.primary : theme.textPrimary,
                    textAlign: isRTL ? 'right' : 'left',
                  }
                ]}>
                  {isRTL ? 'عرض على خريطة GUILD' : 'Show on GUILD Map'}
                </Text>
                <Text style={[
                  styles.mapOptionSubtitle, 
                  { 
                    color: theme.textSecondary,
                    textAlign: isRTL ? 'right' : 'left',
                  }
                ]}>
                  {isRTL 
                    ? 'سيساعد المستخدمين القريبين في العثور على وظيفتك'
                    : 'Help nearby users discover your job'
                  }
                </Text>
              </View>
            </View>
              <View style={[
                styles.mapOptionToggle,
                { backgroundColor: formData.showOnMap ? theme.primary : theme.border }
              ]}>
                <View style={[
                  styles.mapOptionToggleThumb,
                  { 
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: formData.showOnMap ? 20 : 2 }]
                  }
                ]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {isRTL ? 'المدة المتوقعة' : 'Expected Duration'}
            <Text style={[styles.optional, { color: theme.textSecondary }]}>
              {' '}({isRTL ? 'اختياري' : 'Optional'})
            </Text>
          </Text>
          <View style={styles.durationGrid}>
            {durations.map((dur) => (
              <TouchableOpacity
                key={dur.key}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: formData.duration === dur.label 
                      ? theme.primary + '20' 
                      : theme.surface,
                    borderColor: formData.duration === dur.label 
                      ? theme.primary 
                      : theme.border,
                  }
                ]}
                onPress={() => handleInputChange('duration', dur.label)}
                activeOpacity={0.7}
              >
                <Clock size={16} color={formData.duration === dur.label ? theme.primary : theme.textSecondary} />
                <Text
                  style={[
                    styles.durationText,
                    {
                      color: formData.duration === dur.label 
                        ? theme.primary 
                        : theme.textPrimary,
                    }
                  ]}
                >
                  {dur.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        {/* Posting Cost Display */}
        <View style={[styles.postingCostContainer, { backgroundColor: theme.surfaceSecondary }]}>
          <View style={[styles.postingCostRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.postingCostLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'تكلفة النشر' : 'Posting Cost'}
            </Text>
            <View style={[styles.postingCostAmount, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.postingCostValue, { color: theme.primary }]}>25</Text>
              <Text style={[styles.postingCostCurrency, { color: theme.primary }]}>🪙</Text>
            </View>
          </View>
          <View style={[styles.postingCostRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.postingCostLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'رصيدك الحالي' : 'Your Balance'}
            </Text>
            <Text style={[styles.postingCostBalance, { color: theme.textPrimary }]}>
              {wallet?.balance || 0} 🪙
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.primary,
              opacity: isSubmitting ? 0.5 : 1,
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Briefcase 
                size={20} 
                color="#000000" 
                style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} 
              />
              <Text style={[styles.submitText, { color: '#000000' }]}>
                {isRTL ? 'إنشاء الوظيفة' : 'Create Job'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  hero: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  optional: {
    fontSize: 14,
    fontWeight: '400',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  requiredBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  textArea: {
    fontSize: 16,
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  categoryScrollView: {
    marginTop: 8,
  },
  categoryScrollContainer: {
    paddingRight: 20,
  },
  categoryCard: {
    width: 120,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
  },
  mapOptionContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  mapOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  mapOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mapOptionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  mapOptionToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  mapOptionToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  postingCostContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  postingCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postingCostLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  postingCostAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postingCostValue: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  postingCostCurrency: {
    fontSize: 14,
  },
  postingCostBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
});
