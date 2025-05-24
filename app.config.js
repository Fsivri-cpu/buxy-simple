// Load environment variables
module.exports = {
  name: "NutritionTracker",
  slug: "nutrition-tracker",
  version: "1.0.0",
  orientation: "portrait",
  // Icon and splash properties made optional to facilitate development
  // Use empty placeholders to avoid asset not found errors
  icon: "./assets/icon.png", // Empty placeholder file
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png", // Empty placeholder file
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-router"
  ],
  scheme: "nutrition-tracker",
  extra: {
    eas: {
      projectId: "your-eas-project-id"
    },
    // Firebase Config from environment variables
    firebaseConfig: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
    }
  }
};