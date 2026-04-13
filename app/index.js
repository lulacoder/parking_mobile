import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import LoadingScreen from '../src/components/common/LoadingScreen';
import { getRoleHome } from '../src/utils/roleUtils';

export default function Index() {
  const { user, userRole, initializing } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && !inAppGroup) {
      // Redirect to role-specific home if authenticated
      const roleHome = getRoleHome(userRole);
      router.replace(`/${roleHome}`);
    }
  }, [user, userRole, initializing, segments]);

  if (initializing) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  return null;
}
