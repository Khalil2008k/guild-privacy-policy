import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useI18n } from '@/contexts/I18nProvider';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function ProfileScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      id: 'personal',
      title: isRTL ? 'المعلومات الشخصية' : 'Personal Information',
      icon: 'person-outline',
      action: () => router.push('/(modals)/profile-settings'),
    },
    {
      id: 'wallet',
      title: t('wallet'),
      icon: 'wallet-outline',
      action: () => router.push('/(modals)/wallet'),
    },
    {
      id: 'guild',
      title: isRTL ? 'نقابتي' : 'My Guild',
      icon: 'people-outline',
      action: () => router.push('/(modals)/guilds'),
    },
    {
      id: 'jobs',
      title: t('myJobs'),
      icon: 'briefcase-outline',
      action: () => router.push('/(modals)/my-jobs'),
    },
    {
      id: 'settings',
      title: t('settings'),
      icon: 'settings-outline',
      action: () => router.push('/(modals)/settings'),
    },
    {
      id: 'notifications',
      title: t('notifications'),
      icon: 'notifications-outline',
      action: () => router.push('/(modals)/notifications'),
    },
  ];

  const handleSignOut = () => {
    // Handle sign out logic here
    router.replace('/(auth)/signin');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "dark-content" : "dark-content"}
        backgroundColor={theme.primary}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
          {t('profile')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={[styles.content, { backgroundColor: isDarkMode ? '#111111' : theme.surface }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Spacing */}
        <View style={styles.topSpacer} />

        {/* Profile Info Card */}
        <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, borderWidth: 1, borderColor: isDarkMode ? '#262626' : theme.border }]}>
          <View style={styles.profileContainer}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
              <Text style={[styles.avatarText, { color: '#000000' }]}>
                UN
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                [User Name]
              </Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                user@example.com
              </Text>
              <Text style={[styles.userGuild, { color: theme.primary }]}>
                Guild: [Guild Name]
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF', borderWidth: 1, borderColor: isDarkMode ? '#2a2a2a' : '#E0E0E0' }]}
              onPress={() => router.push('/(modals)/profile-settings')}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Spacer */}
        <View style={styles.sectionSpacer} />

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, borderWidth: 1, borderColor: isDarkMode ? '#262626' : theme.border }]}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{isRTL ? 'الوظائف المنشورة' : 'JOBS POSTED'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>28</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{isRTL ? 'الطلبات' : 'APPLICATIONS'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>5</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{isRTL ? 'مكتملة' : 'COMPLETED'}</Text>
            </View>
          </View>
        </View>

        {/* Section Spacer */}
        <View style={styles.sectionSpacer} />

        {/* Menu Items */}
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              { backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, borderWidth: 1, borderColor: isDarkMode ? '#262626' : theme.border }
            ]}
            onPress={item.action}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={item.icon as any}
                size={24}
                color={theme.textPrimary}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                {item.title}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: theme.primary, backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface, borderWidth: 1 }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={20} color={theme.primary} />
          <Text style={[styles.signOutText, { color: theme.primary }]}>
            {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

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
    backgroundColor: '#BCFF31',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 6,
  },
  userGuild: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  sectionSpacer: {
    height: 24,
  },
  topSpacer: {
    height: 20,
  },
});
