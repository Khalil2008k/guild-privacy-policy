import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Users, User, MessageSquare, Phone, Mail, Search, UserPlus } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

export default function ContactsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // If we're adding a contact from scanned user profile
    if (params.action === 'add' && params.userId) {
      handleAddContact();
    }
  }, [params]);

  const handleAddContact = async () => {
    if (!params.userId) return;
    
    setIsAdding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Simulate adding contact to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم الإضافة' : 'Contact Added',
        isRTL 
          ? `تم إضافة ${params.userName} إلى جهات الاتصال بنجاح`
          : `${params.userName} has been added to your contacts successfully`,
        [
          {
            text: isRTL ? 'حسناً' : 'OK',
            style: 'default',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error adding contact:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'تعذر إضافة جهة الاتصال' : 'Could not add contact'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={handleBack}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'جهات الاتصال' : 'Contacts'}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAdding ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="person-add" size={64} color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
              {isRTL ? 'جاري إضافة جهة الاتصال...' : 'Adding contact...'}
            </Text>
          </View>
        ) : (
          <View style={styles.contactsContainer}>
            <MaterialIcons name="contacts" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'جهات الاتصال' : 'Your Contacts'}
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              {isRTL 
                ? 'ستظهر جهات الاتصال هنا عند إضافتها'
                : 'Your contacts will appear here when added'
              }
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginTop: 16,
    textAlign: 'center',
  },
  contactsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
});
