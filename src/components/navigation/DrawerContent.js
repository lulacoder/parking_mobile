import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatformSafeArea } from '../common/SafeAreaWrapper';
import { colors, spacing, typography } from '../../constants/theme';
import { showPlatformAlert, triggerHapticFeedback, getPlatformButtonStyle } from '../../utils/platform';

export default function DrawerContent() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const safeArea = usePlatformSafeArea();
  const platformButtonStyle = getPlatformButtonStyle();

  const handleSignOut = async () => {
    triggerHapticFeedback('light');

    showPlatformAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            triggerHapticFeedback('success');
            await signOut();
          } catch (_) {
            triggerHapticFeedback('error');
            showPlatformAlert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const navigateToScreen = (screenPath) => {
    triggerHapticFeedback('light');
    router.push(screenPath);
  };

  const getMenuItems = () => {
    if (userRole === 'admin') {
      return [{ key: 'admin', label: 'Dashboard', path: '/admin', isActive: pathname.startsWith('/admin') }];
    }
    if (userRole === 'owner') {
      return [{ key: 'owner', label: 'Dashboard', path: '/owner', isActive: pathname.startsWith('/owner') }];
    }
    if (userRole === 'operator') {
      return [{ key: 'operator', label: 'Dashboard', path: '/operator', isActive: pathname.startsWith('/operator') }];
    }
    if (userRole === 'driver') {
      return [
        { key: 'driver', label: 'Home', path: '/driver', isActive: pathname === '/driver' },
        { key: 'scan-qr', label: 'Scan QR', path: '/driver/scan-qr', isActive: pathname === '/driver/scan-qr' },
        {
          key: 'checkin',
          label: 'Check-In Confirm',
          path: '/driver/checkin-confirm',
          isActive: pathname === '/driver/checkin-confirm',
        },
      ];
    }
    return [];
  };

  return (
    <View style={[styles.container, { paddingTop: safeArea.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Parking</Text>
          {user ? (
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{String(userRole || '').toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.menuItems}>
          {getMenuItems().map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, item.isActive && styles.menuItemActive]}
              onPress={() => navigateToScreen(item.path)}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, item.isActive && styles.menuItemTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: safeArea.bottom }]}>
        <TouchableOpacity style={[styles.signOutButton, platformButtonStyle]} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { ...typography.h2, color: colors.primary, marginBottom: spacing.md },
  userInfo: { marginTop: spacing.sm },
  userEmail: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  userRole: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  menuItems: { flex: 1, paddingTop: spacing.md },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  menuItemActive: {
    backgroundColor: `${colors.primary}20`,
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuItemText: { ...typography.body, color: colors.text, fontWeight: '500' },
  menuItemTextActive: { color: colors.primary, fontWeight: '600' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutButton: {
    backgroundColor: colors.danger,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 44,
  },
  signOutText: { ...typography.body, color: colors.surface, fontWeight: '600' },
});
