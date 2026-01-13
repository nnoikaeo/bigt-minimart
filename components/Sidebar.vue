<template>
  <aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-slate-900 text-white shadow-lg flex flex-col z-30">
    <!-- Navigation Links -->
    <nav class="flex-1 overflow-y-auto px-3 py-6">
      <div class="space-y-2">
        <!-- Dashboard Link -->
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="isActive('/') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
        >
          <span class="text-xl">📊</span>
          <span class="font-medium">แดชบอร์ด</span>
        </NuxtLink>

        <!-- Settings Accordion Menu (Owner only) -->
        <div v-if="canAccessSystemSettings || canAccessUsers" class="space-y-0">
          <!-- Settings Header (Toggle) -->
          <button
            @click="isSettingsOpen = !isSettingsOpen"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-300 hover:bg-slate-800"
          >
            <span class="text-xl">⚙️</span>
            <span class="font-medium flex-1 text-left">ตั้งค่า</span>
            <svg
              class="w-4 h-4 transition-transform duration-200"
              :class="{ 'rotate-180': isSettingsOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <!-- Settings Submenu Items -->
          <Transition name="slide-fade">
            <div
              v-if="isSettingsOpen"
              class="space-y-1 ml-3 mt-1 border-l-2 border-slate-700 pl-3"
            >
              <!-- System Settings (Owner only) -->
              <NuxtLink
                v-if="canAccessSystemSettings"
                to="/admin/system-settings"
                class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
                :class="isActive('/admin/system-settings') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
              >
                <span class="text-base">🔧</span>
                <span class="font-medium">ตั้งค่าระบบ</span>
              </NuxtLink>

              <!-- User Management (Owner/Manager only) -->
              <NuxtLink
                v-if="canAccessUsers"
                to="/admin/users"
                class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
                :class="isActive('/admin/users') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
              >
                <span class="text-base">👥</span>
                <span class="font-medium">จัดการผู้ใช้</span>
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- Reports (Owner only) -->
        <NuxtLink
          v-if="canAccessReports"
          to="/admin/reports"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="isActive('/admin/reports') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
        >
          <span class="text-xl">📋</span>
          <span class="font-medium">รายงาน</span>
        </NuxtLink>

        <!-- Audit Logs (Auditor only) -->
        <NuxtLink
          v-if="canAccessAuditLogs"
          to="/admin/audit-logs"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="isActive('/admin/audit-logs') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
        >
          <span class="text-xl">🔍</span>
          <span class="font-medium">บันทึกการตรวจสอบ</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Footer: Version only -->
    <div class="border-t border-slate-700 px-4 py-3 text-xs text-slate-400 text-center">
      <p>v1.2.0</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const isSettingsOpen = ref(false)

// Inject mobile menu state from Header
const isMobileMenuOpen = inject<any>('isMobileMenuOpen', ref(false))

// Computed properties
const user = computed(() => authStore.user)
const userRole = computed(() => user.value?.role || 'unknown')

// Role-based access control
// Owner: All features
// Manager: Dashboard only
// Auditor: Dashboard, Audit Logs only
// Cashier/Staff: Dashboard only

const canAccessUsers = computed(() => {
  const role = userRole.value
  return role === 'owner'
})

const canAccessReports = computed(() => {
  const role = userRole.value
  return role === 'owner'
})

const canAccessAuditLogs = computed(() => {
  const role = userRole.value
  return role === 'owner' || role === 'auditor'
})

const canAccessSystemSettings = computed(() => {
  const role = userRole.value
  return role === 'owner'
})

// Debugging: Log role and menu visibility
watch(
  () => userRole.value,
  (newRole) => {
    console.log('[Sidebar] Menu access for role:', newRole)
    console.log('  - canAccessUsers:', canAccessUsers.value)
    console.log('  - canAccessReports:', canAccessReports.value)
    console.log('  - canAccessAuditLogs:', canAccessAuditLogs.value)
    console.log('  - canAccessSystemSettings:', canAccessSystemSettings.value)
  },
  { immediate: true }
)

// Check if current route is active
const isActive = (path: string) => {
  return router.currentRoute.value.path === path
}
</script>

<style scoped>
/* Add smooth transitions */
aside {
  transition: all 0.3s ease;
}

/* Scrollbar styling for nav */
nav {
  scrollbar-width: thin;
  scrollbar-color: #475569 #1e293b;
}

nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: #1e293b;
}

nav::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Transition animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
