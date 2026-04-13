import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import { colors, spacing, typography } from '../../../src/constants/theme';

export default function OperatorHomeScreen() {
  const { initializing } = useProtectedRoute(['operator']);

  if (initializing) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text 
          style={styles.title}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Operator Dashboard"
        >
          Operator Dashboard
        </Text>
        <Text 
          style={styles.subtitle}
          accessible={true}
          accessibilityLabel="Manage parking operations"
        >
          Manage parking operations
        </Text>
        
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
            accessibilityLabel="Monitor parking spaces"
            accessibilityHint="View and monitor available parking spaces"
          >
            <Text style={styles.cardText}>Monitor parking spaces</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Manage check-ins"
            accessibilityHint="Handle driver check-ins and check-outs"
          >
            <Text style={styles.cardText}>Manage check-ins</Text>
          </View>
          <View 
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View reports"
            accessibilityHint="Access operational reports and statistics"
          >
            <Text style={styles.cardText}>View reports</Text>
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44, // Ensure minimum 44x44 touch target
  },
  cardText: {
    ...typography.body,
    color: colors.text,
  },
});
