import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SettingItem } from '../molecules/SettingItem';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

/**
 * Language settings section component for toggling app language
 *
 * @returns {React.ReactElement} Language settings section component
 */
export function LanguageSettingsSection() {
  const { isDarkMode } = useTheme();
  const { language, changeLanguage, t } = useI18n();

  const toggleLanguage = async () => {
    await changeLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <View className="overflow-hidden">
      <SettingItem
        icon={Globe}
        label={t('language')}
        description={t('languageDescription')}
        control={
          <Text className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>
            {language === 'en' ? t('english') : t('arabic')}
          </Text>
        }
        onPress={toggleLanguage}
      />
    </View>
  );
}

export default LanguageSettingsSection;