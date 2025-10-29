export default {
  expo: {
    name: "GUILD",
    slug: "guild-2",
    owner: "mazen123333",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    // iOS specific configuration
    ios: {
      bundleIdentifier: "com.mazen123333.guild",
      buildNumber: "3",
      supportsTablet: true,
      requireFullScreen: false,
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSCameraUsageDescription: "GUILD needs camera access to scan QR codes and upload photos.",
        NSPhotoLibraryUsageDescription: "GUILD needs photo library access to upload images.",
        NSLocationWhenInUseUsageDescription: "GUILD uses your location to show nearby jobs and guilds.",
        NSMicrophoneUsageDescription: "GUILD needs microphone access for video calls."
      }
    },
    // Android specific configuration  
    android: {
      package: "com.mazen123333.guild",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "FOREGROUND_SERVICE"
      ]
    },
    jsEngine: "hermes",
    assetBundlePatterns: [
      "**/*"
    ],
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png"
    },
    scheme: "guild",
    extra: {
      eas: {
        projectId: "03fc46b1-43ec-4b63-a1fc-329d0e5f1d1b"
      },
      // Force correct Firebase project (guild-4f46b)
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: "guild-4f46b",
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: "guild-4f46b.firebaseapp.com",
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: "guild-4f46b.firebasestorage.app",
      EXPO_PUBLIC_FIREBASE_API_KEY: "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w",
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "654144998705",
      EXPO_PUBLIC_FIREBASE_APP_ID: "1:654144998705:web:880f16df9efe0ad4853410",
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-3F86RQH389",
      // WebSocket URL for real-time features
      EXPO_PUBLIC_WS_URL: process.env.EXPO_PUBLIC_WS_URL || "wss://guild-yf7q.onrender.com",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-localization",
      "expo-audio",
      // Removed expo-dev-client to fix DevLauncher crashes
      [
        "expo-document-picker",
        {
          iCloudContainerEnvironment: "Production"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them.",
          cameraPermission: "The app accesses your camera to let you take photos."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "This app uses location to show nearby jobs and improve your experience.",
          isIosBackgroundLocationEnabled: false
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#32FF00",
          defaultChannel: "guild-system"
        }
      ]
      // Temporarily disabled Sentry for iOS build compatibility
      // [
      //   "@sentry/react-native/expo",
      //   {
      //     url: "https://sentry.io/",
      //     project: "guild-app",
      //     organization: "guild-team"
      //   }
      // ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    developmentClient: {
      silentLaunch: true
    },
    // Minimize native splash screen visibility
    androidStatusBar: {
      backgroundColor: "#000000",
      translucent: true
    },
    androidNavigationBar: {
      backgroundColor: "#000000"
    },
    server: {
      port: 8081
    }
  }
};