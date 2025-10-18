import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 350, // Slightly faster for smoother feel
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animationTypeForReplace: 'push', // Smooth replace animations
      }}
    >
      {/* Splash Screen */}
      <Stack.Screen
        name="splash"
        options={{
          gestureEnabled: false, // No swipe back from splash
          animation: 'fade',
          animationDuration: 300,
        }}
      />

      {/* Onboarding Flow - Smooth horizontal slides */}
      <Stack.Screen
        name="onboarding/1"
        options={{
          gestureEnabled: true, // Enable swipe navigation
          animation: 'slide_from_right',
          animationDuration: 350,
          gestureDirection: 'horizontal',
        }}
      />
      <Stack.Screen
        name="onboarding/2"
        options={{
          gestureEnabled: true, // Enable swipe back to previous
          animation: 'slide_from_right',
          animationDuration: 350,
          gestureDirection: 'horizontal',
        }}
      />
      <Stack.Screen
        name="onboarding/3"
        options={{
          gestureEnabled: true, // Enable swipe back to previous
          animation: 'slide_from_right',
          animationDuration: 350,
          gestureDirection: 'horizontal',
        }}
      />

      {/* Authentication Screens - Smooth vertical slides */}
      <Stack.Screen
        name="welcome"
        options={{
          gestureEnabled: true, // Allow back to onboarding
          animation: 'slide_from_bottom',
          animationDuration: 400,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          gestureEnabled: true, // Allow back navigation
          animation: 'slide_from_bottom',
          animationDuration: 350,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 350,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="signup-complete"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 350,
          gestureDirection: 'horizontal',
        }}
      />

      {/* Two-Factor Authentication */}
      <Stack.Screen
        name="two-factor-auth"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="two-factor-setup"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />

      {/* Biometric Setup */}
      <Stack.Screen
        name="biometric-setup"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 400,
        }}
      />

      {/* Account Recovery */}
      <Stack.Screen
        name="account-recovery"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="account-recovery-complete"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />

      {/* Profile Completion */}
      <Stack.Screen
        name="profile-completion"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 400,
        }}
      />

      {/* Email Verification */}
      <Stack.Screen
        name="email-verification"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />

      {/* Phone Verification */}
      <Stack.Screen
        name="phone-verification"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 400,
        }}
      />

      {/* Terms & Conditions */}
      <Stack.Screen
        name="terms-conditions"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />

      {/* Privacy Policy */}
      <Stack.Screen
        name="privacy-policy"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />

      {/* Welcome Tutorial */}
      <Stack.Screen
        name="welcome-tutorial"
        options={{
          gestureEnabled: false,
          animation: 'fade_from_bottom',
          animationDuration: 500,
        }}
      />

    </Stack>
  );
}
