import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import {
  X,
  CheckCircle,
  FileText,
  DollarSign,
  Settings,
  Send,
  Clock,
  Users,
  Star,
  Shield,
  AlertCircle,
} from 'lucide-react-native';

export default function JobPostingHelp() {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  const steps = [
    {
      number: 1,
      icon: FileText,
      title: isRTL ? 'المعلومات الأساسية' : 'Basic Information',
      description: isRTL
        ? 'اختر اللغة الأساسية لإعلانك، وأدخل عنوان الوظيفة ووصفها والفئة. يمكنك إضافة المحتوى بالإنجليزية أو العربية أو كليهما.'
        : 'Choose your ad\'s primary language, enter job title, description, and category. You can add content in English, Arabic, or both.',
      tips: [
        isRTL ? 'استخدم عنواناً واضحاً ووصفياً' : 'Use a clear and descriptive title',
        isRTL ? 'اكتب وصفاً تفصيلياً للوظيفة' : 'Write a detailed job description',
        isRTL ? 'اختر الفئة المناسبة' : 'Select the appropriate category',
      ],
    },
    {
      number: 2,
      icon: DollarSign,
      title: isRTL ? 'الميزانية والموقع' : 'Budget & Location',
      description: isRTL
        ? 'حدد نوع الميزانية (ثابت، ساعي، قابل للتفاوض)، المبلغ، المدة، والموقع. يمكنك استخدام موقعك الحالي أو اختيار موقع من الخريطة.'
        : 'Set budget type (fixed, hourly, negotiable), amount, duration, and location. You can use your current location or choose from map.',
      tips: [
        isRTL ? 'كن واقعياً في تحديد الميزانية' : 'Be realistic with your budget',
        isRTL ? 'حدد إذا كان العمل عن بُعد' : 'Specify if work is remote',
        isRTL ? 'أضف متطلبات ومخرجات واضحة' : 'Add clear requirements and deliverables',
      ],
    },
    {
      number: 3,
      icon: Settings,
      title: isRTL ? 'الخيارات المتقدمة' : 'Advanced Options',
      description: isRTL
        ? 'اختر مستوى الخبرة المطلوب، خيارات الرؤية (عام، النقابة فقط، مميز)، وخيارات الترويج لزيادة ظهور إعلانك.'
        : 'Choose required experience level, visibility options (public, guild only, premium), and promotion options to boost your ad visibility.',
      tips: [
        isRTL ? 'الوظائف العاجلة تحصل على أولوية' : 'Urgent jobs get priority',
        isRTL ? 'الوظائف المميزة تظهر في المقدمة' : 'Featured jobs appear at top',
        isRTL ? 'التعزيز يزيد الظهور لمدة 7 أيام' : 'Boost increases visibility for 7 days',
      ],
    },
    {
      number: 4,
      icon: Send,
      title: isRTL ? 'المراجعة والإرسال' : 'Review & Submit',
      description: isRTL
        ? 'راجع ملخص الوظيفة وتأكد من صحة جميع المعلومات قبل الإرسال. سيتم مراجعة إعلانك من قبل الإدارة قبل النشر.'
        : 'Review job summary and ensure all information is correct before submitting. Your ad will be reviewed by admin before publishing.',
      tips: [
        isRTL ? 'تحقق من جميع التفاصيل' : 'Double-check all details',
        isRTL ? 'المراجعة تستغرق 24-48 ساعة' : 'Review takes 24-48 hours',
        isRTL ? 'ستتلقى إشعاراً عند الموافقة' : 'You\'ll get notified when approved',
      ],
    },
  ];

  const additionalInfo = [
    {
      icon: Clock,
      title: isRTL ? 'وقت المراجعة' : 'Review Time',
      description: isRTL
        ? 'عادة ما تستغرق المراجعة 24-48 ساعة. الوظائف العاجلة لها أولوية.'
        : 'Review usually takes 24-48 hours. Urgent jobs have priority.',
    },
    {
      icon: Users,
      title: isRTL ? 'العروض' : 'Offers',
      description: isRTL
        ? 'ستبدأ في تلقي العروض من المستقلين بمجرد الموافقة على الوظيفة.'
        : 'You\'ll start receiving offers from freelancers once job is approved.',
    },
    {
      icon: Star,
      title: isRTL ? 'التقييمات' : 'Ratings',
      description: isRTL
        ? 'بعد إكمال الوظيفة، يمكنك تقييم المستقل والعكس صحيح.'
        : 'After job completion, you can rate the freelancer and vice versa.',
    },
    {
      icon: Shield,
      title: isRTL ? 'الحماية' : 'Protection',
      description: isRTL
        ? 'جميع المعاملات محمية. الدفع يتم فقط بعد إكمال العمل بنجاح.'
        : 'All transactions are protected. Payment only after successful completion.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'CC']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color="#000000" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            }]}>
              {isRTL ? 'دليل نشر الوظائف' : 'Job Posting Guide'}
            </Text>
            <Text style={[styles.headerSubtitle, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            }]}>
              {isRTL ? 'كل ما تحتاج معرفته' : 'Everything you need to know'}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Steps */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'خطوات نشر الوظيفة' : 'Job Posting Steps'}
          </Text>
          
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <View
                key={step.number}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.stepHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.stepNumber, { 
                    backgroundColor: theme.primary,
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  }]}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: theme.primary + '20',
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  }]}>
                    <IconComponent size={20} color={theme.primary} />
                  </View>
                  <Text style={[styles.stepTitle, { 
                    color: theme.textPrimary,
                    textAlign: isRTL ? 'right' : 'left',
                    flex: 1,
                  }]}>
                    {step.title}
                  </Text>
                </View>
                
                <Text style={[styles.stepDescription, { 
                  color: theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                }]}>
                  {step.description}
                </Text>
                
                <View style={styles.tipsContainer}>
                  {step.tips.map((tip, tipIndex) => (
                    <View
                      key={tipIndex}
                      style={[styles.tipItem, { 
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                      }]}
                    >
                      <View style={{
                        marginRight: isRTL ? 0 : 8,
                        marginLeft: isRTL ? 8 : 0,
                        marginTop: 2,
                      }}>
                        <CheckCircle size={16} color={theme.primary} />
                      </View>
                      <Text style={[styles.tipText, { 
                        color: theme.textPrimary,
                        textAlign: isRTL ? 'right' : 'left',
                        flex: 1,
                      }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'معلومات إضافية' : 'Additional Information'}
          </Text>
          
          {additionalInfo.map((info, index) => {
            const IconComponent = info.icon;
            return (
              <View
                key={index}
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <View style={[styles.infoIcon, { 
                  backgroundColor: theme.primary + '20',
                  marginRight: isRTL ? 0 : 12,
                  marginLeft: isRTL ? 12 : 0,
                }]}>
                  <IconComponent size={20} color={theme.primary} />
                </View>
                <View style={[styles.infoContent, { 
                  flex: 1,
                }]}>
                  <Text style={[styles.infoTitle, { 
                    color: theme.textPrimary,
                    textAlign: isRTL ? 'right' : 'left',
                  }]}>
                    {info.title}
                  </Text>
                  <Text style={[styles.infoDescription, { 
                    color: theme.textSecondary,
                    textAlign: isRTL ? 'right' : 'left',
                  }]}>
                    {info.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Important Note */}
        <View style={[styles.noteCard, { 
          backgroundColor: theme.primary + '10',
          borderColor: theme.primary,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }]}>
          <View style={{
            marginRight: isRTL ? 0 : 12,
            marginLeft: isRTL ? 12 : 0,
            marginTop: 2,
          }}>
            <AlertCircle size={20} color={theme.primary} />
          </View>
          <Text style={[styles.noteText, { 
            color: theme.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
            flex: 1,
          }]}>
            {isRTL
              ? 'تأكد من قراءة شروط الخدمة قبل نشر الوظيفة. الوظائف التي تنتهك الشروط سيتم رفضها.'
              : 'Make sure to read terms of service before posting. Jobs violating terms will be rejected.'}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tipsContainer: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  bottomSpacer: {
    height: 40,
  },
});

