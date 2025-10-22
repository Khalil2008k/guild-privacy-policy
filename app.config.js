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
      }
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-localization",
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