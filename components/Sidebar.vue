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

        <!-- Settings Link -->
        <NuxtLink
          to="/admin/system-settings"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="isActive('/admin/system-settings') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
        >
          <span class="text-xl">⚙️</span>
          <span class="font-medium">ตั้งค่าระบบ</span>
        </NuxtLink>

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

        <!-- User Management (Owner/Manager only) -->
        <NuxtLink
          v-if="canAccessUsers"
          to="/admin/users"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="isActive('/admin/users') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
        >
          <span class="text-xl">👥</span>
          <span class="font-medium">จัดการผู้ใช้</span>
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

    <!-- Footer (optional) -->
    <div class="border-t border-slate-700 px-4 py-3 text-xs text-slate-400 text-center">
      <p>v1.2.0</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Computed properties
const user = computed(() => authStore.user)
const userRole = computed(() => user.value?.role || 'unknown')

// Role-based access control
const canAccessUsers = computed(() => {
  const role = userRole.value
  return role === 'owner' || role === 'manager'
})

const canAccessReports = computed(() => {
  const role = userRole.value
  return role === 'owner'
})

const canAccessAuditLogs = computed(() => {
  const role = userRole.value
  return role === 'auditor'
})

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
</style>
