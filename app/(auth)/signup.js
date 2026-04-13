import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../src/contexts/AuthContext';
import Button from '../../src/components/common/Button';
import Input from '../../src/components/common/Input';
import { handleAuthError } from '../../src/utils/errorHandlers';
import { validateEmail, validatePassword } from '../../src/utils/validators';
import { ALLOWED_ROLES } from '../../src/utils/roleUtils';
import { colors, spacing, typography } from '../../src/constants/theme';
import { showPlatformAlert } from '../../src/utils/platform';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    // Validate all fields
    if (!email || !password || !role) {
      showPlatformAlert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      showPlatformAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showPlatformAlert('Invalid Password', passwordValidation.error);
      return;
    }

    // Show warning for weak but acceptable passwords
    if (passwordValidation.warning) {
      showPlatformAlert(
        'Weak Password',
        `${passwordValidation.warning}\n\nDo you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => performSignup() },
        ]
      );
      return;
    }

    await performSignup();
  };

  const performSignup = async () => {
    try {
      setLoading(true);
      await signUp(email, password, role);
      // Navigation handled by app/index.js
    } catch (error) {
      showPlatformAlert('Signup Failed', handleAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text 
          style={styles.title}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Create Account"
        >
          Create Account
        </Text>
        <Text 
          style={styles.subtitle}
          accessible={true}
          accessibilityLabel="Join the Smart Parking System"
        >
          Join the Smart Parking System
        </Text>
        
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          accessibilityLabel="Email address"
          accessibilityHint="Enter your email address for your new account"
          testID="signup-email-input"
        />
        
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          editable={!loading}
          accessibilityLabel="Password"
          accessibilityHint="Enter a secure password for your new account"
          testID="signup-password-input"
        />
        
        <View style={styles.pickerContainer}>
          <Text 
            style={styles.pickerLabel}
            accessible={true}
            accessibilityLabel="Select Role"
          >
            Select Role
          </Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={styles.picker}
              accessible={true}
              accessibilityLabel="Role selection"
              accessibilityHint="Choose your role in the parking system"
              testID="signup-role-picker"
            >
              {ALLOWED_ROLES.map((roleOption) => (
                <Picker.Item
                  key={roleOption}
                  label={roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                  value={roleOption}
                />
              ))}
            </Picker>
          </View>
        </View>
        
        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
          accessibilityLabel="Sign Up"
          accessibilityHint="Tap to create your new account"
          testID="signup-submit-button"
        />
        
        <Link href="/login" style={styles.link}>
          <Text 
            style={styles.linkText}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Sign In"
            accessibilityHint="Navigate to sign in screen if you already have an account"
          >
            Already have an account? Sign In
          </Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 44, // Ensure minimum 44x44 touch target
  },
  picker: {
    height: 50,
  },
  link: {
    marginTop: spacing.md,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
});
