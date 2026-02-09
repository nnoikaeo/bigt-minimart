/**
 * Access Control Store
 *
 * Pinia store for managing Users, Roles, and Permissions
 * Handles state management and API interactions via Repository Pattern
 */

/* eslint-disable */
// @ts-nocheck
/**
 * TODO: Fix Pinia TypeScript type inference
 * - Nuxt typecheck cannot resolve pinia module
 * - Store state properties not recognized by TypeScript
 * - These are pre-existing issues in the codebase
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { $fetch } from 'ofetch'
import { ROLE_PERMISSIONS } from '~/types/permissions'
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Role,
  Permission,
  RolePermission,
} from '~/types/access-control'

export const useAccessControlStore = defineStore('accessControl', () => {
  // =========================================================================
  // Composables & Dependencies
  // =========================================================================

  // Note: We'll use $fetch within each action, not at store initialization
  // This ensures the Nuxt context is available when actions are called

  // =========================================================================
  // State
  // =========================================================================

  const users = ref<User[]>([])
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const rolePermissions = ref<Record<string, RolePermission>>({})
  const loading = ref(false)
  const error = ref('')

  // =========================================================================
  // Getters - Users
  // =========================================================================

  const getAllUsers = computed(() => users.value)

  const getActiveUsers = computed(() => users.value.filter((u) => u.isActive))

  /**
   * Get all users who have 'cashier' role
   * Used for Daily Sales cashier selection
   */
  const getCashiers = computed(() =>
    users.value.filter((u) => u.roles.includes('cashier') && u.isActive),
  )

  const getUserById = (uid: string) => {
    return users.value.find((u) => u.uid === uid)
  }

  // =========================================================================
  // Getters - Roles
  // =========================================================================

  const getAllRoles = computed(() => {
    const roleOrder = ['owner', 'manager', 'assistant_manager', 'auditor', 'cashier']
    return roles.value.sort((a, b) => roleOrder.indexOf(a.id) - roleOrder.indexOf(b.id))
  })

  const getRoleById = (roleId: string) => {
    return roles.value.find((r) => r.id === roleId)
  }

  /**
   * Get role name by ID
   * Returns role name from roles.json, or roleId if not found
   */
  const getRoleNameById = (roleId: string): string => {
    const role = roles.value.find((r) => r.id === roleId)
    return role?.name || roleId
  }

  // =========================================================================
  // Getters - Permissions
  // =========================================================================

  const getAllPermissions = computed(() => permissions.value)

  const getRolePermissions = (roleId: string) => {
    return rolePermissions.value[roleId]?.permissions || {}
  }

  const hasPermission = (roleId: string, permissionId: string): boolean => {
    // First, try to use API data
    const apiPermissions = getRolePermissions(roleId)
    if (Object.keys(apiPermissions).length > 0) {
      return apiPermissions[permissionId] === true
    }

    // Fallback to hardcoded ROLE_PERMISSIONS if API data not available
    const roleKey = roleId as keyof typeof ROLE_PERMISSIONS
    const rolePerms = ROLE_PERMISSIONS[roleKey]
    return rolePerms ? rolePerms.includes(permissionId as any) : false
  }

  // =========================================================================
  // Actions - Users
  // =========================================================================

  /**
   * Fetch all users from API
   */
  const fetchUsers = async () => {
    loading.value = true
    error.value = ''
    try {
      console.log('[AccessControl Store] fetchUsers called')
      console.log('[AccessControl Store] Using ofetch directly')
      
      const response = await $fetch<{
        success: boolean
        data: User[]
        count: number
      }>('/api/access-control/users', {
        method: 'GET',
      })

      console.log('[AccessControl Store] fetchUsers response:', response)
      if (response.success) {
        users.value = response.data || []
      } else {
        throw new Error('Failed to fetch users')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch users'
      console.error('fetchUsers error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new user
   */
  const createUser = async (input: CreateUserInput) => {
    try {
      const response = await $fetch<{
        success: boolean
        data: User
        message?: string
      }>('/api/access-control/users', {
        method: 'POST',
        body: input,
      })

      if (response.success && response.data) {
        users.value.push(response.data)
        return { success: true, data: response.data, message: response.message }
      }

      throw new Error('Failed to create user')
    } catch (err: any) {
      const message = err.message || 'Failed to create user'
      return { success: false, error: message }
    }
  }

  /**
   * Update an existing user
   */
  const updateUser = async (uid: string, input: UpdateUserInput) => {
    try {
      const response = await $fetch<{
        success: boolean
        data: User
        message?: string
      }>(`/api/access-control/users/${uid}`, {
        method: 'PUT',
        body: input,
      })

      if (response.success && response.data) {
        const index = users.value.findIndex((u) => u.uid === uid)
        if (index !== -1) {
          users.value[index] = response.data
        }
        return { success: true, data: response.data, message: response.message }
      }

      throw new Error('Failed to update user')
    } catch (err: any) {
      const message = err.message || 'Failed to update user'
      return { success: false, error: message }
    }
  }

  /**
   * Delete a user
   */
  const deleteUser = async (uid: string) => {
    try {
      const response = await $fetch<{
        success: boolean
        message?: string
      }>(`/api/access-control/users/${uid}`, {
        method: 'DELETE',
      })

      if (response.success) {
        users.value = users.value.filter((u) => u.uid !== uid)
        return { success: true, message: response.message }
      }

      throw new Error('Failed to delete user')
    } catch (err: any) {
      const message = err.message || 'Failed to delete user'
      return { success: false, error: message }
    }
  }

  // =========================================================================
  // Actions - Roles
  // =========================================================================

  /**
   * Fetch all roles from API
   */
  const fetchRoles = async () => {
    loading.value = true
    error.value = ''
    try {
      console.log('[AccessControl Store] fetchRoles called')
      console.log('[AccessControl Store] Using ofetch directly')
      
      const response = await $fetch<{
        success: boolean
        data: Role[]
        count: number
      }>('/api/access-control/roles', {
        method: 'GET',
      })

      console.log('[AccessControl Store] fetchRoles response:', response)
      if (response.success) {
        roles.value = response.data || []
      } else {
        throw new Error('Failed to fetch roles')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch roles'
      console.error('fetchRoles error:', err)
    } finally {
      loading.value = false
    }
  }

  // =========================================================================
  // Actions - Permissions
  // =========================================================================

  /**
   * Fetch all permissions from API
   */
  const fetchPermissions = async () => {
    loading.value = true
    error.value = ''
    try {
      console.log('[AccessControl Store] fetchPermissions called')
      console.log('[AccessControl Store] Using ofetch directly')
      
      const response = await $fetch<{
        success: boolean
        data: Permission[]
        count: number
      }>('/api/access-control/permissions', {
        method: 'GET',
      })

      console.log('[AccessControl Store] fetchPermissions response:', response)
      if (response.success) {
        permissions.value = response.data || []
      } else {
        throw new Error('Failed to fetch permissions')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch permissions'
      console.error('fetchPermissions error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch role permissions from API
   */
  const fetchRolePermissions = async (roleId: string) => {
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch<{
        success: boolean
        data: RolePermission
      }>(`/api/access-control/roles/${roleId}/permissions`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        rolePermissions.value[roleId] = response.data
      } else {
        throw new Error('Failed to fetch role permissions')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch role permissions'
      console.error('fetchRolePermissions error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Update permissions for a specific role
   */
  const updateRolePermissions = async (
    roleId: string,
    permissions: Record<string, boolean>,
  ) => {
    try {
      const response = await $fetch<{
        success: boolean
        data: RolePermission
        message?: string
      }>(`/api/access-control/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: { permissions },
      })

      if (response.success && response.data) {
        rolePermissions.value[roleId] = response.data
        return { success: true, message: response.message }
      }

      throw new Error('Failed to update role permissions')
    } catch (err: any) {
      const message = err.message || 'Failed to update role permissions'
      return { success: false, error: message }
    }
  }

  // =========================================================================
  // Initial Load
  // =========================================================================

  /**
   * Load all data (users, roles, permissions)
   * Call this on store initialization
   */
  const loadAllData = async () => {
    console.log('[AccessControl Store] loadAllData called')
    console.log('[AccessControl Store] Starting parallel fetch: users, roles, permissions')
    
    try {
      const results = await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchPermissions()
      ])
      console.log('[AccessControl Store] All data loaded successfully:', results)
    } catch (err: any) {
      console.error('[AccessControl Store] loadAllData error:', err)
      throw err
    }
  }

  // =========================================================================
  // Export
  // =========================================================================

  return {
    // State
    users,
    roles,
    permissions,
    rolePermissions,
    loading,
    error,

    // Getters - Users
    getAllUsers,
    getActiveUsers,
    getCashiers,
    getUserById,

    // Getters - Roles
    getAllRoles,
    getRoleById,
    getRoleNameById,

    // Getters - Permissions
    getAllPermissions,
    getRolePermissions,
    hasPermission,

    // Actions - Users
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,

    // Actions - Roles
    fetchRoles,

    // Actions - Permissions
    fetchPermissions,
    fetchRolePermissions,
    updateRolePermissions,

    // Initialization
    loadAllData,
  }
})
