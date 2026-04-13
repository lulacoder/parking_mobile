import { FALLBACK_ROLE, ALLOWED_ROLES, ROLE_HOME, sanitizeRole, getRoleHome } from './roleUtils';

describe('roleUtils', () => {
  describe('Constants', () => {
    test('FALLBACK_ROLE should be "driver"', () => {
      expect(FALLBACK_ROLE).toBe('driver');
    });

    test('ALLOWED_ROLES should contain all four roles', () => {
      expect(ALLOWED_ROLES).toEqual(['admin', 'owner', 'operator', 'driver']);
    });

    test('ROLE_HOME should map all four roles', () => {
      expect(ROLE_HOME).toEqual({
        admin: 'admin',
        owner: 'owner',
        operator: 'operator',
        driver: 'driver',
      });
    });
  });

  describe('sanitizeRole', () => {
    test('should return valid role when given valid role', () => {
      expect(sanitizeRole('admin')).toBe('admin');
      expect(sanitizeRole('owner')).toBe('owner');
      expect(sanitizeRole('operator')).toBe('operator');
      expect(sanitizeRole('driver')).toBe('driver');
    });

    test('should normalize role to lowercase', () => {
      expect(sanitizeRole('ADMIN')).toBe('admin');
      expect(sanitizeRole('Owner')).toBe('owner');
      expect(sanitizeRole('OPERATOR')).toBe('operator');
    });

    test('should trim whitespace', () => {
      expect(sanitizeRole('  admin  ')).toBe('admin');
      expect(sanitizeRole(' owner ')).toBe('owner');
    });

    test('should return FALLBACK_ROLE for invalid roles', () => {
      expect(sanitizeRole('invalid')).toBe(FALLBACK_ROLE);
      expect(sanitizeRole('superadmin')).toBe(FALLBACK_ROLE);
      expect(sanitizeRole('')).toBe(FALLBACK_ROLE);
    });

    test('should return FALLBACK_ROLE for non-string inputs', () => {
      expect(sanitizeRole(null)).toBe(FALLBACK_ROLE);
      expect(sanitizeRole(undefined)).toBe(FALLBACK_ROLE);
      expect(sanitizeRole(123)).toBe(FALLBACK_ROLE);
      expect(sanitizeRole({})).toBe(FALLBACK_ROLE);
      expect(sanitizeRole([])).toBe(FALLBACK_ROLE);
    });
  });

  describe('getRoleHome', () => {
    test('should return correct home screen for valid roles', () => {
      expect(getRoleHome('admin')).toBe('admin');
      expect(getRoleHome('owner')).toBe('owner');
      expect(getRoleHome('operator')).toBe('operator');
      expect(getRoleHome('driver')).toBe('driver');
    });

    test('should sanitize role before returning home screen', () => {
      expect(getRoleHome('ADMIN')).toBe('admin');
      expect(getRoleHome('  owner  ')).toBe('owner');
    });

    test('should return driver home for invalid roles', () => {
      expect(getRoleHome('invalid')).toBe('driver');
      expect(getRoleHome(null)).toBe('driver');
      expect(getRoleHome(undefined)).toBe('driver');
    });
  });
});
