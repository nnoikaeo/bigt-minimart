<template>
  <ClientOnly>
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-primary mb-2">
          🏪 BigT Minimart
        </h1>
        <p class="text-gray-600">ระบบจัดการร้านมินิมาร์ท</p>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white py-8 px-6 shadow-md rounded-lg">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">
          เข้าสู่ระบบ
        </h2>

        <!-- Error Message -->
        <div 
          v-if="error" 
          class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="example@email.com"
              :disabled="isLoading"
            />
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="••••••••"
              :disabled="isLoading"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
          </button>
        </form>

        <!-- Demo Credentials (Development) -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500 mb-2">
            ✓ บัญชีสำหรับทดสอบ (ต้องสร้างจาก Setup ก่อน):
          </p>
          <div class="bg-gray-50 p-3 rounded text-xs space-y-1 text-gray-600">
            <p><strong>Owner:</strong> owner@example.com / password123</p>
            <p><strong>Manager:</strong> manager@example.com / password123</p>
            <p><strong>Cashier:</strong> test@example.com / password123</p>
            <p class="text-gray-400 mt-3 text-yellow-700">
              ⚠️ หากยังไม่มีบัญชีเหล่านี้ ให้กด 👇 เพื่อสร้าง
            </p>
          </div>
          
          <NuxtLink 
            to="/setup"
            class="block mt-3 text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded transition"
          >
            ⚙️ Setup Test Users
          </NuxtLink>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center text-sm text-gray-500">
        <p>&copy; 2026 BigT Minimart. All rights reserved.</p>
      </div>
    </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Setup
const router = useRouter()
const { login } = useAuth()

// Form state
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

// Handle login
const handleLogin = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const result = await login(email.value, password.value)
    
    if (result.success) {
      // Redirect to dashboard
      await router.push('/')
    } else {
      error.value = result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    }
  } catch (err: any) {
    error.value = 'เกิดข้อผิดพลาดที่ไม่คาดหวัง'
    console.error('Login error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Scoped styles if needed */
</style>
