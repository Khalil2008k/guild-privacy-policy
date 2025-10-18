import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RTLText } from './primitives/primitives';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  hasBadge?: boolean;
  badgeText?: string;
}

const navItems: NavItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: <Ionicons name="home-outline" size={24} color="#FFFFFF" />,
    route: '/',
  },
  {
    key: 'my-jobs',
    label: 'My Jobs',
    icon: <Ionicons name="briefcase-outline" size={24} color="#FFFFFF" />,
    route: '/my-jobs',
  },
  {
    key: 'guild',
    label: 'Guild',
    icon: <Ionicons name="people-outline" size={24} color="#FFFFFF" />,
    route: '/guild',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: <Ionicons name="person-outline" size={24} color="#FFFFFF" />,
    route: '/profile',
  },
  {
    key: 'wallet',
    label: 'Wallet',
    icon: <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />,
    route: '/wallet',
  },
];

interface BottomNavigationProps {
  activeRoute?: string;
}

export default function BottomNavigation({ activeRoute = '/' }: BottomNavigationProps) {
  const { bottom } = useSafeAreaInsets();
  const animatedValues = React.useRef(
    navItems.reduce((acc, item) => {
      acc[item.key] = new Animated.Value(item.route === activeRoute ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const scaleValues = React.useRef(
    navItems.reduce((acc, item) => {
      acc[item.key] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  React.useEffect(() => {
    navItems.forEach((item) => {
      const isActive = item.route === activeRoute;
      Animated.parallel([
        Animated.timing(animatedValues[item.key], {
          toValue: isActive ? 1 : 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.spring(scaleValues[item.key], {
          toValue: isActive ? 1.1 : 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeRoute, animatedValues, scaleValues]);

  const handlePress = (item: NavItem) => {
    if (item.route !== activeRoute) {
      // Add press animation - scale down to 0.85 for more noticeable effect
      Animated.sequence([
        Animated.timing(scaleValues[item.key], {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValues[item.key], {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      router.push(item.route);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = item.route === activeRoute;
          
          const backgroundColor = animatedValues[item.key].interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', '#FFFFFF'],
          });

          const iconColor = animatedValues[item.key].interpolate({
            inputRange: [0, 1],
            outputRange: ['#FFFFFF', '#000000'],
          });

          const textColor = animatedValues[item.key].interpolate({
            inputRange: [0, 1],
            outputRange: ['#FFFFFF', '#000000'],
          });

          const opacity = animatedValues[item.key].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.activeBackground,
                  {
                    backgroundColor,
                    transform: [{ scale: scaleValues[item.key] }],
                  },
                ]}
              />
              
              <View style={styles.iconContainer}>
                <Animated.View style={{ transform: [{ scale: scaleValues[item.key] }] }}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, {
                    color: isActive ? '#000000' : '#FFFFFF',
                  })}
                </Animated.View>
                
                {item.hasBadge && (
                  <Animated.View 
                    style={[
                      styles.badge,
                      { opacity: animatedValues[item.key] }
                    ]}
                  >
                    <RTLText style={styles.badgeText}>{item.badgeText}</RTLText>
                  </Animated.View>
                )}
              </View>
              
              <Animated.View style={{ opacity }}>
                <RTLText style={[styles.label, { color: isActive ? '#000000' : '#FFFFFF' }]}>
                  {item.label}
                </RTLText>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1A2136',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#23D5AB20',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F9CB40',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    textAlign: 'center',
  },
});
