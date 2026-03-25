# 📌 Sidebar Navigation Implementation Guide

**Last Updated**: Jan 15, 2026  
**Status**: Ready for Development  
**Estimated Effort**: 2-3 days

---

## 🏗️ Component Structure

### Main Components

**1. `components/Sidebar.vue`** (Main Sidebar Component)
- Renders all groups and pages
- Manages expand/collapse state via Pinia store
- Highlights active page based on route
- Filters groups by user role
- Implements mobile auto-close behavior
- Handles click events for group toggle and page selection

**2. `components/SidebarGroup.vue`** (Optional Sub-component)
- Renders individual group with icon, label, arrow
- Emits `toggle` event when clicked
- Receives `isExpanded` prop
- Renders child pages conditionally

**3. `components/SidebarPage.vue`** (Optional Sub-component)
- Renders individual page item
- Emits `select` event when clicked
- Receives `isActive` prop
- Shows active state styling

### State Management with Pinia

**File**: `stores/ui.ts` (Create or Update)

```typescript
import { defineStore } from 'pinia'

interface SidebarState {
  expandedGroups: {
    [groupKey: string]: boolean
  }
  activeGroup: string | null
  activePage: string | null
  isMobileSidebarOpen: boolean
}

export const useUIStore = defineStore('ui', {
  state: (): SidebarState => ({
    expandedGroups: {
      dashboard: true,
      sales: true,
      finance: true,
      inventory: false,
      personnel: true,
      settings: false,
    },
    activeGroup: 'sales',
    activePage: 'daily-sales',
    isMobileSidebarOpen: false,
  }),

  actions: {
    /**
     * Toggle group expand/collapse state
     */
    toggleGroup(groupKey: string): void {
      this.expandedGroups[groupKey] = !this.expandedGroups[groupKey]
    },

    /**
     * Select a page and update active group
     * Auto-closes sidebar on mobile
     */
    selectPage(pageKey: string, groupKey: string): void {
      this.activePage = pageKey
      this.activeGroup = groupKey

      // Auto-close sidebar on mobile (< 768px)
      if (window.innerWidth < 768) {
        this.isMobileSidebarOpen = false
      }
    },

    /**
     * Toggle mobile sidebar visibility
     */
    toggleMobileSidebar(): void {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen
    },

    /**
     * Close mobile sidebar (called after page selection)
     */
    closeMobileSidebar(): void {
      this.isMobileSidebarOpen = false
    },

    /**
     * Update active page based on current route
     * Called in watch(() => route.path)
     */
    updateActivePageFromRoute(route: string): void {
      // Find matching page from sidebar menu
      const page = findPageByRoute(route)
      if (page) {
        this.activePage = page.pageKey
        this.activeGroup = page.groupKey
        // Ensure parent group is expanded
        this.expandedGroups[page.groupKey] = true
      }
    },
  },

  persist: true, // Save state to localStorage for persistence
})
```

### Navigation Data Structure

**File**: `utils/sidebar-menu.ts` (Create)

