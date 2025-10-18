
// Advanced Animations with React Native Reanimated
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withDecay,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Advanced spring animation configuration
const SPRING_CONFIG = {
  damping: 10,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

// Advanced timing configuration
const TIMING_CONFIG = {
  duration: 300,
  easing: 'ease-in-out',
};

export function AdvancedAnimationDemo() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Pan gesture handler with advanced physics
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;

      // Dynamic scaling based on distance moved
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      const scaleFactor = Math.max(0.5, Math.min(2, 1 + distance / 200));
      scale.value = withSpring(scaleFactor, SPRING_CONFIG);
    },
    onEnd: (event, ctx) => {
      // Apply decay animation for natural momentum
      translateX.value = withDecay({
        velocity: event.velocityX,
        clamp: [-screenWidth / 2, screenWidth / 2],
      });

      translateY.value = withDecay({
        velocity: event.velocityY,
        clamp: [-screenHeight / 2, screenHeight / 2],
      });

      // Return scale to normal
      scale.value = withSpring(1, SPRING_CONFIG);
    },
  });

  // Advanced animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` },
    ],
    opacity: opacity.value,
  }));

  // Rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      rotation.value = withTiming(rotation.value + Math.PI * 2, TIMING_CONFIG);
    }, 3000);

    return () => clearInterval(interval);
  }, [rotation]);

  // Pulsing opacity animation
  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withTiming(opacity.value === 1 ? 0.5 : 1, TIMING_CONFIG);
    }, 1000);

    return () => clearInterval(interval);
  }, [opacity]);

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={panGestureHandler}>
        <Animated.View style={[styles.box, animatedStyle]}>
          <Text style={styles.text}>Advanced Animation</Text>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// Layout animation component
export function LayoutAnimationDemo() {
  const [showSecondBox, setShowSecondBox] = React.useState(false);

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.box}
        entering={withTiming(TIMING_CONFIG)}
        exiting={withTiming(TIMING_CONFIG)}
      >
        <Text style={styles.text}>First Box</Text>
      </Animated.View>

      {showSecondBox && (
        <Animated.View
          style={styles.box}
          entering={withSpring(SPRING_CONFIG)}
          exiting={withTiming(TIMING_CONFIG)}
        >
          <Text style={styles.text}>Second Box</Text>
        </Animated.View>
      )}

      <Text
        style={styles.button}
        onPress={() => setShowSecondBox(!showSecondBox)}
      >
        Toggle Second Box
      </Text>
    </View>
  );
}

// Scroll-based animation
export function ScrollAnimationDemo() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, 100],
      [200, 100],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      scrollY.value,
      [0, 50],
      [1, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.headerText}>Scroll-based Animation</Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {Array.from({ length: 50 }, (_, i) => (
          <View key={i} style={styles.scrollItem}>
            <Text>Item {i + 1}</Text>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

// Custom animation hook
export function useAdvancedAnimation() {
  const animatedValue = useSharedValue(0);

  const animateTo = useCallback((toValue: number, config = TIMING_CONFIG) => {
    animatedValue.value = withTiming(toValue, config);
  }, [animatedValue]);

  const springTo = useCallback((toValue: number, config = SPRING_CONFIG) => {
    animatedValue.value = withSpring(toValue, config);
  }, [animatedValue]);

  const decayTo = useCallback((velocity: number) => {
    animatedValue.value = withDecay({ velocity });
  }, [animatedValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedValue.value }],
  }));

  return {
    animatedValue,
    animateTo,
    springTo,
    decayTo,
    animatedStyle,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: 150,
    height: 150,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollItem: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
});
