import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Shield, 
  Bell, 
  Briefcase, 
  Wallet, 
  MessageCircle, 
  Users,
  Trash2,
  Check,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { CustomAlertService } from '../../services/CustomAlertService';
import { notificationBadgeService } from '../../services/NotificationBadgeService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

const FONT_FAMILY = 'Signika Negative SC';

export default function NotificationTestScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const [permissions, setPermissions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermissions();
    // Configure notification badge with shield icon
    notificationBadgeService.configureBadgeIcon();
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await notificationBadgeService.getPermissionsStatus();
      setPermissions(status);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const status = await notificationBadgeService.requestPermissions();
      setPermissions(status);
      
      if (status.status === 'granted') {
        CustomAlertService.showSuccess(
          isRTL ? 'تم منح الأذونات' : 'Permissions Granted',
          isRTL ? 'تم منح أذونات الإشعارات. يمكنك الآن تلقي الإشعارات مع أيقونة الدرع!' : 'Notification permissions have been granted. You can now receive notifications with the shield icon!'
        );
      } else {
        CustomAlertService.showError(
          isRTL ? 'تم رفض الأذونات' : 'Permissions Denied',
          isRTL ? 'تم رفض أذونات الإشعارات. يرجى تمكينها في إعدادات الجهاز.' : 'Notification permissions were denied. Please enable them in your device settings.'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل طلب أذونات الإشعارات' : 'Failed to request notification permissions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testShieldNotification = async () => {
    try {
      await notificationBadgeService.testShieldNotification();
      CustomAlertService.showSuccess(
        '🛡️ ' + (isRTL ? 'تم إرسال إشعار الدرع' : 'Shield Notification Sent'),
        isRTL ? 'تحقق من لوحة الإشعارات لرؤية أيقونة درع Lucide!' : 'Check your notification panel to see the Lucide Shield icon!'
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل إرسال إشعار الاختبار' : 'Failed to send test notification'
      );
    }
  };

  const testJobNotification = async () => {
    try {
      await notificationBadgeService.sendJobNotification(
        '🛡️ ' + (isRTL ? 'وظيفة جديدة متاحة' : 'New Job Available'),
        isRTL ? 'تم نشر وظيفة جديدة تطابق مهاراتك!' : 'A new job matching your skills has been posted!',
        'test-job-123',
        { priority: 'normal' }
      );
      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال إشعار الوظيفة' : 'Job Notification Sent',
        isRTL ? 'تحقق من لوحة الإشعارات لرؤية أيقونة الدرع!' : 'Check your notification panel to see the shield icon!'
      );
    } catch (error) {
      console.error('Error sending job notification:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل إرسال إشعار الوظيفة' : 'Failed to send job notification'
      );
    }
  };

  const testPaymentNotification = async () => {
    try {
      await notificationBadgeService.sendPaymentNotification(
        '🛡️ ' + (isRTL ? 'تم استلام الدفع' : 'Payment Received'),
        isRTL ? 'لقد استلمت دفعة بقيمة 500 ريال قطري' : 'You have received a payment of 500 QAR',
        'test-payment-123',
        { amount: 500, currency: 'QAR' }
      );
      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال إشعار الدفع' : 'Payment Notification Sent',
        isRTL ? 'تحقق من لوحة الإشعارات لرؤية أيقونة الدرع!' : 'Check your notification panel to see the shield icon!'
      );
    } catch (error) {
      console.error('Error sending payment notification:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل إرسال إشعار الدفع' : 'Failed to send payment notification'
      );
    }
  };

  const testChatNotification = async () => {
    try {
      await notificationBadgeService.sendChatNotification(
        '🛡️ ' + (isRTL ? 'رسالة جديدة' : 'New Message'),
        isRTL ? 'لديك رسالة جديدة من أحمد محمد' : 'You have a new message from John Doe',
        'test-chat-123',
        { sender: isRTL ? 'أحمد محمد' : 'John Doe' }
      );
      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال إشعار الدردشة' : 'Chat Notification Sent',
        isRTL ? 'تحقق من لوحة الإشعارات لرؤية أيقونة الدرع!' : 'Check your notification panel to see the shield icon!'
      );
    } catch (error) {
      console.error('Error sending chat notification:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل إرسال إشعار الدردشة' : 'Failed to send chat notification'
      );
    }
  };

  const testGuildNotification = async () => {
    try {
      await notificationBadgeService.sendGuildNotification(
        '🛡️ ' + (isRTL ? 'تحديث النقابة' : 'Guild Update'),
        isRTL ? 'نقابتك لديها عضو جديد!' : 'Your guild has a new member!',
        'test-guild-123',
        { member: isRTL ? 'سارة أحمد' : 'Jane Smith' }
      );
      CustomAlertService.showSuccess(
        isRTL ? 'تم إرسال إشعار النقابة' : 'Guild Notification Sent',
        isRTL ? 'تحقق من لوحة الإشعارات لرؤية أيقونة الدرع!' : 'Check your notification panel to see the shield icon!'
      );
    } catch (error) {
      console.error('Error sending guild notification:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل إرسال إشعار النقابة' : 'Failed to send guild notification'
      );
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationBadgeService.clearAllNotifications();
      CustomAlertService.showSuccess(
        isRTL ? 'تم المسح' : 'Notifications Cleared',
        isRTL ? 'تم مسح جميع الإشعارات' : 'All notifications have been cleared'
      );
    } catch (error) {
      console.error('Error clearing notifications:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل مسح الإشعارات' : 'Failed to clear notifications'
      );
    }
  };

  const setBadgeCount = async (count: number) => {
    try {
      await notificationBadgeService.setBadgeCount(count);
      CustomAlertService.showSuccess(
        isRTL ? 'تم تعيين العداد' : 'Badge Count Set',
        isRTL ? `تم تعيين عداد الشارة إلى ${count}` : `Badge count set to ${count}`
      );
    } catch (error) {
      console.error('Error setting badge count:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error', 
        isRTL ? 'فشل تعيين عداد الشارة' : 'Failed to set badge count'
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 16,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 26,
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
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      justifyContent: 'center',
      marginRight: 42,
    },
    headerTitle: {
      color: '#000000',
      fontSize: 20,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      borderRadius: 20,
      borderBottomLeftRadius: 4,
      padding: 20,
      marginBottom: 20,
      backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#262626' : theme.border,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
      color: theme.textPrimary,
    },
    sectionDescription: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONT_FAMILY,
      color: theme.textSecondary,
    },
    permissionStatus: {
      gap: 16,
    },
    permissionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    permissionLabel: {
      fontSize: 15,
      fontFamily: FONT_FAMILY,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
    },
    permissionButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 14,
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    permissionButtonText: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
      color: '#000000',
    },
    testButtons: {
      gap: 12,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      gap: 10,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    testButtonText: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
    },
    badgeButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    badgeButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    badgeButtonText: {
      fontSize: 18,
      fontWeight: '800',
      fontFamily: FONT_FAMILY,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      gap: 10,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    clearButtonText: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: FONT_FAMILY,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={theme.primary} 
      />
      
      {/* Header */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.primary} />
        </TouchableOpacity>
        
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Shield size={24} color="#000000" />
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
            {isRTL ? 'اختبار الإشعارات' : 'Notification Test'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permissions Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'حالة الأذونات' : 'Permissions Status'}
          </Text>
          
          <View style={styles.permissionStatus}>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>
                {isRTL ? 'الإشعارات' : 'Notifications'}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: permissions?.status === 'granted' ? '#4CAF50' : '#F44336' }
              ]}>
                <Text style={styles.statusText}>
                  {permissions?.status === 'granted' 
                    ? (isRTL ? '✅ ممنوح' : '✅ Granted') 
                    : (isRTL ? '❌ مرفوض' : '❌ Denied')}
                </Text>
              </View>
            </View>
            
            {permissions?.status !== 'granted' && (
              <TouchableOpacity
                style={[styles.permissionButton, { backgroundColor: theme.primary }]}
                onPress={requestPermissions}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.permissionButtonText}>
                    {isRTL ? 'طلب الأذونات' : 'Request Permissions'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Shield Icon Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🛡️ {isRTL ? 'أيقونة الدرع' : 'Shield Icon'}
          </Text>
          <Text style={styles.sectionDescription}>
            {isRTL 
              ? 'ستظهر أيقونة الدرع الصغيرة في أعلى الهاتف عند وصول الإشعارات'
              : 'The small shield icon will appear at the top of your phone when notifications arrive'
            }
          </Text>
        </View>

        {/* Test Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'اختبار الإشعارات' : 'Test Notifications'}
          </Text>
          
          <View style={styles.testButtons}>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: theme.primary }]}
              onPress={testShieldNotification}
              activeOpacity={0.7}
            >
              <Shield size={20} color="#000000" />
              <Text style={[styles.testButtonText, { color: '#000000' }]}>
                {isRTL ? 'اختبار الدرع' : 'Test Shield'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#4CAF50' }]}
              onPress={testJobNotification}
              activeOpacity={0.7}
            >
              <Briefcase size={20} color="#FFFFFF" />
              <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'اختبار الوظائف' : 'Test Jobs'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#2196F3' }]}
              onPress={testPaymentNotification}
              activeOpacity={0.7}
            >
              <Wallet size={20} color="#FFFFFF" />
              <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'اختبار الدفع' : 'Test Payment'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#FF9800' }]}
              onPress={testChatNotification}
              activeOpacity={0.7}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'اختبار الدردشة' : 'Test Chat'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#9C27B0' }]}
              onPress={testGuildNotification}
              activeOpacity={0.7}
            >
              <Users size={20} color="#FFFFFF" />
              <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                {isRTL ? 'اختبار النقابة' : 'Test Guild'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Badge Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'إدارة الشارات' : 'Badge Management'}
          </Text>
          
          <View style={styles.badgeButtons}>
            <TouchableOpacity
              style={[styles.badgeButton, { backgroundColor: '#FF5722' }]}
              onPress={() => setBadgeCount(1)}
              activeOpacity={0.7}
            >
              <Text style={[styles.badgeButtonText, { color: '#FFFFFF' }]}>1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.badgeButton, { backgroundColor: '#FF5722' }]}
              onPress={() => setBadgeCount(5)}
              activeOpacity={0.7}
            >
              <Text style={[styles.badgeButtonText, { color: '#FFFFFF' }]}>5</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.badgeButton, { backgroundColor: '#FF5722' }]}
              onPress={() => setBadgeCount(10)}
              activeOpacity={0.7}
            >
              <Text style={[styles.badgeButtonText, { color: '#FFFFFF' }]}>10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.badgeButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => setBadgeCount(0)}
              activeOpacity={0.7}
            >
              <Text style={[styles.badgeButtonText, { color: '#FFFFFF' }]}>0</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: theme.error }]}
            onPress={clearAllNotifications}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text style={[styles.clearButtonText, { color: '#FFFFFF' }]}>
              {isRTL ? 'مسح الكل' : 'Clear All'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