```typescript
import type { UserRole } from '~/types/user'

export interface SidebarPage {
  pageKey: string
  pageName: string
  route: string
  requiredRoles?: UserRole[] // null = show all users
}

export interface SidebarGroup {
  groupKey: string
  groupName: string
  icon: string
  pages: SidebarPage[]
}

export const sidebarMenu: SidebarGroup[] = [
  {
    groupKey: 'dashboard',
    groupName: 'หน้าหลัก',
    icon: '📊',
    pages: [
      {
        pageKey: 'dashboard',
        pageName: 'หน้าหลัก',
        route: '/dashboard',
        requiredRoles: null, // All users
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
        pageName: 'Daily Sales',
        route: '/auditor/daily-sales',
        requiredRoles: ['auditor', 'owner'],
      },
      {
        pageKey: 'close-shift',
        pageName: 'Close Shift',
        route: '/cashier/close-shift',
        requiredRoles: ['cashier', 'manager', 'owner'],
      },
      {
        pageKey: 'sales-report',
        pageName: 'Sales Report',
        route: '/manager/sales-report',
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
        route: '/manager/daily-expenses',
        requiredRoles: ['manager', 'owner'],
      },
      {
        pageKey: 'cash-flow',
        pageName: 'Cash Flow',
        route: '/owner/cash-flow',
        requiredRoles: ['owner'],
      },
      {
        pageKey: 'monthly-report',
        pageName: 'Monthly Report',
        route: '/owner/monthly-report',
        requiredRoles: ['owner'],
      },
    ],
  },
  {
    groupKey: 'inventory',
    groupName: 'สต๊อกสินค้า',
    icon: '📦',
    pages: [
      {
        pageKey: 'inventory',
        pageName: 'สต๊อก',
        route: '/manager/inventory',
        requiredRoles: ['manager', 'owner'],
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
        route: '/manager/attendance',
        requiredRoles: ['manager', 'owner'],
      },
      {
        pageKey: 'overtime',
        pageName: 'โอที',
        route: '/manager/overtime',
        requiredRoles: ['manager', 'owner'],
      },
      {
        pageKey: 'user-management',
        pageName: 'จัดการผู้ใช้',
        route: '/owner/settings/users',
        requiredRoles: ['owner'],
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
        route: '/owner/settings/system',
        requiredRoles: ['owner'],
      },
    ],
  },
]

/**
 * Find page by route path
 * Used to update active page when route changes
 */
export function findPageByRoute(route: string): { pageKey: string; groupKey: string } | null {
  for (const group of sidebarMenu) {
    const page = group.pages.find(p => p.route === route)
    if (page) {
      return { pageKey: page.pageKey, groupKey: group.groupKey }
    }
  }
  return null
}

/**
 * Filter sidebar menu by user role
 * Returns only groups/pages accessible to the user
 */
export function filterMenuByRole(menu: SidebarGroup[], userRole: string): SidebarGroup[] {
  return menu
    .map(group => ({
      ...group,
      pages: group.pages.filter(
        page => !page.requiredRoles || page.requiredRoles.includes(userRole as any)
      ),
    }))
    .filter(group => group.pages.length > 0)
}
```

---

## 🎯 Sidebar.vue Component Implementation

### Template Structure

```vue
<template>
  <!-- Desktop/Tablet: Fixed Sidebar -->
  <aside
    class="hidden md:flex md:fixed md:left-0 md:top-16 md:h-[calc(100vh-64px)] md:w-64 md:flex-col md:bg-white md:border-r md:border-gray-200"
  >
    <!-- Sidebar Content -->
    <nav class="flex-1 overflow-y-auto px-3 py-6">
      <!-- Loop through sidebar menu groups -->
      <div v-for="group in visibleMenu" :key="group.groupKey" class="mb-4">
        <!-- Group Header (Toggle) -->
        <button
          @click="handleToggleGroup(group.groupKey)"
          class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-100"
        >
          <div class="flex items-center gap-3">
            <span class="text-lg">{{ group.icon }}</span>
            <span class="text-sm font-semibold text-gray-800">{{ group.groupName }}</span>
          </div>
          <!-- Arrow Indicator -->
          <svg
            class="w-4 h-4 text-gray-600 transition-transform duration-200"
            :class="{ 'rotate-180': isGroupExpanded(group.groupKey) }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <!-- Pages (Conditional Render) -->
        <Transition name="slide-fade">
          <div v-if="isGroupExpanded(group.groupKey)" class="mt-2 space-y-1">
            <NuxtLink
              v-for="page in group.pages"
              :key="page.pageKey"
              :to="page.route"
              @click="handleSelectPage(page.pageKey, group.groupKey)"
              class="block px-4 py-2 pl-12 rounded-lg text-sm font-medium transition-colors duration-150"
              :class="
                isPageActive(page.pageKey)
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-red-50'
              "
            >
              {{ page.pageName }}
            </NuxtLink>
          </div>
        </Transition>
      </div>
    </nav>
  </aside>

  <!-- Mobile: Overlay + Sidebar -->
  <div v-if="isMobileSidebarOpen" class="md:hidden fixed inset-0 z-40">
    <!-- Overlay (Dark background) -->
    <div
      class="absolute inset-0 bg-black bg-opacity-50"
      @click="closeMobileSidebar"
    ></div>

    <!-- Mobile Sidebar (slides in) -->
    <aside class="absolute left-0 top-0 h-screen w-64 bg-white shadow-lg overflow-y-auto z-50">
      <nav class="px-3 py-6">
        <!-- Same group/page structure as desktop -->
        <div v-for="group in visibleMenu" :key="group.groupKey" class="mb-4">
          <!-- Group Header -->
          <button
            @click="handleToggleGroup(group.groupKey)"
            class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ group.icon }}</span>
              <span class="text-sm font-semibold text-gray-800">{{ group.groupName }}</span>
            </div>
            <svg
              class="w-4 h-4 text-gray-600 transition-transform"
              :class="{ 'rotate-180': isGroupExpanded(group.groupKey) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <!-- Pages -->
          <Transition name="slide-fade">
            <div v-if="isGroupExpanded(group.groupKey)" class="mt-2 space-y-1">
              <NuxtLink
                v-for="page in group.pages"
                :key="page.pageKey"
                :to="page.route"
                @click="handleSelectPage(page.pageKey, group.groupKey)"
                class="block px-4 py-2 pl-12 rounded-lg text-sm font-medium"
                :class="
                  isPageActive(page.pageKey)
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:bg-red-50'
                "
              >
                {{ page.pageName }}
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </nav>
    </aside>
  </div>
</template>
```

