import { validateEmail, validatePassword } from './validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('invalid@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should reject empty passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject passwords shorter than 6 characters', () => {
      const result = validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 6 characters');
    });

    it('should warn for passwords 6-7 characters', () => {
      const result = validatePassword('123456');
      expect(result.isValid).toBe(true);
      expect(result.warning).toBe('Password is weak. Consider using at least 8 characters');
    });

    it('should warn for passwords without complexity', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(true);
      expect(result.warning).toBe('Password is weak. Consider using uppercase, lowercase, and numbers');
    });

    it('should accept strong passwords', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeUndefined();
    });
  });
});
