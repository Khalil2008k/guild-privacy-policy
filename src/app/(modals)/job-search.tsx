import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Filter, X, MapPin, DollarSign, Clock, Shield, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface SearchFilters {
  category: string;
  minBudget: string;
  maxBudget: string;
  duration: string;
  location: string;
  remote: boolean;
  urgent: boolean;
  verified: boolean;
  guildOnly: boolean;
}

export default function JobSearchScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    minBudget: '',
    maxBudget: '',
    duration: 'any',
    location: '',
    remote: false,
    urgent: false,
    verified: false,
    guildOnly: false,
  });

  const categories = [
    { key: 'all', label: 'All Categories', icon: 'apps' },
    { key: 'development', label: 'Development', icon: 'code' },
    { key: 'design', label: 'Design', icon: 'palette' },
    { key: 'marketing', label: 'Marketing', icon: 'trending-up' },
    { key: 'writing', label: 'Writing', icon: 'create' },
    { key: 'consulting', label: 'Consulting', icon: 'people' },
  ];

  const durations = [
    { key: 'any', label: 'Any Duration' },
    { key: 'short', label: 'Short (< 1 week)' },
    { key: 'medium', label: 'Medium (1-4 weeks)' },
    { key: 'long', label: 'Long (1+ months)' },
  ];

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate search
    if (!searchQuery.trim() && filters.category === 'all' && !filters.minBudget && !filters.maxBudget) {
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'يرجى إدخال معايير البحث' : 'Please enter search criteria'
      );
      return;
    }

    // Navigate to jobs screen with search params
    router.push({
      pathname: '/(main)/jobs',
      params: {
        search: searchQuery,
        category: filters.category,
        minBudget: filters.minBudget,
        maxBudget: filters.maxBudget,
        duration: filters.duration,
        location: filters.location,
        remote: filters.remote,
        urgent: filters.urgent,
        verified: filters.verified,
        guildOnly: filters.guildOnly,
      }
    });
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters({
      category: 'all',
      minBudget: '',
      maxBudget: '',
      duration: 'any',
      location: '',
      remote: false,
      urgent: false,
      verified: false,
      guildOnly: false,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcons name="search" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Job Search
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={clearFilters}
          >
            <Ionicons name="refresh" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={t('searchJobsPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  { 
                    backgroundColor: filters.category === category.key ? theme.primary + '20' : theme.background,
                    borderColor: filters.category === category.key ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilters(prev => ({ ...prev, category: category.key }));
                }}
              >
                <MaterialIcons 
                  name={category.icon as any} 
                  size={18} 
                  color={filters.category === category.key ? theme.primary : theme.textSecondary} 
                />
                <Text style={[
                  styles.categoryText,
                  { color: filters.category === category.key ? theme.primary : theme.textSecondary }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Budget Range */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Budget Range (QAR)
          </Text>
          <View style={styles.budgetRow}>
            <View style={styles.budgetInput}>
              <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>Min</Text>
              <TextInput
                style={[styles.budgetField, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                value={filters.minBudget}
                onChangeText={(text) => setFilters(prev => ({ ...prev, minBudget: text }))}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.budgetSeparator, { color: theme.textSecondary }]}>to</Text>
            <View style={styles.budgetInput}>
              <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>Max</Text>
              <TextInput
                style={[styles.budgetField, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="∞"
                placeholderTextColor={theme.textSecondary}
                value={filters.maxBudget}
                onChangeText={(text) => setFilters(prev => ({ ...prev, maxBudget: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Duration */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Project Duration
          </Text>
          {durations.map((duration) => (
            <TouchableOpacity
              key={duration.key}
              style={[
                styles.durationOption,
                { borderColor: theme.border }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilters(prev => ({ ...prev, duration: duration.key }));
              }}
            >
              <View style={[
                styles.radioButton,
                { borderColor: theme.border },
                filters.duration === duration.key && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}>
                {filters.duration === duration.key && (
                  <Ionicons name="checkmark" size={14} color={theme.buttonText} />
                )}
              </View>
              <Text style={[styles.durationText, { color: theme.textPrimary }]}>
                {duration.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Location
          </Text>
          <TextInput
            style={[styles.locationInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="Enter city or region..."
            placeholderTextColor={theme.textSecondary}
            value={filters.location}
            onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
          />
        </View>

        {/* Toggle Options */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Additional Filters
          </Text>
          
          {[
            { key: 'remote', label: 'Remote Work Available', icon: 'home' },
            { key: 'urgent', label: 'Urgent Jobs Only', icon: 'flash' },
            { key: 'verified', label: 'Verified Clients Only', icon: 'shield-checkmark' },
            { key: 'guildOnly', label: 'Guild Jobs Only', icon: 'people' },
          ].map((option) => (
            <View key={option.key} style={[styles.toggleOption, { borderColor: theme.border }]}>
              <View style={styles.toggleLeft}>
                <Ionicons name={option.icon as any} size={20} color={theme.primary} />
                <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>
                  {option.label}
                </Text>
              </View>
              <Switch
                value={filters[option.key as keyof SearchFilters] as boolean}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilters(prev => ({ ...prev, [option.key]: value }));
                }}
                trackColor={{ false: theme.border, true: theme.primary + '40' }}
                thumbColor={filters[option.key as keyof SearchFilters] ? theme.primary : theme.textSecondary}
              />
            </View>
          ))}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: theme.primary }]}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={20} color={theme.buttonText} />
          <Text style={[styles.searchButtonText, { color: theme.buttonText }]}>
            Search Jobs
          </Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
    marginBottom: 12,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  budgetField: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  budgetSeparator: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  locationInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  searchButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});



