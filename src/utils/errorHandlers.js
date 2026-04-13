/**
 * Maps Firebase authentication error codes to user-friendly messages
 * @param {Error} error - Firebase authentication error
 * @returns {string} User-friendly error message
 */
export const handleAuthError = (error) => {
  const errorMessages = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'Email already in use',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/invalid-credential': 'Invalid email or password',
  };

  return errorMessages[error.code] || error.message || 'An error occurred. Please try again';
};

/**
 * Handles network-related errors and returns user-friendly messages
 * @param {Error} error - Network error object
 * @returns {string} User-friendly error message
 */
export const handleNetworkError = (error) => {
  // Check for common network error patterns
  if (!error) {
    return 'An unknown error occurred';
  }

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  // Network connectivity issues
  if (
    errorCode.includes('network') ||
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network request failed')
  ) {
    return 'Network error. Please check your internet connection';
  }

  // Timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorCode.includes('timeout') ||
    error.name === 'PROFILE_TIMEOUT'
  ) {
    return 'Request timed out. Please try again';
  }

  // Server errors
  if (errorCode.includes('unavailable') || errorMessage.includes('unavailable')) {
    return 'Service temporarily unavailable. Please try again later';
  }

  // Permission/auth errors
  if (errorCode.includes('permission') || errorMessage.includes('permission')) {
    return 'You do not have permission to perform this action';
  }

  // Firestore specific errors
  if (errorCode.includes('firestore')) {
    return 'Database error. Please try again';
  }

  // Default fallback
  return error.message || 'An error occurred. Please try again';
};
