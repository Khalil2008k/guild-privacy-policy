import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { useAuth } from '../../../contexts/AuthContext';
import ModalHeader from '../../components/ModalHeader';
import { guildService } from '../../../services/firebase/GuildService';
import { chatService } from '../../../services/firebase/ChatService';
import { Send, User, Crown, Shield, Users, MessageCircle } from 'lucide-react-native';

interface GuildMember {
  userId: string;
  username: string;
  role: 'GUILD_MASTER' | 'VICE_MASTER' | 'MEMBER';
  avatar?: string;
}

export default function GuildChatScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { guildId, type } = useLocalSearchParams();

  const [guild, setGuild] = useState<any>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<GuildMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    loadGuildAndMembers();
  }, [guildId]);

  const loadGuildAndMembers = async () => {
    setLoading(true);
    try {
      if (!guildId) return;

      // Load guild details
      const guildData = await guildService.getGuildById(guildId as string);
      if (guildData) {
        setGuild(guildData);

        // Load guild members
        const mockMembers: GuildMember[] = [
          {
            userId: guildData.guildMasterId,
            username: 'Guild Master',
            role: 'GUILD_MASTER',
            avatar: guildData.logo
          },
          {
            userId: 'vice-master-1',
            username: 'Vice Master 1',
            role: 'VICE_MASTER'
          },
          {
            userId: 'vice-master-2',
            username: 'Vice Master 2',
            role: 'VICE_MASTER'
          },
          {
            userId: 'member-1',
            username: 'Member One',
            role: 'MEMBER'
          },
          {
            userId: 'member-2',
            username: 'Member Two',
            role: 'MEMBER'
          },
          {
            userId: 'member-3',
            username: 'Member Three',
            role: 'MEMBER'
          }
        ];

        setMembers(mockMembers);
      }
    } catch (error) {
      console.error('Error loading guild:', error);
      CustomAlertService.showError('Error', 'Failed to load guild details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (member: GuildMember) => {
    if (!user || !guild) return;

    setCreatingChat(true);
    try {
      if (type === 'private') {
        // Create private chat between current user and selected member
        const chat = await chatService.createGuildPrivateChat(
          guildId as string,
          user.uid,
          member.userId
        );

        CustomAlertService.showSuccess(
          isRTL ? 'تم إنشاء المحادثة' : 'Chat Created',
          isRTL
            ? 'تم إنشاء المحادثة الخاصة بنجاح'
            : 'Private chat created successfully',
          [
            {
              text: isRTL ? 'موافق' : 'OK',
              style: 'default',
              onPress: () => router.push(`/(modals)/chat/${chat.id}`)
            }
          ]
        );
      } else if (type === 'group') {
        // Create group chat with all guild members
        const chat = await chatService.createGuildGroupChat(guildId as string);

        CustomAlertService.showSuccess(
          isRTL ? 'تم إنشاء المحادثة الجماعية' : 'Group Chat Created',
          isRTL
            ? 'تم إنشاء المحادثة الجماعية للنقابة بنجاح'
            : 'Guild group chat created successfully',
          [
            {
              text: isRTL ? 'موافق' : 'OK',
              style: 'default',
              onPress: () => router.push(`/(modals)/chat/${chat.id}`)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في إنشاء المحادثة' : 'Failed to create chat'
      );
    } finally {
      setCreatingChat(false);
    }
  };

  const renderMember = ({ item }: { item: GuildMember }) => {
    const getRoleIcon = (role: string) => {
      switch (role) {
        case 'GUILD_MASTER':
          return <Crown size={16} color={theme.warning} />;
        case 'VICE_MASTER':
          return <Shield size={16} color={theme.secondary} />;
        default:
          return <User size={16} color={theme.textSecondary} />;
      }
    };

    const getRoleLabel = (role: string) => {
      switch (role) {
        case 'GUILD_MASTER':
          return isRTL ? 'رئيس النقابة' : 'Guild Master';
        case 'VICE_MASTER':
          return isRTL ? 'نائب الرئيس' : 'Vice Master';
        default:
          return isRTL ? 'عضو' : 'Member';
      }
    };

    return (
      <TouchableOpacity
        style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setSelectedMember(item)}
        disabled={creatingChat}
      >
        <View style={styles.memberInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            {getRoleIcon(item.role)}
          </View>

          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, { color: theme.textPrimary }]}>
              {item.username}
            </Text>
            <Text style={[styles.memberRole, { color: theme.textSecondary }]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: theme.primary }]}
          onPress={() => handleCreateChat(item)}
          disabled={creatingChat}
        >
          <MessageCircle size={16} color={theme.buttonText} />
          <Text style={[styles.chatButtonText, { color: theme.buttonText }]}>
            {isRTL ? 'محادثة' : 'Chat'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {isRTL ? 'جارٍ التحميل...' : 'Loading guild...'}
        </Text>
      </View>
    );
  }

  if (!guild) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {isRTL ? 'النقابة غير موجودة' : 'Guild not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      <ModalHeader
        title={type === 'private' ? (isRTL ? 'محادثة خاصة' : 'Private Chat') : (isRTL ? 'محادثة جماعية' : 'Group Chat')}
        onBack={() => router.back()}
      />

      {/* Guild Header */}
      <View style={[styles.guildHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.guildInfo}>
          <Text style={[styles.guildName, { color: theme.textPrimary }]}>
            {guild.name}
          </Text>
          <Text style={[styles.guildDescription, { color: theme.textSecondary }]}>
            {type === 'private'
              ? (isRTL ? 'اختر عضواً للمحادثة الخاصة' : 'Select a member for private chat')
              : (isRTL ? 'إنشاء محادثة جماعية لجميع الأعضاء' : 'Create group chat with all members')
            }
          </Text>
        </View>

        <View style={[styles.guildStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.statItem, { backgroundColor: theme.primary + '15' }]}>
            <Users size={16} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.primary }]}>
              {members.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Members List */}
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.membersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Users size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'لا يوجد أعضاء' : 'No Members Found'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {isRTL ? 'هذه النقابة لا تحتوي على أعضاء' : 'This guild has no members'}
            </Text>
          </View>
        )}
      />

      {/* Group Chat Button (for group chat type) */}
      {type === 'group' && (
        <View style={[styles.groupChatContainer, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.groupChatButton, { backgroundColor: theme.primary }]}
            onPress={() => handleCreateChat({ userId: 'all', username: 'All Members', role: 'MEMBER' } as GuildMember)}
            disabled={creatingChat}
          >
            <Users size={20} color={theme.buttonText} />
            <Text style={[styles.groupChatButtonText, { color: theme.buttonText }]}>
              {creatingChat
                ? (isRTL ? 'جارٍ الإنشاء...' : 'Creating...')
                : (isRTL ? 'إنشاء المحادثة الجماعية' : 'Create Group Chat')
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  guildHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  guildInfo: {
    marginBottom: 12,
  },
  guildName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  guildDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  guildStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
  },
  chatButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    gap: 6,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupChatContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  groupChatButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  groupChatButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

