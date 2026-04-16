import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';
import { getPlatformButtonStyle, triggerHapticFeedback } from '../../utils/platform';

export default function Button({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...props
}) {
  const isDisabled = disabled || loading;
  const platformButtonStyle = getPlatformButtonStyle();
  
  const handlePress = () => {
    if (hapticFeedback && !isDisabled) {
      triggerHapticFeedback('light');
    }
    onPress && onPress();
  };
  
  // Generate accessibility label if not provided
  const defaultAccessibilityLabel = loading ? `${title}, loading` : title;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && [styles.primaryButton, shadows.button],
        variant === 'secondary' && styles.secondaryButton,
        isDisabled && styles.disabledButton,
        platformButtonStyle,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={colors.surface} 
          accessibilityLabel="Loading"
        />
      ) : (
        <Text style={[
          styles.buttonText,
          variant === 'primary' && styles.primaryButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
          isDisabled && styles.disabledButtonText,
          textStyle,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    minHeight: 44, // Ensure minimum 44x44 touch target
    minWidth: 44,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  disabledButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: colors.surface,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
});
