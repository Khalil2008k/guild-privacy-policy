/**
 * Chat Context Menu (Long Press)
 * Advanced menu with 10+ actions
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Pin,
  PinOff,
  BellOff,
  Bell,
  Archive,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Info,
  UserPlus,
  MessageCircle,
  X,
} from 'lucide-react-native';

import { EnhancedChat } from '../types/EnhancedChat';
import { useTheme } from '../contexts/ThemeContext';

interface ChatContextMenuProps {
  visible: boolean;
  chat: EnhancedChat | null;
  onClose: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  onMarkRead?: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
  onInfo?: () => void;
  onPoke?: () => void;
  language?: 'en' | 'ar';
}

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  visible,
  chat,
  onClose,
  onPin,
  onMute,
  onArchive,
  onDelete,
  onFavorite,
  onMarkRead,
  onCopyLink,
  onShare,
  onInfo,
  onPoke,
  language = 'en',
}) => {
  const { theme } = useTheme();
  const isRTL = language === 'ar';

  if (!chat) return null;

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
    onClose();
  };

  const menuItems = [
    {
      id: 'pin',
      icon: chat.settings.isPinned ? PinOff : Pin,
      label: chat.settings.isPinned
        ? (isRTL ? 'إلغاء التثبيت' : 'Unpin')
        : (isRTL ? 'تثبيت' : 'Pin'),
      action: onPin,
      color: theme.primary,
    },
    {
      id: 'mute',
      icon: chat.settings.isMuted ? Bell : BellOff,
      label: chat.settings.isMuted
        ? (isRTL ? 'إلغاء كتم الصوت' : 'Unmute')
        : (isRTL ? 'كتم الصوت' : 'Mute'),
      action: onMute,
      color: theme.textPrimary,
    },
    {
      id: 'favorite',
      icon: chat.settings.isFavorite ? StarOff : Star,
      label: chat.settings.isFavorite
        ? (isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites')
        : (isRTL ? 'إضافة للمفضلة' : 'Add to Favorites'),
      action: onFavorite,
      color: '#FFD700',
    },
    {
      id: 'markRead',
      icon: chat.counts.unread > 0 ? Eye : EyeOff,
      label: chat.counts.unread > 0
        ? (isRTL ? 'وضع علامة كمقروء' : 'Mark as Read')
        : (isRTL ? 'وضع علامة كغير مقروء' : 'Mark as Unread'),
      action: onMarkRead,
      color: theme.textPrimary,
    },
    {
      id: 'poke',
      icon: UserPlus,
      label: isRTL ? 'نبّه' : 'Poke',
      action: onPoke,
      color: '#FF9500',
    },
    {
      id: 'archive',
      icon: Archive,
      label: isRTL ? 'أرشفة' : 'Archive',
      action: onArchive,
      color: '#8E8E93',
    },
    {
      id: 'copyLink',
      icon: Copy,
      label: isRTL ? 'نسخ الرابط' : 'Copy Link',
      action: onCopyLink,
      color: theme.textPrimary,
    },
    {
      id: 'share',
      icon: Share2,
      label: isRTL ? 'مشاركة' : 'Share',
      action: onShare,
      color: theme.textPrimary,
    },
    {
      id: 'info',
      icon: Info,
      label: isRTL ? 'معلومات' : 'Info',
      action: onInfo,
      color: theme.textPrimary,
    },
    {
      id: 'delete',
      icon: Trash2,
      label: isRTL ? 'حذف' : 'Delete',
      action: onDelete,
      color: '#FF3B30',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menuContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={[styles.chatName, { color: theme.textPrimary }]} numberOfLines={1}>
                {chat.name}
              </Text>
              {chat.type === 'group' && chat.participantCount && (
                <Text style={[styles.participantCount, { color: theme.textSecondary }]}>
                  {chat.participantCount} {isRTL ? 'عضو' : 'members'}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Menu items */}
          <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => {
              if (!item.action) return null;

              const Icon = item.icon;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    { borderBottomColor: theme.border || 'rgba(0, 0, 0, 0.1)' },
                  ]}
                  onPress={() => handleAction(item.action!)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuItemText, { color: item.color }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantCount: {
    fontSize: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItems: {
    maxHeight: 500,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatContextMenu;


