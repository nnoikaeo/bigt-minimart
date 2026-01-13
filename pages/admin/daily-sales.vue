<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import type { DailySalesEntry } from '~/composables/useDailySales'
import { useDailySales } from '~/composables/useDailySales'

// Require authentication to access this page
definePageMeta({
  middleware: 'auth'
})

// Setup
const logger = useLogger('DailySales')
const { fetchSales, createSales, updateSales, deleteSales, sales, loading, error } = useDailySales()
const showForm = ref(false)
const editingEntry = ref<DailySalesEntry | null>(null)
const formError = ref('')
const successMessage = ref('')

// Form data
const formData = reactive({
  date: '',
  amount: 0,
  notes: '',
})

// Thai month names for display
const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

// Format date for Thai display
const formatDateThai = (dateStr: string): string => {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = thaiMonths[date.getMonth()]
  const year = date.getFullYear() + 543 // Buddhist year
  return `${day} ${month} ${year}`
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount)
}

// Reset form
const resetForm = () => {
  formData.date = ''
  formData.amount = 0
  formData.notes = ''
  formError.value = ''
}

// Watch for editing entry changes and populate form
watch(editingEntry, (newEntry) => {
  if (newEntry) {
    formData.date = newEntry.date
    formData.amount = newEntry.amount
    formData.notes = newEntry.notes
  } else {
    resetForm()
  }
})

// Validate form
const validateForm = (): boolean => {
  formError.value = ''

  if (!formData.date) {
    formError.value = 'กรุณาเลือกวันที่'
    return false
  }

  if (formData.amount <= 0) {
    formError.value = 'กรุณาป้อนจำนวนเงินที่มากกว่า 0'
    return false
  }

  return true
}

// Handle form submit
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    if (editingEntry.value) {
      // Update entry
      const result = await updateSales(editingEntry.value.id!, {
        date: formData.date,
        amount: formData.amount,
        notes: formData.notes,
      })
      if (result.success) {
        showForm.value = false
        editingEntry.value = null
        resetForm()
        successMessage.value = 'อัปเดตข้อมูลยอดขายเรียบร้อย'
        setTimeout(() => { successMessage.value = '' }, 3000)
      } else {
        formError.value = result.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'
      }
    } else {
      // Create new entry
      const result = await createSales({
        date: formData.date,
        amount: formData.amount,
        notes: formData.notes,
      })
      if (result.success) {
        showForm.value = false
        resetForm()
        successMessage.value = 'บันทึกยอดขายเรียบร้อย'
        setTimeout(() => { successMessage.value = '' }, 3000)
      } else {
        formError.value = result.error || 'เกิดข้อผิดพลาดในการบันทึก'
      }
    }
  } catch (err: any) {
    formError.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Error submitting form', err)
  }
}

// Delete entry handler
const deleteEntryHandler = async (id: string) => {
  if (confirm('คุณแน่ใจหรือว่าต้องการลบข้อมูลนี้?')) {
    const result = await deleteSales(id)
    if (!result.success) {
      alert('เกิดข้อผิดพลาด: ' + result.error)
    } else {
      successMessage.value = 'ลบข้อมูลเรียบร้อย'
      setTimeout(() => { successMessage.value = '' }, 3000)
    }
  }
}

// Load sales on mount
onMounted(() => {
  fetchSales()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">
        บันทึกยอดขายรายวัน
      </h1>
      <button
        @click="showForm = true; editingEntry = null"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        + เพิ่มยอดขาย
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
      {{ successMessage }}
    </div>

    <!-- Sales List Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="px-6 py-12 text-center text-gray-500">
        <p>กำลังโหลดข้อมูล...</p>
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              วันที่
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              จำนวนเงิน
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              หมายเหตุ
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              การกระทำ
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="entry in sales" :key="entry.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-800">
              {{ formatDateThai(entry.date) }}
            </td>
            <td class="px-6 py-4 text-sm font-semibold text-gray-800">
              {{ formatCurrency(entry.amount) }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ entry.notes || '-' }}
            </td>
            <td class="px-6 py-4 text-sm space-x-2">
              <button
                @click="editingEntry = entry; showForm = true"
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                แก้ไข
              </button>
              <button
                @click="deleteEntryHandler(entry.id!)"
                class="text-red-600 hover:text-red-800 font-medium"
              >
                ลบ
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="!loading && sales.length === 0" class="px-6 py-12 text-center text-gray-500">
        <p>ยังไม่มีข้อมูลยอดขาย</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800">
          {{ editingEntry ? 'แก้ไขยอดขาย' : 'เพิ่มยอดขายใหม่' }}
        </h2>

        <!-- Error Message -->
        <div v-if="formError" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {{ formError }}
        </div>

        <!-- Form Fields -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Date Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              วันที่ <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Amount Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              จำนวนเงิน (บาท) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="formData.amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Notes Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              หมายเหตุ
            </label>
            <textarea
              v-model="formData.notes"
              rows="3"
              placeholder="บันทึกเพิ่มเติม (ไม่จำเป็น)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showForm = false; editingEntry = null"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              {{ editingEntry ? 'อัปเดต' : 'บันทึก' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modal overlay animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
