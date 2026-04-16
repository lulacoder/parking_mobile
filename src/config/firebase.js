import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

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
const prodApp = firebase.apps.find((app) => app.name === 'prod-fallback') || firebase.initializeApp(firebaseConfig, 'prod-fallback');
export const functionsProdClient = prodApp.functions('us-central1');

// Emulator configuration
const USE_EMULATOR = Constants.expoConfig.extra.useFunctionsEmulator;
const RAW_EMULATOR_HOST = Constants.expoConfig.extra.functionsEmulatorHost || 'localhost';
const EMULATOR_PORT = Constants.expoConfig.extra.functionsEmulatorPort || 5001;

function resolveEmulatorHost() {
  const explicitHost = String(RAW_EMULATOR_HOST || '').trim();
  const isLocalOnly = explicitHost === 'localhost' || explicitHost === '127.0.0.1';

  if (!isLocalOnly) return explicitHost || 'localhost';

  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  const scriptHostMatch = String(scriptURL).match(/^https?:\/\/([^/:]+)/i);
  if (scriptHostMatch?.[1]) return scriptHostMatch[1];

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    '';
  const devHost = String(hostUri).split(':')[0];
  if (devHost) return devHost;

  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
}
const EMULATOR_HOST = resolveEmulatorHost();

// Connect to emulator if configured
if (USE_EMULATOR) {
  functionsClient.useEmulator(EMULATOR_HOST, EMULATOR_PORT);
  console.log(`🔧 Firebase Functions connected to emulator at ${EMULATOR_HOST}:${EMULATOR_PORT}`);
  console.log(`📍 Emulator URL: http://${EMULATOR_HOST}:${EMULATOR_PORT}`);
}

export const isUsingFunctionsEmulator = Boolean(USE_EMULATOR);

export default firebase;
