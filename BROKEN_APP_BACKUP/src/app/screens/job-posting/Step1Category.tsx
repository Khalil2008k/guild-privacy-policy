import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useI18n } from '@/contexts/I18nProvider';
import { RTLText, RTLView, RTLButton } from '@/app/components/primitives/primitives';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface Step1CategoryProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const categories = [
  { id: 'cleaning', name: 'cleaning', icon: '🧹' },
  { id: 'maintenance', name: 'maintenance', icon: '🔧' },
  { id: 'delivery', name: 'delivery', icon: '🚚' },
  { id: 'tutoring', name: 'tutoring', icon: '📚' },
  { id: 'cooking', name: 'cooking', icon: '👨‍🍳' },
  { id: 'gardening', name: 'gardening', icon: '🌱' },
  { id: 'photography', name: 'photography', icon: '📷' },
  { id: 'translation', name: 'translation', icon: '🌐' },
];

export default function Step1Category({ selectedCategory, onCategorySelect }: Step1CategoryProps) {
  const { t, isRTL } = useI18n();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId);
    setIsModalVisible(false);
  };

  return (
    <RTLView style={styles.container}>
      <RTLText style={styles.title}>{t('selectJobCategory')}</RTLText>
      <RTLText style={styles.subtitle}>{t('categoryDescription')}</RTLText>

      {/* Category Dropdown */}
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('selectCategory')}
      >
        <RTLView style={styles.dropdownContent}>
          {selectedCategory ? (
            <RTLView style={styles.selectedCategory}>
              <RTLText style={styles.categoryIcon}>
                {selectedCategoryData?.icon}
              </RTLText>
              <RTLText style={styles.categoryName}>
                {t(selectedCategoryData?.name || '')}
              </RTLText>
            </RTLView>
          ) : (
            <RTLText style={styles.placeholder}>
              {t('selectCategory')}
            </RTLText>
          )}
        </RTLView>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <RTLView style={styles.modalContent}>
            <RTLView style={styles.modalHeader}>
              <RTLText style={styles.modalTitle}>{t('selectCategory')}</RTLText>
              <RTLButton
                variant="outline"
                size="small"
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <RTLText style={styles.closeButtonText}>{t('close')}</RTLText>
              </RTLButton>
            </RTLView>

            <RTLView style={styles.categoriesList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.selectedItem
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t(category.name)}
                >
                  <RTLView style={styles.categoryItemContent}>
                    <RTLText style={styles.categoryItemIcon}>
                      {category.icon}
                    </RTLText>
                    <RTLText style={styles.categoryItemName}>
                      {t(category.name)}
                    </RTLText>
                  </RTLView>
                  {selectedCategory === category.id && (
                    <Ionicons name="checkmark" size={20} color="#1E90FF" />
                  )}
                </TouchableOpacity>
              ))}
            </RTLView>
          </RTLView>
        </View>
      </Modal>

      {/* Selected Category Preview */}
      {selectedCategory && (
        <RTLView style={styles.preview}>
          <RTLText style={styles.previewTitle}>{t('selectedCategory')}</RTLText>
          <RTLView style={styles.previewContent}>
            <RTLText style={styles.previewIcon}>
              {selectedCategoryData?.icon}
            </RTLText>
            <RTLView style={styles.previewText}>
              <RTLText style={styles.previewName}>
                {t(selectedCategoryData?.name || '')}
              </RTLText>
              <RTLText style={styles.previewDescription}>
                {t(`${selectedCategory}Description`)}
              </RTLText>
            </RTLView>
          </RTLView>
        </RTLView>
      )}
    </RTLView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'NotoSansArabic',
    marginBottom: 32,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
    minHeight: 56,
  },
  dropdownContent: {
    flex: 1,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Medium',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'NotoSansArabic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#1E90FF',
    fontFamily: 'NotoSansArabic-Medium',
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1E90FF',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Medium',
  },
  preview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'NotoSansArabic-Medium',
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'NotoSansArabic-Bold',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'NotoSansArabic',
    lineHeight: 20,
  },
});
