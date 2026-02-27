/**
 * usePermissions Composable
 *
 * Provides permission checking utilities based on current user's role
 * Uses Pinia stores for centralized permission management
 *
 * @example
 * const { can, hasRole } = usePermissions()
 * const canEdit = can(PERMISSIONS.EDIT_SALES)
 * const isOwner = hasRole(ROLES.OWNER)
 */

import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAccessControlStore } from '~/stores/access-control'
import type { PermissionId, RoleId } from '~/types/permissions'

export function usePermissions() {
  const authStore = useAuthStore()
  const accessControlStore = useAccessControlStore()

  /**
   * Current user's primary role
   * Returns 'unknown' if user is not authenticated
   */
  const userRole = computed(() => authStore.user?.primaryRole ?? 'unknown')

  /**
   * Current user's all roles (primary + additional roles)
   * Returns empty array if user is not authenticated
   */
  const userRoles = computed(() => authStore.user?.roles ?? [])

  /**
   * Check if current user has a specific permission
   * @param permissionId - Permission ID to check (e.g., PERMISSIONS.EDIT_SALES)
   * @returns true if user has permission, false otherwise
   *
   * @example
   * if (can(PERMISSIONS.EDIT_SALES)) {
   *   showEditButton()
   * }
   */
  const can = (permissionId: PermissionId): boolean => {
    const role = userRole.value
    if (role === 'unknown') return false

    try {
      return accessControlStore.hasPermission(role as RoleId, permissionId)
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  /**
   * Check if current user has ANY of the provided permissions
   * @param permissionIds - Array of permission IDs
   * @returns true if user has at least one permission, false otherwise
   *
   * @example
   * if (canAny([PERMISSIONS.EDIT_SALES, PERMISSIONS.DELETE_SALES])) {
   *   showModifyButton()
   * }
   */
  const canAny = (permissionIds: PermissionId[]): boolean => {
    return permissionIds.some(permissionId => can(permissionId))
  }

  /**
   * Check if current user has ALL of the provided permissions
   * @param permissionIds - Array of permission IDs
   * @returns true if user has all permissions, false otherwise
   *
   * @example
   * if (canAll([PERMISSIONS.VIEW_SALES, PERMISSIONS.EDIT_SALES])) {
   *   showAdvancedEditor()
   * }
   */
  const canAll = (permissionIds: PermissionId[]): boolean => {
    return permissionIds.every(permissionId => can(permissionId))
  }

  /**
   * Check if current user has a specific role (primary role only)
   * @param roleId - Role ID to check (e.g., ROLES.OWNER)
   * @returns true if user's primary role matches, false otherwise
   *
   * @example
   * if (hasRole(ROLES.OWNER)) {
   *   showAdminPanel()
   * }
   */
  const hasRole = (roleId: RoleId): boolean => {
    return userRole.value === roleId
  }

  /**
   * Check if current user has ANY of the provided roles (checks primary role only)
   * @param roleIds - Array of role IDs
   * @returns true if user's primary role is one of the provided roles, false otherwise
   *
   * @example
   * if (hasAnyRole([ROLES.OWNER, ROLES.MANAGER])) {
   *   showManagementDashboard()
   * }
   */
  const hasAnyRole = (roleIds: RoleId[]): boolean => {
    return roleIds.includes(userRole.value as RoleId)
  }

  /**
   * Check if current user has a specific role (checks all assigned roles)
   * @param roleId - Role ID to check
   * @returns true if user has the role, false otherwise
   *
   * @example
   * if (isInRole(ROLES.MANAGER)) {
   *   showManagerFeatures()
   * }
   */
  const isInRole = (roleId: RoleId): boolean => {
    return userRoles.value.includes(roleId)
  }

  /**
   * Get current user's primary role
   * Useful for conditional rendering or logging
   */
  const getCurrentRole = (): RoleId | 'unknown' => {
    return userRole.value as RoleId | 'unknown'
  }

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => {
    return authStore.isAuthenticated && userRole.value !== 'unknown'
  })

  return {
    // State
    userRole,
    userRoles,
    isAuthenticated,

    // Permission checks
    can,
    canAny,
    canAll,

    // Role checks
    hasRole,
    hasAnyRole,
    isInRole,

    // Utilities
    getCurrentRole,
  }
}
