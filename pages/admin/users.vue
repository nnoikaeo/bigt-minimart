<script setup lang="ts">
// Require authentication to access this page
definePageMeta({
  middleware: 'auth'
})

import { ref, reactive, onMounted, watch, computed } from 'vue'
import type { User, CreateUserInput, UpdateUserInput } from '~/types/user'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS } from '~/types/permissions'
import type { DataTableColumn } from '~/components/ui/table/DataTable.vue'

// Setup
const { fetchUsers, createUser, updateUser, deleteUser, users, loading } = useUser()
const { can } = usePermissions()
const showCreateForm = ref(false)
const editingUser = ref<User | null>(null)
const error = ref('')

// Confirmation dialog state
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const deleteUserId = ref<string | null>(null)

// Form data
const formData = reactive({
  email: '',
  password: '',
  displayName: '',
  role: '',
  isActive: true,
})

// Role options for select
const roleOptions = [
  { label: 'เจ้าของร้าน', value: 'owner' },
  { label: 'ผู้จัดการร้าน', value: 'manager' },
  { label: 'ผู้ช่วยผู้จัดการ', value: 'assistant_manager' },
  { label: 'แคชเชียร์', value: 'cashier' },
  { label: 'ผู้ตรวจสอบ', value: 'auditor' },
]

// DataTable columns configuration
const columns: DataTableColumn[] = [
  { key: 'displayName', label: '👤 ชื่อ', sortable: true },
  { key: 'email', label: '📧 อีเมล', sortable: true },
  { key: 'role', label: '🔐 บทบาท', sortable: true },
  { key: 'isActive', label: '✓ สถานะ', sortable: true },
  { key: 'actions', label: '🎯 การกระทำ', sortable: false, align: 'center' },
]

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

// Check if current user can manage users
const canManageUsers = computed(() => can(PERMISSIONS.MANAGE_USERS))

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

// Handle delete user - show confirmation dialog
const handleDeleteClick = (uid: string) => {
  if (!canManageUsers.value) {
    error.value = 'คุณไม่มีสิทธิ์ลบผู้ใช้งาน'
    return
  }

  deleteUserId.value = uid
  confirmMessage.value = 'คุณแน่ใจหรือว่าต้องการลบผู้ใช้งานนี้?'
  showConfirmDialog.value = true
}

// Confirm delete action
const handleConfirmDelete = async () => {
  if (!deleteUserId.value) return

  const result = await deleteUser(deleteUserId.value)
  if (!result.success) {
    error.value = result.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน'
  }

  showConfirmDialog.value = false
  deleteUserId.value = null
}

// Handle modal close
const handleModalClose = () => {
  showCreateForm.value = false
  editingUser.value = null
  resetForm()
}

// Open create modal
const openCreateModal = () => {
  editingUser.value = null
  showCreateForm.value = true
}

// Load users on mount
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <PageWrapper
    title="จัดการผู้ใช้งาน"
    description="สร้าง แก้ไข และลบบัญชีผู้ใช้งาน"
    icon="👤"
    :loading="loading"
    :error="error"
  >
    <!-- Action button in header -->
    <template #actions>
      <ActionButton
        :permission="PERMISSIONS.MANAGE_USERS"
        variant="primary"
        @click="openCreateModal"
      >
        ✚ เพิ่ม
      </ActionButton>
    </template>

    <!-- DataTable -->
    <DataTable
      :data="users"
      :columns="columns"
      :loading="loading"
      row-key="uid"
      :pagination="true"
      :page-size="10"
      empty-message="ไม่มีผู้ใช้งาน"
    >
      <!-- Role cell with badge -->
      <template #cell-role="{ value }">
        <BaseBadge variant="default" size="sm">
          {{ translateRole(value) }}
        </BaseBadge>
      </template>

      <!-- Active status cell with badge -->
      <template #cell-isActive="{ value }">
        <BaseBadge :variant="value ? 'success' : 'error'" size="sm">
          {{ value ? '✓ ใช้งาน' : '✕ ปิดใช้งาน' }}
        </BaseBadge>
      </template>

      <!-- Actions slot for row buttons -->
      <template #actions="{ row }">
        <div class="flex gap-2 justify-center">
          <!-- Edit button -->
          <ActionButton
            :permission="PERMISSIONS.MANAGE_USERS"
            variant="ghost"
            size="sm"
            @click="editingUser = row; showCreateForm = true"
            title="แก้ไข"
          >
            ✏️
          </ActionButton>

          <!-- Delete button -->
          <ActionButton
            :permission="PERMISSIONS.MANAGE_USERS"
            variant="danger"
            size="sm"
            @click="handleDeleteClick(row.uid)"
            title="ลบ"
          >
            🗑️
          </ActionButton>
        </div>
      </template>
    </DataTable>
  </PageWrapper>

  <!-- Create/Edit Modal -->
  <BaseModal
    :open="showCreateForm"
    :title="editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'"
    size="md"
    @close="handleModalClose"
  >
    <!-- Modal content -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Display Name -->
      <FormField
        label="ชื่อผู้ใช้"
        :error="formData.displayName === '' && error ? 'กรุณาป้อนชื่อ' : ''"
        required
      >
        <BaseInput
          v-model="formData.displayName"
          type="text"
          placeholder="ชื่อ-นามสกุล"
        />
      </FormField>

      <!-- Email (disabled for edit) -->
      <FormField
        label="อีเมล"
        :error="formData.email === '' && error ? 'กรุณาป้อนอีเมล' : ''"
        required
      >
        <BaseInput
          v-model="formData.email"
          type="email"
          :disabled="!!editingUser"
          placeholder="example@email.com"
        />
      </FormField>

      <!-- Password (only for create) -->
      <FormField
        v-if="!editingUser"
        label="รหัสผ่าน"
        :error="formData.password === '' && error ? 'กรุณาป้อนรหัสผ่าน' : ''"
        hint="ต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
        required
      >
        <BaseInput
          v-model="formData.password"
          type="password"
          placeholder="••••••••"
        />
      </FormField>

      <!-- Role -->
      <FormField
        label="บทบาท"
        :error="formData.role === '' && error ? 'กรุณาเลือกบทบาท' : ''"
        required
      >
        <BaseSelect
          v-model="formData.role"
          :options="roleOptions"
          placeholder="เลือกบทบาท"
        />
      </FormField>

      <!-- Active Status (only for edit) -->
      <div v-if="editingUser" class="flex items-center gap-2">
        <input
          v-model="formData.isActive"
          type="checkbox"
          id="isActive"
          class="h-4 w-4 text-primary rounded"
        />
        <label for="isActive" class="text-sm text-gray-700">
          ใช้งาน
        </label>
      </div>

      <!-- Error Message -->
      <BaseAlert
        v-if="error"
        variant="error"
        :message="error"
        dismissible
      />

      <!-- Modal footer buttons -->
      <div class="flex gap-3 pt-4 border-t">
        <BaseButton
          type="button"
          variant="secondary"
          full-width
          @click="handleModalClose"
        >
          ยกเลิก
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          full-width
          :loading="loading"
        >
          {{ loading ? 'กำลังบันทึก...' : 'บันทึก' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>

  <!-- Confirmation dialog for delete -->
  <ConfirmDialog
    :open="showConfirmDialog"
    title="ยืนยันการลบ"
    :message="confirmMessage"
    confirm-text="ลบ"
    cancel-text="ยกเลิก"
    variant="danger"
    @confirm="handleConfirmDelete"
    @cancel="showConfirmDialog = false"
  />
</template>
