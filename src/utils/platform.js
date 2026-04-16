import { Platform as RNPlatform } from 'react-native';
import { getStatusBarHeight } from 'react-native-safe-area-context';

/**
 * Platform detection utilities for iOS and Android specific handling
 */

// Platform detection
const Platform = RNPlatform || { OS: 'ios', Version: 0 };

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Platform version
export const platformVersion = Platform.Version;

// Screen dimensions (safe defaults for tests and web tooling)
export const screenWidth = 390;
export const screenHeight = 844;

/**
 * Check if device has a notch (iPhone X and newer)
 * This is a heuristic based on screen dimensions and status bar height
 */
export const hasNotch = () => {
  if (!isIOS) return false;
  
  const statusBarHeight = getStatusBarHeight();
  
  // iPhone X and newer have status bar height > 20
  // Also check for common notched device dimensions
  const isNotchedDevice = statusBarHeight > 20 || 
    (screenHeight >= 812 && screenWidth >= 375); // iPhone X+ dimensions
  
  return isNotchedDevice;
};

/**
 * Get safe area insets for the current device
 * Returns default values if safe area context is not available
 */
export const getSafeAreaInsets = () => {
  try {
    const { useSafeAreaInsets } = require('react-native-safe-area-context');
    return useSafeAreaInsets();
  } catch (error) {
    // Fallback values if safe area context is not available
    return {
      top: isIOS ? (hasNotch() ? 44 : 20) : 0,
      bottom: isIOS ? (hasNotch() ? 34 : 0) : 0,
      left: 0,
      right: 0,
    };
  }
};

/**
 * Platform-specific navigation options
 */
export const getNavigationOptions = () => {
  return {
    headerStyle: {
      backgroundColor: '#1D4ED8',
      elevation: isAndroid ? 8 : 0,
      shadowOpacity: isIOS ? 0.22 : 0,
      shadowRadius: isIOS ? 10 : 0,
      shadowOffset: isIOS ? { width: 0, height: 4 } : { width: 0, height: 0 },
    },
    headerTitleStyle: {
      color: '#FFFFFF',
      fontSize: isIOS ? 22 : 24,
      fontWeight: '800',
    },
    headerTintColor: '#FFFFFF',
    animation: isIOS ? 'slide_from_right' : 'slide_from_bottom',
  };
};

/**
 * Platform-specific button styles
 */
export const getPlatformButtonStyle = () => {
  return {
    borderRadius: isIOS ? 8 : 4,
    elevation: isAndroid ? 2 : 0,
    shadowOpacity: isIOS ? 0.2 : 0,
    shadowRadius: isIOS ? 2 : 0,
    shadowOffset: isIOS ? { width: 0, height: 1 } : { width: 0, height: 0 },
  };
};

/**
 * Platform-specific input styles
 */
export const getPlatformInputStyle = () => {
  return {
    borderRadius: isIOS ? 8 : 4,
    borderWidth: isIOS ? 1 : 0,
    borderBottomWidth: isAndroid ? 2 : 1,
    paddingHorizontal: isIOS ? 12 : 8,
    paddingVertical: isIOS ? 12 : 8,
  };
};

/**
 * Platform-specific alert/modal presentation
 */
export const showPlatformAlert = (title, message, buttons = []) => {
  const { Alert } = require('react-native');
  
  if (isIOS) {
    // iOS style alert
    Alert.alert(title, message, buttons, { cancelable: false });
  } else {
    // Android style alert with different button order
    const androidButtons = buttons.reverse();
    Alert.alert(title, message, androidButtons, { cancelable: true });
  }
};

/**
 * Platform-specific haptic feedback
 */
export const triggerHapticFeedback = (type = 'light') => {
  try {
    if (isIOS) {
      const { Haptics } = require('expo-haptics');
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    // Android devices handle haptic feedback through system settings
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Platform-specific status bar configuration
 */
export const getStatusBarConfig = () => {
  return {
    style: 'light',
    backgroundColor: isAndroid ? '#1D4ED8' : 'transparent',
    translucent: isAndroid,
  };
};

/**
 * Check if device supports biometric authentication
 * Note: Requires expo-local-authentication package to be installed
 */
export const supportsBiometrics = async () => {
  try {
    // Check if expo-local-authentication is available
    const LocalAuthentication = require('expo-local-authentication');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.warn('Biometric authentication not available - expo-local-authentication not installed:', error);
    return false;
  }
};

/**
 * Platform-specific keyboard behavior
 */
export const getKeyboardBehavior = () => {
  return isIOS ? 'padding' : 'height';
};

/**
 * Platform-specific navigation gesture configuration
 */
export const getGestureConfig = () => {
  return {
    gestureEnabled: true,
    gestureDirection: isIOS ? 'horizontal' : 'vertical',
    gestureResponseDistance: isIOS ? 50 : 100,
  };
};

export default {
  isIOS,
  isAndroid,
  platformVersion,
  screenWidth,
  screenHeight,
  hasNotch,
  getSafeAreaInsets,
  getNavigationOptions,
  getPlatformButtonStyle,
  getPlatformInputStyle,
  showPlatformAlert,
  triggerHapticFeedback,
  getStatusBarConfig,
  supportsBiometrics,
  getKeyboardBehavior,
  getGestureConfig,
};
