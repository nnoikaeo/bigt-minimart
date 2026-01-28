import { defineStore } from 'pinia'

/**
 * UI Store - Manages global UI state
 * Including: Sidebar expanded groups, active page, mobile sidebar visibility
 */
export const useUIStore = defineStore('ui', {
  state: () => ({
    /**
     * Track which sidebar groups are expanded
     * Key: groupKey (e.g., 'dashboard', 'sales', 'finance')
     * Value: boolean (true = expanded, false = collapsed)
     */
    expandedGroups: {
      dashboard: true,
      sales: true,
      finance: true,
      inventory: false,
      personnel: true,
      settings: true,
      admin: true,
    } as Record<string, boolean>,

    /**
     * Currently active group
     * Used for visual indication of which section user is in
     */
    activeGroup: 'sales' as string | null,

    /**
     * Currently active page
     * Used to highlight the selected page in sidebar
     */
    activePage: 'daily-sales' as string | null,

    /**
     * Mobile sidebar visibility
     * true = sidebar open, false = sidebar hidden
     * Only relevant on mobile/tablet screens
     */
    isMobileSidebarOpen: false as boolean,
  }),

  getters: {
    /**
     * Get expanded groups for display purposes
     */
    getExpandedGroups: (state) => state.expandedGroups,

    /**
     * Check if specific group is expanded
     */
    isGroupExpanded: (state) => (groupKey: string) => {
      return state.expandedGroups[groupKey] ?? false
    },

    /**
     * Check if specific page is active
     */
    isPageActive: (state) => (pageKey: string) => {
      return state.activePage === pageKey
    },
  },

  actions: {
    /**
     * Toggle group expand/collapse state
     * @param groupKey - The group key to toggle (e.g., 'sales')
     */
    toggleGroup(groupKey: string): void {
      if (groupKey in this.expandedGroups) {
        this.expandedGroups[groupKey] = !this.expandedGroups[groupKey]
      }
    },

    /**
     * Expand a specific group
     * @param groupKey - The group key to expand
     */
    expandGroup(groupKey: string): void {
      if (groupKey in this.expandedGroups) {
        this.expandedGroups[groupKey] = true
      }
    },

    /**
     * Collapse a specific group
     * @param groupKey - The group key to collapse
     */
    collapseGroup(groupKey: string): void {
      if (groupKey in this.expandedGroups) {
        this.expandedGroups[groupKey] = false
      }
    },

    /**
     * Select a page and update active group
     * Automatically closes sidebar on mobile screens
     * @param pageKey - The page key to select
     * @param groupKey - The parent group key
     */
    selectPage(pageKey: string, groupKey: string): void {
      console.log(`[UI Store] selectPage: pageKey=${pageKey}, groupKey=${groupKey}`)
      this.activePage = pageKey
      this.activeGroup = groupKey
      console.log(`[UI Store] activePage set to: ${this.activePage}, activeGroup: ${this.activeGroup}`)

      // Ensure parent group is expanded
      this.expandGroup(groupKey)

      // Auto-close sidebar on mobile (< 768px)
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        console.log('[UI Store] Mobile detected, closing sidebar')
        this.isMobileSidebarOpen = false
      }
    },

    /**
     * Toggle mobile sidebar visibility
     * Used by hamburger menu in Header
     */
    toggleMobileSidebar(): void {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen
    },

    /**
     * Open mobile sidebar
     */
    openMobileSidebar(): void {
      this.isMobileSidebarOpen = true
    },

    /**
     * Close mobile sidebar
     * Called after page selection or overlay click
     */
    closeMobileSidebar(): void {
      this.isMobileSidebarOpen = false
    },

    /**
     * Update active page and group based on route path
     * Called in useRouter watch hook to sync sidebar with current route
     * @param routePath - The current route path
     * @param menuData - The sidebar menu data to search against
     */
    updateActivePageFromRoute(
      routePath: string,
      menuData: Array<{ groupKey: string; pages: Array<{ pageKey: string; route: string }> }>
    ): void {
      // Normalize path (remove trailing slash)
      const normalizedPath = routePath.endsWith('/') && routePath !== '/' 
        ? routePath.slice(0, -1) 
        : routePath

      console.log('[UI Store] Searching for route:', normalizedPath)

      for (const group of menuData) {
        const page = group.pages.find((p) => {
          const normalizedPageRoute = p.route.endsWith('/') && p.route !== '/' 
            ? p.route.slice(0, -1) 
            : p.route
          console.log(`[UI Store] Comparing: "${normalizedPath}" vs "${normalizedPageRoute}"`)
          return normalizedPageRoute === normalizedPath
        })
        if (page) {
          console.log(`[UI Store] Found page: ${page.pageKey} in group: ${group.groupKey}`)
          this.activePage = page.pageKey
          this.activeGroup = group.groupKey
          // Ensure parent group is expanded
          this.expandGroup(group.groupKey)
          return
        }
      }
      
      console.log('[UI Store] No matching page found for route:', normalizedPath)
    },
  },
})
