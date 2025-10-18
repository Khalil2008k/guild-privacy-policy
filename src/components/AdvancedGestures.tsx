
// Advanced Gesture Handlers Implementation
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdvancedGestureViewProps {
  children: React.ReactNode;
  onGesture?: (gestureType: string, data: any) => void;
}

export function AdvancedGestureView({ children, onGesture }: AdvancedGestureViewProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onGesture)('pan_start', { x: translateX.value, y: translateY.value });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(onGesture)('pan_update', {
        translationX: event.translationX,
        translationY: event.translationY
      });
    })
    .onEnd(() => {
      runOnJS(onGesture)('pan_end', { x: translateX.value, y: translateY.value });
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(onGesture)('pinch_start', { scale: scale.value });
    })
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(3, event.scale));
      runOnJS(onGesture)('pinch_update', { scale: event.scale });
    })
    .onEnd(() => {
      runOnJS(onGesture)('pinch_end', { scale: scale.value });
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      runOnJS(onGesture)('rotation_start', { rotation: rotation.value });
    })
    .onUpdate((event) => {
      rotation.value = event.rotation;
      runOnJS(onGesture)('rotation_update', { rotation: event.rotation });
    })
    .onEnd(() => {
      runOnJS(onGesture)('rotation_end', { rotation: rotation.value });
    });

  // Fling gesture for fast swipes
  const flingGesture = Gesture.Fling()
    .direction('RIGHT' | 'LEFT' | 'UP' | 'DOWN')
    .onStart((event) => {
      runOnJS(onGesture)('fling_start', { direction: event.direction });
    })
    .onEnd((event, success) => {
      if (success) {
        runOnJS(onGesture)('fling_end', {
          direction: event.direction,
          velocity: Math.sqrt(event.xVelocity ** 2 + event.yVelocity ** 2)
        });
      }
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    Gesture.Exclusive(panGesture, flingGesture),
    Gesture.Exclusive(pinchGesture, rotationGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${rotation.value}rad` },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.animatedView, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

// Gesture performance monitor
export class GesturePerformanceMonitor {
  private static instance: GesturePerformanceMonitor;
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;

  static getInstance(): GesturePerformanceMonitor {
    if (!GesturePerformanceMonitor.instance) {
      GesturePerformanceMonitor.instance = new GesturePerformanceMonitor();
    }
    return GesturePerformanceMonitor.instance;
  }

  recordFrameTime() {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimes.push(frameTime);

      // Keep only last 1000 frames
      if (this.frameTimes.length > 1000) {
        this.frameTimes.shift();
      }
    }
    this.lastFrameTime = now;
  }

  getFPS(): number {
    if (this.frameTimes.length < 2) return 0;

    const totalTime = this.frameTimes.reduce((sum, time) => sum + time, 0);
    const averageFrameTime = totalTime / this.frameTimes.length;
    return Math.round(1000 / averageFrameTime);
  }

  getPerformanceMetrics(): {
    fps: number;
    averageFrameTime: number;
    p95FrameTime: number;
    p99FrameTime: number;
  } {
    if (this.frameTimes.length === 0) {
      return { fps: 0, averageFrameTime: 0, p95FrameTime: 0, p99FrameTime: 0 };
    }

    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      fps: this.getFPS(),
      averageFrameTime,
      p95FrameTime: sorted[p95Index] || 0,
      p99FrameTime: sorted[p99Index] || 0,
    };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedView: {
    flex: 1,
  },
});
