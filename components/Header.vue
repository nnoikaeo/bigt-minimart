<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
    <div class="px-6 py-3 flex items-center justify-between">
      <!-- Left: Logo & Title -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white text-lg">
          B
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-800">BigT Minimart</h1>
          <p class="text-xs text-gray-500">Management System</p>
        </div>
      </div>

      <!-- Center: Spacer -->
      <div class="flex-1"></div>

      <!-- Right: User Dropdown -->
      <div class="relative">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <!-- Avatar -->
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm">
            {{ userInitial }}
          </div>
          <!-- User Info -->
          <div class="text-right">
            <p class="text-sm font-medium text-gray-800">{{ userName }}</p>
            <p class="text-xs text-gray-500 capitalize">{{ userRole }}</p>
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

        <!-- Dropdown Menu -->
        <div
          v-if="isDropdownOpen"
          @click.outside="isDropdownOpen = false"
          class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
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
            to="/user/settings"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const isDropdownOpen = ref(false)

// Computed properties
const user = computed(() => authStore.user)
const userName = computed(() => user.value?.displayName || 'User')
const userRole = computed(() => user.value?.role || 'unknown')
const userInitial = computed(() => {
  const name = userName.value || 'U'
  return name.charAt(0).toUpperCase()
})

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
