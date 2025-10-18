import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme, ACCENT_COLORS } from '@/contexts/ThemeContext';

export const ThemeSettingsSection: React.FC = () => {
  const { isDarkMode, toggleTheme, accentColor, setAccentColor, theme } = useTheme();

  const accentOptions = [
    ACCENT_COLORS.GREEN,
    ACCENT_COLORS.YELLOW,
    ACCENT_COLORS.BLUE,
    ACCENT_COLORS.PURPLE,
  ];

  return (
    <View className="px-4 py-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <TouchableOpacity
          onPress={toggleTheme}
          className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          accessibilityRole="button"
        >
          <Text className={`${isDarkMode ? 'text-white' : 'text-black'} font-semibold`}>
            Toggle
          </Text>
        </TouchableOpacity>
      </View>

      <Text className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Accent Color
      </Text>
      <View className="flex-row gap-3">
        {accentOptions.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => setAccentColor(color)}
            className={`w-8 h-8 rounded-full border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
            style={{ backgroundColor: color }}
            accessibilityRole="button"
          >
            {accentColor === color && (
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: theme.background, margin: 10 }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ThemeSettingsSection;



