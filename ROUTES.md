# App Routing Logic

This document defines the complete routing logic for the app, covering all 30 routed screens (auth: 8, main: 5, modals: 17) and supporting extensibility for new screens. Built with React Navigation 6.x and Expo Router, using TypeScript for type-safe navigation. Routes are grouped into auth, main, and modals, with a root navigator handling splash and auth guards.

## Navigation Structure
- **Root Navigator**: Stack (src/app/_layout.tsx)
  - Providers: ErrorBoundary, AuthProvider, I18nProvider, NetworkProvider, ThemeProvider
  - Loads fonts, enforces RTL, manages SplashScreen
  - Screens: index (auth guard), (auth), (main), (modals)
- **Auth Group**: Stack (src/app/(auth)/_layout.tsx)
  - Header hidden, gesture-driven
  - Screens: splash, onboarding/1–3, signin, signup/1–3
- **Main Group**: Tabs (src/app/(main)/_layout.tsx)
  - Renders <Slot /> + AppBottomNavigation (neon-themed: home, jobs, chat, profile, post)
  - Screens: home, jobs, chat, profile, post
- **Modals Group**: Stack (src/app/(modals)/_layout.tsx)
  - Presentation: modal, slide-from-bottom
  - Screens: apply/[jobId], chat/[jobId], create-guild, escrow-payment, guild-map, guild, guilds, job/[id], job-posting, leads-feed, my-jobs, notifications, offer-submission, profile-settings, settings, wallet/[userId], wallet
- **Extensibility**: New groups (e.g., admin, premium) can be added as parallel stacks under root.

## Type Definitions
```typescript
// src/types/navigation.ts
export type RootStackParamList = {
  index: undefined;
  '(auth)': undefined;
  '(main)': undefined;
  '(modals)': undefined;
};

export type AuthStackParamList = {
  splash: undefined;
  'onboarding/1': undefined;
  'onboarding/2': undefined;
  'onboarding/3': undefined;
  signin: undefined;
  'signup/1': undefined;
  'signup/2': undefined;
  'signup/3': undefined;
};

export type MainTabParamList = {
  home: undefined;
  jobs: undefined;
  chat: undefined;
  profile: undefined;
  post: undefined;
};

export type ModalsStackParamList = {
  'apply/[jobId]': { jobId: string };
  'chat/[jobId]': { jobId: string };
  'create-guild': undefined;
  'escrow-payment': { jobId: string; offerId: string };
  'guild-map': undefined;
  guild: undefined;
  guilds: undefined;
  'job/[id]': { id: string };
  'job-posting': undefined;
  'leads-feed': undefined;
  'my-jobs': undefined;
  notifications: undefined;
  'offer-submission': { jobId: string };
  'profile-settings': undefined;
  settings: undefined;
  'wallet/[userId]': { userId: string };
  wallet: undefined;
  // Future extensions
  'admin/dashboard'?: undefined;
  'premium/features'?: undefined;
};
```

