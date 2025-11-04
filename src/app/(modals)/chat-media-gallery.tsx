/**
 * Chat Media Gallery Screen
 * 
 * COMMENT: FEATURE 6 - Chat Media Gallery
 * Purpose: Display all media messages (images, videos, files) in a chat with filtering and full-screen viewing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Download, Share2, Filter, Grid, List, X, Play, File } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { chatService, Message } from '@/services/chatService';
import { logger } from '@/utils/logger';
import { CustomAlertService } from '@/services/CustomAlertService';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from 'expo-av';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 2;
const GRID_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

type MediaType = 'all' | 'image' | 'video' | 'file';
type ViewMode = 'grid' | 'list';

interface MediaItem {
  id: string;
  messageId: string;
  type: 'IMAGE' | 'FILE' | 'VOICE' | 'video';
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: any;
  senderId: string;
}

export default function ChatMediaGalleryScreen() {
  const params = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<MediaType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);

  const chatId = params.chatId;

  useEffect(() => {
    if (chatId) {
      loadMediaMessages();
    }
  }, [chatId]);

  useEffect(() => {
    filterMedia();
  }, [selectedFilter, mediaItems]);

  const loadMediaMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      logger.debug('📸 Loading media messages for chat:', chatId);

      // Get all messages from chat
      // We need to get all messages (not paginated) to find media
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(messagesQuery);
      
      const allMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      // Filter media messages and extract media items
      const media: MediaItem[] = [];
      
      for (const message of allMessages) {
        // Skip deleted messages
        if (message.deletedAt) continue;

        if (message.type === 'IMAGE' && message.attachments && message.attachments.length > 0) {
          // Image messages
          message.attachments.forEach((url, index) => {
            media.push({
              id: `${message.id}_image_${index}`,
              messageId: message.id,
              type: 'IMAGE',
              url,
              thumbnailUrl: url,
              createdAt: message.createdAt,
              senderId: message.senderId,
            });
          });
        } else if ((message.type === 'video' || message.type === 'VIDEO') && message.attachments && message.attachments.length > 0) {
          // Video messages
          message.attachments.forEach((url, index) => {
            media.push({
              id: `${message.id}_video_${index}`,
              messageId: message.id,
              type: 'video',
              url,
              thumbnailUrl: message.thumbnailUrl || url,
              createdAt: message.createdAt,
              senderId: message.senderId,
            });
          });
        } else if (message.type === 'FILE' && message.attachments && message.attachments.length > 0) {
          // File messages
          message.attachments.forEach((url, index) => {
            media.push({
              id: `${message.id}_file_${index}`,
              messageId: message.id,
              type: 'FILE',
              url,
              fileName: message.fileMetadata?.originalName || `file_${index}`,
              fileSize: message.fileMetadata?.size || 0,
              createdAt: message.createdAt,
              senderId: message.senderId,
            });
          });
        } else if (message.type === 'VOICE' && message.attachments && message.attachments.length > 0) {
          // Voice messages
          message.attachments.forEach((url, index) => {
            media.push({
              id: `${message.id}_voice_${index}`,
              messageId: message.id,
              type: 'VOICE',
              url,
              createdAt: message.createdAt,
              senderId: message.senderId,
            });
          });
        }
      }

      // Sort by date (newest first)
      media.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || (typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime());
        const bTime = b.createdAt?.toMillis?.() || (typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime());
        return bTime - aTime;
      });

      setMediaItems(media);
      logger.debug(`📸 Loaded ${media.length} media items`);
    } catch (error) {
      logger.error('Error loading media messages:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تحميل الوسائط' : 'Failed to load media',
        isRTL
      );
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    if (selectedFilter === 'all') {
      setFilteredMedia(mediaItems);
    } else {
      const typeMap: Record<MediaType, string[]> = {
        all: [],
        image: ['IMAGE'],
        video: ['video', 'VIDEO'],
        file: ['FILE', 'VOICE'],
      };
      
      const allowedTypes = typeMap[selectedFilter];
      setFilteredMedia(mediaItems.filter(item => allowedTypes.includes(item.type)));
    }
  };

  const handleMediaPress = (item: MediaItem) => {
    setSelectedMedia(item);
    setFullScreenVisible(true);
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      if (Platform.OS === 'ios') {
        // Request media library permission
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'يجب منح إذن الوصول للمكتبة' : 'Media library permission required',
            isRTL
          );
          return;
        }
      }

      const fileUri = `${FileSystem.documentDirectory}${item.fileName || `media_${item.id}`}`;
      const downloadResult = await FileSystem.downloadAsync(item.url, fileUri);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await MediaLibrary.createAssetAsync(downloadResult.uri);
        
        CustomAlertService.showSuccess(
          isRTL ? 'نجح' : 'Success',
          isRTL ? 'تم حفظ الوسائط' : 'Media saved',
          isRTL
        );
      } else {
        CustomAlertService.showInfo(
          isRTL ? 'معلومات' : 'Info',
          isRTL ? 'تم تنزيل الوسائط' : 'Media downloaded',
          isRTL
        );
      }
    } catch (error) {
      logger.error('Error downloading media:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تنزيل الوسائط' : 'Failed to download media',
        isRTL
      );
    }
  };

  const handleShare = async (item: MediaItem) => {
    try {
      await Share.share({
        url: item.url,
        message: item.fileName || 'Shared media',
      });
    } catch (error) {
      logger.error('Error sharing media:', error);
    }
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => handleMediaPress(item)}
          activeOpacity={0.8}
        >
          {item.type === 'IMAGE' ? (
            <Image
              source={{ uri: item.url }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : item.type === 'video' || item.type === 'VIDEO' ? (
            <View style={styles.gridImageContainer}>
              <Image
                source={{ uri: item.thumbnailUrl || item.url }}
                style={styles.gridImage}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </View>
          ) : (
            <View style={[styles.gridImageContainer, { backgroundColor: theme.surface }]}>
              <File size={32} color={theme.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
      );
    } else {
      // List view
      return (
        <TouchableOpacity
          style={[styles.listItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
          onPress={() => handleMediaPress(item)}
          activeOpacity={0.7}
        >
          {item.type === 'IMAGE' ? (
            <Image
              source={{ uri: item.url }}
              style={styles.listThumbnail}
              resizeMode="cover"
            />
          ) : item.type === 'video' || item.type === 'VIDEO' ? (
            <View style={styles.listThumbnailContainer}>
              <Image
                source={{ uri: item.thumbnailUrl || item.url }}
                style={styles.listThumbnail}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </View>
          ) : (
            <View style={[styles.listThumbnail, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
              <File size={24} color={theme.textSecondary} />
            </View>
          )}
          <View style={styles.listInfo}>
            <Text style={[styles.listFileName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.fileName || (item.type === 'IMAGE' ? 'Image' : item.type === 'video' ? 'Video' : 'File')}
            </Text>
            {item.fileSize && item.fileSize > 0 && (
              <Text style={[styles.listFileSize, { color: theme.textSecondary }]}>
                {(item.fileSize / 1024 / 1024).toFixed(2)} MB
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderFullScreen = () => {
    if (!selectedMedia) return null;

    return (
      <Modal
        visible={fullScreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenVisible(false)}
      >
        <View style={styles.fullScreenContainer}>
          <Pressable
            style={styles.fullScreenBackdrop}
            onPress={() => setFullScreenVisible(false)}
          />
          <View style={styles.fullScreenContent}>
            {/* Header */}
            <View style={[styles.fullScreenHeader, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <TouchableOpacity
                onPress={() => setFullScreenVisible(false)}
                style={styles.fullScreenCloseButton}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.fullScreenActions}>
                <TouchableOpacity
                  onPress={() => handleDownload(selectedMedia)}
                  style={styles.fullScreenActionButton}
                >
                  <Download size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleShare(selectedMedia)}
                  style={styles.fullScreenActionButton}
                >
                  <Share2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Media Content */}
            <View style={styles.fullScreenMediaContainer}>
              {selectedMedia.type === 'IMAGE' ? (
                <Image
                  source={{ uri: selectedMedia.url }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              ) : selectedMedia.type === 'video' || selectedMedia.type === 'VIDEO' ? (
                <Video
                  source={{ uri: selectedMedia.url }}
                  style={styles.fullScreenVideo}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  useNativeControls
                />
              ) : (
                <View style={styles.fullScreenFileContainer}>
                  <File size={64} color={theme.textPrimary} />
                  <Text style={[styles.fullScreenFileName, { color: theme.textPrimary }]}>
                    {selectedMedia.fileName || 'File'}
                  </Text>
                  {selectedMedia.fileSize && selectedMedia.fileSize > 0 && (
                    <Text style={[styles.fullScreenFileSize, { color: theme.textSecondary }]}>
                      {(selectedMedia.fileSize / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.fullScreenDownloadButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleDownload(selectedMedia)}
                  >
                    <Download size={20} color="#000000" />
                    <Text style={[styles.fullScreenDownloadText, { color: '#000000' }]}>
                      {isRTL ? 'تنزيل' : 'Download'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'معرض الوسائط' : 'Media Gallery'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.headerActionButton}
          >
            {viewMode === 'grid' ? (
              <List size={20} color={theme.textPrimary} />
            ) : (
              <Grid size={20} color={theme.textPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: isRTL ? 'الكل' : 'All' },
            { key: 'image', label: isRTL ? 'صور' : 'Images' },
            { key: 'video', label: isRTL ? 'فيديو' : 'Videos' },
            { key: 'file', label: isRTL ? 'ملفات' : 'Files' },
          ]}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { backgroundColor: isSelected ? theme.primary : theme.background },
                ]}
                onPress={() => setSelectedFilter(item.key as MediaType)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    { color: isSelected ? '#000000' : theme.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterBarContent}
        />
      </View>

      {/* Media List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading media...'}
          </Text>
        </View>
      ) : filteredMedia.length === 0 ? (
        <View style={styles.emptyContainer}>
          <File size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {isRTL ? 'لا توجد وسائط' : 'No media found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedia}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? GRID_COLUMNS : 1}
          contentContainerStyle={styles.mediaListContent}
          key={viewMode} // Force re-render on view mode change
        />
      )}

      {renderFullScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  filterBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mediaListContent: {
    padding: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GRID_SPACING,
  },
  gridImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  listThumbnailContainer: {
    position: 'relative',
  },
  listThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listFileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listFileSize: {
    fontSize: 12,
  },
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullScreenContent: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fullScreenCloseButton: {
    padding: 8,
  },
  fullScreenActions: {
    flexDirection: 'row',
    gap: 16,
  },
  fullScreenActionButton: {
    padding: 8,
  },
  fullScreenMediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  fullScreenVideo: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  fullScreenFileContainer: {
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  fullScreenFileName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullScreenFileSize: {
    fontSize: 14,
  },
  fullScreenDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    marginTop: 16,
  },
  fullScreenDownloadText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