### Script Setup

```typescript
<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { sidebarMenu, filterMenuByRole, findPageByRoute } from '~/utils/sidebar-menu'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Computed properties
const user = computed(() => authStore.user)
const userRole = computed(() => user.value?.role || 'unknown')

// Filter menu by user role
const visibleMenu = computed(() => {
  return filterMenuByRole(sidebarMenu, userRole.value)
})

const isMobileSidebarOpen = computed(
  () => uiStore.isMobileSidebarOpen
)

// Methods
const isGroupExpanded = (groupKey: string): boolean => {
  return uiStore.expandedGroups[groupKey] || false
}

const isPageActive = (pageKey: string): boolean => {
  return uiStore.activePage === pageKey
}

const handleToggleGroup = (groupKey: string): void => {
  uiStore.toggleGroup(groupKey)
}

const handleSelectPage = (pageKey: string, groupKey: string): void => {
  uiStore.selectPage(pageKey, groupKey)
  // Mobile sidebar auto-closes in selectPage action
}

const closeMobileSidebar = (): void => {
  uiStore.closeMobileSidebar()
}

// Watch route changes to update active page
watch(
  () => route.path,
  (newPath) => {
    uiStore.updateActivePageFromRoute(newPath)
  },
  { immediate: true }
)

// Initialize active page on mount
onMounted(() => {
  uiStore.updateActivePageFromRoute(route.path)
})
</script>
```

### Styling with Tailwind

```css
/* Transition animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 200ms ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Mobile sidebar slide-in animation */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 200ms ease-out;
}

.sidebar-enter-from {
  transform: translateX(-100%);
}

.sidebar-leave-to {
  transform: translateX(-100%);
}
```

---

## 🔄 Integration with Header

### Header Component Updates

The Header must include a hamburger menu (☰) for mobile:

```vue
<template>
  <header class="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
    <!-- Hamburger Menu (Mobile only) -->
    <button
      @click="toggleMobileSidebar"
      class="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100"
      aria-label="Toggle sidebar"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Logo/Title -->
    <div class="flex-1 text-center md:text-left">
      <h1 class="text-lg font-bold text-gray-800">BigT Minimart</h1>
    </div>

    <!-- User Profile (Right side) -->
    <div class="flex items-center gap-4">
      <!-- User Avatar, Dropdown, etc. -->
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()

const toggleMobileSidebar = () => {
  uiStore.toggleMobileSidebar()
}
</script>
```

---

## ✅ Implementation Checklist

**Core Implementation**:
- [ ] Create `stores/ui.ts` (Pinia store)
- [ ] Create `utils/sidebar-menu.ts` (Menu structure)
- [ ] Update `components/Sidebar.vue` (Template + Script)
- [ ] Update `components/Header.vue` (Hamburger menu)

**Styling**:
- [ ] Add Tailwind CSS classes
- [ ] Implement animations/transitions
- [ ] Test color scheme (#EF3340 active, #F5F5F5 groups)
- [ ] Verify responsive breakpoints

**Testing**:
- [ ] Desktop (1920px): Sidebar always visible
- [ ] Tablet (768px): Sidebar toggleable
- [ ] Mobile (375px): Sidebar auto-closes after select
- [ ] Group expand/collapse works
- [ ] Page highlighting works
- [ ] Role-based filtering works
- [ ] State persists after refresh (localStorage)

**Accessibility**:
- [ ] Keyboard navigation (Tab, Arrow keys, Enter)
- [ ] Focus states visible
- [ ] ARIA labels added
- [ ] Color contrast verified

---

## 🚀 Next Steps

1. **Create feature branch**: `feature/sidebar-navigation`
2. **Implement components** following this guide
3. **Test all responsive breakpoints**
4. **Create PR** for code review
5. **Merge** to develop branch
6. **Deploy** to staging

**Estimated Timeline**: 2-3 days for development  
**Priority**: High (Core navigation)  
**Dependencies**: Auth store complete ✅

---

**Updated By**: Design Team  
**Version**: 1.0  
**Status**: 🟡 Ready for Development
