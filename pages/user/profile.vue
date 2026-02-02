<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">โปรไฟล์</h1>
    
    <!-- Placeholder Message -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-blue-900 mb-2">👤 ฟีเจอร์กำลังพัฒนา</h2>
      <p class="text-blue-700">
        หน้าโปรไฟล์จะเพิ่มเข้ามาในเฟส Phase 3
      </p>
      <p class="text-sm text-blue-600 mt-2">
        ตอนนี้คุณสามารถกลับไปยัง
        <NuxtLink to="/" class="underline font-semibold hover:text-blue-900">
          แดชบอร์ด
        </NuxtLink>
      </p>
    </div>

    <!-- Profile Info (Placeholder) -->
    <div class="mt-8 space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">ข้อมูลส่วนตัว</h3>
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-2xl">
            {{ userInitial }}
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-800">{{ currentUser?.displayName }}</p>
            <p class="text-sm text-gray-600">{{ currentUser?.email }}</p>
            <p class="text-sm text-gray-500 capitalize">{{ currentUser?.primaryRole }}</p>
          </div>
        </div>

        <!-- Profile Form (Disabled) -->
        <div class="space-y-4 opacity-50 pointer-events-none">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
            <input type="text" :value="currentUser?.displayName" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
            <input type="email" :value="currentUser?.email" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">สิทธิ์และบทบาท</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span class="text-xl">👤</span>
            <div>
              <p class="font-semibold text-gray-800 capitalize">{{ currentUser?.primaryRole }}</p>
              <p class="text-xs text-gray-600">บทบาทในระบบ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

// User Profile page
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()

// Computed
const currentUser = computed(() => authStore.getCurrentUser)
const userInitial = computed(() => {
  const name = currentUser.value?.displayName || 'U'
  return name.charAt(0).toUpperCase()
})
</script>
