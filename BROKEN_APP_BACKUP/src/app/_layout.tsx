import { Stack } from 'expo-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import AuthProvider from '../contexts/AuthContext';
import { I18nProvider } from '../contexts/I18nProvider';
import NetworkProvider from '../contexts/NetworkContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <I18nProvider>
          <NetworkProvider>
            <Stack screenOptions={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 400,
            }}>
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
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}