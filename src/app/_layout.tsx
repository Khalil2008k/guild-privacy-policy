import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, Linking, Platform } from 'react-native';
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
// 🌐 External Payment: Deep link handler for wallet updates
import { parseWalletDeepLink, handleWalletDeepLink } from '../utils/deepLinkHandler';

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

  // 🍎 Apple Compliance: Handle deep links for external browser payment return
  React.useEffect(() => {
    // ⚠️ CRITICAL FIX for Xiaomi/Android: Add delay to ensure app is fully initialized
    // On some Android devices (especially Xiaomi), the app can be killed in background
    // When returning from payment, we need to wait for the app to be ready
    
    let isAppReady = false;
    let pendingDeepLink: string | null = null;
    
    // Mark app as ready after initialization
    const markAppReady = () => {
      isAppReady = true;
      if (pendingDeepLink) {
        logger.info('🔗 Processing pending deep link after app ready:', pendingDeepLink);
        handleDeepLink(pendingDeepLink);
        pendingDeepLink = null;
      }
    };
    
    // Wait for app to be ready (give it time to initialize)
    const readyTimeout = setTimeout(() => {
      markAppReady();
    }, Platform.OS === 'android' ? 1000 : 500);
    
    // Handle initial deep link (if app opened via deep link)
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          logger.info('🔗 Initial deep link received:', initialUrl);
          if (isAppReady) {
            handleDeepLink(initialUrl);
          } else {
            pendingDeepLink = initialUrl;
            logger.info('⏳ App not ready yet, queuing deep link');
          }
        }
      } catch (error) {
        logger.error('❌ Error getting initial URL:', error);
      }
    };

    // Handle deep links while app is running
    const handleURL = (event: { url: string }) => {
      logger.info('🔗 Deep link received while app running:', event.url);
      if (isAppReady) {
        handleDeepLink(event.url);
      } else {
        pendingDeepLink = event.url;
        logger.info('⏳ App not ready yet, queuing deep link');
      }
    };

    const subscription = Linking.addEventListener('url', handleURL);
    handleInitialURL();

    return () => {
      clearTimeout(readyTimeout);
      subscription.remove();
    };
  }, []);

  /**
   * 🍎 Apple Compliance: Handle payment deep links
   * Called when user returns from external browser (Safari) after payment
   */
  const handleDeepLink = async (url: string) => {
    try {
      logger.info('🔗 Deep link received:', url);
      
      // Validate URL
      if (!url || typeof url !== 'string') {
        logger.error('❌ Invalid deep link URL:', url);
        return;
      }
      
      // 🌐 External Payment: Handle wallet deep links (guild://wallet?update=true)
      // Also handle payment deep links (guild://payment/success?transaction_id=xxx)
      if (url.includes('guild://wallet') || url.includes('://wallet') || 
          url.includes('guild://payment') || url.includes('://payment')) {
        logger.info('💰 Wallet/Payment deep link detected');
        
        try {
          // Use dedicated wallet deep link handler (it handles both wallet and payment links)
          await handleWalletDeepLink(url, {
            onBalanceRefresh: async () => {
              // Balance refresh will be handled by WalletContext/Service
              // This is just a trigger - actual refresh happens in wallet screen
              logger.info('💰 Balance refresh triggered by deep link');
            },
            onSuccess: (message: string) => {
              logger.info('✅ Wallet operation successful:', message);
              // Success toast will be shown by wallet screen
            },
            onError: (message: string) => {
              logger.error('❌ Wallet operation failed:', message);
              // Error toast will be shown by wallet screen
            }
          });
        } catch (deepLinkError: any) {
          logger.error('❌ Error in handleWalletDeepLink:', deepLinkError);
          // Don't crash the app - just log the error
          // The user can manually navigate to wallet if needed
        }
        return;
      }
      
      // If not a recognized deep link, log it
      logger.warn('⚠️ Unrecognized deep link:', url);
    } catch (error: any) {
      logger.error('❌ Error handling deep link:', error);
      // Don't crash the app - just log the error
    }
  };

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