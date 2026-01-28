<template>
  <!-- Desktop/Tablet: Fixed Sidebar -->
  <aside
    class="hidden md:flex md:fixed md:left-0 md:top-16 md:h-[calc(100vh-64px)] md:w-64 md:flex-col md:bg-white md:border-r md:border-gray-200 md:z-40"
  >
    <!-- Sidebar Content -->
    <nav class="flex-1 overflow-y-auto px-3 py-6 space-y-4">
      <!-- Loop through sidebar menu groups -->
      <template v-for="group in visibleMenu" :key="group.groupKey">
        <!-- Single Page (No Toggle) - If group has only 1 page -->
        <NuxtLink
          v-if="group.pages.length === 1 && group.pages[0]"
          :to="group.pages[0]!.route"
          @click="handleSelectPage(group.pages[0]!.pageKey, group.groupKey)"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150"
          :class="
            isPageActive(group.pages[0]?.pageKey)
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          "
        >
          <span class="text-lg">{{ group.icon }}</span>
          <span class="text-sm font-semibold">{{ group.groupName }}</span>
        </NuxtLink>

        <!-- Group with Accordion - If group has multiple pages -->
        <div v-else :key="group.groupKey">
          <!-- Group Header (Toggle) -->
          <button
            @click="handleToggleGroup(group.groupKey)"
            class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
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
            <div v-if="isGroupExpanded(group.groupKey)" class="space-y-1">
              <NuxtLink
                v-for="page in group.pages"
                :key="page.pageKey"
                :to="page.route"
                @click.prevent="handleSelectPage(page.pageKey, group.groupKey); $router.push(page.route)"
                class="block px-4 py-2 pl-12 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer"
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
      </template>
    </nav>
  </aside>

  <!-- Mobile/Tablet: Overlay + Sliding Sidebar -->
  <Transition name="sidebar-bg">
    <div v-if="isMobileSidebarOpen" class="md:hidden fixed inset-0 z-40">
      <!-- Overlay (Dark background) -->
      <div
        class="absolute inset-0 bg-black bg-opacity-50"
        @click="closeMobileSidebar"
      />

      <!-- Mobile Sidebar (slides in from left) -->
      <Transition name="sidebar-slide">
        <aside
          v-if="isMobileSidebarOpen"
          class="absolute left-0 top-0 h-screen w-64 bg-white shadow-lg overflow-y-auto z-50"
        >
          <nav class="px-3 py-6 space-y-4">
            <!-- Loop through sidebar menu groups -->
            <template v-for="group in visibleMenu" :key="group.groupKey">
              <!-- Single Page (No Toggle) - If group has only 1 page -->
              <NuxtLink
                v-if="group.pages.length === 1 && group.pages[0]"
                :to="group.pages[0]!.route"
                @click="handleSelectPage(group.pages[0]!.pageKey, group.groupKey)"
                class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150"
                :class="
                  isPageActive(group.pages[0]?.pageKey)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                "
              >
                <span class="text-lg">{{ group.icon }}</span>
                <span class="text-sm font-semibold">{{ group.groupName }}</span>
              </NuxtLink>

              <!-- Group with Accordion - If group has multiple pages -->
              <div v-else :key="group.groupKey">
                <!-- Group Header (Toggle) -->
                <button
                  @click="handleToggleGroup(group.groupKey)"
                  class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-lg">{{ group.icon }}</span>
                    <span class="text-sm font-semibold text-gray-800">{{ group.groupName }}</span>
                  </div>
                  <svg
                    class="w-4 h-4 text-gray-600 transition-transform duration-200"
                    :class="{ 'rotate-180': isGroupExpanded(group.groupKey) }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                <!-- Pages (Conditional Render) -->
                <Transition name="slide-fade">
                  <div v-if="isGroupExpanded(group.groupKey)" class="space-y-1">
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
            </template>
          </nav>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { sidebarMenu, filterMenuByRole, findPageByRoute } from '~/utils/sidebar-menu'

// Get stores and router
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// ============================================================
// COMPUTED PROPERTIES
// ============================================================

/**
 * Get current user
 */
const user = computed(() => authStore.user)

/**
 * Get user's role (fallback to 'unknown' if not authenticated)
 */
const userRole = computed(() => user.value?.role ?? 'unknown')

/**
 * Filter sidebar menu based on user role
 * Only shows groups and pages the user has access to
 */
const visibleMenu = computed(() => {
  return filterMenuByRole(sidebarMenu, userRole.value)
})

/**
 * Get mobile sidebar visibility state
 */
const isMobileSidebarOpen = computed(() => uiStore.isMobileSidebarOpen)

// ============================================================
// METHODS
// ============================================================

/**
 * Check if a sidebar group is expanded
 */
const isGroupExpanded = (groupKey: string): boolean => {
  return uiStore.expandedGroups[groupKey] ?? false
}

/**
 * Check if a sidebar page is active
 */
const isPageActive = (pageKey: string): boolean => {
  return uiStore.activePage === pageKey
}

/**
 * Handle group toggle (expand/collapse)
 */
const handleToggleGroup = (groupKey: string): void => {
  uiStore.toggleGroup(groupKey)
}

/**
 * Handle page selection
 * Updates active page/group and closes mobile sidebar
 */
const handleSelectPage = (pageKey: string, groupKey: string): void => {
  console.log(`[Sidebar] handleSelectPage called: pageKey=${pageKey}, groupKey=${groupKey}`)
  uiStore.selectPage(pageKey, groupKey)
  console.log(`[Sidebar] selectPage completed, activePage=${uiStore.activePage}`)
}

/**
 * Close mobile sidebar
 * Called when overlay is clicked or page is selected
 */
const closeMobileSidebar = (): void => {
  uiStore.closeMobileSidebar()
}

// ============================================================
// LIFECYCLE
// ============================================================

/**
 * Watch route changes to update active page
 * This ensures sidebar highlighting stays in sync with current route
 */
watch(
  () => route.path,
  (newPath) => {
    console.log('[Sidebar] Route changed to:', newPath)
    uiStore.updateActivePageFromRoute(newPath, sidebarMenu)
    console.log('[Sidebar] Active page now:', uiStore.activePage)
  },
  { immediate: true }
)

/**
 * Initialize active page on component mount
 */
onMounted(() => {
  uiStore.updateActivePageFromRoute(route.path, sidebarMenu)
})
</script>

<style scoped>
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
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-enter-from {
  transform: translateX(-100%);
}

.sidebar-slide-leave-to {
  transform: translateX(-100%);
}

/* Overlay fade animation */
.sidebar-bg-enter-active,
.sidebar-bg-leave-active {
  transition: opacity 250ms ease;
}

.sidebar-bg-enter-from,
.sidebar-bg-leave-to {
  opacity: 0;
}
</style>
