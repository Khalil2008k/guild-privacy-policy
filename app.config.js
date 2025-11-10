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
      icon: "./assets/icon.png", // 🎨 App icon for iOS
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        // 🍎 Apple Guideline 5.1.1: Clear, specific permission descriptions
        NSCameraUsageDescription: "GUILD needs camera access to take photos for your profile picture, job postings, and document verification. This helps you showcase your work and verify your identity.",
        NSPhotoLibraryUsageDescription: "GUILD needs access to your photo library to select and share images for your profile, job postings, and portfolio. This helps you present your work professionally.",
        NSMicrophoneUsageDescription: "GUILD needs microphone access to record and send voice messages in chat conversations. This helps you communicate more effectively with clients and freelancers.",
        NSLocationWhenInUseUsageDescription: "GUILD uses your location to show nearby jobs and guilds. This helps you find relevant work opportunities in your area.",
        // ✅ TASK 17: Face ID / Touch ID permission for biometric authentication
        NSFaceIDUsageDescription: "GUILD uses Face ID to securely authenticate you and protect your account from unauthorized access.",
        // ⚠️ REMOVED: NSUserTrackingUsageDescription (Task 17)
        // Apple may reject if you request ATT but don't use IDFA
        // Only add this back if you implement Facebook Ads, Google AdMob, or cross-app tracking
        // NSUserTrackingUsageDescription: "GUILD uses tracking to improve your experience and show relevant jobs. You can disable this in Settings."
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
        projectId: process.env.EAS_PROJECT_ID || "03fc46b1-43ec-4b63-a1fc-329d0e5f1d1b"
      },
      // ✅ FIXED: Load Firebase config from environment variables (Task 5)
      // All secrets now loaded from .env file instead of hardcoded
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      
      // ✅ FIXED: API and WebSocket URLs from environment
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      wsUrl: process.env.EXPO_PUBLIC_WS_URL,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      EXPO_PUBLIC_WS_URL: process.env.EXPO_PUBLIC_WS_URL,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
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