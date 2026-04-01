# 401/403 Error Handling - Component-Based Approach

This implementation provides a component-based solution for handling 401 (Unauthorized) and 403 (Forbidden) errors instead of redirecting to full pages. This allows users to retry their request without losing their place in the application.

## How It Works

### Components Created

1. **AuthContext.jsx** - Manages authentication error state
   - `authError`: Stores the current error (null, 401, or 403)
   - `setUnauthorized()`: Sets 401 error
   - `setForbidden()`: Sets 403 error
   - `clearAuthError()`: Clears the error

2. **useAuthError.js** - Hook to access AuthContext
   - Provides error management functions to any component

3. **Unauthorized.jsx** - 401 error component
   - Shows when session expires
   - Offers "Retry" and "Logout" buttons
   - Retry clears error and reloads, which re-checks authentication

4. **Forbidden.jsx** - 403 error component
   - Shows when user lacks permissions
   - Offers "Retry" and "Go Back" buttons

### Flow

1. User makes an API request via `useGetQuery` hook
2. If 401 error → calls `setUnauthorized()` (not redirect)
3. If 403 error → calls `setForbidden()` (not redirect)
4. Layout component checks `authError` and displays error component
5. User can:
   - **Retry**: Clears error and reloads page, re-checking token
   - **Logout** (401): Signs out and returns to login
   - **Go Back** (403): Returns to previous page

### Refresh Behavior

When user refreshes the page:
- Session is re-checked via NextAuth
- If token is still valid → page loads normally
- If token expired → API call fails with 401 → component shows again
- User can retry or logout

## Updated Files

- `src/context/AuthContext.jsx` - New
- `src/hooks/useAuthError.js` - New
- `src/components/auth/Unauthorized.jsx` - New
- `src/components/auth/Forbidden.jsx` - New
- `src/hooks/all/useGetQuery.js` - Modified to use AuthContext
- `src/components/layout/index.jsx` - Modified to display error components
- `src/pages/_app.js` - Wrapped with AuthProvider

## Usage

The system works automatically. When an API request returns 401 or 403, the error component will display instead of redirecting to a page. No additional setup needed for protected routes!

## Key Advantages

✅ Refresh doesn't get stuck on error page
✅ User can retry without losing context
✅ Component-based (easier to customize styling/layout)
✅ Works with existing authentication flow
✅ Auto re-checks token on refresh
