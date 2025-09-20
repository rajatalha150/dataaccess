import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    userName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
    userInitials: (state) => {
      if (!state.user) return ''
      return `${state.user.firstName.charAt(0)}${state.user.lastName.charAt(0)}`
    }
  },

  actions: {
    async login(credentials) {
      try {
        this.loading = true
        const { $api } = useNuxtApp()
        
        const response = await $api('/auth/login', {
          method: 'POST',
          body: credentials
        })

        this.token = response.token
        this.refreshToken = response.refreshToken
        this.user = response.user
        this.isAuthenticated = true

        // Store tokens in cookies for SSR
        const tokenCookie = useCookie('auth-token', {
          default: () => null,
          httpOnly: false,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        const refreshTokenCookie = useCookie('refresh-token', {
          default: () => null,
          httpOnly: false,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        tokenCookie.value = this.token
        refreshTokenCookie.value = this.refreshToken

        return response
      } catch (error) {
        this.clearAuth()
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        const { $api } = useNuxtApp()
        
        if (this.token) {
          await $api('/auth/logout', {
            method: 'POST'
          })
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
      }
    },

    async refreshTokens() {
      try {
        const { $api } = useNuxtApp()
        
        if (!this.refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await $api('/auth/refresh', {
          method: 'POST',
          body: { refreshToken: this.refreshToken }
        })

        this.token = response.token
        this.refreshToken = response.refreshToken
        this.user = response.user
        this.isAuthenticated = true

        // Update cookies
        const tokenCookie = useCookie('auth-token')
        const refreshTokenCookie = useCookie('refresh-token')
        
        tokenCookie.value = this.token
        refreshTokenCookie.value = this.refreshToken

        return response
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    async fetchUser() {
      try {
        const { $api } = useNuxtApp()
        
        if (!this.token) {
          throw new Error('No token available')
        }

        const response = await $api('/auth/profile')
        this.user = response.user
        this.isAuthenticated = true

        return response
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    async updateProfile(profileData) {
      try {
        this.loading = true
        const { $api } = useNuxtApp()
        
        const response = await $api('/auth/profile', {
          method: 'PUT',
          body: profileData
        })

        this.user = { ...this.user, ...response.user }
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async changePassword(passwordData) {
      try {
        this.loading = true
        const { $api } = useNuxtApp()
        
        const response = await $api('/auth/change-password', {
          method: 'POST',
          body: passwordData
        })

        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.isAuthenticated = false

      // Clear cookies
      const tokenCookie = useCookie('auth-token')
      const refreshTokenCookie = useCookie('refresh-token')
      
      tokenCookie.value = null
      refreshTokenCookie.value = null
    },

    initializeAuth() {
      // Initialize auth state from cookies on app start
      const tokenCookie = useCookie('auth-token')
      const refreshTokenCookie = useCookie('refresh-token')

      if (tokenCookie.value && refreshTokenCookie.value) {
        this.token = tokenCookie.value
        this.refreshToken = refreshTokenCookie.value
        this.isAuthenticated = true
        
        // Fetch user data
        this.fetchUser().catch(() => {
          // If fetching user fails, try to refresh tokens
          this.refreshTokens().catch(() => {
            this.clearAuth()
          })
        })
      }
    },

    // Check if token is expired (basic check)
    isTokenExpired() {
      if (!this.token) return true
      
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]))
        const currentTime = Date.now() / 1000
        return payload.exp < currentTime
      } catch (error) {
        return true
      }
    },

    // Auto-refresh token if needed
    async ensureValidToken() {
      if (!this.token || this.isTokenExpired()) {
        if (this.refreshToken) {
          await this.refreshTokens()
        } else {
          this.clearAuth()
          throw new Error('Authentication required')
        }
      }
    }
  }
})