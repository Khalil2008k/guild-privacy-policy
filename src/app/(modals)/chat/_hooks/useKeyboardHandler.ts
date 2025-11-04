/**
 * useKeyboardHandler Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from chat/[jobId].tsx (lines 347-384)
 * Purpose: Handle keyboard events, scroll to bottom, and keyboard height tracking
 */

import { useState, useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import { logger } from '@/utils/logger';

interface UseKeyboardHandlerOptions {
  chatId: string;
  onKeyboardHide?: () => void;
  scrollViewRef: React.RefObject<any>;
}

interface UseKeyboardHandlerReturn {
  keyboardHeight: number;
  setKeyboardHeight: (height: number) => void;
}

export const useKeyboardHandler = ({
  chatId,
  onKeyboardHide,
  scrollViewRef,
}: UseKeyboardHandlerOptions): UseKeyboardHandlerReturn => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear existing timeout and store new one
        if (keyboardScrollTimeoutRef.current) {
          clearTimeout(keyboardScrollTimeoutRef.current);
        }
        // Scroll to bottom when keyboard appears
        keyboardScrollTimeoutRef.current = setTimeout(() => {
          keyboardScrollTimeoutRef.current = null;
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        if (onKeyboardHide) {
          onKeyboardHide();
        }
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear keyboard scroll timeout
      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
        keyboardScrollTimeoutRef.current = null;
      }
    };
  }, [chatId, onKeyboardHide, scrollViewRef]);

  return {
    keyboardHeight,
    setKeyboardHeight,
  };
};

export default useKeyboardHandler;
