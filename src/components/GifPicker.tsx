/**
 * GIF Picker Component
 * 
 * Allows users to search for and select GIFs from Giphy API
 * Falls back to local file picker if API is not available
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GIF_SIZE = (SCREEN_WIDTH - 60) / 2; // 2 columns with padding

interface GifPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string, gifId?: string) => void;
  useGiphyAPI?: boolean;
  giphyApiKey?: string;
}

interface GifItem {
  id: string;
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
}

export function GifPicker({
  visible,
  onClose,
  onSelectGif,
  useGiphyAPI = false,
  giphyApiKey,
}: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  // Fetch trending GIFs from Giphy
  const fetchTrendingGifs = useCallback(async () => {
    if (!useGiphyAPI || !giphyApiKey) {
      logger.debug('Giphy API not configured, skipping fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${giphyApiKey}&limit=20&rating=g`
      );
      const data = await response.json();

      if (data.data) {
        const formattedGifs: GifItem[] = data.data.map((gif: any) => ({
          id: gif.id,
          url: gif.images.original.url,
          previewUrl: gif.images.fixed_height_small.url,
          width: gif.images.original.width,
          height: gif.images.original.height,
        }));
        setGifs(formattedGifs);
      }
    } catch (err: any) {
      logger.error('Error fetching trending GIFs:', err);
      setError(isRTL ? 'فشل تحميل GIFs' : 'Failed to load GIFs');
    } finally {
      setLoading(false);
    }
  }, [useGiphyAPI, giphyApiKey, isRTL]);

  // Search GIFs from Giphy
  const searchGifs = useCallback(async (query: string) => {
    if (!useGiphyAPI || !giphyApiKey || !query.trim()) {
      if (!query.trim()) {
        fetchTrendingGifs();
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();

      if (data.data) {
        const formattedGifs: GifItem[] = data.data.map((gif: any) => ({
          id: gif.id,
          url: gif.images.original.url,
          previewUrl: gif.images.fixed_height_small.url,
          width: gif.images.original.width,
          height: gif.images.original.height,
        }));
        setGifs(formattedGifs);
      }
    } catch (err: any) {
      logger.error('Error searching GIFs:', err);
      setError(isRTL ? 'فشل البحث عن GIFs' : 'Failed to search GIFs');
    } finally {
      setLoading(false);
    }
  }, [useGiphyAPI, giphyApiKey, isRTL, fetchTrendingGifs]);

  // Load trending GIFs on mount
  React.useEffect(() => {
    if (visible && useGiphyAPI && giphyApiKey) {
      fetchTrendingGifs();
    }
  }, [visible, useGiphyAPI, giphyApiKey, fetchTrendingGifs]);

  // Handle search with debounce
  React.useEffect(() => {
    if (!visible) return;

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchGifs(searchQuery);
      } else if (useGiphyAPI && giphyApiKey) {
        fetchTrendingGifs();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, visible, searchGifs, useGiphyAPI, giphyApiKey, fetchTrendingGifs]);

  const handleSelectGif = (gif: GifItem) => {
    onSelectGif(gif.url, gif.id);
    onClose();
    setSearchQuery('');
  };

  const renderGifItem = ({ item }: { item: GifItem }) => (
    <TouchableOpacity
      style={styles.gifItem}
      onPress={() => handleSelectGif(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.previewUrl || item.url }}
        style={styles.gifImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'اختر GIF' : 'Select GIF'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          {useGiphyAPI && giphyApiKey && (
            <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
              <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder={isRTL ? 'بحث...' : 'Search...'}
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
              />
            </View>
          )}

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {isRTL ? 'جاري التحميل...' : 'Loading...'}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              {!useGiphyAPI || !giphyApiKey ? (
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  {isRTL 
                    ? 'Giphy API غير مفعل. استخدم محدد الملفات لاختيار ملفات GIF محلية.'
                    : 'Giphy API not enabled. Use file picker to select local GIF files.'
                  }
                </Text>
              ) : null}
            </View>
          ) : gifs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {useGiphyAPI && giphyApiKey
                  ? (isRTL ? 'لا توجد نتائج' : 'No results')
                  : (isRTL ? 'Giphy API غير مفعل' : 'Giphy API not enabled')
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={gifs}
              renderItem={renderGifItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gifList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  gifList: {
    padding: 12,
    gap: 8,
  },
  gifItem: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
});







