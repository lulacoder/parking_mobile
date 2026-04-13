import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeRole, getRoleHome } from '../utils/roleUtils';

/**
 * Protected route hook that enforces authentication and role-based access control
 * 
 * @param {string[]} allowedRoles - Array of roles allowed to access this route (empty array = any authenticated user)
 * @returns {object} - { user, userRole, initializing }
 * 
 * Behavior:
 * - Redirects to login if user is not authenticated
 * - Redirects to role-specific home if user's role is not in allowedRoles
 * - Returns user, userRole, and initializing state for component use
 * 
 * Requirements: 7.7, 8.7, 17.3
 */
export function useProtectedRoute(allowedRoles) {
  const { user, userRole, initializing } = useAuth();
  const router = useRouter();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [];

  useEffect(() => {
    if (initializing) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check role permissions if allowedRoles is specified
    const role = sanitizeRole(userRole);
    if (roles.length > 0 && !roles.includes(role)) {
      // Redirect to role-specific home if accessing unauthorized screen
      const roleHome = getRoleHome(role);
      router.replace(`/${roleHome}`);
    }
  }, [user, userRole, initializing, allowedRoles, roles, router]);

  return { user, userRole, initializing };
}
