import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';

export default function MainLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <AppBottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
