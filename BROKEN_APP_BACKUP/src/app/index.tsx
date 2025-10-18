import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AuthLoadingScreen from '../components/AuthLoadingScreen';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Redirect href="/(main)/home" />;
  }

  return <Redirect href="/(auth)/splash" />;
}