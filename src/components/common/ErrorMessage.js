import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

export default function ErrorMessage({ message, style }) {
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.danger + '15', // 15 is hex for ~8% opacity
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
});
