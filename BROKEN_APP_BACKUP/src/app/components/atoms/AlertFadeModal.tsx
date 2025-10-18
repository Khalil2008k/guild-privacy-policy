import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AlertFadeModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function AlertFadeModal({ isVisible, onClose, title, message }: AlertFadeModalProps) {
  const { isDarkMode } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View 
          className={`
            m-4 p-6 rounded-2xl w-[90%]
            ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
          `}
        >
          <Text 
            className={`
              text-xl font-bold mb-4
              ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
            `}
          >
            {title}
          </Text>
          <Text 
            className={`
              text-base mb-6
              ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
            `}
          >
            {message}
          </Text>
          <Pressable
            onPress={onClose}
            className={`
              p-3 rounded-xl items-center
              ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
            `}
          >
            <Text 
              className={`
                font-semibold
                ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
              `}
            >
              OK
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default AlertFadeModal;
