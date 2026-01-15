/**
 * Sidebar Menu Structure and Utilities
 * Defines the navigation menu, filters by role, and searches for pages
 */

import type { UserRole } from '~/types/user'

/**
 * Represents a single page/link in the sidebar
 */
export interface SidebarPage {
  /** Unique identifier for the page */
  pageKey: string
  /** Display name for the page (Thai) */
  pageName: string
  /** Route path (e.g., '/auditor/daily-sales') */
  route: string
  /** Required roles to access this page */
  requiredRoles?: UserRole[] | null
}

/**
 * Represents a group of pages in the sidebar (accordion section)
 */
export interface SidebarGroup {
  /** Unique identifier for the group */
  groupKey: string
  /** Display name for the group (Thai) */
  groupName: string
  /** Emoji icon for visual identification */
  icon: string
  /** Child pages in this group */
  pages: SidebarPage[]
}

/**
 * Complete sidebar menu structure
 * Organized by functional groups with role-based access control
 */
export const sidebarMenu: SidebarGroup[] = [
  {
    groupKey: 'dashboard',
    groupName: 'หน้าหลัก',
    icon: '📊',
    pages: [
      {
        pageKey: 'dashboard',
        pageName: 'หน้าหลัก',
        route: '/',
        requiredRoles: null, // All users can access
      },
    ],
  },
  {
    groupKey: 'sales',
    groupName: 'การขาย',
    icon: '💰',
    pages: [
      {
        pageKey: 'daily-sales',
        pageName: 'บันทึกยอดขาย',
        route: '/sales/daily-sales',
        requiredRoles: ['owner', 'manager', 'auditor'],
      },
      {
        pageKey: 'sales-report',
        pageName: 'รายงานการขาย',
        route: '/sales/sales-report',
        requiredRoles: ['manager', 'owner'],
      },
    ],
  },
  {
    groupKey: 'finance',
    groupName: 'บัญชีการเงิน',
    icon: '📈',
    pages: [
      {
        pageKey: 'daily-expenses',
        pageName: 'รายรับ-รายจ่าย',
        route: '/finance/daily-expenses',
        requiredRoles: ['manager', 'owner'],
      },
      {
        pageKey: 'cash-flow',
        pageName: 'กระแสเงินสด',
        route: '/finance/cash-flow',
        requiredRoles: ['owner'],
      },
      {
        pageKey: 'monthly-report',
        pageName: 'รายงานประจำเดือน',
        route: '/finance/monthly-report',
        requiredRoles: ['owner'],
      },
    ],
  },
  {
    groupKey: 'personnel',
    groupName: 'บุคคล',
    icon: '👥',
    pages: [
      {
        pageKey: 'attendance',
        pageName: 'เวลาเข้าออก',
        route: '/hr/attendance',
        requiredRoles: ['manager', 'owner'],
      },
      {
        pageKey: 'overtime',
        pageName: 'โอที',
        route: '/hr/overtime',
        requiredRoles: ['manager', 'owner'],
      },
    ],
  },
  {
    groupKey: 'settings',
    groupName: 'ตั้งค่า',
    icon: '⚙️',
    pages: [
      {
        pageKey: 'system-settings',
        pageName: 'ตั้งค่าระบบ',
        route: '/settings/system-settings',
        requiredRoles: ['owner'],
      },
      {
        pageKey: 'profile-settings',
        pageName: 'เพิ่มเติม',
        route: '/settings/others',
        requiredRoles: ['owner'],
      },
    ],
  },
  {
    groupKey: 'admin',
    groupName: 'ผู้ดูแลระบบ',
    icon: '🔐',
    pages: [
      {
        pageKey: 'user-management',
        pageName: 'จัดการผู้ใช้',
        route: '/admin/users',
        requiredRoles: ['owner'],
      },
      {
        pageKey: 'roles-management',
        pageName: 'บทบาทและสิทธิ์',
        route: '/admin/roles',
        requiredRoles: ['owner'],
      },
    ],
  },
]

/**
 * Find a page by its route path
 * Searches through all groups to locate the matching page
 *
 * @param routePath - The route path to search for (e.g., '/auditor/daily-sales')
 * @returns Object with pageKey and groupKey if found, null otherwise
 *
 * @example
 * const result = findPageByRoute('/auditor/daily-sales')
 * // Returns: { pageKey: 'daily-sales', groupKey: 'sales' }
 */
export function findPageByRoute(
  routePath: string
): { pageKey: string; groupKey: string } | null {
  for (const group of sidebarMenu) {
    const page = group.pages.find((p) => p.route === routePath)
    if (page) {
      return {
        pageKey: page.pageKey,
        groupKey: group.groupKey,
      }
    }
  }
  return null
}

/**
 * Filter sidebar menu by user role
 * Returns only groups and pages that the user has access to
 * Removes empty groups (groups with no accessible pages)
 *
 * @param menu - The complete sidebar menu array
 * @param userRole - The user's role (from auth store)
 * @returns Filtered menu containing only accessible items
 *
 * @example
 * const visibleMenu = filterMenuByRole(sidebarMenu, 'auditor')
 * // Returns: Groups with pages that auditor can access
 */
export function filterMenuByRole(menu: SidebarGroup[], userRole: string): SidebarGroup[] {
  return menu
    .map((group) => ({
      ...group,
      // Filter pages based on user role
      pages: group.pages.filter((page) => {
        // If no requiredRoles specified, show to all users
        if (!page.requiredRoles) return true
        // Check if user's role is in the required roles list
        return page.requiredRoles.includes(userRole as UserRole)
      }),
    }))
    .filter((group) => group.pages.length > 0) // Remove empty groups
}

/**
 * Get all accessible pages for a user
 * Flattens the menu structure into a single array of pages
 *
 * @param userRole - The user's role
 * @returns Array of all accessible pages
 */
export function getAllAccessiblePages(userRole: string): SidebarPage[] {
  const filteredMenu = filterMenuByRole(sidebarMenu, userRole)
  return filteredMenu.flatMap((group) => group.pages)
}

/**
 * Check if a user can access a specific page
 *
 * @param pageKey - The page key to check
 * @param userRole - The user's role
 * @returns true if user can access the page, false otherwise
 */
export function canUserAccessPage(pageKey: string, userRole: string): boolean {
  const accessiblePages = getAllAccessiblePages(userRole)
  return accessiblePages.some((page) => page.pageKey === pageKey)
}

/**
 * Get a page's information by its key
 *
 * @param pageKey - The page key to search for
 * @returns The page object if found, null otherwise
 */
export function getPageByKey(pageKey: string): SidebarPage | null {
  for (const group of sidebarMenu) {
    const page = group.pages.find((p) => p.pageKey === pageKey)
    if (page) return page
  }
  return null
}

/**
 * Get a group's information by its key
 *
 * @param groupKey - The group key to search for
 * @returns The group object if found, null otherwise
 */
export function getGroupByKey(groupKey: string): SidebarGroup | null {
  return sidebarMenu.find((g) => g.groupKey === groupKey) ?? null
}
