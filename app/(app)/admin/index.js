import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import { colors, spacing, typography } from '../../../src/constants/theme';

export default function AdminHomeScreen() {
  const { initializing } = useProtectedRoute(['admin']);

  if (initializing) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text 
          style={styles.title}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Admin Dashboard"
        >
          Admin Dashboard
        </Text>
        <Text 
          style={styles.subtitle}
          accessible={true}
          accessibilityLabel="Manage the parking management system"
        >
          Manage the parking management system
        </Text>
        
        <View style={styles.section}>
          <Text 
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="System Overview"
          >
            System Overview
          </Text>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="User Management"
            accessibilityHint="Manage users and roles"
          >
            <Text style={styles.cardText}>User Management</Text>
            <Text style={styles.cardSubtext}>Manage users and roles</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Parking Facilities"
            accessibilityHint="View all parking facilities"
          >
            <Text style={styles.cardText}>Parking Facilities</Text>
            <Text style={styles.cardSubtext}>View all parking facilities</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="System Settings"
            accessibilityHint="Configure system parameters"
          >
            <Text style={styles.cardText}>System Settings</Text>
            <Text style={styles.cardSubtext}>Configure system parameters</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text 
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="Quick Actions"
          >
            Quick Actions
          </Text>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View Reports"
            accessibilityHint="Access system reports and analytics"
          >
            <Text style={styles.cardText}>View Reports</Text>
            <Text style={styles.cardSubtext}>Access system reports and analytics</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Monitor Activity"
            accessibilityHint="Real-time system monitoring"
          >
            <Text style={styles.cardText}>Monitor Activity</Text>
            <Text style={styles.cardSubtext}>Real-time system monitoring</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44, // Ensure minimum 44x44 touch target
  },
  cardText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
