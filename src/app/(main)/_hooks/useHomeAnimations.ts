/**
 * useHomeAnimations Hook
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from home.tsx (lines 75-192)
 * Purpose: Manages all animation logic for home screen buttons and job cards
 */

import { useRef, useEffect, useCallback, RefObject } from 'react';
import { Animated } from 'react-native';

interface UseHomeAnimationsReturn {
  button1Anim: Animated.Value;
  button2Anim: Animated.Value;
  headerButton1Anim: Animated.Value;
  headerButton2Anim: Animated.Value;
  headerButton3Anim: Animated.Value;
  headerButton4Anim: Animated.Value;
  jobCardAnims: Animated.Value[];
  animateButtons: () => void;
  animationTimeoutRef: RefObject<NodeJS.Timeout | null>;
}

export const useHomeAnimations = (): UseHomeAnimationsReturn => {
  // Animation refs for action buttons
  const button1Anim = useRef(new Animated.Value(0)).current;
  const button2Anim = useRef(new Animated.Value(0)).current;
  
  // Animation refs for header buttons
  const headerButton1Anim = useRef(new Animated.Value(0)).current;
  const headerButton2Anim = useRef(new Animated.Value(0)).current;
  const headerButton3Anim = useRef(new Animated.Value(0)).current;
  const headerButton4Anim = useRef(new Animated.Value(0)).current;
  
  // Animation refs for job cards (support up to 10 cards)
  const jobCardAnims = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Animation timeout ref for cleanup (declared before useEffect)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation function for buttons - memoized to prevent infinite loops
  const animateButtons = useCallback(() => {
    // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Reset animation values
    button1Anim.setValue(0);
    button2Anim.setValue(0);
    headerButton1Anim.setValue(0);
    headerButton2Anim.setValue(0);
    headerButton3Anim.setValue(0);
    headerButton4Anim.setValue(0);
    jobCardAnims.forEach(anim => anim.setValue(0));
    
    // Animate header buttons one by one: 1 → 2 → 3 → 4
    Animated.stagger(100, [ // 100ms delay between each button
      Animated.timing(headerButton1Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerButton2Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerButton3Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerButton4Anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Then animate action buttons together (same speed as header buttons)
    Animated.parallel([
      Animated.timing(button1Anim, {
        toValue: 1,
        duration: 300, // Same duration as header buttons
        useNativeDriver: true,
      }),
      Animated.timing(button2Anim, {
        toValue: 1,
        duration: 300, // Same duration as header buttons
        useNativeDriver: true,
      }),
    ]).start();
    
    // COMMENT: PRODUCTION HARDENING - Task 5.1 - Store timeout ID for cleanup
    // Animate job cards with stagger (one by one, same speed)
    animationTimeoutRef.current = setTimeout(() => {
      animationTimeoutRef.current = null;
      Animated.stagger(100, 
        jobCardAnims.map(anim => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ).start();
    }, 100); // Small delay after buttons
  }, [button1Anim, button2Anim, headerButton1Anim, headerButton2Anim, headerButton3Anim, headerButton4Anim, jobCardAnims, animationTimeoutRef]);

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Cleanup animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    button1Anim,
    button2Anim,
    headerButton1Anim,
    headerButton2Anim,
    headerButton3Anim,
    headerButton4Anim,
    jobCardAnims,
    animateButtons,
    animationTimeoutRef,
  };
};

