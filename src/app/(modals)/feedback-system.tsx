import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Send,
  Camera,
  X,
  Clock,
  CheckCircle,
  Eye,
  MessageCircle
} from 'lucide-react-native';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CustomAlertService } from '@/services/CustomAlertService';
import * as ImagePicker from 'expo-image-picker';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';

const FONT_FAMILY = 'Signika Negative SC';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'compliment' | 'complaint';
type SatisfactionLevel = 'happy' | 'neutral' | 'sad' | null;
type TabType = 'new' | 'history';

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  satisfaction: SatisfactionLevel;
  subject: string;
  message: string;
  status: 'pending' | 'under_review' | 'resolved' | 'closed';
  timestamp: Date;
  imageUrls?: string[];
  adminResponse?: string;
  adminResponseDate?: Date;
}

export default function FeedbackSystemScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // History tab
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadFeedbackHistory();
    }
  }, [activeTab]);

  const loadFeedbackHistory = async () => {
    if (!user?.uid) return;

    try {
      setLoadingHistory(true);
      const feedbackRef = collection(db, 'feedback');
      const q = query(
        feedbackRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        adminResponseDate: doc.data().adminResponseDate?.toDate(),
      })) as FeedbackItem[];
      
      setFeedbackHistory(history);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.error('Error loading feedback history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeedbackHistory();
    setRefreshing(false);
  };

  const feedbackTypes = [
    {
      id: 'bug' as FeedbackType,
      title: isRTL ? 'الإبلاغ عن خطأ' : 'Report Bug',
      icon: AlertTriangle,
      color: '#EF4444',
    },
    {
      id: 'feature' as FeedbackType,
      title: isRTL ? 'طلب ميزة' : 'Feature Request',
      icon: Lightbulb,
      color: '#F59E0B',
    },
    {
      id: 'improvement' as FeedbackType,
      title: isRTL ? 'اقتراح تحسين' : 'Improvement',
      icon: ThumbsUp,
      color: '#3B82F6',
    },
    {
      id: 'compliment' as FeedbackType,
      title: isRTL ? 'إطراء' : 'Compliment',
      icon: Smile,
      color: '#10B981',
    },
    {
      id: 'complaint' as FeedbackType,
      title: isRTL ? 'شكوى' : 'Complaint',
      icon: ThumbsDown,
      color: '#8B5CF6',
    },
  ];

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        CustomAlertService.showError(
          isRTL ? 'إذن مطلوب' : 'Permission Required',
          isRTL ? 'يرجى السماح بالوصول إلى المعرض في الإعدادات' : 'Please allow gallery access in Settings'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0] && selectedImages.length < 3) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error picking image:', error);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    try {
      setUploadingImage(true);
      const uploadPromises = selectedImages.map(async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `feedback/${user?.uid}/${Date.now()}_${Math.random()}.jpg`);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error uploading images:', error);
      return [];
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى اختيار نوع الملاحظات' : 'Please select a feedback type'
      );
      return;
    }

    if (!subject.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال الموضوع' : 'Please enter a subject'
      );
      return;
    }

    if (!message.trim()) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال رسالتك' : 'Please enter your message'
      );
      return;
    }

    try {
      setSubmitting(true);

      // Upload images first
      const imageUrls = await uploadImages();

      // Save to Firebase
      const feedbackData = {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous@guild.app',
        type: selectedType,
        satisfaction: satisfaction,
        subject: subject.trim(),
        message: message.trim(),
        imageUrls: imageUrls,
        timestamp: serverTimestamp(),
        status: 'pending',
        platform: Platform.OS,
      };

      await addDoc(collection(db, 'feedback'), feedbackData);

      CustomAlertService.showSuccess(
        isRTL ? 'تم الإرسال!' : 'Submitted!',
        isRTL ? 'شكراً لملاحظاتك! سنراجعها قريباً.' : 'Thank you for your feedback! We\'ll review it soon.'
      );

      // Reset form
      setSelectedType(null);
      setSatisfaction(null);
      setSubject('');
      setMessage('');
      setSelectedImages([]);

      // Switch to history tab
      setActiveTab('history');
      loadFeedbackHistory();
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error submitting feedback:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الملاحظات. حاول مرة أخرى.' : 'Failed to submit feedback. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: FeedbackItem['status']) => {
    switch (status) {
      case 'pending': return '#6B7280';
      case 'under_review': return '#3B82F6';
      case 'resolved': return '#10B981';
      case 'closed': return '#8B5CF6';
      default: return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: FeedbackItem['status']) => {
    if (isRTL) {
      switch (status) {
        case 'pending': return 'قيد الانتظار';
        case 'under_review': return 'قيد المراجعة';
        case 'resolved': return 'تم الحل';
        case 'closed': return 'مغلق';
        default: return status;
      }
    } else {
      switch (status) {
        case 'pending': return 'Pending';
        case 'under_review': return 'Under Review';
        case 'resolved': return 'Resolved';
        case 'closed': return 'Closed';
        default: return status;
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) {
      return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    } else {
      return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : theme.background,
    },
    header: {
      paddingTop: insets.top + 12,
      paddingBottom: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerTitle: {
      color: '#000000',
      fontSize: 24,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerSpacer: {
      width: 42,
    },
    tabsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      padding: 16,
      gap: 12,
      backgroundColor: isDarkMode ? '#111111' : theme.surface,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surfaceSecondary,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    tabText: {
      fontSize: 15,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: '#000000',
      fontWeight: '900',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
    },
    typesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    typeCard: {
      width: '48%',
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      padding: 18,
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    typeCardSelected: {
      borderColor: theme.primary,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    typeIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeTitle: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    satisfactionSection: {
      marginBottom: 24,
    },
    satisfactionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    satisfactionButton: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    satisfactionButtonSelected: {
      borderColor: theme.primary,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    satisfactionLabel: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
      marginTop: 10,
      textAlign: 'center',
    },
    inputSection: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    input: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
      textAlign: isRTL ? 'right' : 'left',
    },
    textArea: {
      minHeight: 140,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
      marginTop: 6,
      textAlign: isRTL ? 'left' : 'right',
    },
    imagesSection: {
      marginBottom: 20,
    },
    imagesRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    addImageButton: {
      width: 90,
      height: 90,
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePreview: {
      width: 90,
      height: 90,
      borderRadius: 14,
      position: 'relative',
    },
    imagePreviewImage: {
      width: '100%',
      height: '100%',
      borderRadius: 14,
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.error,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      padding: 18,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
      marginBottom: 24,
    },
    submitButtonDisabled: {
      backgroundColor: isDarkMode ? '#2a2a2a' : theme.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    submitButtonText: {
      fontSize: 17,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
      color: '#000000',
    },
    // History styles
    historyCard: {
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#262626' : theme.border,
    },
    historyHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    historyType: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    historySubject: {
      fontSize: 16,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: '#FFFFFF',
    },
    historyMessage: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    historyMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
    },
    historyMetaText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
    },
    adminResponse: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.primary + '20',
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    adminResponseLabel: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: theme.primary,
      marginBottom: 6,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
    },
    adminResponseText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      color: theme.textPrimary,
      lineHeight: 20,
      textAlign: isRTL ? 'right' : 'left',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyState: {
      padding: 60,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    bottomSpacer: {
      height: 40,
    },
  });

  const renderNewFeedback = () => (
    <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Feedback Type Selection */}
      <Text style={styles.sectionTitle}>
        {isRTL ? 'نوع الملاحظات' : 'Feedback Type'}
      </Text>
      <View style={styles.typesGrid}>
        {feedbackTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeCard, isSelected && styles.typeCardSelected]}
              onPress={() => setSelectedType(type.id)}
              activeOpacity={0.7}
            >
              <View 
                style={[
                  styles.typeIconContainer, 
                  { backgroundColor: type.color + '20' }
                ]}
              >
                <Icon size={28} color={type.color} />
              </View>
              <Text style={styles.typeTitle}>{type.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Satisfaction Rating */}
      <View style={styles.satisfactionSection}>
        <Text style={styles.sectionTitle}>
          {isRTL ? 'مستوى الرضا (اختياري)' : 'Satisfaction Level (Optional)'}
        </Text>
        <View style={styles.satisfactionRow}>
          <TouchableOpacity
            style={[
              styles.satisfactionButton,
              satisfaction === 'happy' && styles.satisfactionButtonSelected
            ]}
            onPress={() => setSatisfaction('happy')}
            activeOpacity={0.7}
          >
            <Smile size={36} color={satisfaction === 'happy' ? '#10B981' : theme.textSecondary} />
            <Text style={styles.satisfactionLabel}>
              {isRTL ? 'سعيد' : 'Happy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.satisfactionButton,
              satisfaction === 'neutral' && styles.satisfactionButtonSelected
            ]}
            onPress={() => setSatisfaction('neutral')}
            activeOpacity={0.7}
          >
            <Meh size={36} color={satisfaction === 'neutral' ? '#F59E0B' : theme.textSecondary} />
            <Text style={styles.satisfactionLabel}>
              {isRTL ? 'عادي' : 'Neutral'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.satisfactionButton,
              satisfaction === 'sad' && styles.satisfactionButtonSelected
            ]}
            onPress={() => setSatisfaction('sad')}
            activeOpacity={0.7}
          >
            <Frown size={36} color={satisfaction === 'sad' ? '#EF4444' : theme.textSecondary} />
            <Text style={styles.satisfactionLabel}>
              {isRTL ? 'غير راضٍ' : 'Unhappy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subject Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          {isRTL ? 'الموضوع' : 'Subject'} *
        </Text>
        <TextInput
          style={styles.input}
          placeholder={isRTL ? 'باختصار، ما هو موضوع ملاحظاتك؟' : 'Briefly, what is your feedback about?'}
          placeholderTextColor={theme.textSecondary}
          value={subject}
          onChangeText={setSubject}
          maxLength={100}
        />
        <Text style={styles.charCount}>
          {subject.length}/100
        </Text>
      </View>

      {/* Message Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          {isRTL ? 'الرسالة' : 'Message'} *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={isRTL ? 'أخبرنا المزيد عن ملاحظاتك...' : 'Tell us more about your feedback...'}
          placeholderTextColor={theme.textSecondary}
          value={message}
          onChangeText={setMessage}
          maxLength={1000}
          multiline
          numberOfLines={6}
        />
        <Text style={styles.charCount}>
          {message.length}/1000
        </Text>
      </View>

      {/* Image Attachments */}
      <View style={styles.imagesSection}>
        <Text style={styles.inputLabel}>
          {isRTL ? 'صور (اختياري)' : 'Screenshots (Optional)'}
        </Text>
        <View style={styles.imagesRow}>
          {selectedImages.map((uri, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri }} style={styles.imagePreviewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
                activeOpacity={0.7}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
          {selectedImages.length < 3 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handlePickImage}
              activeOpacity={0.7}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Camera size={28} color={theme.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedType || !subject.trim() || !message.trim() || submitting || uploadingImage) && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!selectedType || !subject.trim() || !message.trim() || submitting || uploadingImage}
        activeOpacity={0.7}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <Send size={20} color="#000000" />
        )}
        <Text style={styles.submitButtonText}>
          {submitting 
            ? (isRTL ? 'جاري الإرسال...' : 'Submitting...') 
            : (isRTL ? 'إرسال الملاحظات' : 'Submit Feedback')
          }
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderHistory = () => {
    if (loadingHistory) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      );
    }

    if (feedbackHistory.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MessageSquare size={80} color={theme.textSecondary} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyText}>
            {isRTL ? 'لا توجد ملاحظات سابقة' : 'No feedback history'}
          </Text>
          <Text style={[styles.historyMetaText, { marginTop: 8 }]}>
            {isRTL ? 'أرسل ملاحظاتك الأولى!' : 'Submit your first feedback!'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {feedbackHistory.map((item) => {
          const typeInfo = feedbackTypes.find(t => t.id === item.type);
          return (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyType}>
                  {typeInfo && (
                    <>
                      <View style={[styles.typeIconContainer, { width: 40, height: 40, backgroundColor: typeInfo.color + '20' }]}>
                        <typeInfo.icon size={20} color={typeInfo.color} />
                      </View>
                      <Text style={styles.historySubject}>{item.subject}</Text>
                    </>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.historyMessage} numberOfLines={3}>
                {item.message}
              </Text>

              <View style={styles.historyMeta}>
                <Clock size={12} color={theme.textSecondary} />
                <Text style={styles.historyMetaText}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>

              {item.adminResponse && (
                <View style={styles.adminResponse}>
                  <View style={styles.adminResponseLabel}>
                    <MessageCircle size={14} color={theme.primary} />
                    <Text style={styles.adminResponseLabel}>
                      {isRTL ? 'رد الفريق' : 'Team Response'}
                    </Text>
                  </View>
                  <Text style={styles.adminResponseText}>{item.adminResponse}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar 
        barStyle="dark-content"
        backgroundColor={theme.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={theme.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isRTL ? 'نظام الملاحظات' : 'Feedback System'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          onPress={() => setActiveTab('new')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            {isRTL ? 'ملاحظات جديدة' : 'New Feedback'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            {isRTL ? 'السجل' : 'History'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'new' ? renderNewFeedback() : renderHistory()}
    </KeyboardAvoidingView>
  );
}
