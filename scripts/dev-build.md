# Development Build Setup

## Why Development Build?

Expo Go has limitations with push notifications in SDK 53+. For full functionality, use a development build.

## Quick Setup

### 1. Install Development Client
```bash
npx expo install expo-dev-client
```

### 2. Create Development Build

#### For Android:
```bash
npx expo run:android
```

#### For iOS:
```bash
npx expo run:ios
```

### 3. Alternative: EAS Build (Cloud)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform android
eas build --profile development --platform ios
```

## What This Fixes

✅ **Push Notifications** - Full support for remote notifications
✅ **Native Modules** - Access to all native functionality
✅ **Custom Dev Tools** - Enhanced debugging capabilities
✅ **Production-like Environment** - Closer to final app behavior

## Current Status

- **Expo Go**: Limited functionality, notifications disabled
- **Development Build**: Full functionality, notifications enabled
- **Production Build**: Full functionality, optimized for release

## Testing Notifications

1. Create development build
2. Install on device
3. Test push notifications
4. Verify backend integration

## Troubleshooting

### Build Fails
- Check device/emulator is connected
- Ensure Android Studio/Xcode is installed
- Clear cache: `npx expo start --clear`

### Notifications Don't Work
- Check device permissions
- Verify backend is running
- Check Firebase configuration
- Test with development build

## Next Steps

1. Create development build
2. Test full notification flow
3. Verify backend integration
4. Prepare for production build



