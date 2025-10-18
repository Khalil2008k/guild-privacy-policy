import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Text,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AppSplashScreenProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  error?: Error | null;
}

/**
 * Beautiful animated splash screen that shows while fonts are loading
 * Prevents white flash and provides smooth transition
 */
export default function AppSplashScreen({
  isVisible,
  onAnimationComplete,
  error,
}: AppSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVisible) {
      // Fade out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [isVisible, fadeAnim, scaleAnim, onAnimationComplete]);

  useEffect(() => {
    // Subtle logo rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [logoRotation]);

  const rotation = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          {/* Guild Logo - Using text since logo file doesn't exist */}
          <View style={styles.logoTextContainer}>
            <View style={styles.shieldIcon}>
              <Text style={styles.shieldText}>🛡️</Text>
            </View>
            <Text style={styles.logoText}>GUILD</Text>
          </View>
        </Animated.View>

        <View style={styles.loadingContainer}>
          {error ? (
            <Text style={styles.errorText}>
              Loading error: {error.message}
            </Text>
          ) : (
            <>
              <Text style={styles.loadingText}>Loading...</Text>
              <View style={styles.loadingBar}>
                <Animated.View
                  style={[
                    styles.loadingProgress,
                    {
                      width: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['100%', '0%'],
                      }),
                    },
                  ]}
                />
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 50,
  },
  logoTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    marginBottom: 16,
  },
  shieldText: {
    fontSize: 80,
    textAlign: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'SignikaNegative_700Bold',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    width: width * 0.6,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'SignikaNegative_400Regular',
    marginBottom: 16,
    opacity: 0.8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontFamily: 'SignikaNegative_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingBar: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
    overflow: 'hidden',
    width: '100%',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 1,
  },
});
