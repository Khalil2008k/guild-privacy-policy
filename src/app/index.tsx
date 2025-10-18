import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AuthLoadingScreen from '../components/AuthLoadingScreen';

export default function Index() {
  const { user, loading } = useAuth();

  console.log('🔥 INDEX: Component rendered', { user: !!user, loading });

  if (loading) {
    console.log('🔥 INDEX: Still loading, showing AuthLoadingScreen');
    return <AuthLoadingScreen />;
  }

  // If user is authenticated, go directly to home
  if (user) {
    console.log('🔥 INDEX: User authenticated, redirecting to home');
    return <Redirect href="/(main)/home" />;
  }

  // If not authenticated, show splash first
  console.log('🔥 INDEX: No user, redirecting to splash');
  return <Redirect href="/(auth)/splash" />;
}