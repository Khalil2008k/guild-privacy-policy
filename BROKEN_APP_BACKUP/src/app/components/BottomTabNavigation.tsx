import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useTheme } from '@/contexts/ThemeContext';

type BottomTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: { 
    bottomMenuEnabled?: boolean; 
    onBottomMenuToggle?: (value: boolean) => void;
  };
};

interface BottomTabNavigationProps {
  bottomMenuEnabled: boolean;
  onBottomMenuToggle: (value: boolean) => void;
}

export default function BottomTabNavigation({ 
  bottomMenuEnabled, 
  onBottomMenuToggle 
}: BottomTabNavigationProps) {
  const Tab = createBottomTabNavigator<BottomTabParamList>();
  const { isDarkMode, accentColor } = useTheme();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Home':
              return <Ionicons name="home-outline" color={color} size={size} />;
            case 'Profile':
              return <Ionicons name="person-outline" color={color} size={size} />;
            case 'Settings':
              return <Ionicons name="settings-outline" color={color} size={size} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : 'gray',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : 'white',
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
          height: 90,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          color: isDarkMode ? '#D1D5DB' : 'black',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Home',
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        initialParams={{ 
          bottomMenuEnabled, 
          onBottomMenuToggle 
        }}
        options={{ 
          title: 'Settings',
          headerShown: false,
        }} 
      />
    </Tab.Navigator>
  );
}