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
  ViewStyle,
  TextStyle,
  ImageStyle,
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
  CheckCheck,
  Play,
  Pause,
  Volume2,
  Video as VideoIcon,
} from 'lucide-react-native';
import { Message } from '../services/chatService';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function to safely cast styles
const asViewStyle = (...styles: any[]): ViewStyle[] => styles.map(style => style as ViewStyle);
const asTextStyle = (...styles: any[]): TextStyle[] => styles.map(style => style as TextStyle);
const asImageStyle = (...styles: any[]): ImageStyle[] => styles.map(style => style as ImageStyle);

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
  
  // Voice playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Video playback state
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoRef, setVideoRef] = useState<Video | null>(null);

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

  // Voice playback functions using HTML5 Audio
  const playVoiceMessage = async () => {
    if (!message.attachments || !message.attachments[0]) return;

    try {
      if (audioElement) {
        if (isPlaying) {
          audioElement.pause();
          setIsPlaying(false);
        } else {
          await audioElement.play();
          setIsPlaying(true);
        }
      } else {
        // Create new audio element
        const audio = new Audio(message.attachments[0]);
        
        audio.addEventListener('loadedmetadata', () => {
          setPlaybackDuration(audio.duration * 1000);
        });
        
        audio.addEventListener('timeupdate', () => {
          setPlaybackPosition(audio.currentTime * 1000);
        });
        
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setPlaybackPosition(0);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
        });
        
        setAudioElement(audio);
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing voice message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تشغيل الرسالة الصوتية' : 'Failed to play voice message'
      );
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Video playback functions using expo-av Video
  const playVideoMessage = async () => {
    if (!message.attachments || !message.attachments[0]) return;

    try {
      setShowVideoPlayer(true);
      
      if (videoRef) {
        if (isPlayingVideo) {
          await videoRef.pauseAsync();
          setIsPlayingVideo(false);
        } else {
          await videoRef.playAsync();
          setIsPlayingVideo(true);
        }
      }
    } catch (error) {
      console.error('Error playing video message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تشغيل الفيديو' : 'Failed to play video'
      );
    }
  };

  const closeVideoPlayer = () => {
    if (videoRef) {
      videoRef.pauseAsync();
    }
    setShowVideoPlayer(false);
    setIsPlayingVideo(false);
    setVideoRef(null);
  };

  // Cleanup audio and video on unmount
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      if (videoRef) {
        videoRef.pauseAsync();
      }
    };
  }, [audioElement, videoRef]);

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
      <View style={[...asViewStyle(styles.messageContainer), isOwnMessage && asViewStyle(styles.ownMessage)]}>
        <View style={[...asViewStyle(styles.deletedBubble), { backgroundColor: theme.surface }]}>
          <AlertCircle size={16} color={theme.textSecondary} />
          <Text style={[...asTextStyle(styles.deletedText), { color: theme.textSecondary }]}>
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
        style={[...asViewStyle(styles.messageContainer), isOwnMessage && asViewStyle(styles.ownMessage)]}
      >
        <View style={[...asViewStyle(styles.messageBubble), { backgroundColor: theme.error + '20', borderColor: theme.error, borderWidth: 1 }]}>
          <View style={styles.deletedHeader}>
            <AlertCircle size={16} color={theme.error} />
            <Text style={[...asTextStyle(styles.deletedLabel), { color: theme.error }]}>
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
          <Text style={[...asTextStyle(styles.messageText), { color: isOwnMessage ? '#000000' : theme.textPrimary }]}>
            {message.text}
          </Text>
          {message.editedAt && (
            <View style={styles.editedBadge}>
              <Edit2 size={10} color={isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary} />
              <Text style={[...asTextStyle(styles.editedText), { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}>
                {isRTL ? 'معدل' : 'edited'}
              </Text>
              {isAdmin && message.editHistory && message.editHistory.length > 0 && (
                <TouchableOpacity onPress={handleViewHistory} style={styles.historyButton}>
                  <History size={10} color={isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.messageFooter}>
            <Text style={[...asTextStyle(styles.timeText), { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}>
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

    // Voice message
    if (message.type === 'voice') {
      const duration = message.duration || 0;
      const formattedDuration = formatDuration(duration * 1000);
      
      return (
        <TouchableOpacity 
          style={styles.voiceContainer}
          onPress={playVoiceMessage}
          activeOpacity={0.7}
        >
          <View style={[
            styles.voiceButton,
            { backgroundColor: isOwnMessage ? theme.primary : theme.surface }
          ]}>
            {isPlaying ? (
              <Pause size={20} color={isOwnMessage ? '#000000' : theme.primary} />
            ) : (
              <Play size={20} color={isOwnMessage ? '#000000' : theme.primary} />
            )}
          </View>
          
          <View style={styles.voiceInfo}>
            <View style={styles.voiceWaveform}>
              {/* Simple waveform visualization */}
              {Array.from({ length: 20 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    {
                      height: Math.random() * 20 + 5,
                      backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.3)' : theme.primary,
                      opacity: isPlaying && i < (playbackPosition / playbackDuration) * 20 ? 1 : 0.3,
                    }
                  ]}
                />
              ))}
            </View>
            
            <Text style={[
              styles.voiceDuration,
              { color: isOwnMessage ? 'rgba(0,0,0,0.7)' : theme.textSecondary }
            ]}>
              {isPlaying ? formatDuration(playbackPosition) : formattedDuration}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Video message
    if (message.type === 'video') {
      const duration = message.duration || 0;
      const formattedDuration = formatDuration(duration * 1000);
      const thumbnailUrl = message.thumbnailUrl || message.attachments?.[0];

      return (
        <TouchableOpacity
          style={styles.videoContainer}
          onPress={playVideoMessage}
          activeOpacity={0.7}
        >
          <View style={styles.videoThumbnail}>
            <Image
              source={{ uri: thumbnailUrl }}
              style={asImageStyle(styles.videoThumbnailImage)}
              resizeMode="cover"
            />
            <View style={styles.videoPlayButton}>
              <Play size={24} color="#FFFFFF" />
            </View>
            <View style={styles.videoDuration}>
              <Text style={styles.videoDurationText}>{formattedDuration}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Image message
    if (message.type === 'IMAGE') {
      return (
        <View style={styles.imageContainer}>
          {message.uploadStatus === 'uploading' ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[...asTextStyle(styles.uploadingText), { color: theme.textPrimary }]}>
                {isRTL ? 'جاري الرفع...' : 'Uploading...'}
              </Text>
            </View>
          ) : message.uploadStatus === 'failed' ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={32} color={theme.error} />
              <Text style={[...asTextStyle(styles.errorText), { color: theme.error }]}>
                {isRTL ? 'فشل الرفع' : 'Upload failed'}
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => setShowFullImage(true)} activeOpacity={0.9}>
                <Image
                  source={{ uri: message.attachments?.[0] }}
                  style={asImageStyle(styles.messageImage)}
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
                {/* Download button for images */}
                <TouchableOpacity 
                  onPress={() => onDownload?.(message.attachments?.[0] || '', message.fileMetadata?.originalName || 'image.jpg')}
                  style={styles.imageDownloadButton}
                  activeOpacity={0.7}
                >
                  <Download size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </TouchableOpacity>
              {message.text && (
                <Text style={[...asTextStyle(styles.imageCaptionText), { color: isOwnMessage ? '#000000' : theme.textPrimary }]}>
                  {message.text}
                </Text>
              )}
              <View style={styles.messageFooter}>
                <Text style={[...asTextStyle(styles.timeText), { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}>
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
              <Text style={[...asTextStyle(styles.uploadingText), { color: theme.textPrimary }]}>
                {isRTL ? 'جاري رفع' : 'Uploading'} {message.fileMetadata?.originalName}...
              </Text>
            </View>
          ) : message.uploadStatus === 'failed' ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={24} color={theme.error} />
              <Text style={[...asTextStyle(styles.errorText), { color: theme.error }]}>
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
                  style={[...asTextStyle(styles.fileName), { color: isOwnMessage ? '#000000' : theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {message.fileMetadata?.originalName || 'Document'}
                </Text>
                <Text style={[...asTextStyle(styles.fileSize), { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}>
                  {message.fileMetadata?.size ? formatFileSize(message.fileMetadata.size) : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
                <Download size={20} color={isOwnMessage ? '#000000' : theme.primary} />
              </TouchableOpacity>
              <View style={styles.messageFooter}>
                <Text style={[...asTextStyle(styles.timeText), { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}>
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
        <View style={[...asViewStyle(styles.menuContainer), { backgroundColor: theme.surface }]}>
          {isOwnMessage && !message.deletedAt && message.type === 'TEXT' && (
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Edit2 size={20} color={theme.textPrimary} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.textPrimary }]}>
                {isRTL ? 'تعديل' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
          {isOwnMessage && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Trash2 size={20} color={theme.error} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.error }]}>
                {isRTL ? 'حذف' : 'Delete'}
              </Text>
            </TouchableOpacity>
          )}
          {isAdmin && message.editHistory && message.editHistory.length > 0 && (
            <TouchableOpacity style={styles.menuItem} onPress={handleViewHistory}>
              <History size={20} color={theme.primary} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
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
        <TouchableOpacity
          style={styles.downloadButtonFullImage}
          onPress={() => {
            setShowFullImage(false);
            onDownload?.(message.attachments?.[0] || '', message.fileMetadata?.originalName || 'image.jpg');
          }}
        >
          <Download size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Image
          source={{ uri: message.attachments?.[0] }}
          style={asImageStyle(styles.fullImage)}
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
        style={[...asViewStyle(styles.messageContainer), isOwnMessage && asViewStyle(styles.ownMessage)]}
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
      
      {/* Video Player Modal */}
      {showVideoPlayer && (
        <Modal
          visible={showVideoPlayer}
          transparent={true}
          animationType="fade"
          onRequestClose={closeVideoPlayer}
        >
          <View style={styles.videoPlayerOverlay}>
            <View style={styles.videoPlayerContainer}>
              <TouchableOpacity
                style={styles.videoPlayerClose}
                onPress={closeVideoPlayer}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {message.attachments && message.attachments[0] && (
                <Video
                  ref={(ref) => setVideoRef(ref)}
                  source={{ uri: message.attachments[0] }}
                  useNativeControls
                  style={styles.videoPlayer}
                  shouldPlay={isPlayingVideo}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded && status.didJustFinish) {
                      setIsPlayingVideo(false);
                    }
                  }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
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
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voiceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginRight: 12,
  },
  waveformBar: {
    width: 2,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  videoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  videoThumbnail: {
    width: 200,
    height: 150,
    position: 'relative',
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoPlayerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainer: {
    width: '90%',
    height: '70%',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoPlayerClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
  imageDownloadButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  downloadButtonFullImage: {
    position: 'absolute',
    top: 50,
    right: 80,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});





