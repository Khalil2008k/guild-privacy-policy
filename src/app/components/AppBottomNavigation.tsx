import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Shield } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  
  // Determine current route from pathname if not provided
  const activeRoute = currentRoute || pathname;
  
  // Animation values for each nav item
  const animationRefs = useRef<{ [key: string]: Animated.Value }>({});
  
  // Initialize animation values
  navRoutes.forEach(route => {
    if (!animationRefs.current[route.key]) {
      animationRefs.current[route.key] = new Animated.Value(0);
    }
  });

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
  
  // Animate tabs when active state changes
  useEffect(() => {
    navRoutes.forEach(route => {
      const active = isActive(route.path);
      Animated.spring(animationRefs.current[route.key], {
        toValue: active ? 1 : 0,
        useNativeDriver: false,
        tension: 100,
        friction: 7,
      }).start();
    });
  }, [activeRoute, isActive]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: isTablet ? width * 0.15 : 18, // 🎯 iPad: Center nav bar with margins
      right: isTablet ? width * 0.15 : 18,
      bottom: bottom + 10,
      backgroundColor: '#000000',
      borderRadius: 22,
      borderWidth: isTablet ? 3 : 2, // 🎯 iPad: Thicker border for visibility
      borderColor: theme.primary + (isTablet ? '60' : '40'), // 🎯 iPad: More visible border
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isTablet ? 0.5 : 0.3, // 🎯 iPad: Stronger shadow
      shadowRadius: isTablet ? 20 : 16,
      elevation: isTablet ? 20 : 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isTablet ? 8 : 4, // 🎯 iPad: More padding
      paddingHorizontal: isTablet ? 24 : 16,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      position: 'relative',
    },
    navItemInner: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    topIndicator: {
      position: 'absolute',
      top: -4,
      left: '25%',
      right: '25%',
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.primary,
    },
    spotlightGlow: {
      position: 'absolute',
      top: -20,
      left: '50%',
      width: 60,
      height: 60,
      marginLeft: -30,
      borderRadius: 30,
      opacity: 0.3,
    },
    iconGlow: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      opacity: 0.2,
    },
    centerNavItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    navText: {
      color: '#CCCCCC',
      fontSize: isTablet ? 13 : 11, // 🎯 iPad: Larger text
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
      textShadowRadius: isTablet ? 6 : 4, // 🎯 iPad: Stronger glow
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
                {route.icon({ size: isTablet ? 34 : 30, color: theme.primary })}
              </TouchableOpacity>
            </View>
          );
        }

        const animValue = animationRefs.current[route.key];
        
        // Animated values
        const indicatorOpacity = animValue;
        const spotlightOpacity = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.3],
        });
        const iconGlowScale = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        });
        const iconGlowOpacity = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.4],
        });

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.navItem}
            onPress={() => handleNavPress(route)}
            activeOpacity={0.7}
          >
            {/* Top Indicator Line */}
            <Animated.View 
              style={[
                styles.topIndicator,
                { opacity: indicatorOpacity }
              ]} 
            />
            
            {/* Spotlight Glow Effect */}
            <Animated.View 
              style={[
                styles.spotlightGlow,
                { opacity: spotlightOpacity }
              ]}
            >
              <LinearGradient
                colors={[theme.primary + '80', theme.primary + '00']}
                style={{ flex: 1, borderRadius: 30 }}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </Animated.View>
            
            <View style={styles.navItemInner}>
              {/* Icon Glow */}
              <Animated.View 
                style={[
                  styles.iconGlow,
                  {
                    opacity: iconGlowOpacity,
                    transform: [{ scale: iconGlowScale }],
                  }
                ]}
              />
              
              {/* Icon */}
              {route.icon({ size: isTablet ? 26 : 22, color: active ? theme.primary : '#FFFFFF' })}
              
              {/* Label */}
              <Text style={[
                styles.navText,
                active && styles.navTextActive
              ]}>
                {route.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

