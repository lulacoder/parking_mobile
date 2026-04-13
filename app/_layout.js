import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import { getStatusBarConfig } from '../src/utils/platform';
import { queryClient } from '../src/lib/queryClient';

export default function RootLayout() {
  const statusBarConfig = getStatusBarConfig();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar
            style={statusBarConfig.style}
            backgroundColor={statusBarConfig.backgroundColor}
            translucent={statusBarConfig.translucent}
          />
          <Slot />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
