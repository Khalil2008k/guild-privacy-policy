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
        // 🍎 Apple Guideline 5.1.1: Clear, specific permission descriptions
        NSCameraUsageDescription: "GUILD needs camera access to take photos for your profile picture, job postings, and document verification. This helps you showcase your work and verify your identity.",
        NSPhotoLibraryUsageDescription: "GUILD needs access to your photo library to select and share images for your profile, job postings, and portfolio. This helps you present your work professionally.",
        NSMicrophoneUsageDescription: "GUILD needs microphone access to record and send voice messages in chat conversations. This helps you communicate more effectively with clients and freelancers.",
        NSLocationWhenInUseUsageDescription: "GUILD uses your location to show nearby jobs and guilds. This helps you find relevant work opportunities in your area.",
        // COMMENT: Apple App Tracking Transparency (ATT) - Required for iOS 14.5+
        // This permission must be requested before using IDFA (Identifier for Advertisers)
        NSUserTrackingUsageDescription: "GUILD uses tracking to improve your experience and show relevant jobs. You can disable this in Settings."
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
    // COMMENT: PRODUCTION HARDENING - Task 5.6 - Hermes engine enabled for better performance and smaller bundle size
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
      // API and WebSocket URLs
      apiUrl: "https://guild-yf7q.onrender.com/api/v1",
      wsUrl: process.env.EXPO_PUBLIC_WS_URL || "wss://guild-yf7q.onrender.com",
      firebaseProjectId: "guild-4f46b",
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
          photosPermission: "GUILD needs access to your photo library to select and share images for your profile, job postings, and portfolio.",
          cameraPermission: "GUILD needs camera access to take photos for your profile picture, job postings, and document verification."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "GUILD needs camera access to take photos for your profile picture, job postings, and document verification.",
          microphonePermission: "GUILD needs microphone access to record and send voice messages in chat conversations.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "GUILD uses your location to show nearby jobs and guilds. This helps you find relevant work opportunities in your area.",
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
    // COMMENT: PRODUCTION HARDENING - Task 5.4 - Development client only enabled in development
    // developmentClient is automatically disabled in production builds by EAS
    // This config only applies when building with developmentClient enabled
    ...(process.env.NODE_ENV !== 'production' && {
      developmentClient: {
        silentLaunch: true
      }
    }),
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