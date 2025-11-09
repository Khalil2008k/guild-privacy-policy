import React from 'react';
import { Stack } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';

export default function ModalLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // 🎯 iPad Fix: Use fullScreenModal on tablets to prevent small card presentation
        presentation: (Platform.OS === 'ios' && isTablet) ? 'fullScreenModal' : 'modal',
        animation: 'slide_from_bottom',
      }}
    >
      {/* Modal Screens */}
      <Stack.Screen
        name="add-job"
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
        name="chat-options"
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
        name="notification-preferences"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guild-member"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guild-vice-master"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guild-master"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="job-search"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="user-settings"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="notifications-center"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="wallet-dashboard"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="bank-account-setup"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="identity-verification"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="job-templates"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="contract-generator"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="announcement-center"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="feedback-system"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="knowledge-base"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="security-center"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guild-creation-wizard"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="guild-analytics"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="member-management"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="backup-code-generator"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="document-quality-check"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="permission-matrix"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="invoice-line-items"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="refund-processing-status"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="certificate-expiry-tracker"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="performance-benchmarks"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="currency-conversion-history"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="notification-test"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="job-posting"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="performance-dashboard"
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
