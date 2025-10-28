/**
 * Enhanced Chat Item Component
 * Modern chat list item with all premium features
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import * as Haptics from 'expo-haptics';
import {
  Check,
  CheckCheck,
  Clock,
  Mic,
  Image as ImageIcon,
  FileText,
  MapPin,
  Pin,
  BellOff,
  Archive,
  Trash2,
} from 'lucide-react-native';

const FONT_FAMILY = 'Signika Negative SC';

interface EnhancedChatItemProps {
  chat: any;
  onPress: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function EnhancedChatItem({
  chat,
  onPress,
  onPin,
  onMute,
  onArchive,
  onDelete,
}: EnhancedChatItemProps) {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const [showActions, setShowActions] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Handle press with haptic feedback
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  // Handle long press for actions
  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowActions(!showActions);
  };

  // Get message status icon
  const getMessageStatusIcon = () => {
    if (!chat.isOwnLastMessage) return null;
    
    switch (chat.messageStatus) {
      case 'read':
        return <CheckCheck size={16} color={theme.primary} />;
      case 'delivered':
        return <CheckCheck size={16} color={theme.textSecondary} />;
      case 'sent':
        return <Check size={16} color={theme.textSecondary} />;
      default:
        return <Clock size={16} color={theme.textSecondary} />;
    }
  };

  // Get message type icon
  const getMessageTypeIcon = () => {
    if (chat.typingIndicator) {
      return (
        <View style={styles.typingContainer}>
          <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
        </View>
      );
    }

    switch (chat.lastMessageType) {
      case 'voice':
        return <Mic size={14} color={theme.textSecondary} />;
      case 'image':
        return <ImageIcon size={14} color={theme.textSecondary} />;
      case 'file':
        return <FileText size={14} color={theme.textSecondary} />;
      case 'location':
        return <MapPin size={14} color={theme.textSecondary} />;
      default:
        return null;
    }
  };

  // Format time
  const formatTime = (time: string) => {
    // Already formatted from parent
    return time;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: chat.isPinned 
              ? theme.primary + '08' 
              : theme.surface,
            borderLeftWidth: chat.unread > 0 ? 3 : 0,
            borderLeftColor: theme.primary,
          },
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        {/* Avatar with status */}
        <View style={styles.avatarContainer}>
          {chat.avatarUrl ? (
            <Image
              source={{ uri: chat.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {chat.avatar}
              </Text>
            </View>
          )}
          
          {/* Online status */}
          {chat.online && !chat.isGroup && (
            <View style={[styles.onlineIndicator, { backgroundColor: '#00C853' }]} />
          )}
          
          {/* Pinned indicator */}
          {chat.isPinned && (
            <View style={[styles.pinnedIndicator, { backgroundColor: theme.primary }]}>
              <Pin size={10} color="#000000" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Top row: Name, badges, time */}
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.name,
                  {
                    color: theme.textPrimary,
                    fontWeight: chat.unread > 0 ? '700' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {chat.name}
              </Text>
              
              {/* Muted indicator */}
              {chat.isMuted && (
                <BellOff size={14} color={theme.textSecondary} style={styles.mutedIcon} />
              )}
            </View>
            
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(chat.time)}
            </Text>
          </View>

          {/* Bottom row: Message preview and unread badge */}
          <View style={styles.bottomRow}>
            <View style={styles.messageRow}>
              {/* Message status icon */}
              {getMessageStatusIcon()}
              
              {/* Message type icon */}
              {getMessageTypeIcon()}
              
              {/* Message preview */}
              <Text
                style={[
                  styles.message,
                  {
                    color: chat.unread > 0 ? theme.textPrimary : theme.textSecondary,
                    fontWeight: chat.unread > 0 ? '600' : '400',
                    marginLeft: 4,
                  },
                ]}
                numberOfLines={1}
              >
                {chat.typingIndicator 
                  ? (isRTL ? 'يكتب...' : 'typing...')
                  : chat.draft
                  ? `${isRTL ? 'مسودة: ' : 'Draft: '}${chat.lastMessage}`
                  : chat.lastMessage
                }
              </Text>
            </View>
            
            {/* Unread badge */}
            {chat.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.unreadText}>
                  {chat.unread > 99 ? '99+' : chat.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick actions (shown on long press) */}
      {showActions && (
        <View style={[styles.actionsContainer, { backgroundColor: theme.surface }]}>
          {onPin && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowActions(false);
                onPin();
              }}
            >
              <Pin size={18} color={theme.textPrimary} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                {chat.isPinned ? (isRTL ? 'إلغاء التثبيت' : 'Unpin') : (isRTL ? 'تثبيت' : 'Pin')}
              </Text>
            </TouchableOpacity>
          )}
          
          {onMute && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowActions(false);
                onMute();
              }}
            >
              <BellOff size={18} color={theme.textPrimary} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                {chat.isMuted ? (isRTL ? 'إلغاء الكتم' : 'Unmute') : (isRTL ? 'كتم' : 'Mute')}
              </Text>
            </TouchableOpacity>
          )}
          
          {onArchive && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowActions(false);
                onArchive();
              }}
            >
              <Archive size={18} color={theme.textPrimary} />
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                {isRTL ? 'أرشفة' : 'Archive'}
              </Text>
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowActions(false);
                onDelete();
              }}
            >
              <Trash2 size={18} color={theme.error} />
              <Text style={[styles.actionText, { color: theme.error }]}>
                {isRTL ? 'حذف' : 'Delete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  pinnedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    flexShrink: 1,
  },
  mutedIcon: {
    marginLeft: 6,
  },
  time: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    marginHorizontal: 8,
    marginTop: -4,
    marginBottom: 4,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});

