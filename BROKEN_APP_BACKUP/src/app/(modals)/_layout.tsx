import React from 'react';
import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}
    >
      {/* Modal Screens */}
      <Stack.Screen
        name="job-posting"
        options={{
          gestureEnabled: true, // Allow swipe to dismiss
        }}
      />
      <Stack.Screen
        name="job/[id]"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="offer-submission"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="escrow-payment"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="chat/[jobId]"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="wallet/[userId]"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="apply/[jobId]"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="create-guild"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guild"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guilds"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guild-map"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="leads-feed"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="my-jobs"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="profile-settings"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="wallet"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="add-job"
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
