import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Keyboard } from 'react-native';

interface UseModalCleanupOptions {
  onCleanup?: () => void;
  cleanupDelay?: number;
}

/**
 * Custom hook for properly cleaning up modal resources
 * Handles event listeners, timers, and subscriptions
 */
export function useModalCleanup(options: UseModalCleanupOptions = {}) {
  const { onCleanup, cleanupDelay = 0 } = options;
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateSubscriptionRef = useRef<any>(null);
  const keyboardSubscriptionsRef = useRef<any[]>([]);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cleanup function that can be called manually
  const cleanup = useCallback(() => {
    if (!isMountedRef.current) return;

    // Clear any pending timeouts
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Remove app state listener
    if (appStateSubscriptionRef.current) {
      appStateSubscriptionRef.current.remove();
      appStateSubscriptionRef.current = null;
    }

    // Remove keyboard listeners
    keyboardSubscriptionsRef.current.forEach(sub => sub?.remove());
    keyboardSubscriptionsRef.current = [];

    // Call custom cleanup function
    if (onCleanup) {
      onCleanup();
    }
  }, [onCleanup]);

  // Setup app state listener
  const setupAppStateListener = useCallback((handler: (state: AppStateStatus) => void) => {
    // Remove existing listener
    if (appStateSubscriptionRef.current) {
      appStateSubscriptionRef.current.remove();
    }

    // Add new listener
    appStateSubscriptionRef.current = AppState.addEventListener('change', handler);
  }, []);

  // Setup keyboard listeners
  const setupKeyboardListeners = useCallback((
    onShow?: () => void,
    onHide?: () => void
  ) => {
    // Clear existing listeners
    keyboardSubscriptionsRef.current.forEach(sub => sub?.remove());
    keyboardSubscriptionsRef.current = [];

    if (onShow) {
      const showSub = Keyboard.addListener('keyboardDidShow', onShow);
      keyboardSubscriptionsRef.current.push(showSub);
    }

    if (onHide) {
      const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
      keyboardSubscriptionsRef.current.push(hideSub);
    }
  }, []);

  // Schedule cleanup with delay
  const scheduleCleanup = useCallback(() => {
    if (cleanupDelay > 0) {
      cleanupTimeoutRef.current = setTimeout(() => {
        cleanup();
      }, cleanupDelay);
    } else {
      cleanup();
    }
  }, [cleanup, cleanupDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    cleanup,
    scheduleCleanup,
    setupAppStateListener,
    setupKeyboardListeners,
    isMounted: () => isMountedRef.current,
  };
}

