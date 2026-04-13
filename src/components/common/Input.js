import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { getPlatformInputStyle } from '../../utils/platform';

export default function Input({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  editable = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...props
}) {
  const platformInputStyle = getPlatformInputStyle();
  
  // Generate accessibility label if not provided
  const defaultAccessibilityLabel = accessibilityLabel || placeholder || 'Text input';
  
  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          platformInputStyle,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          style
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.textSecondary}
        editable={editable}
        accessible={true}
        accessibilityLabel={defaultAccessibilityLabel}
        accessibilityHint={accessibilityHint || (secureTextEntry ? 'Secure text entry' : undefined)}
        accessibilityState={{
          disabled: !editable,
        }}
        testID={testID}
        {...props}
      />
      {error && (
        <Text 
          style={styles.errorText}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${error}`}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
    minHeight: 44, // Ensure minimum 44x44 touch target
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    opacity: 0.7,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
