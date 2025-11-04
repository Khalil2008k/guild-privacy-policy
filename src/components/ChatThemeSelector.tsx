/**
 * Chat Theme Selector Component
 * 
 * Allows users to select custom backgrounds/themes for their chats
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Image as ImageIcon, Palette, X, Check, Upload } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import * as ImagePicker from 'expo-image-picker';
import { chatThemeService } from '../services/chatThemeService';

export interface ChatTheme {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image';
  value: string | string[] | { uri: string }; // Color hex, gradient array, or image URI
  thumbnail?: string;
  isCustom?: boolean;
}

interface ChatThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  currentTheme?: ChatTheme | null;
  onThemeChange: (theme: ChatTheme | null) => void;
}

const DEFAULT_THEMES: ChatTheme[] = [
  {
    id: 'default',
    name: 'Default',
    type: 'color',
    value: '#FFFFFF',
  },
  {
    id: 'dark',
    name: 'Dark',
    type: 'color',
    value: '#1A1A1A',
  },
  {
    id: 'gradient-1',
    name: 'Sunset',
    type: 'gradient',
    value: ['#FF6B6B', '#4ECDC4'],
  },
  {
    id: 'gradient-2',
    name: 'Ocean',
    type: 'gradient',
    value: ['#667EEA', '#764BA2'],
  },
  {
    id: 'gradient-3',
    name: 'Forest',
    type: 'gradient',
    value: ['#11998e', '#38ef7d'],
  },
  {
    id: 'gradient-4',
    name: 'Purple',
    type: 'gradient',
    value: ['#8360c3', '#2ebf91'],
  },
  {
    id: 'gradient-5',
    name: 'Pink',
    type: 'gradient',
    value: ['#f093fb', '#f5576c'],
  },
  {
    id: 'gradient-6',
    name: 'Blue',
    type: 'gradient',
    value: ['#4facfe', '#00f2fe'],
  },
];

export function ChatThemeSelector({
  visible,
  onClose,
  chatId,
  currentTheme,
  onThemeChange,
}: ChatThemeSelectorProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme | null>(currentTheme || null);
  const [customThemes, setCustomThemes] = useState<ChatTheme[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCustomThemes, setLoadingCustomThemes] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setSelectedTheme(currentTheme || null);
      loadCustomThemes();
    }
  }, [visible, currentTheme]);

  const loadCustomThemes = async () => {
    setLoadingCustomThemes(true);
    try {
      const themes = await chatThemeService.getCustomThemes(chatId);
      setCustomThemes(themes);
    } catch (error) {
      console.error('Error loading custom themes:', error);
    } finally {
      setLoadingCustomThemes(false);
    }
  };

  const handleSelectTheme = (themeOption: ChatTheme) => {
    setSelectedTheme(themeOption);
  };

  const handleSave = async () => {
    if (!chatId) return;

    try {
      if (selectedTheme) {
        await chatThemeService.setChatTheme(chatId, selectedTheme);
      } else {
        await chatThemeService.clearChatTheme(chatId);
      }
      onThemeChange(selectedTheme);
      onClose();
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleUploadImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        try {
          const customTheme: ChatTheme = {
            id: `custom-${Date.now()}`,
            name: 'Custom',
            type: 'image',
            value: { uri: result.assets[0].uri },
            thumbnail: result.assets[0].uri,
            isCustom: true,
          };

          await chatThemeService.setChatTheme(chatId, customTheme);
          await chatThemeService.saveCustomTheme(chatId, customTheme);
          
          setCustomThemes([...customThemes, customTheme]);
          setSelectedTheme(customTheme);
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
    }
  };

  const renderThemePreview = (themeOption: ChatTheme) => {
    if (themeOption.type === 'color') {
      return (
        <View
          style={[
            styles.colorPreview,
            {
              backgroundColor: themeOption.value as string,
              borderColor: theme === themeOption ? theme.primary : theme.border,
              borderWidth: theme === themeOption ? 2 : 1,
            },
          ]}
        />
      );
    } else if (themeOption.type === 'gradient') {
      return (
        <View
          style={[
            styles.gradientPreview,
            {
              borderColor: selectedTheme?.id === themeOption.id ? theme.primary : theme.border,
              borderWidth: selectedTheme?.id === themeOption.id ? 2 : 1,
            },
          ]}
        >
          {/* Gradient preview - simplified as React Native gradients need LinearGradient component */}
          <View style={[styles.gradientInner, { backgroundColor: (themeOption.value as string[])[0] }]} />
        </View>
      );
    } else if (themeOption.type === 'image') {
      const imageUri = typeof themeOption.value === 'object' && 'uri' in themeOption.value
        ? themeOption.value.uri
        : themeOption.thumbnail;
      
      return (
        <View
          style={[
            styles.imagePreview,
            {
              borderColor: selectedTheme?.id === themeOption.id ? theme.primary : theme.border,
              borderWidth: selectedTheme?.id === themeOption.id ? 2 : 1,
            },
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreviewImage} />
          ) : (
            <ImageIcon size={24} color={theme.textSecondary} />
          )}
        </View>
      );
    }

    return null;
  };

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
            <Palette size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'خلفية الدردشة' : 'Chat Theme'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Default Themes */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {isRTL ? 'السمات الافتراضية' : 'Default Themes'}
            </Text>
            <View style={styles.themesGrid}>
              {DEFAULT_THEMES.map((themeOption) => (
                <TouchableOpacity
                  key={themeOption.id}
                  style={styles.themeOption}
                  onPress={() => handleSelectTheme(themeOption)}
                >
                  {renderThemePreview(themeOption)}
                  <Text
                    style={[
                      styles.themeName,
                      {
                        color: selectedTheme?.id === themeOption.id ? theme.primary : theme.textPrimary,
                        fontWeight: selectedTheme?.id === themeOption.id ? '600' : '400',
                      },
                    ]}
                  >
                    {themeOption.name}
                  </Text>
                  {selectedTheme?.id === themeOption.id && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                      <Check size={16} color="#000000" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Themes */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
              {isRTL ? 'السمات المخصصة' : 'Custom Themes'}
            </Text>
            
            {loadingCustomThemes ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <View style={styles.themesGrid}>
                {customThemes.map((themeOption) => (
                  <TouchableOpacity
                    key={themeOption.id}
                    style={styles.themeOption}
                    onPress={() => handleSelectTheme(themeOption)}
                  >
                    {renderThemePreview(themeOption)}
                    <Text
                      style={[
                        styles.themeName,
                        {
                          color: selectedTheme?.id === themeOption.id ? theme.primary : theme.textPrimary,
                          fontWeight: selectedTheme?.id === themeOption.id ? '600' : '400',
                        },
                      ]}
                    >
                      {themeOption.name}
                    </Text>
                    {selectedTheme?.id === themeOption.id && (
                      <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                        <Check size={16} color="#000000" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                
                {/* Upload Custom Image */}
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleUploadImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Upload size={24} color={theme.primary} />
                      <Text style={[styles.uploadText, { color: theme.primary }]}>
                        {isRTL ? 'رفع صورة' : 'Upload Image'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.background }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Check size={20} color="#000000" />
              <Text style={[styles.saveButtonText, { color: '#000000' }]}>
                {isRTL ? 'حفظ' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 500,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeOption: {
    width: 100,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
  },
  gradientPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradientInner: {
    width: '100%',
    height: '100%',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  themeName: {
    fontSize: 12,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

