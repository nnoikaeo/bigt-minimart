<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm h-16 flex items-center">
    <div class="px-4 sm:px-6 flex items-center justify-between w-full gap-2 sm:gap-4">
      <!-- Left: Hamburger Menu (Mobile only) + Logo -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Hamburger Menu Button (Mobile only) -->
        <button
          @click="toggleMobileSidebar"
          class="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
          title="เปิด/ปิด เมนู"
        >
          <svg
            class="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <!-- Logo & Title -->
        <div class="flex items-center gap-2 sm:gap-3">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white text-sm sm:text-lg flex-shrink-0"
          >
            B
          </div>
          <div class="hidden sm:block">
            <h1 class="text-base sm:text-lg font-bold text-gray-800">BigT Minimart</h1>
            <p class="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      <!-- Center: Spacer -->
      <div class="flex-1"></div>

      <!-- Right: User Dropdown -->
      <div class="relative flex-shrink-0">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <!-- Avatar -->
          <div
            class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm"
          >
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
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <Transition name="dropdown-fade">
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
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

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

// Map role to Thai display label
const roleLabel = computed(() => {
  const role = userRole.value
  const roleMap: Record<string, string> = {
    owner: 'เจ้าของร้าน',
    manager: 'ผู้จัดการ',
    assistant_manager: 'ผู้จัดการอ่วน',
    auditor: 'ผู้ตรวจสอบ',
    cashier: 'แคชเชียร์',
    staff: 'พนักงาน',
    unknown: 'ผู้ใช้',
  }
  return roleMap[role] || 'ผู้ใช้'
})

// Methods
const toggleMobileSidebar = (): void => {
  uiStore.toggleMobileSidebar()
}

const handleLogout = async (): Promise<void> => {
  try {
    await authStore.logout()
    isDropdownOpen.value = false
    router.push('/login')
  } catch (error) {
    console.error('[Header] Logout error:', error)
  }
}
</script>

<style scoped>
/* Dropdown fade transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 150ms ease;
}

.dropdown-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

