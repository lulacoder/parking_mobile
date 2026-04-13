import { handleAuthError, handleNetworkError } from './errorHandlers';

describe('errorHandlers', () => {
  describe('handleAuthError', () => {
    it('should return user-friendly message for invalid email', () => {
      const error = { code: 'auth/invalid-email' };
      expect(handleAuthError(error)).toBe('Invalid email address');
    });

    it('should return user-friendly message for user disabled', () => {
      const error = { code: 'auth/user-disabled' };
      expect(handleAuthError(error)).toBe('This account has been disabled');
    });

    it('should return user-friendly message for user not found', () => {
      const error = { code: 'auth/user-not-found' };
      expect(handleAuthError(error)).toBe('No account found with this email');
    });

    it('should return user-friendly message for wrong password', () => {
      const error = { code: 'auth/wrong-password' };
      expect(handleAuthError(error)).toBe('Incorrect password');
    });

    it('should return user-friendly message for email already in use', () => {
      const error = { code: 'auth/email-already-in-use' };
      expect(handleAuthError(error)).toBe('Email already in use');
    });

    it('should return user-friendly message for weak password', () => {
      const error = { code: 'auth/weak-password' };
      expect(handleAuthError(error)).toBe('Password should be at least 6 characters');
    });

    it('should return user-friendly message for network request failed', () => {
      const error = { code: 'auth/network-request-failed' };
      expect(handleAuthError(error)).toBe('Network error. Please check your connection');
    });

    it('should return user-friendly message for too many requests', () => {
      const error = { code: 'auth/too-many-requests' };
      expect(handleAuthError(error)).toBe('Too many failed attempts. Please try again later');
    });

    it('should return user-friendly message for invalid credential', () => {
      const error = { code: 'auth/invalid-credential' };
      expect(handleAuthError(error)).toBe('Invalid email or password');
    });

    it('should return error message for unknown error codes', () => {
      const error = { code: 'auth/unknown-error', message: 'Custom error message' };
      expect(handleAuthError(error)).toBe('Custom error message');
    });

    it('should return default message when no code or message', () => {
      const error = { code: 'auth/unknown-error' };
      expect(handleAuthError(error)).toBe('An error occurred. Please try again');
    });
  });

  describe('handleNetworkError', () => {
    it('should handle null or undefined errors', () => {
      expect(handleNetworkError(null)).toBe('An unknown error occurred');
      expect(handleNetworkError(undefined)).toBe('An unknown error occurred');
    });

    it('should detect network connectivity issues from code', () => {
      const error = { code: 'network-error', message: 'Something went wrong' };
      expect(handleNetworkError(error)).toBe('Network error. Please check your internet connection');
    });

    it('should detect network connectivity issues from message', () => {
      const error = { message: 'Network request failed' };
      expect(handleNetworkError(error)).toBe('Network error. Please check your internet connection');
    });

    it('should detect failed to fetch errors', () => {
      const error = { message: 'Failed to fetch' };
      expect(handleNetworkError(error)).toBe('Network error. Please check your internet connection');
    });

    it('should detect timeout errors from message', () => {
      const error = { message: 'Request timeout' };
      expect(handleNetworkError(error)).toBe('Request timed out. Please try again');
    });

    it('should detect timeout errors from code', () => {
      const error = { code: 'timeout' };
      expect(handleNetworkError(error)).toBe('Request timed out. Please try again');
    });

    it('should detect PROFILE_TIMEOUT error', () => {
      const error = { name: 'PROFILE_TIMEOUT', message: 'Profile fetch timed out' };
      expect(handleNetworkError(error)).toBe('Request timed out. Please try again');
    });

    it('should detect service unavailable errors', () => {
      const error = { code: 'unavailable', message: 'Service unavailable' };
      expect(handleNetworkError(error)).toBe('Service temporarily unavailable. Please try again later');
    });

    it('should detect permission errors', () => {
      const error = { code: 'permission-denied', message: 'Permission denied' };
      expect(handleNetworkError(error)).toBe('You do not have permission to perform this action');
    });

    it('should detect Firestore errors', () => {
      const error = { code: 'firestore/error', message: 'Firestore error' };
      expect(handleNetworkError(error)).toBe('Database error. Please try again');
    });

    it('should return error message for unrecognized errors', () => {
      const error = { message: 'Some other error' };
      expect(handleNetworkError(error)).toBe('Some other error');
    });

    it('should return default message when no message available', () => {
      const error = { code: 'unknown' };
      expect(handleNetworkError(error)).toBe('An error occurred. Please try again');
    });
  });
});
