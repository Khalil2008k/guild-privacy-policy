export default {
  expo: {
    name: "GUILD-2",
    slug: "guild-2",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#000000",
      resizeMode: "contain"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000"
      }
    },
    web: {
      bundler: "metro"
    },
    scheme: "guild2",
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    }
  }
};