import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import Constants from 'expo-constants';

// Firebase configuration from expo-constants
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.firebaseApiKey,
  authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
  databaseURL: Constants.expoConfig.extra.firebaseDatabaseUrl,
  projectId: Constants.expoConfig.extra.firebaseProjectId,
  storageBucket: Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId: Constants.expoConfig.extra.firebaseAppId,
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export Firebase service instances
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const functionsClient = firebase.app().functions('us-central1');

// Emulator configuration
const USE_EMULATOR = Constants.expoConfig.extra.useFunctionsEmulator;
const EMULATOR_HOST = Constants.expoConfig.extra.functionsEmulatorHost || 'localhost';
const EMULATOR_PORT = Constants.expoConfig.extra.functionsEmulatorPort || 5001;

// Connect to emulator if configured
if (USE_EMULATOR) {
  functionsClient.useEmulator(EMULATOR_HOST, EMULATOR_PORT);
  console.log(`🔧 Firebase Functions connected to emulator at ${EMULATOR_HOST}:${EMULATOR_PORT}`);
  console.log(`📍 Emulator URL: http://${EMULATOR_HOST}:${EMULATOR_PORT}`);
}

export default firebase;
