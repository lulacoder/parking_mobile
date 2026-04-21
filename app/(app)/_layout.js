import { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { getRoleHome, sanitizeRole } from '../../src/utils/roleUtils';
import DrawerContent from '../../src/components/navigation/DrawerContent';
import { getNavigationOptions, getGestureConfig } from '../../src/utils/platform';

export default function AppLayout() {
  const { user, userRole, initializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = sanitizeRole(userRole);
  const navigationOptions = getNavigationOptions();
  const gestureConfig = getGestureConfig();

  useEffect(() => {
    if (initializing) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const roleHome = `/${getRoleHome(role)}`;
    if (!pathname.startsWith(roleHome)) {
      router.replace(roleHome);
    }
  }, [initializing, pathname, role, router, user]);

  const defaultScreenOptions = {
    headerShown: true,
    drawerType: 'front',
    lazy: true,
    freezeOnBlur: true,
    ...navigationOptions,
    ...gestureConfig,
  };

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={defaultScreenOptions}
    >
      <Drawer.Screen
        name="admin"
        options={{
          title: 'Admin Dashboard',
          drawerLabel: 'Dashboard',
          drawerItemStyle: role === 'admin' ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="owner"
        options={{
          title: 'Owner Dashboard',
          drawerLabel: 'Dashboard',
          drawerItemStyle: role === 'owner' ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="operator"
        options={{
          title: 'Operator Dashboard',
          drawerLabel: 'Dashboard',
          drawerItemStyle: role === 'operator' ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="driver"
        options={{
          title: 'Driver',
          drawerLabel: 'Home',
          drawerItemStyle: role === 'driver' ? undefined : { display: 'none' },
        }}
      />
    </Drawer>
  );
}
