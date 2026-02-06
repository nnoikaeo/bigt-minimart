export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip on server-side rendering to avoid hydration mismatch
  if (process.server) {
    return
  }

  // Allow access to login, setup, and public pages without authentication
  const publicPages = ['/login', '/setup']
  if (publicPages.includes(to.path)) {
    return
  }

  // For all other routes, check authentication
  const authStore = useAuthStore()

  // Wait a moment for auth store to be ready
  try {
    // If user is already authenticated, allow access
    if (authStore.getIsAuthenticated && authStore.getCurrentUser) {
      // Load access control data based on user role
      await loadAccessControlDataIfNeeded()
      return
    }

    // Check if there's a session in localStorage (persistent login)
    const auth = useNuxtApp().$auth
    if (auth && typeof auth === 'object' && 'currentUser' in auth && auth.currentUser) {
      // Firebase says we're authenticated
      await loadAccessControlDataIfNeeded()
      return
    }

    // Not authenticated - redirect to login
    return navigateTo('/login')
  } catch (error) {
    // On any error, redirect to login for safety
    console.warn('[Auth] Middleware error, redirecting to login:', error)
    return navigateTo('/login')
  }
})

/**
 * Load access control data (users, roles, permissions) based on user role
 * Only load for roles that can access access control features
 *
 * Roles that need access control data:
 * - owner: Full system access, needs all data
 * - manager: Can manage daily sales and employee records
 * - auditor: Can view and audit daily sales
 *
 * Roles that don't need access control data:
 * - cashier: Only handles POS transactions
 * - assistant_manager: Limited access
 */
async function loadAccessControlDataIfNeeded() {
  const authStore = useAuthStore()
  const accessControlStore = useAccessControlStore()

  const currentUser = authStore.getCurrentUser
  if (!currentUser) {
    console.log('[Auth Middleware] No current user, skipping access control data load')
    return
  }

  // Roles that require access control data (can view daily sales, access users list, etc.)
  const rolesNeedingAccessControl = ['owner', 'manager', 'assistant_manager', 'auditor']
  const userRole = currentUser.primaryRole || 'unknown'

  if (rolesNeedingAccessControl.includes(userRole)) {
    // Only load if not already loaded (check if users array is empty)
    if (accessControlStore.getAllUsers.length === 0) {
      console.log(`[Auth Middleware] Loading access control data for role: ${userRole}`)
      try {
        await accessControlStore.loadAllData()
        console.log('[Auth Middleware] Access control data loaded successfully')
      } catch (error) {
        console.error('[Auth Middleware] Failed to load access control data:', error)
        // Don't block navigation if data load fails, user can still navigate
      }
    } else {
      console.log('[Auth Middleware] Access control data already loaded')
    }
  } else {
    console.log(`[Auth Middleware] Role "${userRole}" does not require access control data, skipping load`)
  }
}
