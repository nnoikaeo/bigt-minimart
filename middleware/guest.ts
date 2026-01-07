export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Redirect authenticated users away from login page
  if (authStore.getIsAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
