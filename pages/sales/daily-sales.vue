<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DailySalesEntry } from '~/composables/useDailySales'
import { useDailySales } from '~/composables/useDailySales'

// Require authentication to access this page
definePageMeta({
  middleware: 'auth'
})

// Setup
const logger = useLogger('DailySales')
const { 
  fetchSales, 
  fetchCashiers,
  createSales, 
  updateSales, 
  deleteSales, 
  sales, 
  loading, 
  error 
} = useDailySales()

// Modal state
const showModal = ref(false)
const editingEntry = ref<DailySalesEntry | null>(null)
const successMessage = ref('')
const submitError = ref('')

// Load sales on mount
onMounted(() => {
  fetchSales()
})

// Handle modal submit
const handleModalSubmit = async (entry: Omit<DailySalesEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
  submitError.value = ''
  try {
    if (editingEntry.value) {
      // Update
      const result = await updateSales(editingEntry.value.id!, entry)
      if (result.success) {
        successMessage.value = 'อัปเดตบันทึกยอดขายเรียบร้อย'
        editingEntry.value = null
        showModal.value = false
      } else {
        submitError.value = result.error || 'เกิดข้อผิดพลาดในการอัปเดต'
      }
    } else {
      // Create
      const result = await createSales(entry)
      if (result.success) {
        successMessage.value = 'บันทึกยอดขายเรียบร้อย'
        showModal.value = false
      } else {
        submitError.value = result.error || 'เกิดข้อผิดพลาดในการบันทึก'
      }
    }
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err: any) {
    submitError.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Error submitting entry', err)
  }
}

// Handle edit
const handleEdit = (entry: DailySalesEntry) => {
  editingEntry.value = entry
  showModal.value = true
}

// Handle delete
const handleDelete = async (id: string) => {
  if (confirm('คุณแน่ใจว่าต้องการลบบันทึกนี้?')) {
    const result = await deleteSales(id)
    if (result.success) {
      successMessage.value = 'ลบบันทึกเรียบร้อย'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      submitError.value = result.error || 'เกิดข้อผิดพลาดในการลบ'
    }
  }
}

// Handle modal close
const handleModalClose = () => {
  showModal.value = false
  editingEntry.value = null
  submitError.value = ''
}

// Open create modal
const openCreateModal = () => {
  editingEntry.value = null
  fetchCashiers() // Load cashiers when opening modal
  showModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">💰 บันทึกยอดขายรายวัน</h1>
        <p class="text-gray-600 mt-1">บันทึกและจัดการยอดขายรายวันจากแคชเชียร์</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
      >
        ➕ บันทึกใหม่
      </button>
    </div>

    <!-- Success Message -->
    <transition name="fade">
      <div
        v-if="successMessage"
        class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-start gap-3"
      >
        <span class="text-xl">✓</span>
        <div>
          <p class="font-semibold">สำเร็จ</p>
          <p class="text-sm">{{ successMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- Error Message -->
    <transition name="fade">
      <div
        v-if="submitError || error"
        class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-start gap-3"
      >
        <span class="text-xl">⚠️</span>
        <div>
          <p class="font-semibold">เกิดข้อผิดพลาด</p>
          <p class="text-sm">{{ submitError || error }}</p>
        </div>
      </div>
    </transition>

    <!-- Daily Sales Table -->
    <DailySalesTable
      :entries="sales"
      :loading="loading"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Modal -->
    <DailySalesModal
      :open="showModal"
      :editing-entry="editingEntry"
      @close="handleModalClose"
      @submit="handleModalSubmit"
    />
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
