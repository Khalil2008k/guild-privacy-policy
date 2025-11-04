/**
 * SearchScreen Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines 37-135)
 * Purpose: Search modal for filtering jobs by title, company, skills, location, budget, category
 */

import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import {
  createSearchAccessibility,
  createButtonAccessibility,
  createListAccessibility,
  createListItemAccessibility,
} from '../../../utils/accessibility';
import { roundToProperCoinValue } from '../../../utils/coinUtils';

interface SearchScreenProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  jobs: any[];
}

export const SearchScreen = React.memo<SearchScreenProps>(({ visible, onClose, searchQuery, onSearchChange, jobs }) => {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  if (!visible) return null;

  const filteredJobs = jobs.filter((job: any) => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = job.title?.toLowerCase().includes(query);
    const matchesCompany = job.company?.toLowerCase().includes(query);
    const matchesSkills = job.skills?.some((skill: string) => skill.toLowerCase().includes(query));
    
    // Issue #6 Fix: Expanded search to include location, budget, category
    const matchesLocation = typeof job.location === 'object' 
      ? job.location?.address?.toLowerCase().includes(query)
      : job.location?.toLowerCase().includes(query);
    
    const matchesBudget = job.budget?.toString().includes(query);
    const matchesCategory = job.category?.toLowerCase().includes(query);
    const matchesTimeNeeded = job.timeNeeded?.toLowerCase().includes(query);
    
    return matchesTitle || matchesCompany || matchesSkills || matchesLocation || matchesBudget || matchesCategory || matchesTimeNeeded;
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.searchModal, { backgroundColor: theme.background }]}>
        <View style={[styles.searchHeader, { borderBottomColor: theme.border }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.surface, color: theme.textPrimary }]}
            placeholder={t('searchJobs')}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus
            {...createSearchAccessibility(
              t('searchJobs'),
              searchQuery,
              isRTL ? 'ابحث عن الوظائف بالعنوان أو الشركة أو المهارات' : 'Search jobs by title, company, or skills'
            )}
          />
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            {...createButtonAccessibility(
              isRTL ? 'إغلاق البحث' : 'Close search',
              isRTL ? 'اضغط لإغلاق شاشة البحث' : 'Tap to close search screen'
            )}
          >
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.searchResults}
          {...createListAccessibility(
            isRTL ? 'نتائج البحث' : 'Search results',
            filteredJobs.length
          )}
        >
          {filteredJobs.map((job: any, index: number) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.searchResultItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                onClose();
                router.push(`/(modals)/job/${job.id}` as any);
              }}
              {...createListItemAccessibility(
                `${job.title} ${isRTL ? 'في' : 'at'} ${job.company}`,
                index + 1,
                filteredJobs.length,
                isRTL ? `راتب: ${job.budget}, موقع: ${typeof job.location === 'object' ? job.location?.address || 'غير محدد' : job.location}` : `Budget: ${job.budget}, Location: ${typeof job.location === 'object' ? job.location?.address || 'Not specified' : job.location}`
              )}
            >
              <Text style={[styles.searchResultTitle, { color: theme.textPrimary }]}>{job.title}</Text>
              <Text style={[styles.searchResultCompany, { color: theme.textSecondary }]}>{job.company}</Text>
              <Text style={[styles.searchResultSalary, { color: theme.primary }]}>
                {typeof job.budget === 'string' 
                  ? (() => {
                      const numbers = job.budget.match(/\d+/g);
                      if (numbers && numbers.length > 0) {
                        const amount = parseInt(numbers[0]);
                        return `${roundToProperCoinValue(amount)} QR`;
                      }
                      return job.budget.replace(/Coins/gi, 'QR');
                    })()
                  : `${roundToProperCoinValue(job.budget?.min || 0)}-${roundToProperCoinValue(job.budget?.max || 0)} QR`
                }
              </Text>
            </TouchableOpacity>
          ))}
          {filteredJobs.length === 0 && (
            <Text style={[styles.noResults, { color: theme.textSecondary }]}>{t('noJobsFound')}</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
});

SearchScreen.displayName = 'SearchScreen';

const styles = StyleSheet.create({
  searchModal: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  closeButton: {
    padding: 8,
  },
  searchResults: {
    flex: 1,
    padding: 16,
  },
  searchResultItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultCompany: {
    fontSize: 14,
    marginBottom: 4,
  },
  searchResultSalary: {
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
});

