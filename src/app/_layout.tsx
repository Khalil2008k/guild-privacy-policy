import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../contexts/ThemeContext';
import AuthProvider from '../contexts/AuthContext';
import { I18nProvider } from '../contexts/I18nProvider';
import { UserProfileProvider } from '../contexts/UserProfileContext';
import { RankingProvider } from '../contexts/RankingContext';
import { GuildProvider } from '../contexts/GuildContext';
import { GuildJobProvider } from '../contexts/GuildJobContext';
import { ChatProvider } from '../contexts/ChatContext';
import NetworkProvider from '../contexts/NetworkContext';
import ErrorBoundary from '../components/ErrorBoundary';
import AppSplashScreen from '../components/AppSplashScreen';
import { BackendConnectionManager } from '../config/backend';
import { errorMonitoring } from '../services/errorMonitoring';
import { performanceMonitoring } from '../services/performanceMonitoring';
import { appCheckService } from '../services/appCheck';
import { CustomAlertProvider } from '../services/CustomAlertService';
import { PaymentSheetProvider } from '../services/PaymentSheetService';
import { RealPaymentProvider } from '../contexts/RealPaymentContext';

// ⚡⚡⚡ LUDICROUS SPEED - 1ms native splash!
// Execute synchronously at module parse - INSTANT!
Promise.resolve().then(() => {
  SplashScreen.hideAsync().catch(() => {});
});

export default function RootLayout() {
  // ULTRA FAST - No state delays, instant rendering
  // Initialize services immediately in background
  React.useLayoutEffect(() => {
    // Use layoutEffect for synchronous execution before paint
    Promise.allSettled([
      BackendConnectionManager.initialize(),
      errorMonitoring.initialize(),
      performanceMonitoring.initialize(),
      appCheckService.initialize(),
    ]).then(() => {
      console.log('✅ App services initialized');
    }).catch((error) => {
      console.error('App initialization error:', error);
    });
  }, []);

  return (
    <View style={styles.rootContainer}>
      <ErrorBoundary>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <UserProfileProvider>
                <RankingProvider>
                  <GuildProvider>
                    <GuildJobProvider>
                      <NetworkProvider>
                        <ChatProvider>
                          <RealPaymentProvider>
                            <CustomAlertProvider>
                              <PaymentSheetProvider>
                          <Stack
                            screenOptions={{
                              headerShown: false,
                              animation: 'fade', // Fastest animation
                              animationDuration: 2, // 2ms - INSTANT transition!
                              contentStyle: styles.screenContent,
                            }}
                          >
                            <Stack.Screen name="index" />
                            <Stack.Screen
                              name="(auth)"
                              options={{
                                animation: 'fade',
                                animationDuration: 2, // 2ms - INSTANT!
                              }}
                            />
                            <Stack.Screen
                              name="(main)"
                              options={{
                                animation: 'fade',
                                animationDuration: 2, // 2ms - INSTANT!
                              }}
                            />
                            <Stack.Screen
                              name="(modals)"
                              options={{
                                animation: 'fade',
                                animationDuration: 2, // 2ms - INSTANT!
                                presentation: 'modal',
                              }}
                            />
                          </Stack>
                              </PaymentSheetProvider>
                            </CustomAlertProvider>
                          </RealPaymentProvider>
                        </ChatProvider>
                      </NetworkProvider>
                    </GuildJobProvider>
                  </GuildProvider>
                </RankingProvider>
              </UserProfileProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000', // BLACK - prevents white screen flash
  },
  screenContent: {
    backgroundColor: '#000000', // BLACK - all screens default to black
  },
});