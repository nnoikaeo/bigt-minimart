import { defineStore } from 'pinia'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  role?: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    getCurrentUser: (state) => state.user,
    getIsAuthenticated: (state) => state.isAuthenticated,
    getIsLoading: (state) => state.isLoading,
  },

  actions: {
    setUser(user: AuthUser) {
      this.user = user
      this.isAuthenticated = true
    },

    clearUser() {
      this.user = null
      this.isAuthenticated = false
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    logout() {
      this.clearUser()
      this.isLoading = false
    },
  },
})
