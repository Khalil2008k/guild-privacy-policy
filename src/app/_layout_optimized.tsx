import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import AuthProvider from '../contexts/AuthContext';
import { I18nProvider } from '../contexts/I18nProvider';
import { UserProfileProvider } from '../contexts/UserProfileContext';
import { RankingProvider } from '../contexts/RankingContext';
import { GuildProvider } from '../contexts/GuildContext';
import { GuildJobProvider } from '../contexts/GuildJobContext';
import NetworkProvider from '../contexts/NetworkContext';
import ErrorBoundary from '../components/ErrorBoundary';
import AppSplashScreen from '../components/AppSplashScreen';
import { BackendConnectionManager } from '../config/backend';
import { errorMonitoring } from '../services/errorMonitoring';
import { performanceMonitoring } from '../services/performanceMonitoring';
import { appCheckService } from '../services/appCheck';
import { useFonts, SignikaNegative_400Regular, SignikaNegative_700Bold } from '@expo-google-fonts/signika-negative';

// Font imports for additional fonts
const additionalFonts = {
  'NotoSansArabic_400Regular': require('../../assets/fonts/NotoSansArabic-Regular.ttf'),
};

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Load Google Fonts
  const [fontsLoaded, fontError] = useFonts({
    SignikaNegative_400Regular,
    SignikaNegative_700Bold,
  });

  // Load additional fonts in background
  useEffect(() => {
    if (fontsLoaded) {
      // Load additional fonts without blocking
      import('expo-font').then(({ loadAsync }) => {
        loadAsync(additionalFonts).catch((error) => {
          console.warn('Additional fonts failed to load:', error);
          errorMonitoring.reportError(error, 'low', {
            context: 'additional-font-loading',
          });
        });
      });
    }
  }, [fontsLoaded]);

  // Initialize services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize services in parallel
        await Promise.all([
          BackendConnectionManager.initialize(),
          errorMonitoring.initialize(),
          performanceMonitoring.initialize(),
          appCheckService.initialize(),
        ]);

        // Mark app as ready
        setAppReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        errorMonitoring.reportError(error as Error, 'high', {
          context: 'app-initialization',
        });
        // Continue anyway to prevent app from being stuck
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Hide splash when both fonts and app are ready
  useEffect(() => {
    if (fontsLoaded && appReady) {
      // Small delay for smooth transition
      setTimeout(() => {
        setShowSplash(false);
      }, 300);
    }
  }, [fontsLoaded, appReady]);

  // Show splash screen while loading
  if (!fontsLoaded || !appReady || showSplash || fontError) {
    return <AppSplashScreen isVisible={true} error={fontError} />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <I18nProvider>
            <UserProfileProvider>
              <RankingProvider>
                <GuildProvider>
                  <GuildJobProvider>
                    <NetworkProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: 'slide_from_right',
                          animationDuration: 400,
                        }}
                      >
                        <Stack.Screen name="index" />
                        <Stack.Screen
                          name="(auth)"
                          options={{
                            animation: 'fade_from_bottom',
                            animationDuration: 500,
                          }}
                        />
                        <Stack.Screen
                          name="(main)"
                          options={{
                            animation: 'fade_from_bottom',
                            animationDuration: 400,
                          }}
                        />
                        <Stack.Screen
                          name="(modals)"
                          options={{
                            animation: 'slide_from_bottom',
                            animationDuration: 300,
                            presentation: 'modal',
                          }}
                        />
                      </Stack>
                    </NetworkProvider>
                  </GuildJobProvider>
                </GuildProvider>
              </RankingProvider>
            </UserProfileProvider>
          </I18nProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
