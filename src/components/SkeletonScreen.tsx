import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface SkeletonScreenProps {
  children: React.ReactNode;
  isLoading: boolean;
  duration?: number;
  backgroundColor?: string;
  highlightColor?: string;
}

/**
 * Individual skeleton placeholder component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
}) => {
  const { theme } = useTheme();
  const { settings } = useAccessibility();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (settings.reduceMotionEnabled) return;

    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue, settings.reduceMotionEnabled]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  if (children) {
    return <>{children}</>;
  }

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.surface,
          overflow: 'hidden',
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    >
      {!settings.reduceMotionEnabled && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              theme.background + '40',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Skeleton screen wrapper that shows skeletons while loading
 */
export const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  children,
  isLoading,
  duration = 300,
  backgroundColor,
  highlightColor,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim, duration]);

  if (!isLoading) {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={{ backgroundColor: backgroundColor || theme.background }}>
      {React.Children.map(children, (child) =>
        renderSkeletonForChild(child as React.ReactElement)
      )}
    </View>
  );
};

// Helper function to render skeleton versions of components
function renderSkeletonForChild(child: React.ReactElement): React.ReactNode {
  if (!child) return null;

  const { type, props } = child;

  // Map component types to skeleton representations
  if (typeof type === 'string') {
    switch (type) {
      case 'Text':
        return (
          <Skeleton
            width={props.style?.width || '80%'}
            height={props.style?.fontSize || 16}
            style={props.style}
          />
        );
      case 'Image':
        return (
          <Skeleton
            width={props.style?.width || 100}
            height={props.style?.height || 100}
            borderRadius={props.style?.borderRadius || 0}
            style={props.style}
          />
        );
      case 'View':
        return (
          <View style={props.style}>
            {React.Children.map(props.children, (child) =>
              renderSkeletonForChild(child as React.ReactElement)
            )}
          </View>
        );
      default:
        return <Skeleton />;
    }
  }

  // For custom components, try to render children
  if (props.children) {
    return (
      <View style={props.style}>
        {React.Children.map(props.children, (child) =>
          renderSkeletonForChild(child as React.ReactElement)
        )}
      </View>
    );
  }

  return <Skeleton />;
}

// Pre-built skeleton layouts
export const SkeletonLayouts = {
  // List item skeleton
  ListItem: () => {
    const { theme } = useTheme();
    return (
      <View style={[styles.listItem, { backgroundColor: theme.surface }]}>
        <Skeleton width={60} height={60} borderRadius={30} />
        <View style={styles.listItemContent}>
          <Skeleton width="70%" height={18} />
          <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
          <Skeleton width="50%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    );
  },

  // Card skeleton
  Card: () => {
    const { theme } = useTheme();
    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Skeleton width="100%" height={200} borderRadius={8} />
        <View style={styles.cardContent}>
          <Skeleton width="80%" height={20} />
          <Skeleton width="100%" height={14} style={{ marginTop: 12 }} />
          <Skeleton width="95%" height={14} style={{ marginTop: 4 }} />
          <Skeleton width="60%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    );
  },

  // Profile skeleton
  Profile: () => {
    const { theme } = useTheme();
    return (
      <View style={[styles.profile, { backgroundColor: theme.background }]}>
        <Skeleton width={120} height={120} borderRadius={60} />
        <Skeleton width="60%" height={24} style={{ marginTop: 16 }} />
        <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
        <View style={styles.profileStats}>
          <Skeleton width={80} height={40} />
          <Skeleton width={80} height={40} />
          <Skeleton width={80} height={40} />
        </View>
      </View>
    );
  },

  // Grid skeleton
  Grid: ({ columns = 2 }: { columns?: number }) => {
    const { theme } = useTheme();
    const itemWidth = (screenWidth - 32 - (columns - 1) * 12) / columns;
    
    return (
      <View style={styles.grid}>
        {[...Array(columns * 3)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.gridItem,
              { 
                backgroundColor: theme.surface,
                width: itemWidth,
              },
            ]}
          >
            <Skeleton width="100%" height={itemWidth} borderRadius={8} />
            <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
            <Skeleton width="60%" height={14} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    );
  },
};

const styles = StyleSheet.create({
  // List item styles
  listItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  // Card styles
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  // Profile styles
  profile: {
    alignItems: 'center',
    padding: 24,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 24,
  },
  // Grid styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  gridItem: {
    borderRadius: 8,
    padding: 12,
  },
});

export default SkeletonScreen;

