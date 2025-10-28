import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import AppBottomNavigation from '../components/AppBottomNavigation';
import AuthLoadingScreen from '../../components/AuthLoadingScreen';
import RouteErrorBoundary from '../../components/RouteErrorBoundary';

export default function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/splash" />;
  }

  return (
    <RouteErrorBoundary routeName="Main App" fallbackRoute="/(auth)/splash">
      <View style={styles.container}>
        <Slot initialRouteName="home" />
        <AppBottomNavigation />
      </View>
    </RouteErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
