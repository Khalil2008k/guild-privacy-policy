import React, { useEffect, useRef, memo } from 'react';
import {
  Modal,
  ModalProps,
  View,
  StyleSheet,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';
import { useModalCleanup } from '../hooks/useModalCleanup';
import { useDimensionListener } from '../hooks/useDimensionListener';

interface SafeModalProps extends ModalProps {
  children: React.ReactNode;
  onCleanup?: () => void;
  enableBackHandler?: boolean;
  enableDimensionListener?: boolean;
}

/**
 * Memory-safe Modal component that properly cleans up resources
 * Prevents memory leaks by handling event listeners and animations
 */
export const SafeModal = memo(({
  children,
  visible = false,
  onCleanup,
  onRequestClose,
  enableBackHandler = true,
  enableDimensionListener = false,
  animationType = 'fade',
  ...restProps
}: SafeModalProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dimensions = enableDimensionListener ? useDimensionListener() : null;
  
  const { cleanup, setupAppStateListener, isMounted } = useModalCleanup({
    onCleanup: () => {
      // Clean up animations
      fadeAnim.stopAnimation();
      onCleanup?.();
    },
  });

  // Handle back button on Android
  useEffect(() => {
    if (!visible || !enableBackHandler || Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onRequestClose) {
        onRequestClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onRequestClose, enableBackHandler]);

  // Handle fade animation
  useEffect(() => {
    if (animationType !== 'fade') return;

    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    return () => {
      fadeAnim.stopAnimation();
    };
  }, [visible, fadeAnim, animationType]);

  // Setup app state listener to pause/resume when app goes to background
  useEffect(() => {
    if (!visible) return;

    setupAppStateListener((nextAppState) => {
      if (nextAppState === 'background') {
        // Pause any animations or timers
        fadeAnim.stopAnimation();
      }
    });
  }, [visible, setupAppStateListener, fadeAnim]);

  // Don't render if not visible and not animating
  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      onRequestClose={onRequestClose}
      {...restProps}
    >
      <View style={styles.container}>
        {children}
      </View>
    </Modal>
  );
});

SafeModal.displayName = 'SafeModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Higher-order component to wrap any modal with memory leak prevention
 */
export function withSafeModal<P extends object>(
  ModalComponent: React.ComponentType<P>
): React.ComponentType<P & { onCleanup?: () => void }> {
  return memo((props: P & { onCleanup?: () => void }) => {
    const { cleanup } = useModalCleanup({
      onCleanup: props.onCleanup,
    });

    useEffect(() => {
      return () => {
        cleanup();
      };
    }, [cleanup]);

    return <ModalComponent {...props} />;
  });
}

