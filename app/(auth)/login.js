import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import Button from '../../src/components/common/Button';
import Input from '../../src/components/common/Input';
import SafeAreaWrapper from '../../src/components/common/SafeAreaWrapper';
import { handleAuthError } from '../../src/utils/errorHandlers';
import { colors, spacing, typography } from '../../src/constants/theme';
import { getKeyboardBehavior, showPlatformAlert } from '../../src/utils/platform';
import { useFocusManagement, useLoadingAnnouncement } from '../../src/hooks/useFocusManagement';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  // Focus management for accessibility
  const focusRef = useFocusManagement('Login Screen');
  
  // Announce loading states
  useLoadingAnnouncement(loading, 'Signing in', 'Sign in complete');

  const handleLogin = async () => {
    if (!email || !password) {
      showPlatformAlert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      // Navigation handled by app/index.js
    } catch (error) {
      showPlatformAlert('Login Failed', handleAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={getKeyboardBehavior()}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container} ref={focusRef}>
            <Text 
              style={styles.title}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Welcome Back"
            >
              Welcome Back
            </Text>
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address to sign in"
              testID="login-email-input"
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password to sign in"
              testID="login-password-input"
            />
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              accessibilityLabel="Sign In"
              accessibilityHint="Tap to sign in with your email and password"
              testID="login-submit-button"
            />
            <Link href="/signup" style={styles.link}>
              <Text 
                style={styles.linkText}
                accessible={true}
                accessibilityRole="link"
                accessibilityLabel="Don't have an account? Sign Up"
                accessibilityHint="Navigate to sign up screen to create a new account"
              >
                Don't have an account? Sign Up
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text,
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
