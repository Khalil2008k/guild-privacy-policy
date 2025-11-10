import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Platform,
  I18nManager,
} from 'react-native';
import { CustomAlertService } from '../services/CustomAlertService';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';
import { FormattedTextWithBlocks } from '../utils/textFormatter';
import { LinkPreview } from './LinkPreview';
import { hasUrls, getFirstUrl, fetchLinkPreview } from '../utils/linkPreview';
import { DisappearingMessageTimer } from './DisappearingMessageTimer';
import { MessageTranslation } from './MessageTranslation';
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
  Pin,
  PinOff,
  Star,
  StarOff,
  RefreshCw,
  Clock,
  CheckCircle,
  Circle,
  Smile,
  Copy,
  Reply,
  Quote,
  Forward,
} from 'lucide-react-native';
import { Message } from '../services/chatService';
import { Video } from 'expo-av';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ReactionPicker } from './ReactionPicker';
import { ReplyPreview } from './ReplyPreview';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { MessageActionsExtended } from './MessageActionsExtended';
import { DocumentViewer } from './DocumentViewer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function to safely cast styles
const asViewStyle = (...styles: any[]): ViewStyle[] => styles.map(style => style as ViewStyle);
const asTextStyle = (...styles: any[]): TextStyle[] => styles.map(style => style as TextStyle);
const asImageStyle = (...styles: any[]): ImageStyle[] => styles.map(style => style as ImageStyle);

// Smart RTL/LTR detection based on content
function detectTextDirection(text: string): 'ltr' | 'rtl' {
  if (!text || typeof text !== 'string') {
    return I18nManager.isRTL ? 'rtl' : 'ltr';
  }

  const arabicChars = /[\u0600-\u06FF]/g;
  const englishChars = /[A-Za-z]/g;

  const arabicCount = (text.match(arabicChars) || []).length;
  const englishCount = (text.match(englishChars) || []).length;

  if (arabicCount > englishCount) {
    return 'rtl';
  } else if (englishCount > arabicCount) {
    return 'ltr';
  } else {
    // Equal counts or no matches - fall back to device language
    return I18nManager.isRTL ? 'rtl' : 'ltr';
  }
}

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
    isPinned?: boolean;
    isStarred?: boolean;
    starredBy?: string[];
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    tempId?: string;
    readBy?: Record<string, any> | string[];
    chatId?: string;
  };
  isOwnMessage: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onEdit?: (messageId: string, currentText: string) => void;
  onDelete?: (messageId: string) => void;
  onViewHistory?: (messageId: string) => void;
  onDownload?: (url: string, filename: string) => void;
  onPin?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  onRetry?: (messageId: string, messageText: string) => void;
  onViewReadReceipts?: (messageId: string) => void;
  onForward?: (message: any) => void;
  // Selection mode props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (messageId: string, selected: boolean) => void;
  // Advanced features from reference system
  onReply?: (message: any) => void;
  onReaction?: (message: any) => void;
  onQuote?: (message: any) => void;
  onCopy?: (message: any) => void;
  chatId?: string;
}

