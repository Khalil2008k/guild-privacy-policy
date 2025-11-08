import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlertService } from '../../services/CustomAlertService';
import { contractService } from '../../services/contractService';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  CheckCircle,
  Download,
  Share2,
  Printer,
  X,
  PlayCircle,
  AlertCircle,
} from 'lucide-react-native';

export default function ContractTestScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [testContractId, setTestContractId] = useState<string | null>(null);

  // Test 1: Create a test contract
  const handleCreateTestContract = async () => {
    if (!user?.uid) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in'
      );
      return;
    }

    setLoading(true);
    try {
      const jobId = 'test-job-' + Date.now();
      const jobTitle = isRTL ? 'عقد اختبار - تطوير موقع ويب' : 'Test Contract - Web Development';
      const jobDescription = isRTL
        ? 'هذا عقد اختبار لتطوير موقع ويب متكامل مع جميع الميزات المطلوبة.'
        : 'This is a test contract for developing a complete website with all required features.';
      
      const poster = {
        userId: user.uid,
        gid: user.uid.substring(0, 8).toUpperCase(),
        name: 'Test Poster',
        email: user.email || 'poster@test.com',
      };
      
      const doer = {
        userId: 'test-freelancer-' + Date.now(),
        gid: 'FL' + Date.now().toString().substring(7),
        name: 'Test Freelancer',
        email: 'freelancer@test.com',
      };
      
      const financialTerms = {
        budget: '5000',
        currency: 'QR',
        paymentTerms: 'Payment in 3 milestones: 30% upfront, 40% mid-project, 30% on completion',
        paymentTermsAr: 'الدفع على 3 مراحل: 30% عند البداية، 40% عند منتصف المشروع، 30% عند الإنجاز',
      };
      
      const timeline = {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estimatedDuration: '30 days',
      };
      
      const deliverables = {
        en: [
          'UI/UX Design',
          'Frontend Development',
          'Backend Development',
          'Comprehensive Testing',
          'Deployment',
        ],
        ar: [
          'تصميم واجهة المستخدم',
          'تطوير الواجهة الأمامية',
          'تطوير الواجهة الخلفية',
          'اختبار شامل',
          'نشر على السيرفر',
        ],
      };
      
      const posterRules = [
        {
          text: 'Full source code must be delivered',
          textAr: 'يجب تسليم الكود المصدري بالكامل',
        },
        {
          text: 'Comprehensive project documentation required',
          textAr: 'توثيق شامل للمشروع مطلوب',
        },
        {
          text: '30 days technical support after delivery',
          textAr: 'دعم فني لمدة 30 يوم بعد التسليم',
        },
      ];

      const contractId = await contractService.createContract(
        jobId,
        jobTitle,
        jobDescription,
        poster,
        doer,
        financialTerms,
        timeline,
        deliverables,
        posterRules,
        isRTL ? 'ar' : 'en'
      );
      setTestContractId(contractId);

      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL
          ? `تم إنشاء عقد اختبار بنجاح\nرقم العقد: ${contractId}`
          : `Test contract created successfully\nContract ID: ${contractId}`
      );
    } catch (error: any) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل إنشاء العقد' : 'Failed to create contract')
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 2: View the test contract
  const handleViewContract = () => {
    if (!testContractId) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب إنشاء عقد اختبار أولاً' : 'Create a test contract first'
      );
      return;
    }

    router.push(`/contract-view?contractId=${testContractId}`);
  };

  // Test 3: Sign as poster
  const handleSignAsPoster = async () => {
    if (!testContractId || !user?.uid) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب إنشاء عقد اختبار أولاً' : 'Create a test contract first'
      );
      return;
    }

    setLoading(true);
    try {
      const gid = user.uid.substring(0, 8).toUpperCase();
      await contractService.signContract(
        testContractId,
        user.uid,
        gid,
        'poster',
        '127.0.0.1' // Test IP
      );
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL ? 'تم التوقيع كصاحب العمل' : 'Signed as poster successfully'
      );
    } catch (error: any) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل التوقيع' : 'Failed to sign')
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Export PDF
  const handleExportPDF = async () => {
    if (!testContractId) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب إنشاء عقد اختبار أولاً' : 'Create a test contract first'
      );
      return;
    }

    setLoading(true);
    try {
      const pdfUri = await contractService.generatePDF(
        testContractId,
        isRTL ? 'ar' : 'en'
      );
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? `تم تصدير العقد بنجاح\n${pdfUri}`
          : `Contract exported successfully\n${pdfUri}`
      );
    } catch (error: any) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل التصدير' : 'Failed to export')
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Share contract
  const handleShareContract = async () => {
    if (!testContractId) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب إنشاء عقد اختبار أولاً' : 'Create a test contract first'
      );
      return;
    }

    setLoading(true);
    try {
      await contractService.sharePDF(
        testContractId,
        isRTL ? 'ar' : 'en'
      );
      CustomAlertService.showSuccess(
        isRTL ? 'نجح' : 'Success',
        isRTL 
          ? 'تمت مشاركة العقد بنجاح'
          : 'Contract shared successfully'
      );
    } catch (error: any) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشلت المشاركة' : 'Failed to share')
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Get all contracts
  const handleGetAllContracts = async () => {
    if (!user?.uid) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in'
      );
      return;
    }

    setLoading(true);
    try {
      const contracts = await contractService.getUserContracts(user.uid);
      CustomAlertService.showInfo(
        isRTL ? 'عقودي' : 'My Contracts',
        isRTL
          ? `لديك ${contracts.length} عقد`
          : `You have ${contracts.length} contract(s)`
      );
    } catch (error: any) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        error.message || (isRTL ? 'فشل جلب العقود' : 'Failed to fetch contracts')
      );
    } finally {
      setLoading(false);
    }
  };

  const TestButton = ({
    icon: Icon,
    title,
    description,
    onPress,
    variant = 'primary',
  }: {
    icon: any;
    title: string;
    description: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'info';
  }) => {
    const getVariantColor = () => {
      switch (variant) {
        case 'primary':
          return theme.primary;
        case 'secondary':
          return '#6B7280';
        case 'success':
          return '#10B981';
        case 'info':
          return '#3B82F6';
        default:
          return theme.primary;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.testButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getVariantColor() + '20' },
          ]}
        >
          <Icon size={24} color={getVariantColor()} />
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.buttonTitle,
              { color: theme.textPrimary },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.buttonDescription,
              { color: theme.textSecondary },
            ]}
          >
            {description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <X size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? '🧪 اختبار مولد العقود' : '🧪 Contract Generator Test'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.primary + '15',
              borderColor: theme.primary + '30',
            },
          ]}
        >
          <AlertCircle size={20} color={theme.primary} />
          <Text
            style={[
              styles.infoText,
              { color: theme.textPrimary },
            ]}
          >
            {isRTL
              ? 'استخدم هذه الشاشة لاختبار جميع ميزات مولد العقود'
              : 'Use this screen to test all Contract Generator features'}
          </Text>
        </View>

        {/* Test Contract ID Display */}
        {testContractId && (
          <View
            style={[
              styles.contractIdCard,
              {
                backgroundColor: '#10B981' + '15',
                borderColor: '#10B981' + '30',
              },
            ]}
          >
            <CheckCircle size={20} color="#10B981" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={[
                  styles.contractIdLabel,
                  { color: theme.textSecondary },
                ]}
              >
                {isRTL ? 'رقم العقد الحالي:' : 'Current Contract ID:'}
              </Text>
              <Text
                style={[
                  styles.contractIdText,
                  { color: theme.textPrimary },
                ]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {testContractId}
              </Text>
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.textSecondary },
              ]}
            >
              {isRTL ? 'جاري المعالجة...' : 'Processing...'}
            </Text>
          </View>
        )}

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? '1️⃣ إنشاء واختبار' : '1️⃣ Create & Test'}
          </Text>

          <TestButton
            icon={PlayCircle}
            title={isRTL ? 'إنشاء عقد اختبار' : 'Create Test Contract'}
            description={
              isRTL
                ? 'إنشاء عقد جديد مع بيانات اختبار كاملة'
                : 'Create a new contract with sample test data'
            }
            onPress={handleCreateTestContract}
            variant="primary"
          />

          <TestButton
            icon={FileText}
            title={isRTL ? 'عرض العقد' : 'View Contract'}
            description={
              isRTL
                ? 'فتح شاشة عرض العقد التفصيلية'
                : 'Open detailed contract view screen'
            }
            onPress={handleViewContract}
            variant="info"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? '2️⃣ التوقيع والمصادقة' : '2️⃣ Signing & Authentication'}
          </Text>

          <TestButton
            icon={CheckCircle}
            title={isRTL ? 'التوقيع كصاحب العمل' : 'Sign as Poster'}
            description={
              isRTL
                ? 'توقيع العقد باستخدام GID صاحب العمل'
                : 'Sign contract using poster GID'
            }
            onPress={handleSignAsPoster}
            variant="success"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? '3️⃣ التصدير والمشاركة' : '3️⃣ Export & Share'}
          </Text>

          <TestButton
            icon={Download}
            title={isRTL ? 'تصدير PDF' : 'Export PDF'}
            description={
              isRTL
                ? 'تصدير العقد كملف PDF'
                : 'Export contract as PDF file'
            }
            onPress={handleExportPDF}
            variant="secondary"
          />

          <TestButton
            icon={Share2}
            title={isRTL ? 'مشاركة العقد' : 'Share Contract'}
            description={
              isRTL
                ? 'مشاركة العقد عبر تطبيقات أخرى'
                : 'Share contract via other apps'
            }
            onPress={handleShareContract}
            variant="secondary"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? '4️⃣ إدارة العقود' : '4️⃣ Contract Management'}
          </Text>

          <TestButton
            icon={FileText}
            title={isRTL ? 'عرض كل العقود' : 'View All Contracts'}
            description={
              isRTL
                ? 'جلب قائمة بجميع عقودي'
                : 'Fetch list of all my contracts'
            }
            onPress={handleGetAllContracts}
            variant="info"
          />
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  contractIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  contractIdLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  contractIdText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});

