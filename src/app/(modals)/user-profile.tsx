import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { User, Star, Briefcase, MapPin, Shield, Award, Clock, MessageSquare } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FONT_FAMILY = 'Signika Negative SC';

export default function UserProfileScreen() {
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

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (params.userId) {
      setUserData({
        userId: params.userId,
        userName: params.userName,
        userGuild: params.userGuild,
        userGid: params.userGid,
        isScannedUser: params.isScannedUser === 'true'
      });
    }
  }, [params.userId, params.userName, params.userGuild, params.userGid, params.isScannedUser]);

  const handleBack = () => {
    router.back();
  };

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
            {isRTL ? 'جاري تحميل الملف الشخصي...' : 'Loading profile...'}
          </Text>
        </View>
      </View>
    );
  }

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
          {isRTL ? 'الملف الشخصي الكامل' : 'Full Profile'}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <LinearGradient
          colors={['#BCFF31', '#A8E62E']}
          style={styles.userCard}
        >
          <View style={styles.userAvatarContainer}>
            <View style={styles.userAvatar}>
              <MaterialIcons name="person" size={40} color="#000000" />
            </View>
            <View style={styles.verificationBadge}>
              <MaterialIcons name="verified" size={16} color="#000000" />
            </View>
          </View>
          
          <Text style={styles.userName}>
            {userData.userName}
          </Text>
          
          <View style={styles.guildContainer}>
            <MaterialIcons name="group" size={16} color="#000000" />
            <Text style={styles.userGuild}>
              {userData.userGuild}
            </Text>
          </View>
          
          <View style={styles.gidContainer}>
            <Text style={styles.gidLabel}>
              {isRTL ? 'معرف GUILD' : 'GUILD ID'}
            </Text>
            <Text style={styles.gidValue}>
              {userData.userGid}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {isRTL ? 'متصل الآن' : 'Online Now'}
            </Text>
          </View>
        </LinearGradient>

        {/* Additional Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'معلومات إضافية' : 'Additional Information'}
          </Text>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={theme.textSecondary} />
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'معرف المستخدم' : 'User ID'}
            </Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {userData.userId}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={20} color={theme.textSecondary} />
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'آخر نشاط' : 'Last Active'}
            </Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {isRTL ? 'الآن' : 'Now'}
            </Text>
          </View>
          
          {userData.isScannedUser && (
            <View style={styles.scannedBadge}>
              <MaterialIcons name="qr-code-scanner" size={16} color="#BCFF31" />
              <Text style={styles.scannedText}>
                {isRTL ? 'تم المسح' : 'Scanned User'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
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
  userCard: {
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  userAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  guildContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  userGuild: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.8,
  },
  gidContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  gidLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    marginBottom: 4,
    opacity: 0.7,
  },
  gidValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    color: '#000000',
    opacity: 0.7,
  },
  infoCard: {
    marginTop: 24,
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  scannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BCFF31',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  scannedText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
});


