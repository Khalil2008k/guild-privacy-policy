# Guild - Qatar Odd Jobs Marketplace

A React Native marketplace app built with Expo, TypeScript, and NativeWind, designed specifically for the Qatar market with full Arabic RTL support.

## Features

- 🌍 **Arabic RTL Support** - Full right-to-left layout with Noto Sans Arabic fonts
- 🎨 **Qatar-themed Design** - Blue (#1E90FF) and white color scheme
- 🔥 **Firebase Integration** - Firestore and Realtime Database for data storage and chat
- 📱 **Cross-platform** - iOS and Android support
- ♿ **Accessibility** - High-contrast text, 48x48dp touch targets
- 🌐 **Internationalization** - Arabic and English localization
- 📅 **Localized Dates** - Islamic calendar and Arabic number formats

## Tech Stack

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **NativeWind** - Tailwind CSS for React Native
- **Firebase** - Backend services (Firestore, Realtime Database, Auth)
- **i18n-js** - Internationalization
- **expo-localization** - Date/number formatting
- **expo-font** - Custom font loading

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Expo Go app (for testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/guild-app.git
   cd guild-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Download Arabic Fonts**
   
   Download the Noto Sans Arabic fonts and place them in `src/assets/fonts/`:
   - NotoSansArabic-Regular.ttf
   - NotoSansArabic-Bold.ttf
   - NotoSansArabic-Medium.ttf
   
   You can download them from [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+Arabic)

4. **Configure Firebase**
   
   Create a Firebase project and update `src/app/config/firebase.ts` with your configuration:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com",
   };
   ```

## Development

### Start Development Server

```bash
npm start
# or
yarn start
```

### Run on iOS Simulator

```bash
npm run ios
# or
yarn ios
```

### Run on Android Emulator

```bash
npm run android
# or
yarn android
```

### Run on Web

```bash
npm run web
# or
yarn web
```

## Testing with Expo Go

1. **Install Expo Go** on your device from the App Store or Google Play Store

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Scan the QR code** with Expo Go app

4. **Test the app** on your device

### Troubleshooting Expo Go

- **Connection Issues**: Ensure your device and computer are on the same network
- **Metro Bundler**: If the app doesn't load, try restarting the Metro bundler with `r`
- **Cache Issues**: Clear Expo Go cache or restart the app

## Debugging with Flipper

### Setup Flipper

1. **Install Flipper**
   - Download from [Flipper.dev](https://fbflipper.com/)
   - Install and launch Flipper

2. **Install Flipper plugins**
   ```bash
   npm install --save-dev flipper-plugin-react-native-performance
   ```

3. **Configure Metro**
   
   Update `metro.config.js`:
   ```javascript
   const { getDefaultConfig } = require('expo/metro-config');
   
   const config = getDefaultConfig(__dirname);
   
   // Add Flipper support
   config.resolver.platforms = ['ios', 'android', 'native', 'web'];
   
   module.exports = config;
   ```

4. **Enable Flipper in development**
   
   The app automatically connects to Flipper in development mode.

### Flipper Features

- **Network Inspector** - Monitor API calls
- **React DevTools** - Component tree and props
- **Logs** - Console logs and errors
- **Crash Reporter** - App crash analysis
- **Performance** - React Native performance metrics

## Project Structure

```
src/
├── app/
│   ├── components/          # Reusable components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── i18n/               # Internationalization
│   ├── config/             # Configuration files
│   ├── screens/            # Screen components
│   └── types/              # TypeScript types
├── assets/
│   ├── fonts/              # Custom fonts
│   └── images/             # App images
└── global.css              # Global styles
```

## Key Components

### RTL Support
- `I18nManager.forceRTL(true)` - Forces RTL layout
- Arabic font loading with `expo-font`
- RTL-aware styling with NativeWind

### Localization
- `i18n-js` for string translations
- `expo-localization` for date/number formatting
- Arabic as default language

### Firebase Integration
- Firestore for job listings and user data
- Realtime Database for chat functionality
- Authentication for user management

## Accessibility Features

- **High Contrast Text** - Dark text on light backgrounds
- **48x48dp Touch Targets** - Minimum touch target size
- **Screen Reader Support** - Proper accessibility labels
- **Keyboard Navigation** - Full keyboard support

## Deployment

### Expo Build

1. **Configure app.json** with your app details
2. **Build for production**
   ```bash
   expo build:android
   expo build:ios
   ```

### EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build and submit**
   ```bash
   eas build --platform all
   eas submit --platform all
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Push notifications
- [ ] Payment integration
- [ ] Advanced search filters
- [ ] User reviews and ratings
- [ ] Offline support
- [ ] Dark mode
- [ ] Voice commands
- [ ] AR job preview

---

Built with ❤️ for the Qatar community
