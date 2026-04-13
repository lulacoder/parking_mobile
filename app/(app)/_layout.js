import { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { sanitizeRole } from '../../src/utils/roleUtils';
import DrawerContent from '../../src/components/navigation/DrawerContent';
import { getNavigationOptions, getGestureConfig } from '../../src/utils/platform';

export default function AppLayout() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const role = sanitizeRole(userRole);
  const navigationOptions = getNavigationOptions();
  const gestureConfig = getGestureConfig();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  const defaultScreenOptions = {
    headerShown: true,
    drawerType: 'front',
    ...navigationOptions,
    ...gestureConfig,
  };

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={defaultScreenOptions}
    >
      {role === 'admin' && (
        <Drawer.Screen
          name="admin"
          options={{
            title: 'Admin Dashboard',
            drawerLabel: 'Dashboard',
          }}
        />
      )}
      {role === 'owner' && (
        <Drawer.Screen
          name="owner"
          options={{
            title: 'Owner Dashboard',
            drawerLabel: 'Dashboard',
          }}
        />
      )}
      {role === 'operator' && (
        <Drawer.Screen
          name="operator"
          options={{
            title: 'Operator Dashboard',
            drawerLabel: 'Dashboard',
          }}
        />
      )}
      {role === 'driver' && (
        <Drawer.Screen
          name="driver"
          options={{
            title: 'Driver',
            drawerLabel: 'Home',
          }}
        />
      )}
    </Drawer>
  );
}
