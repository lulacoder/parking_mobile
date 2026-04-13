# Hooks

## useProtectedRoute

A custom hook that enforces authentication and role-based access control for protected screens.

### Usage

```javascript
import { useProtectedRoute } from '../../src/hooks/useProtectedRoute';

export default function AdminHomeScreen() {
  // Only allow admin users to access this screen
  const { user, userRole, initializing } = useProtectedRoute(['admin']);

  // Show nothing while checking authentication
  if (initializing) return null;

  return (
    <View>
      <Text>Admin Dashboard</Text>
    </View>
  );
}
```

### Parameters

- `allowedRoles` (string[], optional): Array of roles allowed to access the screen
  - If empty array or not provided, any authenticated user can access
  - If specified, only users with matching roles can access

### Return Value

Returns an object with:
- `user`: The authenticated Firebase user object (or null)
- `userRole`: The user's role string (e.g., 'admin', 'owner', 'operator', 'driver')
- `initializing`: Boolean indicating if authentication is still initializing

### Behavior

1. **Not Authenticated**: Redirects to `/login`
2. **Wrong Role**: Redirects to the user's role-specific home screen
3. **Authorized**: Returns user data and allows screen to render

### Examples

#### Any authenticated user
```javascript
const { user, userRole, initializing } = useProtectedRoute();
```

#### Driver-only screen
```javascript
const { user, userRole, initializing } = useProtectedRoute(['driver']);
```

#### Multiple roles allowed
```javascript
const { user, userRole, initializing } = useProtectedRoute(['admin', 'owner']);
```

### Requirements

Implements requirements:
- 7.7: Role-based access control with Role_Guard components
- 8.7: Prevent navigation to screens not allowed for user's role
- 17.3: Maintain consistent naming conventions with Web_App
