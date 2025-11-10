/**
 * Message Actions Extended Component
 * 
 * COMMENT: ADVANCED FEATURE - Copied from reference chat system
 * Purpose: Advanced message actions menu with Quote feature (different from Reply)
 * Source: C:\Users\Admin\Desktop\chat\react-native-chat\src\components\MessageActionsExtended.js
 */

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Copy, Quote, Pin, PinOff, Star, StarOff, Reply, Smile, Forward, Edit2, Trash2, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

interface MessageActionsExtendedProps {
  visible: boolean;
  onClose: () => void;
  message: {
    text?: string;
    isPinned?: boolean;
    starredBy?: string[];
    [key: string]: any;
  };
  isOwnMessage: boolean;
  onReply?: (message: any) => void;
  onDelete?: (message: any) => void;
  onForward?: (message: any) => void;
  onCopy?: (message: any) => void;
  onQuote?: (message: any) => void;
  onPin?: (message: any) => void;
  onStar?: (message: any) => void;
  onEdit?: (message: any) => void;
  onReaction?: (message: any) => void;
}

export const MessageActionsExtended: React.FC<MessageActionsExtendedProps> = ({
  visible,
  onClose,
  message,
  isOwnMessage,
  onReply,
  onDelete,
  onForward,
  onCopy,
  onQuote,
  onPin,
  onStar,
  onEdit,
  onReaction,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  const handleCopy = () => {
    if (message?.text && onCopy) {
      onCopy(message);
      onClose();
    }
  };

  const handleQuote = () => {
    if (onQuote) {
      onQuote(message);
      onClose();
    }
  };

  const handlePin = () => {
    if (onPin) {
      onPin(message);
      onClose();
    }
  };

  const handleStar = () => {
    if (onStar) {
      onStar(message);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.menuContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.menu}>
            {message?.text && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
                  <Copy size={24} color={theme.primary} />
                  <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                    {isRTL ? 'نسخ' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                {onQuote && (
                  <TouchableOpacity style={styles.menuItem} onPress={handleQuote}>
                    <Quote size={24} color={theme.primary} />
                    <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                      {isRTL ? 'اقتباس' : 'Quote'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {onPin && (
              <TouchableOpacity style={styles.menuItem} onPress={handlePin}>
                {message.isPinned ? (
                  <>
                    <PinOff size={24} color={theme.primary} />
                    <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                      {isRTL ? 'إلغاء التثبيت' : 'Unpin'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Pin size={24} color={theme.primary} />
                    <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                      {isRTL ? 'تثبيت' : 'Pin'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {onStar && (
              <TouchableOpacity style={styles.menuItem} onPress={handleStar}>
                {message.starredBy && message.starredBy.length > 0 ? (
                  <>
                    <StarOff size={24} color="#FFD700" />
                    <Text style={[styles.menuItemText, { color: '#FFD700', marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                      {isRTL ? 'إلغاء التميز' : 'Unstar'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Star size={24} color="#FFD700" />
                    <Text style={[styles.menuItemText, { color: '#FFD700', marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                      {isRTL ? 'تميز' : 'Star'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {onReply && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onReply(message);
                  onClose();
                }}
              >
                <Reply size={24} color={theme.primary} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                  {isRTL ? 'رد' : 'Reply'}
                </Text>
              </TouchableOpacity>
            )}

            {onReaction && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onReaction(message);
                  onClose();
                }}
              >
                <Smile size={24} color={theme.primary} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                  {isRTL ? 'تفاعل' : 'React'}
                </Text>
              </TouchableOpacity>
            )}

            {onForward && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onForward(message);
                  onClose();
                }}
              >
                <Forward size={24} color={theme.primary} />
                <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                  {isRTL ? 'إعادة توجيه' : 'Forward'}
                </Text>
              </TouchableOpacity>
            )}

            {isOwnMessage && (
              <>
                {onEdit && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      onEdit(message);
                      onClose();
                    }}
                  >
                    <Edit2 size={24} color={theme.primary} />
                    <Text style={[styles.menuItemText, { color: theme.textPrimary, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                      {isRTL ? 'تعديل' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                )}

                {onDelete && (
                  <TouchableOpacity
                    style={[styles.menuItem, styles.deleteItem]}
                    onPress={() => {
                      onDelete(message);
                      onClose();
                    }}
                  >
                    <Trash2 size={24} color={theme.error} />
                    <Text style={[styles.menuItemText, { color: theme.error, marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }]}>
                      {isRTL ? 'حذف' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: theme.error }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    justifyContent: 'flex-end',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  menu: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuItemText: {
    fontSize: 16,
  },
  deleteItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});