## Root Navigator (src/app/_layout.tsx)
```typescript
import { Stack } from 'expo-router';
import { ErrorBoundary, AuthProvider, I18nProvider, NetworkProvider, ThemeProvider } from '../contexts';
import { loadFonts, enforceRTL, hideSplashScreen } from '../utils';

export default function RootLayout() {
  // Load fonts and RTL
  const [fontsLoaded] = loadFonts();
  enforceRTL();

  // Hide splash screen after fonts
  if (fontsLoaded) {
    hideSplashScreen();
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
          <NetworkProvider>
            <ThemeProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(main)" />
                <Stack.Screen name="(modals)" />
              </Stack>
            </ThemeProvider>
          </NetworkProvider>
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

## Index (Auth Guard) (src/app/index.tsx)
```typescript
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { AuthLoadingScreen } from '../components';
import { runDevSeed } from '../services/devSeed';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    if (process.env.EXPO_PUBLIC_RUN_SEED === 'true') {
      runDevSeed(user.uid); // One-time seed
    }
    return <Redirect href="/(main)/home" />;
  }

  return <Redirect href="/(auth)/onboarding/1" />;
}
```

## Auth Group (src/app/(auth)/_layout.tsx)
```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding/1" />
      <Stack.Screen name="onboarding/2" />
      <Stack.Screen name="onboarding/3" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup/1" />
      <Stack.Screen name="signup/2" />
      <Stack.Screen name="signup/3" />
    </Stack>
  );
}
```

## Main Group (src/app/(main)/_layout.tsx)
```typescript
import { Tabs } from 'expo-router';
import { AppBottomNavigation } from '../../components/AppBottomNavigation';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppBottomNavigation {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="post" />
    </Tabs>
  );
}
```

## Modals Group (src/app/(modals)/_layout.tsx)
```typescript
import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        animation: 'slide_from_bottom',
        headerShown: false,
      }}
    >
      <Stack.Screen name="apply/[jobId]" />
      <Stack.Screen name="chat/[jobId]" />
      <Stack.Screen name="create-guild" />
      <Stack.Screen name="escrow-payment" />
      <Stack.Screen name="guild-map" />
      <Stack.Screen name="guild" />
      <Stack.Screen name="guilds" />
      <Stack.Screen name="job/[id]" />
      <Stack.Screen name="job-posting" />
      <Stack.Screen name="leads-feed" />
      <Stack.Screen name="my-jobs" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="offer-submission" />
      <Stack.Screen name="profile-settings" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="wallet/[userId]" />
      <Stack.Screen name="wallet" />
      {/* Future: <Stack.Screen name="admin/dashboard" /> */}
      {/* Future: <Stack.Screen name="premium/features" /> */}
    </Stack>
  );
}
```

## Screen Navigation Logic
### Auth Screens
- **splash**: Waits 3s; if user (useAuth): router.replace('/(auth)/signin'); else: router.replace('/(auth)/onboarding/1').
- **onboarding/1**: Next → router.push('/(auth)/onboarding/2'); Skip → router.push('/(auth)/signup/1').
- **onboarding/2**: Next → router.push('/(auth)/onboarding/3'); Skip → router.push('/(auth)/signup/1').
- **onboarding/3**: Get started → router.push('/(auth)/signup/1').
- **signin**: Sign in (mock delay) → router.replace('/(main)/home'); Sign up link → router.push('/(auth)/signup/1').
- **signup/1**: Next → router.push('/(auth)/signup/2'); Sign in → router.push('/(auth)/signin').
- **signup/2**: Next → router.push('/(auth)/signup/3'); Back → router.back().
- **signup/3**: Create account → router.replace('/(auth)/signin'); Back → router.back().

### Main Screens
- **home**:
  - Header: Notifications → router.push('/(modals)/notifications'); Chat → router.push('/(main)/chat'); Settings → router.push('/(modals)/settings').
  - Search: Opens in-page SearchScreen; Results tap → router.push('/(modals)/job/[id]', { id }).
  - Actions: Add Job → router.push('/(modals)/job-posting'); Guild Map → router.push('/(modals)/guild-map').
  - Job card tap → router.push('/(modals)/job/[id]', { id }).
- **jobs**: Category chip select (local state); Card tap → router.push('/(modals)/job/[id]', { id }); Post Job → router.push('/(modals)/job-posting').
- **chat**: Conversation tap → router.push('/(modals)/chat/[jobId]', { jobId }).
- **profile**: Menu items → router.push('/(modals)/[screen]'); Sign out → router.replace('/(auth)/signin').
- **post**: Placeholder (TODO: define navigation or redirect).

### Modals Screens
- **apply/[jobId]**: Submit → router.push('/(modals)/offer-submission', { jobId }) or custom apply logic.
- **chat/[jobId]**: Back → router.back() or /(main)/chat.
- **create-guild**: Submit → router.back() or /(modals)/guild.
- **escrow-payment**: Submit (EscrowService.createEscrow) → success alert, router.back().
- **guild-map**: Back → router.back().
- **guild**, **guilds**: Guilds list tap → router.push('/(modals)/guild'); Map button → router.push('/(modals)/guild-map').
- **job/[id]**: Submit Offer → router.push('/(modals)/offer-submission', { jobId: id }); Pay/Accept → router.push('/(modals)/escrow-payment', { jobId: id, offerId }).
- **job-posting**: Submit (jobService.createJob) → success alert, router.push('/(modals)/job/[id]') or router.back().
- **leads-feed**: Card tap → router.push('/(modals)/job/[id]', { id }); Filter → open FilterModal.
- **my-jobs**: Tab switch (local); Job tap → router.push('/(modals)/job/[id]', { id }).
- **notifications**: Card tap (actionUrl) → router.push(actionUrl || '/(main)/home'); Back → router.back().
- **offer-submission**: Submit (OfferService.createOffer) → router.back().
- **profile-settings**, **settings**, **wallet**, **wallet/[userId]**: Save/Back → router.back().

## Extensibility for New Screens
- **Add New Group** (e.g., admin, premium):
  - Add to RootStackParamList: e.g., '(admin)': undefined.
  - Create src/app/(admin)/_layout.tsx with Stack/Tabs.
  - Add <Stack.Screen name="(admin)" /> in root _layout.tsx.
- **Add New Screen in Existing Group**:
  - Auth: Add to AuthStackParamList and /(auth)/_layout.tsx.
  - Main: Add to MainTabParamList and /(main)/_layout.tsx (update AppBottomNavigation).
  - Modals: Add to ModalsStackParamList and /(modals)/_layout.tsx.
- **Dynamic Params**: Use [param] syntax (e.g., job/[id], wallet/[userId]) for reusable screens.
- **Example (Admin Dashboard)**:
  ```typescript
  // Add to ModalsStackParamList
  'admin/dashboard': undefined;

  // Add to /(modals)/_layout.tsx
  <Stack.Screen name="admin/dashboard" />

  // In admin/dashboard.tsx
  router.push('/(modals)/admin/dashboard');
  ```

## Error Handling
- **ErrorBoundary**: Catches render errors, shows fallback UI.
- **Service Calls**: Wrap in try/catch; show CustomAlert on failure.
- **Navigation Guards**: UseAuth to prevent unauthorized access (e.g., index.tsx).
- **Form Validation**: Client-side checks (signin, signup, offer-submission, job-posting) before API calls.

## Notes
- Removed redundant /(main)/index.tsx redirect; / maps directly to /(main)/home in AppBottomNavigation.
- Complete 3-step signup flow implemented (signup/1, signup/2, signup/3).
- Admin/premium groups reserved for future roles/features.
- All modals use slide-from-bottom animation for consistent UX.
- RTL enforced via root _layout.tsx; primitives handle mirroring.
