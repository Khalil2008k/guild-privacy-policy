import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, User, Users, Info } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { logger } from '@/utils/logger';
import { CustomAlertService } from '@/services/CustomAlertService';

export default function ChatInfoScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { chatId, chatName, groupName } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!chatId) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'معرف الدردشة مفقود' : 'Chat ID missing'
      );
      router.back();
      return;
    }

    fetchChatInfo();
  }, [chatId]);

  const fetchChatInfo = async () => {
    try {
      setLoading(true);
      logger.debug(`📋 Fetching chat info for chat: ${chatId}`);

      // Get chat document
      const chatDoc = await getDoc(doc(db, 'chats', chatId as string));
      
      if (!chatDoc.exists()) {
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'الدردشة غير موجودة' : 'Chat does not exist'
        );
        router.back();
        return;
      }

      const chatData = chatDoc.data();
      setChatInfo(chatData);

      // Get participants
      const participantIds = chatData.participants || [];
      const uniqueParticipants = Array.from(new Set(participantIds));
      
      // Fetch participant details
      const participantPromises = uniqueParticipants.map(async (participantId: string) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', participantId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              id: participantId,
              name: userData.displayName || userData.name || 'Unknown',
              email: userData.email || '',
              avatar: userData.avatar || userData.profileImage || null,
            };
          }
          return {
            id: participantId,
            name: 'Unknown',
            email: '',
            avatar: null,
          };
        } catch (error) {
          logger.error(`Error fetching participant ${participantId}:`, error);
          return {
            id: participantId,
            name: 'Unknown',
            email: '',
            avatar: null,
          };
        }
      });

      const participantsData = await Promise.all(participantPromises);
      setParticipants(participantsData);

      // Build participant names map
      const namesMap: Record<string, string> = {};
      participantsData.forEach(p => {
        namesMap[p.id] = p.name;
      });
      setParticipantNames(namesMap);

      logger.debug(`✅ Chat info loaded: ${participantsData.length} participants`);
    } catch (error) {
      logger.error('Error fetching chat info:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل معلومات الدردشة' : 'Failed to load chat info'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (participantId: string) => {
    router.push({
      pathname: '/(modals)/user-profile',
      params: { userId: participantId },
    });
  };

  const getAvatarLabel = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderParticipant = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.participantContainer,
        { backgroundColor: theme.surface, borderBottomColor: theme.border },
      ]}
      onPress={() => handleViewProfile(item.id)}
      activeOpacity={0.7}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.participantAvatar} />
      ) : (
        <View style={[styles.participantAvatarPlaceholder, { backgroundColor: theme.primary }]}>
          <Text style={styles.participantAvatarText}>
            {getAvatarLabel(item.name)}
          </Text>
        </View>
      )}
      <View style={styles.participantInfo}>
        <Text style={[styles.participantName, { color: theme.textPrimary }]}>
          {item.name}
        </Text>
        {item.email && (
          <Text style={[styles.participantEmail, { color: theme.textSecondary }]}>
            {item.email}
          </Text>
        )}
      </View>
      <User size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'معلومات الدردشة' : 'Chat Info'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  const displayName = (groupName as string) || (chatName as string) || t('chat');
  const isGroup = !!groupName || (participants.length > 2);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'معلومات الدردشة' : 'Chat Info'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
            {isGroup ? (
              <Users size={48} color="#FFFFFF" />
            ) : (
              <Text style={styles.avatarLabel}>
                {getAvatarLabel(displayName)}
              </Text>
            )}
          </View>
          
          {/* Chat Name */}
          <View style={styles.chatHeader}>
            {isGroup && (
              <Text style={[styles.groupLabel, { color: theme.primary }]}>
                {isRTL ? 'مجموعة' : 'Group'}
              </Text>
            )}
            <Text style={[styles.chatTitle, { color: theme.textPrimary }]}>
              {displayName}
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionItem}>
            <Info size={20} color={theme.primary} />
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {isRTL ? 'حول' : 'About'}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {isRTL ? 'متاح' : 'Available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.membersSection}>
          <Text style={[styles.membersTitle, { color: theme.textPrimary }]}>
            {isRTL ? `الأعضاء (${participants.length})` : `Members (${participants.length})`}
          </Text>
          
          <View style={[styles.membersList, { backgroundColor: theme.surface }]}>
            <FlatList
              data={participants}
              renderItem={renderParticipant}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  chatHeader: {
    alignItems: 'center',
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  membersSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  membersList: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  participantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  participantAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 14,
  },
});






