import { Platform } from 'react-native';

// Mock Platform before importing platform utilities
const mockPlatform = {
  OS: 'ios',
  Version: '15.0',
};

jest.mock('react-native', () => ({
  Platform: mockPlatform,
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  getStatusBarHeight: jest.fn(() => 44),
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
  },
}));

describe('Platform Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Platform Detection', () => {
    test('should detect iOS platform', () => {
      mockPlatform.OS = 'ios';
      const {
        isIOS,
        isAndroid,
      } = require('./platform');
      
      expect(isIOS).toBe(true);
      expect(isAndroid).toBe(false);
    });

    test('should detect Android platform', () => {
      mockPlatform.OS = 'android';
      const {
        isIOS,
        isAndroid,
      } = require('./platform');
      
      expect(isAndroid).toBe(true);
      expect(isIOS).toBe(false);
    });
  });

  describe('Notch Detection', () => {
    test('should detect notched device on iOS', () => {
      mockPlatform.OS = 'ios';
      const { hasNotch } = require('./platform');
      expect(hasNotch()).toBe(true);
    });

    test('should not detect notch on Android', () => {
      mockPlatform.OS = 'android';
      const { hasNotch } = require('./platform');
      expect(hasNotch()).toBe(false);
    });
  });

  describe('Safe Area Insets', () => {
    test('should return safe area insets', () => {
      mockPlatform.OS = 'ios';
      const { getSafeAreaInsets } = require('./platform');
      const insets = getSafeAreaInsets();
      expect(insets).toHaveProperty('top');
      expect(insets).toHaveProperty('bottom');
      expect(insets).toHaveProperty('left');
      expect(insets).toHaveProperty('right');
    });
  });

  describe('Navigation Options', () => {
    test('should return iOS navigation options', () => {
      mockPlatform.OS = 'ios';
      const { getNavigationOptions } = require('./platform');
      const options = getNavigationOptions();
      expect(options).toHaveProperty('headerStyle');
      expect(options).toHaveProperty('headerTitleStyle');
      expect(options).toHaveProperty('headerTintColor');
      expect(options.animation).toBe('slide_from_right');
    });

    test('should return Android navigation options', () => {
      mockPlatform.OS = 'android';
      const { getNavigationOptions } = require('./platform');
      const options = getNavigationOptions();
      expect(options.animation).toBe('slide_from_bottom');
      expect(options.headerStyle.elevation).toBe(4);
    });
  });

  describe('Platform Styles', () => {
    test('should return iOS button styles', () => {
      mockPlatform.OS = 'ios';
      const { getPlatformButtonStyle } = require('./platform');
      const buttonStyle = getPlatformButtonStyle();
      expect(buttonStyle.borderRadius).toBe(8);
      expect(buttonStyle.elevation).toBe(0);
      expect(buttonStyle.shadowOpacity).toBe(0.2);
    });

    test('should return Android button styles', () => {
      mockPlatform.OS = 'android';
      const { getPlatformButtonStyle } = require('./platform');
      const buttonStyle = getPlatformButtonStyle();
      expect(buttonStyle.borderRadius).toBe(4);
      expect(buttonStyle.elevation).toBe(2);
      expect(buttonStyle.shadowOpacity).toBe(0);
    });

    test('should return iOS input styles', () => {
      mockPlatform.OS = 'ios';
      const { getPlatformInputStyle } = require('./platform');
      const inputStyle = getPlatformInputStyle();
      expect(inputStyle.borderRadius).toBe(8);
      expect(inputStyle.borderWidth).toBe(1);
      expect(inputStyle.paddingHorizontal).toBe(12);
    });

    test('should return Android input styles', () => {
      mockPlatform.OS = 'android';
      const { getPlatformInputStyle } = require('./platform');
      const inputStyle = getPlatformInputStyle();
      expect(inputStyle.borderRadius).toBe(4);
      expect(inputStyle.borderWidth).toBe(0);
      expect(inputStyle.borderBottomWidth).toBe(2);
      expect(inputStyle.paddingHorizontal).toBe(8);
    });
  });

  describe('Keyboard Behavior', () => {
    test('should return iOS keyboard behavior', () => {
      mockPlatform.OS = 'ios';
      const { getKeyboardBehavior } = require('./platform');
      expect(getKeyboardBehavior()).toBe('padding');
    });

    test('should return Android keyboard behavior', () => {
      mockPlatform.OS = 'android';
      const { getKeyboardBehavior } = require('./platform');
      expect(getKeyboardBehavior()).toBe('height');
    });
  });

  describe('Gesture Configuration', () => {
    test('should return iOS gesture config', () => {
      mockPlatform.OS = 'ios';
      const { getGestureConfig } = require('./platform');
      const config = getGestureConfig();
      expect(config.gestureEnabled).toBe(true);
      expect(config.gestureDirection).toBe('horizontal');
      expect(config.gestureResponseDistance).toBe(50);
    });

    test('should return Android gesture config', () => {
      mockPlatform.OS = 'android';
      const { getGestureConfig } = require('./platform');
      const config = getGestureConfig();
      expect(config.gestureDirection).toBe('vertical');
      expect(config.gestureResponseDistance).toBe(100);
    });
  });
});

