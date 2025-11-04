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
import { ensureFirebaseCacheCleared } from '../config/clearFirebaseCache';
import MessageNotificationService from '../services/MessageNotificationService';
import { configureNotificationHandlers } from '../services/push';
// COMMENT: PRODUCTION HARDENING - Task 5.5 - Cold start measurement
import { coldStartMeasurement } from '../utils/coldStartMeasurement';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

// ⚡⚡⚡ LUDICROUS SPEED - 1ms native splash!
// Execute synchronously at module parse - INSTANT!
Promise.resolve().then(() => {
  SplashScreen.hideAsync().catch(() => {});
});

export default function RootLayout() {
  // COMMENT: PRODUCTION HARDENING - Task 5.5 - Start cold start measurement
  React.useEffect(() => {
    try {
      if (coldStartMeasurement) {
        coldStartMeasurement.startMeasurement();
      }
    } catch (error) {
      logger.warn('[Cold Start] Failed to start measurement:', error);
    }
  }, []);

  // COMMENT: PRODUCTION HARDENING - Task 5.1 - Timeout ref for cleanup
  const interactiveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // ULTRA FAST - No state delays, instant rendering
  // Initialize services immediately in background
  React.useLayoutEffect(() => {
    // COMMENT: PRODUCTION HARDENING - Task 5.1 - Clear any existing timeout
    if (interactiveTimeoutRef.current) {
      clearTimeout(interactiveTimeoutRef.current);
      interactiveTimeoutRef.current = null;
    }

    // 🔥 CRITICAL: Clear Firebase cache FIRST before any services initialize
    ensureFirebaseCacheCleared()
      .then(() => {
        logger.debug('🔥 Firebase cache cleared, initializing services...');
        // Configure notification handlers first
        configureNotificationHandlers();
        
        // Use layoutEffect for synchronous execution before paint
        return Promise.allSettled([
          BackendConnectionManager.initialize(),
          errorMonitoring.initialize(),
          performanceMonitoring.initialize(),
          appCheckService.initialize(),
          MessageNotificationService.initialize(),
          import('../services/MessageQueueService').then(m => m.default.initialize()),
        ]);
      })
      .then(() => {
        logger.info('✅ App services initialized');
        // COMMENT: PRODUCTION HARDENING - Task 5.5 - Mark app interactive after initialization
        // COMMENT: PRODUCTION HARDENING - Task 5.1 - Store timeout ID for cleanup
        interactiveTimeoutRef.current = setTimeout(() => {
          interactiveTimeoutRef.current = null;
          try {
            if (coldStartMeasurement) {
              coldStartMeasurement.markInteractive();
            }
          } catch (error) {
            logger.warn('[Cold Start] Failed to mark interactive:', error);
          }
        }, 500); // Allow time for UI to become interactive
      })
      .catch((error) => {
        logger.error('App initialization error:', error);
        // Still mark interactive even if initialization fails
        try {
          if (coldStartMeasurement) {
            coldStartMeasurement.markInteractive();
          }
        } catch (markError) {
          logger.warn('[Cold Start] Failed to mark interactive:', markError);
        }
      });

    // COMMENT: PRODUCTION HARDENING - Task 5.1 - Cleanup timeout on unmount
    return () => {
      if (interactiveTimeoutRef.current) {
        clearTimeout(interactiveTimeoutRef.current);
        interactiveTimeoutRef.current = null;
      }
    };
  }, []);

  // COMMENT: PRODUCTION HARDENING - Task 5.5 - Mark first render complete
  React.useEffect(() => {
    try {
      if (coldStartMeasurement) {
        coldStartMeasurement.markFirstRender();
      }
    } catch (error) {
      logger.warn('[Cold Start] Failed to mark first render:', error);
    }
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