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
            <LinkPreview preview={linkPreview} isOwnMessage={isOwnMessage} />
          )}
          {message.editedAt && (
            <View style={styles.editedBadge}>
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
              flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row',
              justifyContent: textDirection === 'rtl' ? 'flex-start' : 'flex-end',
              // Adjust positioning based on message type and reaction button
              ...(isOwnMessage ? {
                left: 32, // Account for reaction button space on left
                right: 12, // Standard right padding
              } : {
                right: 32, // Account for reaction button space on right
                left: 12, // Standard left padding
              }),
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
              <Text style={[
                ...asTextStyle(styles.timeText), 
                { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary },
                // Remove shadow for sender messages
                isOwnMessage && {
                  textShadowColor: 'transparent',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 0,
                },
              ]}>
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
                          <Text style={[...asTextStyle(styles.timeText), { color: '#FFFFFF' }]}>
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
                    <Text style={[
                      ...asTextStyle(styles.timeText), 
                      { color: '#FFFFFF' },
                      // Remove shadow for sender messages in media overlay
                      isOwnMessage && {
                        textShadowColor: 'transparent',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 0,
                      },
                    ]}>
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
                <View style={styles.footerLeft}>
                  {message.isPinned && (
                    <Pin size={12} color={isOwnMessage ? 'rgba(0,0,0,0.4)' : theme.textSecondary} style={styles.pinIcon} />
                  )}
                  {isStarredByCurrentUser && (
                    <Star size={12} color="#FFD700" style={styles.starIcon} fill="#FFD700" />
                  )}
                  <Text style={[...asTextStyle(styles.timeText), { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary }]}>
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
            <Animated.View
              entering={FadeInDown.delay(100).duration(250)}
              style={[
                styles.reactionsContainer,
                !isOwnMessage && styles.reactionsContainerRight,
              ]}
            >
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <>
                  {Object.entries(message.reactions).map(([userId, emojis]: [string, any]) => {
                    const userReactions = Array.isArray(emojis) ? emojis : [];
                    return (
                      <View key={userId}>
                        <Pressable
                          style={[styles.reactionPill, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                          onPress={() => {
                            if (onReaction && chatId) {
                              onReaction(message);
                            }
                          }}
                        >
                          {userReactions.map((emoji: string, index: number) => (
                            <Text key={`${userId}-${index}`} style={styles.reactionEmoji}>{emoji}</Text>
                          ))}
                        </Pressable>
                      </View>
                    );
                  })}
                </>
              )}
              {/* Add reaction button */}
              <View>
                <Pressable
                  style={[styles.reactionPill, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                  onPress={() => {
                    setShowReactionPicker(true);
                  }}
                >
                  <Text style={[styles.addReactionText, { color: theme.textSecondary }]}>+</Text>
                </Pressable>
              </View>
            </Animated.View>
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
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 3, // Reduced to 3px spacing between bubbles
    marginHorizontal: 7.68, // Further reduced by 20% from 9.6 (9.6 * 0.8 = 7.68)
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
    minWidth: 50, // Minimum width to prevent too small bubbles
    alignSelf: 'flex-start', // Size to content width (default, will be overridden per message)
    width: '100%', // Take full width of messageContainer
  },
  messageBubble: {
    paddingVertical: 8, // Consistent vertical padding
    paddingHorizontal: 12, // Comfortable horizontal padding
    paddingBottom: 16, // Extra bottom padding to make room for footer
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
    minWidth: 50, // Minimum width to prevent too small bubbles
    maxWidth: 300, // Maximum width to prevent overflow
    alignSelf: 'flex-start', // Size to content width
    position: 'relative', // For absolute positioning of footer
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
    marginBottom: 6, // Spacing between paragraphs
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
    width: '100%',
    maxWidth: '85%', // Match image container (modern apps use 80-85%)
    position: 'relative',
    borderRadius: 16, // Modern rounded corners
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginVertical: 2, // Subtle spacing
    marginHorizontal: 0,
    padding: 0,
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
    position: 'absolute', // Position absolutely at bottom of bubble
    bottom: 4, // 4px from bottom of bubble
    right: 12, // 12px from right edge (adjust based on message type)
    left: 12, // 12px from left edge (adjust based on message type)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Right-align footer (LTR) or flex-start (RTL)
    gap: 4,
    minWidth: 0, // Allow shrinking below content size
    maxWidth: '100%', // Ensure footer doesn't exceed bubble width
    paddingHorizontal: 0, // Remove extra padding
    flexShrink: 1, // Allow footer to shrink if needed
    flexWrap: 'wrap', // Allow wrapping if content is too long
    zIndex: 1, // Ensure footer appears above content
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 'auto', // Push to left for incoming messages
    flexShrink: 1, // Allow shrinking to prevent overflow
    minWidth: 0, // Allow shrinking below content size
    maxWidth: '90%', // Constrain to prevent overflow (leave room for status icon)
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
    flexShrink: 1, // Allow text to shrink if needed
    minWidth: 0, // Allow shrinking below content size
  },
  statusIcon: {
    marginLeft: 4,
    flexShrink: 0, // Keep checkmarks visible, don't shrink them
    maxWidth: 24, // Constrain status icon width to prevent overflow
    minWidth: 20, // Minimum width for checkmarks
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
    width: '100%', // Fill available width
    maxWidth: '85%', // Modern chat apps use 80-85%
    position: 'relative', // For absolute positioning of overlays
    borderRadius: 16, // ✅ Modern rounded corners (16px instead of 20px)
    overflow: 'hidden', // Clip media to rounded corners
    marginVertical: 2, // Subtle spacing between messages
    marginHorizontal: 0,
    // ✅ CRITICAL: NO PADDING on this node
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
    left: -10, // Position at left edge for sender messages (half outside bubble - 10px overlap)
    top: '50%', // Position at vertical middle
    transform: [{ translateY: -10 }], // Center vertically (half of typical button height)
    alignItems: 'center', // Center align items
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4, // Reduced gap between reaction icons
  },
  reactionsContainerRight: {
    left: 'auto', // Remove left positioning
    right: -10, // Position at right edge (end) for receiver messages (half outside bubble - 10px overlap)
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
    fontSize: 12, // Reduced from 16 to 12
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
  
  // ✅ Binary QA: Assert width for proper sizing (fixed 250px)
  if (vc?.width && vc.width !== 250) {
    err(vc, 'videoContainer width should be 250px (fixed size).');
  }
  if (ic?.maxWidth && ic.maxWidth !== '80%' && ic.maxWidth !== '78%') {
    if (typeof ic.maxWidth === 'string' && !ic.maxWidth.match(/^7[5-9]%|8[0-9]%$/)) {
      err(ic, 'imageContainer maxWidth should be 75-80% (match chat width policy).');
    }
  }
}





