import {
  announceForAccessibility,
  getErrorAccessibilityLabel,
  getLoadingAccessibilityLabel,
  getNavigationAccessibilityHint,
  getStatusAccessibilityLabel,
  ensureMinimumTouchTarget,
  createAccessibleButtonProps,
  createAccessibleInputProps,
  ACCESSIBILITY_ROLES,
  COMMON_LABELS,
  COMMON_HINTS,
  TOUCH_TARGET,
} from '../accessibility';

// Mock React Native modules
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    announceForAccessibility: jest.fn(),
    announceForAccessibilityWithOptions: jest.fn(),
    setAccessibilityFocus: jest.fn(),
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  },
  findNodeHandle: jest.fn(() => 123),
}));

jest.mock('../platform', () => ({
  isIOS: true,
}));

describe('Accessibility Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('announceForAccessibility', () => {
    it('should announce message for accessibility', () => {
      const { AccessibilityInfo } = require('react-native');
      
      announceForAccessibility('Test message');
      
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Test message');
    });

    it('should not announce empty messages', () => {
      const { AccessibilityInfo } = require('react-native');
      
      announceForAccessibility('');
      announceForAccessibility(null);
      announceForAccessibility(undefined);
      
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    });
  });

  describe('Label generators', () => {
    it('should generate error accessibility label', () => {
      const label = getErrorAccessibilityLabel('Email', 'Invalid email format');
      expect(label).toBe('Email has error: Invalid email format');
    });

    it('should generate loading accessibility label', () => {
      const label = getLoadingAccessibilityLabel('Sign In');
      expect(label).toBe('Sign In, loading');
    });

    it('should generate navigation accessibility hint', () => {
      const hint = getNavigationAccessibilityHint('Dashboard');
      expect(hint).toBe('Navigate to Dashboard');
    });

    it('should generate status accessibility label', () => {
      const label = getStatusAccessibilityLabel('active', 'User');
      expect(label).toBe('User status: active');
    });
  });

  describe('Touch target utilities', () => {
    it('should ensure minimum touch target size', () => {
      expect(ensureMinimumTouchTarget(30)).toBe(44);
      expect(ensureMinimumTouchTarget(50)).toBe(50);
      expect(ensureMinimumTouchTarget(44)).toBe(44);
    });

    it('should have correct touch target constants', () => {
      expect(TOUCH_TARGET.MINIMUM).toBe(44);
      expect(TOUCH_TARGET.RECOMMENDED).toBe(48);
      expect(TOUCH_TARGET.LARGE).toBe(56);
    });
  });

  describe('Accessible props creators', () => {
    it('should create accessible button props', () => {
      const props = createAccessibleButtonProps('Submit', 'Submit the form', false, false);
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: 'Submit',
        accessibilityHint: 'Submit the form',
        accessibilityState: {
          disabled: false,
          busy: false,
        },
      });
    });

    it('should create accessible button props for loading state', () => {
      const props = createAccessibleButtonProps('Submit', 'Submit the form', false, true);
      
      expect(props.accessibilityLabel).toBe('Submit, loading');
      expect(props.accessibilityState.busy).toBe(true);
      expect(props.accessibilityState.disabled).toBe(true);
    });

    it('should create accessible input props', () => {
      const props = createAccessibleInputProps('Email', 'Enter your email', true, false, null);
      
      expect(props).toEqual({
        accessible: true,
        accessibilityLabel: 'Email, Required field',
        accessibilityHint: 'Enter your email',
        accessibilityState: {
          disabled: false,
        },
      });
    });

    it('should create accessible input props for secure entry', () => {
      const props = createAccessibleInputProps('Password', null, false, true, null);
      
      expect(props.accessibilityHint).toBe('Secure text entry');
    });

    it('should create accessible input props with error', () => {
      const props = createAccessibleInputProps('Email', null, false, false, 'Invalid email');
      
      expect(props.accessibilityInvalid).toBe(true);
      expect(props.accessibilityErrorMessage).toBe('Invalid email');
    });
  });

  describe('Constants', () => {
    it('should have accessibility roles defined', () => {
      expect(ACCESSIBILITY_ROLES.BUTTON).toBe('button');
      expect(ACCESSIBILITY_ROLES.HEADER).toBe('header');
      expect(ACCESSIBILITY_ROLES.LINK).toBe('link');
      expect(ACCESSIBILITY_ROLES.ALERT).toBe('alert');
    });

    it('should have common labels defined', () => {
      expect(COMMON_LABELS.SIGN_IN).toBe('Sign in');
      expect(COMMON_LABELS.SIGN_OUT).toBe('Sign out');
      expect(COMMON_LABELS.LOADING).toBe('Loading');
      expect(COMMON_LABELS.ERROR).toBe('Error');
    });

    it('should have common hints defined', () => {
      expect(COMMON_HINTS.TAP_TO_ACTIVATE).toBe('Tap to activate');
      expect(COMMON_HINTS.SECURE_TEXT_ENTRY).toBe('Secure text entry');
      expect(COMMON_HINTS.REQUIRED_FIELD).toBe('This field is required');
    });
  });
});