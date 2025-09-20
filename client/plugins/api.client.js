export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const api = async (url, options = {}) => {
    const baseURL = config.public.apiBase || 'http://localhost:3001/api'
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Add auth token if available
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    // Prepare request options
    const requestOptions = {
      ...options,
      headers,
      baseURL
    }

    // Handle request body
    if (options.body && typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await $fetch(url, requestOptions)
      return response
    } catch (error) {
      // Handle 401 errors (token expired)
      if (error.status === 401 && authStore.refreshToken) {
        try {
          // Try to refresh token
          await authStore.refreshTokens()
          
          // Retry the original request with new token
          headers.Authorization = `Bearer ${authStore.token}`
          const retryResponse = await $fetch(url, {
            ...requestOptions,
            headers
          })
          return retryResponse
        } catch (refreshError) {
          // Refresh failed, redirect to login
          authStore.clearAuth()
          await navigateTo('/login')
          throw refreshError
        }
      }

      // Handle other errors
      console.error('API Error:', error)
      throw error
    }
  }

  return {
    provide: {
      api
    }
  }
})