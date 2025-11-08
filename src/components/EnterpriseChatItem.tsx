/**
 * Enterprise-Grade Chat Item Component
 * Production-ready with 20+ advanced features
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  MessageCircle,
  Phone,
  Video,
  Image as ImageIcon,
  File,
  MapPin,
  Mic,
  Check,
  CheckCheck,
  Clock,
  Pin,
  BellOff,
  Lock,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Smile,
  Frown,
  Meh,
} from 'lucide-react-native';

import { EnhancedChat, PresenceStatus } from '../types/EnhancedChat';
import { formatChatTime, formatDuration, formatFileSize } from '../utils/timeFormatter';
import { useTheme } from '../contexts/ThemeContext';
import PresenceService from '../services/PresenceService';
import MessageAnalyticsService from '../services/MessageAnalyticsService';

interface EnterpriseChatItemProps {
  chat: EnhancedChat;
  onPress: () => void;
  onLongPress: () => void;
  language?: 'en' | 'ar';
  currentUserId?: string;
}

export const EnterpriseChatItem: React.FC<EnterpriseChatItemProps> = ({
  chat,
  onPress,
  onLongPress,
  language = 'en',
  currentUserId,
}) => {
  const { theme } = useTheme();
  const isRTL = language === 'ar';

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // State
  const [presence, setPresence] = useState<PresenceStatus>(chat.presence.status);
  const [isTyping, setIsTyping] = useState(false);
  const [typingPreview, setTypingPreview] = useState('');

  // Subscribe to real-time presence
  useEffect(() => {
    if (!chat.id) return;

    // Get participant ID (for direct chats)
    const participantId = chat.participants?.[0]; // Simplified
    if (!participantId) return;

    const unsubscribe = PresenceService.subscribeToPresence(participantId, (presenceData) => {
      setPresence(presenceData.status);
      setIsTyping(presenceData.isTyping);
      setTypingPreview(presenceData.typingPreview || '');
    });

    return () => unsubscribe();
  }, [chat.id, chat.participants]);

  // Glow animation for unread messages
  useEffect(() => {
    if (chat.counts.unread > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [chat.counts.unread]);

  // Analyze message sentiment
  const sentiment = useMemo(() => {
    if (!chat.lastMessage?.text) return 'neutral';
    return MessageAnalyticsService.analyzeSentiment(chat.lastMessage.text);
  }, [chat.lastMessage?.text]);

  // Check if message is urgent
  const isUrgent = useMemo(() => {
    if (!chat.lastMessage?.text) return false;
    return MessageAnalyticsService.isUrgent(chat.lastMessage.text);
  }, [chat.lastMessage?.text]);

  // Handle press with animation
  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress();
  };

  // Get presence color
  const getPresenceColor = (): string => {
    switch (presence) {
      case 'online': return '#34C759';
      case 'away': return '#FF9500';
      case 'busy': return '#FF3B30';
      case 'offline': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  // Get sentiment icon
  const getSentimentIcon = () => {
    const size = 14;
    const color = theme.textSecondary;
    switch (sentiment) {
      case 'positive': return <Smile size={size} color="#34C759" />;
      case 'negative': return <Frown size={size} color="#FF3B30" />;
      default: return null;
    }
  };

  // Get message type icon
  const getMessageTypeIcon = () => {
    if (!chat.lastMessage) return null;

    const size = 14;
    const color = theme.textSecondary;

    switch (chat.lastMessage.type) {
      case 'voice':
        return <Mic size={size} color={color} />;
      case 'image':
        return <ImageIcon size={size} color={color} />;
      case 'video':
        return <Video size={size} color={color} />;
      case 'file':
        return <File size={size} color={color} />;
      case 'location':
        return <MapPin size={size} color={color} />;
      default:
        return null;
    }
  };

  // Get delivery status icon
  const getDeliveryStatusIcon = () => {
    if (!chat.lastMessage || chat.lastMessage.senderId !== currentUserId) return null;

    const size = 14;
    const color = chat.sync.deliveryStatus === 'read' ? '#34C759' : theme.textSecondary;

    switch (chat.sync.deliveryStatus) {
      case 'sending':
        return <Clock size={size} color={color} />;
      case 'sent':
        return <Check size={size} color={color} />;
      case 'delivered':
      case 'read':
        return <CheckCheck size={size} color={color} />;
      case 'failed':
        return <AlertCircle size={size} color="#FF3B30" />;
      default:
        return null;
    }
  };

  // Format message preview
  const getMessagePreview = (): string => {
    if (isTyping) {
      if (typingPreview) {
        return typingPreview.substring(0, 30) + (typingPreview.length > 30 ? '...' : '');
      }
      return isRTL ? 'يكتب...' : 'typing...';
    }

    if (!chat.lastMessage) {
      return isRTL ? 'لا توجد رسائل' : 'No messages';
    }

    const msg = chat.lastMessage;

    // Voice message
    if (msg.type === 'voice' && msg.metadata?.duration) {
      const duration = formatDuration(msg.metadata.duration);
      return `🎤 ${isRTL ? 'رسالة صوتية' : 'Voice message'} ${duration}`;
    }

    // Image
    if (msg.type === 'image') {
      return `📷 ${isRTL ? 'صورة' : 'Photo'}`;
    }

    // Video
    if (msg.type === 'video') {
      return `🎥 ${isRTL ? 'فيديو' : 'Video'}`;
    }

    // File
    if (msg.type === 'file' && msg.metadata?.fileName) {
      const size = msg.metadata.fileSize ? formatFileSize(msg.metadata.fileSize) : '';
      return `📎 ${msg.metadata.fileName} ${size}`;
    }

    // Location
    if (msg.type === 'location') {
      return `📍 ${isRTL ? 'موقع' : 'Location'}`;
    }

    // Text message
    let preview = msg.text || '';

    // Add draft indicator
    if (chat.metadata.sentiment === 'positive') {
      preview = `${isRTL ? 'مسودة: ' : 'Draft: '}${preview}`;
    }

    // Add edited indicator
    if (msg.isEdited) {
      preview = `${isRTL ? 'معدلة: ' : 'Edited: '}${preview}`;
    }

    return preview;
  };

  // Get avatar gradient (if no image)
  const getAvatarGradient = (): [string, string] => {
    const hash = chat.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients: [string, string][] = [
      ['#FF6B6B', '#FF8E53'],
      ['#4ECDC4', '#44A08D'],
      ['#A8E6CF', '#3D84A8'],
      ['#FFD93D', '#FF6B6B'],
      ['#6C5CE7', '#A29BFE'],
      ['#FD79A8', '#FDCB6E'],
    ];
    return gradients[hash % gradients.length];
  };

  const avatarGradient = getAvatarGradient();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: theme.surface,
        },
        chat.settings.isPinned && styles.pinnedContainer,
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={styles.touchable}
      >
        {/* Glow effect for unread */}
        {chat.counts.unread > 0 && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
              },
            ]}
          />
        )}

        <View style={styles.content}>
          {/* Avatar with status */}
          <View style={styles.avatarContainer}>
            {chat.avatar ? (
              <Image source={{ uri: chat.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={avatarGradient}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {chat.name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}

            {/* Status ring */}
            {presence === 'online' && (
              <View style={[styles.statusRing, { borderColor: getPresenceColor() }]} />
            )}

            {/* Status dot */}
            <View style={[styles.statusDot, { backgroundColor: getPresenceColor() }]} />

            {/* Verified badge */}
            {chat.security.isVerified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Chat info */}
          <View style={styles.chatInfo}>
            {/* Top row: Name + Time */}
            <View style={styles.topRow}>
              <View style={styles.nameContainer}>
                <Text
                  style={[
                    styles.chatName,
                    {
                      color: theme.textPrimary,
                      fontWeight: chat.counts.unread > 0 ? '700' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {chat.name}
                </Text>

                {/* Encryption indicator */}
                {chat.security.isEncrypted && (
                  <Lock size={12} color={theme.textSecondary} style={styles.encryptionIcon} />
                )}

                {/* Bot badge */}
                {chat.type === 'bot' && (
                  <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.badgeText, { color: theme.primary }]}>
                      {isRTL ? 'بوت' : 'BOT'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.timeContainer}>
                {/* Pinned icon */}
                {chat.settings.isPinned && (
                  <Pin size={12} color={theme.primary} style={styles.pinnedIcon} />
                )}

                {/* Time */}
                <Text style={[styles.time, { color: theme.textSecondary }]}>
                  {chat.lastMessage?.timestamp
                    ? formatChatTime(chat.lastMessage.timestamp, language)
                    : ''}
                </Text>
              </View>
            </View>

            {/* Bottom row: Message preview + Indicators */}
            <View style={styles.bottomRow}>
              <View style={styles.messageContainer}>
                {/* Delivery status icon */}
                {getDeliveryStatusIcon()}

                {/* Message type icon */}
                {getMessageTypeIcon()}

                {/* Message preview */}
                <Text
                  style={[
                    styles.messagePreview,
                    {
                      color: chat.counts.unread > 0 ? theme.textPrimary : theme.textSecondary,
                      fontWeight: chat.counts.unread > 0 ? '500' : '400',
                    },
                    isTyping && styles.typingText,
                  ]}
                  numberOfLines={2}
                >
                  {getMessagePreview()}
                </Text>

                {/* Sentiment icon */}
                {getSentimentIcon()}
              </View>

              <View style={styles.indicators}>
                {/* Urgent indicator */}
                {isUrgent && (
                  <View style={styles.urgentBadge}>
                    <AlertCircle size={14} color="#FF3B30" />
                  </View>
                )}

                {/* Muted icon */}
                {chat.settings.isMuted && (
                  <BellOff size={14} color={theme.textSecondary} style={styles.mutedIcon} />
                )}

                {/* Mention badge */}
                {chat.counts.mentions > 0 && (
                  <View style={[styles.mentionBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.mentionText}>@</Text>
                  </View>
                )}

                {/* Unread badge */}
                {chat.counts.unread > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.unreadText}>
                      {chat.counts.unread > 99 ? '99+' : chat.counts.unread}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pinnedContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  touchable: {
    padding: 12,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  statusRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 32,
    borderWidth: 2,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  verifiedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 16,
    marginRight: 6,
  },
  encryptionIcon: {
    marginRight: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedIcon: {
    marginRight: 4,
  },
  time: {
    fontSize: 13,
    fontWeight: '400',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  messagePreview: {
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  typingText: {
    fontStyle: 'italic',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedIcon: {
    marginRight: 2,
  },
  mentionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  mentionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default EnterpriseChatItem;















