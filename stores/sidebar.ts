/**
 * Sidebar Store
 * Manages sidebar menu configuration and role-based access control
 * Uses Hybrid approach: Pinia cache + API sync
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { filterMenuByRole } from '~/utils/sidebar-menu'
import type { SidebarGroup } from '~/utils/sidebar-menu'

export const useSidebarStore = defineStore('sidebar', () => {
  // =========================================================================
  // State
  // =========================================================================

  const sidebarMenu = ref<SidebarGroup[]>([])
  const loading = ref(false)
  const error = ref('')
  const lastUpdated = ref<Date | null>(null)

  // =========================================================================
  // Computed
  // =========================================================================

  /**
   * Get visible menu filtered by user role
   * @param userRole - User's primary role
   * @returns Filtered menu containing only accessible items
   */
  const getVisibleMenu = (userRole: string) => {
    if (!sidebarMenu.value.length) return []
    return filterMenuByRole(sidebarMenu.value, userRole)
  }

  // =========================================================================
  // Actions - Load Menu
  // =========================================================================

  /**
   * Load sidebar menu from API
   * Caches in Pinia state for performance
   */
  const loadSidebarMenu = async () => {
    loading.value = true
    error.value = ''

    try {
      console.log('[Sidebar Store] Loading sidebar menu from API...')

      const response = await $fetch<{
        success: boolean
        data: SidebarGroup[]
        message?: string
      }>('/api/sidebar/menu')

      if (response.success && response.data) {
        sidebarMenu.value = response.data
        lastUpdated.value = new Date()
        console.log('[Sidebar Store] Menu loaded successfully:', response.data.length, 'groups')
      } else {
        throw new Error(response.message || 'Failed to fetch sidebar menu')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load sidebar menu'
      console.error('[Sidebar Store] loadSidebarMenu error:', err)
    } finally {
      loading.value = false
    }
  }

  // =========================================================================
  // Actions - Update Page Access
  // =========================================================================

  /**
   * Update required roles for a specific page
   * Only accessible to Owner role
   * @param pageKey - The page key to update
   * @param requiredRoles - Array of role IDs that can access this page (or null for all)
   */
  const updatePageAccess = async (
    pageKey: string,
    requiredRoles: string[] | null,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`[Sidebar Store] Updating page ${pageKey} access...`)

      const response = await $fetch<{
        success: boolean
        message?: string
        error?: string
      }>(`/api/sidebar/pages/${pageKey}`, {
        method: 'PUT',
        body: { requiredRoles },
      })

      if (response.success) {
        console.log(`[Sidebar Store] Page ${pageKey} updated successfully`)

        // Reload menu to sync with backend
        await loadSidebarMenu()

        return { success: true }
      } else {
        throw new Error(response.error || 'Failed to update page access')
      }
    } catch (err: any) {
      const errorMsg = err.data?.error || err.message || 'Failed to update page access'
      error.value = errorMsg
      console.error(`[Sidebar Store] updatePageAccess error:`, err)
      return { success: false, error: errorMsg }
    }
  }

  // =========================================================================
  // Actions - Refresh Menu
  // =========================================================================

  /**
   * Force refresh sidebar menu from API
   * Useful when user permissions change
   */
  const refreshMenu = async () => {
    await loadSidebarMenu()
  }

  /**
   * Get cache age in seconds
   */
  const getCacheAge = (): number | null => {
    if (!lastUpdated.value) return null
    return Math.floor((Date.now() - lastUpdated.value.getTime()) / 1000)
  }

  /**
   * Check if cache needs refresh (older than 5 minutes)
   */
  const isCacheStale = (): boolean => {
    const age = getCacheAge()
    return age === null || age > 300 // 5 minutes
  }

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // State
    sidebarMenu,
    loading,
    error,
    lastUpdated,

    // Computed
    getVisibleMenu,

    // Actions
    loadSidebarMenu,
    updatePageAccess,
    refreshMenu,
    getCacheAge,
    isCacheStale,
  }
})
