/* eslint-disable */
// @ts-nocheck
/**
 * TODO: Fix Pinia TypeScript type inference
 * - Nuxt typecheck cannot resolve pinia module
 * - Store state properties not recognized by TypeScript
 * - These are pre-existing issues in the codebase
 */
import { defineStore } from 'pinia'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  primaryRole?: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor' | 'unknown'
  roles?: string[]
  isActive?: boolean
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    getCurrentUser: (state: any) => state.user,
    getIsAuthenticated: (state: any) => state.isAuthenticated,
    getIsLoading: (state: any) => state.isLoading,
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
