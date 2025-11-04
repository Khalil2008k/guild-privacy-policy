/**
 * Chat Search Modal Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 1858-1921)
 * Purpose: Modal for searching messages within a chat
 */

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X, Filter, Image as ImageIcon, FileText, Mic, Video, Calendar, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

interface SearchResult {
  message: any;
  matchedText?: string;
  context: string;
  messageId?: string;
}

interface ChatSearchModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (filters?: SearchFilters) => void;
  isSearching: boolean;
  searchResults: SearchResult[];
  onResultPress?: (result: SearchResult, index: number) => void;
  participants?: Array<{ id: string; name: string }>;
}

interface SearchFilters {
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO';
  senderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const ChatSearchModal: React.FC<ChatSearchModalProps> = ({
  visible,
  onClose,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching,
  searchResults,
  onResultPress,
  participants = [],
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSearch = () => {
    onSearch(Object.keys(filters).length > 0 ? filters : undefined);
  };

  const clearFilters = () => {
    setFilters({});
    handleSearch();
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon size={16} color={theme.primary} />;
      case 'VIDEO':
        return <Video size={16} color={theme.primary} />;
      case 'VOICE':
        return <Mic size={16} color={theme.primary} />;
      case 'FILE':
        return <FileText size={16} color={theme.primary} />;
      default:
        return null;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.searchModalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.searchHeader, { backgroundColor: theme.surface, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={styles.searchBackButton}>
            <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.background }]}>
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={isRTL ? 'البحث في الرسائل...' : 'Search messages...'}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchQueryChange('')} style={styles.clearButton}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={[
              styles.filterButton,
              { backgroundColor: hasActiveFilters ? theme.primary : theme.background },
            ]}
          >
            <Filter
              size={20}
              color={hasActiveFilters ? '#FFFFFF' : theme.textSecondary}
            />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {Object.keys(filters).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={[styles.searchButtonText, { color: theme.primary }]}>
              {isRTL ? 'بحث' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={[styles.filtersPanel, { backgroundColor: theme.surface }]}>
            <Text style={[styles.filtersTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'الفلتر' : 'Filters'}
            </Text>

            {/* Media Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
                {isRTL ? 'نوع الرسالة' : 'Message Type'}
              </Text>
              <View style={styles.filterOptions}>
                {(['TEXT', 'IMAGE', 'VIDEO', 'VOICE', 'FILE'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filters.messageType === type ? theme.primary : theme.background,
                      },
                    ]}
                    onPress={() => {
                      setFilters((prev) => ({
                        ...prev,
                        messageType: filters.messageType === type ? undefined : type,
                      }));
                    }}
                  >
                    {getMediaIcon(type)}
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: filters.messageType === type ? '#FFFFFF' : theme.textPrimary,
                          marginLeft: 6,
                        },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sender Filter */}
            {participants.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'المرسل' : 'From'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                  {participants.map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: filters.senderId === participant.id ? theme.primary : theme.background,
                        },
                      ]}
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          senderId: filters.senderId === participant.id ? undefined : participant.id,
                        }));
                      }}
                    >
                      <User size={14} color={filters.senderId === participant.id ? '#FFFFFF' : theme.textSecondary} />
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: filters.senderId === participant.id ? '#FFFFFF' : theme.textPrimary,
                            marginLeft: 6,
                          },
                        ]}
                      >
                        {participant.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={[styles.clearFiltersText, { color: theme.error }]}>
                  {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isSearching ? (
          <View style={styles.searchLoadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.searchLoadingText, { color: theme.textSecondary }]}>
              {isRTL ? 'جاري البحث...' : 'Searching...'}
            </Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            style={styles.searchResults}
            data={searchResults}
            keyExtractor={(item, index) => item.messageId || item.message?.id || index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.searchResultItem, { backgroundColor: theme.surface }]}
                onPress={() => {
                  if (onResultPress) {
                    onResultPress(item, index);
                  }
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.searchResultHeader}>
                  <Text style={[styles.searchResultSender, { color: theme.primary }]}>
                    {item.message?.senderId || t('unknown')}
                  </Text>
                  <View style={styles.searchResultMeta}>
                    {item.message?.type && item.message.type !== 'TEXT' && (
                      <View style={styles.mediaTypeIndicator}>
                        {getMediaIcon(item.message.type)}
                      </View>
                    )}
                    <Text style={[styles.searchResultDate, { color: theme.textSecondary }]}>
                      {formatTime(item.message?.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.searchResultText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {item.context || item.message?.text || (isRTL ? 'رسالة وسائط' : 'Media message')}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : searchQuery.trim() ? (
          <View style={styles.searchEmptyContainer}>
            <Search size={48} color={theme.textSecondary} />
            <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
              {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
            </Text>
          </View>
        ) : (
          <View style={styles.searchEmptyContainer}>
            <Search size={48} color={theme.textSecondary} />
            <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
              {isRTL ? 'ابحث في رسائل هذه المحادثة' : 'Search in this chat'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  searchModalContainer: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchBackButton: {
    padding: 4,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersPanel: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearFiltersButton: {
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchResultSender: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaTypeIndicator: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  searchLoadingText: {
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    padding: 16,
  },
  searchResultItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchResultText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  searchResultDate: {
    fontSize: 12,
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  searchEmptyText: {
    fontSize: 16,
  },
});

export default ChatSearchModal;
