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
      return
    }

    // Check if there's a session in localStorage (persistent login)
    const auth = useNuxtApp().$auth
    if (auth && typeof auth === 'object' && 'currentUser' in auth && auth.currentUser) {
      // Firebase says we're authenticated
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
