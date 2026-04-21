import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeRole } from '../../utils/roleUtils';
import { usePlatformSafeArea } from '../common/SafeAreaWrapper';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import { showPlatformAlert, triggerHapticFeedback, getPlatformButtonStyle } from '../../utils/platform';

export default function DrawerContent() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = sanitizeRole(userRole);
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
            router.replace('/login');
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
    if (role === 'admin') {
      return [{ key: 'admin', label: 'Dashboard', icon: 'admin-panel-settings', path: '/admin', isActive: pathname.startsWith('/admin') }];
    }
    if (role === 'owner') {
      return [{ key: 'owner', label: 'Dashboard', icon: 'business', path: '/owner', isActive: pathname.startsWith('/owner') }];
    }
    if (role === 'operator') {
      return [{ key: 'operator', label: 'Dashboard', icon: 'qr-code-scanner', path: '/operator', isActive: pathname.startsWith('/operator') }];
    }
    if (role === 'driver') {
      return [
        { key: 'driver', label: 'Home', icon: 'directions-car-filled', path: '/driver', isActive: pathname === '/driver' },
        { key: 'scan-qr', label: 'Scan QR', icon: 'qr-code-scanner', path: '/driver/scan-qr', isActive: pathname === '/driver/scan-qr' },
        {
          key: 'checkin',
          label: 'Check-In Confirm',
          icon: 'task-alt',
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
          <View style={styles.brandRow}>
            <View style={styles.brandIconWrap}>
              <MaterialIcons name="local-parking" size={20} color={colors.surface} />
            </View>
            <Text style={styles.headerTitle}>Smart Parking</Text>
          </View>
          {user ? (
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{String(role || '').toUpperCase()}</Text>
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
              <View style={styles.menuIconWrap}>
                <MaterialIcons
                  name={item.icon}
                  size={18}
                  color={item.isActive ? colors.primaryDark : colors.textSecondary}
                />
              </View>
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
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadows.card,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  brandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h2, color: colors.text },
  userInfo: { marginTop: spacing.sm },
  userEmail: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  userRole: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  menuItems: { flex: 1, paddingTop: spacing.md },
  menuItem: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  menuItemActive: {
    backgroundColor: colors.primarySoft,
  },
  menuIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 44,
    borderRadius: radius.md,
  },
  signOutText: { ...typography.body, color: colors.surface, fontWeight: '600' },
});
