import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import Button from '../../../src/components/common/Button';
import { colors, spacing, typography } from '../../../src/constants/theme';

/**
 * Driver Home Screen
 * 
 * Main dashboard for driver users with access to parking features.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export default function DriverHomeScreen() {
  const { initializing } = useProtectedRoute(['driver']);
  const router = useRouter();

  if (initializing) return null;

  const handleCheckIn = () => {
    router.push('/driver/checkin-confirm');
  };

  return (
    <View style={styles.container}>
      <Text 
        style={styles.title}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="Driver Dashboard"
      >
        Driver Dashboard
      </Text>
      <Text 
        style={styles.subtitle}
        accessible={true}
        accessibilityLabel="Find and book parking spaces"
      >
        Find and book parking spaces
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Check In to Parking" 
          onPress={handleCheckIn}
          accessibilityLabel="Check In to Parking"
          accessibilityHint="Navigate to parking check-in confirmation screen"
          testID="driver-checkin-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
});
