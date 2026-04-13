import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { getStatusBarConfig } from '../src/utils/platform';

export default function RootLayout() {
  const statusBarConfig = getStatusBarConfig();
  
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar 
          style={statusBarConfig.style}
          backgroundColor={statusBarConfig.backgroundColor}
          translucent={statusBarConfig.translucent}
        />
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
