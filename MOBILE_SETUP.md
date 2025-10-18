# Mobile Setup Guide

## Why App Works on Web but Not on Mobile

The app works on web but has issues on mobile due to several React Native/Expo specific differences:

### 1. **Metro Bundler Configuration**
- **Issue**: Mobile uses Metro bundler which handles imports differently than web bundlers
- **Solution**: Ensure `metro.config.js` is properly configured with path aliases

### 2. **Platform-Specific Components**
- **Issue**: Some components work on web but not on mobile (StatusBar, SafeAreaView, etc.)
- **Solution**: Use React Native specific components

### 3. **Navigation Differences**
- **Issue**: Expo Router behaves differently on mobile vs web
- **Solution**: Ensure proper route structure and navigation

## Mobile Testing Setup

### Prerequisites
1. **Expo CLI**: `npm install -g @expo/cli`
2. **Expo Go App**: Download from App Store/Play Store
3. **Development Build** (recommended): `npx expo install expo-dev-client`

### Testing Methods

#### Method 1: Expo Go (Easiest)
```bash
# Start development server
npx expo start

# Scan QR code with Expo Go app
```

#### Method 2: Development Build (Recommended)
```bash
# Create development build
npx expo run:android
# or
npx expo run:ios

# This creates a custom build with your app's native dependencies
```

#### Method 3: Physical Device with USB
```bash
# For Android
npx expo start --android

# For iOS (requires Mac + Xcode)
npx expo start --ios
```

## Common Mobile Issues & Fixes

### 1. **Font Loading Issues**
```javascript
// Fix: Preload fonts in _layout.tsx
import { useFonts } from 'expo-font';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Signika Negative SC': require('../assets/fonts/SignikaNegativeSC-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }
  // ... rest of component
}
```

### 2. **StatusBar Issues**
```javascript
// Fix: Use expo-status-bar
import { StatusBar } from 'expo-status-bar';

// Instead of react-native StatusBar
<StatusBar style="dark" backgroundColor="#BCFF31" />
```

### 3. **Safe Area Issues**
```javascript
// Fix: Use react-native-safe-area-context
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
// Apply insets.top, insets.bottom to your layouts
```

### 4. **Navigation Issues**
```javascript
// Fix: Ensure proper route structure
// File: src/app/(main)/_layout.tsx
import { Tabs } from 'expo-router';

export default function MainLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
```

### 5. **Import Path Issues**
```javascript
// Fix: Use absolute imports with @/ alias
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.alias = {
  '@': './src',
};

module.exports = config;
```

## Debugging Mobile Issues

### 1. **Enable Remote Debugging**
```bash
# Start with debugging enabled
npx expo start --dev-client

# Shake device or press Cmd+D (iOS) / Cmd+M (Android)
# Select "Debug Remote JS"
```

### 2. **Check Metro Logs**
```bash
# View detailed logs
npx expo start --clear --verbose
```

### 3. **Use Flipper (Advanced)**
```bash
# Install Flipper for advanced debugging
# https://fbflipper.com/
```

## Performance Optimization for Mobile

### 1. **Bundle Size**
```bash
# Analyze bundle size
npx expo export --platform android
npx expo export --platform ios
```

### 2. **Image Optimization**
```javascript
// Use expo-image for better performance
import { Image } from 'expo-image';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  transition={1000}
/>
```

### 3. **Memory Management**
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

## Current App Mobile Fixes Applied

✅ **Metro Config**: Added `@/` alias support
✅ **Theme Integration**: Wallet screen now uses theme colors
✅ **Navigation**: Proper Expo Router structure
✅ **Safe Areas**: Using `useSafeAreaInsets`
✅ **Status Bar**: Proper configuration
✅ **Font Loading**: Fixed FONT_FAMILY scope issues

## Next Steps for Mobile Testing

1. **Test on Physical Device**:
   ```bash
   npx expo start
   # Scan QR with Expo Go app
   ```

2. **Check for Platform-Specific Issues**:
   - Test navigation between screens
   - Verify theme colors display correctly
   - Test RTL layout on Arabic
   - Verify bottom navigation works

3. **Performance Testing**:
   - Check app startup time
   - Test smooth scrolling
   - Verify memory usage

4. **Build Production Version**:
   ```bash
   # Create production build
   npx expo build:android
   npx expo build:ios
   ```

## Troubleshooting Common Errors

### "Metro bundler crashed"
```bash
# Clear cache and restart
npx expo start --clear --reset-cache
```

### "Unable to resolve module"
```bash
# Check metro.config.js aliases
# Verify import paths use @/ prefix
```

### "Component not registered"
```bash
# Check if all components are properly exported
# Verify React Native vs React imports
```

### "Network request failed"
```bash
# Check if development server is accessible
# Try different port: npx expo start --port 8081
```
