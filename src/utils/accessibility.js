import { AccessibilityInfo, findNodeHandle } from 'react-native';
import { isIOS } from './platform';

/**
 * Accessibility utilities for improved screen reader support and focus management
 */

/**
 * Announce a message to screen readers
 * @param {string} message - The message to announce
 * @param {boolean} assertive - Whether the announcement should interrupt current speech
 */
export const announceForAccessibility = (message, assertive = false) => {
  if (!message) return;
  
  try {
    if (isIOS) {
      // iOS uses AccessibilityInfo.announceForAccessibility
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android uses AccessibilityInfo.announceForAccessibilityWithOptions
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: !assertive, // If assertive, don't queue (interrupt current speech)
      });
    }
  } catch (error) {
    console.warn('Failed to announce for accessibility:', error);
  }
};

/**
 * Set accessibility focus to a specific component
 * @param {React.RefObject} ref - Reference to the component to focus
 */
export const setAccessibilityFocus = (ref) => {
  if (!ref?.current) return;
  
  try {
    const reactTag = findNodeHandle(ref.current);
    if (reactTag) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  } catch (error) {
    console.warn('Failed to set accessibility focus:', error);
  }
};

/**
 * Check if screen reader is currently enabled
 * @returns {Promise<boolean>} - Promise that resolves to true if screen reader is enabled
 */
export const isScreenReaderEnabled = async () => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.warn('Failed to check screen reader status:', error);
    return false;
  }
};

/**
 * Check if reduce motion is enabled (for animations)
 * @returns {Promise<boolean>} - Promise that resolves to true if reduce motion is enabled
 */
export const isReduceMotionEnabled = async () => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.warn('Failed to check reduce motion status:', error);
    return false;
  }
};

/**
 * Generate accessibility label for form validation errors
 * @param {string} fieldName - Name of the field with error
 * @param {string} error - Error message
 * @returns {string} - Formatted accessibility label
 */
export const getErrorAccessibilityLabel = (fieldName, error) => {
  return `${fieldName} has error: ${error}`;
};

/**
 * Generate accessibility label for loading states
 * @param {string} action - The action being performed
 * @returns {string} - Formatted accessibility label
 */
export const getLoadingAccessibilityLabel = (action) => {
  return `${action}, loading`;
};

/**
 * Generate accessibility hint for navigation actions
 * @param {string} destination - Where the action will navigate to
 * @returns {string} - Formatted accessibility hint
 */
export const getNavigationAccessibilityHint = (destination) => {
  return `Navigate to ${destination}`;
};

/**
 * Generate accessibility label for status indicators
 * @param {string} status - Current status
 * @param {string} context - Context for the status
 * @returns {string} - Formatted accessibility label
 */
export const getStatusAccessibilityLabel = (status, context) => {
  return `${context} status: ${status}`;
};

/**
 * Accessibility constants for common roles and states
 */
export const ACCESSIBILITY_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  TEXT: 'text',
  IMAGE: 'image',
  ALERT: 'alert',
  SEARCH: 'search',
  TAB: 'tab',
  TABLIST: 'tablist',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SWITCH: 'switch',
  SLIDER: 'slider',
  PROGRESSBAR: 'progressbar',
  TIMER: 'timer',
};

/**
 * Accessibility traits for iOS (used in accessibilityTraits prop)
 */
export const ACCESSIBILITY_TRAITS = {
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  SEARCH_FIELD: 'searchField',
  IMAGE: 'image',
  SELECTED: 'selected',
  PLAYS_SOUND: 'playsSound',
  KEYBOARD_KEY: 'keyboardKey',
  STATIC_TEXT: 'staticText',
  SUMMARY_ELEMENT: 'summaryElement',
  NOT_ENABLED: 'notEnabled',
  UPDATES_FREQUENTLY: 'updatesFrequently',
  STARTS_MEDIA_SESSION: 'startsMediaSession',
  ADJUSTABLE: 'adjustable',
  ALLOWS_DIRECT_INTERACTION: 'allowsDirectInteraction',
  CAUSES_PAGE_TURN: 'causesPageTurn',
};

/**
 * Common accessibility labels for UI elements
 */
