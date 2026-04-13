import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { getRoleHome } from '../../src/utils/roleUtils';

export default function AuthLayout() {
  const { user, userRole, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initializing || !user) return;

    const roleHome = getRoleHome(userRole);
    router.replace(`/${roleHome}`);
  }, [user, userRole, initializing, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
