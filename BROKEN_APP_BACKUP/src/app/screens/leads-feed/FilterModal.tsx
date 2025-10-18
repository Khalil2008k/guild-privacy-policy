import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useI18n } from '@/contexts/I18nProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { RTLText, RTLView, RTLButton, RTLInput } from '@/app/components/primitives/primitives';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const FONT_FAMILY = 'NotoSansArabic-Regular';

interface FilterOptions {
  category: string;
  maxDistance: number;
  minBudget: number;
  maxBudget: number;
  sortBy: 'distance' | 'budget' | 'datePosted' | 'relevance';
}

interface FilterModalProps {
  visible: boolean;
  filterOptions: FilterOptions;
  onClose: () => void;
  onApply: (options: FilterOptions) => void;
}

const categories = [
  { id: '', name: 'allCategories' },
  { id: 'نقل', name: 'نقل' },
  { id: 'تنظيف', name: 'تنظيف' },
  { id: 'صيانة', name: 'صيانة' },
  { id: 'توصيل', name: 'توصيل' },
  { id: 'تصميم', name: 'تصميم' },
  { id: 'برمجة', name: 'برمجة' },
  { id: 'كتابة', name: 'كتابة' },
  { id: 'تدريس', name: 'تدريس' },
  { id: 'تصوير', name: 'تصوير' },
  { id: 'أخرى', name: 'أخرى' },
];

const sortOptions = [
  { id: 'relevance', name: 'relevance' },
  { id: 'distance', name: 'distance' },
  { id: 'budget', name: 'budget' },
  { id: 'datePosted', name: 'datePosted' },
];

const distanceOptions = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
];

