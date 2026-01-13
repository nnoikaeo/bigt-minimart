<script setup lang="ts">
// Require authentication to access this page
definePageMeta({
  middleware: 'auth'
})

import { ref, computed } from 'vue'

// Setup
const authStore = useAuthStore()

// Computed
const currentUser = computed(() => authStore.getCurrentUser)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Dashboard</h1>
      <p class="text-gray-600 mt-1">
        ยินดีต้อนรับ, {{ currentUser?.email }}
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          รายรับวันนี้
        </h3>
        <p class="text-3xl font-bold text-primary">
          ฿0.00
        </p>
        <p class="text-sm text-gray-500 mt-2">
          (จะเพิ่มใน Phase 2)
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          รายจ่ายวันนี้
        </h3>
        <p class="text-3xl font-bold text-orange-500">
          ฿0.00
        </p>
        <p class="text-sm text-gray-500 mt-2">
          (จะเพิ่มใน Phase 2)
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          คงเหลือ
        </h3>
        <p class="text-3xl font-bold text-green-500">
          ฿0.00
        </p>
        <p class="text-sm text-gray-500 mt-2">
          (จะเพิ่มใน Phase 2)
        </p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">
        การดำเนินการด่วน
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NuxtLink
          to="/admin/users"
          class="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary hover:bg-opacity-5 transition text-center"
        >
          <p class="text-2xl mb-2">👥</p>
          <p class="text-sm font-medium text-gray-700">จัดการผู้ใช้</p>
        </NuxtLink>

        <NuxtLink
          to="/"
          class="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary hover:bg-opacity-5 transition text-center"
        >
          <p class="text-2xl mb-2">📊</p>
          <p class="text-sm font-medium text-gray-700">รายงาน</p>
        </NuxtLink>
        
        <NuxtLink
          to="/"
          class="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary hover:bg-opacity-5 transition text-center"
        >
          <p class="text-2xl mb-2">💰</p>
          <p class="text-sm font-medium text-gray-700">รายรับ</p>
        </NuxtLink>

        <NuxtLink
          to="/"
          class="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary hover:bg-opacity-5 transition text-center"
        >
          <p class="text-2xl mb-2">💸</p>
          <p class="text-sm font-medium text-gray-700">รายจ่าย</p>
        </NuxtLink>

        <NuxtLink
          to="/"
          class="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary hover:bg-opacity-5 transition text-center"
        >
          <p class="text-2xl mb-2">✓</p>
          <p class="text-sm font-medium text-gray-700">ตรวจสอบ</p>
        </NuxtLink>
      </div>
    </div>

    <!-- Info Section -->
    <div class="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
      <h3 class="text-lg font-semibold text-blue-900 mb-2">
        ℹ️ สถานะ: Week 1 Complete - Ready for Week 2
      </h3>
      <ul class="text-blue-800 text-sm space-y-1">
        <li>✅ Task 1.1: Project Initialization สมบูรณ์</li>
        <li>✅ Task 1.2: Firebase Integration สมบูรณ์</li>
        <li>✅ Task 1.3: Authentication System สมบูรณ์</li>
        <li>✅ Task 1.4: User Management สมบูรณ์</li>
        <li>📋 Week 2: Daily Sales System (ขั้นตอนต่อไป)</li>
      </ul>
    </div>
  </div>
</template>
