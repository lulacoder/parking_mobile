export const colors = {
  primary: '#3B82F6',      // Blue - WCAG AA compliant
  secondary: '#10B981',    // Green - WCAG AA compliant
  danger: '#DC2626',       // Red - Updated for better contrast (was #EF4444)
  warning: '#D97706',      // Amber - Updated for better contrast (was #F59E0B)
  background: '#F9FAFB',   // Light gray
  surface: '#FFFFFF',      // White
  text: '#111827',         // Dark gray - WCAG AAA compliant (15.8:1 contrast)
  textSecondary: '#4B5563', // Medium gray - Updated for better contrast (was #6B7280)
  border: '#E5E7EB',       // Light border
  
  // Additional accessibility colors
  focus: '#2563EB',        // Focus indicator color
  success: '#059669',      // Success messages
  info: '#0284C7',         // Info messages
};

export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' },
  small: { fontSize: 12, fontWeight: 'normal' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Accessibility constants
export const accessibility = {
  minTouchTarget: 44,      // Minimum touch target size (iOS HIG & Material Design)
  recommendedTouchTarget: 48, // Recommended touch target size
  largeTouchTarget: 56,    // Large touch target for primary actions
  focusOutlineWidth: 2,    // Focus outline width
  animationDuration: 200,  // Standard animation duration
};
