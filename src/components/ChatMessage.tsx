import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CustomAlertService } from '../services/CustomAlertService';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { 
  FileText, 
  Download, 
  Edit2, 
  Trash2, 
  X, 
  ZoomIn,
  History,
  AlertCircle,
  Check,
  CheckCheck
} from 'lucide-react-native';
import { Message } from '../services/chatService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatMessageProps {
  message: Message & {
    fileMetadata?: {
      originalName: string;
      size: number;
      hash: string;
    };
    evidence?: {
      deviceInfo: string;
      appVersion: string;
    };
  };
  isOwnMessage: boolean;
  isAdmin?: boolean;
  onEdit?: (messageId: string, currentText: string) => void;
  onDelete?: (messageId: string) => void;
  onViewHistory?: (messageId: string) => void;
  onDownload?: (url: string, filename: string) => void;
}

export function ChatMessage({
  message,
  isOwnMessage,
  isAdmin = false,
  onEdit,
  onDelete,
  onViewHistory,
  onDownload,
}: ChatMessageProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [showMenu, setShowMenu] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleLongPress = () => {
    if (message.deletedAt && !isAdmin) return; // Can't interact with deleted messages
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit && message.text) {
      onEdit(message.id, message.text);
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    CustomAlertService.showConfirmation(
      isRTL ? 'حذف الرسالة' : 'Delete Message',
      isRTL ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?',
      () => onDelete?.(message.id),
      undefined,
      isRTL
    );
  };

  const handleViewHistory = () => {
    setShowMenu(false);
    onViewHistory?.(message.id);
  };

  const handleDownload = () => {
    if (message.attachments && message.attachments[0] && message.fileMetadata) {
      onDownload?.(message.attachments[0], message.fileMetadata.originalName);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString(isRTL ? 'ar' : 'en', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = () => {
    if (message.status === 'read') {
      return <CheckCheck size={14} color={theme.primary} />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck size={14} color={theme.textSecondary} />;
    }
    return <Check size={14} color={theme.textSecondary} />;
  };

  // Deleted message view
  if (message.deletedAt && !isAdmin) {
    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
        <View style={[styles.deletedBubble, { backgroundColor: theme.surface }]}>
          <AlertCircle size={16} color={theme.textSecondary} />
          <Text style={[styles.deletedText, { color: theme.textSecondary }]}>
            {isRTL ? 'تم حذف هذه الرسالة' : 'This message was deleted'}
          </Text>
        </View>
      </View>
    );
  }

  // Admin view of deleted message
  if (message.deletedAt && isAdmin) {
    return (
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}
      >
        <View style={[styles.messageBubble, { backgroundColor: theme.error + '20', borderColor: theme.error, borderWidth: 1 }]}>
          <View style={styles.deletedHeader}>
            <AlertCircle size={16} color={theme.error} />
            <Text style={[styles.deletedLabel, { color: theme.error }]}>
              {isRTL ? 'محذوف (مرئي للمسؤول فقط)' : 'Deleted (Admin View)'}
            </Text>
          </View>
          {renderMessageContent()}
        </View>
        {renderMessageMenu()}
      </TouchableOpacity>
    );
  }

  const renderMessageContent = () => {
    // Text message
    if (message.type === 'TEXT' || !message.type) {
      return (
        <>
          <Text style={[styles.messageText, { color: isOwnMessage ? '#FFFFFF' : theme.textPrimary }]}>
            {message.text}
          </Text>
          {message.editedAt && (
            <View style={styles.editedBadge}>
              <Edit2 size={10} color={isOwnMessage ? '#FFFFFF' : theme.textSecondary} />
              <Text style={[styles.editedText, { color: isOwnMessage ? '#FFFFFF' : theme.textSecondary }]}>
                {isRTL ? 'معدل' : 'edited'}
              </Text>
              {isAdmin && message.editHistory && message.editHistory.length > 0 && (
                <TouchableOpacity onPress={handleViewHistory} style={styles.historyButton}>
                  <History size={10} color={isOwnMessage ? '#FFFFFF' : theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.messageFooter}>
            <Text style={[styles.timeText, { color: isOwnMessage ? '#FFFFFF' : theme.textSecondary }]}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwnMessage && (
              <View style={styles.statusIcon}>
                {getStatusIcon()}
              </View>
            )}
          </View>
        </>
      );
    }

    // Image message
    if (message.type === 'IMAGE') {
      return (
        <View style={styles.imageContainer}>
          {message.uploadStatus === 'uploading' ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.uploadingText, { color: theme.textPrimary }]}>
                {isRTL ? 'جاري الرفع...' : 'Uploading...'}
              </Text>
            </View>
          ) : message.uploadStatus === 'failed' ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={32} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {isRTL ? 'فشل الرفع' : 'Upload failed'}
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => setShowFullImage(true)} activeOpacity={0.9}>
                <Image
                  source={{ uri: message.attachments?.[0] }}
                  style={styles.messageImage}
                  resizeMode="cover"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.imageOverlay}>
                  <ZoomIn size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              {message.text && (
                <Text style={[styles.imageCaptionText, { color: isOwnMessage ? '#FFFFFF' : theme.textPrimary }]}>
                  {message.text}
                </Text>
              )}
              <View style={styles.messageFooter}>
                <Text style={[styles.timeText, { color: isOwnMessage ? '#FFFFFF' : theme.textSecondary }]}>
                  {formatTime(message.createdAt)}
                </Text>
                {isOwnMessage && (
                  <View style={styles.statusIcon}>
                    {getStatusIcon()}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      );
    }

    // File message
    if (message.type === 'FILE') {
      return (
        <View style={styles.fileContainer}>
          {message.uploadStatus === 'uploading' ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.uploadingText, { color: theme.textPrimary }]}>
                {isRTL ? 'جاري رفع' : 'Uploading'} {message.fileMetadata?.originalName}...
              </Text>
            </View>
          ) : message.uploadStatus === 'failed' ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={24} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {isRTL ? 'فشل الرفع' : 'Upload failed'}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.fileIconContainer}>
                <FileText size={32} color={theme.primary} />
              </View>
              <View style={styles.fileInfo}>
                <Text
                  style={[styles.fileName, { color: isOwnMessage ? '#FFFFFF' : theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {message.fileMetadata?.originalName || 'Document'}
                </Text>
                <Text style={[styles.fileSize, { color: isOwnMessage ? '#FFFFFF' : theme.textSecondary }]}>
                  {message.fileMetadata?.size ? formatFileSize(message.fileMetadata.size) : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
                <Download size={20} color={theme.primary} />
              </TouchableOpacity>
              <View style={styles.messageFooter}>
                <Text style={[styles.timeText, { color: isOwnMessage ? '#FFFFFF' : theme.textSecondary }]}>
                  {formatTime(message.createdAt)}
                </Text>
                {isOwnMessage && (
                  <View style={styles.statusIcon}>
                    {getStatusIcon()}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      );
    }

    return null;
  };

  const renderMessageMenu = () => (
    <Modal
      visible={showMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
        <View style={[styles.menuContainer, { backgroundColor: theme.surface }]}>
          {isOwnMessage && !message.deletedAt && message.type === 'TEXT' && (
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Edit2 size={20} color={theme.textPrimary} />
              <Text style={[styles.menuText, { color: theme.textPrimary }]}>
                {isRTL ? 'تعديل' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
          {isOwnMessage && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Trash2 size={20} color={theme.error} />
              <Text style={[styles.menuText, { color: theme.error }]}>
                {isRTL ? 'حذف' : 'Delete'}
              </Text>
            </TouchableOpacity>
          )}
          {isAdmin && message.editHistory && message.editHistory.length > 0 && (
            <TouchableOpacity style={styles.menuItem} onPress={handleViewHistory}>
              <History size={20} color={theme.primary} />
              <Text style={[styles.menuText, { color: theme.primary }]}>
                {isRTL ? 'عرض السجل' : 'View History'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );

  const renderFullImageModal = () => (
    <Modal
      visible={showFullImage}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFullImage(false)}
    >
      <View style={styles.fullImageContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowFullImage(false)}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Image
          source={{ uri: message.attachments?.[0] }}
          style={styles.fullImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwnMessage ? theme.primary : theme.surface,
            },
          ]}
        >
          {renderMessageContent()}
        </View>
      </TouchableOpacity>
      {renderMessageMenu()}
      {message.type === 'IMAGE' && renderFullImageModal()}
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '75%',
    alignSelf: 'flex-start',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  statusIcon: {
    marginLeft: 4,
  },
  editedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  editedText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  historyButton: {
    marginLeft: 4,
  },
  deletedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1.5,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  deletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  deletedLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    width: 250,
  },
  messageImage: {
    width: 250,
    height: 250,
    borderRadius: 18,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageCaptionText: {
    marginTop: 8,
    fontSize: 14,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  uploadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  errorText: {
    fontSize: 14,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  fileIconContainer: {
    padding: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadButton: {
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: 18,
    padding: 10,
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});





