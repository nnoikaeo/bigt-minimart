<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
    <div class="px-4 py-3 sm:px-6 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
      <!-- Left: Logo & Title (responsive) -->
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white text-sm sm:text-lg flex-shrink-0">
          B
        </div>
        <div class="hidden sm:block">
          <h1 class="text-base sm:text-lg font-bold text-gray-800">BigT Minimart</h1>
          <p class="text-xs text-gray-500">Management System</p>
        </div>
      </div>

      <!-- Center: Spacer -->
      <div class="flex-1"></div>

      <!-- Right: User Dropdown (responsive) -->
      <div class="relative">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <!-- Avatar -->
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm">
            {{ userInitial }}
          </div>
          <!-- User Info (hidden on mobile) -->
          <div class="hidden sm:block text-right">
            <p class="text-sm font-medium text-gray-800">{{ userName }}</p>
            <p class="text-xs text-gray-500">{{ roleLabel }}</p>
          </div>
          <!-- Dropdown Arrow -->
          <svg
            class="w-4 h-4 text-gray-500 transition-transform"
            :class="{ 'rotate-180': isDropdownOpen }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <!-- Dropdown Menu (responsive width) -->
        <div
          v-if="isDropdownOpen"
          @click.outside="isDropdownOpen = false"
          class="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
        >
          <!-- Profile Option -->
          <NuxtLink
            to="/user/profile"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            @click="isDropdownOpen = false"
          >
            <span>👤</span>
            <span>โปรไฟล์</span>
          </NuxtLink>

          <!-- Settings Option -->
          <NuxtLink
            to="/user/account-settings"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            @click="isDropdownOpen = false"
          >
            <span>⚙️</span>
            <span>ตั้งค่า</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="h-px bg-gray-200"></div>

          <!-- Logout Option -->
          <button
            @click="handleLogout"
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
          >
            <span>🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)

// Computed properties
const user = computed(() => authStore.user)
const userName = computed(() => user.value?.displayName || 'User')
const userRole = computed(() => user.value?.role || 'unknown')
const userInitial = computed(() => {
  const name = userName.value || 'U'
  return name.charAt(0).toUpperCase()
})

// Map role to Thai display label
const roleLabel = computed(() => {
  const role = userRole.value
  const roleMap: Record<string, string> = {
    owner: 'เจ้าของร้าน',
    manager: 'ผู้จัดการ',
    assistant_manager: 'ผู้จัดการช่วย',
    cashier: 'พนักงานคิดเงิน',
    auditor: 'ออดิท',
    unknown: 'ไม่ทราบ',
  }
  return roleMap[role] || role
})

// Watch for role changes and log
watch(
  () => user.value?.role,
  (newRole) => {
    console.log('[Header] User role:', newRole, '| Display name:', user.value?.displayName)
  },
  { immediate: true }
)

// Provide mobile menu state to child components
provide('isMobileMenuOpen', isMobileMenuOpen)

// Handle logout
const handleLogout = async () => {
  isDropdownOpen.value = false
  authStore.clearUser()
  await router.push('/login')
}
</script>

<style scoped>
/* Smooth transitions */
button {
  transition: all 0.2s ease;
}
</style>
