<script setup lang="ts">
// Require authentication to access this page
definePageMeta({
  middleware: 'auth'
})

import { ref, reactive, onMounted, watch } from 'vue'
import type { User, CreateUserInput, UpdateUserInput } from '~/types/user'

// Setup
const { fetchUsers, createUser, updateUser, deleteUser, users, loading } = useUser()
const showCreateForm = ref(false)
const editingUser = ref<User | null>(null)
const error = ref('')

// Form data
const formData = reactive({
  email: '',
  password: '',
  displayName: '',
  role: '',
  isActive: true,
})

// Reset form
const resetForm = () => {
  formData.email = ''
  formData.password = ''
  formData.displayName = ''
  formData.role = ''
  formData.isActive = true
  error.value = ''
}

// Watch for editing user changes and populate form
watch(editingUser, (newUser) => {
  if (newUser) {
    // Populate form with user data when editing
    formData.email = newUser.email
    formData.displayName = newUser.displayName
    formData.role = newUser.role
    formData.isActive = newUser.isActive
    formData.password = '' // Don't show password on edit
  } else {
    // Reset form when not editing
    resetForm()
  }
})

// Translate role to Thai
const translateRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    owner: 'เจ้าของร้าน',
    manager: 'ผู้จัดการร้าน',
    assistant_manager: 'ผู้ช่วยผู้จัดการ',
    cashier: 'แคชเชียร์',
    auditor: 'ผู้ตรวจสอบ',
  }
  return roleMap[role] || role
}

// Handle form submit
const handleSubmit = async () => {
  error.value = ''

  try {
    if (editingUser.value) {
      // Update user
      const updateInput: UpdateUserInput = {
        displayName: formData.displayName,
        role: formData.role as any,
        isActive: formData.isActive,
      }
      const result = await updateUser(editingUser.value.uid, updateInput)
      if (result.success) {
        showCreateForm.value = false
        editingUser.value = null
        resetForm()
      } else {
        error.value = result.error || 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้'
      }
    } else {
      // Create user
      if (!formData.password) {
        error.value = 'กรุณาป้อนรหัสผ่าน'
        return
      }
      const createInput: CreateUserInput = {
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        role: formData.role as any,
      }
      const result = await createUser(createInput)
      if (result.success) {
        showCreateForm.value = false
        resetForm()
      } else {
        error.value = result.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
      }
    }
  } catch (err: any) {
    error.value = err.message || 'เกิดข้อผิดพลาด'
  }
}

// Delete user handler
const deleteUserHandler = async (uid: string) => {
  if (confirm('คุณแน่ใจหรือว่าต้องการลบผู้ใช้งานนี้?')) {
    const result = await deleteUser(uid)
    if (!result.success) {
      alert('เกิดข้อผิดพลาด: ' + result.error)
    }
  }
}

// Load users on mount
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">
        จัดการผู้ใช้งาน
      </h1>
      <button
        @click="showCreateForm = true; editingUser = null"
        class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
      >
        + เพิ่มผู้ใช้งาน
      </button>
    </div>

    <!-- User List Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              ชื่อ
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              อีเมล
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              บทบาท
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              สถานะ
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              การกระทำ
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.uid" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-800">{{ user.displayName }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ user.email }}</td>
            <td class="px-6 py-4 text-sm">
              <span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {{ translateRole(user.role) }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <span 
                :class="user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                class="px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ user.isActive ? 'ใช้งาน' : 'ปิดใช้งาน' }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm space-x-2">
              <button
                @click="editingUser = user; showCreateForm = true"
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                แก้ไข
              </button>
              <button
                @click="deleteUserHandler(user.uid)"
                class="text-red-600 hover:text-red-800 font-medium"
              >
                ลบ
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="users.length === 0" class="px-6 py-12 text-center text-gray-500">
        <p>ไม่มีผู้ใช้งาน</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div 
      v-if="showCreateForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">
          {{ editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน' }}
        </h2>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Display Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ใช้
            </label>
            <input
              v-model="formData.displayName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>

          <!-- Email (disabled for edit) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              v-model="formData.email"
              type="email"
              :disabled="!!editingUser"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
              placeholder="example@email.com"
            />
          </div>

          <!-- Password (only for create) -->
          <div v-if="!editingUser">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              v-model="formData.password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
              minlength="6"
            />
          </div>

          <!-- Role -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              บทบาท
            </label>
            <select
              v-model="formData.role"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">เลือกบทบาท</option>
              <option value="owner">เจ้าของร้าน</option>
              <option value="manager">ผู้จัดการร้าน</option>
              <option value="assistant_manager">ผู้ช่วยผู้จัดการ</option>
              <option value="cashier">แคชเชียร์</option>
              <option value="auditor">ผู้ตรวจสอบ</option>
            </select>
          </div>

          <!-- Active Status (only for edit) -->
          <div v-if="editingUser" class="flex items-center">
            <input
              v-model="formData.isActive"
              type="checkbox"
              class="h-4 w-4 text-primary rounded"
            />
            <label class="ml-2 text-sm text-gray-700">
              ใช้งาน
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {{ error }}
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showCreateForm = false; editingUser = null; resetForm()"
              class="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
            >
              {{ loading ? 'กำลังบันทึก...' : 'บันทึก' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
