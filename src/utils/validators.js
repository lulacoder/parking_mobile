/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Object with isValid boolean and error message if invalid
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  // Weak but acceptable password (6-7 characters)
  if (password.length < 8) {
    return { 
      isValid: true, 
      warning: 'Password is weak. Consider using at least 8 characters' 
    };
  }

  // Check for complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return { 
      isValid: true, 
      warning: 'Password is weak. Consider using uppercase, lowercase, and numbers' 
    };
  }

  return { isValid: true };
};
