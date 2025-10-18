import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useNetworkStatus } from '@/contexts/NetworkContext';

interface ContextViewerProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ContextViewer({ isVisible, onClose }: ContextViewerProps) {
  const { isDarkMode, accentColor } = useTheme();
  const { language, isRTL } = useI18n();
  const networkStatus = useNetworkStatus();

  if (!isVisible) return null;

  return (
    <View className="flex-1 justify-center items-center bg-black/50">
      <View 
        className={`
          m-4 p-6 rounded-2xl max-h-[80%] w-[90%]
          ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
        `}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text 
            className={`
              text-xl font-bold
              ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
            `}
          >
            Context Viewer
          </Text>
          <Pressable onPress={onClose}>
            <Text 
              className={`
                text-lg font-bold
                ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
              `}
            >
              ✕
            </Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {/* Theme Context */}
            <View>
              <Text 
                className={`
                  text-lg font-semibold mb-2
                  ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
                `}
              >
                Theme Context
              </Text>
              <Text 
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                Dark Mode: {isDarkMode ? 'Yes' : 'No'}
              </Text>
              <Text 
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                Accent Color: {accentColor}
              </Text>

            </View>

            {/* I18n Context */}
            <View>
              <Text 
                className={`
                  text-lg font-semibold mb-2
                  ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
                `}
              >
                I18n Context
              </Text>
              <Text 
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                Language: {language}
              </Text>
              <Text 
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                RTL: {isRTL ? 'Yes' : 'No'}
              </Text>
            </View>

            {/* Network Context */}
            <View>
              <Text 
                className={`
                  text-lg font-semibold mb-2
                  ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
                `}
              >
                Network Context
              </Text>
              <Text 
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                Online: {networkStatus.isOnline ? 'Yes' : 'No'}
              </Text>
              <Text 
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                Type: {networkStatus.type || 'Unknown'}
              </Text>
              <Text 
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                WiFi: {networkStatus.isWifiConnected ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <Pressable
          onPress={onClose}
          className={`
            mt-4 p-3 rounded-xl items-center
            ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
          `}
        >
          <Text 
            className={`
              font-semibold
              ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
            `}
          >
            Close
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default ContextViewer;