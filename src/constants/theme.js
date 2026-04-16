export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#DBEAFE',
  secondary: '#0EA5E9',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  info: '#0284C7',
  background: '#EEF3FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#475569',
  border: '#D6E0EF',
  focus: '#1E40AF',
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '800', letterSpacing: 0.2 },
  h2: { fontSize: 26, fontWeight: '800', letterSpacing: 0.15 },
  h3: { fontSize: 20, fontWeight: '700', letterSpacing: 0.1 },
  body: { fontSize: 16, fontWeight: '500' },
  caption: { fontSize: 14, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '500' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0B1736',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  button: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Accessibility constants
export const accessibility = {
  minTouchTarget: 44,      // Minimum touch target size (iOS HIG & Material Design)
  recommendedTouchTarget: 48, // Recommended touch target size
  largeTouchTarget: 56,    // Large touch target for primary actions
  focusOutlineWidth: 2,    // Focus outline width
  animationDuration: 240,
};
