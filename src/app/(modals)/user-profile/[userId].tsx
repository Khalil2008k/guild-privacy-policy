import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { ArrowLeft, Star, MapPin, Briefcase, Mail, Phone } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalJobs?: number;
  completedJobs?: number;
  skills?: string[];
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
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
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId || typeof userId !== 'string') return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          id: userDoc.id,
          name: userData.name || userData.displayName || 'User',
          email: userData.email || '',
          phone: userData.phone || userData.phoneNumber || '',
          location: userData.location || userData.city || '',
          avatar: userData.avatar || userData.photoURL || '',
          bio: userData.bio || userData.about || '',
          rating: userData.rating || 0,
          totalJobs: userData.totalJobs || 0,
          completedJobs: userData.completedJobs || 0,
          skills: userData.skills || [],
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'الملف الشخصي' : 'Profile'}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL ? 'لم يتم العثور على الملف الشخصي' : 'Profile not found'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'الملف الشخصي' : 'Profile'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar and Basic Info */}
        <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <Text style={[styles.name, { color: theme.textPrimary }]}>{profile.name}</Text>
          
          {profile.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Star size={20} color="#FFD700" fill="#FFD700" />
              <Text style={[styles.rating, { color: theme.textPrimary }]}>
                {profile.rating.toFixed(1)}
              </Text>
            </View>
          )}

          {profile.bio && (
            <Text style={[styles.bio, { color: theme.textSecondary }]}>{profile.bio}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {profile.totalJobs || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'الوظائف' : 'Jobs'}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {profile.completedJobs || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'المكتملة' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'معلومات الاتصال' : 'Contact Info'}
          </Text>

          {profile.email && (
            <View style={styles.infoRow}>
              <Mail size={20} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                {profile.email}
              </Text>
            </View>
          )}

          {profile.phone && (
            <View style={styles.infoRow}>
              <Phone size={20} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                {profile.phone}
              </Text>
            </View>
          )}

          {profile.location && (
            <View style={styles.infoRow}>
              <MapPin size={20} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                {profile.location}
              </Text>
            </View>
          )}
        </View>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'المهارات' : 'Skills'}
            </Text>
            <View style={styles.skillsContainer}>
              {(Array.isArray(profile?.skills) ? profile.skills : []).map((skill, index) => (
                <View
                  key={`${profile?.id || "profile"}-skill-${index}`}
                  style={[styles.skillChip, { backgroundColor: theme.primary + '20' }]}
                >
                  <Text style={[styles.skillText, { color: theme.primary }]}>{String(skill)}</Text>
                </View>
              ))}
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});







