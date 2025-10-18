import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Shield } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const FONT_FAMILY = 'Signika Negative SC';

interface NavRoute {
  key: string;
  path: string;
  icon: ({ size, color }: { size: number; color: string }) => React.ReactNode;
  label: string;
  isCenter?: boolean;
}

const navRoutes: NavRoute[] = [
  {
    key: 'home',
    path: '/(main)/home',
    icon: ({ size, color }: { size: number; color: string }) => <Ionicons name="home-outline" size={size} color={color} />,
    label: 'Home',
  },
  {
    key: 'jobs',
    path: '/(main)/jobs',
    icon: ({ size, color }: { size: number; color: string }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
    label: 'Jobs',
  },
  {
    key: 'guilds',
    path: '/(modals)/guilds',
    icon: ({ size, color }: { size: number; color: string }) => <Shield size={size * 0.9} color={color} strokeWidth={2.5} />,
    label: 'Guilds',
    isCenter: true,
  },
  {
    key: 'wallet',
    path: '/(modals)/wallet',
    icon: ({ size, color }: { size: number; color: string }) => <Ionicons name="wallet-outline" size={size} color={color} />,
    label: 'Wallet',
  },
  {
    key: 'profile',
    path: '/(main)/profile',
    icon: ({ size, color }: { size: number; color: string }) => <Ionicons name="person-outline" size={size} color={color} />,
    label: 'Profile',
  },
];

interface AppBottomNavigationProps {
  currentRoute?: string;
}

export default function AppBottomNavigation({ currentRoute }: AppBottomNavigationProps) {
  const { bottom } = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const pathname = usePathname();
  
  // Determine current route from pathname if not provided
  const activeRoute = currentRoute || pathname;

  const handleNavPress = useCallback((route: NavRoute) => {
    if (route.path === activeRoute) return; // Don't navigate if already on this route

    router.push(route.path);
  }, [activeRoute]);

  const isActive = useCallback((routePath: string) => {
    if (routePath === '/(main)/home') {
      return activeRoute === '/(main)/home' || activeRoute === '/';
    }
    if (routePath === '/(modals)/wallet') {
      return activeRoute?.startsWith('/(modals)/wallet');
    }
    if (routePath === '/(modals)/guilds') {
      return activeRoute?.startsWith('/(modals)/guilds') || activeRoute?.startsWith('/(modals)/guild');
    }
    return activeRoute?.startsWith(routePath);
  }, [activeRoute]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: bottom + 10,
      backgroundColor: '#000000',
      borderRadius: 22,
      borderWidth: 2,
      borderColor: theme.primary + '40',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 16,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    centerNavItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    navText: {
      color: '#CCCCCC',
      fontSize: 11,
      marginTop: 4,
      fontFamily: FONT_FAMILY,
      fontWeight: '700',
      opacity: 0.9,
    },
    navTextActive: {
      color: '#FFFFFF',
      opacity: 1,
      fontWeight: '900',
      textShadowColor: '#FFFFFF80',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 4,
    },
    centerButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#000000',
      borderWidth: 3,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 12,
      // Position the center button so it's 70% inside, 30% outside
      transform: [{ translateY: -15 }],
    },
    centerButtonActive: {
      backgroundColor: '#000000',
      shadowOpacity: 0.8,
      shadowRadius: 16,
      borderColor: theme.primary,
      borderWidth: 4,
    }
  });

  return (
    <View style={styles.container}>
      {navRoutes.map((route, index) => {
        const active = isActive(route.path);

        if (route.isCenter) {
          return (
            <View key={route.key} style={styles.centerNavItem}>
              <TouchableOpacity
                style={[
                  styles.centerButton,
                  active && styles.centerButtonActive
                ]}
                onPress={() => handleNavPress(route)}
                activeOpacity={0.8}
              >
                {route.icon({ size: 30, color: theme.primary })}
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.navItem}
            onPress={() => handleNavPress(route)}
            activeOpacity={0.7}
          >
            {route.icon({ size: 22, color: active ? '#FFFFFF' : '#CCCCCC' })}
            <Text style={[
              styles.navText,
              active && styles.navTextActive
            ]}>
              {route.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

