import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Animated as RNAnimated, 
  Share, 
  Platform,
  TouchableOpacity,
  Clipboard
} from 'react-native';
import { CustomAlertService } from '@/services/CustomAlertService';
import Animated from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from '@/contexts/NetworkContext';
import { AlertFadeModal } from '../AlertFadeModal';
import { ContextViewer } from '../ContextViewer/ContextViewer';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Debug Bottom Navigation Component
 * 
 * @description Provides an expanded bottom navigation with debug options and roll-in animation
 * @returns {React.ReactElement} Debug bottom navigation
 */
export function DebugBottomNavigation() {
  const [storageModalVisible, setStorageModalVisible] = useState(false);
  const [contextModalVisible, setContextModalVisible] = useState(false);
  const [storageItems, setStorageItems] = useState<[string, string][]>([]);
  const networkStatus = useNetworkStatus();
  const { isDarkMode } = useTheme();

  const checkNetworkStatus = () => {
    CustomAlertService.showInfo(
      'Network Status', 
      `Connected: ${networkStatus.isOnline}\n` +
      `Type: ${networkStatus.type}\n` +
      `Wifi: ${networkStatus.isWifiConnected}\n` +
      `Cellular: ${networkStatus.isCellularConnected}`
    );
  };

  const showAppEnvironmentInfo = () => {
    const environmentInfo = `
      App Environment Details:
      - Platform: ${Platform.OS}
      - Platform Version: ${Platform.Version}
    `;

    CustomAlertService.showInfo(
      'App Environment', 
      environmentInfo
    );
  };

  const viewAsyncStorageContents = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      
      const mutableStores = stores.map(([key, value]) => [key, value]) as [string, string][];
      
      setStorageItems(mutableStores);
      setStorageModalVisible(true);
    } catch (error) {
      CustomAlertService.showError('Storage Error', String(error));
    }
  };

  const deleteStorageItem = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      const updatedItems = storageItems.filter(([itemKey]) => itemKey !== key);
      setStorageItems(updatedItems);
      
      CustomAlertService.showSuccess('Success', `Item with key "${key}" deleted`);
    } catch (error) {
      CustomAlertService.showError('Delete Error', String(error));
    }
  };

  const copyItemToClipboard = (value: string) => {
    Clipboard.setString(value);
    CustomAlertService.showSuccess('Copied', 'Item value copied to clipboard');
  };

  const renderStorageItem = ([key, value]: [string, string]) => (
    <View 
      key={key} 
      className={`flex-row ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-4 mb-4 rounded-xl border items-center`}
    >
      <View className="flex-1 mr-2">
        <Text className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{key}:</Text>
        <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={2}>
          {value}
        </Text>
      </View>
      
      <TouchableOpacity 
        onPress={() => copyItemToClipboard(value)}
        className={`mr-2 p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} rounded-full`}
      >
        <Ionicons name="copy-outline" size={20} color={isDarkMode ? '#D1D5DB' : '#2563EB'} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => {
          CustomAlertService.showConfirmation(
            'Confirm Deletion', 
            `Are you sure you want to delete the item with key "${key}"?`,
            () => deleteStorageItem(key),
            undefined,
            false
          );
        }}
        className={`p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-red-100'} rounded-full`}
      >
        <Ionicons name="trash-outline" size={20} color={isDarkMode ? '#EF4444' : '#DC2626'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <Animated.View 
        className="absolute bottom-0 left-0 right-0 px-4" 
        style={{ 
          zIndex: 999, 
          marginBottom: 70,
          transform: [{ 
            translateY: 0 
          }]
        }}
      >
        <View className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-4 border-t`}>
          <View className="flex-row justify-around items-center">
            <DebugNavItem 
              icon={NetworkIcon} 
              label="Network" 
              onPress={checkNetworkStatus} 
              isDarkMode={isDarkMode}
            />
            <DebugNavItem 
              icon={DatabaseIcon} 
              label="Storage" 
              onPress={viewAsyncStorageContents} 
              isDarkMode={isDarkMode}
            />
            <DebugNavItem 
              icon={ClipboardIcon} 
              label="Environment" 
              onPress={showAppEnvironmentInfo} 
              isDarkMode={isDarkMode}
            />
            <DebugNavItem 
              icon={CodeIcon} 
              label="Contexts" 
              onPress={() => setContextModalVisible(true)} 
              isDarkMode={isDarkMode}
            />
            <DebugNavItem 
              icon={BugIcon} 
              label="Crash Test" 
              onPress={() => {
                throw new Error('Intentional crash for debugging');
              }} 
              isDarkMode={isDarkMode}
            />
          </View>
        </View>
      </Animated.View>

      <AlertFadeModal
        isVisible={storageModalVisible}
        onClose={() => setStorageModalVisible(false)}
        title="AsyncStorage Contents"
        message={`Found ${storageItems.length} items in AsyncStorage`}
      />

      <ContextViewer
        isVisible={contextModalVisible}
        onClose={() => setContextModalVisible(false)}
      />
    </View>
  );
}

interface DebugNavItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress: () => void;
  isDarkMode: boolean;
}

function DebugNavItem({ icon: Icon, label, onPress, isDarkMode }: DebugNavItemProps) {
  return (
    <Pressable 
      onPress={onPress} 
      className="items-center justify-center p-2"
    >
      <Icon size={24} color={isDarkMode ? "#9CA3AF" : "#4B5563"} />
      <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mt-1`}>{label}</Text>
    </Pressable>
  );
}

export default DebugBottomNavigation;