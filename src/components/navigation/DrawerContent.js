import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import SafeAreaWrapper, { usePlatformSafeArea } from '../common/SafeAreaWrapper';
import { colors, spacing, typography } from '../../constants/theme';
import { showPlatformAlert, triggerHapticFeedback, getPlatformButtonStyle } from '../../utils/platform';

export default function DrawerContent(props) {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const safeArea = usePlatformSafeArea();
  const platformButtonStyle = getPlatformButtonStyle();

  const handleSignOut = async () => {
    triggerHapticFeedback('light');
    
    showPlatformAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHapticFeedback('success');
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              triggerHapticFeedback('error');
              showPlatformAlert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const navigateToScreen = (screenPath, screenName) => {
    triggerHapticFeedback('light');
    router.push(screenPath);
  };

  const getMenuItems = () => {
    const items = [];
    
    if (userRole === 'admin') {
      items.push({
        key: 'admin',
        label: 'Dashboard',
        path: '/admin',
        isActive: pathname.startsWith('/admin')
      });
    } else if (userRole === 'owner') {
      items.push({
        key: 'owner',
        label: 'Dashboard', 
        path: '/owner',
        isActive: pathname.startsWith('/owner')
      });
    } else if (userRole === 'operator') {
      items.push({
        key: 'operator',
        label: 'Dashboard',
        path: '/operator', 
        isActive: pathname.startsWith('/operator')
      });
    } else if (userRole === 'driver') {
      items.push(
        {
          key: 'driver',
          label: 'Home',
          path: '/driver',
          isActive: pathname === '/driver'
        },
        {
          key: 'checkin',
          label: 'Check In',
          path: '/driver/checkin-confirm',
          isActive: pathname === '/driver/checkin-confirm'
        }
      );
    }
    
    return items;
  };

  return (
    <View style={[styles.container, { paddingTop: safeArea.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text 
            style={styles.headerTitle}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="Smart Parking"
          >
            Smart Parking
          </Text>
          {user && (
            <View 
              style={styles.userInfo}
              accessible={true}
              accessibilityLabel={`Signed in as ${user.email}, role: ${userRole}`}
            >
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{userRole.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.menuItems}>
          {getMenuItems().map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                item.isActive && styles.menuItemActive
              ]}
              onPress={() => navigateToScreen(item.path, item.label)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint={`Navigate to ${item.label}`}
              accessibilityState={{ selected: item.isActive }}
              testID={`drawer-${item.key}-button`}
            >
              <Text style={[
                styles.menuItemText,
                item.isActive && styles.menuItemTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: safeArea.bottom }]}>
        <TouchableOpacity
          style={[styles.signOutButton, platformButtonStyle]}
          onPress={handleSignOut}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
          accessibilityHint="Sign out of your account"
          testID="drawer-signout-button"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  userInfo: {
    marginTop: spacing.sm,
  },
  userEmail: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userRole: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  menuItems: {
    flex: 1,
    paddingTop: spacing.md,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44, // Ensure minimum 44x44 touch target
    justifyContent: 'center',
  },
  menuItemActive: {
    backgroundColor: colors.primary + '20', // 20% opacity
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutButton: {
    backgroundColor: colors.danger,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 44, // Ensure minimum 44x44 touch target
  },
  signOutText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
});
