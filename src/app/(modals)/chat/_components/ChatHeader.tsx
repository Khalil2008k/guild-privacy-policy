/**
 * Chat Header Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1827-1883)
 * Purpose: Chat screen header with user info, presence status, and options menu trigger
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, MoreVertical, CheckSquare } from 'lucide-react-native';
// import { Phone, Video } from 'lucide-react-native'; // COMMENTED OUT: Voice/Video calls not implemented yet
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useResponsive } from '@/utils/responsive';

interface ChatHeaderProps {
  otherUser: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
  typingUsers: string[];
  presenceStatus: string;
  onOptionsPress: () => void;
  isSelectionMode?: boolean;
  selectedCount?: number;
  onToggleSelection?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  // COMMENTED OUT: Voice/Video calls not implemented yet
  // onVoiceCall?: () => void;
  // onVideoCall?: () => void;
  // chatId?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  typingUsers,
  presenceStatus,
  onOptionsPress,
  isSelectionMode = false,
  selectedCount = 0,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  // COMMENTED OUT: Voice/Video calls not implemented yet
  // onVoiceCall,
  // onVideoCall,
  // chatId,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();

  return (
    <View
      style={[
        styles.header,
        {
          flexDirection: 'row', // Always use row, we handle RTL by swapping children order
          backgroundColor: theme.surfaceSecondary, // Slightly darker than surface
          paddingTop: insets.top + 8,
          borderBottomColor: theme.border,
          paddingHorizontal: isTablet ? 24 : 16,
        },
      ]}
      key={isRTL ? 'rtl' : 'ltr'} // Force re-render on RTL change
    >
      {isSelectionMode ? (
        <View style={[styles.selectionHeaderActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {selectedCount > 0 ? (
            <TouchableOpacity onPress={onDeselectAll} style={styles.selectionActionButton}>
              <Text style={[styles.selectionActionText, { color: theme.textPrimary }]}>
                {isRTL ? 'إلغاء الكل' : 'Clear'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onSelectAll} style={styles.selectionActionButton}>
              <Text style={[styles.selectionActionText, { color: theme.textPrimary }]}>
                {isRTL ? 'تحديد الكل' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {/* RTL: 3 dots, Phone on LEFT | User name, Avatar, Back arrow on RIGHT */}
          {/* LTR: Back arrow, Avatar, User name on LEFT | Phone, 3 dots on RIGHT (OPPOSITE) */}
          {isRTL ? (
            <>
              {/* RTL MODE: Left side - User name, Avatar, Back arrow */}
              <View style={styles.headerLeft}>
                {/* Back arrow - far left */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                  accessibilityLabel="رجوع"
                  accessibilityRole="button"
                >
                  <ArrowRight size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                {/* User Avatar */}
                {otherUser?.avatar ? (
                  <Image
                    source={{ uri: otherUser.avatar }}
                    style={[styles.avatar, { marginLeft: 12 }]}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary, marginLeft: 12 }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}

                {/* User Name - status on right */}
                <View style={styles.userInfo}>
                  <Text 
                    style={[styles.userName, { color: theme.textPrimary }]} 
                    numberOfLines={1}
                    textAlign="right"
                  >
                    {otherUser?.name || t('chat')}
                  </Text>
                  {typingUsers.length > 0 ? (
                    <Text 
                      style={[styles.typingStatus, { color: theme.primary }]}
                      textAlign="right"
                    >
                      يكتب...
                    </Text>
                  ) : (
                    <Text 
                      style={[styles.userStatus, { color: theme.textSecondary }]}
                      textAlign="right"
                    >
                      {presenceStatus}
                    </Text>
                  )}
                </View>
              </View>

              {/* RTL MODE: Right side - 3 dots */}
              <View style={[styles.headerRight, { marginLeft: 50 }]}>
                {/* COMMENTED OUT: Voice/Video calls not implemented yet */}
                {/* Phone icon */}
                {/* <Pressable 
                  style={styles.iconButton}
                  onPress={() => {
                    if (onVoiceCall && chatId && otherUser?.id) {
                      onVoiceCall();
                    }
                  }}
                >
                  <Phone size={22} color={theme.textPrimary} />
                </Pressable> */}
                
                {/* Video icon */}
                {/* <Pressable 
                  style={styles.iconButton}
                  onPress={() => {
                    if (onVideoCall && chatId && otherUser?.id) {
                      onVideoCall();
                    }
                  }}
                >
                  <Video size={22} color={theme.textPrimary} />
                </Pressable> */}

                {/* 3 dots (Menu) - far right */}
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={onOptionsPress}
                  activeOpacity={0.7}
                  accessibilityLabel="قائمة"
                  accessibilityRole="button"
                >
                  <MoreVertical size={22} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* LTR MODE: Left side - Back arrow, Avatar, User name (OPPOSITE of RTL) */}
              <View style={styles.headerLeft}>
                {/* Back arrow - far left */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Back"
                  accessibilityRole="button"
                >
                  <ArrowLeft size={22} color={theme.textPrimary} />
                </TouchableOpacity>

                {/* User Avatar */}
                {otherUser?.avatar ? (
                  <Image
                    source={{ uri: otherUser.avatar }}
                    style={[styles.avatar, { marginLeft: 12 }]}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary, marginLeft: 12 }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}

                {/* User Name - status on left */}
                <View style={styles.userInfo}>
                  <Text 
                    style={[styles.userName, { color: theme.textPrimary }]} 
                    numberOfLines={1}
                    textAlign="left"
                  >
                    {otherUser?.name || t('chat')}
                  </Text>
                  {typingUsers.length > 0 ? (
                    <Text 
                      style={[styles.typingStatus, { color: theme.primary }]}
                      textAlign="left"
                    >
                      typing...
                    </Text>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.statusDot, { backgroundColor: presenceStatus === 'Online' ? '#00BF6E' : theme.textSecondary }]} />
                      <Text 
                        style={[styles.userStatus, { color: theme.textSecondary, fontSize: 11 }]}
                        textAlign="left"
                      >
                        {presenceStatus}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* LTR MODE: Right side - 3 dots (OPPOSITE of RTL) */}
              <View style={styles.headerRight}>
                {/* COMMENTED OUT: Voice/Video calls not implemented yet */}
                {/* Phone icon */}
                {/* <Pressable 
                  style={styles.iconButton}
                  onPress={() => {
                    if (onVoiceCall && chatId && otherUser?.id) {
                      onVoiceCall();
                    }
                  }}
                >
                  <Phone size={22} color={theme.textPrimary} />
                </Pressable> */}
                
                {/* Video icon */}
                {/* <Pressable 
                  style={styles.iconButton}
                  onPress={() => {
                    if (onVideoCall && chatId && otherUser?.id) {
                      onVideoCall();
                    }
                  }}
                >
                  <Video size={22} color={theme.textPrimary} />
                </Pressable> */}

                {/* 3 dots (Menu) - far right */}
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={onOptionsPress}
                  activeOpacity={0.7}
                  accessibilityLabel="Menu"
                  accessibilityRole="button"
                >
                  <MoreVertical size={22} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'space-between', // Push left and right items to edges
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden', // Ensure border radius and inner shadow are clipped
    // Drop shadow effect
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
    // gap removed - using justifyContent: space-between instead
    // flexDirection will be set dynamically based on RTL
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Space between icons
  },
  iconButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    gap: 4,
    maxWidth: 150, // Limit width so it doesn't take too much space
    // alignItems removed - textAlign handles alignment
    // textAlign is handled inline to allow mixed LTR/RTL content
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  typingStatus: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  userStatus: {
    fontSize: 11, // Smaller for modern look
    fontWeight: '400',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  selectionHeaderActions: {
    gap: 8,
    // flexDirection will be set dynamically based on RTL
  },
  selectionActionButton: {
    padding: 8,
  },
  selectionActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatHeader;
