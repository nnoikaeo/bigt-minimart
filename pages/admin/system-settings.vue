<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">ตั้งค่าระบบ</h1>
    
    <!-- Placeholder Message -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-blue-900 mb-2">⚙️ ฟีเจอร์กำลังพัฒนา</h2>
      <p class="text-blue-700">
        หน้าตั้งค่าระบบจะเพิ่มเข้ามาในเฟส Phase 3
      </p>
      <p class="text-sm text-blue-600 mt-2">
        ตอนนี้คุณสามารถกลับไปยัง
        <NuxtLink to="/" class="underline font-semibold hover:text-blue-900">
          แดชบอร์ด
        </NuxtLink>
      </p>
    </div>

    <!-- System Settings Form (Placeholder) -->
    <div class="mt-8 space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">🏪 ข้อมูลระบบ</h3>
        <div class="space-y-4 opacity-50 pointer-events-none">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">เวอร์ชันระบบ</label>
            <input type="text" placeholder="v1.2.0" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">การบำรุงรักษา</label>
            <input type="text" placeholder="ปิด" class="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">📊 การบันทึก</h3>
        <div class="space-y-4 opacity-50 pointer-events-none">
          <div class="flex items-center gap-3">
            <input type="checkbox" id="logs" disabled />
            <label for="logs" class="text-gray-700">เปิดใช้งานการบันทึกระบบ</label>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">🔐 ความปลอดภัย</h3>
        <div class="space-y-4 opacity-50 pointer-events-none">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg" disabled>
            ล้างหน้าแคช
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// System Settings page - placeholder for Phase 3
definePageMeta({
  middleware: 'auth'
})
</script>
