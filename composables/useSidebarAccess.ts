/**
 * useSidebarAccess Composable
 *
 * Manages sidebar menu access control for the Menu tab in /admin/access-control
 * Handles dirty state tracking, selection, batch save, and collapse/expand of menu groups
 *
 * @example
 * const { dirtyPages, togglePageRole, saveBatchPages, resetPages } = useSidebarAccess()
 */

import { ref, computed } from 'vue'
import { useAccessControlStore } from '~/stores/access-control'
import { useSidebarStore } from '~/stores/sidebar'
import type { UserRole } from '~/types/access-control'
import type { SidebarPage } from '~/utils/sidebar-menu'

export function useSidebarAccess() {
  const store = useAccessControlStore()
  const sidebarStore = useSidebarStore()

  // =========================================================================
  // State
  // =========================================================================

  const editingPages = ref<Record<string, SidebarPage>>({})
  const originalPages = ref<Record<string, SidebarPage>>({})
  const selectedPages = ref<Set<string>>(new Set())
  const isSavingBatch = ref(false)
  const expandedGroups = ref<Set<string>>(new Set())

  // =========================================================================
  // Computed
  // =========================================================================

  /**
   * Track dirty pages (มีการเปลี่ยนแปลง)
   */
  const dirtyPages = computed(() => {
    const dirty: string[] = []
    for (const [pageKey, editedPage] of Object.entries(editingPages.value)) {
      const original = originalPages.value[pageKey]
      if (!original) continue

      const editedRoles = editedPage.requiredRoles
      const originalRoles = original.requiredRoles

      // เปรียบเทียบ roles - สำหรับ deep equality
      const editedSorted = JSON.stringify(editedRoles?.sort() || [])
      const originalSorted = JSON.stringify(originalRoles?.sort() || [])
      const rolesChanged = editedSorted !== originalSorted

      if (rolesChanged) {
        dirty.push(pageKey)
      }
    }
    return dirty
  })

  /**
   * Get selected pages that are dirty
   */
  const selectedDirtyPages = computed(() => {
    return Array.from(selectedPages.value).filter((pageKey) => dirtyPages.value.includes(pageKey))
  })

  // =========================================================================
  // Methods
  // =========================================================================

  /**
   * Initialize editing pages from sidebar menu on mount
   */
  const initializeEditingPages = async () => {
    if (sidebarStore.sidebarMenu.length === 0) {
      await sidebarStore.loadSidebarMenu()
    }
    // Copy menu data to editing state
    for (const group of sidebarStore.sidebarMenu) {
      for (const page of group.pages) {
        editingPages.value[page.pageKey] = JSON.parse(JSON.stringify(page))
        originalPages.value[page.pageKey] = JSON.parse(JSON.stringify(page))
      }
    }
  }

  /**
   * Toggle a specific role for a page
   */
  const togglePageRole = (page: SidebarPage, roleId: string, isChecked: boolean) => {
    const pageKey = page.pageKey
    const current = editingPages.value[pageKey]

    if (!current) return

    // Ensure requiredRoles is an array
    if (!current.requiredRoles || current.requiredRoles === null) {
      // All roles selected, start fresh with deselected roles
      const allRoles = store.getAllRoles.map((r) => r.id) as any
      current.requiredRoles = allRoles.filter((r: string) => r !== roleId)
    } else {
      // Toggle the role
      if (isChecked) {
        if (!(current.requiredRoles as any).includes(roleId)) {
          (current.requiredRoles as any).push(roleId)
        }
      } else {
        current.requiredRoles = (current.requiredRoles as any).filter((r: string) => r !== roleId)
      }
    }

    // Auto-select the page when its roles are modified
    if (!selectedPages.value.has(pageKey)) {
      selectedPages.value.add(pageKey)
    }
  }

  /**
   * Check if a role is included for a page
   */
  const isRoleIncluded = (pageKey: string, roleId: UserRole): boolean => {
    const page = editingPages.value[pageKey]
    if (!page) return false
    return !page.requiredRoles || page.requiredRoles.includes(roleId)
  }

  /**
   * Toggle group expansion
   */
  const toggleGroupExpanded = (groupKey: string) => {
    if (expandedGroups.value.has(groupKey)) {
      expandedGroups.value.delete(groupKey)
    } else {
      expandedGroups.value.add(groupKey)
    }
  }

  /**
   * Check if group is expanded
   */
  const isGroupExpanded = (groupKey: string): boolean => {
    return expandedGroups.value.has(groupKey)
  }

  /**
   * Reset all pages to original state (called from confirmReset)
   */
  const resetPages = () => {
    for (const [pageKey, originalPage] of Object.entries(originalPages.value)) {
      editingPages.value[pageKey] = JSON.parse(JSON.stringify(originalPage))
    }
    selectedPages.value.clear()
  }

  /**
   * Save batch selected pages
   */
  const saveBatchPages = async () => {
    if (selectedDirtyPages.value.length === 0) {
      alert('❌ ไม่มี pages ที่มีการเปลี่ยนแปลง')
      return
    }

    isSavingBatch.value = true
    const pagesToSave = selectedDirtyPages.value
    const successCount = { value: 0 }
    const failureCount = { value: 0 }

    try {
      // Save all selected pages concurrently
      const savePromises = pagesToSave.map(async (pageKey) => {
        try {
          const editedPage = editingPages.value[pageKey]
          if (!editedPage) return

          const result = await sidebarStore.updatePageAccess(pageKey, editedPage.requiredRoles ?? null)

          if (result.success) {
            originalPages.value[pageKey] = JSON.parse(JSON.stringify(editedPage))
            successCount.value++
          } else {
            failureCount.value++
            console.error(`Failed to save ${pageKey}:`, result.error)
          }
        } catch (error: any) {
          failureCount.value++
          console.error(`Error saving ${pageKey}:`, error.message)
        }
      })

      await Promise.all(savePromises)

      // Show result message
      let message = ''
      if (successCount.value > 0) {
        message += `✅ บันทึก ${successCount.value} pages สำเร็จ`
      }
      if (failureCount.value > 0) {
        message += `\n❌ ล้มเหลว ${failureCount.value} pages`
      }

      alert(message)

      // Clear selection after successful save
      if (failureCount.value === 0) {
        selectedPages.value.clear()
      }
    } catch (error: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`)
    } finally {
      isSavingBatch.value = false
    }
  }

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // State
    editingPages,
    originalPages,
    selectedPages,
    isSavingBatch,
    expandedGroups,

    // Computed
    dirtyPages,
    selectedDirtyPages,

    // Methods
    initializeEditingPages,
    togglePageRole,
    isRoleIncluded,
    toggleGroupExpanded,
    isGroupExpanded,
    resetPages,
    saveBatchPages,
  }
}
