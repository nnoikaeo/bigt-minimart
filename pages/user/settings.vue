<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">ตั้งค่า</h1>
    
    <!-- Placeholder Message -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-blue-900 mb-2">🔧 ฟีเจอร์กำลังพัฒนา</h2>
      <p class="text-blue-700">
        หน้าตั้งค่าผู้ใช้จะเพิ่มเข้ามาในเฟส Phase 3
      </p>
      <p class="text-sm text-blue-600 mt-2">
        ตอนนี้คุณสามารถกลับไปยัง
        <NuxtLink to="/" class="underline font-semibold hover:text-blue-900">
          แดชบอร์ด
        </NuxtLink>
      </p>
    </div>

    <!-- User Settings Form (Placeholder) -->
    <div class="mt-8 space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">⚙️ ตั้งค่าบัญชี</h3>
        <div class="space-y-4 opacity-50 pointer-events-none">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ภาษา</label>
            <select class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
              <option>ไทย</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">โซนเวลา</label>
            <select class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
              <option>Asia/Bangkok (UTC+7)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">🔐 ความปลอดภัย</h3>
        <div class="space-y-4 opacity-50 pointer-events-none">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg" disabled>
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">🔔 การแจ้งเตือน</h3>
        <div class="space-y-3 opacity-50 pointer-events-none">
          <div class="flex items-center gap-3">
            <input type="checkbox" id="email-notif" disabled />
            <label for="email-notif" class="text-gray-700">รับการแจ้งเตือนทางอีเมล</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// User Settings page
definePageMeta({
  middleware: 'auth'
})
</script>