export default function FilterModal({ visible, filterOptions, onClose, onApply }: FilterModalProps) {
  const { t, isRTL } = useI18n();
  const { theme, isDarkMode } = useTheme();
  const [localOptions, setLocalOptions] = useState<FilterOptions>(filterOptions);

  useEffect(() => {
    setLocalOptions(filterOptions);
  }, [filterOptions]);

  const handleCategorySelect = (categoryId: string) => {
    setLocalOptions(prev => ({ ...prev, category: categoryId }));
  };

  const handleSortSelect = (sortId: FilterOptions['sortBy']) => {
    setLocalOptions(prev => ({ ...prev, sortBy: sortId }));
  };

  const handleDistanceSelect = (distance: number) => {
    setLocalOptions(prev => ({ ...prev, maxDistance: distance }));
  };

  const handleBudgetChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : 0;
    setLocalOptions(prev => ({
      ...prev,
      [type === 'min' ? 'minBudget' : 'maxBudget']: numValue,
    }));
  };

  const handleReset = () => {
    setLocalOptions({
      category: '',
      maxDistance: 50,
      minBudget: 0,
      maxBudget: 10000,
      sortBy: 'relevance',
    });
  };

  const handleApply = () => {
    onApply(localOptions);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111111' : '#BCFF31'}
      />
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#111111' : theme.surface }]}>
        <RTLView style={[styles.header, { backgroundColor: isDarkMode ? '#111111' : '#BCFF31' }]}>
          <RTLText style={[styles.title, { color: isDarkMode ? theme.textPrimary : '#000000' }]}>{t('filterJobs')}</RTLText>
          <RTLButton onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? theme.textPrimary : '#000000'} />
          </RTLButton>
        </RTLView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Filter */}
          <RTLView style={styles.section}>
            <RTLText style={styles.sectionTitle}>{t('category')}</RTLText>
            <RTLView style={styles.optionsGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionChip,
                    localOptions.category === category.id && styles.selectedChip,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <RTLText
                    style={[
                      styles.optionChipText,
                      localOptions.category === category.id && styles.selectedChipText,
                    ]}
                  >
                    {category.id ? t(category.name) : t(category.name)}
                  </RTLText>
                  {localOptions.category === category.id && (
                    <Ionicons name="checkmark" size={16} color="#1E90FF" />
                  )}
                </TouchableOpacity>
              ))}
            </RTLView>
          </RTLView>

          {/* Distance Filter */}
          <RTLView style={styles.section}>
            <RTLText style={styles.sectionTitle}>{t('distance')}</RTLText>
            <RTLView style={styles.optionsGrid}>
              {distanceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionChip,
                    localOptions.maxDistance === option.value && styles.selectedChip,
                  ]}
                  onPress={() => handleDistanceSelect(option.value)}
                >
                  <RTLText
                    style={[
                      styles.optionChipText,
                      localOptions.maxDistance === option.value && styles.selectedChipText,
                    ]}
                  >
                    {option.label}
                  </RTLText>
                  {localOptions.maxDistance === option.value && (
                    <Ionicons name="checkmark" size={16} color="#1E90FF" />
                  )}
                </TouchableOpacity>
              ))}
            </RTLView>
          </RTLView>

          {/* Budget Filter */}
          <RTLView style={styles.section}>
            <RTLText style={styles.sectionTitle}>{t('budget')}</RTLText>
            <RTLView style={styles.budgetInputs}>
              <RTLView style={styles.budgetInput}>
                <RTLText style={styles.budgetLabel}>{t('minBudget')}</RTLText>
                <RTLInput
                  placeholder="0"
                  value={localOptions.minBudget.toString()}
                  onChangeText={(value) => handleBudgetChange('min', value)}
                  keyboardType="numeric"
                  style={styles.budgetTextInput}
                />
              </RTLView>
              <RTLView style={styles.budgetInput}>
                <RTLText style={styles.budgetLabel}>{t('maxBudget')}</RTLText>
                <RTLInput
                  placeholder="10000"
                  value={localOptions.maxBudget.toString()}
                  onChangeText={(value) => handleBudgetChange('max', value)}
                  keyboardType="numeric"
                  style={styles.budgetTextInput}
                />
              </RTLView>
            </RTLView>
          </RTLView>

          {/* Sort Options */}
          <RTLView style={styles.section}>
            <RTLText style={styles.sectionTitle}>{t('sortBy')}</RTLText>
            <RTLView style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortOption,
                    localOptions.sortBy === option.id && styles.selectedSortOption,
                  ]}
                  onPress={() => handleSortSelect(option.id as FilterOptions['sortBy'])}
                >
                  <RTLText
                    style={[
                      styles.sortOptionText,
                      localOptions.sortBy === option.id && styles.selectedSortOptionText,
                    ]}
                  >
                    {t(option.name)}
                  </RTLText>
                  {localOptions.sortBy === option.id && (
                    <Ionicons name="checkmark" size={16} color="#1E90FF" />
                  )}
                </TouchableOpacity>
              ))}
            </RTLView>
          </RTLView>
        </ScrollView>

        <RTLView style={styles.footer}>
          <RTLButton
            variant="outline"
            onPress={handleReset}
            style={styles.resetButton}
          >
            <RTLText style={styles.resetButtonText}>{t('reset')}</RTLText>
          </RTLButton>
          <RTLButton onPress={handleApply} style={styles.applyButton}>
            <RTLText style={styles.applyButtonText}>{t('apply')}</RTLText>
          </RTLButton>
        </RTLView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  closeButton: {
    minWidth: 48,
    height: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
    gap: 6,
  },
  selectedChip: {
    borderColor: '#BCFF31',
    backgroundColor: '#2a2a2a',
  },
  optionChipText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  selectedChipText: {
    color: '#BCFF31',
    fontWeight: '600',
  },
  budgetInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  budgetTextInput: {
    height: 40,
    fontSize: 14,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  selectedSortOption: {
    borderColor: '#1E90FF',
    backgroundColor: '#F0F8FF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedSortOptionText: {
    color: '#1E90FF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resetButton: {
    flex: 1,
    height: 48,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  applyButton: {
    flex: 2,
    height: 48,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
