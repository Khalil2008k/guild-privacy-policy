import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { ArrowLeft, AlertTriangle, FileText, Upload, CheckCircle, XCircle, Scale, Shield } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BackendAPI } from '../../config/backend';

const FONT_FAMILY = 'Signika Negative SC';

interface DisputeForm {
  title: string;
  defendant: string;
  amount: string;
  category: 'payment' | 'quality' | 'deadline' | 'contract_breach' | 'other';
  description: string;
  evidence: string[];
}

export default function DisputeFilingFormScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [form, setForm] = useState<DisputeForm>({
    title: '',
    defendant: '',
    amount: '',
    category: 'payment',
    description: '',
    evidence: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const categories = [
    { key: 'payment', label: isRTL ? 'نزاع دفع' : 'Payment Dispute', icon: 'card' },
    { key: 'quality', label: isRTL ? 'نزاع جودة' : 'Quality Dispute', icon: 'star' },
    { key: 'deadline', label: isRTL ? 'نزاع موعد' : 'Deadline Dispute', icon: 'time' },
    { key: 'contract_breach', label: isRTL ? 'خرق عقد' : 'Contract Breach', icon: 'document-text' },
    { key: 'other', label: isRTL ? 'أخرى' : 'Other', icon: 'ellipsis-horizontal' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!form.title.trim()) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال عنوان النزاع' : 'Please enter dispute title');
      return;
    }
    
    if (!form.defendant.trim()) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال اسم المدعى عليه' : 'Please enter defendant name');
      return;
    }
    
    if (!form.amount.trim() || isNaN(Number(form.amount))) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }
    
    if (!form.description.trim()) {
      CustomAlertService.showError(isRTL ? 'خطأ' : 'Error', isRTL ? 'يرجى إدخال وصف النزاع' : 'Please enter dispute description');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Submit to backend
      const response = await BackendAPI.post('/guild-court/disputes', {
        ...form,
        amount: Number(form.amount),
        plaintiff: 'current-user-id', // Get from auth context
      });

      if (response && response.success) {
        CustomAlertService.showSuccess(
          isRTL ? 'تم بنجاح' : 'Success',
          isRTL ? 'تم تقديم النزاع بنجاح. سيتم مراجعته قريباً.' : 'Dispute submitted successfully. It will be reviewed soon.',
          [
            {
              text: isRTL ? 'موافق' : 'OK',
              style: 'default',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error('Failed to submit dispute');
      }
    } catch (error) {
      console.log('Failed to submit dispute:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في تقديم النزاع. يرجى المحاولة مرة أخرى.' : 'Failed to submit dispute. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.key === form.category);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <MaterialIcons name="gavel" size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'تقديم نزاع' : 'File Dispute'}
          </Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Fields */}
        <View style={[styles.formContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Title */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'عنوان النزاع' : 'Dispute Title'} *
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={isRTL ? 'أدخل عنوان النزاع' : 'Enter dispute title'}
              placeholderTextColor={theme.textSecondary}
              value={form.title}
              onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
              maxLength={100}
            />
          </View>

          {/* Defendant */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'المدعى عليه' : 'Defendant'} *
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={isRTL ? 'اسم الشخص أو الشركة' : 'Person or company name'}
              placeholderTextColor={theme.textSecondary}
              value={form.defendant}
              onChangeText={(text) => setForm(prev => ({ ...prev, defendant: text }))}
              maxLength={50}
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'المبلغ المتنازع عليه (ريال قطري)' : 'Disputed Amount (QAR)'} *
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={isRTL ? '0.00' : '0.00'}
              placeholderTextColor={theme.textSecondary}
              value={form.amount}
              onChangeText={(text) => setForm(prev => ({ ...prev, amount: text }))}
              keyboardType="numeric"
            />
          </View>

          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'نوع النزاع' : 'Dispute Category'} *
            </Text>
            <TouchableOpacity
              style={[styles.categorySelector, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.categoryContent}>
                <Ionicons name={selectedCategory?.icon as any} size={20} color={theme.primary} />
                <Text style={[styles.categoryText, { color: theme.textPrimary }]}>
                  {selectedCategory?.label}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'وصف النزاع' : 'Dispute Description'} *
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder={isRTL ? 'اشرح تفاصيل النزاع بوضوح...' : 'Explain the dispute details clearly...'}
              placeholderTextColor={theme.textSecondary}
              value={form.description}
              onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={[styles.characterCount, { color: theme.textSecondary }]}>
              {form.description.length}/1000
            </Text>
          </View>

          {/* Evidence Section */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'الأدلة والمستندات' : 'Evidence & Documents'}
            </Text>
            <TouchableOpacity
              style={[styles.evidenceButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => {
                // TODO: Implement file picker
                CustomAlertService.showInfo(isRTL ? 'قريباً' : 'Coming Soon', isRTL ? 'سيتم إضافة رفع الملفات قريباً' : 'File upload will be added soon');
              }}
            >
              <Ionicons name="cloud-upload" size={20} color={theme.primary} />
              <Text style={[styles.evidenceButtonText, { color: theme.primary }]}>
                {isRTL ? 'رفع الملفات' : 'Upload Files'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[theme.primary, theme.primary + 'CC']}
            style={styles.submitGradient}
          >
            {loading ? (
              <Text style={[styles.submitButtonText, { color: '#000000' }]}>
                {isRTL ? 'جاري التقديم...' : 'Submitting...'}
              </Text>
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#000000" />
                <Text style={[styles.submitButtonText, { color: '#000000' }]}>
                  {isRTL ? 'تقديم النزاع' : 'Submit Dispute'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={[styles.categoryModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'اختر نوع النزاع' : 'Select Dispute Category'}
            </Text>
            
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryOption,
                  { 
                    backgroundColor: form.category === category.key ? theme.primary + '20' : 'transparent',
                    borderColor: form.category === category.key ? theme.primary : theme.border
                  }
                ]}
                onPress={() => {
                  setForm(prev => ({ ...prev, category: category.key as any }));
                  setShowCategoryModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={category.icon as any} size={20} color={theme.primary} />
                <Text style={[styles.categoryOptionText, { color: theme.textPrimary }]}>
                  {category.label}
                </Text>
                {form.category === category.key && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    textAlign: 'right',
    marginTop: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  evidenceButtonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoryModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
});