export function ChatMessage({
  message,
  isOwnMessage,
  isAdmin = false,
  currentUserId,
  onEdit,
  onDelete,
  onViewHistory,
  onDownload,
  onPin,
  onStar,
  onRetry,
  onViewReadReceipts,
  onForward,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onReply,
  onReaction,
  onQuote,
  onCopy,
  chatId,
}: ChatMessageProps) {
  const { theme } = useTheme();
  const { t, isRTL, locale } = useI18n();
  
  // Detect text direction for this specific message based on content
  const textDirection = message.text ? detectTextDirection(message.text) : (isRTL ? 'rtl' : 'ltr');
  
  const [showMenu, setShowMenu] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  // Voice playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Video playback state
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoRef, setVideoRef] = useState<Video | null>(null);
  
  // Link preview state
  const [linkPreview, setLinkPreview] = useState<any>(null);
  
  // Document viewer state
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const handleLongPress = () => {
    if (message.deletedAt && !isAdmin) return; // Can't interact with deleted messages
    if (isSelectionMode && onSelect) {
      // In selection mode, toggle selection instead of showing menu
      onSelect(message.id, !isSelected);
    } else {
      setShowMenu(true);
    }
  };

  const handlePress = () => {
    // In selection mode, tap also toggles selection
    if (isSelectionMode && onSelect) {
      onSelect(message.id, !isSelected);
    }
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

  const handlePin = () => {
    setShowMenu(false);
    onPin?.(message.id);
  };

  const handleStar = () => {
    setShowMenu(false);
    onStar?.(message.id);
  };

  const isStarredByCurrentUser = currentUserId && message.starredBy?.includes(currentUserId);

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
          // COMMENT: PRIORITY 1 - Replace console.error with logger
          logger.error('Audio playback error:', e);
          setIsPlaying(false);
        });
        
        setAudioElement(audio);
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error playing voice message:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error playing video message:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تشغيل الفيديو' : 'Failed to play video'
      );
    }
  };

  const closeVideoPlayer = () => {
      if (videoRef) {
        // ✅ Fix: Wrap pauseAsync in try-catch to handle unloaded video
        videoRef.pauseAsync().catch((error: any) => {
          // Silently handle errors when video component hasn't loaded
          if (__DEV__) {
            logger.debug('Video pause error (expected if not loaded):', error.message);
          }
        });
      }
    setShowVideoPlayer(false);
    setIsPlayingVideo(false);
    setVideoRef(null);
  };

  // Fetch link preview when message text contains URLs
  useEffect(() => {
    if (message.text && hasUrls(message.text) && (message.type === 'TEXT' || !message.type)) {
      const firstUrl = getFirstUrl(message.text);
      if (firstUrl) {
        fetchLinkPreview(firstUrl).then(preview => {
          if (preview) {
            setLinkPreview(preview);
          }
        }).catch(error => {
          logger.debug('Error fetching link preview:', error);
        });
      }
    } else {
      setLinkPreview(null);
    }
  }, [message.text, message.type]);

  // Cleanup audio and video on unmount
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      if (videoRef) {
        // ✅ Fix: Check if video is loaded before trying to pause
        // Wrap in try-catch to handle cases where video hasn't loaded yet
        videoRef.pauseAsync().catch((error: any) => {
          // Silently handle errors when video component hasn't loaded
          // This is expected during cleanup when component unmounts before video loads
          if (__DEV__) {
            logger.debug('Video cleanup error (expected during unmount):', error.message);
          }
        });
      }
    };
  }, [audioElement, videoRef]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = () => {
    const messageStatus = message.status || 'sent';
    
    // Failed state - show retry button
    if (messageStatus === 'failed') {
      return (
        <TouchableOpacity
          onPress={() => {
            if (onRetry && message.text) {
              onRetry(message.tempId || message.id, message.text);
            }
          }}
          style={styles.retryButton}
        >
          <RefreshCw size={14} color="#000000" />
        </TouchableOpacity>
      );
    }
    
    // Sending state - show spinner
    if (messageStatus === 'sending') {
      return <ActivityIndicator size={12} color="#000000" />;
    }
    
    // Check if message has read receipts
    const readBy = message.readBy || {};
    const hasReadReceipts = typeof readBy === 'object' && !Array.isArray(readBy) 
      ? Object.keys(readBy).length > 0
      : Array.isArray(readBy) && readBy.length > 0;
    
    // Read state - double checkmark (black) - clickable to view read receipts
    if (messageStatus === 'read' || hasReadReceipts) {
      if (onViewReadReceipts && hasReadReceipts) {
        return (
          <TouchableOpacity
            onPress={() => onViewReadReceipts(message.id)}
            style={styles.statusIconButton}
          >
            <CheckCheck size={14} color="#000000" />
          </TouchableOpacity>
        );
      }
      return <CheckCheck size={14} color="#000000" />;
    }
    
    // Delivered state - double checkmark (grey)
    if (messageStatus === 'delivered') {
      return <CheckCheck size={14} color="rgba(0,0,0,0.4)" />;
    }
    
    // Sent state - single checkmark (grey)
    return <Check size={14} color="rgba(0,0,0,0.4)" />;
  };

  // Deleted message view
  if (message.deletedAt && !isAdmin) {
    return (
      <View style={[
        styles.messageContainer, 
        isOwnMessage 
          ? (isRTL ? { alignSelf: 'flex-start' } : styles.ownMessage) // In RTL, own messages go left
          : (isRTL ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }) // In RTL, other messages go right
      ]}>
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
        style={[
          ...asViewStyle(styles.messageContainer), 
          isOwnMessage 
            ? (isRTL ? { alignSelf: 'flex-start' } : asViewStyle(styles.ownMessage)) // In RTL, own messages go left
            : (isRTL ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }) // In RTL, other messages go right
        ]}
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
          {/* Reply Preview - Show original message being replied to */}
          {message.replyTo && (
            <ReplyPreview message={message} onPress={() => {
              // TODO: Scroll to original message
            }} />
          )}
          <FormattedTextWithBlocks
            text={message.text}
            baseColor={isOwnMessage ? '#000000' : theme.textPrimary}
            fontSize={11}
            style={[
              ...asTextStyle(styles.messageText),
              {
                writingDirection: textDirection,
                textAlign: textDirection === 'rtl' ? 'right' : 'left',
                marginBottom: 20, // ✅ MASTER FIX: Bottom margin to prevent overlap with footer (timestamp + checkmarks)
                // Ensures text content never overlaps with footer, even in short messages
              },
            ]}
          />
          
          {/* Message Translation */}
          <MessageTranslation
            originalText={message.text}
            sourceLanguage={message.detectedLanguage}
            targetLanguage={locale?.split('-')[0] || 'en'}
            isOwnMessage={isOwnMessage}
            compact={true}
          />
          
          {linkPreview && (
            <View style={{ marginBottom: 4 }}>
              <LinkPreview preview={linkPreview} isOwnMessage={isOwnMessage} />
            </View>
          )}
          {message.editedAt && (
            <View style={[styles.editedBadge, { marginBottom: 4 }]}>
              <Edit2 size={10} color={isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary} />
              <Text style={[styles.editedText, { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}>
                {isRTL ? 'معدل' : 'edited'}
              </Text>
              {isAdmin && message.editHistory && message.editHistory.length > 0 && (
                <TouchableOpacity onPress={handleViewHistory} style={styles.historyButton}>
                  <History size={10} color={isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={[
            styles.messageFooter,
            {
              // ✅ LAYERED ARCHITECTURE: Footer adapts to bubble - always use space-between
              flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row',
              justifyContent: 'space-between', // ✅ LAYERED ARCHITECTURE: Time left, checkmarks right (opposite corners)
              // ✅ LAYERED ARCHITECTURE: Footer adapts to bubble width automatically
              // left: 12 and right: 12 from base style ensure footer spans bubble width
              // Footer layer adapts to bubble size via left/right positioning
            },
          ]}>
            <View style={[
              styles.footerLeft,
              textDirection === 'rtl' && { marginRight: 0, marginLeft: 'auto' },
            ]}>
              {message.isPinned && (
                <Pin size={12} color={isOwnMessage ? 'rgba(0,0,0,0.4)' : theme.textSecondary} style={styles.pinIcon} />
              )}
              {isStarredByCurrentUser && (
                <Star size={12} color="#FFD700" style={styles.starIcon} fill="#FFD700" />
              )}
              <Text 
                numberOfLines={1}
                style={[
                  ...asTextStyle(styles.timeText), 
                  { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary },
                  // Remove shadow for sender messages
                  isOwnMessage && {
                    textShadowColor: 'transparent',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 0,
                  },
                ]}
              >
                {formatTime(message.createdAt)}
              </Text>
            </View>
            {message.isDisappearing && message.expiresAt && message.disappearingDuration && (
              <View style={{ marginTop: 4 }}>
                <DisappearingMessageTimer
                  expiresAt={message.expiresAt?.toDate?.() || (typeof message.expiresAt === 'number' ? new Date(message.expiresAt) : new Date(message.expiresAt))}
                  duration={message.disappearingDuration}
                  size="small"
                  isOwnMessage={isOwnMessage}
                />
              </View>
            )}
            {isOwnMessage && (
              <View style={styles.statusIcon}>
                {getStatusIcon()}
              </View>
            )}
          </View>
        </>
      );
    }

    // ✅ MODERN 2025: Voice message with horizontal pill layout + animated waveform
    if (message.type === 'voice') {
      const duration = message.duration || 0;
      const formattedDuration = formatDuration(duration * 1000);
      
      return (
        <Animated.View entering={FadeIn.duration(250)}>
          <View style={styles.voiceBar}>
            <Pressable 
              style={[styles.voicePlayButton, { backgroundColor: isOwnMessage ? theme.primary : theme.surface }]}
              onPress={playVoiceMessage}
            >
              {isPlaying ? (
                <Pause size={18} color={isOwnMessage ? '#000000' : theme.primary} />
              ) : (
                <Play size={18} color={isOwnMessage ? '#000000' : theme.primary} fill={isOwnMessage ? '#000000' : theme.primary} />
              )}
            </Pressable>
            
            <View style={styles.voiceTrack}>
              <LinearGradient
                colors={isOwnMessage ? ['#00BF6E', '#009955'] : [theme.primary + '80', theme.primary + '40']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.voiceGradientTrack, { width: isPlaying ? `${(playbackPosition / playbackDuration) * 100}%` : '0%' }]}
              />
              <View style={styles.voiceWaveform}>
                {/* ✅ MODERN 2025: Animated waveform bars */}
                {Array.from({ length: 30 }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBarModern,
                      {
                        height: Math.random() * 16 + 4,
                        backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.4)' : theme.primary,
                        opacity: isPlaying && i < (playbackPosition / playbackDuration) * 30 ? 1 : 0.3,
                      }
                    ]}
                  />
                ))}
              </View>
            </View>
            
            <Text style={[
              styles.voiceTimer,
              { color: isOwnMessage ? 'rgba(0,0,0,0.7)' : theme.textSecondary }
            ]}>
              {isPlaying ? formatDuration(playbackPosition) : formattedDuration}
            </Text>
          </View>
        </Animated.View>
      );
    }

    // Video message
    if (message.type === 'video' || message.type === 'VIDEO') {
      const duration = message.duration || 0;
      const formattedDuration = duration > 0 ? formatDuration(duration * 1000) : '';
      const thumbnailUrl = message.thumbnailUrl || message.attachments?.[0];
      const videoUrl = message.attachments?.[0];

      return (
        <View style={styles.videoContainer}>
          {message.uploadStatus === 'uploading' ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[...asTextStyle(styles.uploadingText), { color: theme.textPrimary }]}>
                {isRTL ? 'جاري رفع الفيديو...' : 'Uploading video...'}
              </Text>
            </View>
          ) : message.uploadStatus === 'failed' ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={32} color={theme.error} />
              <Text style={[...asTextStyle(styles.errorText), { color: theme.error }]}>
                {isRTL ? 'فشل رفع الفيديو' : 'Video upload failed'}
              </Text>
            </View>
          ) : (
            <>
              <Animated.View entering={FadeIn.duration(300)}>
                <TouchableOpacity
                  style={styles.videoContainer}
                  onPress={playVideoMessage}
                  onLongPress={handleLongPress}
                  delayLongPress={500}
                  activeOpacity={0.7}
                >
                  <View style={styles.videoThumbnail}>
                    {thumbnailUrl ? (
                      <Image
                        source={{ uri: thumbnailUrl }}
                        style={asImageStyle(styles.videoThumbnailImage)}
                        resizeMode="cover"
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                      />
                    ) : (
                      <View style={[styles.videoThumbnailImage, { backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center' }]}>
                        <Video size={48} color={theme.textSecondary} />
                      </View>
                    )}
                    {imageLoading && (
                      <View style={styles.imageLoadingOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    )}
                    {/* ✅ MODERN 2025: Larger play icon centered */}
                    <View style={styles.videoPlayButton}>
                      <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                    {/* Duration badge */}
                    {formattedDuration && (
                      <View style={styles.videoDuration}>
                        <Text style={styles.videoDurationText}>{formattedDuration}</Text>
                      </View>
                    )}
                    {/* ✅ MODERN 2025: Glass overlay with gradient for timestamps */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={styles.mediaOverlay}
                    >
                      {/* Overlay footer: timestamp + checkmarks (WhatsApp-style) */}
                      <View style={[
                        styles.overlayFooter,
                        // RTL support: mirror footer positioning
                        isRTL ? {
                          flexDirection: 'row-reverse', // Mirror layout for RTL
                        } : {}
                      ]}>
                        <View style={styles.footerLeft}>
                          {message.isPinned && (
                            <Pin size={12} color="#FFFFFF" style={styles.pinIcon} />
                          )}
                          {isStarredByCurrentUser && (
                            <Star size={12} color="#FFD700" style={styles.starIcon} fill="#FFD700" />
                          )}
                          <Text 
                            numberOfLines={1}
                            style={[...asTextStyle(styles.timeText), { color: '#FFFFFF' }]}
                          >
                            {formatTime(message.createdAt)}
                          </Text>
                        </View>
                        {isOwnMessage && (
                          <View style={styles.statusIcon}>
                            <MessageStatusIndicator message={message} isOwnMessage={isOwnMessage} isMedia={true} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              {message.text && (
                <Text style={[...asTextStyle(styles.imageCaptionText), { color: isOwnMessage ? '#000000' : theme.textPrimary }]}>
                  {message.text}
                </Text>
              )}
            </>
          )}
        </View>
      );
    }

    // Image message (including GIFs)
    if (message.type === 'IMAGE' || message.type === 'image') {
      // Detect if it's a GIF (check URL extension or message text)
      const isGif = message.attachments?.[0]?.toLowerCase().endsWith('.gif') ||
                    message.attachments?.[0]?.includes('.gif') ||
                    message.text?.startsWith('GIF:') ||
                    message.attachments?.[0]?.includes('giphy.com') ||
                    message.attachments?.[0]?.includes('media.giphy.com');
      
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
              {/* ✅ MODERN 2025: Animated media card with glass overlay */}
              <Animated.View entering={FadeIn.duration(300)}>
                <TouchableOpacity 
                  onPress={() => setShowFullImage(true)} 
                  onLongPress={handleLongPress}
                  delayLongPress={500}
                  activeOpacity={0.9} 
                  style={styles.imageWrapper}
                >
                  {/* ✅ MODERN 2025: expo-image with transition */}
                  <ExpoImage
                    source={{ uri: message.attachments?.[0] }}
                    style={asImageStyle(styles.messageImage)}
                    contentFit="cover"
                    transition={300}
                    onLoadStart={() => setImageLoading(true)}
                    onLoad={() => setImageLoading(false)}
                    // Placeholder can be added here if blurhash is available
                  />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                {/* Zoom overlay indicator */}
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
                  {/* ✅ MODERN 2025: Glass overlay with gradient for timestamps */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.mediaOverlay}
                  >
                      {/* Overlay footer: timestamp + checkmarks (WhatsApp-style) */}
                      <View style={[
                        styles.overlayFooter,
                        // RTL support: mirror footer positioning
                        isRTL ? {
                          flexDirection: 'row-reverse', // Mirror layout for RTL
                        } : {}
                      ]}>
                  <View style={styles.footerLeft}>
                    {message.isPinned && (
                      <Pin size={12} color="#FFFFFF" style={styles.pinIcon} />
                    )}
                    {isStarredByCurrentUser && (
                      <Star size={12} color="#FFD700" style={styles.starIcon} fill="#FFD700" />
                    )}
                    <Text 
                      numberOfLines={1}
                      style={[
                        ...asTextStyle(styles.timeText), 
                        { color: '#FFFFFF' },
                        // Remove shadow for sender messages in media overlay
                        isOwnMessage && {
                          textShadowColor: 'transparent',
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: 0,
                        },
                      ]}
                    >
                      {formatTime(message.createdAt)}
                    </Text>
                  </View>
                  {isOwnMessage && (
                    <View style={styles.statusIcon}>
                      <MessageStatusIndicator message={message} isOwnMessage={isOwnMessage} isMedia={true} />
                    </View>
                  )}
                </View>
                </LinearGradient>
              </TouchableOpacity>
              </Animated.View>
              {message.text && (
                <Text style={[...asTextStyle(styles.imageCaptionText), { color: isOwnMessage ? '#000000' : theme.textPrimary }]}>
                  {message.text}
                </Text>
              )}
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
              <TouchableOpacity
                style={styles.fileContent}
                onPress={() => {
                  // Check if file is PDF or DOC/DOCX
                  const fileName = message.fileMetadata?.originalName || message.attachments?.[0] || '';
                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                  if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
                    setShowDocumentViewer(true);
                  } else {
                    handleDownload();
                  }
                }}
                activeOpacity={0.7}
              >
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
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  style={styles.downloadButton}
                >
                  <Download size={20} color={isOwnMessage ? '#000000' : theme.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={styles.messageFooter}>
                <View style={styles.footerLeft}>
                  {message.isPinned && (
                    <Pin size={12} color={isOwnMessage ? 'rgba(0,0,0,0.4)' : theme.textSecondary} style={styles.pinIcon} />
                  )}
                  {isStarredByCurrentUser && (
                    <Star size={12} color="#FFD700" style={styles.starIcon} fill="#FFD700" />
                  )}
                  <Text 
                    numberOfLines={1}
                    style={[...asTextStyle(styles.timeText), { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}
                  >
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
                {isOwnMessage && (
                  <View style={styles.statusIcon}>
                    <MessageStatusIndicator message={message} isOwnMessage={isOwnMessage} />
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
          {onPin && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={handlePin}>
              {message.isPinned ? (
                <>
                  <PinOff size={20} color={theme.primary} />
                  <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
                    {isRTL ? 'إلغاء التثبيت' : 'Unpin'}
                  </Text>
                </>
              ) : (
                <>
                  <Pin size={20} color={theme.primary} />
                  <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
                    {isRTL ? 'تثبيت' : 'Pin'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {onStar && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={handleStar}>
              {isStarredByCurrentUser ? (
                <>
                  <StarOff size={20} color="#FFD700" />
                  <Text style={[...asTextStyle(styles.menuText), { color: '#FFD700' }]}>
                    {isRTL ? 'إلغاء التميز' : 'Unstar'}
                  </Text>
                </>
              ) : (
                <>
                  <Star size={20} color="#FFD700" />
                  <Text style={[...asTextStyle(styles.menuText), { color: '#FFD700' }]}>
                    {isRTL ? 'تميز' : 'Star'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {onCopy && message.text && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              onCopy(message);
            }}>
              <Copy size={20} color={theme.primary} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
                {isRTL ? 'نسخ' : 'Copy'}
              </Text>
            </TouchableOpacity>
          )}
          {onReply && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              onReply(message);
            }}>
              <Reply size={20} color={theme.primary} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
                {isRTL ? 'رد' : 'Reply'}
              </Text>
            </TouchableOpacity>
          )}
          {onQuote && message.text && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              onQuote(message);
            }}>
              <Quote size={20} color={theme.primary} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
                {isRTL ? 'اقتباس' : 'Quote'}
              </Text>
            </TouchableOpacity>
          )}
          {onReaction && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              setShowReactionPicker(true);
            }}>
              <Smile size={20} color={theme.primary} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
                {isRTL ? 'تفاعل' : 'React'}
              </Text>
            </TouchableOpacity>
          )}
          {onForward && !message.deletedAt && (
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              onForward(message);
            }}>
              <Forward size={20} color={theme.primary} />
              <Text style={[...asTextStyle(styles.menuText), { color: theme.primary }]}>
                {isRTL ? 'إعادة توجيه' : 'Forward'}
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

  // ✅ ABSOLUTE FIX: Hard separation between TextBubble and MediaBubble
  // Media messages render directly without messageBubble wrapper (prevents background wrapping)
  const isMediaMessage = message.type === 'IMAGE' || message.type === 'VIDEO' || message.type === 'image' || message.type === 'video';

  return (
    <>
      <TouchableOpacity
        onPress={isSelectionMode ? handlePress : undefined}
        onLongPress={handleLongPress}
        delayLongPress={isSelectionMode ? 0 : 500}
        style={[
          styles.messageContainer,
          // RTL alignment: In RTL, own messages go left, other messages go right (opposite of LTR)
          isOwnMessage 
            ? (isRTL ? { alignSelf: 'flex-start' } : styles.ownMessage) // In RTL, own messages go left
            : (isRTL ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }), // In RTL, other messages go right
          isSelectionMode && styles.selectionContainer,
          isSelected && { backgroundColor: theme.primary + '20', borderRadius: 8 },
          // ✅ FINAL SURGICAL PATCH: Ensure container has transparent background for media
          isMediaMessage && {
            backgroundColor: 'transparent', // Kill green wrap at source
            padding: 0, // No padding that could show background
          },
        ].filter(Boolean)}
        activeOpacity={0.98} // Subtle press feedback - WhatsApp-like
      >
        {isSelectionMode && (
          <View style={styles.selectionCheckbox}>
            {isSelected ? (
              <CheckCircle size={24} color={theme.primary} fill={theme.primary} />
            ) : (
              <Circle size={24} color={theme.border} />
            )}
          </View>
        )}
        {/* ✅ FINAL SURGICAL PATCH: Media messages BYPASS all wrappers completely */}
        {isMediaMessage ? (
          // ✅ Early-return renderer: Media messages bypass messageBubble entirely
          // ✅ NO wrapper with backgroundColor/padding/maxWidth
          // ✅ renderMessageContent() for media returns self-contained MediaTile
          <View style={{ 
            backgroundColor: 'transparent', // Absolute: no colored wrap
            padding: 0, // Zero padding (padding on clipping node causes visible side color)
            borderRadius: 0, // No radius here - media container handles it
            margin: 0, // No margin that could show background
          }}>
            {renderMessageContent()}
          </View>
        ) : (
          <View
            style={[
              styles.messageBubbleWrapper,
              {
                alignSelf: isOwnMessage 
                  ? (isRTL ? 'flex-start' : 'flex-end') 
                  : (isRTL ? 'flex-end' : 'flex-start'),
              },
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                {
                  backgroundColor: isOwnMessage ? theme.primary : theme.surface, // Text bubbles only
                  opacity: isSelectionMode && !isSelected ? 0.6 : 1,
                  // Add padding based on message type for reaction button space
                  ...(isOwnMessage ? {
                    paddingLeft: 32, // Extra left padding for sender reaction button space
                    paddingRight: 12, // Right padding
                  } : {
                    paddingRight: 32, // Extra right padding for receiver reaction button space
                    paddingLeft: 12, // Left padding
                  }),
                  // Flip border radius for RTL: swap bottom-left and bottom-right
                  ...(isRTL && isOwnMessage ? {
                    borderBottomLeftRadius: 4, // Tail on left in RTL
                    borderBottomRightRadius: 20, // Rounded on right in RTL
                  } : {}),
                  ...(isRTL && !isOwnMessage ? {
                    borderBottomLeftRadius: 20, // Rounded on left in RTL
                    borderBottomRightRadius: 4, // Tail on right in RTL
                  } : {}),
                },
              ]}
            >
              {renderMessageContent()}
            </View>
            
            {/* ✅ MODERN 2025: Animated reaction bar with pill buttons */}
            {/* Wrap in regular View to avoid Reanimated transform conflict */}
            <View
              style={[
                styles.reactionsContainer,
                !isOwnMessage && styles.reactionsContainerRight,
              ]}
            >
              <Animated.View entering={FadeInDown.delay(100).duration(250)}>
                {/* Check if current user has reacted - show only their reaction OR the reaction icon, not both */}
                {(() => {
                  const currentUserReaction = message.reactions && currentUserId 
                    ? message.reactions[currentUserId] 
                    : null;
                  const userReactions = currentUserReaction 
                    ? (Array.isArray(currentUserReaction) ? currentUserReaction : [currentUserReaction])
                    : [];
                  
                  // If user has reacted, show only their reaction (not the reaction icon)
                  if (userReactions.length > 0) {
                    return (
                      <Pressable
                        style={({ pressed }) => [
                          styles.reactionPill,
                          styles.reactionPillEmoji,
                          {
                            backgroundColor: pressed 
                              ? 'rgba(255,255,255,0.15)' 
                              : 'rgba(255,255,255,0.1)',
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                          },
                        ]}
                        onPress={() => {
                          if (onReaction && chatId) {
                            onReaction(message);
                          }
                        }}
                      >
                        {userReactions.map((emoji: string, index: number) => (
                          <Text key={`${currentUserId}-${index}`} style={styles.reactionEmoji}>{emoji}</Text>
                        ))}
                      </Pressable>
                    );
                  }
                  
                  // If user hasn't reacted, show only the reaction icon
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.reactionPill,
                        {
                          backgroundColor: pressed 
                            ? 'rgba(255,255,255,0.15)' 
                            : 'rgba(255,255,255,0.1)',
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        },
                      ]}
                      onPress={() => {
                        if (onReaction && chatId) {
                          setShowReactionPicker(true);
                        }
                      }}
                    >
                      <Smile 
                        size={16} 
                        color={theme.textSecondary} 
                        strokeWidth={2}
                      />
                    </Pressable>
                  );
                })()}
              </Animated.View>
            </View>
          </View>
        )}
      </TouchableOpacity>
      {renderMessageMenu()}
      
      {/* Reaction Picker */}
      {showReactionPicker && chatId && (
        <ReactionPicker
          visible={showReactionPicker}
          onClose={() => setShowReactionPicker(false)}
          onSelectReaction={(messageId, emoji) => {
            if (onReaction) {
              onReaction({ ...message, selectedEmoji: emoji });
            }
            setShowReactionPicker(false);
          }}
          messageId={message.id}
        />
      )}
      {(message.type === 'IMAGE' || message.type === 'image') && renderFullImageModal()}
      
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

      {/* Document Viewer Modal */}
      {showDocumentViewer && message.attachments && message.attachments[0] && (
        <DocumentViewer
          visible={showDocumentViewer}
          onClose={() => setShowDocumentViewer(false)}
          fileUrl={message.attachments[0]}
          fileName={message.fileMetadata?.originalName || 'Document'}
          fileType={
            (() => {
              const fileName = message.fileMetadata?.originalName || message.attachments[0] || '';
              const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
              if (fileExtension === 'pdf') return 'pdf';
              if (fileExtension === 'doc' || fileExtension === 'docx') return 'doc';
              return 'pdf'; // Default to PDF
            })()
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 3, // Reduced to 3px spacing between bubbles
    marginHorizontal: 8, // ✅ MASTER FIX: Increased to industry standard minimum (8-12px range)
    // Changed from 7.68px to 8px for better visual spacing and professional appearance
    // Industry standard: WhatsApp (8-12px), Telegram (8-12px), iMessage (8-12px)
    maxWidth: '85%', // Maximum width - use percentage to prevent overflow off screen
    alignSelf: 'flex-start', // Size to content width
    // TODO: Add 10-14px spacing between different senders if sender grouping exists
  },
  ownMessage: {
    alignSelf: 'flex-end',
    maxWidth: '85%', // Ensure sender messages don't overflow off screen
  },
  messageBubbleWrapper: {
    position: 'relative', // For absolute positioning of reactions
    maxWidth: '100%', // Use full width of container
    minWidth: 100, // COMMENT: FIX - Increased minimum width to match messageBubble
    alignSelf: 'flex-start', // Size to content width (default, will be overridden per message)
    width: '100%', // Take full width of messageContainer
  },
  messageBubble: {
    // ✅ LAYERED ARCHITECTURE: Bubble (container/field) adapts to text content
    paddingVertical: 8, // Consistent vertical padding
    paddingHorizontal: 12, // Comfortable horizontal padding
    paddingBottom: 8, // ✅ MASTER FIX: Reduced paddingBottom - text content now has marginBottom: 20 to create space
    // Footer is absolutely positioned, so paddingBottom doesn't affect footer position
    // Text content marginBottom ensures footer never overlaps text
    paddingTop: 8, // Top padding
    paddingLeft: 32, // Extra left padding for sender reaction button space (will be overridden)
    paddingRight: 12, // Default right padding (will be overridden for receiver)
    elevation: 1, // Subtle elevation (WhatsApp-like)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 0, // No border for cleaner look
    flexWrap: 'wrap', // Allow text to wrap to new lines
    overflow: 'hidden', // Hide overflow to keep footer inside bubble
    minWidth: 100, // COMMENT: FIX - Increased minimum width to prevent time/checkmarks overlap in short messages
    maxWidth: '100%', // ✅ MASTER FIX: Inherit from parent (messageBubbleWrapper) which inherits from messageContainer (85%)
    // Changed from absolute 300px to percentage for responsive alignment across all screen sizes
    alignSelf: 'flex-start', // Size to content width
    position: 'relative', // ✅ LAYERED ARCHITECTURE: Relative positioning for footer layer (time + checkmarks)
    // Footer layer adapts to bubble size and positions in corners
  },
  ownMessageBubble: {
    // Own messages (sent): 3 corners rounded (top-left, top-right, bottom-left)
    borderTopLeftRadius: 12.8, // Further reduced by 20% from 16 (16 * 0.8 = 12.8)
    borderTopRightRadius: 12.8, // Further reduced by 20% from 16 (16 * 0.8 = 12.8)
    borderBottomLeftRadius: 12.8, // Further reduced by 20% from 16 (16 * 0.8 = 12.8)
    borderBottomRightRadius: 2.56, // Further reduced by 20% from 3.2 (3.2 * 0.8 = 2.56)
  },
  otherMessageBubble: {
    // Other messages (received): 3 corners rounded (top-left, top-right, bottom-right)
    borderTopLeftRadius: 12.8, // Further reduced by 20% from 16 (16 * 0.8 = 12.8)
    borderTopRightRadius: 12.8, // Further reduced by 20% from 16 (16 * 0.8 = 12.8)
    borderBottomLeftRadius: 2.56, // Further reduced by 20% from 3.2 (3.2 * 0.8 = 2.56)
    borderBottomRightRadius: 12.8, // Further reduced by 20% from 16 (16 * 0.8 = 12.8)
  },
  messageText: {
    fontSize: 11, // Slightly increased from 9.6 to 11
    lineHeight: 14.85, // fontSize * 1.35 = 11 * 1.35 = 14.85
    letterSpacing: 0.15,
    marginBottom: 6, // Spacing between paragraphs (for multi-paragraph text)
    // ✅ MASTER FIX: Additional bottom margin added inline to prevent footer overlap
    // Text wraps naturally when constrained by maxWidth
  },
  // ✅ MODERN 2025: Voice message with horizontal pill layout
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24, // Pill shape
    backgroundColor: 'rgba(255,255,255,0.08)', // Glassmorphism
    minWidth: 200,
    maxWidth: '85%',
  },
  voicePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  voiceTrack: {
    flex: 1,
    height: 32,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  voiceGradientTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 16,
  },
  voiceWaveform: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  waveformBarModern: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 4,
  },
  voiceTimer: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    letterSpacing: 0.5,
  },
  videoContainer: {
    // ✅ MODERN 2025 DESIGN: Self-contained MediaTile with modern styling
    width: '100%', // Fill available width of parent (messageContainer which has maxWidth: '85%')
    // ✅ MASTER FIX: Removed redundant maxWidth - inherits from messageContainer (85%)
    // Parent already constrains width, so child just needs to fill parent
    position: 'relative',
    borderRadius: 16, // Modern rounded corners
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginVertical: 2, // Subtle spacing
    marginHorizontal: 0, // Inherits horizontal margin from messageContainer
    padding: 0, // ✅ CRITICAL: No padding on clipping node
    // Modern shadow for depth
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 250, // Prevent collapse
    maxHeight: 400, // Prevent overly tall videos
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    minHeight: 250,
    maxHeight: 400,
    position: 'relative',
    justifyContent: 'flex-end', // Align overlay footer to bottom
    borderRadius: 16, // Match container
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)', // Subtle background while loading
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }], // Center 56px button
    width: 56, // Modern larger play button
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.65)', // Modern semi-transparent
    justifyContent: 'center',
    alignItems: 'center',
    // Modern shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 10,
  },
  videoDuration: {
    position: 'absolute',
    top: 12, // Top left for modern apps (was bottom right)
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.65)', // Modern semi-transparent
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20, // Rounded pill shape
    zIndex: 10,
    // Modern shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600', // Bolder for modern look
    letterSpacing: 0.5, // Modern letter spacing
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
    // ✅ LAYERED ARCHITECTURE: Footer layer (time + checkmarks) adapts to bubble size
    position: 'absolute', // Absolutely positioned relative to messageBubble (parent container)
    bottom: 4, // 4px from bottom of bubble
    // ✅ LAYERED ARCHITECTURE: Footer adapts to bubble width - spans from left to right edges
    // Footer width = bubble width - 24px (12px left + 12px right)
    // This ensures footer adapts to bubble size automatically
    left: 12, // ✅ ADAPTS TO BUBBLE: 12px from left edge of bubble
    right: 12, // ✅ ADAPTS TO BUBBLE: 12px from right edge of bubble
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ✅ LAYERED ARCHITECTURE: Time on left corner, checkmarks on right corner
    gap: 6, // Spacing between time and status icon
    minWidth: 0, // Allow shrinking below content size
    maxWidth: '100%', // ✅ ADAPTS TO BUBBLE: Footer never exceeds bubble width
    paddingHorizontal: 0, // Remove extra padding
    flexShrink: 0, // ✅ LAYERED ARCHITECTURE: Don't shrink - maintain corner positions
    flexWrap: 'nowrap', // ✅ LAYERED ARCHITECTURE: Prevent wrapping - keep in single line
    zIndex: 10, // ✅ LAYERED ARCHITECTURE: Higher z-index - footer layer above text layer
    minHeight: 18, // Minimum height to prevent overlap
    pointerEvents: 'none', // ✅ LAYERED ARCHITECTURE: Allow text selection through footer area
    // ✅ LAYERED ARCHITECTURE: Footer layer adapts to bubble, positioned in corners
    // Time and checkmarks both have functions (interactive) but layer adapts to bubble
  },
  mediaFooter: {
    // Legacy footer style - kept for compatibility
    position: 'absolute',
    bottom: 6,
    right: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayFooter: {
    // ✅ MODERN 2025: Instagram/Telegram-style overlay footer
    position: 'absolute',
    bottom: 10, // More spacing from edge (modern apps)
    right: 10, // More spacing from edge (modern apps)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Right-align content
    // Modern glassmorphism-style background
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
    borderRadius: 20, // Rounded pill shape
    paddingHorizontal: 8, // Horizontal padding
    paddingVertical: 4, // Vertical padding
    gap: 4, // Modern spacing between elements
    // Modern shadow for depth
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Ensure it stays inside media boundaries
    maxWidth: '90%', // Prevent overflow on very long timestamps
  },
  footerLeft: {
    // ✅ LAYERED ARCHITECTURE: Time container - sticks to left corner of footer layer
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 'auto', // ✅ LAYERED ARCHITECTURE: Always push to left corner (opposite from checkmarks)
    flexShrink: 0, // ✅ LAYERED ARCHITECTURE: Don't shrink - maintain position at left corner
    minWidth: 0, // Allow shrinking below content size
    maxWidth: '60%', // ✅ LAYERED ARCHITECTURE: Reduced to ensure time stays on left, leaves room for checkmarks on right
    pointerEvents: 'auto', // ✅ LAYERED ARCHITECTURE: Time has function (interactive) - allow interaction
    flexWrap: 'nowrap', // ✅ LAYERED ARCHITECTURE: Prevent wrapping - keep time on single line
  },
  pinIcon: {
    marginRight: 2,
  },
  starIcon: {
    marginRight: 2,
  },
  timeText: {
    fontSize: 8.8, // Reduced by 20% from 11 (11 * 0.8 = 8.8)
    fontWeight: '500', // Medium weight for better visibility
    // Text shadow for readability over bright media
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexShrink: 0, // ✅ MASTER FIX: Don't shrink - keep time on single line
    minWidth: 0, // Allow shrinking below content size
    // ✅ MASTER FIX: Prevent text wrapping - keep "8:33 PM" on one line
    flexWrap: 'nowrap', // Prevent wrapping
  },
  statusIcon: {
    // ✅ LAYERED ARCHITECTURE: Checkmarks container - sticks to right corner of footer layer
    marginLeft: 'auto', // ✅ LAYERED ARCHITECTURE: Push to right edge (opposite corner from time)
    flexShrink: 0, // ✅ LAYERED ARCHITECTURE: Keep checkmarks visible, don't shrink them
    maxWidth: 24, // Constrain status icon width to prevent overflow
    minWidth: 20, // Minimum width for checkmarks
    pointerEvents: 'auto', // ✅ LAYERED ARCHITECTURE: Checkmarks have function (interactive) - allow interaction
  },
  statusIconButton: {
    padding: 2,
  },
  retryButton: {
    padding: 2,
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
    // ✅ MODERN 2025 DESIGN: Self-contained MediaTile with modern styling
    width: '100%', // Fill available width of parent (messageContainer which has maxWidth: '85%')
    // ✅ MASTER FIX: Removed redundant maxWidth - inherits from messageContainer (85%)
    // Parent already constrains width, so child just needs to fill parent
    position: 'relative', // For absolute positioning of overlays
    borderRadius: 16, // ✅ Modern rounded corners (16px instead of 20px)
    overflow: 'hidden', // Clip media to rounded corners
    marginVertical: 2, // Subtle spacing between messages
    marginHorizontal: 0, // Inherits horizontal margin from messageContainer
    // ✅ CRITICAL: NO PADDING on this node (padding on clipping node causes visible side color)
    padding: 0,
    // Modern shadow for depth
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: 'transparent',
  },
  imageWrapper: {
    width: '100%',
    position: 'relative', // For absolute positioning of overlay footer and image
    overflow: 'hidden', // Clip to rounded corners
    // Modern aspect ratio - maintain square by default, but flexible
    aspectRatio: 1, // Default square for images (can override if metadata available)
    minHeight: 250, // Modern minimum height
    maxHeight: 400, // Prevent overly tall images
    justifyContent: 'flex-end', // Align overlay footer to bottom
    borderRadius: 16, // Match container
  },
  messageImage: {
    width: '100%',
    height: '100%', // Fill container height
    // Use absolute positioning to ensure image fills entire wrapper
    position: 'absolute', // Fill container absolutely
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16, // Match container radius
    // Modern image rendering
    backgroundColor: 'rgba(0,0,0,0.05)', // Subtle background while loading
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)', // Lighter overlay - modern
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    // Modern backdrop blur effect placeholder
  },
  imageDownloadButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)', // Modern semi-transparent
    borderRadius: 24, // Larger, more modern
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // Modern touch feedback
    zIndex: 10,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12, // Move to left for modern apps
    backgroundColor: 'rgba(0,0,0,0.65)', // Modern semi-transparent
    borderRadius: 24, // Larger, more modern
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
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
    marginTop: 0.5,
    marginLeft: 0.5,
    marginRight: 0.5,
    marginBottom: 0, // 0.5px on all sides except bottom
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  selectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  selectionCheckbox: {
    marginRight: 8,
    padding: 4,
  },
  reactionsContainer: {
    position: 'absolute', // Position relative to bubble wrapper
    left: -12, // COMMENT: FIX - Slightly more offset to prevent overlap with bubble
    top: '50%', // Position at vertical middle
    transform: [{ translateY: -10 }], // Center vertically (half of typical button height)
    alignItems: 'center', // Center align items
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4, // Reduced gap between reaction icons
    zIndex: 10, // COMMENT: FIX - Ensure reactions appear above other elements
  },
  reactionsContainerRight: {
    left: 'auto', // Remove left positioning
    right: -12, // COMMENT: FIX - Slightly more offset to prevent overlap with bubble
    // top: '50%', transform already set in base style for vertical centering
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reactionEmojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6, // Reduced padding
    paddingVertical: 3, // Reduced padding
    borderRadius: 12, // Smaller radius for smaller container
    borderWidth: 1,
    gap: 2, // Reduced gap between emojis in container
  },
  reactionEmoji: {
    // ✅ ENHANCED: Better emoji display in reaction pills
    fontSize: 14, // Slightly larger for better visibility
    lineHeight: 18, // Proper line height for emoji
    includeFontPadding: false, // Remove extra padding for cleaner look
  },
  addReactionButton: {
    width: 20, // Reduced from 28 to 20
    height: 20, // Reduced from 28 to 20
    borderRadius: 10, // Half of width/height
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addReactionButtonSingle: {
    position: 'absolute', // Position relative to bubble wrapper
    left: -10, // Position at left edge for sender messages (half outside bubble - 10px overlap)
    top: '50%', // Position at vertical middle
    transform: [{ translateY: -10 }], // Center vertically (half of button height)
    justifyContent: 'center', // Center content
    alignItems: 'center', // Center align icon
    width: 20, // Reduced from 28 to 20
    height: 20, // Reduced from 28 to 20
    borderRadius: 10, // Half of width/height
    borderWidth: 1,
  },
  addReactionButtonSingleRight: {
    left: 'auto', // Remove left positioning
    right: -10, // Position at right edge (end) for receiver messages (half outside bubble - 10px overlap)
    // top: '50%', transform already set in base style for vertical centering
  },
  reactionPill: {
    // ✅ ENHANCED: Modern reaction pill button with professional styling
    width: 28, // Optimal size for touch target (icon button)
    height: 28, // Optimal size for touch target
    borderRadius: 14, // Perfect circle (half of width/height)
    justifyContent: 'center',
    alignItems: 'center',
    // ✅ Modern glassmorphism effect
    backgroundColor: 'rgba(255,255,255,0.1)', // Semi-transparent white
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Subtle border for depth
    // ✅ Modern shadow for depth and elevation
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // ✅ Smooth transitions
    transition: 'all 0.2s ease',
  },
  reactionPillEmoji: {
    // ✅ ENHANCED: Flexible width for emoji pills to accommodate multiple emojis
    width: 'auto', // Override fixed width - adapt to content
    minWidth: 28, // Minimum size for touch target
    height: 28, // Fixed height for consistency
    borderRadius: 14, // Rounded pill shape
    paddingHorizontal: 8, // Horizontal padding for emojis
    paddingVertical: 4, // Vertical padding for emojis
    flexDirection: 'row', // ✅ ENHANCED: Row layout for multiple emojis
    gap: 2, // ✅ ENHANCED: Small gap between emojis
  },
  addReactionText: {
    fontSize: 12, // Reduced from 18 to 12 to match smaller button
    fontWeight: '600',
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

// ✅ FINAL SURGICAL PATCH: Hard assertions to prevent regressions (dev only)
if (__DEV__) {
  const err = (node: any, hint: string) => console.warn('[MediaTile]', hint, node);
  
  // Assert no padding on media containers (padding must not be on same node as overflow:hidden)
  // @ts-ignore
  const vc = styles.videoContainer as any;
  if (vc?.padding || vc?.paddingHorizontal || vc?.paddingVertical) {
    err(vc, 'Padding on videoContainer is forbidden (padding on clipping node causes visible side color).');
  }
  // @ts-ignore
  const ic = styles.imageContainer as any;
  if (ic?.padding || ic?.paddingHorizontal || ic?.paddingVertical) {
    err(ic, 'Padding on imageContainer is forbidden (padding on clipping node causes visible side color).');
  }
  
  // Assert transparent backgrounds on media containers
  if (vc?.backgroundColor && vc.backgroundColor !== 'transparent') {
    err(vc, 'videoContainer must have transparent background (no colored wrap).');
  }
  if (ic?.backgroundColor && ic.backgroundColor !== 'transparent') {
    err(ic, 'imageContainer must have transparent background (no colored wrap).');
  }
  
  // ✅ Binary QA: Assert minHeight to prevent collapse
  if (vc?.minHeight && vc.minHeight < 250) {
    err(vc, 'videoContainer minHeight must be >= 250dp (prevents collapse before load).');
  }
  if (ic?.minHeight && ic.minHeight < 160) {
    err(ic, 'imageContainer minHeight must be >= 160dp (prevents collapse before load).');
  }
  
  // ✅ MASTER FIX: Updated assertion - videoContainer should use width: '100%' to inherit from parent
  // Removed outdated assertion about fixed 250px width
  if (vc?.width && vc.width !== '100%') {
    err(vc, 'videoContainer should use width: 100% to inherit from messageContainer');
  }
  // ✅ MASTER FIX: Updated assertion - media containers should NOT have maxWidth
  // They should inherit from messageContainer (85%) via width: '100%'
  if (ic?.maxWidth) {
    err(ic, 'imageContainer should NOT have maxWidth - inherit from messageContainer via width: 100%');
  }
  if (vc?.maxWidth) {
    err(vc, 'videoContainer should NOT have maxWidth - inherit from messageContainer via width: 100%');
  }
}





