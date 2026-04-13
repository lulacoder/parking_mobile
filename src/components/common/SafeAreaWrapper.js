import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { isIOS, hasNotch } from '../../utils/platform';
import { colors } from '../../constants/theme';

/**
 * SafeAreaWrapper component that handles safe area insets across platforms
 * Provides consistent safe area handling for iOS notched devices and Android
 */
export function SafeAreaWrapper({ 
  children, 
  style, 
  edges = ['top', 'bottom', 'left', 'right'],
  backgroundColor = colors.background 
}) {
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

/**
 * Custom hook to get safe area insets with platform-specific handling
 */
export function usePlatformSafeArea() {
  const insets = useSafeAreaInsets();
  
  // Apply platform-specific adjustments
  return {
    top: isIOS ? insets.top : Math.max(insets.top, 24), // Ensure minimum top padding on Android
    bottom: isIOS && hasNotch() ? Math.max(insets.bottom, 34) : insets.bottom,
    left: insets.left,
    right: insets.right,
  };
}

/**
 * SafeAreaInsetView - A view that applies safe area insets as padding
 * Useful when you need more control over safe area handling
 */
export function SafeAreaInsetView({ 
  children, 
  style, 
  applyTop = true, 
  applyBottom = true, 
  applyLeft = true, 
  applyRight = true 
}) {
  const insets = usePlatformSafeArea();
  
  const safeAreaStyle = {
    paddingTop: applyTop ? insets.top : 0,
    paddingBottom: applyBottom ? insets.bottom : 0,
    paddingLeft: applyLeft ? insets.left : 0,
    paddingRight: applyRight ? insets.right : 0,
  };
  
  return (
    <View style={[safeAreaStyle, style]}>
      {children}
    </View>
  );
}

/**
 * StatusBarSpacer - Creates space for the status bar on iOS
 * Useful for screens that don't use SafeAreaView but need status bar spacing
 */
export function StatusBarSpacer({ backgroundColor = colors.background }) {
  const insets = usePlatformSafeArea();
  
  if (!isIOS || insets.top === 0) {
    return null;
  }
  
  return (
    <View 
      style={[
        styles.statusBarSpacer, 
        { 
          height: insets.top, 
          backgroundColor 
        }
      ]} 
    />
  );
}

/**
 * BottomSafeAreaSpacer - Creates space for the home indicator on iOS
 * Useful for screens with bottom navigation or floating action buttons
 */
export function BottomSafeAreaSpacer({ backgroundColor = colors.background }) {
  const insets = usePlatformSafeArea();
  
  if (!isIOS || insets.bottom === 0) {
    return null;
  }
  
  return (
    <View 
      style={[
        styles.bottomSpacer, 
        { 
          height: insets.bottom, 
          backgroundColor 
        }
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarSpacer: {
    width: '100%',
  },
  bottomSpacer: {
    width: '100%',
  },
});

export default SafeAreaWrapper;