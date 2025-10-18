import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 500,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* Splash Screen */}
      <Stack.Screen
        name="splash"
        options={{
          gestureEnabled: false, // No swipe back from splash
        }}
      />

      {/* Onboarding Flow */}
      <Stack.Screen
        name="onboarding/1"
        options={{
          gestureEnabled: false, // No swipe back during onboarding
          animation: 'fade_from_bottom',
          animationDuration: 600,
        }}
      />
      <Stack.Screen
        name="onboarding/2"
        options={{
          gestureEnabled: false,
          animation: 'slide_from_right',
          animationDuration: 500,
        }}
      />
      <Stack.Screen
        name="onboarding/3"
        options={{
          gestureEnabled: false,
          animation: 'slide_from_right',
          animationDuration: 500,
        }}
      />

      {/* Authentication Screens */}
      <Stack.Screen
        name="signin"
        options={{
          gestureEnabled: true, // Allow back navigation between auth screens
          animation: 'fade_from_bottom',
          animationDuration: 500,
        }}
      />
      <Stack.Screen
        name="signup/1"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="signup/2"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="signup/3"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

    </Stack>
  );
}