export const COMMON_LABELS = {
  CLOSE: 'Close',
  BACK: 'Go back',
  MENU: 'Menu',
  SEARCH: 'Search',
  LOADING: 'Loading',
  ERROR: 'Error',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  INFO: 'Information',
  REQUIRED: 'Required field',
  OPTIONAL: 'Optional field',
  SIGN_IN: 'Sign in',
  SIGN_OUT: 'Sign out',
  SIGN_UP: 'Sign up',
  SUBMIT: 'Submit',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  DELETE: 'Delete',
  EDIT: 'Edit',
  SAVE: 'Save',
  REFRESH: 'Refresh',
  MORE: 'More options',
  SETTINGS: 'Settings',
  HELP: 'Help',
  HOME: 'Home',
};

/**
 * Common accessibility hints for UI elements
 */
export const COMMON_HINTS = {
  TAP_TO_ACTIVATE: 'Tap to activate',
  TAP_TO_OPEN: 'Tap to open',
  TAP_TO_CLOSE: 'Tap to close',
  TAP_TO_SELECT: 'Tap to select',
  TAP_TO_NAVIGATE: 'Tap to navigate',
  DOUBLE_TAP_TO_ACTIVATE: 'Double tap to activate',
  SWIPE_TO_DISMISS: 'Swipe to dismiss',
  SWIPE_FOR_MORE: 'Swipe for more options',
  ENTER_TEXT: 'Enter text',
  SECURE_TEXT_ENTRY: 'Secure text entry',
  REQUIRED_FIELD: 'This field is required',
  OPTIONAL_FIELD: 'This field is optional',
};

/**
 * Minimum touch target size constants (in points)
 */
export const TOUCH_TARGET = {
  MINIMUM: 44, // iOS HIG and Android Material Design minimum
  RECOMMENDED: 48, // Android Material Design recommended
  LARGE: 56, // For primary actions
};

/**
 * Helper function to ensure minimum touch target size
 * @param {number} size - Current size
 * @returns {number} - Size adjusted to meet minimum requirements
 */
export const ensureMinimumTouchTarget = (size) => {
  return Math.max(size, TOUCH_TARGET.MINIMUM);
};

/**
 * Helper function to create accessible button props
 * @param {string} label - Button label
 * @param {string} hint - Optional hint
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} loading - Whether button is in loading state
 * @returns {object} - Accessibility props object
 */
export const createAccessibleButtonProps = (label, hint, disabled = false, loading = false) => {
  return {
    accessible: true,
    accessibilityRole: ACCESSIBILITY_ROLES.BUTTON,
    accessibilityLabel: loading ? getLoadingAccessibilityLabel(label) : label,
    accessibilityHint: hint,
    accessibilityState: {
      disabled: disabled || loading,
      busy: loading,
    },
  };
};

/**
 * Helper function to create accessible text input props
 * @param {string} label - Input label
 * @param {string} hint - Optional hint
 * @param {boolean} required - Whether input is required
 * @param {boolean} secure - Whether input is secure (password)
 * @param {string} error - Error message if any
 * @returns {object} - Accessibility props object
 */
export const createAccessibleInputProps = (label, hint, required = false, secure = false, error = null) => {
  const accessibilityLabel = required ? `${label}, ${COMMON_LABELS.REQUIRED}` : label;
  const accessibilityHint = hint || (secure ? COMMON_HINTS.SECURE_TEXT_ENTRY : COMMON_HINTS.ENTER_TEXT);
  
  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState: {
      disabled: false,
    },
    ...(error && {
      accessibilityInvalid: true,
      accessibilityErrorMessage: error,
    }),
  };
};

export default {
  announceForAccessibility,
  setAccessibilityFocus,
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  getErrorAccessibilityLabel,
  getLoadingAccessibilityLabel,
  getNavigationAccessibilityHint,
  getStatusAccessibilityLabel,
  ACCESSIBILITY_ROLES,
  ACCESSIBILITY_TRAITS,
  COMMON_LABELS,
  COMMON_HINTS,
  TOUCH_TARGET,
  ensureMinimumTouchTarget,
  createAccessibleButtonProps,
  createAccessibleInputProps,
};