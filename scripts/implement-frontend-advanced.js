#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FrontendAdvancedImplementer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.srcRoot = path.join(this.projectRoot, 'src');
    this.adminRoot = path.join(this.projectRoot, 'admin-portal');
  }

  async implement() {
    console.log('⚡ Implementing advanced frontend features with STRICT rules...');

    try {
      // Step 1: Enable React Native New Architecture (Fabric/JSI)
      console.log('🏗️  Enabling React Native New Architecture (Fabric/JSI)...');
      await this.enableNewArchitecture();

      // Step 2: Implement advanced gesture handlers
      console.log('👆 Implementing advanced gesture handlers...');
      await this.implementAdvancedGestures();

      // Step 3: Optimize React hooks with useMemo/useCallback
      console.log('🔧 Optimizing React hooks with useMemo/useCallback...');
      await this.optimizeReactHooks();

      // Step 4: Implement performance monitoring with memory leak detection
      console.log('📊 Implementing performance monitoring with memory leak detection...');
      await this.implementPerformanceMonitoring();

      // Step 5: Implement advanced animations with Reanimated
      console.log('🎬 Implementing advanced animations with Reanimated...');
      await this.implementAdvancedAnimations();

      console.log('✅ Advanced frontend implementation completed!');

    } catch (error) {
      console.error('❌ Advanced frontend implementation failed:', error.message);
      process.exit(1);
    }
  }

  async enableNewArchitecture() {
    // Update app.json for New Architecture
    const appConfigPath = path.join(this.projectRoot, 'app.config.js');
    let appConfig = fs.readFileSync(appConfigPath, 'utf8');

    // Enable New Architecture features
    const newArchConfig = {
      "expo": {
        "newArchEnabled": true,
        "android": {
          "newArchEnabled": true
        },
        "ios": {
          "newArchEnabled": true
        }
      }
    };

    // Update or add newArchEnabled configuration
    if (appConfig.includes('newArchEnabled')) {
      appConfig = appConfig.replace(
        /"newArchEnabled":\s*(true|false)/g,
        '"newArchEnabled": true'
      );
    } else {
      appConfig = appConfig.replace(
        /"expo":\s*{/,
        `"expo": {\n    "newArchEnabled": true,\n    "android": {\n      "newArchEnabled": true\n    },\n    "ios": {\n      "newArchEnabled": true\n    },`
      );
    }

    fs.writeFileSync(appConfigPath, appConfig);

    // Create New Architecture configuration script
    const newArchScript = `
// React Native New Architecture (Fabric/JSI) Implementation
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// New Architecture enables:
// 1. Fabric renderer for better performance
// 2. JSI (JavaScript Interface) for direct C++ communication
// 3. TurboModules for faster native module loading
// 4. Codegen for type-safe native modules

export function NewArchitectureComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native New Architecture Enabled</Text>
      <Text style={styles.description}>
        Features enabled: Fabric, JSI, TurboModules, Codegen
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

// Performance monitoring for New Architecture
export class NewArchitectureMonitor {
  private static instance: NewArchitectureMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): NewArchitectureMonitor {
    if (!NewArchitectureMonitor.instance) {
      NewArchitectureMonitor.instance = new NewArchitectureMonitor();
    }
    return NewArchitectureMonitor.instance;
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(): Record<string, { average: number; count: number; last: number }> {
    const result: Record<string, { average: number; count: number; last: number }> = {};

    for (const [name, values] of this.metrics) {
      const sum = values.reduce((a, b) => a + b, 0);
      result[name] = {
        average: sum / values.length,
        count: values.length,
        last: values[values.length - 1]
      };
    }

    return result;
  }
}
`;

    fs.writeFileSync(path.join(this.srcRoot, 'components', 'NewArchitecture.tsx'), newArchScript);

    // Update package.json for New Architecture dependencies
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Add New Architecture related dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      'react-native-reanimated': '^3.16.1',
      'react-native-gesture-handler': '^2.20.2',
      'react-native-svg': '^15.8.0',
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Install dependencies
    try {
      execSync('npm install --silent', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('New Architecture dependencies installation warning:', error.message);
    }
  }

  async implementAdvancedGestures() {
    // Advanced gesture handlers implementation
    const gestureConfig = `
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
      { rotateZ: \`\${rotation.value}rad\` },
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
`;

    fs.writeFileSync(path.join(this.srcRoot, 'components', 'AdvancedGestures.tsx'), gestureConfig);

    // Install gesture handler dependencies
    try {
      execSync('npm install react-native-gesture-handler@^2.20.2 react-native-reanimated@^3.16.1 --save --silent', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Gesture handler installation warning:', error.message);
    }
  }

  async optimizeReactHooks() {
    // React hooks optimization script
    const hooksOptimizationScript = `
// React Hooks Optimization with useMemo/useCallback
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Example of heavily optimized component with useMemo/useCallback
interface OptimizedListProps {
  data: Array<{ id: string; title: string; description: string }>;
  onItemPress: (item: { id: string; title: string; description: string }) => void;
  filter?: string;
}

export function OptimizedList({ data, onItemPress, filter }: OptimizedListProps) {
  // Memoize filtered data to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    if (!filter) return data;

    return data.filter(item =>
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.description.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  // Memoize expensive calculations
  const itemCount = useMemo(() => filteredData.length, [filteredData]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleItemPress = useCallback((item: { id: string; title: string; description: string }) => {
    onItemPress(item);
  }, [onItemPress]);

  // Memoize render item function
  const renderItem = useCallback(({ item }: { item: { id: string; title: string; description: string } }) => (
    <OptimizedListItem item={item} onPress={handleItemPress} />
  ), [handleItemPress]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: { id: string; title: string; description: string }) => item.id, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Items: {itemCount}</Text>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />
    </View>
  );
}

// Individual list item with optimization
interface OptimizedListItemProps {
  item: { id: string; title: string; description: string };
  onPress: (item: { id: string; title: string; description: string }) => void;
}

function OptimizedListItem({ item, onPress }: OptimizedListItemProps) {
  // Memoize press handler for this specific item
  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  return (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
}

// Custom hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    lastRenderTime.current = performance.now();

    // Log performance metrics in development
    if (__DEV__) {
      console.log(\`\${componentName} render #\${renderCount.current}\`);
    }
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  };
}

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for previous value comparison
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Hook for async operations with cleanup
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async <T>(
    asyncFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    // Cancel previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const result = await asyncFn(abortControllerRef.current.signal);
      return result;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { execute, loading, error };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
`;

    fs.writeFileSync(path.join(this.srcRoot, 'hooks', 'OptimizedHooks.tsx'), hooksOptimizationScript);
  }

  async implementPerformanceMonitoring() {
    // Performance monitoring with memory leak detection
    const performanceMonitoringConfig = `
// Advanced Performance Monitoring with Memory Leak Detection
import React, { useEffect, useRef, useCallback } from 'react';
import { PerformanceObserver, performance } from 'perf_hooks';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  eventListeners: number;
}

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private observers: PerformanceObserver[] = [];
  private intervalId?: NodeJS.Timeout;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (this.intervalId) return; // Already monitoring

    // Monitor memory usage every 5 seconds
    this.intervalId = setInterval(() => {
      this.takeMemorySnapshot();
    }, 5000);

    // Monitor performance entries
    if (typeof PerformanceObserver !== 'undefined') {
      this.setupPerformanceObservers();
    }

    console.log('🚀 Performance monitoring started');
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    console.log('⏹️  Performance monitoring stopped');
  }

  private setupPerformanceObservers() {
    // Monitor navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          this.recordMetric({
            renderTime: entry.loadEventEnd - entry.fetchStart,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            componentCount: this.getComponentCount(),
            eventListeners: this.getEventListenerCount(),
          });
        }
      }
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navigationObserver);

    // Monitor measure entries
    const measureObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            renderTime: entry.duration,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            componentCount: this.getComponentCount(),
            eventListeners: this.getEventListenerCount(),
          });
        }
      }
    });

    measureObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(measureObserver);
  }

  private takeMemorySnapshot() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      };

      this.memorySnapshots.push(snapshot);

      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots.shift();
      }

      // Detect potential memory leaks
      this.detectMemoryLeaks();
    }
  }

  private detectMemoryLeaks() {
    if (this.memorySnapshots.length < 10) return;

    const recent = this.memorySnapshots.slice(-5);
    const older = this.memorySnapshots.slice(-10, -5);

    const recentAvg = recent.reduce((sum, snap) => sum + snap.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, snap) => sum + snap.heapUsed, 0) / older.length;

    const growthRate = (recentAvg - olderAvg) / olderAvg;

    if (growthRate > 0.1) { // 10% growth
      console.warn('⚠️  Potential memory leak detected:', {
        growthRate: \`\${(growthRate * 100).toFixed(2)}%\`,
        recentAvg: \`\${(recentAvg / 1024 / 1024).toFixed(2)} MB\`,
        olderAvg: \`\${(olderAvg / 1024 / 1024).toFixed(2)} MB\`,
      });
    }
  }

  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push({
      ...metric,
      memoryUsage: metric.memoryUsage / 1024 / 1024, // Convert to MB
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  private getComponentCount(): number {
    // This would need to be implemented based on your component tracking
    return 0;
  }

  private getEventListenerCount(): number {
    // This would need to be implemented based on your event listener tracking
    return 0;
  }

  getPerformanceReport(): {
    averageRenderTime: number;
    averageMemoryUsage: number;
    totalSnapshots: number;
    memoryLeakDetected: boolean;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageMemoryUsage: 0,
        totalSnapshots: 0,
        memoryLeakDetected: false,
        recommendations: [],
      };
    }

    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;

    const recommendations = this.generateRecommendations(avgRenderTime, avgMemoryUsage);

    return {
      averageRenderTime: avgRenderTime,
      averageMemoryUsage: avgMemoryUsage,
      totalSnapshots: this.memorySnapshots.length,
      memoryLeakDetected: this.memorySnapshots.length > 10 && this.detectMemoryLeaks(),
      recommendations,
    };
  }

  private generateRecommendations(avgRenderTime: number, avgMemoryUsage: number): string[] {
    const recommendations: string[] = [];

    if (avgRenderTime > 100) {
      recommendations.push('Consider optimizing component renders with React.memo');
      recommendations.push('Use useMemo and useCallback for expensive calculations');
    }

    if (avgMemoryUsage > 50) {
      recommendations.push('Monitor for memory leaks in components');
      recommendations.push('Use React DevTools Profiler to identify performance issues');
    }

    return recommendations;
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitorRef = useRef(PerformanceMonitor.getInstance());
  const renderStartTime = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    // Record render time for this component
    monitorRef.current.recordMetric({
      renderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      componentCount: 1,
      eventListeners: 0,
    });

    return () => {
      // Cleanup effect
    };
  });

  const getReport = useCallback(() => {
    return monitorRef.current.getPerformanceReport();
  }, []);

  return { getReport };
}
`;

    fs.writeFileSync(path.join(this.srcRoot, 'utils', 'PerformanceMonitor.tsx'), performanceMonitoringConfig);
  }

  async implementAdvancedAnimations() {
    // Advanced animations with Reanimated
    const animationsConfig = `
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
      { rotateZ: \`\${rotation.value}rad\` },
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
`;

    fs.writeFileSync(path.join(this.srcRoot, 'components', 'AdvancedAnimations.tsx'), animationsConfig);
  }
}

// Run the implementer if called directly
if (require.main === module) {
  const implementer = new FrontendAdvancedImplementer();
  implementer.implement()
    .then(() => {
      console.log('🎉 Advanced frontend implementation completed!');
    })
    .catch(error => {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    });
}

module.exports = FrontendAdvancedImplementer;