// Simple integration test to verify platform utilities work
describe('Platform Utilities Integration', () => {
  test('should export all required functions', () => {
    const platformUtils = require('./platform');
    
    expect(typeof platformUtils.isIOS).toBe('boolean');
    expect(typeof platformUtils.isAndroid).toBe('boolean');
    expect(typeof platformUtils.hasNotch).toBe('function');
    expect(typeof platformUtils.getSafeAreaInsets).toBe('function');
    expect(typeof platformUtils.getNavigationOptions).toBe('function');
    expect(typeof platformUtils.getPlatformButtonStyle).toBe('function');
    expect(typeof platformUtils.getPlatformInputStyle).toBe('function');
    expect(typeof platformUtils.showPlatformAlert).toBe('function');
    expect(typeof platformUtils.triggerHapticFeedback).toBe('function');
    expect(typeof platformUtils.getKeyboardBehavior).toBe('function');
    expect(typeof platformUtils.getGestureConfig).toBe('function');
  });

  test('should return valid style objects', () => {
    const platformUtils = require('./platform');
    
    const buttonStyle = platformUtils.getPlatformButtonStyle();
    expect(buttonStyle).toHaveProperty('borderRadius');
    expect(typeof buttonStyle.borderRadius).toBe('number');
    
    const inputStyle = platformUtils.getPlatformInputStyle();
    expect(inputStyle).toHaveProperty('borderRadius');
    expect(typeof inputStyle.borderRadius).toBe('number');
  });

  test('should return valid navigation options', () => {
    const platformUtils = require('./platform');
    
    const navOptions = platformUtils.getNavigationOptions();
    expect(navOptions).toHaveProperty('headerStyle');
    expect(navOptions).toHaveProperty('headerTitleStyle');
    expect(navOptions).toHaveProperty('headerTintColor');
    expect(navOptions).toHaveProperty('animation');
  });

  test('should return valid keyboard behavior', () => {
    const platformUtils = require('./platform');
    
    const behavior = platformUtils.getKeyboardBehavior();
    expect(['padding', 'height']).toContain(behavior);
  });

  test('should return valid gesture config', () => {
    const platformUtils = require('./platform');
    
    const config = platformUtils.getGestureConfig();
    expect(config).toHaveProperty('gestureEnabled');
    expect(config).toHaveProperty('gestureDirection');
    expect(config).toHaveProperty('gestureResponseDistance');
    expect(typeof config.gestureEnabled).toBe('boolean');
    expect(['horizontal', 'vertical']).toContain(config.gestureDirection);
    expect(typeof config.gestureResponseDistance).toBe('number');
  });
});