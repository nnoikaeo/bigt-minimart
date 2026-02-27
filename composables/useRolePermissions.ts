/**
 * useRolePermissions Composable
 *
 * Manages role-permission assignments for the Roles tab in /admin/access-control
 * Handles dirty state tracking, selection, batch save, and collapse/expand of permission groups
 *
 * @example
 * const { dirtyRoles, togglePermissionForRole, saveBatchRoles, resetAllRoles } = useRolePermissions()
 */

import { ref, computed } from 'vue'
import { useAccessControlStore } from '~/stores/access-control'
import type { RolePermission } from '~/types/access-control'

export function useRolePermissions() {
  const store = useAccessControlStore()

  // =========================================================================
  // State
  // =========================================================================

  const originalRolePermissions = ref<Record<string, RolePermission>>({})
  const selectedRoles = ref<Set<string>>(new Set())
  const selectedPermissions = ref<Set<string>>(new Set())
  const isSavingRoles = ref(false)
  const expandedPermGroups = ref<Set<string>>(new Set())

  // =========================================================================
  // Computed
  // =========================================================================

  /**
   * Track dirty roles (มีการเปลี่ยนแปลง permissions)
   */
  const dirtyRoles = computed(() => {
    const dirty: string[] = []
    const current = store.rolePermissions
    const original = originalRolePermissions.value

    for (const roleId in current) {
      if (!original[roleId]) continue

      const currentPerms = current[roleId]?.permissions || {}
      const originalPerms = original[roleId]?.permissions || {}

      // เปรียบเทียบ permissions - deep equality
      const currentSorted = JSON.stringify(currentPerms)
      const originalSorted = JSON.stringify(originalPerms)
      const permsChanged = currentSorted !== originalSorted

      if (permsChanged) {
        dirty.push(roleId)
      }
    }

    return dirty
  })

  /**
   * Get selected roles that are dirty
   */
  const selectedDirtyRoles = computed(() => {
    return Array.from(selectedRoles.value).filter((roleId) => dirtyRoles.value.includes(roleId))
  })

  /**
   * Get set of dirty permission IDs (computed property for proper reactivity)
   * This ensures Vue tracks changes and properly re-renders checkboxes
   */
  const dirtyPermissions = computed(() => {
    const dirty = new Set<string>()

    // For each dirty role, find which permissions changed
    for (const roleId of dirtyRoles.value) {
      const currentPerms = store.rolePermissions[roleId]?.permissions || {}
      const originalPerms = originalRolePermissions.value[roleId]?.permissions || {}

      // Check each permission
      for (const permId in currentPerms) {
        if (currentPerms[permId] !== originalPerms[permId]) {
          dirty.add(permId)
        }
      }

      // Also check permissions that were in original but not in current
      for (const permId in originalPerms) {
        if (currentPerms[permId] !== originalPerms[permId]) {
          dirty.add(permId)
        }
      }
    }

    return dirty
  })

  /**
   * Group permissions by category for matrix view
   */
  const groupedPermissions = computed(() => {
    const perms = store.getAllPermissions || []
    const grouped: Record<string, any[]> = {
      dashboard: [],
      sales: [],
      finance: [],
      users: [],
    }

    for (const perm of perms) {
      const category = perm.category as string
      if (category && category in grouped) {
        grouped[category as keyof typeof grouped]!.push(perm)
      }
    }

    return grouped
  })

  // =========================================================================
  // Methods
  // =========================================================================

  /**
   * Initialize original role permissions snapshot for dirty tracking
   * ต้องเรียกหลังจาก store.rolePermissions โหลดครบแล้ว
   */
  const initializeOriginalPermissions = () => {
    originalRolePermissions.value = JSON.parse(JSON.stringify(store.rolePermissions))
  }

  /**
   * Check if a permission has any dirty assignments (any role has changed for this permission)
   */
  const isPermissionDirty = (permissionId: string): boolean => {
    return dirtyPermissions.value.has(permissionId)
  }

  /**
   * Check if a role has a specific permission
   */
  const isPermissionGranted = (roleId: string, permissionId: string): boolean => {
    const rolePerms = store.rolePermissions[roleId]
    if (!rolePerms) return false
    return rolePerms.permissions?.[permissionId] ?? false
  }

  /**
   * Toggle a permission for a role (inline in matrix view)
   */
  const togglePermissionForRole = (roleId: string, permissionId: string) => {
    const rolePerms = store.rolePermissions[roleId]
    if (!rolePerms) return

    // Create a copy to ensure reactivity
    const newPerms = { ...rolePerms.permissions }
    newPerms[permissionId] = !newPerms[permissionId]

    // Update the store
    const rolePermsRef = store.rolePermissions[roleId]
    if (rolePermsRef) {
      rolePermsRef.permissions = newPerms
    }

    // Mark role as selected for batch tracking
    if (!selectedRoles.value.has(roleId)) {
      selectedRoles.value.add(roleId)
    }
  }

  /**
   * Reset a role's permissions to original
   */
  const resetRolePermissions = (roleId: string) => {
    const original = originalRolePermissions.value[roleId]
    if (!original) return

    // Reset to original
    const rolePermsRef = store.rolePermissions[roleId]
    if (rolePermsRef) {
      rolePermsRef.permissions = JSON.parse(JSON.stringify(original.permissions))
    }

    // Remove from selected if now clean
    if (!dirtyRoles.value.includes(roleId)) {
      selectedRoles.value.delete(roleId)
    }
  }

  /**
   * Reset all dirty roles to original state (called from confirmReset)
   */
  const resetAllRoles = () => {
    for (const roleId of dirtyRoles.value) {
      resetRolePermissions(roleId)
    }
    selectedRoles.value.clear()
  }

  /**
   * Toggle permission group expansion (for Roles Tab matrix view)
   */
  const togglePermGroupExpanded = (categoryKey: string) => {
    if (expandedPermGroups.value.has(categoryKey)) {
      expandedPermGroups.value.delete(categoryKey)
    } else {
      expandedPermGroups.value.add(categoryKey)
    }
  }

  /**
   * Check if permission group is expanded
   */
  const isPermGroupExpanded = (categoryKey: string): boolean => {
    return expandedPermGroups.value.has(categoryKey)
  }

  /**
   * Get Thai label for permission category
   */
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      dashboard: '📊 แดชบอร์ด',
      sales: '👁️ ขาย',
      finance: '💰 การเงิน',
      users: '👥 ผู้ใช้ & บทบาท',
    }
    return labels[category] || category
  }

  /**
   * Save batch selected roles
   */
  const saveBatchRoles = async () => {
    if (selectedDirtyRoles.value.length === 0) {
      alert('❌ ไม่มี roles ที่มีการเปลี่ยนแปลง')
      return
    }

    isSavingRoles.value = true
    const rolesToSave = selectedDirtyRoles.value
    const successCount = { value: 0 }
    const failureCount = { value: 0 }

    try {
      // Save all selected roles concurrently
      const savePromises = rolesToSave.map(async (roleId) => {
        try {
          const rolePerms = store.rolePermissions[roleId]
          if (!rolePerms) return

          const result = await store.updateRolePermissions(roleId, rolePerms.permissions)

          if (result.success) {
            originalRolePermissions.value[roleId] = {
              roleId,
              permissions: JSON.parse(JSON.stringify(rolePerms.permissions)),
            }
            successCount.value++
          } else {
            failureCount.value++
            console.error(`Failed to save ${roleId}:`, result.error)
          }
        } catch (error: any) {
          failureCount.value++
          console.error(`Error saving ${roleId}:`, error.message)
        }
      })

      await Promise.all(savePromises)

      // Show result message
      let message = ''
      if (successCount.value > 0) {
        message += `✅ บันทึก ${successCount.value} roles สำเร็จ`
      }
      if (failureCount.value > 0) {
        message += `\n❌ ล้มเหลว ${failureCount.value} roles`
      }

      alert(message)

      // Clear selection after successful save
      if (failureCount.value === 0) {
        selectedRoles.value.clear()
      }
    } catch (error: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`)
    } finally {
      isSavingRoles.value = false
    }
  }

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // State
    originalRolePermissions,
    selectedRoles,
    selectedPermissions,
    isSavingRoles,
    expandedPermGroups,

    // Computed
    dirtyRoles,
    selectedDirtyRoles,
    dirtyPermissions,
    groupedPermissions,

    // Methods
    initializeOriginalPermissions,
    isPermissionDirty,
    isPermissionGranted,
    togglePermissionForRole,
    resetRolePermissions,
    resetAllRoles,
    togglePermGroupExpanded,
    isPermGroupExpanded,
    getCategoryLabel,
    saveBatchRoles,
  }
}
