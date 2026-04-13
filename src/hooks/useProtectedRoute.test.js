import { useProtectedRoute } from './useProtectedRoute';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../utils/roleUtils', () => ({
  sanitizeRole: jest.fn((role) => role),
  getRoleHome: jest.fn((role) => role),
}));

describe('useProtectedRoute', () => {
  test('should be a function', () => {
    expect(typeof useProtectedRoute).toBe('function');
  });

  test('should accept allowedRoles parameter', () => {
    expect(useProtectedRoute.length).toBe(1);
  });
});
