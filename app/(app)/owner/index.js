import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import { colors, spacing, typography } from '../../../src/constants/theme';

export default function OwnerHomeScreen() {
  const { initializing } = useProtectedRoute(['owner']);

  if (initializing) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text 
          style={styles.title}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Owner Dashboard"
        >
          Owner Dashboard
        </Text>
        <Text 
          style={styles.subtitle}
          accessible={true}
          accessibilityLabel="Manage your parking facilities"
        >
          Manage your parking facilities
        </Text>
        
        <View style={styles.section}>
          <Text 
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="My Facilities"
          >
            My Facilities
          </Text>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Facility Management"
            accessibilityHint="View and manage your parking facilities"
          >
            <Text style={styles.cardText}>Facility Management</Text>
            <Text style={styles.cardSubtext}>View and manage your parking facilities</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Occupancy Overview"
            accessibilityHint="Monitor real-time occupancy status"
          >
            <Text style={styles.cardText}>Occupancy Overview</Text>
            <Text style={styles.cardSubtext}>Monitor real-time occupancy status</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Revenue Reports"
            accessibilityHint="Track earnings and financial metrics"
          >
            <Text style={styles.cardText}>Revenue Reports</Text>
            <Text style={styles.cardSubtext}>Track earnings and financial metrics</Text>
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
            accessibilityLabel="Add New Facility"
            accessibilityHint="Register a new parking facility"
          >
            <Text style={styles.cardText}>Add New Facility</Text>
            <Text style={styles.cardSubtext}>Register a new parking facility</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Manage Operators"
            accessibilityHint="Assign operators to your facilities"
          >
            <Text style={styles.cardText}>Manage Operators</Text>
            <Text style={styles.cardSubtext}>Assign operators to your facilities</Text>
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
