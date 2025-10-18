import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface Feature {
  title: string;
  description: string;
  details: Array<{
    title: string;
    content: string;
  }>;
}

interface FeatureModalProps {
  isVisible: boolean;
  onClose: () => void;
  feature: Feature | null;
}

export function FeatureModal({ isVisible, onClose, feature }: FeatureModalProps) {
  const { isDarkMode, accentColor } = useTheme();

  if (!feature) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
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
              {feature.title}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </Pressable>
          </View>

          <Text 
            className={`
              text-base mb-4
              ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
            `}
          >
            {feature.description}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {feature.details.map((detail, index) => (
              <View key={index} className="mb-4">
                <Text 
                  className={`
                    text-lg font-semibold mb-2
                    ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
                  `}
                >
                  {detail.title}
                </Text>
                <Text 
                  className={`
                    text-sm
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                  `}
                >
                  {detail.content}
                </Text>
              </View>
            ))}
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
    </Modal>
  );
}

export default FeatureModal;