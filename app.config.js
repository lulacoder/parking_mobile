import 'dotenv/config';

const webAppHost = process.env.WEB_APP_HOST || 'localhost';

export default {
  expo: {
    name: 'Smart Parking',
    slug: 'smart-parking',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'smartparking',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.smartparking.app',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        NSCameraUsageDescription: 'We use camera access to scan parking QR codes for check-in.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      edgeToEdgeEnabled: true,
      package: 'com.smartparking.app',
      permissions: ['CAMERA'],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: false,
          data: [
            {
              scheme: 'https',
              host: webAppHost,
              pathPrefix: '/driver/checkin-confirm',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow Smart Parking to access your camera for QR scanning.',
        },
      ],
    ],
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      webAppHost,
      useFunctionsEmulator: process.env.USE_FUNCTIONS_EMULATOR === 'true',
      functionsEmulatorHost: process.env.FUNCTIONS_EMULATOR_HOST || 'localhost',
      functionsEmulatorPort: parseInt(process.env.FUNCTIONS_EMULATOR_PORT || '5001', 10),
    }
  }
};
