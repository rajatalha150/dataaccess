export default defineNuxtRouteMiddleware((to, from) => {
  const { $router } = useNuxtApp()
  const authStore = useAuthStore()

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Check if user has admin role
  if (!authStore.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access Denied - Admin privileges required'
    })
  }
})